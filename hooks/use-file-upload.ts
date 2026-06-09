/**
 * Custom hook for managing file uploads and parsing
 */

import { useState } from 'react';
import { validateFileType, parseDocxFile, parseFileViaAPI, getFileType } from '@/lib/utils/file-utils';
import { FileType } from '@/lib/types/resume.types';

export const useFileUpload = () => {
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState<FileType>('docx');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileUpload = async (
        file: File,
        onSuccess: (text: string, fileName: string, fileType: FileType) => void
    ) => {
        setIsUploading(true);
        setUploadError(null);

        try {
            // Validate file type
            const validation = validateFileType(file.name);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            const detectedFileType = getFileType(validation.extension);
            setFileType(detectedFileType);
            setFileName(file.name);

            let extractedText = '';

            // Parse based on file type
            if (detectedFileType === 'docx') {
                extractedText = await parseDocxFile(file);
            } else {
                const result = await parseFileViaAPI(file);
                if (result.error) {
                    throw new Error(result.error);
                }
                extractedText = result.text;
            }

            if (!extractedText.trim()) {
                throw new Error('No text could be extracted from the file');
            }

            onSuccess(extractedText, file.name, detectedFileType);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
            setUploadError(errorMessage);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFileName('');
        setFileType('docx');
        setIsUploading(false);
        setUploadError(null);
    };

    return {
        fileName,
        fileType,
        isUploading,
        uploadError,
        handleFileUpload,
        reset
    };
};
