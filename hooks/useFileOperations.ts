import { useEffect } from 'react';
import { useBuilderState } from './useBuilderState';
import { getFileType, parseDocxFile, parseFileViaAPI, validateFileType } from '../lib/utils/file-utils';

export const useFileOperations = (state: ReturnType<typeof useBuilderState>) => {
    const {
        setResumeText, setImportedFileName, setFile, setFileType,
        setIsNewCandidate, addLog
    } = state;



    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validation = validateFileType(selectedFile.name);
        if (!validation.isValid) {
            alert(validation.error);
            return;
        }

        const type = getFileType(validation.extension);
        setFile(selectedFile);
        setFileType(type);
        setImportedFileName(selectedFile.name);
        state.setStep('input');
        setIsNewCandidate(true);

        try {
            addLog(`Extracting text from ${selectedFile.name}...`, 'info');
            let text = '';
            if (type === 'docx') {
                text = await parseDocxFile(selectedFile);
            } else {
                const apiResult = await parseFileViaAPI(selectedFile);
                text = apiResult.text;
            }
            setResumeText(text);
            addLog('Extraction Complete', 'success');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            addLog(`Extraction Failed: ${msg}`, 'error');
            alert('File extraction failed.');
        }
    };

    // Initial Hydration from LocalStorage/URL Hash
    useEffect(() => {
        const importText = localStorage.getItem('import_resume_text');
        const importName = localStorage.getItem('import_resume_name');
        const importFileData = localStorage.getItem('import_resume_file_data');

        if (importText) {
            setResumeText(importText);
            setImportedFileName(importName || 'Google Drive Resume');
            if (importFileData) {
                try {
                    const byteCharacters = atob(importFileData);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                    const file = new File([blob], importName || 'resume.docx', { type: blob.type });
                    setFile(file);
                    setFileType('docx');
                    setIsNewCandidate(true);
                    addLog('Full Document loaded for high-fidelity editing.', 'success');
                } catch (e) { console.error("Failed to reconstruct file from base64", e); }
            }
            setTimeout(() => addLog(`Imported resume from Google Drive: ${importName || 'Unknown File'}`, 'success'), 500);
            localStorage.removeItem('import_resume_text');
            localStorage.removeItem('import_resume_name');
            localStorage.removeItem('import_resume_file_data');
        }
    }, [addLog, setFile, setFileType, setImportedFileName, setIsNewCandidate, setResumeText]);

    const loadStoredResume = async (resume: { name: string, data: string, type: 'docx' | 'pdf' | 'txt' }) => {
        try {
            // Remove data URL prefix if present
            const base64Data = resume.data.includes(',') ? resume.data.split(',')[1] : resume.data;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            
            let mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (resume.type === 'pdf') mimeType = 'application/pdf';
            if (resume.type === 'txt') mimeType = 'text/plain';

            const blob = new Blob([byteArray], { type: mimeType });
            const file = new File([blob], resume.name, { type: mimeType });

            setFile(file);
            setFileType(resume.type);
            setImportedFileName(resume.name);
            setIsNewCandidate(true);

            // Extract text
            let text = '';
            if (resume.type === 'docx') {
                text = await parseDocxFile(file);
            } else {
                const apiResult = await parseFileViaAPI(file);
                text = apiResult.text;
            }
            setResumeText(text);
            addLog(`Primary resume loaded: ${resume.name}: Successfully`, 'success');
        } catch (e) {
            console.error("Failed to load stored resume", e);
            addLog('Failed to load primary resume from profile.', 'error');
        }
    };

    return {
        handleFileChange,
        loadStoredResume
    };
};
