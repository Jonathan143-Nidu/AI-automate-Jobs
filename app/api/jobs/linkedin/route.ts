import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services/admin-service';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      keyword = 'Java Developer', 
      location = 'United States', 
      posted_days = '1', 
      start = 0, 
      currentJobId = null,
      job_type = '' 
    } = body;

    // LinkedIn Time Range (f_TPR) Mapping
    const tprMap: Record<string, string> = {
      '1': 'r86400',   // 24 hours
      '7': 'r604800',  // Past week
      '30': 'r2592000' // Past month
    };
    
    const f_TPR = tprMap[posted_days] || ''; // Default to empty (Any time)
    
    const ALL_TYPES = ['full-time', 'contract', 'part-time', 'internship', 'temporary', 'volunteer'];
    const jtMap: Record<string, string> = {
      'full-time': 'F',
      'contract': 'C',
      'part-time': 'P',
      'internship': 'I',
      'temporary': 'T',
      'volunteer': 'V'
    };
    
    // LinkedIn guest search URL
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    
    // --- AUTH & EXCLUSION SYNC ---
    const session = await auth();
    const userEmail = session?.user?.email;
    let excludedTypes: string[] = [];
    
    if (userEmail) {
      const filters = await adminService.getUserFilters(userEmail);
      excludedTypes = filters.excludedTypes || [];
    }

    // Determine what types to request from LinkedIn
    let targetJT = '';
    if (job_type) {
        // If user specifically picked a type, check if it's allowed
        if (!excludedTypes.includes(job_type.toLowerCase())) {
            targetJT = jtMap[job_type.toLowerCase()] || '';
        } else {
            // Strike system: they requested something blocked
            return NextResponse.json({ jobs: [], total: 0, url: '' });
        }
    } else if (excludedTypes.length > 0) {
        // If user picked "Any", only request non-excluded types
        const allowed = ALL_TYPES.filter(t => !excludedTypes.includes(t));
        targetJT = allowed.map(t => jtMap[t]).filter(Boolean).join(',');
    }

    const variations = [
      "", 
      " Developer", 
      " Engineer", 
      " Software Engineer", 
      " Backend", 
      " Full Stack"
    ];
    
    // Rotate keyword based on the pagination offset (every 50 jobs we rotate)
    const variationIndex = Math.floor(start / 50) % variations.length;
    // If a filter is active, we use a more conservative expansion to maintain strictness
    const effectiveKeyword = job_type ? keyword : (keyword + variations[variationIndex]);
    const baseOffset = start % 50;

    const params = new URLSearchParams({
      keywords: effectiveKeyword,
      location: location,
      f_TPR: f_TPR,
      sortBy: 'DD', // Force chronological order to improve filter reliability
      position: '1',
      pageNum: '0'
    });
    
    if (currentJobId) {
      params.set('currentJobId', currentJobId.toString().replace('li-', ''));
    }

    if (targetJT) {
      params.set('f_JT', targetJT);
    }

    const targetUrl = `${baseUrl}?${params.toString().replace(/\+/g, '%20')}&refineSearch=true`;
    console.log(`[LinkedIn-Direct] SYNCING LIVE: ${targetUrl}`);

    // Fetch two pages of this specific variation
    const pageOffsets = [baseOffset, baseOffset + 25];
    const allJobs: any[] = [];
    const seenIds = new Set<string>();

    try {
      const pageResults = await Promise.all(pageOffsets.map(async (offset) => {
        const pageParams = new URLSearchParams(params);
        pageParams.set('start', offset.toString());
        const pageUrl = `${baseUrl}?${pageParams.toString().replace(/\+/g, '%20')}&refineSearch=true`;
        
        const res = await fetch(pageUrl, {
          cache: 'no-store',
          redirect: 'follow', // Ensure we follow any LinkedIn internal redirects
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/',
          }
        });

        if (!res.ok) return '';
        return await res.text();
      }));

      for (const html of pageResults) {
        if (!html) continue;
        const cards = html.split('</li>');
        
        for (const cardHtml of cards) {
          const idMatch = cardHtml.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/);
          if (!idMatch) continue;
          
          const jobId = idMatch[1];
          if (seenIds.has(jobId)) continue;
          seenIds.add(jobId);
          
          const titleMatch = cardHtml.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h3>/) ||
                             cardHtml.match(/<span class="sr-only">([\s\S]*?)<\/span>/);
          const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Software Engineer';
          
          const companyMatch = cardHtml.match(/<a[^>]*class="[^"]*hidden-nested-link[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/a>/) ||
                               cardHtml.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h4>/);
          let company = companyMatch ? companyMatch[1].replace(/<[^>]*>/g, '').trim() : 'Technology Company';
          
          const locationMatch = cardHtml.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/span>/);
          const jobLocation = locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : location;
          
          const applyUrl = `https://www.linkedin.com/jobs/view/${jobId}`;
          const dateMatch = cardHtml.match(/<time[^>]*>([\s\S]*?)<\/time>/);
          const postedAt = dateMatch ? dateMatch[1].replace(/<[^>]*>/g, '').trim() : 'Recently';

          allJobs.push({
            id: `li-${jobId}`,
            title,
            company,
            location: jobLocation,
            description: `Verified individual posting found on LinkedIn (Direct Sync).`,
            postedAt,
            applyUrl,
            source: 'LinkedIn Direct',
            isRemote: /remote/i.test(title + cardHtml),
            salary: null,
            thumbnail: null
          });
        }
      }
    } catch (err) {
      console.error('[LinkedIn Scraper Pagination Error]', err);
    }

    console.log(`[LinkedIn-Direct] Final Deduplicated Count for start ${start}: ${allJobs.length}`);

    // --- FILTERING LOGIC ---
    let filteredJobs = allJobs;

    if (userEmail) {
      const { excludedTypes } = await adminService.getUserFilters(userEmail);
      
      if (excludedTypes.length > 0) {
        // 1. STRIKE SYSTEM: If the user specifically requested an excluded type via parameters, return empty.
        const currentJobType = job_type?.toLowerCase();
        if (currentJobType && excludedTypes.includes(currentJobType)) {
          return NextResponse.json({ jobs: [], total: 0, url: targetUrl });
        }
        
        // 2. Result Filtering
        filteredJobs = allJobs.filter((j: any) => {
          const title = (j.title || '').toLowerCase();
          
          return !excludedTypes.some(excluded => {
            // Check for explicit keyword in title with word boundaries
            // e.g. "Software Engineer (Contract)" or "Internship Role"
            const isMatch = title.includes(`(${excluded})`) || 
                           new RegExp(`\\b${excluded}\\b`, 'i').test(title);
            
            if (isMatch) return true;

            // Specialized mapping for variations
            if (excluded === 'contract' && title.includes('contractor')) return true;
            if (excluded === 'full-time' && title.includes('fulltime')) return true;
            
            return false;
          });
        });
      }
    }

    return NextResponse.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      url: targetUrl
    });

  } catch (error: unknown) {
    console.error('[LinkedIn Scraper Error]', error);
    return NextResponse.json({ 
      error: 'Failed to scrape LinkedIn', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
