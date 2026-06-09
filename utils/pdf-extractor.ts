import PDFParser from "pdf2json";

// Polyfill DOMMatrix for Node.js environment - pdf2json/pdf.js dependency
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        m11 = 1; m12 = 0; m13 = 0; m14 = 0;
        m21 = 0; m22 = 1; m23 = 0; m24 = 0;
        m31 = 0; m32 = 0; m33 = 1; m34 = 0;
        m41 = 0; m42 = 0; m43 = 0; m44 = 1;
        constructor() {}
    };
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new (PDFParser as any)(null, 1); // 1 = text content only

        pdfParser.on("pdfParser_dataError", (errData: any) => {
            const msg = typeof errData === 'string' ? errData : JSON.stringify(errData);
            console.error("PDF Parser Error:", msg);
            reject(new Error("PDF Parsing failed: " + msg));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            try {
                // RESILIENT HARVESTER: Bypassing internal bugs and handling malformed URIs
                let extractedText = "";
                
                if (pdfData && pdfData.Pages) {
                    pdfData.Pages.forEach((page: any) => {
                        if (page.Texts) {
                            page.Texts.forEach((textItem: any) => {
                                if (textItem.R && textItem.R[0]) {
                                    const rawT = textItem.R[0].T;
                                    try {
                                        // Standard decode
                                        const decodedText = decodeURIComponent(rawT);
                                        extractedText += decodedText + " ";
                                    } catch (e) {
                                        // Fallback for malformed URIs (common in complex PDFs)
                                        try {
                                            const fallbackText = unescape(rawT);
                                            extractedText += fallbackText + " ";
                                        } catch (e2) {
                                            // Last resort: just use the raw text if it's readable
                                            extractedText += rawT.replace(/%[0-9A-F]{2}/gi, ' ') + " ";
                                        }
                                    }
                                }
                            });
                        }
                        extractedText += "\n";
                    });
                }

                resolve(extractedText.trim());
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                reject(new Error("Failed to harvest text from PDF data: " + msg));
            }
        });

        try {
            pdfParser.parseBuffer(buffer);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            reject(new Error("Failed to load PDF buffer: " + msg));
        }
    });
}
