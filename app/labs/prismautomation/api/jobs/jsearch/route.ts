import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services/admin-service';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// JSearch supports: 'today','3days','week','month'
const JSEARCH_DATE_MAP: Record<string, string> = {
  '1': 'today', '2': 'today', '3': '3days', '7': 'week',
  '10': 'week', '15': 'month', '30': 'month',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword = 'software engineer', sector = '', employment_type = '',
            location = '', page = 1, posted_days = '1' } = body;

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set' }, { status: 500 });

    const sectorMap: Record<string, string> = {
      tech: 'software engineer developer', healthcare: 'healthcare nurse doctor',
      finance: 'finance banking analyst', insurance: 'insurance underwriter',
      retail: 'retail store manager', telecom: 'telecom network engineer',
      staffing: 'IT staffing recruiter',
    };

    const baseQuery = keyword.trim() || sectorMap[sector] || 'software engineer';
    
    // --- AUTH & EXCLUSION SYNC ---
    const session = await auth();
    const userEmail = session?.user?.email;
    let excludedTypes: string[] = [];
    if (userEmail) {
      const filters = await adminService.getUserFilters(userEmail);
      excludedTypes = filters.excludedTypes || [];
    }

    const jsearchTypesMap: Record<string, string> = {
      'full-time': 'FULLTIME',
      'contract': 'CONTRACTOR',
      'part-time': 'PARTTIME',
      'internship': 'INTERN'
    };

    let targetTypes = employment_type ? [employment_type] : [];

    // If user picked "Any" (empty), but has exclusions, only request the allowed ones
    if (!employment_type && excludedTypes.length > 0) {
        targetTypes = Object.keys(jsearchTypesMap)
            .filter(t => !excludedTypes.includes(t))
            .map(t => jsearchTypesMap[t]);
    }

    const url = new URL('https://jsearch.p.rapidapi.com/search');
    url.searchParams.set('query', `${baseQuery} ${location.trim() || 'USA'}`);
    url.searchParams.set('date_posted', JSEARCH_DATE_MAP[String(posted_days)] || 'today');
    url.searchParams.set('num_pages', '1');
    url.searchParams.set('page', String(page));
    url.searchParams.set('country', 'us');
    
    if (targetTypes.length > 0) {
        url.searchParams.set('employment_types', targetTypes.join(','));
    }

    const res = await fetch(url.toString(), {
      headers: { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' },
    });

    if (res.status === 401 || res.status === 403) return NextResponse.json({ error: 'Invalid RapidAPI key' }, { status: 401 });
    if (res.status === 429) return NextResponse.json({ error: 'RapidAPI rate limit reached (200 req/month free)' }, { status: 429 });
    if (!res.ok) { const t = await res.text(); return NextResponse.json({ error: `JSearch ${res.status}: ${t.slice(0,200)}` }, { status: 500 }); }

    const data = await res.json();
    const jobs = data.data || [];

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
          return NextResponse.json({ jobs: [], total: 0 });
        }

        // 2. Result Filtering
        filteredJobs = jobs.filter((j: any) => {
          const type = (j.job_employment_type || '').toLowerCase();
          const title = (j.job_title || j.title || '').toLowerCase();
          
          return !excludedTypes.some(excluded => {
            // General Keyword Matching
            const isMatch = title.includes(`(${excluded})`) || 
                           new RegExp(`\\b${excluded}\\b`, 'i').test(title);
            
            if (isMatch) return true;

            // Specialized Mappings
            if (excluded === 'contract' && (type.includes('contract') || title.includes('contractor'))) return true;
            if (excluded === 'full-time' && (type.includes('fulltime') || title.includes('fulltime'))) return true;
            if (excluded === 'part-time' && (type.includes('parttime') || title.includes('parttime'))) return true;
            if (excluded === 'internship' && (type.includes('intern') || title.includes('internship'))) return true;
            
            return false;
          });
        });
      }
    }

    return NextResponse.json({ 
      jobs: filteredJobs, 
      total: filteredJobs.length 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Search failed: ${message}` }, { status: 500 });
  }
}
