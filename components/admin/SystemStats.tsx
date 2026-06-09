"use client";

import React from "react";
import { Settings, Database, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export function SystemStats() {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[20px] shadow-sm border border-slate-200/60 p-5 h-fit space-y-4 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Settings className="w-16 h-16 rotate-12" />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">System Integration</h3>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] font-bold">Storage</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md">V4 API</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] font-bold">Policy</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50/20 text-indigo-400 rounded-md">Whitelist</span>
                </div>
            </div>

            <div className="pt-3 border-t border-slate-100 font-mono">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    <LayoutDashboard className="w-2.5 h-2.5" />
                    Sync: {mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                </div>
            </div>
        </motion.div>
    );
}
