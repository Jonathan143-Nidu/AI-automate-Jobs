import { NextResponse } from 'next/server';
import { validateRequired, validateStringArray } from '@/lib/utils/validators';
import { handleAPIError } from '@/lib/utils/error-handler';
import { aiService } from '@/lib/services/ai-service';
import { resumeService } from '@/lib/services/resume-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate inputs
    const resumeText = validateRequired(body.resumeText, 'Resume text');
    const missingSkills = validateStringArray(body.missingSkills, 'Missing skills');
    const jd = validateRequired(body.jd, 'Job description');
    const jobRole = body.jobRole;
    const jobLocation = body.jobLocation;
    const recruiterEmail = body.recruiterEmail;

    // Use AI service to integrate skills
    const result = await aiService.integrateSkills(resumeText, missingSkills, jd);

    // Save to history (non-blocking)
    const candidateName = result.candidate_name || 'Unknown Candidate';
    await resumeService.saveToHistory(candidateName, jd, missingSkills, result, jobRole, jobLocation, recruiterEmail);

    return NextResponse.json(result);

  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}
