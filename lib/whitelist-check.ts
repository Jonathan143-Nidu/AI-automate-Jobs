/**
 * lib/whitelist-check.ts
 * Lightweight whitelist checker using only fetch() — safe for Edge Runtime.
 * Reads the whitelist JSON file from Google Drive appDataFolder.
 * Does NOT import googleapis or any Node.js-only modules.
 */

const WHITELIST_FILE_NAME = 'prism_admin_whitelist.json';
const SUPER_ADMIN_EMAILS = ['admin@prismopss.com', 'thotajonathan.249@gmail.com'];

interface AdminUser {
    email: string;
    status: 'active' | 'inactive';
    accessStart?: string;
    accessEnd?: string;
}

async function refreshMasterToken(): Promise<string | null> {
    const refreshToken = process.env.ADMIN_REFRESH_TOKEN;
    if (!refreshToken) return null;

    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.AUTH_GOOGLE_ID!,
                client_secret: process.env.AUTH_GOOGLE_SECRET!,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });
        const data = await res.json();
        return data.access_token || null;
    } catch {
        return null;
    }
}

async function findWhitelistFileId(token: string): Promise<string | null> {
    try {
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name%3D'${WHITELIST_FILE_NAME}'%20and%20trashed%3Dfalse&spaces=appDataFolder&fields=files(id)`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        return data.files?.[0]?.id ?? null;
    } catch {
        return null;
    }
}

async function readWhitelistFile(token: string, fileId: string): Promise<AdminUser[]> {
    try {
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        return data?.users || [];
    } catch {
        return [];
    }
}

export async function isEmailWhitelisted(email: string, userAccessToken: string): Promise<boolean> {
    // Super admins always allowed
    if (SUPER_ADMIN_EMAILS.some(a => a.toLowerCase() === email.toLowerCase())) return true;

    // Get token: master first, user token fallback
    let token = await refreshMasterToken();
    if (!token) token = userAccessToken;
    if (!token) return false;

    try {
        const fileId = await findWhitelistFileId(token);
        if (!fileId) {
            // No whitelist file yet — fail open (admin can still log in to create it)
            console.warn('[whitelist] No whitelist file found. Allowing login as fail-safe.');
            return true;
        }

        const users = await readWhitelistFile(token, fileId);
        if (users.length === 0) return true; // empty list = fail open

        const now = new Date();
        return users.some(user => {
            if (user.email.toLowerCase() !== email.toLowerCase()) return false;
            if (user.status !== 'active') return false;

            const accessStart = user.accessStart ? new Date(user.accessStart) : null;
            const accessEnd = user.accessEnd ? new Date(user.accessEnd) : null;

            if (accessStart && now < accessStart) return false;
            if (accessEnd) {
                const endOfDay = new Date(accessEnd);
                endOfDay.setHours(23, 59, 59, 999);
                if (now > endOfDay) return false;
            }
            return true;
        });
    } catch (err) {
        console.error('[whitelist] Check failed, allowing as fail-safe:', err);
        return true;
    }
}
