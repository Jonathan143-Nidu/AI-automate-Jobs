'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

import BatchAnalysisTerminal from '@/components/BatchAnalysisTerminal';

// Dynamically import to avoid hydration issues with browser-only logic (URL params)
const BatchDashboard = dynamic(() => Promise.resolve(DashboardContent), { ssr: false });

interface Candidate {
    name: string;
    link: string;
    type: string;
}

function DashboardContent() {
    const [jd] = useState<string>(() => {
        if (typeof window === 'undefined') return '';
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        return params.get('jd') || '';
    });

    const [candidates] = useState<Candidate[]>(() => {
        if (typeof window === 'undefined') return [];
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const rawCandidates = params.get('candidates');
        if (rawCandidates) {
            try {
                return JSON.parse(decodeURIComponent(rawCandidates));
            } catch (e) {
                console.error("Failed to parse candidates", e);
            }
        }
        return [];
    });

    const [loading] = useState(false);

    useEffect(() => {
        // Hydration check or other side effects if needed
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center text-gray-500 bg-white">Loading Batch Engine...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-500/20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Batch Analysis Engine
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">
                            Comparing <span className="font-semibold text-indigo-600">{candidates.length}</span> candidates
                        </p>
                    </div>
                    <div>
                        <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all" onClick={() => window.close()}>
                            Close Dashboard
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Grid - Added padding-top for fixed header */}
            <main className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 pt-24">
                <AnimatePresence>
                    {candidates.map((candidate, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <BatchAnalysisTerminal candidate={candidate} jd={jd} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default BatchDashboard;
