import React from 'react';
import { getErrorMessage } from '../lib/utils/file-utils';
import { useBuilderState } from './useBuilderState';

export const useAnalysisLogic = (state: ReturnType<typeof useBuilderState>) => {
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const {
        jd, resumeText, setAnalysisResult, setChanges, setIsNewCandidate, isNewCandidate,
        setStep, setMobileView, setRawAiResponse, setIsAnalyzing, setInitialScore, addLog,
        setIsExtracting, setJobDetails
    } = state;

    const cancelAnalysis = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            addLog('Analysis Canceled.', 'info');
        }
    };

    const extractJd = async (mode: 'full' | 'contact_only' = 'full') => {
        if (!jd) return;
        if (mode === 'full') setIsExtracting(true);

        addLog(mode === 'full' ? 'Cleaning and extracting JD...' : 'Scanning for Recruiter Contact...', 'info');

        // 1. INSTANT CLIENT-SIDE REGEX (Fastest possible check)
        const emailRegex = /[\w.-]+@[\w.-]+\.[\w]{2,}/gi;
        const localMatches = jd.match(emailRegex);
        const localEmail = (localMatches && localMatches.length > 0) ? localMatches[0] : null;

        const nameRegex = /(?:Regards|Best|Sincerely|Cheers|Thanks|Name|Contact),\s*([A-Za-z]+(?:\s[A-Za-z]+)?)/i;
        const nameMatch = jd.match(nameRegex);
        const localName = (nameMatch && nameMatch[1]) ? nameMatch[1] : null;

        if (localEmail || localName) {
            state.setRecruiterDetails((prev: { name: string | null; email: string | null }) => ({
                name: localName || prev.name,
                email: localEmail || prev.email
            }));
        }

        try {
            const res = await fetch('/api/extract-jd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: jd, mode })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // 1. Update Job Details
            if (data.job_role || data.location || data.rate || data.job_type || data.work_style) {
                setJobDetails({
                    role: data.job_role || null,
                    location: data.location || null,
                    rate: data.rate || null,
                    jobType: data.job_type || null,
                    workStyle: data.work_style || null
                });
            }

            // Update Recruiter Details
            state.setRecruiterDetails((prev: { name: string | null; email: string | null }) => ({
                name: data.recruiter_name || localName || prev.name,
                email: data.recruiter_email || localEmail || prev.email
            }));

            const foundName = data.recruiter_name || localName;
            const foundEmail = data.recruiter_email || localEmail;

            addLog(`Recruiter Found: ${foundName || 'Name Unknown'} | ${foundEmail || 'Email Unknown'}`, 'success');
        } catch (err: unknown) {
            if (mode === 'full') {
                addLog('Extraction Failed', 'error', getErrorMessage(err));
            } else {
                console.warn("Auto-contact extraction failed:", err);
            }
        } finally {
            if (mode === 'full') setIsExtracting(false);
        }
    };

    const startAnalysis = async () => {
        if (isNewCandidate) {
            setAnalysisResult(null);
            setChanges([]);
            addLog('--- STARTING NEW CANDIDATE ANALYSIS ---', 'info');
            setIsNewCandidate(false);
        }

        if (!jd || !resumeText) {
            addLog('Validation Warning: Missing JD or Resume', 'error');
            return;
        }

        setIsAnalyzing(true);
        setStep('analysis');
        setMobileView('preview');
        setRawAiResponse('// STREAMING ACTIVATED...\n// Waiting for Neural Engine response...');
        addLog('Starting Innov-AI Core Analysis...', 'info');

        // 1. Initialize AbortController for cancellation
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        extractJd('contact_only').catch(err => console.error("Auto-extraction failed:", err));

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jd, resumeText }),
                signal // Attach the signal to the fetch
            });

            if (!res.body) throw new Error("No response body received");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            setRawAiResponse('// STREAM CONNECTED. RECEIVING DATA...\n');

            while (true) {
                // Check if aborted before reading the next chunk
                if (signal.aborted) {
                    addLog('Analysis aborted by user.', 'info');
                    break;
                }

                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                resultText += chunk;
                setRawAiResponse((prev: string | null) => (prev || '') + chunk);
            }

            // If we aborted, don't proceed to parsing or state updates
            if (signal.aborted) return;

            addLog('Stream Complete. Parsing Intelligence Report...', 'info');

            // Robust JSON extraction helper
            const cleanAndParseJSON = (text: string) => {
                // 1. Try passing the raw text first (best case)
                try {
                    return JSON.parse(text);
                } catch { }

                // 2. Extract JSON block (between first { and last })
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error("No JSON object found in response");
                }

                let candidate = jsonMatch[0];

                // 3. Remove markdown code blocks if present
                candidate = candidate
                    .replace(/```json\n?|\n?```/g, '')
                    .trim();

                try {
                    return JSON.parse(candidate);
                } catch (e) {
                    // 4. LAST RESORT: Attempt to repair common AI JSON errors
                    // This is "best effort" and handles unquoted keys, trailing commas, single quotes
                    try {
                        let fixed = candidate
                            // Quote unquoted keys: { key: value } -> { "key": value }
                            .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                            // Replace single quotes with double quotes (be careful with content text)
                            // This is risky for content containing apostrophes, so we skip it or use a smarter regex if needed.
                            // For now, let's just fix trailing commas which is common.
                            .replace(/,\s*}/g, '}')
                            .replace(/,\s*]/g, ']');

                        return JSON.parse(fixed);
                    } catch (finalErr) {
                        // Throw the original error from the cleanest attempt to avoid confusing "repair" errors
                        throw e;
                    }
                }
            };

            let jsonData;
            try {
                jsonData = cleanAndParseJSON(resultText);
            } catch (parseErr: unknown) {
                const message = parseErr instanceof Error ? parseErr.message : "Unknown error";
                // Log the confusing text for debugging
                console.error("AI Analysis Parse Error.", parseErr);
                console.log("--- FAILED JSON CONTENT ---\n", resultText, "\n---------------------------");
                throw new Error(`Failed to parse analysis report. The AI response was not valid JSON. Details: ${message}`);
            }

            if (jsonData.error) throw new Error(jsonData.error);
            addLog('Analysis Parsed Successfully', 'success');
            setInitialScore(jsonData.match_percentage);
            setAnalysisResult(jsonData);

            // AUTO-UPDATE SHEET with Candidate Name
            // We use the name from the Resume Analysis or the generic "Consultant" string if missing
            const candidateName = jsonData.candidate_name || state.importedFileName?.replace(/\.[^/.]+$/, "") || "Unknown Candidate";

            // Check if we have enough info to identify the row (Email + Role)
            const recruiterEmail = state.recruiterDetails?.email;
            const jobRole = state.jobDetails?.role;

            if (recruiterEmail && jobRole) {
                // Feature decommissioned: No longer updating leads sheet
                console.log("Candidate extracted locally:", candidateName);
            }
        } catch (err: unknown) {
            addLog('Analysis Failed', 'error', getErrorMessage(err));
            setRawAiResponse(`// ERROR:\n${getErrorMessage(err)}`);
            alert('Analysis failed: ' + getErrorMessage(err));
        } finally {
            setIsAnalyzing(false);
        }
    };

    return {
        extractJd,
        startAnalysis,
        cancelAnalysis
    };
};
