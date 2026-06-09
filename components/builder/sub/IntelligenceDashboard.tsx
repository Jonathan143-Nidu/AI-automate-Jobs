import React, { useState } from 'react';
import { AlertCircle, Sparkles, Copy, Check, ChevronDown, ChevronUp, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AnalysisResult } from '../../../lib/types/resume.types';

interface IntelligenceDashboardProps {
    analysisResult: AnalysisResult;
    isAnalyzing?: boolean;
}

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({
    analysisResult, isAnalyzing
}) => {
    const [expanded, setExpanded] = useState({ reasoning: true, details: true });
    const [copied, setCopied] = useState<string | null>(null);

    const missingCount = analysisResult.missingSkills?.length || 0;
    const partialCount = analysisResult.partialMatchSkills?.length || 0;
    const matchedCount = analysisResult.matchedSkills?.length || 0;
    const gapsCount = missingCount + partialCount;
    
    // Calculate Percentages
    const totalSkills = missingCount + partialCount + matchedCount;
    let matchPct = 0;
    let missingPct = 0;
    
    if (totalSkills > 0) {
        matchPct = Math.round(((matchedCount + (partialCount * 0.5)) / totalSkills) * 100);
        missingPct = Math.round((missingCount / totalSkills) * 100);
    } else if (analysisResult.match_percentage !== undefined) {
        // Fallback for legacy data
        matchPct = analysisResult.match_percentage;
        missingPct = 100 - matchPct;
    }

    const toggleSection = (key: 'reasoning' | 'details') => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const isHighMatch = matchPct >= 70;
    const isLowMatch = matchPct < 40;
    
    const statusColor = isHighMatch ? 'text-green-600' : isLowMatch ? 'text-red-600' : 'text-orange-600';
    const statusBg = isHighMatch ? 'bg-green-500' : isLowMatch ? 'bg-red-500' : 'bg-orange-500';

    return (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* SCORE CARD & GAPS SUMMARY */}
            <div className="flex items-center gap-3 px-2">
                {/* MATCH SCORE */}
                <div className="relative flex-shrink-0 w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center overflow-hidden p-1.5 text-center">
                    <div className={`absolute inset-0 opacity-10 ${statusBg}`}></div>
                    <span className="text-[8px] text-gray-500 uppercase font-black z-10 tracking-widest mb-0.5">Match</span>
                    <span className={`text-lg font-black z-10 leading-none ${statusColor}`}>
                        {matchPct}%
                    </span>
                </div>
                
                {/* MISSING SCORE */}
                <div className="relative flex-shrink-0 w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center overflow-hidden p-1.5 text-center">
                    <div className="absolute inset-0 opacity-10 bg-red-500"></div>
                    <span className="text-[8px] text-gray-500 uppercase font-black z-10 tracking-widest mb-0.5">Missing</span>
                    <span className="text-lg font-black z-10 leading-none text-red-600">
                        {missingPct}%
                    </span>
                </div>

                <div className="flex-1 flex flex-col gap-1 ml-1">
                    <div className="flex items-center gap-1.5 text-red-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Critical Gaps</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-gray-900">{gapsCount}</span>
                        <span className="text-[10px] text-gray-500 font-medium">skills require attention</span>
                    </div>
                    <div className="flex gap-2 text-[10px]">
                        <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                            <XCircle className="w-3 h-3" /> {missingCount} Missing
                        </span>
                        <span className="flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                            <AlertTriangle className="w-3 h-3" /> {partialCount} Partial
                        </span>
                    </div>
                </div>
            </div>

            {/* ERROR REPORT details */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer" onClick={() => toggleSection('details')}>
                    <span className="text-[10px] text-gray-700 uppercase font-bold tracking-wider flex items-center gap-2">
                        <FileText className="w-3 h-3 text-gray-500" /> Skill Gaps Breakdown
                    </span>
                    <div className="p-1 text-gray-400">
                        {expanded.details ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                </div>
                {expanded.details && (
                    <div className="p-0 animate-in slide-in-from-top-1 duration-200 divide-y divide-gray-100">
                        
                        {/* MISSING SKILLS */}
                        {analysisResult.missingSkills && analysisResult.missingSkills.length > 0 && (
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4" /> Missing Requirements
                                </h4>
                                <div className="space-y-1.5">
                                    {analysisResult.missingSkills.map((item, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between px-2.5 py-1.5 rounded bg-red-50/40 border border-red-100/50 gap-1.5">
                                            <span className="font-semibold text-gray-900 text-xs">{item.skill}</span>
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-gray-500">Required: <span className="text-gray-900 font-medium">{item.jdRequirement}</span></span>
                                                <span className="text-red-600 font-bold whitespace-nowrap">Found: 0</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MISSING CERTIFICATIONS */}
                        {analysisResult.missingCertifications && analysisResult.missingCertifications.length > 0 && (
                            <div className="p-4 bg-red-50/30">
                                <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" /> Missing Certifications
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysisResult.missingCertifications.map((cert, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-white border border-red-200 text-red-700 text-[10px] font-bold rounded shadow-sm">
                                            {cert}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PARTIAL SKILLS */}
                        {analysisResult.partialMatchSkills && analysisResult.partialMatchSkills.length > 0 && (
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" /> Partial Matches
                                </h4>
                                <div className="space-y-1.5">
                                    {analysisResult.partialMatchSkills.map((item, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between px-2.5 py-1.5 rounded bg-orange-50/40 border border-orange-100/50 gap-1.5">
                                            <span className="font-semibold text-gray-900 text-xs">{item.skill}</span>
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-gray-500">Required: <span className="text-gray-900 font-medium">{item.jdRequirement}</span></span>
                                                <span className="text-orange-600 font-bold whitespace-nowrap">Found: {item.candidateHas}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MATCHED SKILLS */}
                        {analysisResult.matchedSkills && analysisResult.matchedSkills.length > 0 && (
                            <div className="p-4 bg-gray-50">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> Full Matches
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysisResult.matchedSkills.map((skill, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-white border border-gray-200 text-gray-700 text-[10px] rounded shadow-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* EMPTY STATE */}
                        {gapsCount === 0 && (!analysisResult.matchedSkills || analysisResult.matchedSkills.length === 0) && (
                            <div className="p-6 text-center text-sm text-gray-500 font-medium">
                                No granular skill data available for this analysis.
                            </div>
                        )}

                    </div>
                )}
            </div>

            {/* INTERNAL REASONING */}
            {(analysisResult.internalReasoning || analysisResult.executive_summary) && (
                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/50 border-b border-indigo-100 cursor-pointer" onClick={() => toggleSection('reasoning')}>
                        <span className="text-[10px] text-indigo-800 uppercase font-bold tracking-wider flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-indigo-600" /> Recruiter Reasoning
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(analysisResult.internalReasoning || analysisResult.executive_summary || "", 'reasoning'); }}
                                className="p-1 hover:bg-indigo-100 rounded-md transition-colors text-indigo-400 hover:text-indigo-600"
                                title="Copy reasoning"
                            >
                                {copied === 'reasoning' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <div className="p-1 text-indigo-400">
                                {expanded.reasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                        </div>
                    </div>

                    {expanded.reasoning && (
                        <div className="p-4 bg-white/50 animate-in slide-in-from-top-1 duration-200">
                            <div className="text-sm text-indigo-950 leading-relaxed font-sans relative z-10 whitespace-pre-wrap">
                                {analysisResult.internalReasoning || analysisResult.executive_summary}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
        </div>
    );
};
