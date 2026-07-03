import { NextRequest, NextResponse } from 'next/server';
// Force Rebuild: 2026-01-17 - Refactor candidateFiles
import { auth } from '@/auth'; // Adjust path if auth.ts is elsewhere
import { extractTextFromPdf } from '@/utils/pdf-extractor';
import * as mammoth from 'mammoth';

// Types for Drive API Responses
interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
}

interface GenerateResponse {
    text: string;
    fileName: string;
    error?: string;
    success?: boolean;
    fileData?: string;
}

const SECTION_MAP = {
    summary: ['summary', 'profile', 'objective', 'about me'],
    skills: ['skills', 'technical skills', 'technologies', 'tools', 'competencies'],
    experience: ['experience', 'work history', 'employment', 'professional background', 'projects'],
    education: ['education', 'qualifications', 'academic', 'degree', 'university', 'college'],
    certifications: ['certification', 'certificates', 'achievements', 'awards']
};

const IGNORE_KEYWORDS = ['submission', 'details', 'rate', 'tracker', 'visa', 'passport', 'checklist', 'cover letter', 'dl', 'driver', 'license', 'id proof', 'photo', 'candidate information', 'data sheet', 'form'];

// Helper to clean weird copy-paste formatting
function cleanResumeText(text: string): string {
    return text
        // Normalize bullet points to a standard dot or hyphen
        .replace(/[\u2022\u2023\u25E6\u2043\u2219\uf0b7\u00b7\u25cf]/g, '•')
        .replace(/[\u2013\u2014]/g, '-') // Normalize dashes
        .replace(/\r\n/g, '\n')       // Normalize newlines
        .replace(/\t/g, '    ')       // Replace tabs with spaces
        .replace(/[^\x20-\x7E\n•]/g, (char) => {
            // Remove control chars but keep normal text and newlines
            return char.charCodeAt(0) > 127 ? char : '';
        })
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive blank lines
        .trim();
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // @ts-expect-error - accessToken is added in the session callback in auth.ts
        const accessToken = session?.accessToken;

        if (!accessToken) {
            return NextResponse.json({ error: "Unauthorized: Please sign in again to grant Drive access." }, { status: 401 });
        }

        const body = await req.json();
        const { folderUrl, consultantName } = body;

        if (!folderUrl) {
            return NextResponse.json({ error: "No folder URL provided" }, { status: 400 });
        }

        console.log(`[Drive API] Processing request for: ${consultantName}`);

        // 1. Extract Resource ID (File or Folder)
        // Supports: /folders/ID, /file/d/ID, /open?id=ID, or just ID
        const idMatch = folderUrl.match(/[-\w]{25,}/);
        if (!idMatch) {
            return NextResponse.json({ error: "Invalid Google Drive URL" }, { status: 400 });
        }
        const resourceId = idMatch[0];
        console.log(`[Drive API] Resource ID: ${resourceId}`);

        let candidateFiles: DriveFile[] = [];

        // 2. CHECK: Is this a single file or a folder?
        const checkUrl = `https://www.googleapis.com/drive/v3/files/${resourceId}?fields=id,name,mimeType,trashed`;
        const checkRes = await fetch(checkUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (checkRes.ok) {
            const fileData = await checkRes.json();

            // If it's a folder, we LIST its children
            if (fileData.mimeType === 'application/vnd.google-apps.folder') {
                console.log(`[Drive API] Resource is a FOLDER. Listing contents...`);
                // Query: Inside folder, not trashed
                const listQuery = `'${resourceId}' in parents and trashed = false`;
                const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(listQuery)}&fields=files(id, name, mimeType)`;

                const listRes = await fetch(listUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (listRes.ok) {
                    const listData = await listRes.json();
                    candidateFiles = listData.files || [];
                }
            } else {
                // It is a SINGLE FILE (Direct Resume Link)
                console.log(`[Drive API] Resource is a SINGLE FILE. skipping search.`);
                candidateFiles = [fileData];
            }
        } else {
            const errorText = await checkRes.text(); // Get error details from Google
            console.error(`[Drive API] Failed to check resource type for ${resourceId}. Status: ${checkRes.status} ${checkRes.statusText}. Error: ${errorText}`);

            if (checkRes.status === 401) {
                return NextResponse.json({ error: "Access Token Expired. Please refresh page to login again." }, { status: 401 });
            }
            if (checkRes.status === 404) {
                return NextResponse.json({ error: "File not found or no access permission." }, { status: 404 });
            }

            return NextResponse.json({ error: `Failed to access Drive Link. (${checkRes.status})` }, { status: 500 });
        }

        if (candidateFiles.length === 0) {
            return NextResponse.json({ error: "No files found to process." }, { status: 404 });
        }

        console.log(`[Drive API] Found ${candidateFiles.length} candidates to process.`);

        // 3. Filter Candidate Files (Ignore "Submission Details", etc.)
        candidateFiles = candidateFiles.filter(f => {
            const name = f.name.toLowerCase();
            const isDoc = f.mimeType === 'application/pdf' ||
                f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                f.mimeType === 'application/vnd.google-apps.document'; // Add Google native docs

            // Explicitly ignore trash files
            if (IGNORE_KEYWORDS.some(k => name.includes(k))) return false;

            return isDoc;
        });

        if (candidateFiles.length === 0) {
            return NextResponse.json({ error: "No valid resume documents found (filtered out submission details)." }, { status: 404 });
        }

        // 3a. Sort by Priority: DOCX first, then PDF
        candidateFiles.sort((a, b) => {
            const isWordA = a.mimeType.includes('wordprocessingml') || a.mimeType.includes('google-apps.document');
            const isWordB = b.mimeType.includes('wordprocessingml') || b.mimeType.includes('google-apps.document');
            if (isWordA && !isWordB) return -1; // A is Word/GDoc, put it first
            if (!isWordA && isWordB) return 1;  // B is Word/GDoc, put it first
            return 0;
        });

        // 4. Smart Analysis Loop
        let verifiedResume: { text: string; file: DriveFile; fileBuffer: Buffer } | null = null;
        console.log(`[Drive API] Analyzing ${candidateFiles.length} potential candidates (Priority: DOCX > PDF)...`);
        console.log(`[Drive API] Refactored variable name verified.`);

        for (const file of candidateFiles) {
            console.log(`[Drive API] Checking: ${file.name}...`);

            try {
                // Download File Content
                // Handle Google Docs via Export API
                let fileUrl = '';
                if (file.mimeType === 'application/vnd.google-apps.document') {
                    // Export Google Doc as DOCX to preserve formatting (bullets, indentation)
                    fileUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
                } else {
                    fileUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                }

                const fileRes = await fetch(fileUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (!fileRes.ok) continue;

                // Parse Text
                let extractedText = '';
                const arrayBuffer = await fileRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                if (file.mimeType === 'application/pdf') {
                    extractedText = await extractTextFromPdf(buffer);
                } else if (
                    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    file.mimeType === 'application/vnd.google-apps.document'
                ) {
                    // Use Mammoth for both Word and Google Docs (exported as Word)
                    const result = await mammoth.extractRawText({ buffer });
                    extractedText = result.value;
                }

                if (!extractedText || extractedText.length < 50) continue;

                // Keyword Verification
                const lowerText = extractedText.toLowerCase();

                // 1. Negative Content Check (Refined)
                // We don't block "visa" in content because resumes say "Visa Status: H1B".
                // We only block explicit non-resume document titles if found in text.
                const CONTENT_BANS = ['driving license', 'rate card', 'rate sheet', 'submission details', 'passport copy', 'id proof', 'candidate information', 'candidate data'];

                const foundNegative = CONTENT_BANS.find(k => lowerText.includes(k));
                if (foundNegative) {
                    console.log(`[Drive API] Skipped ${file.name} - Content contains banned phrase: "${foundNegative}"`);
                    continue;
                }

                // 2. Positive Verification: Strict Section Check
                const sectionsFound: string[] = [];
                for (const [section, keywords] of Object.entries(SECTION_MAP)) {
                    if (keywords.some(k => lowerText.includes(k))) {
                        sectionsFound.push(section);
                    }
                }

                if (sectionsFound.length >= 3) {
                    // Confirmed Resume!
                    console.log(`[Drive API] MATCH FOUND! ${file.name} is a resume (Sections: ${sectionsFound.join(', ')})`);
                    verifiedResume = { text: extractedText, file, fileBuffer: buffer };
                    break; // Stop looking, we found the best one
                } else {
                    console.log(`[Drive API] Skipped ${file.name} - Not enough resume sections (${sectionsFound.length}/3 found: ${sectionsFound.join(', ')}).`);
                }

            } catch (err) {
                console.error(`[Drive API] Error parsing ${file.name}:`, err);
            }
        }

        if (!verifiedResume) {
            // Fallback: If no "smart" match found, just take the first filtered file
            return NextResponse.json({ error: "Could not identify a clear resume file from content. (No file matched 3+ required sections)" }, { status: 404 });
        }

        return NextResponse.json({
            text: cleanResumeText(verifiedResume.text),
            fileName: verifiedResume.file.name,
            fileData: verifiedResume.fileBuffer.toString('base64'), // Send full file for perfect reconstruction
            success: true
        } as GenerateResponse);

    } catch (error: unknown) {
        console.error("[Drive API] Error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
