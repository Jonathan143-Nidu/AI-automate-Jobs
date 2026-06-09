import { ChangeRequest, Step as StepType } from '../../lib/types/resume.types';
import { ComparisonPreview } from './sub/ComparisonPreview';
import { ReviewActions } from './sub/ReviewActions';

interface PreviewEditorProps {
    step: string;
    file: File | null;
    resumeText: string;
    changes: ChangeRequest[];
    setChanges: (changes: ChangeRequest[]) => void;
    downloadUrl: string | null;
    isGeneratingCoverLetter: boolean;
    isProcessingFile: boolean;
    setStep: (step: StepType) => void;
    resetSession: () => void;
    generateCoverLetter: () => void;
    generateUpdatedResume: () => void;
    addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
    setIsEmailModalOpen: (open: boolean) => void;
}

export const PreviewEditor: React.FC<PreviewEditorProps> = ({
    step, file, resumeText, changes, setChanges, downloadUrl,
    isGeneratingCoverLetter, isProcessingFile,
    setStep, resetSession, generateCoverLetter, generateUpdatedResume, addLog,
    setIsEmailModalOpen
}) => {

    const toggleChange = (index: number) => {
        const newChanges = [...changes];
        newChanges[index].selected = !newChanges[index].selected;
        setChanges(newChanges);
    };

    return (
        <div className="bg-white border border-gray-300 rounded-[24px] overflow-hidden flex flex-col relative shadow-xl h-full w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h1 className="text-lg font-bold tracking-wide text-gray-900 select-none">AI Resume Review</h1>
                <div className="text-sm text-gray-600 font-medium">
                    {step === 'download' ? 'Optimization Complete' : 'Review & Approve Changes'}
                </div>
            </div>

            {/* Body */}
            <ComparisonPreview
                resumeText={resumeText}
                changes={changes}
                toggleChange={toggleChange}
            />

            {/* Footer */}
            <ReviewActions
                step={step}
                downloadUrl={downloadUrl}
                file={file}
                changes={changes}
                isGeneratingCoverLetter={isGeneratingCoverLetter}
                isProcessingFile={isProcessingFile}
                setStep={setStep}
                resetSession={resetSession}
                generateCoverLetter={generateCoverLetter}
                generateUpdatedResume={generateUpdatedResume}
                setChanges={setChanges}
                addLog={addLog}
                setIsEmailModalOpen={setIsEmailModalOpen}
            />
        </div>
    );
};
