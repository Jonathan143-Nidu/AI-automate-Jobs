"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiceJob {
  guid: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  summary?: string;
  salary?: string;
  employmentType?: string;
  workplaceTypes?: string[];
  isRemote?: boolean;
  easyApply?: boolean;
  willingToSponsor?: boolean;
  postedDate?: string;
  detailsPageUrl: string;
  companyPageUrl?: string;
  jobLocation?: { displayName: string } | null;
}

interface SearchMeta {
  currentPage: number;
  pageCount: number;
  totalResults: number;
  pageSize: number;
}

interface SearchFilters {
  keyword: string;
  location: string;
  workplace: string;
  employment: string;
  postedDate: string;
  easyApply: boolean;
  sponsorship: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

function initials(name: string): string {
  return (name || "CO")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JobCard({ job }: { job: DiceJob }) {
  const [imgError, setImgError] = useState(false);
  const tags: { label: string; color: string }[] = [];

  if (job.isRemote || job.workplaceTypes?.includes("Remote"))
    tags.push({ label: "Remote", color: "bg-green-50 text-green-700 border-green-200" });
  if (job.workplaceTypes?.includes("Hybrid"))
    tags.push({ label: "Hybrid", color: "bg-blue-50 text-blue-700 border-blue-200" });
  if (job.employmentType)
    tags.push({ label: job.employmentType, color: "bg-gray-100 text-gray-600 border-gray-200" });
  if (job.easyApply)
    tags.push({ label: "Easy Apply", color: "bg-amber-50 text-amber-700 border-amber-200" });
  if (job.willingToSponsor)
    tags.push({ label: "Sponsors Visa", color: "bg-indigo-50 text-indigo-700 border-indigo-200" });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group">
      <div className="flex gap-3">
        {/* Logo */}
        <div className="flex-shrink-0">
          {job.companyLogoUrl && !imgError ? (
            <img
              src={job.companyLogoUrl}
              alt={job.companyName}
              onError={() => setImgError(true)}
              className="w-10 h-10 rounded-lg border border-gray-100 object-contain bg-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
              {initials(job.companyName)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate leading-snug">
            {job.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{job.companyName}</p>

          {job.jobLocation?.displayName && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {job.jobLocation.displayName}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((t) => (
                <span
                  key={t.label}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${t.color}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}

          {/* Summary */}
          {job.summary && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
              {job.summary}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              {job.salary && (
                <span className="text-xs font-medium text-gray-700">{job.salary}</span>
              )}
              {job.postedDate && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(job.postedDate)}
                </span>
              )}
            </div>
            <a
              href={job.detailsPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium"
            >
              View job <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiceJobSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    location: "",
    workplace: "",
    employment: "",
    postedDate: "",
    easyApply: false,
    sponsorship: false,
  });

  const [jobs, setJobs] = useState<DiceJob[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(
    async (page = 1) => {
      if (!filters.keyword.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const body: Record<string, unknown> = {
          keyword: filters.keyword.trim(),
          jobs_per_page: 10,
          page_number: page,
        };
        if (filters.location) body.location = filters.location;
        if (filters.workplace) body.workplace_types = [filters.workplace];
        if (filters.employment) body.employment_types = [filters.employment];
        if (filters.postedDate) body.posted_date = filters.postedDate;
        if (filters.easyApply) body.easy_apply = true;
        if (filters.sponsorship) body.willing_to_sponsor = true;

        const res = await fetch("/api/jobs/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");

        setJobs(data.data || []);
        setMeta(data.meta || null);
        setSearched(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search(1);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Find Tech Jobs
          </h2>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
            via Dice
          </span>
        </div>

        {/* Keyword + Location */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Job title or keyword..."
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div className="relative w-36">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <button
            onClick={() => search(1)}
            disabled={loading || !filters.keyword.trim()}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Search
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={filters.workplace}
            onChange={(e) => setFilters((f) => ({ ...f, workplace: e.target.value }))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400 text-gray-600"
          >
            <option value="">Any workplace</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-Site">On-Site</option>
          </select>

          <select
            value={filters.employment}
            onChange={(e) => setFilters((f) => ({ ...f, employment: e.target.value }))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400 text-gray-600"
          >
            <option value="">Any type</option>
            <option value="FULLTIME">Full-time</option>
            <option value="CONTRACTS">Contract</option>
            <option value="PARTTIME">Part-time</option>
          </select>

          <select
            value={filters.postedDate}
            onChange={(e) => setFilters((f) => ({ ...f, postedDate: e.target.value }))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400 text-gray-600"
          >
            <option value="">Any date</option>
            <option value="ONE">Last 24h</option>
            <option value="THREE">Last 3 days</option>
            <option value="SEVEN">Last 7 days</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.easyApply}
              onChange={(e) => setFilters((f) => ({ ...f, easyApply: e.target.checked }))}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <Zap className="w-3 h-3 text-amber-500" />
            Easy Apply
          </label>

          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.sponsorship}
              onChange={(e) => setFilters((f) => ({ ...f, sponsorship: e.target.checked }))}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <BadgeCheck className="w-3 h-3 text-indigo-500" />
            Visa Sponsor
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <p className="text-xs text-gray-400">Searching Dice...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-xs">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && searched && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Briefcase className="w-8 h-8" />
            <p className="text-sm font-medium">No jobs found</p>
            <p className="text-xs">Try a different keyword or fewer filters</p>
          </div>
        )}

        {/* Initial state */}
        {!loading && !error && !searched && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-300">
            <Search className="w-8 h-8" />
            <p className="text-sm font-medium text-gray-400">Search for tech jobs on Dice</p>
            <p className="text-xs">Real-time results from Dice's tech job database</p>
          </div>
        )}

        {/* Jobs list */}
        {!loading && !error && jobs.length > 0 && (
          <>
            <p className="text-[10px] text-gray-400 mb-3">
              {meta?.totalResults?.toLocaleString()} results · page {meta?.currentPage} of{" "}
              {meta?.pageCount}
            </p>
            <div className="flex flex-col gap-2.5">
              {jobs.map((job) => (
                <JobCard key={job.guid} job={job} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.pageCount > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4 pb-2">
                <button
                  onClick={() => search(meta.currentPage - 1)}
                  disabled={meta.currentPage <= 1}
                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-xs text-gray-500">
                  {meta.currentPage} / {Math.min(meta.pageCount, 20)}
                </span>
                <button
                  onClick={() => search(meta.currentPage + 1)}
                  disabled={meta.currentPage >= Math.min(meta.pageCount, 20)}
                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Disclosure */}
            <p className="text-[10px] text-gray-300 text-center mt-3 pb-2">
              Job listings sourced from Dice.com. Verify all details directly with employers.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
