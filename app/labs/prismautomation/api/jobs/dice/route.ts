import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services/admin-service';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// ── RSC Extraction Helpers ────────────────────────────────────────────────────

/**
 * Extract a balanced JSON object starting from `openPos` (the `{` char).
 * String-aware: correctly skips over quoted strings (including escaped chars)
 * so that `{` / `}` inside string values don't disturb the bracket count.
 * Returns the parsed object or null on failure.
 */
function extractBalancedObject(str: string, openPos: number): unknown | null {
  let depth = 0;
  let i = openPos;

  while (i < str.length) {
    const c = str[i];

    if (c === '"') {
      // Skip the entire JSON string, respecting backslash escapes
      i++;
      while (i < str.length) {
        if (str[i] === '\\') {
          i += 2; // skip escape char + escaped char
        } else if (str[i] === '"') {
          i++; // closing quote
          break;
        } else {
          i++;
        }
      }
    } else if (c === '{') {
      depth++;
      i++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(str.substring(openPos, i + 1)); } catch { return null; }
      }
      i++;
    } else {
      i++;
    }
  }

  return null;
}

/**
 * Decode a self.__next_f.push([1,"ENCODED"]) script block.
 * - prefix = `self.__next_f.push([1,"` (23 chars)
 * - suffix = `"])` (3 chars)
 */
const RSC_PREFIX = 'self.__next_f.push([1,"';
const RSC_SUFFIX = '"])';

function decodeRSCBlock(block: string): string | null {
  const b = block.trim();
  if (!b.startsWith(RSC_PREFIX) || !b.endsWith(RSC_SUFFIX)) return null;
  const encoded = b.slice(RSC_PREFIX.length, b.length - RSC_SUFFIX.length);
  try {
    // JSON.parse correctly decodes all escape sequences (\", \\, \n, \uXXXX …)
    return JSON.parse('"' + encoded + '"');
  } catch {
    return null;
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      keyword,
      location = '',
      posted_days = '',
      page = 1,
      employment_types = [],
      workplace_types = [],
      employer_types = [],
      easy_apply = false,
      willing_to_sponsor = false,
    } = body;

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const dayMap: Record<string, string> = {
      '1': 'ONE', '2': 'ONE', '3': 'THREE', '7': 'SEVEN',
      '10': 'SEVEN', '15': 'THIRTY', '30': 'THIRTY',
    };
    const postedDate = posted_days ? (dayMap[String(posted_days)] || 'ONE') : null;

    const params = new URLSearchParams({
      q: keyword.trim(),
      countryCode: 'US',
      page: String(page),
      pageSize: '20',
    });

    // Only add date filter when a specific range is selected (not "No Preference")
    if (postedDate) params.set('filters.postedDate', postedDate);


    // Dice requires geocoding params to return results properly.
    // Default to country-level USA geocode when no specific location is given.
    if (location) {
      params.set('location', location);
    } else {
      params.set('location', 'United States');
      params.set('latitude', '38.7945952');
      params.set('longitude', '-106.5348379');
      params.set('locationPrecision', 'Country');
    }

    // --- AUTH & EXCLUSION SYNC ---
    const session = await auth();
    const userEmail = session?.user?.email;
    let excludedTypes: string[] = [];
    if (userEmail) {
      const filters = await adminService.getUserFilters(userEmail);
      excludedTypes = filters.excludedTypes || [];
    }

    const diceTypesMap: Record<string, string> = {
      'full-time': 'FULLTIME',
      'contract': 'CONTRACTS',
      'part-time': 'PARTTIME'
    };

    let activeEmploymentTypes = employment_types || [];

    // If user picked "Any" (empty array), but has exclusions, request only allowed ones
    if (activeEmploymentTypes.length === 0 && excludedTypes.length > 0) {
      activeEmploymentTypes = Object.keys(diceTypesMap)
        .filter(t => !excludedTypes.includes(t))
        .map(t => diceTypesMap[t]);
    }

    if (easy_apply)                 params.set('filters.easyApply', 'true');
    if (willing_to_sponsor)         params.set('filters.willingToSponsor', 'true');
    if (activeEmploymentTypes.length) params.set('filters.employmentType', activeEmploymentTypes.join('|'));
    if (workplace_types.length)     params.set('filters.workplaceTypes', workplace_types.join('|'));
    if (employer_types.length)      params.set('filters.employerType', employer_types.join('|'));

    const targetUrl = `https://www.dice.com/jobs?${params.toString()}`;
    console.log(`[Dice-QuickSync] Fetching: ${targetUrl}`);

    const res = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) throw new Error(`Dice returned HTTP ${res.status}`);

    const html = await res.text();

    // ── Step 1: Try legacy __NEXT_DATA__ (Pages Router) ─────────────────────
    let jobList: any[] = [];
    let totalResults = 0;
    let pageCount    = 0;
    let currentPage  = Number(page);
    let found        = false;

    const legacyMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (legacyMatch) {
      try {
        const nextData = JSON.parse(legacyMatch[1]);
        const sr = nextData.props?.pageProps?.initialState?.search?.searchResults;
        if (sr) {
          jobList      = sr.content || [];
          totalResults = sr.totalElements || 0;
          pageCount    = sr.totalPages   || 0;
          found        = true;
        }
      } catch { /* fall through */ }
    }

    // ── Step 2: RSC streaming (App Router) ──────────────────────────────────
    // Split the HTML by bare <script> tags. Each RSC chunk lives in its own
    // <script> element with NO attributes, never in <script src="…"> etc.
    if (!found) {
      const scriptParts = html.split('<script>');

      for (let i = 1; i < scriptParts.length; i++) {
        const closeIdx   = scriptParts[i].indexOf('</script>');
        const rawBlock   = closeIdx !== -1 ? scriptParts[i].substring(0, closeIdx) : scriptParts[i];

        const decoded = decodeRSCBlock(rawBlock);
        if (!decoded) continue;

        // The target chunk contains both "jobList" and "totalResults"
        if (!decoded.includes('"jobList"') || !decoded.includes('"totalResults"')) continue;

        // Extract jobList → { data: [...] }
        const jlKey   = '"jobList":';
        const jlStart = decoded.indexOf(jlKey);
        if (jlStart === -1) continue;
        const jlOpenPos = decoded.indexOf('{', jlStart + jlKey.length);
        if (jlOpenPos === -1) continue;
        const jlObj = extractBalancedObject(decoded, jlOpenPos);
        if (!jlObj) continue;
        jobList = (jlObj as any).data || [];

        // Extract meta → { currentPage, pageCount, totalResults, … }
        // meta comes AFTER jobList in the same decoded string
        const metaKey   = '"meta":';
        const metaStart = decoded.indexOf(metaKey, jlStart + jlKey.length);
        if (metaStart !== -1) {
          const metaOpenPos = decoded.indexOf('{', metaStart + metaKey.length);
          if (metaOpenPos !== -1) {
            const metaObj = extractBalancedObject(decoded, metaOpenPos) as any;
            if (metaObj) {
              totalResults = metaObj.totalResults || 0;
              pageCount    = metaObj.pageCount    || 0;
              currentPage  = metaObj.currentPage  || currentPage;
            }
          }
        }

        found = true;
        break;
      }
    }

    if (!found) {
      console.error('[Dice-QuickSync] Could not locate job data in response.');
      throw new Error('Could not locate job data in Dice response. Site structure may have changed.');
    }

    const jobs = jobList.map((j: any) => ({
      id:           `dice-${j.id || j.guid}`,
      guid:          j.id   || j.guid,
      title:         j.title       || 'Unknown Title',
      companyName:   j.companyName || 'Unknown Company',
      jobLocation: {
        displayName:
          j.jobLocation?.displayName ||
          [j.jobLocation?.city, j.jobLocation?.state].filter(Boolean).join(', ') ||
          'Remote / USA',
      },
      summary:        j.summary    || '',
      postedDate:     j.postedDate || '',
      detailsPageUrl: j.detailsPageUrl
        ? (j.detailsPageUrl.startsWith('http')
            ? j.detailsPageUrl
            : `https://www.dice.com${j.detailsPageUrl}`)
        : `https://www.dice.com/job-detail/${j.id || j.guid}`,
      employmentType:  j.employmentType,
      workplaceTypes:  j.workplaceTypes  || [],
      isRemote:        j.isRemote || j.workplaceTypes?.includes('Remote') || false,
      salary:          j.salary,
      companyLogoUrl:  j.companyLogoUrl  || j.companyLogoUrlOptimized,
      easyApply:       j.easyApply,
      willingToSponsor: j.willingToSponsor,
    }));

    // --- FILTERING LOGIC ---
    let filteredJobs = jobs;

    if (userEmail) {
      const { excludedTypes } = await adminService.getUserFilters(userEmail);
      
      if (excludedTypes.length > 0) {
        // 1. STRIKE SYSTEM: If the user specifically requested an excluded type via parameters, return empty.
        const requestedEmploymentType = (body.employment_types || []).map((t: string) => t.toLowerCase());
        const hasViolation = excludedTypes.some(type => {
            if (type === 'contract' && requestedEmploymentType.includes('contracts')) return true;
            if (type === 'full-time' && requestedEmploymentType.includes('fulltime')) return true;
            if (type === 'part-time' && requestedEmploymentType.includes('parttime')) return true;
            return false;
        });

        if (hasViolation) {
            return NextResponse.json({ jobs: [], total: 0, meta: { currentPage, totalPages: pageCount, totalResults: 0 } });
        }

        // 2. Result Filtering
        filteredJobs = jobs.filter((j: any) => {
          const type = (j.employmentType || '').toLowerCase();
          const title = (j.title || '').toLowerCase();
          
          return !excludedTypes.some(excluded => {
            // General Keyword Matching
            const isMatch = type.includes(excluded) || 
                           title.includes(`(${excluded})`) || 
                           new RegExp(`\\b${excluded}\\b`, 'i').test(title);
            
            if (isMatch) return true;

            // Specialized Mappings
            if (excluded === 'contract' && (type.includes('contractor') || title.includes('contractor'))) return true;
            if (excluded === 'full-time' && (type.includes('fulltime') || title.includes('fulltime'))) return true;
            
            return false;
          });
        });
      }
    }

    return NextResponse.json({
      jobs: filteredJobs,
      total: userEmail ? filteredJobs.length : totalResults, // Approximate total if filtered
      meta: { 
        currentPage, 
        totalPages: pageCount, 
        totalResults: userEmail ? filteredJobs.length : totalResults 
      },
    });

  } catch (error: any) {
    console.error('[Dice-QuickSync Error]', error);
    return NextResponse.json(
      { error: 'Failed to sync with Dice', details: error.message },
      { status: 500 },
    );
  }
}
