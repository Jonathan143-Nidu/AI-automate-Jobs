"use client";

import React, { useState } from "react";
import { 
    Trash2, Lock, UserCheck, Search, Mail, 
    Copy, Check, ExternalLink, ShieldCheck, 
    Clock, AlertCircle, HelpCircle, MoreVertical
} from "lucide-react";
import { AdminUser } from "@/lib/services/admin-service";
import { toggleUserStatusAction, deleteUserAction, toggleUserExclusionAction } from "@/lib/actions/admin";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";

const JOB_TYPES = [
    { id: 'full-time', label: 'Full-time', color: 'indigo' },
    { id: 'contract', label: 'Contract', color: 'rose' },
    { id: 'part-time', label: 'Part-time', color: 'amber' },
    { id: 'internship', label: 'Internship', color: 'teal' },
    { id: 'temporary', label: 'Temporary', color: 'orange' },
    { id: 'volunteer', label: 'Volunteer', color: 'purple' }
];

function ExclusionDropdown({ user, onToggle }: { user: AdminUser, onToggle: (type: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const exclusions = user.excludedTypes || [];

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    isOpen || exclusions.length > 0
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
            >
                {exclusions.length > 0 ? `${exclusions.length} Excluded` : 'Manage'}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 p-2 overflow-hidden">
                        <div className="px-2 py-1.5 mb-1.5 border-b border-slate-50">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Exclude Categories</p>
                        </div>
                        <button
                            onClick={() => onToggle('ALL_CLEAR')}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all group mb-1 ${
                                exclusions.length === 0 ? 'bg-slate-100/50 cursor-default' : 'hover:bg-red-50'
                            }`}
                            disabled={exclusions.length === 0}
                        >
                            <span className={`text-[11px] font-black uppercase tracking-tighter ${exclusions.length === 0 ? 'text-slate-400' : 'text-red-500'}`}>None (Reset All)</span>
                            {exclusions.length === 0 && <Check className="w-2.5 h-2.5 text-slate-400" />}
                        </button>

                        {JOB_TYPES.map(type => {
                            const isExcluded = exclusions.includes(type.id);
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => onToggle(type.id)}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all group ${
                                        isExcluded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`text-[11px] font-bold ${isExcluded ? 'text-indigo-600' : 'text-slate-600'}`}>{type.label}</span>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                        isExcluded 
                                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                                            : 'bg-white border-slate-200 group-hover:border-indigo-300'
                                    }`}>
                                        {isExcluded && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

interface UserListTableProps {
    users: AdminUser[];
}

export function UserListTable({ users }: UserListTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const getAccessStatus = (u: AdminUser) => {
        const now = new Date();
        const start = u.accessStart ? new Date(u.accessStart) : null;
        const end = u.accessEnd ? new Date(u.accessEnd) : null;
        
        const endOfDay = end ? new Date(end) : null;
        if (endOfDay) endOfDay.setHours(23, 59, 59, 999);
        
        const isExpired = endOfDay && now > endOfDay;
        const isPending = start && now < start;
        const isActive = u.status === 'active' && !isExpired && !isPending;

        if (isExpired) return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-100', icon: <AlertCircle className="w-3 h-3" /> };
        if (isPending) return { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock className="w-3 h-3" /> };
        if (isActive) return { label: 'Active', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <ShieldCheck className="w-3 h-3" /> };
        return { label: u.status, color: 'bg-slate-100 text-slate-400 border-slate-200', icon: <Lock className="w-3 h-3" /> };
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 overflow-visible flex flex-col min-h-[400px]"
        >
            {/* Table Header / Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Authorized Candidates</h2>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1.5">Live Database Status</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <input 
                            type="text"
                            placeholder="Find by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 w-full md:w-64 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest">Candidate</th>
                            <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest text-center">Window</th>
                            <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest text-center">Exclude</th>
                            <th className="px-6 py-2.5 text-[9px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        <AnimatePresence>
                            {filteredUsers.length === 0 ? (
                                <motion.tr 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    className="h-64"
                                >
                                    <td colSpan={5} className="text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                                            <Search className="w-12 h-12 text-slate-400" />
                                            <p className="text-lg font-bold text-slate-500 italic">No candidates found matching your search</p>
                                        </div>
                                    </td>
                                </motion.tr>
                            ) : (
                                filteredUsers.map((u, idx) => {
                                    const status = getAccessStatus(u);
                                    return (
                                        <motion.tr 
                                            key={u.email}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50 transition-all cursor-default"
                                        >
                                            {/* CANDIDATE */}
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        {u.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{u.email}</span>
                                                            <button 
                                                                onClick={() => handleCopy(u.email)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                                                            >
                                                                {copiedEmail === u.email ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                                                            </button>
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">ID: {btoa(u.email).slice(0, 6)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-2.5 text-center">
                                                <div className="flex justify-center">
                                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </td>

                                             {/* ACCESS WINDOW */}
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex flex-col items-center gap-0">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700">
                                                         <span className={u.accessStart ? "text-indigo-600" : "text-slate-300 italic"} suppressHydrationWarning>
                                                            {u.accessStart ? new Date(u.accessStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Imm'}
                                                        </span>
                                                        <span className="text-slate-300">→</span>
                                                        <span className={u.accessEnd ? "text-indigo-600" : "text-slate-300 italic"} suppressHydrationWarning>
                                                            {u.accessEnd ? new Date(u.accessEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Inf'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* EXCLUDE FILTERS */}
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    {/* Visual Indicators (Mini Tags) */}
                                                    {u.excludedTypes && u.excludedTypes.length > 0 && (
                                                        <div className="flex -space-x-1.5">
                                                            {u.excludedTypes.slice(0, 3).map((typeId) => {
                                                                const type = JOB_TYPES.find(t => t.id === typeId);
                                                                if (!type) return null;
                                                                return (
                                                                    <div 
                                                                        key={typeId}
                                                                        className={`w-5 h-5 rounded-full border-2 border-white bg-${type.color}-500 flex items-center justify-center text-[7px] font-black text-white shadow-sm`}
                                                                        title={`Hidden: ${type.label}`}
                                                                    >
                                                                        {type.label.charAt(0)}
                                                                    </div>
                                                                );
                                                            })}
                                                            {u.excludedTypes.length > 3 && (
                                                                <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-400 flex items-center justify-center text-[7px] font-black text-white shadow-sm">
                                                                    +{u.excludedTypes.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <ExclusionDropdown 
                                                        user={u} 
                                                        onToggle={(typeId) => toggleUserExclusionAction(u.email, typeId)} 
                                                    />
                                                </div>
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button 
                                                        onClick={() => toggleUserStatusAction(u.email, u.status)}
                                                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                                                            u.status === 'active' 
                                                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        }`}
                                                        title={u.status === 'active' ? "Suspend" : "Restore"}
                                                    >
                                                        {u.status === 'active' ? <Lock className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                                    </button>

                                                    <button 
                                                        onClick={() => {
                                                            if (confirm(`Revoke access for ${u.email}?`)) {
                                                                deleteUserAction(u.email);
                                                            }
                                                        }}
                                                        className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Empty State / Footer */}
            <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate whitelisting via Google Sheets API (V4)</span>
            </div>
        </motion.div>
    );
}
