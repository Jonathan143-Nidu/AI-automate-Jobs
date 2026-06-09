import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, CheckCircle } from 'lucide-react';

interface CoverLetterModalProps {
    coverLetter: string | null;
    setCoverLetter: (content: string | null) => void;
    addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
    coverLetter,
    setCoverLetter,
    addLog
}) => {
    return (
        <AnimatePresence>
            {coverLetter && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-10"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#ffffff05]">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Edit className="w-5 h-5 text-purple-400" />
                                AI Generated Cover Letter
                            </h2>
                            <button onClick={() => setCoverLetter(null)} className="text-gray-400 hover:text-white transition-colors">
                                Close
                            </button>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-white/5 font-serif text-gray-200 leading-loose whitespace-pre-wrap">
                            {coverLetter.split(/(\*\*.*?\*\*)/g).map((part, i) => (
                                part.startsWith('**') && part.endsWith('**') ?
                                    <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong> :
                                    <span key={i}>{part}</span>
                            ))}
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-[#ffffff05]">
                            <button
                                onClick={() => setCoverLetter(null)}
                                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(coverLetter);
                                    addLog('Cover letter copied to clipboard', 'success');
                                }}
                                className="px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/20 text-sm flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Copy to Clipboard
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
