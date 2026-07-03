import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const USAJOBS_DAYS_MAP: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '7': 7, '10': 10, '15': 15, '30': 30,
};

interface USAJobsItem {
  MatchedObjectDescriptor: {
    PositionID: string; PositionTitle: string; OrganizationName: string;
    DepartmentName: string; PositionLocationDisplay: string;
    PublicationStartDate: string; ApplicationCloseDate: string;
    PositionURI: string; ApplyURI?: string[];
    JobGrade?: Array<{ Code: string }>; PositionSchedule?: Array<{ Name: string }>;
    PositionType?: Array<{ Name: string }>;
    PositionRemuneration?: Array<{ MinimumRange: string; MaximumRange: string; RateIntervalCode: string }>;
    SecurityClearance?: Array<{ Name: string }>; PromotionPotential?: string;
    UserArea?: { Details?: { JobSummary?: string } };
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword = '', location = '', pay_grade = '', employment_type = '',
            agency = '', remote = false, page = 1, results_per_page = 10,
            posted_days = '7' } = body;

    const apiKey    = process.env.USAJOBS_API_KEY;
    const userAgent = process.env.USAJOBS_USER_AGENT || 'airesume.innovcentric.com';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'USAJOBS_API_KEY not set in .env — register free at developer.usajobs.gov' },
        { status: 500 }
      );
    }

    const url = new URL('https://data.usajobs.gov/api/search');
    if (keyword.trim()) url.searchParams.set('Keyword', keyword.trim());
    url.searchParams.set('LocationName', location.trim() || 'United States');
    url.searchParams.set('Page', String(page));
    url.searchParams.set('ResultsPerPage', String(results_per_page));
    url.searchParams.set('SortField', 'OpenDate');
    url.searchParams.set('SortDirection', 'Desc');
    url.searchParams.set('DatePosted', String(USAJOBS_DAYS_MAP[String(posted_days)] || 7));

    const typeMap: Record<string, string> = {
      FULLTIME: 'Full-Time', PARTTIME: 'Part-Time',
      INTERN: 'Internships', TEMPORARY: 'Temporary', CONTRACTOR: 'Term',
    };
    if (employment_type && typeMap[employment_type]) url.searchParams.set('PositionSchedule', typeMap[employment_type]);
    if (pay_grade) { url.searchParams.set('PayGradeLow', pay_grade); url.searchParams.set('PayGradeHigh', pay_grade); }
    if (agency.trim()) url.searchParams.set('Organization', agency.trim());
    if (remote) url.searchParams.set('RemoteIndicator', 'True');

    const res = await fetch(url.toString(), {
      headers: {
        'Host':              'data.usajobs.gov',
        'User-Agent':        userAgent,
        'Authorization-Key': apiKey,
      },
    });

    if (res.status === 401) {
      return NextResponse.json(
        { error: 'USAJobs API key invalid or missing. Register free at developer.usajobs.gov → add USAJOBS_API_KEY to .env' },
        { status: 401 }
      );
    }
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `USAJobs ${res.status}: ${t.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const items = data?.SearchResult?.SearchResultItems || [];
    const total = data?.SearchResult?.SearchResultCountAll || 0;

    const jobs = items.map((item: USAJobsItem) => {
      const job = item.MatchedObjectDescriptor;
      const salaryMin = job.PositionRemuneration?.[0]?.MinimumRange;
      const salaryMax = job.PositionRemuneration?.[0]?.MaximumRange;
      const salaryType = job.PositionRemuneration?.[0]?.RateIntervalCode;
      return {
        id: job.PositionID, title: job.PositionTitle, agency: job.OrganizationName,
        department: job.DepartmentName, location: job.PositionLocationDisplay,
        openDate: job.PublicationStartDate, closeDate: job.ApplicationCloseDate,
        salary: formatSalary(salaryMin, salaryMax, salaryType),
        payGrade: job.JobGrade?.[0]?.Code || null,
        employmentType: job.PositionSchedule?.[0]?.Name || null,
        appointmentType: job.PositionType?.[0]?.Name || null,
        applyUrl: job.ApplyURI?.[0] || job.PositionURI,
        detailsUrl: job.PositionURI,
        duties: job.UserArea?.Details?.JobSummary,
        clearanceRequired: job.SecurityClearance?.[0]?.Name || 'Not specified',
        promotionPotential: job.PromotionPotential,
        remote: job.PositionLocationDisplay?.toLowerCase().includes('remote') || false,
      };
    });

    return NextResponse.json({ jobs, total, page, results_per_page, source: 'USAJobs (Federal)' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Search failed: ${message}` }, { status: 500 });
  }
}

function formatSalary(min?: string, max?: string, type?: string): string | null {
  if (!min) return null;
  const fmt = (n: string) => `$${parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const range = max && max !== min ? `${fmt(min)} – ${fmt(max)}` : `${fmt(min)}`;
  const suffix = type === 'Per Hour' ? '/hr' : type === 'Per Year' ? '/yr' : '';
  return `${range}${suffix}`;
}
