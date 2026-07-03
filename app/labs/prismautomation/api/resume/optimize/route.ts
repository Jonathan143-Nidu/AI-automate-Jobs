/**
 * app/api/resume/optimize/route.ts
 * POST /api/resume/optimize
 * Body: { resumeId: string, jobDescription: string }
 *   OR  { resumeSnapshot: object, jobDescription: string }
 *
 * Returns AI-optimised bullets, ATS score, missing keywords, and tips.
 * If resumeId is provided, the resume is updated in Drive automatically.
 */

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { optimiseResume } from "@/lib/services/ai-service";
import { getResume, saveResume } from "@/lib/services/storage-service";
import type { OptimiseInput } from "@/lib/services/ai-service";

function getToken(session: any): string | null {
  return (session as { accessToken?: string } | null)?.accessToken ?? null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    resumeId?: string;
    resumeSnapshot?: OptimiseInput["resumeSnapshot"];
    jobDescription: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.jobDescription) {
    return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });
  }

  let resumeSnapshot = body.resumeSnapshot;

  // Load from Drive if resumeId provided
  if (body.resumeId && !resumeSnapshot) {
    const resume = await getResume(token, body.resumeId);
    if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

    const exp = resume.data.experience?.[0];
    resumeSnapshot = {
      name: resume.data.name,
      role: exp?.role,
      company: exp?.company,
      skills: resume.data.skills,
      bullets: exp?.bullets,
    };
  }

  if (!resumeSnapshot) {
    return NextResponse.json(
      { error: "Either resumeId or resumeSnapshot is required" },
      { status: 400 }
    );
  }

  try {
    const result = await optimiseResume({ resumeSnapshot, jobDescription: body.jobDescription });

    // Auto-update the saved resume if we have its id
    if (body.resumeId) {
      const resume = await getResume(token, body.resumeId);
      if (resume) {
        const exp = resume.data.experience?.[0];
        await saveResume(token, {
          ...resume,
          atsScore: result.atsScore,
          optimisedBullets: result.optimisedBullets,
          jobDescriptionUsed: body.jobDescription,
          data: {
            ...resume.data,
            experience: resume.data.experience.map((e, i) =>
              i === 0 ? { ...e, bullets: result.optimisedBullets } : e
            ),
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/resume/optimize]", err);
    return NextResponse.json({ error: "AI optimisation failed" }, { status: 500 });
  }
}
