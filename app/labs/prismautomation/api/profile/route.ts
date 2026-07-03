/**
 * app/api/profile/route.ts
 * GET /api/profile  → fetch stored profile (plan, preferences, export count)
 * PUT /api/profile  → update profile preferences
 *
 * On first GET, creates a default Starter profile from session data.
 */

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getProfile, saveProfile } from "@/lib/services/storage-service";
import type { UserProfile } from "@/lib/services/storage-service";

function getToken(session: any): string | null {
  return (session as { accessToken?: string } | null)?.accessToken ?? null;
}

export async function GET() {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let profile = await getProfile(token);

    if (!profile) {
      // Bootstrap from session on first visit
      const user = session?.user;
      profile = await saveProfile(token, {
        displayName: user?.name ?? "User",
        email: user?.email ?? "",
        plan: "Starter",
        resumeExportsUsed: 0,
        resumeExportsLimit: 3,
      });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("[GET /api/profile]", err);
    const isPermissionError = 
      err.code === 403 || 
      err.status === 403 || 
      (err.message && (err.message.includes("permission") || err.message.includes("403") || err.message.includes("scope")));

    if (isPermissionError) {
      return NextResponse.json({ 
        error: "Insufficient permissions to access Google Drive. Please sign out and sign back in to authorize Drive access." 
      }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let updates: Partial<UserProfile>;
  try {
    updates = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Never allow the client to self-elevate their plan
  const { plan: _plan, resumeExportsUsed: _u, resumeExportsLimit: _l, ...safe } = updates;

  try {
    const existing = await getProfile(token);
    if (!existing) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const updated = await saveProfile(token, { ...existing, ...safe });
    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    console.error("[PUT /api/profile]", err);
    const isPermissionError = 
      err.code === 403 || 
      err.status === 403 || 
      (err.message && (err.message.includes("permission") || err.message.includes("403") || err.message.includes("scope")));

    if (isPermissionError) {
      return NextResponse.json({ 
        error: "Insufficient permissions to access Google Drive. Please sign out and sign back in to authorize Drive access." 
      }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
