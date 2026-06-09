
import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/utils/pdf-extractor';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        console.log('API received file:', file.name, 'Type:', file.type, 'Size:', file.size);

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            console.log('Processing PDF...');
            text = await extractTextFromPdf(buffer);
            console.log('PDF Extracted. Length:', text.length);
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            text = buffer.toString('utf-8');
        } else {
            console.log('Unsupported file type:', file.type);
            return NextResponse.json({ error: 'Unsupported file type for server-side parsing' }, { status: 400 });
        }

        return NextResponse.json({ text });

    } catch (error: any) {
        // Log the full error to the terminal for debugging
        console.error('SERVER-SIDE PARSE ERROR:', error);
        
        // Return a proper JSON error instead of letting Next.js crash to HTML
        const errorMessage = error?.message || "Internal Server Error during parsing";
        return NextResponse.json({ 
            error: errorMessage,
            details: error?.stack?.split('\n').slice(0, 3).join(' ') // Send a snippet of the stack trace
        }, { status: 500 });
    }
}
