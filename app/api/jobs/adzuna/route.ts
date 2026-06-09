import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services/admin-service';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// Adzuna supports max_days_old = any integer
const ADZUNA_DAYS_MAP: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '7': 7, '10': 10, '15': 15, '30': 30,
};

const CATEGORY_MAP: Record<string, string> = {
  tech: 'it-jobs', healthcare: 'healthcare-nursing-jobs',
  finance: 'accounting-finance-jobs', insurance: 'insurance-jobs',
  retail: 'retail-jobs', telecom: 'it-jobs', staffing: 'it-jobs',
  engineering: 'engineering-jobs', sales: 'sales-jobs', all: '',
};

interface AdzunaJob {
  id: string; title: string; description: string; created: string;
  redirect_url: string; salary_min?: number; salary_max?: number;
  salary_is_predicted?: number; contract_type?: string; contract_time?: string;
  latitude?: number; longitude?: number;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  category: { label: string; tag: string };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword = '', sector = 'tech', employment_type = '',
            location = '', page = 1, results_per_page = 10,
            posted_days = '1' } = body;

    const appId  = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return NextResponse.json({ error: 'ADZUNA_APP_ID or ADZUNA_APP_KEY not set' }, { status: 500 });

    const url = new URL(`https://api.adzuna.com/v1/api/jobs/us/search/${page}`);
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);
    url.searchParams.set('results_per_page', String(results_per_page));
    url.searchParams.set('content-type', 'application/json');
    url.searchParams.set('sort_by', 'date');
    if (keyword.trim()) url.searchParams.set('what', keyword.trim());
    if (location.trim()) url.searchParams.set('where', location.trim());
    // --- AUTH & EXCLUSION SYNC ---
    const session = await auth();
    const userEmail = session?.user?.email;
    let excludedTypes: string[] = [];
    if (userEmail) {
      const filters = await adminService.getUserFilters(userEmail);
      excludedTypes = filters.excludedTypes || [];
    }

    const category = CATEGORY_MAP[sector] || '';
    if (category) url.searchParams.set('category', category);

    // Determine what types to request from Adzuna
    let activeTypes = employment_type ? [employment_type] : [];
    
    // If user picks "Any", but has exclusions, specifically request only allowed categories
    if (!employment_type && excludedTypes.length > 0) {
        if (!excludedTypes.includes('full-time')) activeTypes.push('FULLTIME');
        if (!excludedTypes.includes('part-time')) activeTypes.push('PARTTIME');
        if (!excludedTypes.includes('contract'))  activeTypes.push('CONTRACTOR');
        if (!excludedTypes.includes('internship')) activeTypes.push('INTERN');
    }

    if (activeTypes.includes('FULLTIME'))   url.searchParams.set('full_time', '1');
    if (activeTypes.includes('PARTTIME'))   url.searchParams.set('part_time', '1');
    if (activeTypes.includes('CONTRACTOR')) url.searchParams.set('contract', '1');
    if (activeTypes.includes('INTERN'))     url.searchParams.set('what_and', 'intern OR internship');

    // ← DYNAMIC date filter
    const days = ADZUNA_DAYS_MAP[String(posted_days)] || 1;
    url.searchParams.set('max_days_old', String(days));

    const res = await fetch(url.toString());
    if (res.status === 401 || res.status === 403) return NextResponse.json({ error: 'Invalid Adzuna credentials' }, { status: 401 });
    if (!res.ok) { const t = await res.text(); return NextResponse.json({ error: `Adzuna ${res.status}: ${t.slice(0,200)}` }, { status: 500 }); }

    const data = await res.json();
    const jobs = (data.results || []).map((job: AdzunaJob) => ({
      id: job.id, title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || 'USA',
      description: job.description, salary_min: job.salary_min, salary_max: job.salary_max,
      salary_is_predicted: job.salary_is_predicted, contract_type: job.contract_type,
      contract_time: job.contract_time, created: job.created, redirect_url: job.redirect_url,
      category: job.category?.label,
    }));
    // --- FILTERING LOGIC ---
    let filteredJobs = jobs;

    if (userEmail) {
      const { excludedTypes } = await adminService.getUserFilters(userEmail);
      
      if (excludedTypes.length > 0) {
        // 1. STRIKE SYSTEM: If the user specifically requested an excluded type via parameters, return empty.
        const hasViolation = excludedTypes.some(type => {
            if (type === 'contract' && employment_type === 'CONTRACTOR') return true;
            if (type === 'full-time' && employment_type === 'FULLTIME') return true;
            if (type === 'part-time' && employment_type === 'PARTTIME') return true;
            if (type === 'internship' && employment_type === 'INTERN') return true;
            return false;
        });

        if (hasViolation) {
          return NextResponse.json({ jobs: [], total: 0, page, results_per_page });
        }

        // 2. Result Filtering
        filteredJobs = jobs.filter((j: any) => {
          const contractType = (j.contract_type || '').toLowerCase(); // 'permanent' or 'contract'
          const contractTime = (j.contract_time || '').toLowerCase(); // 'full_time' or 'part_time'
          const title = (j.title || '').toLowerCase();
          
          return !excludedTypes.some(excluded => {
            // General Keyword Matching
            const isMatch = title.includes(`(${excluded})`) || 
                           new RegExp(`\\b${excluded}\\b`, 'i').test(title);
            
            if (isMatch) return true;

            // Specialized Mappings
            if (excluded === 'contract' && (contractType === 'contract' || title.includes('contractor'))) return true;
            if (excluded === 'full-time' && (contractTime === 'full_time' || title.includes('fulltime'))) return true;
            if (excluded === 'part-time' && (contractTime === 'part_time' || title.includes('parttime'))) return true;
            if (excluded === 'internship' && (title.includes('intern') || title.includes('internship'))) return true;
            
            return false;
          });
        });
      }
    }

    return NextResponse.json({ 
      jobs: filteredJobs, 
      total: userEmail ? filteredJobs.length : (data.count || 0), 
      page, 
      results_per_page 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Search failed: ${message}` }, { status: 500 });
  }
}
