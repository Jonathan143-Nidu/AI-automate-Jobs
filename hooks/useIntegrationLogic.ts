import { getErrorMessage } from '../lib/utils/file-utils';
import { useBuilderState } from './useBuilderState';
import { useCoverLetterAction } from './useCoverLetterAction';
import { DocxModifier } from '../utils/docx-modifier';
import { ChangeRequest } from '../lib/types/resume.types';
import { applyChangesToText, generateDocxFromText } from '../lib/utils/docx-utils';

export const useIntegrationLogic = (state: ReturnType<typeof useBuilderState>) => {
    const {
        analysisResult, setIsIntegrating, setMobileView, addLog, setRawAiResponse,
        resumeText, jd, setChanges, setOptimizedScore, setGapReasons, setStep,
        file, fileType, setIsProcessingFile, changes, setDownloadUrl, setDownloadFileName,
        importedFileName
    } = state;

    const { generateCoverLetter } = useCoverLetterAction(state);

    const startIntegration = async () => {
        if (!analysisResult) return;
        setIsIntegrating(true);
        setMobileView('preview');
        addLog('Initiating Skill Integration...', 'info');
        setRawAiResponse('// GENERATING INTEGRATION PLAN...\n// Analyzing "Missing Skills" vs "Resume Context"...');

        try {
            // Support both new granular format and legacy format
            const missingList = analysisResult.missingSkills?.map(s => s.skill) || [];
            const partialList = analysisResult.partialMatchSkills?.map(s => s.skill) || [];
            const legacyMissing = analysisResult.missing_skills || [];
            const allMissingSkills = [...new Set([...missingList, ...partialList, ...legacyMissing])];

            const res = await fetch('/api/integrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeText,
                    missingSkills: allMissingSkills,
                    jd: jd,
                    jobRole: state.jobDetails?.role,
                    jobLocation: state.jobDetails?.location,
                    recruiterEmail: state.recruiterDetails?.email
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            addLog('Integration Plan Generator Complete', 'success');
            setRawAiResponse(JSON.stringify(data, null, 2));

            const changesWithSelect = (data.changes || []).map((c: ChangeRequest) => ({ ...c, selected: true }));
            setChanges(changesWithSelect);
            setOptimizedScore(data.optimized_match_percentage);
            setGapReasons(data.gap_reasons || []);
            setStep('integration_summary');
        } catch (err: unknown) {
            addLog('Integration Failed', 'error', getErrorMessage(err));
            setRawAiResponse(`// ERROR:\n${getErrorMessage(err)}`);
            alert('Integration failed: ' + getErrorMessage(err));
        } finally {
            setIsIntegrating(false);
        }
    };

    const generateUpdatedResume = async () => {
        if (!file && !resumeText) {
            addLog('No source data (File or Text) to generate resume', 'error');
            return;
        }

        setIsProcessingFile(true);
        addLog(`Generating final document (${fileType === 'docx' ? 'Modification' : 'Reconstruction'})...`, 'info');

        try {
            const selectedChanges = changes.filter(c => c.selected);
            addLog(`Processing ${selectedChanges.length} active changes...`, 'info');

            let finalBlob: Blob | null = null;

            if (fileType === 'docx' && file) {
                const arrayBuffer = await file.arrayBuffer();
                const modifier = new DocxModifier(arrayBuffer);
                const operations = selectedChanges.map(c => {
                    if (c.type === 'MODIFY' && c.old) return { type: 'modify' as const, old: c.old, new: c.new };
                    else if (c.type === 'ADD' && c.anchor) return { type: 'add' as const, old: c.anchor, new: c.new };
                    return null;
                }).filter((op): op is { type: 'modify' | 'add', old: string, new: string } => op !== null);

                const modifiedBuffer = modifier.modify(operations);
                addLog('Docx modification complete.', 'success');
                finalBlob = new Blob([modifiedBuffer as unknown as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            } else {
                addLog('Building new DOCX from optimized text...', 'info');
                const finalText = applyChangesToText(resumeText, changes);
                finalBlob = await generateDocxFromText(finalText);
                addLog('New DOCX constructed successfully.', 'success');
            }

            const url = URL.createObjectURL(finalBlob!);
            setDownloadUrl(url);

            // Calculate today's date in MMDD format
            const now = new Date();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const dateSuffix = `${mm}${dd}`;

            let finalFileName = `Optimized_Resume_${dateSuffix}.docx`;
            if (analysisResult?.candidate_name) {
                const cleanName = analysisResult.candidate_name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
                finalFileName = `${cleanName} ${dateSuffix}.docx`;
            } else if (importedFileName) {
                const baseName = importedFileName.replace(/\.[^/.]+$/, "");
                finalFileName = `${baseName} ${dateSuffix}.docx`;
            }

            setDownloadFileName(finalFileName);
            addLog(`Ready to download: ${finalFileName}`, 'success');
            setStep('download');
        } catch (err: unknown) {
            addLog('Update Failed', 'error', getErrorMessage(err));
        } finally {
            setIsProcessingFile(false);
        }
    };

    return {
        startIntegration,
        generateUpdatedResume,
        generateCoverLetter
    };
};
