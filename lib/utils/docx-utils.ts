import { Document, Packer, Paragraph } from 'docx';
import { ChangeRequest } from '../types/resume.types';
import { escapeRegExp } from './text-utils';
import {
    isHeaderText, createHeaderParagraph, createEnvironmentParagraph,
    createBulletParagraph, createKeyValueParagraph, createStandardParagraph
} from './docx-styles';

/**
 * Convert text line to DOCX paragraph
 */
export const textLineToParagraph = (line: string): Paragraph => {
    const trimmed = line.trim();

    if (!trimmed) {
        return new Paragraph({ text: '' });
    }

    // Check for header
    if (isHeaderText(trimmed)) {
        return createHeaderParagraph(trimmed);
    }

    // Check for environment/tech stack
    const envMatch = trimmed.match(
        /^(Environment|Tech Stack|Tools|Technologies)(\s*[:|-]\s*)(.+)/i
    );
    if (envMatch) {
        return createEnvironmentParagraph(envMatch) || createStandardParagraph(line);
    }

    // Check for bullet points
    if (/^[•·\-*]/.test(trimmed)) {
        return createBulletParagraph(trimmed);
    }

    // Check for key-value pairs  
    const keyValMatch = trimmed.match(/^([A-Za-z\s]+):\s*(.+)/);
    if (keyValMatch) {
        return createKeyValueParagraph(keyValMatch) || createStandardParagraph(line);
    }

    // Standard text
    return createStandardParagraph(line);
};

/**
 * Apply changes to resume text
 */
export const applyChangesToText = (
    resumeText: string,
    changes: ChangeRequest[]
): string => {
    let finalText = resumeText;

    changes.forEach((change, i) => {
        try {
            if (!change.selected) return;

            if (change.type === 'MODIFY' && change.old && change.new) {
                if (change.old.length < 10) {
                    console.warn(`Change ${i + 1}: Anchor too short, skipping`);
                    return;
                }

                const pattern = escapeRegExp(change.old).replace(/\s+/g, '\\s+');
                const regex = new RegExp(pattern, 'g');
                finalText = finalText.replace(regex, change.new);
            } else if (change.type === 'ADD' && change.anchor && change.new) {
                if (change.anchor.length < 10) {
                    console.warn(`Change ${i + 1}: Anchor too short, skipping`);
                    return;
                }

                const pattern = escapeRegExp(change.anchor).replace(/\s+/g, '\\s+');
                const regex = new RegExp(pattern, 'g');
                finalText = finalText.replace(regex, `$& \n${change.new}`);
            }
        } catch (e) {
            console.error(`Change ${i + 1} Failed:`, e);
        }
    });

    return finalText;
};

/**
 * Generate DOCX document from text
 */
export const generateDocxFromText = async (
    text: string
): Promise<Blob> => {
    const paragraphs = text.split('\n').map(textLineToParagraph);

    const doc = new Document({
        sections: [
            {
                children: paragraphs
            }
        ]
    });

    return await Packer.toBlob(doc);
};

/**
 * Download DOCX blob
 */
export const downloadDocx = (blob: Blob, fileName: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};
