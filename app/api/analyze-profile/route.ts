import { NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { handleAPIError } from '@/lib/utils/error-handler';
import { validateRequired } from '@/lib/utils/validators';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Validate input
        const resumeText = validateRequired(body.resumeText, 'Resume text');

        // Use AI service to analyze resume for skills and suggested search roles
        const profileFeatures = await aiService.extractProfileFeatures(resumeText);

        return NextResponse.json(profileFeatures);
    } catch (error) {
        const errorResponse = handleAPIError(error);
        return NextResponse.json(
            { error: errorResponse.error, code: errorResponse.code },
            { status: errorResponse.statusCode }
        );
    }
}
