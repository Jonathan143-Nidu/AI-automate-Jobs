import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services/admin-service';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// Serper free plan only has /search (organic results)
// Google tbs date filters:
// qdr:d = past 24h, qdr:2d = past 2 days, qdr:3d = 3 days
// qdr:w = past week, qdr:m = past month
const SERPER_DATE_MAP: Record<string, string> = {
  '1':  'qdr:d',
  '2':  'qdr:2d',
  '3':  'qdr:3d',
  '7':  'qdr:w',
  '10': 'qdr:10d',
  '15': 'qdr:15d',
  '30': 'qdr:m',
};

// Date label for display
const DATE_LABEL_MAP: Record<string, string> = {
  '1': 'today', '2': 'last 2 days', '3': 'last 3 days',
  '7': 'last 7 days', '10': 'last 10 days', '15': 'last 15 days', '30': 'last 30 days',
};

interface OrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  displayedLink?: string;
  date?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      keyword = 'software engineer',
      location = '',
      employment_type = '',
      posted_days = '7',
      page = 1,
    } = body;

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SERPER_API_KEY not set in .env — get free key at serper.dev' },
        { status: 500 }
      );
    }

    const locationStr = location.trim() || 'United States';
    const tbs = SERPER_DATE_MAP[String(posted_days)] || 'qdr:w';
    const dateLabel = DATE_LABEL_MAP[String(posted_days)] || 'last 7 days';
    const start = page > 1 ? (page - 1) * 10 : 0;

    // --- AUTH & EXCLUSION SYNC ---
    const session = await auth();
    const userEmail = session?.user?.email;
    let excludedTypes: string[] = [];
    if (userEmail) {
      const filters = await adminService.getUserFilters(userEmail);
      excludedTypes = filters.excludedTypes || [];
    }

    // Employment type for query
    const etQueryMap: Record<string, string> = {
      FULLTIME: '"full time" OR "full-time"',
      PARTTIME: '"part time" OR "part-time"',
      CONTRACTOR: 'contract OR C2C OR W2',
      INTERN: 'intern OR internship',
    };
    const etStr = employment_type && etQueryMap[employment_type]
      ? ` (${etQueryMap[employment_type]})`
      : '';

    // Calculate negative terms for exclusions
    let negativeTerms = '';
    if (!employment_type && excludedTypes.length > 0) {
        if (excludedTypes.includes('full-time'))  negativeTerms += ' -"full time" -"full-time"';
        if (excludedTypes.includes('part-time'))  negativeTerms += ' -"part time" -"part-time"';
        if (excludedTypes.includes('contract'))   negativeTerms += ' -contract -C2C -W2';
        if (excludedTypes.includes('internship')) negativeTerms += ' -intern -internship';
    }

    // Target individual job postings on major job boards
    const jobQuery = `"${keyword.trim()}" in "${locationStr}"${etStr}${negativeTerms} (site:linkedin.com/jobs OR site:indeed.com/viewjob OR site:glassdoor.com/job-listing OR site:ziprecruiter.com/c OR site:dice.com/job-detail) -intitle:"10,000+" -intitle:"5,000+" -intitle:"top 10" -intitle:"added daily" -intitle:"job openings in" -intitle:"hiring in"`;

    const payload: Record<string, unknown> = {
      q: jobQuery,
      gl: 'us',
      hl: 'en',
      tbs,
      num: 10,
    };
    if (locationStr) payload.location = locationStr;
    if (start > 0) payload.start = start;

    console.log(`[Serper] Querying for: "${keyword}" | date: ${dateLabel} (${tbs})`);

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: 'Invalid Serper API key — check SERPER_API_KEY in .env' }, { status: 401 });
    }
    if (res.status === 429) {
      return NextResponse.json({ error: 'Serper quota used. Free: 2,500/month. Upgrade at serper.dev.' }, { status: 429 });
    }
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `Serper error ${res.status}: ${t.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    let organic: OrganicResult[] = data.organic || [];

    console.log(`[Serper] Got ${organic.length} organic results`);

    // Fallback: broaden query if no results
    if (organic.length === 0) {
      const fallbackPayload = {
        q: `"${keyword.trim()}" job opening hiring ${locationStr}`,
        gl: 'us', hl: 'en', tbs, num: 10,
      };
      const r2 = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload),
      });
      if (r2.ok) {
        const d2 = await r2.json();
        organic = d2.organic || [];
        console.log(`[Serper] Fallback got ${organic.length} results`);
      }
    }

    // Normalize organic results into job cards
    const jobs = organic
      .filter((r) => {
        if (!r.title || !r.link) return false;
        const lowLink = r.link.toLowerCase();
        const lowTitle = r.title.toLowerCase();

        // 1. URL Path Strictness (Block search/aggregator paths)
        if (lowLink.includes('linkedin.com/jobs') && !lowLink.includes('/view/') && !lowLink.includes('/external-apply/')) return false;
        if (lowLink.includes('indeed.com') && (lowLink.includes('/jobs') || lowLink.includes('/q-') || lowLink.includes('/l-')) && !lowLink.includes('/viewjob') && !lowLink.includes('/rc/clk')) return false;
        if (lowLink.includes('ziprecruiter.com/jobs/search')) return false;

        // 2. Aggressive Title Filter for summary/landing pages
        if (/\d+,?\d*\+?\s+jobs/i.test(lowTitle)) return false; // "14,000+ jobs"
        if (/\d+\s+new\s+jobs/i.test(lowTitle)) return false;   // "250 new jobs"
        if (lowTitle.includes('jobs in ') && lowTitle.length < 65) return false; 
        if (lowTitle.includes('hiring in')) return false;
        if (lowTitle.includes('top ') && /\d+/.test(lowTitle)) return false; // top 10 lists
        if (lowTitle.endsWith(' jobs')) return false; // "Java Developer Jobs"
        
        return true;
      })
      .map((result) => {
        const title = result.title || '';
        const url = result.link || '';
        const snippet = result.snippet || '';

        const source = detectSource(url, result.displayedLink || '');
        const company = extractCompany(title, snippet);
        const jobLocation = extractLocation(snippet, locationStr);
        const salary = extractSalary(snippet);
        const cleanTitle = cleanJobTitle(title);
        const empType = extractEmploymentType(title, snippet);

        return {
          id: `serper-${Math.random().toString(36).slice(2, 10)}`,
          title: cleanTitle,
          company,
          location: jobLocation,
          description: snippet,
          employmentType: empType,
          salary,
          postedAt: result.date || dateLabel,
          applyUrl: url,
          source,
          highlights: [],
          isRemote: /remote/i.test(title + snippet),
          thumbnail: null,
          extensions: [],
        };
      });

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
          const type = (j.employmentType || '').toLowerCase();
          const title = (j.title || '').toLowerCase();
          const snippet = (j.description || '').toLowerCase();
          
          return !excludedTypes.some(excluded => {
            // General Keyword Matching in title or snippet
            const isMatch = title.includes(`(${excluded})`) || 
                           new RegExp(`\\b${excluded}\\b`, 'i').test(title) ||
                           new RegExp(`\\b${excluded}\\b`, 'i').test(snippet);
            
            if (isMatch) return true;

            // Specialized Mappings
            if (excluded === 'contract' && (type.includes('contract') || title.includes('contractor'))) return true;
            if (excluded === 'full-time' && (type.includes('full-time') || title.includes('fulltime'))) return true;
            if (excluded === 'part-time' && (type.includes('part-time') || title.includes('parttime'))) return true;
            if (excluded === 'internship' && (type.includes('intern') || title.includes('internship'))) return true;
            
            return false;
          });
        });
      }
    }

    return NextResponse.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      dateFilter: dateLabel,
      searchEngine: 'Google Search via Serper.dev',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Serper Error]', message);
    return NextResponse.json({ error: `Search failed: ${message}` }, { status: 500 });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function detectSource(url: string, domain: string): string {
  const s = (url + domain).toLowerCase();
  if (s.includes('linkedin')) return 'LinkedIn';
  if (s.includes('indeed')) return 'Indeed';
  if (s.includes('glassdoor')) return 'Glassdoor';
  if (s.includes('ziprecruiter')) return 'ZipRecruiter';
  if (s.includes('careerbuilder')) return 'CareerBuilder';
  if (s.includes('monster')) return 'Monster';
  if (s.includes('dice')) return 'Dice';
  if (s.includes('simplyhired')) return 'SimplyHired';
  if (s.includes('lever.co')) return 'Lever';
  if (s.includes('greenhouse')) return 'Greenhouse';
  if (s.includes('workday')) return 'Workday';
  try {
    const host = new URL(url).hostname.replace('www.', '');
    const part = host.split('.')[0];
    return part.charAt(0).toUpperCase() + part.slice(1);
  } catch { return 'Google Jobs'; }
}

function extractCompany(title: string, snippet: string): string {
  const atMatch = title.match(/ at ([^|\-–·]+)/i);
  if (atMatch) return atMatch[1].trim().replace(/\s*[-|].*$/, '').trim();
  const dashMatch = title.match(/^([^|\-–·]{3,35})\s*[-–|·]\s*/);
  if (dashMatch && !/job|hire|hiring|position|opening/i.test(dashMatch[1])) return dashMatch[1].trim();
  const snippetMatch = snippet.match(/(?:^|\.\s)([A-Z][^.]{2,30})\s+is\s+(?:hiring|looking|seeking)/);
  if (snippetMatch) return snippetMatch[1].trim();
  return 'Unknown';
}

function extractLocation(snippet: string, defaultLoc: string): string {
  if (/remote/i.test(snippet)) return 'Remote (USA)';
  const m = snippet.match(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z]{2})\b/);
  if (m) return m[1];
  return defaultLoc;
}

function extractSalary(snippet: string): string | null {
  const m = snippet.match(/\$[\d,]+(?:K)?(?:\s*[-–]\s*\$[\d,]+(?:K)?)?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr|month))?/i);
  return m ? m[0] : null;
}

function extractEmploymentType(title: string, snippet: string): string | null {
  const s = (title + ' ' + snippet).toLowerCase();
  if (/full.time|permanent/i.test(s)) return 'Full-time';
  if (/part.time/i.test(s)) return 'Part-time';
  if (/\bc2c\b|contract|w2\b/i.test(s)) return 'Contract';
  if (/intern/i.test(s)) return 'Internship';
  return null;
}

function cleanJobTitle(title: string): string {
  return title
    .replace(/\s*[-–|·]\s*(LinkedIn|Indeed|Glassdoor|ZipRecruiter|Monster|Dice|CareerBuilder|SimplyHired|Greenhouse|Lever|Workday|Google Jobs|Jobs?)\s*$/i, '')
    .replace(/\s*\|\s*Apply.*$/i, '')
    .replace(/\s*-\s*\d+\s*applicants.*$/i, '')
    .trim();
}