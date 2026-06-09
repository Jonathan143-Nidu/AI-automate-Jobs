"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Calendar, User, Layout, List, Briefcase, MapPin, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Define structured data types
interface ChangeItem {
    type: string;
    old?: string;
    new: string;
    reason?: string;
}

interface IntegrationResult {
    candidate_name?: string;
    changes?: ChangeItem[];
}

interface HistoryItem {
    id: string;
    createdAt: Date;
    userEmail: string;
    candidateName?: string | null;
    jobDescription?: string | null;
    jobRole?: string | null;
    jobLocation?: string | null;
    recruiterEmail?: string | null;
    missingSkills: unknown;
    integrationResult: unknown;
}

export default function HistoryTable({ history, userName, showUserColumn = false }: { history: HistoryItem[], userName: string, showUserColumn?: boolean }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (history.length === 0) {
        return (
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-[32px] border border-slate-200/60 shadow-xl p-12 md:p-24 text-center group">
                {/* Decorative background circle */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 group-hover:bg-indigo-100 transition-colors duration-1000"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center mb-8 shadow-inner border border-white">
                        <Layout className="w-10 h-10 text-indigo-400 opacity-80" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">No History Found</h3>
                    <p className="max-w-[280px] mx-auto text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-widest">
                        Your optimized resumes will appear here once you start an analysis.
                    </p>
                    <div className="mt-8 flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-200 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse delay-75"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {history.map((item, index) => {
                const isExpanded = expandedId === item.id;
                const result = item.integrationResult as IntegrationResult | null;
                const changes = result?.changes || [];
                const missingSkills = Array.isArray(item.missingSkills) ? (item.missingSkills as string[]) : [];
                
                const dateObj = new Date(item.createdAt);
                const displayDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const displayTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                return (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group relative overflow-hidden transition-all duration-300 rounded-[24px] border border-slate-200/60 bg-white/60 backdrop-blur-md hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 ${isExpanded ? 'bg-white shadow-xl border-indigo-200 ring-4 ring-indigo-50/50' : ''}`}
                    >
                        {/* CARD HEADER / MAIN PREVIEW */}
                        <div 
                            onClick={() => toggleRow(item.id)}
                            className="p-3 md:p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isExpanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                    <User className="w-4 h-4 font-bold" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <h3 className="text-sm font-black text-slate-900 leading-tight truncate max-w-[200px]">
                                            {item.candidateName || userName || "Unknown Member"}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {displayDate}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        {item.jobRole && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 truncate max-w-[250px]">
                                                <Briefcase className="w-2.5 h-2.5" />
                                                {item.jobRole}
                                            </div>
                                        )}
                                        {item.jobLocation && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <MapPin className="w-2.5 h-2.5" />
                                                {item.jobLocation}
                                            </div>
                                        )}
                                        {item.recruiterEmail && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 truncate max-w-[200px]">
                                                <Mail className="w-2.5 h-2.5" />
                                                {item.recruiterEmail}
                                            </div>
                                        )}
                                        {showUserColumn && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-tight">
                                                <AlertCircle className="w-2.5 h-2.5" />
                                                {item.userEmail}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 ml-14 md:ml-0">
                                {/* Summary stats chips */}
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Skills</p>
                                        <p className={`text-xs font-black ${missingSkills.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{missingSkills.length}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Updates</p>
                                        <p className="text-xs font-black text-indigo-600">{changes.length}</p>
                                    </div>
                                </div>
                                
                                <button className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'text-slate-300 hover:text-slate-600'}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* EXPANDED CONTENT AREA */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-slate-100 bg-slate-50/30"
                                >
                                    <div className="p-6 md:p-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Left Column: Intelligence Data */}
                                            <div className="space-y-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <List className="w-4 h-4 text-red-500" />
                                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identified skill Gaps</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {missingSkills.length > 0 ? (
                                                            missingSkills.map((skillStr, i) => {
                                                                const match = skillStr.match(/Skill:\s*([^;]+)/i);
                                                                const name = match ? match[1].trim() : skillStr;
                                                                return (
                                                                    <span key={i} className="px-3 py-1.5 bg-white border border-red-100 text-red-600 rounded-xl text-[11px] font-bold shadow-sm">
                                                                        {name}
                                                                    </span>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100">
                                                                <CheckCircle className="w-4 h-4" /> No Missing Skills Detected
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {item.jobDescription && (
                                                    <div className="pt-6 border-t border-slate-200/50">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Source Context</h4>
                                                        </div>
                                                        <div className="bg-white/80 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-600 font-mono leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">
                                                            {item.jobDescription}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Integration Result */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intelligence modifications</h4>
                                                </div>
                                                {changes.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {changes.map((change, idx) => (
                                                            <div key={idx} className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm group/change hover:border-indigo-200 transition-all">
                                                                {change.old && (
                                                                    <div className="mb-3 pb-3 border-b border-slate-50">
                                                                        <span className="text-[9px] font-black text-red-300 uppercase tracking-widest block mb-1">Previous content</span>
                                                                        <p className="text-slate-400 line-through text-xs leading-relaxed opacity-60 italic">{change.old}</p>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Optimized Addition</span>
                                                                    <p className="text-slate-900 font-bold text-xs leading-relaxed">
                                                                        {change.new.replace(/\*\*/g, '')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 bg-white/40 border border-dashed border-slate-300 rounded-[20px]">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Modifications Recorded</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
