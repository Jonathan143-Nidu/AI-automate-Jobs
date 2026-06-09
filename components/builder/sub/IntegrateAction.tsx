import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, RefreshCw } from 'lucide-react';
import { AnalysisResult } from '../../../lib/types/resume.types';

interface IntegrateActionProps {
    analysisResult: AnalysisResult | null;
    isIntegrating: boolean;
    startIntegration: () => void;
}

export const IntegrateAction: React.FC<IntegrateActionProps> = ({
    analysisResult, isIntegrating, startIntegration
}) => {
    if (!analysisResult) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            {isIntegrating && (
                <div className="w-full rounded-2xl overflow-hidden border border-emerald-100 shadow-sm relative bg-emerald-50/30">
                    <video 
                        src="/auto-integration-video.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay pointer-events-none"></div>
                </div>
            )}
            <button
                onClick={startIntegration}
                disabled={isIntegrating}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl py-3 font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
            >
                {isIntegrating ? <Cpu className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Auto-Integrate Skills
            </button>
        </motion.div>
    );
};
