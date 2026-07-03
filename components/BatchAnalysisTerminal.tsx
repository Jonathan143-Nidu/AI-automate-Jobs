'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2, FileText, Zap } from 'lucide-react';

interface Candidate {
    name: string;
    link: string;
    type: string;
}

interface Props {
    candidate: Candidate;
    jd: string;
}

export default function BatchAnalysisTerminal({ candidate, jd }: Props) {
    const [status, setStatus] = useState<'fetching' | 'analyzing' | 'done' | 'error'>('fetching');
    const [logs, setLogs] = useState<string[]>([]);
    const [matchScore, setMatchScore] = useState<number>(0);
    const [missingSkills, setMissingSkills] = useState<string[]>([]);
    const [executiveSummary, setExecutiveSummary] = useState<string>('');
    const [analysisSummary, setAnalysisSummary] = useState<string>('');
    const [resumeName, setResumeName] = useState<string>('');
    const [useAutoPilot, setUseAutoPilot] = useState(true);

    // Safety ref to prevent double execution
    const hasStartedRef = useRef(false);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-8), `> ${msg}`]);
    };

    const runAnalysis = useCallback(async (resumeText: string) => {
        try {
            const response = await fetch('/labs/prismautomation/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jd, resumeText }),
            });

            if (!response.ok || !response.body) throw new Error('Analysis API failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';

            addLog('AI Stream Connected. Analyzing...');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                // Periodic "Thinking" update
                if (accumulatedText.length % 50 === 0 && Math.random() > 0.85) {
                    addLog('Verifying technical competency...');
                }
            }

            try {
                const parsed = JSON.parse(accumulatedText);
                setMatchScore(parsed.match_percentage);
                setMissingSkills(parsed.missing_skills || []);
                setExecutiveSummary(parsed.executive_summary || '');
                setAnalysisSummary(parsed.analysis_summary || '');
                setStatus('done');
                addLog('Analysis Complete.');
            } catch (e) {
                console.error("JSON Parse Error", e);
                const scoreMatch = accumulatedText.match(/"match_percentage":\s*(\d+)/);
                if (scoreMatch) setMatchScore(parseInt(scoreMatch[1]));
                setStatus('done');
            }

        } catch (e: unknown) {
            setStatus('error');
            const errorMsg = e instanceof Error ? e.message : 'Analysis failed';
            addLog(`Analysis Error: ${errorMsg}`);
        }
    }, [jd]);

    const startProcess = useCallback(async () => {
        try {
            // 1. Fetch Resume
            addLog(`Connecting to Drive...`); // Clean log
            const res = await fetch('/labs/prismautomation/api/drive/generate-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderUrl: candidate.link, consultantName: candidate.name })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch resume');

            setResumeName(data.fileName);
            addLog(`Resume Loaded: ${data.fileName}`);

            // 2. Start Analysis
            setStatus('analyzing');
            addLog('Starting AI Analysis...');

            await runAnalysis(data.text);

        } catch (e: unknown) {
            setStatus('error');
            const errorMsg = e instanceof Error ? e.message : 'Unknown error';
            addLog(`Error: ${errorMsg}`);
        }
    }, [candidate.link, candidate.name, runAnalysis]);

    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;
        startProcess();
    }, [startProcess]);

    const handleAction = () => {
        const encodedName = encodeURIComponent(candidate.name);
        const encodedLink = encodeURIComponent(candidate.link);
        const encodedJd = encodeURIComponent(jd);

        let url = `/#jd=${encodedJd}&resumeLink=${encodedLink}&name=${encodedName}&source=Batch Analysis Engine`;

        // STORAGE-BASED DATA TRANSFER (Prevents URL Overflow)
        // 1. Generate a unique key
        const dataKey = `batch_data_${Date.now()}`;

        // 2. Prepare Payload
        const payload = JSON.stringify({
            match_percentage: matchScore,
            missing_skills: missingSkills,
            executive_summary: executiveSummary,
            analysis_summary: analysisSummary
        });

        // 3. Save to LocalStorage (Shared Domain)
        try {
            localStorage.setItem(dataKey, payload);
        } catch (e) {
            console.error("Storage Error", e);
            alert("Storage full or disabled. Cannot transfer analysis to Editor.");
            return;
        }

        // 4. Pass Key in URL
        url += `&skipAnalysis=true&dataKey=${dataKey}`;

        // Only trigger Auto-Optimization if the toggle is ON
        if (useAutoPilot) {
            url += `&autopilot=true`;
        }

        window.open(url, '_blank');
    };

    return (
        <div className={`h-[340px] rounded-xl border relative flex flex-col transition-all duration-300 bg-white group/card ${status === 'done' ? 'border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200' : 'border-gray-200'}`}>

            {/* Header */}
            <div className={`p-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${status === 'done' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                        {candidate.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className={`font-bold text-sm text-gray-900 truncate max-w-[150px]`}>{candidate.name}</h3>
                        <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">
                            {status === 'error' ? 'Analysis Failed' : resumeName || 'Queued...'}
                        </p>
                    </div>
                </div>
                {status === 'analyzing' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                {status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>

            {/* Content: Terminal View */}
            {status !== 'done' && (
                <div className="flex-1 p-4 font-mono text-[10px] text-gray-500 overflow-y-auto space-y-1.5 bg-gray-50/30 scrollbar-thin scrollbar-thumb-gray-200">
                    {logs.map((log, i) => (
                        <div key={i} className={`border-l-2 pl-2 transition-all duration-500 animate-in fade-in slide-in-from-left-1 ${log.includes('Error') ? 'border-red-400 text-red-600 bg-red-50/50 py-1' :
                            log.includes('Complete') ? 'border-emerald-400 text-emerald-600' : 'border-gray-200'
                            }`}>
                            {log.replace('Connecting to Drive...', 'Connecting to Cloud Storage...')}
                        </div>
                    ))}
                    {status === 'fetching' && <div className="text-gray-300 text-[9px] italic">Waiting for connection...</div>}
                </div>
            )}

            {/* Content: Result Card View */}
            {status === 'done' && (
                <div className="flex-1 p-4 flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-300">

                    {/* Score Header */}
                    <div className="flex items-end gap-2 mb-4 shrink-0">
                        <div className={`text-4xl font-extrabold tracking-tight ${matchScore > 75 ? 'text-emerald-500' : matchScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {matchScore}%
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">Match Score</div>

                        {/* Auto-Pilot Toggle */}
                        <div className="ml-auto flex items-center gap-2 bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                            <span className="text-[9px] font-bold text-gray-400 pl-1 uppercase tracking-tight">Auto-Pilot</span>
                            <button
                                onClick={() => setUseAutoPilot(!useAutoPilot)}
                                className={`w-8 h-4 rounded-full transition-colors relative ${useAutoPilot ? 'bg-indigo-500' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${useAutoPilot ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Compact Missing Skills List */}
                    <div className="flex-1 flex flex-col min-h-0 mb-3">
                        <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5 shrink-0">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            <span>Missing Critical Skills ({missingSkills.length})</span>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-gray-100 hover:scrollbar-thumb-gray-200 transition-colors">
                            {missingSkills.length > 0 ? (
                                <ul className="space-y-1">
                                    {missingSkills.map((skill, i) => (
                                        <li key={i} className="text-[11px] text-gray-600 pl-1 flex gap-2 items-start py-0.5 group/item">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0 group-hover/item:scale-125 transition-transform" />
                                            <span className="leading-tight opacity-90 group-hover/item:opacity-100 transition-opacity">{skill}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
                                    <p className="text-xs text-emerald-700 font-medium">Perfect Candidate!</p>
                                    <p className="text-[10px] text-emerald-600/80">All critical skills matched.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <button
                        onClick={handleAction}
                        className={`w-full shrink-0 border py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm hover:shadow group/btn
                            ${useAutoPilot
                                ? 'bg-white border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700'
                                : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
                            }`}
                    >
                        {useAutoPilot ? (
                            <>
                                <Zap className="w-3.5 h-3.5 transition-colors group-hover/btn:fill-indigo-500/20" />
                                Optimize Resume
                                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1 font-bold">AUTO</span>
                            </>
                        ) : (
                            <>
                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                Open in Editor (Manual)
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
