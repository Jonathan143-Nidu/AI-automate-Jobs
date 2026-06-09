import React from 'react';
import { ChevronLeft, Download, Activity, Edit, CheckCircle, Mail } from 'lucide-react';
import { ChangeRequest, Step as StepType } from '../../../lib/types/resume.types';

interface ReviewActionsProps {
    step: string;
    downloadUrl: string | null;
    file: File | null;
    changes: ChangeRequest[];
    isGeneratingCoverLetter: boolean;
    isProcessingFile: boolean;
    setStep: (step: StepType) => void;
    resetSession: () => void;
    generateCoverLetter: () => void;
    generateUpdatedResume: () => void;
    setChanges: (changes: ChangeRequest[]) => void;
    addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
    setIsEmailModalOpen: (open: boolean) => void;
}

export const ReviewActions: React.FC<ReviewActionsProps> = ({
    step, downloadUrl, file, changes, isGeneratingCoverLetter, isProcessingFile,
    setStep, resetSession, generateCoverLetter, generateUpdatedResume, setChanges, addLog, setIsEmailModalOpen
}) => {
    return (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-wrap md:flex-nowrap justify-end gap-2 md:gap-3 bg-gray-50/80 pb-safe-bottom">
            {step === 'download' && downloadUrl ? (
                <>
                    <button
                        onClick={() => setStep('integration_summary')}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-[11px] md:text-sm font-semibold flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="whitespace-nowrap">Back to Optimizations</span>
                    </button>
                    <button
                        onClick={resetSession}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-[11px] md:text-sm font-semibold min-w-[120px]"
                    >
                        <span className="whitespace-nowrap">New Session</span>
                    </button>
                    <a
                        href={downloadUrl}
                        download={`${file?.name.replace(/\.[^/.]+$/, "")} final.docx`}
                        className="flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 text-[11px] md:text-sm flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="whitespace-nowrap">Download</span>
                    </a>
                    <button
                        onClick={generateCoverLetter}
                        disabled={isGeneratingCoverLetter}
                        className="flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20 text-[11px] md:text-sm flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        {isGeneratingCoverLetter ? <Activity className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Edit className="w-3 h-3 md:w-4 md:h-4" />}
                        <span className="whitespace-nowrap">Cover Letter</span>
                    </button>
                    <button
                        onClick={() => setIsEmailModalOpen(true)}
                        className="flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 text-[11px] md:text-sm flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        <Mail className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="whitespace-nowrap">Email</span>
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={() => {
                            const newChanges = changes.map(c => ({ ...c, selected: false }));
                            setChanges(newChanges);
                            addLog('All changes rejected by user', 'info');
                        }}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-semibold"
                    >
                        Reject All
                    </button>
                    <button
                        onClick={generateUpdatedResume}
                        disabled={isProcessingFile}
                        className="flex-1 md:flex-none px-6 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 text-sm flex items-center justify-center gap-2"
                    >
                        {isProcessingFile ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Accept ({changes.filter(c => c.selected).length})
                    </button>
                </>
            )}
        </div>
    );
};
