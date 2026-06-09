import { NextResponse } from 'next/server';
import { validateRequired } from '@/lib/utils/validators';
import { handleAPIError } from '@/lib/utils/error-handler';
import { aiService } from '@/lib/services/ai-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate inputs
    const jd = validateRequired(body.jd, 'Job description');
    const resumeText = validateRequired(body.resumeText, 'Resume text');

    // Use AI service to analyze resume
    const stream = await aiService.analyzeResume(jd, resumeText);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorResponse = handleAPIError(error);
    return NextResponse.json(
      { error: errorResponse.error, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}
