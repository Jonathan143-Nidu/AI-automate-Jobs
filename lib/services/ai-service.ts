/**
 * AI Service - Handles all DeepSeek AI operations
 */

import { getDeepSeekClient } from '@/utils/ai-client';
import { getAnalyzePrompt } from '@/lib/prompts/analyze-prompt';
import { getIntegratePrompt } from '@/lib/prompts/integrate-prompt';
import { AnalysisResult, IntegrationResult } from '@/lib/types/resume.types';
import { AppError } from '@/lib/utils/error-handler';
import { ERROR_MESSAGES } from '@/lib/constants/messages';

export class AIService {
    private get client() {
        return getDeepSeekClient();
    }

    /**
     * Analyze resume against job description
     */
    async analyzeResume(jd: string, resumeText: string): Promise<ReadableStream> {
        const prompt = getAnalyzePrompt(jd, resumeText);
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            start: async (controller) => {
                try {
                    const completion = await this.client.chat.completions.create({
                        messages: [{ role: 'user', content: prompt }],
                        model: 'deepseek-chat',
                        stream: true,
                        temperature: 0.0,
                        response_format: { type: 'json_object' },
                    });

                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        controller.enqueue(encoder.encode(content));
                    }

                    controller.close();
                } catch (error: any) {
                    console.error("DeepSeek Analyze API Error:", error?.response?.data || error);
                    const errorMsg = error?.response?.data?.error?.message || error?.message || String(error);
                    
                    // Gracefully send error as JSON down the stream instead of killing the TCP connection
                    const errorPayload = JSON.stringify({ error: `AI API Error: ${errorMsg}` });
                    controller.enqueue(encoder.encode(errorPayload));
                    controller.close();
                }
            }
        });

        return stream;
    }

    /**
     * Integrate missing skills into resume
     */
    async integrateSkills(
        resumeText: string,
        missingSkills: string[],
        jd: string
    ): Promise<IntegrationResult> {
        const prompt = getIntegratePrompt(resumeText, missingSkills, jd);

        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'deepseek-chat',
                temperature: 0.0,
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0].message.content || '{}';

            // Robust JSON extraction
            let cleanContent = content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            } else {
                cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            }

            try {
                return JSON.parse(cleanContent) as IntegrationResult;
            } catch (parseError) {
                console.error("AI Skill Integration Parse Error. Raw Content:", content);
                throw new AppError('PARSE_ERROR', ERROR_MESSAGES.AI_RESPONSE_INVALID, 500, {
                    rawContent: content,
                    parseError
                });
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('AI_ERROR', ERROR_MESSAGES.AI_REQUEST_FAILED, 500, error);
        }
    }

    /**
     * Generate cover letter based on analysis
     */
    async generateCoverLetter(
        candidateName: string,
        jd: string,
        analysisResult: AnalysisResult
    ): Promise<string> {
        const prompt = `
You are a professional cover letter writer.

Candidate: ${candidateName}
Job Description: ${jd}
Match Percentage: ${analysisResult.match_percentage}%

Write a compelling cover letter that:
1. Highlights the candidate's ${analysisResult.match_percentage}% match
2. Addresses the role requirements
3. Is professional and concise (300-400 words)
4. Shows enthusiasm for the position

Return ONLY the cover letter text, no JSON.
`;

        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'deepseek-chat',
            });

            return completion.choices[0].message.content || '';
        } catch (error) {
            throw new AppError('AI_ERROR', 'Failed to generate cover letter', 500, error);
        }
    }

    /**
     * Extract skills and suggest job roles based on resume text
     */
    async extractProfileFeatures(resumeText: string): Promise<{ 
        skills: string[], 
        suggestedRoles: string[],
        personalInfo?: {
            firstName?: string;
            lastName?: string;
            role?: string;
            location?: string;
            phone?: string;
            linkedinURL?: string;
            bachelorDegree?: string;
            masterDegree?: string;
        }
    }> {
        const prompt = `
You are an expert technical recruiter and career coach.
Analyze the following resume text and identify:
1. "skills": A comprehensive array of all technical, soft, and domain skills present in the resume.
2. "suggestedRoles": An array of 5 to 10 optimal, highly-searchable modern job role titles that the candidate is qualified for.
3. "personalInfo": Extract the following identity and contact details:
   - firstName
   - lastName
   - role (The candidate's current or most relevant professional title)
   - location (City and State/Country)
   - phone
   - linkedinURL
   - bachelorDegree (Highest relevant Bachelor's degree)
   - masterDegree (Highest relevant Master's or higher degree)

Return ONLY a valid JSON object. Do not include any text before or after the JSON.
If a field is not found in the resume, set it to an empty string "".

Format:
{
  "skills": ["string"],
  "suggestedRoles": ["string"],
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "role": "string",
    "location": "string",
    "phone": "string",
    "linkedinURL": "string",
    "bachelorDegree": "string",
    "masterDegree": "string"
  }
}

Resume Text:
${resumeText}
`;

        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'deepseek-chat',
                temperature: 0.1,
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0].message.content || '{}';
            
            // Robust JSON extraction
            let cleanContent = content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            } else {
                cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            }

            return JSON.parse(cleanContent);
        } catch (error) {
            console.error("AI Profile Extraction Error:", error);
            throw new AppError('AI_ERROR', 'Failed to extract profile features', 500, error);
        }
    }
}

// Export singleton instance
export const aiService = new AIService();
