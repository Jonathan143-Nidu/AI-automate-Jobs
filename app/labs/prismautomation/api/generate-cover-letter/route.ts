import { NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/utils/ai-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { resumeText, jd } = await req.json();

        if (!resumeText || !jd) {
            return NextResponse.json(
                { error: 'Missing Resume or JD' },
                { status: 400 }
            );
        }

        const client = getDeepSeekClient();

        const prompt = `
Act as a Candidate's Representative (Employer) sending a profile to Vendors/Recruiters.

GOAL: Submit a candidate whose resume is an EXACT MATCH for the provided Job Description.

KEY POINTS TO CONVEY:
- The candidate possesses 100% of the skills required in the JD.
- The profile is perfectly aligned with the role.
- You are submitting this for immediate consideration.

STRUCTURE:
1. Opening: State clearly that this candidate is an exact match for their [Role Name] requirement.
2. Body Paragraph: Elaborate on the key skills (using **bold** for Skill Names) and how they align with the JD. Mention specific client names where possible.
3. Closing: Reiterate readiness for interview and request immediate feedback.

RULES:
- Length: Approximately 150 words.
- Tone: Professional, confident, and persuasive.
- Output ONLY the email body.

JOB DESCRIPTION:
${jd.slice(0, 5000)}

CANDIDATE RESUME:
${resumeText.slice(0, 5000)}
`;

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
            temperature: 0.6,
        });

        let coverEmail =
            completion.choices[0].message.content ||
            "Failed to generate cover email.";

        // Clean up in case AI adds markdown/code formatting
        coverEmail = coverEmail
            .replace(/```/g, '')
            .replace(/markdown/gi, '')
            .trim();

        return NextResponse.json({ coverLetter: coverEmail });

    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown Error";

        console.error('Cover Email Error:', error);

        return NextResponse.json(
            { error: 'Failed to generate cover email: ' + errorMessage },
            { status: 500 }
        );
    }
}