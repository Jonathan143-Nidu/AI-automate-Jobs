import PizZip from 'pizzip';

export class DocxModifier {
    private zip: PizZip;
    private xmlContent: string;

    constructor(data: Buffer | ArrayBuffer | Uint8Array) {
        // PizZip handles various input types including ArrayBuffer and Uint8Array
        this.zip = new PizZip(data);
        this.xmlContent = this.zip.file('word/document.xml')?.asText() || '';
    }

    modify(changes: { type: 'modify' | 'add', old?: string, new: string }[]): Uint8Array {
        let modifiedXml = this.xmlContent;

        changes.forEach((change) => {
            if (change.type === 'modify' && change.old) {
                modifiedXml = this.handleModify(modifiedXml, change.old, change.new);
            } else if (change.type === 'add' && change.old) {
                // 'old' here acts as the ANCHOR to insert AFTER
                modifiedXml = this.handleAdd(modifiedXml, change.old, change.new);
            }
        });

        this.zip.file('word/document.xml', modifiedXml);

        // Generate as Uint8Array (browser friendly)
        return this.zip.generate({ type: 'uint8array' });
    }

    private handleModify(xml: string, oldText: string, newText: string): string {
        const normSearch = oldText.replace(/\s+/g, ' ').trim();
        if (!normSearch) return xml;

        const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;

        return xml.replace(paragraphRegex, (paragraphXml) => {
            const rawText = paragraphXml.replace(/<[^>]+>/g, '');
            // Decode XML entities (e.g. &amp; -> &) before comparing
            const decodedText = this.decodeXmlEntity(rawText);
            const normRaw = decodedText.replace(/\s+/g, ' ').trim();

            if (normRaw.includes(normSearch) || this.calculateSimilarity(normRaw, normSearch) > 0.9) {
                console.log(`[DocxModifier] Modify Match: "${normSearch.substring(0, 20)}..."`);
                return this.reconstructParagraph(paragraphXml, newText);
            }
            return paragraphXml;
        });
    }

    private handleAdd(xml: string, anchorText: string, newText: string): string {
        const normAnchor = anchorText.replace(/\s+/g, ' ').trim();
        if (!normAnchor) return xml;

        const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;

        return xml.replace(paragraphRegex, (paragraphXml) => {
            const rawText = paragraphXml.replace(/<[^>]+>/g, '');
            // Decode XML entities
            const decodedText = this.decodeXmlEntity(rawText);
            const normRaw = decodedText.replace(/\s+/g, ' ').trim();

            if (normRaw.includes(normAnchor) || this.calculateSimilarity(normRaw, normAnchor) > 0.9) {
                console.log(`[DocxModifier] Add Match (Anchor): "${normAnchor.substring(0, 20)}..."`);

                // 1. Create the NEW paragraph XML. 
                // We clone the style of the anchor paragraph to keep formatting consistent (bullet points etc.)
                const newParagraphXml = this.reconstructParagraph(paragraphXml, newText);

                // 2. Return Anchor + New Paragraph
                return paragraphXml + newParagraphXml;
            }
            return paragraphXml;
        });
    }

    private reconstructParagraph(originalXml: string, newText: string): string {
        const pPrMatch = originalXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
        const pPr = pPrMatch ? pPrMatch[0] : '';

        const rPrMatch = originalXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
        const rPr = rPrMatch ? rPrMatch[0] : '';

        const runsXml = this.generateRunsFromMarkdown(newText, rPr);
        return `<w:p>${pPr}${runsXml}</w:p>`;
    }

    // Simple Dice Coefficient for "Did the AI mess up a character?"
    // Levenshtein distance for fuzzy matching
    private calculateSimilarity(s1: string, s2: string): number {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        const costs = new Array();
        for (let i = 0; i <= longer.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= shorter.length; j++) {
                if (i == 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (longer.charAt(i - 1) != shorter.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[shorter.length] = lastValue;
        }

        return (longer.length - costs[shorter.length]) / longer.length;
    }

    private generateRunsFromMarkdown(text: string, rPr: string): string {
        // Split by **
        const parts = text.split('**');
        let xml = '';

        parts.forEach((part, index) => {
            if (!part) return;

            let runProps = rPr;
            // Every odd index is BOLD (0=normal, 1=bold, 2=normal...)
            const isBold = index % 2 === 1;

            if (isBold) {
                // Inject <w:b/> into rPr
                if (runProps.includes('</w:rPr>')) {
                    runProps = runProps.replace('</w:rPr>', '<w:b/></w:rPr>');
                } else {
                    runProps = `<w:rPr><w:b/></w:rPr>`;
                }
                // Ensure plain text inside bold
                runProps = runProps.replace(/<w:i\/>/g, ''); // Remove italics if inherited
            }

            // ALWAYS inject <w:noProof/> to prevent red squiggles on technical terms
            if (runProps.includes('</w:rPr>')) {
                if (!runProps.includes('w:noProof')) { // Avoid duplicate
                    runProps = runProps.replace('</w:rPr>', '<w:noProof/></w:rPr>');
                }
            } else {
                runProps = `<w:rPr><w:noProof/></w:rPr>`;
            }

            const escaped = this.escapeXml(part);
            xml += `<w:r>${runProps}<w:t xml:space="preserve">${escaped}</w:t></w:r>`;
        });

        return xml;
    }

    private escapeXml(unsafe: string): string {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
            return c;
        });
    }

    private decodeXmlEntity(str: string): string {
        return str.replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    }
}
