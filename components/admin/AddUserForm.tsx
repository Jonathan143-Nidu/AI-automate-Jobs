"use client";

import React, { useState } from "react";
import { UserPlus, Mail, Calendar, Clock, CheckCircle, Loader2 } from "lucide-react";
import { addUserAction } from "@/lib/actions/admin";
import { motion, AnimatePresence } from "framer-motion";

export function AddUserForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [accessStart, setAccessStart] = useState<string>(new Date().toISOString().split('T')[0]);
    const [accessEnd, setAccessEnd] = useState<string>("");

    const setPresetDays = (days: number | null) => {
        if (days === null) {
            setAccessEnd("");
            return;
        }
        const date = new Date();
        date.setDate(date.getDate() + days);
        setAccessEnd(date.toISOString().split('T')[0]);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const result = await addUserAction(formData);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                (e.target as HTMLFormElement).reset();
                setAccessEnd("");
            } else if (result.error) {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-5 h-fit space-y-5 backdrop-blur-sm relative overflow-hidden"
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-[80px] -z-10" />

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Authorize User</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Whitelist Mode</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Candidate Email</label>
                    <div className="relative group">
                        <input 
                            name="email"
                            type="email"
                            required
                            placeholder="candidate@example.com"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 group-hover:bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 px-1 font-black text-slate-400 uppercase tracking-widest text-[10px]">
                            <Calendar className="w-3 h-3" /> Access Start
                        </label>
                        <input 
                            name="accessStart"
                            type="date"
                            value={accessStart}
                            onChange={(e) => setAccessStart(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none text-[11px] font-bold text-slate-700 cursor-pointer"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-1 font-black text-slate-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            <label className="text-[10px]">Access End</label>
                        </div>
                        <input 
                            name="accessEnd"
                            type="date"
                            value={accessEnd}
                            onChange={(e) => setAccessEnd(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none text-[11px] font-bold text-slate-700 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">Duration Presets</p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {[
                            { label: "7 Days", val: 7 },
                            { label: "30 Days", val: 30 },
                            { label: "90 Days", val: 90 },
                            { label: "Unlimited", val: null }
                        ].map((btn) => (
                            <button
                                key={btn.label}
                                type="button"
                                onClick={() => setPresetDays(btn.val)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-black text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 overflow-hidden"
                >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : success ? (
                            <CheckCircle className="w-5 h-5 animate-bounce" />
                        ) : (
                            <>
                                Authorize Candidate
                                <motion.span
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    🚀
                                </motion.span>
                            </>
                        )}
                    </div>
                </button>
            </form>

            <AnimatePresence>
                {success && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 text-center text-emerald-600 font-bold text-sm"
                    >
                        User authorized successfully!
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
