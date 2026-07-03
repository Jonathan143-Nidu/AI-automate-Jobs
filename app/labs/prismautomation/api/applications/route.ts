/**
 * app/api/applications/route.ts
 * GET  /api/applications   → list all job applications
 * POST /api/applications   → create a new application
 *
 * app/api/applications/[id]/route.ts is the companion for GET/PUT/DELETE by id.
 */

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { listApplications, saveApplication } from "@/lib/services/storage-service";
import type { Application } from "@/lib/services/storage-service";

function getToken(session: any): string | null {
  return (session as { accessToken?: string } | null)?.accessToken ?? null;
}

export async function GET() {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const applications = await listApplications(token);
    return NextResponse.json({ applications });
  } catch (err) {
    console.error("[GET /api/applications]", err);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Omit<Application, "id" | "createdAt" | "updatedAt">;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.company || !body.role) {
    return NextResponse.json({ error: "company and role are required" }, { status: 400 });
  }

  // Default status if not provided
  const app: any = { ...body };
  if (!app.status) {
    app.status = "Saved";
  }

  try {
    const saved = await saveApplication(token, app);
    return NextResponse.json({ application: saved }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }
}
