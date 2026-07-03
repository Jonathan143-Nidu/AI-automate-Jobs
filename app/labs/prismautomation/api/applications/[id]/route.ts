/**
 * app/api/applications/[id]/route.ts
 * GET    /api/applications/:id  → get one application
 * PUT    /api/applications/:id  → update (status, notes, salary, etc.)
 * DELETE /api/applications/:id  → remove from tracker
 */

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getApplication,
  saveApplication,
  deleteApplication,
} from "@/lib/services/storage-service";
import type { Application } from "@/lib/services/storage-service";

function getToken(session: any): string | null {
  return (session as { accessToken?: string } | null)?.accessToken ?? null;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const app = await getApplication(token, id);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ application: app });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const current = await getApplication(token, id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updates: Partial<Application>;
  try {
    updates = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Merge and save — id, createdAt cannot be overwritten
  const updated = await saveApplication(token, {
    ...current,
    ...updates,
    id,
  });

  return NextResponse.json({ application: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const token = getToken(session);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteApplication(token, id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
