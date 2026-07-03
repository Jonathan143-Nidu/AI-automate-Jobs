/**
 * storage-service.ts
 * Persists user data (resumes, applications, profile) in the user's own
 * Google Drive App Data folder — isolated per user, zero extra DB needed.
 *
 * Folder layout inside App Data:
 *   /resumes/        → one JSON file per resume  (id.json)
 *   /applications/   → one JSON file per job app (id.json)
 *   /profile.json    → single user profile file
 */

import { google } from "googleapis";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{ degree: string; university: string; year?: string }>;
  skills: string[];
  summary?: string;
}

export interface Resume {
  id: string;
  title: string;
  data: ResumeData;
  atsScore?: number;
  optimisedBullets?: string[];
  jobDescriptionUsed?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  salary?: string;
  status: "Saved" | "Applied" | "Screening" | "Interview" | "Offer" | "Rejected";
  resumeId?: string;
  coverLetterText?: string;
  notes?: string;
  jobUrl?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  displayName: string;
  email: string;
  plan: "Starter" | "Growth" | "Enterprise";
  resumeExportsUsed: number;
  resumeExportsLimit: number;
  role?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  phone?: string;
  linkedinURL?: string;
  bachelorDegree?: string;
  masterDegree?: string;
  visaType?: string;
  visaExpiry?: string;
  interviewSlots?: string;
  interviewMode?: string;
  preferences?: {
    defaultTemplate?: string;
    emailNotifications?: boolean;
  };
  updatedAt: string;
}

// ─── Drive client factory ────────────────────────────────────────────────────

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

// ─── Folder helpers ──────────────────────────────────────────────────────────

async function getOrCreateFolder(
  drive: ReturnType<typeof getDriveClient>,
  folderName: string,
  parentId?: string
): Promise<string> {
  const query = [
    `name='${folderName}'`,
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false",
    parentId ? `'${parentId}' in parents` : "'appDataFolder' in parents",
  ].join(" and ");

  const res = await drive.files.list({ q: query, spaces: "appDataFolder", fields: "files(id)" });
  if (res.data.files?.length) return res.data.files[0].id!;

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId ?? "appDataFolder"],
    },
    fields: "id",
  });
  return created.data.id!;
}

/**
 * Find a file by name inside a folder.
 * Pass folderId = "appDataFolder" to search the root of App Data space.
 */
async function findFile(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  folderId: string
): Promise<string | null> {
  // "appDataFolder" is a reserved keyword — must not be quoted as a file ID in the query
  const parentClause =
    folderId === "appDataFolder"
      ? "'appDataFolder' in parents"
      : `'${folderId}' in parents`;

  const res = await drive.files.list({
    q: `name='${name}' and ${parentClause} and trashed=false`,
    spaces: "appDataFolder",
    fields: "files(id)",
  });
  return res.data.files?.[0]?.id ?? null;
}

async function readFile<T>(
  drive: ReturnType<typeof getDriveClient>,
  fileId: string
): Promise<T | null> {
  try {
    const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "json" });
    return res.data as T;
  } catch {
    return null;
  }
}

async function writeFile(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  folderId: string,
  data: unknown,
  existingId?: string | null
): Promise<string> {
  const body = JSON.stringify(data);
  const media = { mimeType: "application/json", body };

  if (existingId) {
    await drive.files.update({ fileId: existingId, media });
    return existingId;
  }

  // For new files, parents must use "appDataFolder" keyword (not a real ID)
  const parents = folderId === "appDataFolder" ? ["appDataFolder"] : [folderId];
  const created = await drive.files.create({
    requestBody: { name, parents },
    media,
    fields: "id",
  });
  return created.data.id!;
}

async function deleteFile(
  drive: ReturnType<typeof getDriveClient>,
  fileId: string
): Promise<void> {
  await drive.files.delete({ fileId });
}

// ─── Resume operations ───────────────────────────────────────────────────────

export async function listResumes(accessToken: string): Promise<Resume[]> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "resumes");

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    spaces: "appDataFolder",
    fields: "files(id,name)",
    orderBy: "modifiedTime desc",
  });

  const files = res.data.files ?? [];
  const resumes = await Promise.all(
    files.map(async (f) => {
      const data = await readFile<Resume>(drive, f.id!);
      return data;
    })
  );

  return resumes.filter(Boolean) as Resume[];
}

export async function getResume(accessToken: string, id: string): Promise<Resume | null> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "resumes");
  const fileId = await findFile(drive, `${id}.json`, folderId);
  if (!fileId) return null;
  return readFile<Resume>(drive, fileId);
}

export async function saveResume(
  accessToken: string,
  resume: Omit<Resume, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Resume> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "resumes");

  const now = new Date().toISOString();
  const id = resume.id ?? crypto.randomUUID();
  const fullResume: Resume = { ...resume, id, createdAt: now, updatedAt: now };

  if (resume.id) {
    const existingId = await findFile(drive, `${id}.json`, folderId);
    const existing = existingId ? await readFile<Resume>(drive, existingId) : null;
    fullResume.createdAt = existing?.createdAt ?? now;
    await writeFile(drive, `${id}.json`, folderId, fullResume, existingId);
  } else {
    await writeFile(drive, `${id}.json`, folderId, fullResume);
  }

  return fullResume;
}

export async function deleteResume(accessToken: string, id: string): Promise<boolean> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "resumes");
  const fileId = await findFile(drive, `${id}.json`, folderId);
  if (!fileId) return false;
  await deleteFile(drive, fileId);
  return true;
}

// ─── Application (Job Tracker) operations ───────────────────────────────────

export async function listApplications(accessToken: string): Promise<Application[]> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "applications");

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    spaces: "appDataFolder",
    fields: "files(id,name)",
    orderBy: "modifiedTime desc",
  });

  const files = res.data.files ?? [];
  const apps = await Promise.all(
    files.map(async (f) => readFile<Application>(drive, f.id!))
  );
  return apps.filter(Boolean) as Application[];
}

export async function saveApplication(
  accessToken: string,
  app: Omit<Application, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Application> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "applications");

  const now = new Date().toISOString();
  const id = app.id ?? crypto.randomUUID();
  const fullApp: Application = { ...app, id, createdAt: now, updatedAt: now };

  if (app.id) {
    const existingId = await findFile(drive, `${id}.json`, folderId);
    const existing = existingId ? await readFile<Application>(drive, existingId) : null;
    fullApp.createdAt = existing?.createdAt ?? now;
    await writeFile(drive, `${id}.json`, folderId, fullApp, existingId);
  } else {
    await writeFile(drive, `${id}.json`, folderId, fullApp);
  }

  return fullApp;
}

export async function updateApplicationStatus(
  accessToken: string,
  id: string,
  status: Application["status"],
  extra?: Partial<Application>
): Promise<Application | null> {
  const current = await getApplication(accessToken, id);
  if (!current) return null;
  return saveApplication(accessToken, { ...current, ...extra, status, id });
}

export async function getApplication(
  accessToken: string,
  id: string
): Promise<Application | null> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "applications");
  const fileId = await findFile(drive, `${id}.json`, folderId);
  if (!fileId) return null;
  return readFile<Application>(drive, fileId);
}

export async function deleteApplication(accessToken: string, id: string): Promise<boolean> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateFolder(drive, "applications");
  const fileId = await findFile(drive, `${id}.json`, folderId);
  if (!fileId) return false;
  await deleteFile(drive, fileId);
  return true;
}

// ─── User Profile ────────────────────────────────────────────────────────────

export async function getProfile(accessToken: string): Promise<UserProfile | null> {
  const drive = getDriveClient(accessToken);
  const fileId = await findFile(drive, "profile.json", "appDataFolder");
  if (!fileId) return null;
  return readFile<UserProfile>(drive, fileId);
}

export async function saveProfile(
  accessToken: string,
  profile: Partial<UserProfile> & { email: string; displayName: string }
): Promise<UserProfile> {
  const drive = getDriveClient(accessToken);
  const existing = await getProfile(accessToken);
  const now = new Date().toISOString();

  const full: UserProfile = {
    plan: "Starter",
    resumeExportsUsed: 0,
    resumeExportsLimit: 3,
    ...existing,
    ...profile,
    updatedAt: now,
  };

  const existingId = await findFile(drive, "profile.json", "appDataFolder");
  await writeFile(drive, "profile.json", "appDataFolder", full, existingId);
  return full;
}
