import React from 'react';
import { Activity, Briefcase, Hourglass, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { JobDescriptionInput } from './sub/JobDescriptionInput';
import Link from 'next/link';

interface InputSectionProps {
    // State
    step: string;
    file: File | null;
    importedFileName: string | null;
    jd: string;
    isExtracting: boolean;
    isAnalyzing: boolean;
    isNewCandidate: boolean;
    resumeText: string;

    // Handlers
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setJd: (jd: string) => void;
    handleManualClean: () => void;
    startAnalysis: () => void;
    addLog: (msg: string, type?: 'info' | 'success' | 'error') => void;
    resetSession: () => void;
    setIsAutoPilot: (val: boolean) => void;
    isAutoPilot: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
    step, file, importedFileName, jd, isExtracting, isAnalyzing, isNewCandidate, resumeText,
    handleFileUpload, setJd, handleManualClean,
    startAnalysis, addLog, resetSession, setIsAutoPilot, isAutoPilot
}) => {



    return (
        <>
            <div className="flex gap-2 mb-2">
                <Link
                    href="/labs/prismautomation/history"
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm group"
                    title="View History"
                >
                    <Hourglass className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    History
                </Link>

                <button
                    onClick={resetSession}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm"
                    title="Start New Session"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Session
                </button>
            </div>

            {importedFileName && (
                <div className="flex flex-col gap-1.5 mb-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Active Resume</span>
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 text-xs flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center shadow-sm">
                            <Activity className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="truncate font-black text-indigo-900 leading-tight">{importedFileName}</span>
                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">Profile-Synced</span>
                        </div>
                    </div>
                </div>
            )}


            <JobDescriptionInput
                jd={jd}
                setJd={setJd}
                isExtracting={isExtracting}
                handleManualClean={handleManualClean}
                step={step}
            />

            {/* Action Section */}
            {(step === 'input' || isNewCandidate) && (
                <div className="flex flex-col gap-4 mt-2">
                    {/* AUTO-PILOT TOGGLE */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${isAutoPilot ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                                <Activity className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Auto-Pilot</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Automatic Integration</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setIsAutoPilot(!isAutoPilot)}
                            className={`relative w-9 h-5 rounded-full transition-colors duration-200 outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1 ${isAutoPilot ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <motion.div 
                                animate={{ x: isAutoPilot ? 18 : 2 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                            />
                        </button>
                    </div>

                    {isNewCandidate && step !== 'input' && (
                        <div className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg text-center font-bold animate-pulse">
                            New Candidate Detected: Ready to Analyze
                        </div>
                    )}

                    <button
                        onClick={startAnalysis}
                        disabled={!(file || resumeText) || !jd || isAnalyzing}
                        className={`w-full bg-gradient-to-br from-indigo-500 to-indigo-700 hover:to-indigo-600 text-white rounded-lg py-3.5 font-semibold text-xs shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${isNewCandidate && step !== 'input' ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                                <Activity className="w-3.5 h-3.5 animate-spin" /> Analyzing Intelligence...
                            </span>
                        ) : (
                            isNewCandidate && step !== 'input' ? "Analyze New Candidate" : "Start Analysis"
                        )}
                    </button>
                </div>
            )}
        </>
    );
};
