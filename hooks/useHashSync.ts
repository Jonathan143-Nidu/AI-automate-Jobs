import { useEffect, useRef } from 'react';
import { useBuilderState } from './useBuilderState';
import { useSession } from 'next-auth/react';

export const useHashSync = (state: ReturnType<typeof useBuilderState>) => {
    const { data: session, status } = useSession();
    const {
        addLog, setIsAutoPilot, setStep, setJd, setIsExtracting, setResumeText,
        setImportedFileName, setFile, setFileType, setAnalysisResult,
        setInitialScore, setShouldAutoTrigger, setThreadId, setThreadMetadata,
        setRecruiterDetails, setJobDetails
    } = state;

    const hasProcessedHash = useRef(false);

    useEffect(() => {
        const handleHashParams = async () => {
            if (hasProcessedHash.current) return;
            hasProcessedHash.current = true;

            const hash = window.location.hash.substring(1);
            if (!hash) return;

            const params = new URLSearchParams(hash);
            const jdParam = params.get('jd');
            const resumeLink = params.get('resumeLink');
            const resumeName = params.get('name');
            const autopilot = params.get('autopilot') === 'true';
            const skipAnalysis = params.get('skipAnalysis') === 'true';
            const dataKey = params.get('dataKey');
            const threadId = params.get('threadId');

            if (threadId) {
                setThreadId(threadId);
            }

            if (resumeLink && resumeName) {
                addLog(`Auto-selecting candidate: ${decodeURIComponent(resumeName)}`, 'info');
                try {
                    const res = await fetch('/api/drive/generate-resume', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            folderUrl: decodeURIComponent(resumeLink),
                            consultantName: decodeURIComponent(resumeName)
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        setResumeText(data.text);
                        setImportedFileName(data.fileName);
                        if (data.fileData) {
                            try {
                                const byteCharacters = atob(data.fileData);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                                const file = new File([blob], data.fileName, { type: blob.type });
                                setFile(file);
                                setFileType('docx');
                            } catch (e) { console.error(e); }
                        }
                    }
                } catch { addLog('Auto-import failed', 'error'); }
            }

            if (skipAnalysis && dataKey) {
                const found = localStorage.getItem(dataKey);
                if (found) {
                    try {
                        const parsedData = JSON.parse(found);
                        setAnalysisResult(parsedData);
                        setInitialScore(parsedData.match_percentage);
                        setStep('analysis');
                        if (autopilot) {
                            setIsAutoPilot(true);
                            setShouldAutoTrigger(true);
                        }
                    } catch (_e) {
                        console.error("Failed to parse batch data", _e);
                        addLog('Failed to load batch analysis data', 'error');
                    }
                }
            }
            else if (autopilot) {
                setIsAutoPilot(true);
                addLog('🚀 Auto-Pilot Mode Initiated', 'success');
            }

            const source = params.get('source') || 'Web';
            const link = params.get('link') || '';

            if (jdParam) {
                if (jdParam.length > 500) {
                    setIsExtracting(true);
                    setJd("✨ AI is extracting the Job Description...");
                    try {
                        const res = await fetch('/api/extract-jd', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: jdParam,
                                source: source,
                                link: link,
                                candidateName: resumeName // Pass the candidate name if available
                            })
                        });
                        const data = await res.json();

                        // 1. Capture Recruiter Details immediately
                        if (data.recruiter_email || data.recruiter_name) {
                            setRecruiterDetails(prev => ({
                                name: data.recruiter_name || prev.name,
                                email: data.recruiter_email || prev.email
                            }));
                        }

                        // 2. Capture Job Details immediately
                        if (data.job_role || data.location || data.rate || data.job_type || data.work_style) {
                            setJobDetails({
                                role: data.job_role || null,
                                location: data.location || null,
                                rate: data.rate || null,
                                jobType: data.job_type || null,
                                workStyle: data.work_style || null
                            });
                        }

                        setJd(jdParam);
                        console.log("Deep Extraction results:", data);
                    } catch { setJd(jdParam); }
                    finally { setIsExtracting(false); }
                } else {
                    setJd(jdParam);
                }
            }

            window.history.replaceState(null, '', window.location.pathname);
        };

        handleHashParams();
    }, [addLog, setRecruiterDetails, setThreadMetadata, setAnalysisResult, setFile, setFileType, setImportedFileName, setInitialScore, setIsAutoPilot, setIsExtracting, setJd, setResumeText, setShouldAutoTrigger, setStep, setThreadId, setJobDetails]);

    // Dedicated Thread Metadata Fetcher
    useEffect(() => {
        // Only fetch if:
        // 1. User is authenticated
        // 2. We have a threadId
        // 3. We haven't already fetched metadata for THIS specific threadId
        const needsFetch = state.threadId &&
            status === 'authenticated' &&
            state.threadMetadata?.threadId !== state.threadId;

        if (needsFetch) {
            const fetchMetadata = async () => {
                console.log('🔍 Starting Metadata Fetch for Thread:', state.threadId);
                try {
                    const res = await fetch('/api/email/thread-metadata', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            threadId: state.threadId,
                            accessToken: (session as { accessToken?: string })?.accessToken
                        })
                    });

                    if (res.ok) {
                        const metadata = await res.json();
                        console.log('🔍 Metadata Received:', metadata);

                        // IMPORTANT: Set metadata before logging to ensure next render 
                        // sees state.threadMetadata.threadId === state.threadId
                        setThreadMetadata(metadata);

                        // Auto-fill recruiter details from thread
                        if (metadata.recruiterEmail || metadata.recruiterName) {
                            setRecruiterDetails({
                                name: metadata.recruiterName || null,
                                email: metadata.recruiterEmail || null
                            });
                        }

                        addLog(`Connected to Gmail thread: ${metadata.subject}`, 'success');
                    } else {
                        console.error('🔍 Metadata Fetch Failed Status:', res.status);
                    }
                } catch (_e) {
                    console.error('🔍 Fetch Error:', _e);
                }
            };
            fetchMetadata();
        }
    }, [state.threadId, status, session, state.threadMetadata?.threadId, addLog, setRecruiterDetails, setThreadMetadata]);
};
