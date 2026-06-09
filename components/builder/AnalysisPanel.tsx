import React, { useRef, useEffect, useState } from 'react';
import { Activity, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalysisResult, ChangeRequest, Step } from '../../lib/types/resume.types';
import { IntelligenceDashboard } from './sub/IntelligenceDashboard';
import { ProposedModifications } from './sub/ProposedModifications';

interface AnalysisPanelProps {
    step: string;
    changes: ChangeRequest[];
    analysisResult: AnalysisResult | null;
    isAnalyzing: boolean;
    addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
    setStep: (step: Step) => void;
    fileName?: string | null;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
    step, changes, analysisResult, isAnalyzing, addLog, setStep, fileName
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showTransition, setShowTransition] = useState(false);
    const prevIsAnalyzing = useRef(isAnalyzing);

    useEffect(() => {
        // Trigger the transition when analysis successfully finishes
        if (prevIsAnalyzing.current === true && isAnalyzing === false && analysisResult) {
            setShowTransition(true);
            const timer = setTimeout(() => {
                setShowTransition(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
        prevIsAnalyzing.current = isAnalyzing;
    }, [isAnalyzing, analysisResult]);

    useEffect(() => {
        if (videoRef.current) {
            if (isAnalyzing) {
                videoRef.current.playbackRate = 0.4;
                videoRef.current.play().catch((e) => console.error("Video play failed:", e));
            } else if (showTransition) {
                videoRef.current.pause(); // Freeze exactly when complete
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isAnalyzing, showTransition]);

    const handleCopyAll = async () => {
        try {
            // 1. Construct Plain Text (Fallback)
            const plainText = changes.map(c => {
                const section = c.section ? `[${c.section}] ` : '';
                if (c.type === 'MODIFY') return `${section}Update: ${c.old} -> ${c.new}`;
                return `${section}Add: ${c.new}`;
            }).join('\n\n');

            // 2. Construct HTML (Rich Text)
            const htmlContent = changes.map(c => {
                const section = c.section ? `<strong>[${c.section}]</strong>` : '';

                if (c.type === 'MODIFY') {
                    // Update: Old (Red) -> New (Black)
                    return `
                        <div style="margin-bottom: 12px; font-family: sans-serif;">
                            ${section} <strong>Update:</strong>
                            <span style="color: #ef4444; text-decoration: line-through; margin-left: 8px;">${c.old}</span>
                            <span style="margin: 0 8px;">&rarr;</span>
                            <span style="color: #000000; font-weight: bold;">${c.new}</span>
                        </div>
                    `;
                } else {
                    // Add: New (Green/Black)
                    return `
                        <div style="margin-bottom: 12px; font-family: sans-serif;">
                            ${section} <strong style="color: #16a34a;">Add:</strong>
                            <span style="color: #000000; font-weight: bold; margin-left: 8px;">${c.new}</span>
                        </div>
                    `;
                }
            }).join('');

            // 3. Write both formats to clipboard
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });

            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]);

            addLog(`Copied ${changes.length} changes with formatting!`, 'success');
        } catch (err) {
            console.error('Clipboard Error:', err);
            // Fallback to simple text if HTML fails
            const simpleText = changes.map(c =>
                `${c.section ? `[${c.section}] ` : ''}${c.type === 'MODIFY' ? `Update: ${c.old} -> ${c.new}` : `Add: ${c.new}`}`
            ).join('\n\n');
            navigator.clipboard.writeText(simpleText);
            addLog('Copied as plain text (Rich text not supported)', 'info');
        }
    };

    const handleCopyItem = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        addLog(`Copied ${label} to clipboard`, 'success');
    };

    const canGoBack = step === 'integration_summary';
    const canGoForward = (step === 'analysis' && changes.length > 0) || step === 'integration_summary';

    const handleForward = () => {
        if (step === 'analysis') setStep('integration_summary');
        else if (step === 'integration_summary') setStep('review');
    };

    return (
        <div className="bg-white border border-gray-300 rounded-[24px] overflow-hidden flex flex-col shadow-sm relative">
            <div className="h-12 border-b border-gray-200 flex items-center px-4 gap-3 bg-gradient-to-r from-indigo-50 to-transparent">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">DeepThink</span>

                {/* Browser-like Navigation */}
                <div className="flex items-center gap-1 ml-2 border-l border-indigo-200/50 pl-3">
                    <button
                        onClick={() => setStep('analysis')}
                        disabled={!canGoBack}
                        className={`p-1 rounded-full transition-all ${canGoBack ? 'hover:bg-indigo-100/50 text-indigo-600 cursor-pointer' : 'text-indigo-200 cursor-not-allowed'}`}
                        title="Go Back to Skills Gap"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleForward}
                        disabled={!canGoForward}
                        className={`p-1 rounded-full transition-all ${canGoForward ? 'hover:bg-indigo-100/50 text-indigo-600 cursor-pointer' : 'text-indigo-200 cursor-not-allowed'}`}
                        title="Go Forward"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="ml-auto flex gap-2">
                    <div className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px] text-indigo-700 font-semibold">V3.0 MODEL</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                { /* CONDITIONAL CONTENT: ANALYSIS RESULT vs INTEGRATION SUMMARY */}
                {step === 'integration_summary' && changes.length > 0 ? (
                    <ProposedModifications
                        changes={changes}
                        handleCopyAll={handleCopyAll}
                        handleCopyItem={handleCopyItem}
                    />
                ) : (
                    (!analysisResult || showTransition) ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                                <style>{`
                                    @keyframes botGlow {
                                        0% { filter: drop-shadow(0 0 5px rgba(99,102,241,0.1)); }
                                        50% { filter: drop-shadow(0 0 25px rgba(99,102,241,0.4)); }
                                        100% { filter: drop-shadow(0 0 5px rgba(99,102,241,0.1)); }
                                    }
                                `}</style>
                            
                            <div className="relative w-80 h-48 mb-6 overflow-hidden rounded-2xl border border-indigo-100 shadow-sm bg-indigo-50/20">
                                <video 
                                    ref={videoRef}
                                    src="/ai-bot-video.mp4" 
                                    loop 
                                    muted 
                                    playsInline
                                    className={`w-full h-full object-cover transition-all duration-700 ${isAnalyzing || showTransition ? '' : 'opacity-60 grayscale'}`}
                                    style={isAnalyzing ? { animation: 'botGlow 3s ease-in-out infinite' } : showTransition ? { filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.4))' } : {}}
                                />
                            </div>

                            <h4 className={`font-bold mb-1 tracking-tight text-lg ${showTransition ? 'text-green-600' : 'text-gray-900'}`}>
                                {showTransition ? 'Review Complete!' : isAnalyzing ? 'AI Recruiter is Reviewing...' : 'Awaiting Resume Data'}
                            </h4>
                            <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed font-medium">
                                {showTransition ? `Successfully analyzed ${fileName || 'candidate profile'}. Generating Intelligence Report...` : isAnalyzing ? `Scanning ${fileName || 'candidate profile'} line-by-line against Job Description requirements.` : 'Upload a candidate resume and Job Description to initiate intelligence scan.'}
                            </p>
                        </div>
                    ) : (
                        <IntelligenceDashboard
                            analysisResult={analysisResult}
                            isAnalyzing={isAnalyzing}
                        />
                    )
                )}
            </div>
        </div>
    );
};
