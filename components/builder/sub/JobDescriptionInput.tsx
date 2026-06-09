import React from 'react';
import { Sparkles } from 'lucide-react';

interface JobDescriptionInputProps {
    jd: string;
    setJd: (jd: string) => void;
    isExtracting: boolean;
    handleManualClean: () => void;
    step: string;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
    jd, setJd, isExtracting, handleManualClean, step
}) => {
    if (step !== 'input') return null;

    return (
        <div className="flex flex-col gap-1.5 flex-1 relative">
            <label className="text-[11px] text-gray-700 font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Job Description</span>
                <div className="flex items-center gap-2">
                    {jd && jd.length > 50 && !isExtracting && (
                        <button
                            onClick={handleManualClean}
                            className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
                            title="Clean formatting & remove junk"
                        >
                            <Sparkles className="w-3 h-3" /> Auto-Clean
                        </button>
                    )}
                    {isExtracting && <span className="text-indigo-600 animate-pulse flex items-center gap-1 text-[10px]"><Sparkles className="w-3 h-3" /> AI Cleaning...</span>}
                </div>
            </label>
            <textarea
                className={`w-full h-full min-h-[180px] bg-white border rounded-lg p-3 text-xs text-gray-900 placeholder:text-gray-500 outline-none resize-none leading-relaxed transition-all ${isExtracting ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10'}`}
                placeholder="Paste the Job Description here..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                disabled={step !== 'input' && step !== 'analysis'}
            />
        </div>
    );
};
