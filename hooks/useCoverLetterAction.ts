import { useBuilderState } from './useBuilderState';
import { getErrorMessage } from '../lib/utils/file-utils';

export const useCoverLetterAction = (state: ReturnType<typeof useBuilderState>) => {
    const {
        resumeText, jd, setIsGeneratingCoverLetter, setCoverLetter, addLog
    } = state;

    const generateCoverLetter = async () => {
        if (!resumeText || !jd) return;
        setIsGeneratingCoverLetter(true);
        addLog('Generating AI Cover Letter...', 'info');
        try {
            const res = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, jd })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCoverLetter(data.coverLetter);
            addLog('Cover Letter Generated', 'success');
        } catch (err) {
            addLog('Cover Letter Generation Failed', 'error', getErrorMessage(err));
        } finally {
            setIsGeneratingCoverLetter(false);
        }
    };

    return { generateCoverLetter };
};
