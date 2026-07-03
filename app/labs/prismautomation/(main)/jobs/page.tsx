"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import {
  Search, MapPin, Briefcase, Clock, ExternalLink,
  Loader2, ChevronLeft, ChevronRight, Code2, Globe,
  Building2, DollarSign, Flag, Star, ShieldCheck,
} from "lucide-react";
import { SmartSearchInput } from "@/components/ui/SmartSearchInput";

const ProfessionalJobLoader = ({ color = "indigo", message = "Querying Specialized Core..." }: { color?: string, message?: string }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 96) return 96;
        const diff = Math.random() * 6;
        return Math.min(oldProgress + diff, 96);
      });
    }, 1200); 

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8 w-full max-w-sm mx-auto">
      <div className="relative">
        <div className={`absolute -inset-4 bg-${color}-100/50 rounded-full blur-xl animate-pulse`} />
        <div className="relative flex items-center justify-center bg-white rounded-full p-4 shadow-xl border border-gray-100">
          <Loader2 className={`w-10 h-10 animate-spin text-${color}-600`} />
        </div>
      </div>
      
      <div className="w-full space-y-4 text-center">
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.25em]">Deep AI Indexing</h3>
          <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed px-4">
            {message} <br/> 
            <span className={`text-[9px] text-${color}-500/80 font-black uppercase tracking-widest mt-1.5 block`}>Est. Wait time: ~20 seconds for deep scan</span>
          </p>
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className={`h-full bg-${color}-500 rounded-full`} 
          />
        </div>
        
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Syncing Nodes</span>
          <span className={`text-[9px] font-black text-${color}-600 uppercase tracking-widest`}>{Math.round(progress)}%</span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Analyzing Market</span>
        </div>
      </div>
    </div>
  );
};

// ─── Source config ──────────────────────────────────────────────────────────

type Source = 'dice' | 'adzuna' | 'jsearch' | 'serper' | 'linkedin' | 'dice_direct';

const SOURCES: { key: Source; label: string; badge: string; color: string; accentClass: string; hoverBorder: string; description: string }[] = [
  { key: 'linkedin',label: 'LinkedIn Direct',   badge: 'Real-Time',     color: 'sky',     accentClass: 'bg-blue-700 text-white',     hoverBorder: 'hover:border-blue-400',   description: 'Live individual job postings (Past 24h/Week)' },
  { key: 'dice_direct', label: 'Dice Quick-Sync', badge: 'High-Speed',   color: 'teal',    accentClass: 'bg-teal-600 text-white',    hoverBorder: 'hover:border-teal-300',   description: 'Direct site synchronization (Ultra-fast)' },
  // { key: 'dice', label: 'Tech Specialized', badge: 'Software/IT', color: 'indigo', accentClass: 'bg-indigo-600 text-white', hoverBorder: 'hover:border-indigo-300', description: 'Deep-tech & engineering focused roles' },
  { key: 'adzuna',  label: 'Global Market',       badge: 'Universal',     color: 'purple',  accentClass: 'bg-purple-600 text-white',  hoverBorder: 'hover:border-purple-300', description: 'Mass-market openings across all sectors' },
  { key: 'jsearch', label: 'Premium Network',   badge: 'Executive+',    color: 'blue',    accentClass: 'bg-blue-600 text-white',    hoverBorder: 'hover:border-blue-300',   description: 'Enterprise & specialized business hubs' },
  { key: 'serper',  label: 'AI Aggregate',        badge: 'Smart Index',   color: 'rose',    accentClass: 'bg-rose-600 text-white',    hoverBorder: 'hover:border-rose-300',   description: 'Intelligent multi-board vacancy crawler' },
];

// ─── Sectors (Adzuna + JSearch) ─────────────────────────────────────────────

const SECTORS = [
  { key: 'all',         label: '🌐 All' },
  { key: 'tech',        label: '💻 Tech / IT' },
  { key: 'healthcare',  label: '🏥 Healthcare' },
  { key: 'finance',     label: '🏦 Finance' },
  { key: 'insurance',   label: '🛡️ Insurance' },
  { key: 'retail',      label: '🛒 Retail' },
  { key: 'telecom',     label: '📡 Telecom' },
  { key: 'engineering', label: '⚙️ Engineering' },
  { key: 'sales',       label: '📈 Sales' },
];


// ─── Date filter options per source ─────────────────────────────────────────

const DATE_OPTIONS = [
  { value: '',   label: 'No Preference' },
  { value: '1',  label: 'Today' },
  { value: '2',  label: 'Last 2 days' },
  { value: '3',  label: 'Last 3 days' },
  { value: '7',  label: 'Last 7 days' },
  { value: '10', label: 'Last 10 days' },
  { value: '15', label: 'Last 15 days' },
  { value: '30', label: 'Last 30 days' },
];

// What each system actually supports
const DATE_NOTES: Record<string, string> = {
  linkedin: 'Real-time sync: past 24h · past 7d snapshots',
  dice:    'Historical depth: 1d · 3d · 7d intervals',
  adzuna:  'Full chronological search supported',
  jsearch: 'Optimal tracking: today · 3d · 7d · 30d windows',
  serper:  'Indexing frequency: 1d · 7d · 30d snapshots',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (diff < 1) return 'Just now';
  if (diff < 24) return `${diff}h ago`;
  const days = Math.floor(diff / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

function initials(name: string): string {
  return (name || 'CO').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min) return null;
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  return max ? `${fmt(min)} – ${fmt(max)}` : `${fmt(min)}+`;
}

function sanitizeLabel(label: string): string {
  if (!label) return label;
  return label
    .replace(/jsearch/gi, 'Premium Network')
    .replace(/adzuna/gi, 'Global Market')
    .replace(/google jobs/gi, 'AI Aggregate')
    .replace(/dice\.com/gi, 'Tech Specialized')
    .replace(/dice/gi, 'Tech Specialized');
}

// ─── Badge pill ─────────────────────────────────────────────────────────────

function Pill({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    gray:   'bg-gray-100 text-gray-600 border-gray-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    rose:   'bg-rose-50 text-rose-700 border-rose-200',
    red:    'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${map[color] || map.gray}`}>
      {children}
    </span>
  );
}

// ─── Dice Card ──────────────────────────────────────────────────────────────

interface DiceJob {
  guid: string; title: string; companyName: string; companyLogoUrl?: string;
  summary?: string; salary?: string; employmentType?: string;
  workplaceTypes?: string[]; isRemote?: boolean; easyApply?: boolean;
  willingToSponsor?: boolean; postedDate?: string; detailsPageUrl: string;
  jobLocation?: { displayName: string } | null;
}

function DiceCard({ job }: { job: DiceJob }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all group hover:border-indigo-300`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {job.companyLogoUrl && !imgErr ? (
            <img src={job.companyLogoUrl} alt={job.companyName} onError={() => setImgErr(true)}
              className="w-10 h-10 rounded-lg border border-gray-100 object-contain bg-white" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
              {initials(job.companyName)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{job.companyName}</p>
          {job.jobLocation?.displayName && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{job.jobLocation.displayName}</p>}
          <div className="flex flex-wrap gap-1 mt-2">
            {(job.isRemote || job.workplaceTypes?.includes('Remote')) && <Pill color="green">Remote</Pill>}
            {job.workplaceTypes?.includes('Hybrid') && <Pill color="blue">Hybrid</Pill>}
            {job.employmentType && <Pill color="gray">{job.employmentType}</Pill>}
            {job.easyApply && <Pill color="amber">Easy Apply</Pill>}
            {job.willingToSponsor && <Pill color="indigo">Visa Sponsor</Pill>}
          </div>
          {job.salary && <p className="text-xs font-medium text-gray-700 mt-2 flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-500" />{job.salary}</p>}
          {job.summary && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.summary}</p>}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.postedDate)}</span>
            <a href={job.detailsPageUrl} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              View job <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Adzuna Card ────────────────────────────────────────────────────────────

interface AdzunaJob {
  id: string; title: string; company: string; location: string;
  description?: string; salary_min?: number; salary_max?: number;
  salary_is_predicted?: number; contract_type?: string; contract_time?: string;
  created?: string; redirect_url: string; category?: string;
}

function AdzunaCard({ job }: { job: AdzunaJob }) {
  const salary = formatSalary(job.salary_min, job.salary_max);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all group">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm flex-shrink-0">
          {initials(job.company)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{job.location}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {job.contract_time === 'full_time' && <Pill color="gray">Full-time</Pill>}
            {job.contract_time === 'part_time' && <Pill color="gray">Part-time</Pill>}
            {job.contract_type === 'contract' && <Pill color="orange">Contract</Pill>}
            {job.category && <Pill color="purple">{job.category}</Pill>}
            {salary && <Pill color="green">{salary}{job.salary_is_predicted === 1 ? ' (est.)' : ''}</Pill>}
          </div>
          {job.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.description}</p>}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.created)}</span>
            <a href={job.redirect_url} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Apply Now <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── JSearch Card ───────────────────────────────────────────────────────────

interface JSearchJob {
  job_id: string; job_title: string; employer_name: string;
  employer_logo?: string; job_city?: string; job_state?: string;
  job_country?: string; job_description?: string;
  job_employment_type?: string; job_is_remote?: boolean;
  job_min_salary?: number; job_max_salary?: number; job_salary_currency?: string;
  job_posted_at_datetime_utc?: string; job_apply_link?: string; job_publisher?: string;
}

function JSearchCard({ job }: { job: JSearchJob }) {
  const [imgErr, setImgErr] = useState(false);
  const salary = formatSalary(job.job_min_salary, job.job_max_salary);
  const location = [job.job_city, job.job_state].filter(Boolean).join(', ') || job.job_country || 'USA';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {job.employer_logo && !imgErr ? (
            <img src={job.employer_logo} alt={job.employer_name} onError={() => setImgErr(true)}
              className="w-10 h-10 rounded-lg border border-gray-100 object-contain bg-white" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
              {initials(job.employer_name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{job.job_title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{job.employer_name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{location}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {job.job_is_remote && <Pill color="green">Remote</Pill>}
            {job.job_employment_type && <Pill color="gray">{job.job_employment_type.replace('_', ' ')}</Pill>}
            {job.job_publisher && <Pill color="blue">{sanitizeLabel(job.job_publisher)}</Pill>}
            {salary && <Pill color="green">{salary}</Pill>}
          </div>
          {job.job_description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.job_description}</p>}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.job_posted_at_datetime_utc)}</span>
            {job.job_apply_link && (
              <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Apply Directly <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Serper Card ────────────────────────────────────────────────────────────

interface SerperJob {
  id: string; title: string; company: string; location: string;
  description?: string; employmentType?: string; salary?: string;
  postedAt?: string; applyUrl?: string; source?: string;
  highlights?: string[]; extensions?: string[];
}

function SerperCard({ job }: { job: SerperJob }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-rose-300 hover:shadow-sm transition-all group">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-semibold text-sm flex-shrink-0">
          {initials(job.company)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</p>
          {job.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{job.location}</p>}
          <div className="flex flex-wrap gap-1 mt-2">
            {job.source && <Pill color="rose">{sanitizeLabel(job.source)}</Pill>}
            {job.employmentType && <Pill color="gray">{job.employmentType}</Pill>}
            {job.salary && <Pill color="green">{job.salary}</Pill>}
          </div>
          {/* Extensions from Google Jobs (highlights, benefits, etc.) */}
          {job.extensions && job.extensions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {job.extensions.slice(0, 3).map((ext, i) => (
                <span key={i} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{ext}</span>
              ))}
            </div>
          )}
          {job.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.description}</p>}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Star className="w-3 h-3 text-rose-300" /> AI Aggregate
              {job.postedAt && <span className="ml-1">· {job.postedAt}</span>}
            </span>
            {job.applyUrl && (
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Apply Now <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LinkedIn Card ────────────────────────────────────────────────────────
interface LinkedInJob {
  id: string; title: string; company: string; location: string;
  description?: string; postedAt?: string; applyUrl: string; source: string;
  isRemote?: boolean;
}

function LinkedInCard({ job }: { job: LinkedInJob }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition-all group">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
          in
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-sm text-gray-900 truncate leading-tight">{job.title}</h3>
            {job.isRemote && <Pill color="green">Remote</Pill>}
          </div>
          <p className="text-xs text-blue-700 font-bold mt-1.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />{job.company}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-medium">
            <MapPin className="w-3 h-3" />{job.location}
          </p>
          
          <div className="flex flex-wrap gap-1.5 mt-3">
             <Pill color="blue">Verified Direct</Pill>
             <Pill color="indigo">Active Recruitment</Pill>
          </div>

          <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-3">
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-tighter flex items-center gap-1">
              <Clock className="w-3 h-3" /> {job.postedAt || 'Recently'}
            </span>
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
              className="text-[11px] bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-all font-bold shadow-sm">
              Apply on LinkedIn <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPrev, onNext, color = 'indigo' }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void; color?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-4 pb-2">
      <button onClick={onPrev} disabled={page <= 1}
        className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </button>
      <span className={`text-xs text-${color}-600 font-medium`}>{page} / {totalPages}</span>
      <button onClick={onNext} disabled={page >= totalPages}
        className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
        Next <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Empty / error states ────────────────────────────────────────────────────

function EmptyState({ icon: Icon, searched, error, color = 'gray', title, subtitle }: {
  icon: React.ElementType; searched: boolean; error?: string | null;
  color?: string; title: string; subtitle: string;
}) {
  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-xs mb-3">{error}</div>
  );
  if (!searched) return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-300">
      <Icon className="w-8 h-8" />
      <p className="text-sm font-medium text-gray-400">{title}</p>
      <p className="text-xs text-gray-300">{subtitle}</p>
    </div>
  );
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-2 text-${color}-300`}>
      <Briefcase className="w-8 h-8" />
      <p className="text-sm font-medium text-gray-400">No jobs found</p>
      <p className="text-xs text-gray-300">Try different keywords or filters</p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [activeSource, setActiveSource] = useState<Source>('linkedin');
  const [userFilters, setUserFilters] = useState<{ excludedTypes: string[] }>({ excludedTypes: [] });

  const { profile, isLoaded: isProfileLoaded } = useProfile();
  const [isFiltersLoaded, setIsFiltersLoaded] = useState(false);
  const hasAutoLoaded = useRef(false);

  // Fetch filters on mount
  useEffect(() => {
    fetch('/labs/prismautomation/api/user/filters')
      .then(res => res.json())
      .then(data => {
        setUserFilters(data);
        setIsFiltersLoaded(true);
      })
      .catch(err => {
        console.error('Error fetching user filters:', err);
        setIsFiltersLoaded(true); // Proceed anyway to avoid hanging
      });
  }, []);

  // ── LinkedIn ────────────────────────────────────────────────────────────
  const [lKw, setLKw]         = useState('');
  const [lLoc, setLLoc]       = useState('United States');
  const [lJobs, setLJobs]     = useState<LinkedInJob[]>([]);
  const [lLoading, setLLoading] = useState(false);
  const [lLoadingMore, setLLoadingMore] = useState(false);
  const [lError, setLError]   = useState<string | null>(null);
  const [lSearched, setLSearched] = useState(false);
  const [lDays, setLDays]         = useState('');
  const [lStart, setLStart]       = useState(0);
  const [lJobType, setLJobType]   = useState('');

  // ── Dice Direct (QuickSync) ─────────────────────────────────────────────
  const [dKw, setDKw]           = useState('');
  const [dLoc, setDLoc]         = useState('');
  const [dJobs, setDJobs]       = useState<DiceJob[]>([]);
  const [dLoading, setDLoading] = useState(false);
  const [dError, setDError]     = useState<string | null>(null);
  const [dSearched, setDSearched] = useState(false);
  const [dDays, setDDays]       = useState('');
  const [dPage, setDPage]       = useState(1);
  const [dMeta, setDMeta]       = useState<{ currentPage: number; totalPages: number; totalResults: number } | null>(null);
  const [dEt, setDEt]           = useState<string[]>([]);
  const [dWp, setDWp]           = useState<string[]>([]);
  const [dEmpt, setDEmpt]       = useState<string[]>([]); // Employer Type
  const [dEasy, setDEasy]       = useState(false);
  const [dSponsor, setDSponsor] = useState(false);

  // ── Dice ────────────────────────────────────────────────────────────────
  const [diceKw, setDiceKw]           = useState('');
  const [diceLoc, setDiceLoc]         = useState('');
  const [diceWp, setDiceWp]           = useState('');
  const [diceEt, setDiceEt]           = useState('');
  const [diceJobs, setDiceJobs]       = useState<DiceJob[]>([]);
  const [diceMeta, setDiceMeta]       = useState<{ currentPage: number; pageCount: number; totalResults: number } | null>(null);
  const [diceLoading, setDiceLoading] = useState(false);
  const [diceError, setDiceError]     = useState<string | null>(null);
  const [diceSearched, setDiceSearched] = useState(false);
  const [diceDays, setDiceDays]   = useState('1');

  // ── Adzuna ──────────────────────────────────────────────────────────────
  const [aKw, setAKw]         = useState('');
  const [aSector, setASector] = useState('all');
  const [aLoc, setALoc]       = useState('');
  const [aEt, setAEt]         = useState('');
  const [aPage, setAPage]     = useState(1);
  const [aJobs, setAJobs]     = useState<AdzunaJob[]>([]);
  const [aTotal, setATotal]   = useState(0);
  const [aLoading, setALoading] = useState(false);
  const [aError, setAError]   = useState<string | null>(null);
  const [aSearched, setASearched] = useState(false);
  const [aDays, setADays]         = useState('1');

  // ── JSearch ─────────────────────────────────────────────────────────────
  const [jKw, setJKw]         = useState('');
  const [jSector, setJSector] = useState('all');
  const [jLoc, setJLoc]       = useState('');
  const [jEt, setJEt]         = useState('');
  const [jPage, setJPage]     = useState(1);
  const [jJobs, setJJobs]     = useState<JSearchJob[]>([]);
  const [jLoading, setJLoading] = useState(false);
  const [jError, setJError]   = useState<string | null>(null);
  const [jSearched, setJSearched] = useState(false);
  const [jDays, setJDays]         = useState('1');

  // ── Serper ──────────────────────────────────────────────────────────────
  const [sKw, setSKw]         = useState('');
  const [sLoc, setSLoc]       = useState('');
  const [sEt, setSEt]         = useState('');
  const [sDr, setSDr]         = useState('today');
  const [sPage, setSPage]     = useState(1);
  const [sJobs, setSJobs]     = useState<SerperJob[]>([]);
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError]   = useState<string | null>(null);
  const [sSearched, setSSearched] = useState(false);
  const [sDays, setSDays]         = useState('1');

  const searchDiceDirect = useCallback(async (page = 1) => {
    if (!dKw.trim()) return;
    setDLoading(true); setDError(null); setDPage(page);
    try {
      const body = { 
        keyword: dKw, location: dLoc, posted_days: dDays, page,
        employment_types: dEt, workplace_types: dWp, employer_types: dEmpt,
        easy_apply: dEasy, willing_to_sponsor: dSponsor
      };
      const res = await fetch('/labs/prismautomation/api/jobs/dice', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'QuickSync failed');
      setDJobs(data.jobs || []);
      setDMeta(data.meta || null);
      setDSearched(true);
    } catch (e: any) { 
      setDError(e.message || 'Error syncing with Dice'); 
    } finally { 
      setDLoading(false); 
    }
  }, [dKw, dLoc, dDays, dEt, dWp, dEmpt, dEasy, dSponsor]);

  // ── Search functions ─────────────────────────────────────────────────────

  const searchLinkedIn = useCallback(async (isLoadMore = false) => {
    if (!lKw.trim()) return;
    
    if (isLoadMore) setLLoadingMore(true);
    else { setLLoading(true); setLStart(0); }
    
    setLError(null);
    const currentStart = isLoadMore ? lStart + 50 : 0;
    const lastJobId = (isLoadMore && lJobs.length > 0) ? lJobs[lJobs.length - 1].id : null;

    try {
      const res = await fetch('/labs/prismautomation/api/jobs/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: lKw, 
          location: lLoc, 
          posted_days: lDays, 
          start: currentStart,
          currentJobId: lastJobId,
          job_type: lJobType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'LinkedIn fetch failed');
      
      if (isLoadMore) {
        setLJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newUniqueJobs = (data.jobs || []).filter((j: any) => !existingIds.has(j.id));
          return [...prev, ...newUniqueJobs];
        });
        setLStart(currentStart);
      } else {
        setLJobs(data.jobs || []);
        setLSearched(true);
      }
    } catch (e: any) {
      setLError(e.message || 'Error');
    } finally {
      setLLoading(false);
      setLLoadingMore(false);
    }
  }, [lKw, lLoc, lDays, lStart, lJobType, lJobs]);

  // ── AUTO-LOAD LOGIC ───────────────────────────────────────────────────
  useEffect(() => {
    // Only auto-load if:
    // 1. Profile is loaded
    // 2. Filters are loaded (to respect exclusions)
    // 3. We haven't auto-loaded yet
    // 4. There is a role to search for
    if (isProfileLoaded && isFiltersLoaded && !hasAutoLoaded.current) {
      console.log('[Jobs Auto-Load] Checking state:', { role: profile?.role, isProfileLoaded, isFiltersLoaded });
      
      if (profile?.role) {
        hasAutoLoaded.current = true;
        const initialRole = profile?.role;
      
      // Pre-fill keywords for all providers
      setLKw(initialRole);
      setDKw(initialRole);
      setDiceKw(initialRole);
      setAKw(initialRole);
      setJKw(initialRole);
      setSKw(initialRole);

      // Trigger the primary search (LinkedIn)
      // We pass the role directly because the state update might not have flushed yet
      const triggerInitialSearch = async () => {
        setLLoading(true);
        setLError(null);
        try {
          const res = await fetch('/labs/prismautomation/api/jobs/linkedin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              keyword: initialRole, 
              location: lLoc, 
              posted_days: lDays, 
              start: 0,
              job_type: lJobType
            })
          });
          const data = await res.json();
          if (res.ok) {
            setLJobs(data.jobs || []);
            setLSearched(true);
          }
        } catch (e) {
          console.error('Auto-load search failed', e);
        } finally {
          setLLoading(false);
        }
      };

      triggerInitialSearch();
      }
    }
  }, [isProfileLoaded, isFiltersLoaded, profile?.role, lLoc, lDays, lJobType]);

  const searchDice = useCallback(async (page = 1) => {
    if (!diceKw.trim()) return;
    setDiceLoading(true); setDiceError(null);
    try {
      const body: Record<string, unknown> = { keyword: diceKw, jobs_per_page: 10, page_number: page, posted_days: diceDays };
      if (diceLoc) body.location = diceLoc;
      if (diceWp)  body.workplace_types  = [diceWp];
      if (diceEt)  body.employment_types = [diceEt];
      const res  = await fetch('/labs/prismautomation/api/jobs/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setDiceJobs(data.data || []); setDiceMeta(data.meta || null); setDiceSearched(true);
    } catch (e: unknown) { setDiceError(e instanceof Error ? e.message : 'Error'); }
    finally { setDiceLoading(false); }
  }, [diceKw, diceLoc, diceWp, diceEt, diceDays]);

  const searchAdzuna = useCallback(async (page = 1) => {
    setALoading(true); setAError(null); setAPage(page);
    try {
      const res  = await fetch('/labs/prismautomation/api/jobs/adzuna', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: aKw, sector: aSector, location: aLoc, employment_type: aEt, page, results_per_page: 10, posted_days: aDays }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setAJobs(data.jobs || []); setATotal(data.total || 0); setASearched(true);
    } catch (e: unknown) { setAError(e instanceof Error ? e.message : 'Error'); }
    finally { setALoading(false); }
  }, [aKw, aSector, aLoc, aEt, aDays]);

  const searchJSearch = useCallback(async (page = 1) => {
    setJLoading(true); setJError(null); setJPage(page);
    try {
      const res  = await fetch('/labs/prismautomation/api/jobs/jsearch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: jKw, sector: jSector, location: jLoc, employment_type: jEt, page, posted_days: jDays }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setJJobs(data.jobs || []); setJSearched(true);
    } catch (e: unknown) { setJError(e instanceof Error ? e.message : 'Error'); }
    finally { setJLoading(false); }
  }, [jKw, jSector, jEt, jDays]);

  const searchSerper = useCallback(async (page = 1) => {
    if (!sKw.trim()) return;
    setSLoading(true); setSError(null); setSPage(page);
    try {
      const res  = await fetch('/labs/prismautomation/api/jobs/serper', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: sKw, location: sLoc, employment_type: sEt, posted_days: sDays, page }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSJobs(data.jobs || []); setSSearched(true);
    } catch (e: unknown) { setSError(e instanceof Error ? e.message : 'Error'); }
    finally { setSLoading(false); }
  }, [sKw, sLoc, sEt, sDays]);

  // ── LAZY TAB AUTO-LOAD ──────────────────────────────────────────────────
  useEffect(() => {
    // Only lazy-load if profile and filters are ready
    if (!isProfileLoaded || !isFiltersLoaded) return;

    // Trigger search for the active tab if it hasn't been searched yet
    const lazyTrigger = async () => {
        if (activeSource === 'dice_direct' && !dSearched && dKw.trim()) {
            searchDiceDirect(1);
        } else if (activeSource === 'adzuna' && !aSearched && aKw.trim()) {
            searchAdzuna(1);
        } else if (activeSource === 'jsearch' && !jSearched && jKw.trim()) {
            searchJSearch(1);
        } else if (activeSource === 'serper' && !sSearched && sKw.trim()) {
            searchSerper(1);
        } else if (activeSource === 'dice' && !diceSearched && diceKw.trim()) {
            searchDice(1);
        }
    };

    lazyTrigger();
  }, [activeSource, isProfileLoaded, isFiltersLoaded, dSearched, aSearched, jSearched, sSearched, diceSearched, dKw, aKw, jKw, sKw, diceKw, searchDiceDirect, searchAdzuna, searchJSearch, searchSerper, searchDice]);



  // ── Derived ──────────────────────────────────────────────────────────────
  const aTotalPages = Math.min(Math.ceil(aTotal / 10), 20);


  const currentSrc = SOURCES.find(s => s.key === activeSource) ?? SOURCES[0];


  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Find Jobs</h2>
            <span className="text-[10px] text-gray-400 font-medium">— All USA · {currentSrc.description}</span>
          </div>
          
          <a
            href="/labs/prismautomation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-gray-100 hover:border-indigo-100 shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </a>
        </div>

        {/* ── Source tabs ── */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {SOURCES.map(src => (
            <button key={src.key} onClick={() => setActiveSource(src.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSource === src.key ? src.accentClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {src.key === 'dice'    && <Code2 className="w-3.5 h-3.5" />}
              {src.key === 'adzuna'  && <Globe className="w-3.5 h-3.5" />}
              {src.key === 'jsearch' && <Search className="w-3.5 h-3.5" />}
              {src.key === 'serper'  && <Star className="w-3.5 h-3.5" />}
              {src.key === 'linkedin' && <Building2 className="w-3.5 h-3.5" />}

              {src.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeSource === src.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {src.badge}
              </span>
            </button>
          ))}
        </div>

        {/* ── LinkedIn Filters ── */}
        {activeSource === 'linkedin' && (
          <div className="flex gap-2">
            <SmartSearchInput 
              placeholder="Java Developer, UX Designer..." 
              value={lKw} 
              onChange={setLKw} 
              onKeyDown={e => e.key === 'Enter' && searchLinkedIn()}
            />
            <div className="relative w-48">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input 
                placeholder="United States" 
                value={lLoc} 
                onChange={e => setLLoc(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && searchLinkedIn()}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" 
              />
            </div>
            <select 
              value={lJobType} 
              onChange={e => setLJobType(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none text-blue-600 font-bold"
            >
              <option value="">Job Type</option>
              {!userFilters.excludedTypes.includes('full-time') && <option value="full-time">Full-time</option>}
              {!userFilters.excludedTypes.includes('contract') && <option value="contract">Contract</option>}
              {!userFilters.excludedTypes.includes('part-time') && <option value="part-time">Part-time</option>}
              {!userFilters.excludedTypes.includes('internship') && <option value="internship">Internship</option>}
              {!userFilters.excludedTypes.includes('temporary') && <option value="temporary">Temporary</option>}
              {!userFilters.excludedTypes.includes('volunteer') && <option value="volunteer">Volunteer</option>}
            </select>
            <select 
              value={lDays} 
              onChange={e => setLDays(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none text-gray-600 font-bold"
            >
              <option value="">Any Time</option>
              <option value="1">Past 24h</option>
              <option value="7">Past Week</option>
              <option value="30">Past Month</option>
            </select>
            <button 
              onClick={() => searchLinkedIn()} 
              disabled={lLoading || !lKw.trim()}
              className="px-6 py-2 text-xs font-black bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-sm uppercase tracking-wider"
            >
              {lLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Live Search
            </button>
          </div>
        )}

        {/* ── Dice Direct Filters ── */}
        {activeSource === 'dice_direct' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <SmartSearchInput 
                placeholder="Software Engineer, Project Manager..." 
                value={dKw} 
                onChange={setDKw} 
                onKeyDown={e => e.key === 'Enter' && searchDiceDirect(1)}
              />
              <div className="relative w-48">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  placeholder="Location (City, State)" 
                  value={dLoc} 
                  onChange={e => setDLoc(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && searchDiceDirect(1)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500" 
                />
              </div>
              <button 
                onClick={() => searchDiceDirect(1)} 
                disabled={dLoading || !dKw.trim()}
                className="px-6 py-2 text-xs font-black bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 shadow-sm uppercase tracking-wider"
              >
                {dLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />} Sync Now
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select value={dDays} onChange={e => setDDays(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none text-gray-600 font-bold">
                {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <div className="h-4 w-[1px] bg-gray-200 mx-1" />

              {/* Multi-select logic simplified for demonstration as individual buttons */}
              {[
                { label: 'Full-Time', id: 'full-time' },
                { label: 'Contract', id: 'contract' },
                { label: 'Part-Time', id: 'part-time' }
              ].map(t => {
                if (userFilters.excludedTypes.includes(t.id)) return null;
                const dv = t.id === 'contract' ? 'CONTRACTS' : t.id.toUpperCase().replace('-', '');
                return (
                  <button key={t.id} onClick={() => setDEt(prev => prev.includes(dv) ? prev.filter(x => x !== dv) : [...prev, dv])}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-bold ${dEt.includes(dv) ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-white text-gray-400 border-gray-200'}`}>
                    {t.label}
                  </button>
                );
              })}

              <div className="h-4 w-[1px] bg-gray-200 mx-1" />

              {['Remote', 'Hybrid', 'On-Site'].map(w => {
                const wv = w === 'On-Site' ? 'On-site' : w;
                return (
                  <button key={w} onClick={() => setDWp(prev => prev.includes(wv) ? prev.filter(x => x !== wv) : [...prev, wv])}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-bold ${dWp.includes(wv) ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-400 border-gray-200'}`}>
                    {w}
                  </button>
                );
              })}

              <div className="h-4 w-[1px] bg-gray-200 mx-1" />

              {['Direct Hire', 'Recruiter'].map(e => (
                <button key={e} onClick={() => setDEmpt(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-bold ${dEmpt.includes(e) ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white text-gray-400 border-gray-200'}`}>
                  {e}
                </button>
              ))}

              <div className="ml-auto flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" checked={dEasy} onChange={e => setDEasy(e.target.checked)} className="w-3.5 h-3.5 accent-teal-600" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-teal-600 transition-colors uppercase tracking-tight">Easy Apply</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" checked={dSponsor} onChange={e => setDSponsor(e.target.checked)} className="w-3.5 h-3.5 accent-teal-600" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-teal-600 transition-colors uppercase tracking-tight">Visa Sponsor</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── Dice filters ── */}
        {activeSource === 'dice' && (
          <>
            <div className="flex gap-2 mb-2">
              <SmartSearchInput 
                placeholder="Job title or keyword..." 
                value={diceKw} 
                onChange={setDiceKw} 
                onKeyDown={e => e.key === 'Enter' && searchDice(1)}
              />
              <div className="relative w-32">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input placeholder="Location" value={diceLoc} onChange={e => setDiceLoc(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchDice(1)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500" />
              </div>
              <button onClick={() => searchDice(1)} disabled={diceLoading || !diceKw.trim()}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
                {diceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['', 'Remote', 'Hybrid', 'On-Site'].map(w => (
                <button key={w} onClick={() => setDiceWp(w)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${diceWp === w ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200'}`}>
                  {w || 'Any workplace'}
                </button>
              ))}
              <select value={diceEt} onChange={e => setDiceEt(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none text-gray-600">
                <option value="">All types</option>
                {!userFilters.excludedTypes.includes('full-time') && <option value="FULLTIME">Full-time</option>}
                {!userFilters.excludedTypes.includes('contract') && <option value="CONTRACTS">Contract</option>}
                {!userFilters.excludedTypes.includes('part-time') && <option value="PARTTIME">Part-time</option>}
                <option value="THIRD_PARTY">Third Party</option>
              </select>
              <select value={diceDays} onChange={e => setDiceDays(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none text-gray-600">
                {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{DATE_NOTES.dice}</p>
          </>
        )}

        {/* ── Adzuna filters ── */}
        {activeSource === 'adzuna' && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SECTORS.map(s => (
                <button key={s.key} onClick={() => setASector(s.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${aSector === s.key ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <SmartSearchInput 
                placeholder="Job title, skill..." 
                value={aKw} 
                onChange={setAKw} 
                onKeyDown={e => e.key === 'Enter' && searchAdzuna(1)}
              />
              <div className="relative w-32">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input placeholder="City, State" value={aLoc} onChange={e => setALoc(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchAdzuna(1)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500" />
              </div>
              <select value={aEt} onChange={e => setAEt(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none text-gray-600">
                <option value="">All types</option>
                {!userFilters.excludedTypes.includes('full-time') && <option value="FULLTIME">Full-time</option>}
                {!userFilters.excludedTypes.includes('part-time') && <option value="PARTTIME">Part-time</option>}
                {!userFilters.excludedTypes.includes('contract') && <option value="CONTRACTOR">Contract</option>}
                {!userFilters.excludedTypes.includes('internship') && <option value="INTERN">Internship</option>}
              </select>
              <select value={aDays} onChange={e => setADays(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none text-gray-600">
                {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={() => searchAdzuna(1)} disabled={aLoading}
                className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5">
                {aLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />} Search
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{DATE_NOTES.adzuna}</p>
          </>
        )}

        {/* ── JSearch filters ── */}
        {activeSource === 'jsearch' && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SECTORS.map(s => (
                <button key={s.key} onClick={() => setJSector(s.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${jSector === s.key ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <SmartSearchInput 
                placeholder="Job title, skill, keyword..." 
                value={jKw} 
                onChange={setJKw} 
                onKeyDown={e => e.key === 'Enter' && searchJSearch(1)}
              />
              <div className="relative w-32">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input placeholder="City, State" value={jLoc} onChange={e => setJLoc(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchJSearch(1)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <select value={jEt} onChange={e => setJEt(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none text-gray-600">
                <option value="">All types</option>
                {!userFilters.excludedTypes.includes('full-time') && <option value="FULLTIME">Full-time</option>}
                {!userFilters.excludedTypes.includes('part-time') && <option value="PARTTIME">Part-time</option>}
                {!userFilters.excludedTypes.includes('contract') && <option value="CONTRACTOR">Contract</option>}
                {!userFilters.excludedTypes.includes('internship') && <option value="INTERN">Internship</option>}
              </select>
              <select value={jDays} onChange={e => setJDays(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none text-gray-600">
                {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={() => searchJSearch(1)} disabled={jLoading}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                {jLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Direct connection to high-density executive and professional networking hubs.</p>
          </>
        )}

        {/* ── Serper filters ── */}
        {activeSource === 'serper' && (
          <>
            <div className="flex gap-2 mb-2">
              <SmartSearchInput 
                placeholder="Job title, role, skill..." 
                value={sKw} 
                onChange={setSKw} 
                onKeyDown={e => e.key === 'Enter' && searchSerper(1)}
              />
              <div className="relative w-36">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input placeholder="City or state" value={sLoc} onChange={e => setSLoc(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchSerper(1)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-rose-500" />
              </div>
              <button onClick={() => searchSerper(1)} disabled={sLoading || !sKw.trim()}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5">
                {sLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />} Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={sDays} onChange={e => setSDays(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none text-gray-600">
                {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={sEt} onChange={e => setSEt(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none text-gray-600">
                <option value="">All types</option>
                {!userFilters.excludedTypes.includes('full-time') && <option value="FULLTIME">Full-time</option>}
                {!userFilters.excludedTypes.includes('part-time') && <option value="PARTTIME">Part-time</option>}
                {!userFilters.excludedTypes.includes('contract') && <option value="CONTRACTOR">Contract</option>}
                {!userFilters.excludedTypes.includes('internship') && <option value="INTERN">Internship</option>}
              </select>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Intelligent aggregate indexing millions of live vacancies across major global boards.</p>
          </>
        )}


      </div>

      {/* ── Results ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">

        {/* Dice Quick-Sync Results */}
        {activeSource === 'dice_direct' && (
          <>
            {dLoading && <ProfessionalJobLoader color="teal" message="Connecting to Direct Tech Cluster..." />}
            {!dLoading && dMeta && <p className="text-[10px] text-gray-400 mb-3">{dMeta.totalResults.toLocaleString()} results · page {dMeta.currentPage} of {dMeta.totalPages}</p>}
            {!dLoading && dJobs.length > 0 && (
              <>
                <div className="flex flex-col gap-2.5">
                  {dJobs.map(j => <DiceCard key={j.guid} job={j} />)}
                </div>
                <Pagination 
                  page={dPage} 
                  totalPages={dMeta?.totalPages || 1} 
                  onPrev={() => searchDiceDirect(dPage - 1)} 
                  onNext={() => searchDiceDirect(dPage + 1)} 
                  color="teal" 
                />
              </>
            )}
            {!dLoading && !dSearched && <EmptyState icon={Search} searched={false} error={dError} title="Direct Dice Synchronization" subtitle="Search over 100k+ tech roles directly from the source" color="teal" />}
            {!dLoading && dSearched && dJobs.length === 0 && !dError && <EmptyState icon={Briefcase} searched={true} error={null} title="" subtitle="" />}
          </>
        )}

        {/* LinkedIn results */}
        {activeSource === 'linkedin' && (
          <>
            {lLoading && <ProfessionalJobLoader color="blue" message="Syncing with LinkedIn Direct Stream..." />}
            {!lLoading && lJobs.length > 0 && <p className="text-[10px] text-gray-400 mb-3">{lJobs.length} live jobs synced from past {lDays === '1' ? '24 hours' : 'week'}</p>}
            {!lLoading && lJobs.length > 0 && (
              <>
                <div className="flex flex-col gap-2.5">
                  {lJobs.map(j => <LinkedInCard key={j.id} job={j} />)}
                </div>
                
                <div className="mt-6 mb-8 flex justify-center">
                  <button
                    onClick={() => searchLinkedIn(true)}
                    disabled={lLoadingMore}
                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black uppercase tracking-widest rounded-full transition-all shadow-md disabled:opacity-50"
                  >
                    {lLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Syncing more...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Load More (Continuous Sync)
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
            {!lLoading && !lSearched && <EmptyState icon={Building2} searched={false} error={lError} title="Direct Real-Time LinkedIn Sync" subtitle="Access individual job postings with 100% direct application links" />}
            {!lLoading && lSearched && lJobs.length === 0 && !lError && <EmptyState icon={Briefcase} searched={true} error={null} title="" subtitle="" />}
          </>
        )}

        {/* Dice results */}
        {activeSource === 'dice' && (
          <>
            {diceLoading && <ProfessionalJobLoader color="indigo" message="Querying Specialized Core Nodes..." />}
            {!diceLoading && diceMeta && <p className="text-[10px] text-gray-400 mb-3">{diceMeta.totalResults.toLocaleString()} results · page {diceMeta.currentPage} of {Math.min(diceMeta.pageCount, 20)}</p>}
            {!diceLoading && diceJobs.length > 0 && (
              <>
                <div className="flex flex-col gap-2.5">{diceJobs.map(j => <DiceCard key={j.guid} job={j} />)}</div>
                <Pagination page={diceMeta?.currentPage || 1} totalPages={Math.min(diceMeta?.pageCount || 1, 20)} onPrev={() => searchDice((diceMeta?.currentPage || 1) - 1)} onNext={() => searchDice((diceMeta?.currentPage || 1) + 1)} color="indigo" />
              </>
            )}
            {!diceLoading && !diceSearched && <EmptyState icon={Code2} searched={false} error={diceError} title="Query specialized engineering & tech nodes" subtitle="Live vacancies from core technology sectors" />}
            {!diceLoading && diceSearched && diceJobs.length === 0 && !diceError && <EmptyState icon={Briefcase} searched={true} error={null} title="" subtitle="" />}
          </>
        )}

        {/* Adzuna results */}
        {activeSource === 'adzuna' && (
          <>
            {aLoading && <ProfessionalJobLoader color="purple" message="Analyzing Global Talent Nodes..." />}
            {!aLoading && aSearched && aTotal > 0 && <p className="text-[10px] text-gray-400 mb-3">{aTotal.toLocaleString()} jobs · page {aPage} of {aTotalPages} · via Global Market</p>}
            {!aLoading && aJobs.length > 0 && (
              <>
                <div className="flex flex-col gap-2.5">{aJobs.map(j => <AdzunaCard key={j.id} job={j} />)}</div>
                <Pagination page={aPage} totalPages={aTotalPages} onPrev={() => searchAdzuna(aPage - 1)} onNext={() => searchAdzuna(aPage + 1)} color="purple" />
              </>
            )}
            {!aLoading && !aSearched && <EmptyState icon={Globe} searched={false} error={aError} title="Search all sectors across USA" subtitle="Healthcare · Finance · Retail · Engineering · and more" />}
            {!aLoading && aSearched && aJobs.length === 0 && !aError && <EmptyState icon={Briefcase} searched={true} error={null} title="" subtitle="" />}
          </>
        )}

        {/* JSearch results */}
        {activeSource === 'jsearch' && (
          <>
            {jLoading && <ProfessionalJobLoader color="blue" message="Querying Premium Executive Networks..." />}
            {!jLoading && jJobs.length > 0 && (
              <>
                <div className="flex flex-col gap-2.5">{jJobs.map(j => <JSearchCard key={j.job_id} job={j} />)}</div>
                <div className="flex items-center justify-center gap-3 mt-4 pb-2">
                  <button onClick={() => searchJSearch(jPage - 1)} disabled={jPage <= 1 || jLoading}
                    className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs text-blue-600 font-medium">Page {jPage}</span>
                  <button onClick={() => searchJSearch(jPage + 1)} disabled={jLoading}
                    className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </>
            )}
            {!jLoading && !jSearched && <EmptyState icon={Search} searched={false} error={jError} title="Search specialized executive networks" subtitle="Access high-density professional job boards" />}
            {!jLoading && jSearched && jJobs.length === 0 && !jError && <EmptyState icon={Briefcase} searched={true} error={null} title="" subtitle="" />}
          </>
        )}

        {/* Serper / Google Jobs results */}
        {activeSource === 'serper' && (
          <>
            {sLoading && <ProfessionalJobLoader color="rose" message="Crawling Multi-Board Aggregates..." />}
            {!sLoading && sJobs.length > 0 && (
              <>
                <p className="text-[10px] text-gray-400 mb-3">{sJobs.length} aggregate results · page {sPage}</p>
                <div className="flex flex-col gap-2.5">{sJobs.map(j => <SerperCard key={j.id} job={j} />)}</div>
                <div className="flex items-center justify-center gap-3 mt-4 pb-2">
                  <button onClick={() => searchSerper(sPage - 1)} disabled={sPage <= 1 || sLoading}
                    className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs text-rose-600 font-medium">Page {sPage}</span>
                  <button onClick={() => searchSerper(sPage + 1)} disabled={sLoading}
                    className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </>
            )}
            {!sLoading && !sSearched && <EmptyState icon={Star} searched={false} error={sError} title="Search cross-platform aggregates" subtitle="Wider coverage across millions of global roles" />}
            {!sLoading && sSearched && sJobs.length === 0 && !sError && <EmptyState icon={Briefcase} searched={true} error={null} title="" subtitle="" />}
          </>
        )}



      </div>
    </main>
  );
}
