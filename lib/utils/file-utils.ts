/**
 * File handling utilities
 * Extracted from ResumeBuilder.tsx
 */

import mammoth from 'mammoth';

export const getErrorMessage = (e: unknown): string => {
    return e instanceof Error ? e.message : String(e);
};

export const validateFileType = (fileName: string): { isValid: boolean; extension: string; error?: string } => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (extension !== 'docx') {
        return {
            isValid: false,
            extension,
            error: `Only .docx files are supported. Please convert your resume and try again!`
        };
    }

    return { isValid: true, extension: 'docx' };
};

export const getFileType = (extension: string): 'docx' | 'pdf' | 'txt' => {
    if (extension === 'pdf') return 'pdf';
    if (extension === 'txt') return 'txt';
    return 'docx';
};

export const parseDocxFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

export const parseFileViaAPI = async (
    file: File
): Promise<{ text: string; error?: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();

    if (data.error) {
        throw new Error(data.error);
    }

    return { text: data.text };
};

export const base64ToFile = (
    base64Data: string,
    fileName: string
): File | null => {
    try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        return new File([blob], fileName, { type: blob.type });
    } catch (e) {
        console.error('Failed to reconstruct file from base64', e);
        return null;
    }
};
