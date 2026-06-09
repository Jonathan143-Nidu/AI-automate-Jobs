import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    console.log('--- Email Send Attempt ---');
    console.log('Env Check:', {
        hasClientId: !!(process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID),
        hasClientSecret: !!(process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET),
        hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN
    });

    try {
        const {
            to, subject: clientSubject, html: htmlContent,
            fileName, fileData, accessToken, threadId, threadMetadata
        } = await req.json();

        // --- Deep Clean Thread ID ---
        let validatedThreadId = threadMetadata?.threadId || threadId;
        if (validatedThreadId && typeof validatedThreadId === 'string') {
            validatedThreadId = validatedThreadId.split(/[/?#]/)[0];
        }

        console.log('--- Send Email Request ---');
        console.log('Recipient:', to);
        console.log('Thread Metadata provided:', !!threadMetadata);
        console.log('Target Thread ID:', validatedThreadId);

        if (!to || !clientSubject || !htmlContent) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
            process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
        );

        if (accessToken) {
            auth.setCredentials({ access_token: accessToken });
        } else {
            auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        }

        const gmail = google.gmail({ version: 'v1', auth });

        // --- ENHANCED: Thread Reply Logic ---
        let finalSubject = clientSubject;
        const replyHeaders: string[] = [];

        // 1. Prioritize pre-fetched metadata if available
        if (threadMetadata) {
            console.log('Using pre-fetched thread metadata for reply');
            if (threadMetadata.messageId) {
                replyHeaders.push(`In-Reply-To: ${threadMetadata.messageId}`);
            }
            if (threadMetadata.allMessageIds?.length) {
                replyHeaders.push(`References: ${threadMetadata.allMessageIds.join(' ')}`);
            }
            if (threadMetadata.subject) {
                finalSubject = threadMetadata.subject.toLowerCase().startsWith('re:')
                    ? threadMetadata.subject
                    : `Re: ${threadMetadata.subject}`;
            }
        }
        // 2. Fallback to server-side lookup if only ID is provided
        else if (validatedThreadId && typeof validatedThreadId === 'string' && validatedThreadId.length > 5) {
            try {
                const response = await gmail.users.threads.get({
                    userId: 'me',
                    id: validatedThreadId,
                    format: 'metadata',
                    metadataHeaders: ['Message-ID', 'Subject']
                });

                const thread = response.data;
                const messages = thread.messages || [];

                if (messages.length > 0) {
                    const allIds = messages.map(m => m.payload?.headers?.find(h => h.name?.toLowerCase() === 'message-id')?.value).filter(Boolean);
                    const lastMsg = messages[messages.length - 1];
                    const lastId = lastMsg.payload?.headers?.find(h => h.name?.toLowerCase() === 'message-id')?.value;
                    const origSub = lastMsg.payload?.headers?.find(h => h.name?.toLowerCase() === 'subject')?.value;

                    if (lastId) {
                        replyHeaders.push(`In-Reply-To: ${lastId}`);
                        if (allIds.length > 0) replyHeaders.push(`References: ${allIds.join(' ')}`);
                    }
                    if (origSub) {
                        finalSubject = origSub.toLowerCase().startsWith('re:') ? origSub : `Re: ${origSub}`;
                    }
                }
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Unknown error";
                console.warn('Thread lookup failed:', message);
                // We continue with client subject and no threading headers if lookup fails
            }
        }

        // --- Prepare Email RFC 2822 ---
        const cleanSubject = finalSubject.replace(/\r|\n/g, '');
        const needsEncoding = /[^\x00-\x7F]/.test(cleanSubject);
        const subjectHeader = needsEncoding
            ? `=?utf-8?B?${Buffer.from(cleanSubject).toString('base64')}?=`
            : cleanSubject;

        const boundary = "__boundary__";
        const emailLines = [
            `To: ${to}`,
            `Subject: ${subjectHeader}`,
            ...replyHeaders,
            'Content-Type: multipart/mixed; boundary="' + boundary + '"',
            'MIME-Version: 1.0',
            '',
            '--' + boundary,
            'Content-Type: text/html; charset="UTF-8"',
            'Content-Transfer-Encoding: 7bit',
            '',
            htmlContent,
            '',
        ];

        if (fileName && fileData) {
            emailLines.push(
                '--' + boundary,
                `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document; name="${fileName}"`,
                'Content-Transfer-Encoding: base64',
                `Content-Disposition: attachment; filename="${fileName}"`,
                '',
                fileData,
                ''
            );
        }

        emailLines.push('--' + boundary + '--');

        const rawMessage = Buffer.from(emailLines.join('\r\n'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const data = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage,
                threadId: validatedThreadId
            },
        });

        return NextResponse.json(data.data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to send email";
        console.error('Gmail API Error:', message);
        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}
