import { NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/utils/ai-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { candidateName, jobRole, company, recruiterName, context } = await req.json();

        // Construct a prompt for the email
        const prompt = `
        You are an expert career consultant assisting a candidate named "${candidateName}".
        Write a professional, concise, and persuasive email to a recruiter.

        Recruiter Name: ${recruiterName || "Hiring Manager"}
        Target Role: ${jobRole || "Open Position"}
        Company: ${company || "their company"}
        User Context/Instruction: ${context || "Follow up on my application"}

        Output must be in JSON format:
        {
            "subject": "The email subject line",
            "body": "The email body text (plain text, no markdown)"
        }
        `;

        const deepseek = getDeepSeekClient();
        const completion = await deepseek.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        const json = JSON.parse(content || "{}");

        return NextResponse.json(json);

    } catch (error: unknown) {
        console.error("Email Gen Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
