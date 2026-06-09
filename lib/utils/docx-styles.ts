import { Paragraph, TextRun } from 'docx';

export const FONT_FACE = 'Arial';
export const SIZE_BODY = 21; // 10.5pt
export const SIZE_HEADER = 28; // 14pt

export const isHeaderText = (text: string): boolean => {
    const headerKeywords = [
        'experience', 'education', 'skills', 'summary', 'projects',
        'certifications', 'languages', 'professional summary', 'technical skills'
    ];

    return (
        (text.length < 50 && /^[A-Z\s&]+$/.test(text) && text.length > 3) ||
        headerKeywords.some(
            (kw) => text.toLowerCase() === kw || text.toLowerCase().startsWith(kw + ':')
        )
    );
};

export const createHeaderParagraph = (text: string): Paragraph => {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: SIZE_HEADER,
                font: FONT_FACE,
                color: '2E1065',
                allCaps: true
            })
        ],
        spacing: { before: 240, after: 120 }
    });
};

export const createEnvironmentParagraph = (match: RegExpMatchArray): Paragraph | null => {
    if (!match) return null;

    return new Paragraph({
        children: [
            new TextRun({
                text: match[1] + match[2],
                bold: true,
                size: SIZE_BODY,
                font: FONT_FACE
            }),
            new TextRun({ text: match[3], size: SIZE_BODY, font: FONT_FACE })
        ],
        alignment: 'both' as const
    });
};

export const createBulletParagraph = (text: string): Paragraph => {
    const cleanText = text.replace(/^[•·\-*]\s*/, '');
    const parts = cleanText.split(/(\*\*.*?\*\*)/g);

    const children = parts.map((part) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return new TextRun({
                text: part.slice(2, -2),
                bold: true,
                size: SIZE_BODY,
                font: FONT_FACE
            });
        }
        return new TextRun({ text: part, size: SIZE_BODY, font: FONT_FACE });
    });

    return new Paragraph({
        children: children,
        bullet: { level: 0 },
        alignment: 'both' as const
    });
};

export const createKeyValueParagraph = (match: RegExpMatchArray): Paragraph | null => {
    if (!match || match[1].length >= 20) return null;

    return new Paragraph({
        children: [
            new TextRun({
                text: match[1] + ': ',
                bold: true,
                size: SIZE_BODY,
                font: FONT_FACE
            }),
            new TextRun({ text: match[2], size: SIZE_BODY, font: FONT_FACE })
        ],
        alignment: 'both' as const
    });
};

export const createStandardParagraph = (line: string): Paragraph => {
    const parts = line.split(/(\*\*.*?\*\*)/g);

    const children = parts.map((part) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return new TextRun({
                text: part.slice(2, -2),
                bold: true,
                size: SIZE_BODY,
                font: FONT_FACE
            });
        }
        return new TextRun({ text: part, size: SIZE_BODY, font: FONT_FACE });
    });

    return new Paragraph({
        children: children,
        alignment: 'both' as const,
        spacing: { after: 60 }
    });
};
