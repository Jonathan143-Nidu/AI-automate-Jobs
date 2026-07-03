/**
 * app/api/cover-letter/route.ts
 * POST /api/cover-letter
 * Body: { jobDescription: string, applicantName?: string, role?: string,
 *         company?: string, resumeId?: string }
 *
 * If resumeId is provided, the cover letter is linked to that application
 * (stored in the application record if applicationId is also given).
 */

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/services/ai-service";
import { getResume } from "@/lib/services/storage-service";

function getToken(session: any): string | null {
  return (session as { accessToken?: string } | null)?.accessToken ?? null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    jobDescription: string;
    applicantName?: string;
    role?: string;
    company?: string;
    resumeId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.jobDescription) {
    return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });
  }

  // Optionally enrich with resume data
  let resumeSnapshot: { skills?: string[]; recentRole?: string; recentCompany?: string } | undefined;

  if (body.resumeId) {
    const resume = await getResume(token, body.resumeId);
    if (resume) {
      const exp = resume.data.experience?.[0];
      resumeSnapshot = {
        skills: resume.data.skills,
        recentRole: exp?.role,
        recentCompany: exp?.company,
      };
    }
  }

  try {
    const result = await generateCoverLetter({
      jobDescription: body.jobDescription,
      applicantName: body.applicantName,
      role: body.role,
      company: body.company,
      resumeSnapshot,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/cover-letter]", err);
    return NextResponse.json({ error: "Cover letter generation failed" }, { status: 500 });
  }
}
