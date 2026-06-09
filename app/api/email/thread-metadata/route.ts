import { google } from "googleapis";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { threadId, accessToken: bodyToken } = body;

        console.log("--- Thread Metadata Request ---");
        console.log("Thread ID:", threadId);

        if (!threadId) {
            return NextResponse.json(
                { error: "Thread ID is required" },
                { status: 400 }
            );
        }

        const session = await auth();
        // @ts-expect-error - accessToken is added in the session callback in auth.ts
        const accessToken = bodyToken || session?.accessToken;

        if (!accessToken) {
            return NextResponse.json(
                { error: "Unauthorized - No Access Token" },
                { status: 401 }
            );
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
            process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET
        );

        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // ✅ THE ONLY VALID CALL
        const response = await gmail.users.threads.get({
            userId: "me",
            id: threadId,
            format: "metadata",
            metadataHeaders: ["From", "To", "Subject", "Date", "Message-ID"]
        });

        const thread = response.data;

        if (!thread.messages?.length) {
            return NextResponse.json(
                { error: "No messages found in thread" },
                { status: 404 }
            );
        }

        const latestMessage = thread.messages[thread.messages.length - 1];
        const headers = latestMessage.payload?.headers || [];

        const get = (n: string) =>
            headers.find(h => h.name?.toLowerCase() === n)?.value || "";

        const fromHeader = get("from");
        const subject = get("subject");
        const messageId = get("message-id");

        let recruiterName = "";
        let recruiterEmail = "";

        const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
        if (match) {
            recruiterName = match[1].replace(/"/g, "").trim();
            recruiterEmail = match[2].trim();
        } else {
            recruiterEmail = fromHeader;
        }

        const allMessageIds =
            thread.messages
                .map(m =>
                    m.payload?.headers?.find(
                        h => h.name?.toLowerCase() === "message-id"
                    )?.value
                )
                .filter(Boolean) as string[];

        return NextResponse.json({
            threadId: thread.id,
            subject,
            recruiterName,
            recruiterEmail,
            messageId,
            allMessageIds
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Gmail thread metadata error:", message);

        // ✅ Gmail validation error → 400, NOT 500
        return NextResponse.json(
            { error: "Invalid Gmail thread ID or insufficient permissions" },
            { status: 400 }
        );
    }
}
