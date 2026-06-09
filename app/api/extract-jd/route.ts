import { NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/utils/ai-client';
import { getExtractJDPrompt, getContactInfoPrompt } from '@/lib/prompts/extract-jd-prompt';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { text, mode, source, link, candidateName } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const deepseek = getDeepSeekClient();
        const isContactOnly = mode === 'contact_only';
        const systemPrompt = isContactOnly ? getContactInfoPrompt(text) : getExtractJDPrompt(text);

        const completion = await deepseek.chat.completions.create({
            messages: [{ role: "user", content: systemPrompt }],
            model: "deepseek-chat",
            temperature: 0.1,
        });

        const rawContent = completion.choices[0]?.message?.content || "{}";
        console.log(`DeepSeek Raw Content (Mode: ${mode || 'full'}):`, rawContent);
        let parsedData;

        try {
            // Robust JSON extraction: Find first { and last }
            const jsonStart = rawContent.indexOf('{');
            const jsonEnd = rawContent.lastIndexOf('}');

            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = rawContent.substring(jsonStart, jsonEnd + 1);
                parsedData = JSON.parse(jsonStr);
            } else {
                if (isContactOnly) throw new Error("No JSON in contact extraction");
                throw new Error("No JSON object found in response");
            }
        } catch (e) {
            console.error("Failed to parse JD JSON:", e);
            // Fallback: If JSON fails, treat the whole content as the cleaned JD
            parsedData = {
                cleaned_jd: rawContent.replace(/```json/g, '').replace(/```/g, ''),
                recruiter_name: null,
                recruiter_email: null
            };
        }

        // Sheet logging side-effect removed for local/stable mode

        return NextResponse.json({
            // If contact only, do NOT return cleaned_jd (keep original on client)
            cleaned_jd: isContactOnly ? undefined : (parsedData.cleaned_jd || ""),
            job_role: parsedData.job_role || null,
            location: parsedData.location || null,
            rate: parsedData.rate || null,
            job_type: parsedData.job_type || null,
            work_style: parsedData.work_style || null,
            recruiter_name: parsedData.recruiter_name || null,
            recruiter_email: parsedData.recruiter_email || null,
            recruiter_phone: parsedData.recruiter_phone || null,
            sheet_id: null // Explicitly null as sheets integration is decommissioned
        });

    } catch (error: unknown) {
        console.error("Extraction Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
