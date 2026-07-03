/**
 * Admin Service - Handles user management using Google Drive App Data (JSON file)
 * 
 * Stores whitelist as a JSON file in the admin's Google Drive appDataFolder.
 * This uses the existing 'drive.appdata' scope — no extra permissions needed.
 * 
 * File: prism_admin_whitelist.json in hiring@innovcentric.com's appDataFolder
 */

import { auth } from '@/auth';

const WHITELIST_FILE_NAME = 'prism_admin_whitelist.json';
const SUPER_ADMIN_EMAILS = ['admin@prismopss.com', 'thotajonathan.249@gmail.com'];

export interface AdminUser {
    email: string;
    role: string;
    status: 'active' | 'inactive';
    createdAt: string;
    accessStart?: string;
    accessEnd?: string;
    excludedTypes?: string[];
}

interface WhitelistData {
    users: AdminUser[];
}

export class AdminService {

    /**
     * Refresh the master admin token using ADMIN_REFRESH_TOKEN env var
     */
    private async refreshMasterToken(): Promise<string | null> {
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
        } catch (error) {
            console.error('Failed to refresh master token:', error);
            return null;
        }
    }

    /**
     * Get the best available token: master first, then session fallback
     */
    private async getAdminToken(userAccessToken?: string): Promise<string | null> {
        const masterToken = await this.refreshMasterToken();
        if (masterToken) {
            console.log('✅ Using ADMIN_REFRESH_TOKEN (master authority)');
            return masterToken;
        }

        if (userAccessToken) {
            console.warn('⚠️ ADMIN_REFRESH_TOKEN not set. Using logged-in admin session token.');
            return userAccessToken;
        }

        console.error('❌ No token available for admin operation.');
        return null;
    }

    /**
     * Get Drive client using googleapis (server-side only, not Edge)
     */
    private async getDriveClient(accessToken: string) {
        const { google } = await import('googleapis');
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    /**
     * Find the whitelist JSON file in appDataFolder
     */
    private async findWhitelistFile(drive: any): Promise<string | null> {
        try {
            const res = await drive.files.list({
                q: `name='${WHITELIST_FILE_NAME}' and trashed=false`,
                spaces: 'appDataFolder',
                fields: 'files(id)',
            });
            return res.data.files?.[0]?.id ?? null;
        } catch (err) {
            console.error('Failed to find whitelist file:', err);
            return null;
        }
    }

    /**
     * Read the whitelist JSON from appDataFolder
     */
    private async readWhitelist(drive: any): Promise<AdminUser[]> {
        const fileId = await this.findWhitelistFile(drive);
        if (!fileId) return [];

        try {
            const res = await drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'json' }
            );
            const data = res.data as WhitelistData;
            return data?.users || [];
        } catch (err) {
            console.error('Failed to read whitelist:', err);
            return [];
        }
    }

    /**
     * Write the whitelist JSON to appDataFolder (create or update)
     */
    private async writeWhitelist(drive: any, users: AdminUser[]): Promise<boolean> {
        try {
            const body = JSON.stringify({ users });
            const media = { mimeType: 'application/json', body };
            const existingId = await this.findWhitelistFile(drive);

            if (existingId) {
                await drive.files.update({ fileId: existingId, media });
            } else {
                await drive.files.create({
                    requestBody: { name: WHITELIST_FILE_NAME, parents: ['appDataFolder'] },
                    media,
                    fields: 'id',
                });
            }
            return true;
        } catch (err) {
            console.error('Failed to write whitelist:', err);
            return false;
        }
    }

    /**
     * Get all users from the whitelist
     */
    async getUsers(): Promise<AdminUser[]> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const sessionToken = session?.accessToken as string | undefined;
            const accessToken = await this.getAdminToken(sessionToken);
            if (!accessToken) return [];

            const drive = await this.getDriveClient(accessToken);
            return await this.readWhitelist(drive);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            return [];
        }
    }

    /**
     * Add a new email to the whitelist
     */
    async addUser(email: string, role: 'admin' | 'user' = 'user', accessStart?: string, accessEnd?: string): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const sessionToken = session?.accessToken as string | undefined;
            const accessToken = await this.getAdminToken(sessionToken);

            if (!accessToken) {
                console.error('❌ addUser: No access token available');
                return false;
            }

            const drive = await this.getDriveClient(accessToken);
            const users = await this.readWhitelist(drive);

            // Check if already exists
            const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
            if (exists) {
                console.warn(`User ${email} already in whitelist`);
                return false;
            }

            const newUser: AdminUser = {
                email: email.toLowerCase(),
                role,
                status: 'active',
                createdAt: new Date().toISOString(),
                accessStart: accessStart || '',
                accessEnd: accessEnd || '',
                excludedTypes: [],
            };

            users.push(newUser);
            const ok = await this.writeWhitelist(drive, users);
            if (ok) console.log(`✅ User ${email} added to whitelist`);
            return ok;
        } catch (error) {
            console.error('❌ Failed to add user:', error);
            return false;
        }
    }

    /**
     * Toggle a user's status between active and inactive
     */
    async toggleUserStatus(email: string, currentStatus: 'active' | 'inactive'): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const sessionToken = session?.accessToken as string | undefined;
            const accessToken = await this.getAdminToken(sessionToken);
            if (!accessToken) return false;

            const drive = await this.getDriveClient(accessToken);
            const users = await this.readWhitelist(drive);

            const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
            if (userIndex === -1) return false;

            users[userIndex].status = currentStatus === 'active' ? 'inactive' : 'active';
            return await this.writeWhitelist(drive, users);
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            return false;
        }
    }

    /**
     * Toggle job type exclusion for a user
     */
    async toggleUserExclusion(email: string, jobType: string): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const sessionToken = session?.accessToken as string | undefined;
            const accessToken = await this.getAdminToken(sessionToken);
            if (!accessToken) return false;

            const drive = await this.getDriveClient(accessToken);
            const users = await this.readWhitelist(drive);

            const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
            if (userIndex === -1) return false;

            let exclusions = users[userIndex].excludedTypes || [];

            if (jobType === 'ALL_CLEAR') {
                exclusions = [];
            } else if (exclusions.includes(jobType.toLowerCase())) {
                exclusions = exclusions.filter(t => t !== jobType.toLowerCase());
            } else {
                exclusions.push(jobType.toLowerCase());
            }

            users[userIndex].excludedTypes = exclusions;
            return await this.writeWhitelist(drive, users);
        } catch (error) {
            console.error(`Failed to toggle exclusion for ${jobType}:`, error);
            return false;
        }
    }

    /**
     * Delete a user from the whitelist
     */
    async deleteUser(email: string): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const sessionToken = session?.accessToken as string | undefined;
            const accessToken = await this.getAdminToken(sessionToken);
            if (!accessToken) return false;

            const drive = await this.getDriveClient(accessToken);
            const users = await this.readWhitelist(drive);

            const filtered = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
            if (filtered.length === users.length) return false; // not found

            return await this.writeWhitelist(drive, filtered);
        } catch (error) {
            console.error('Failed to delete user:', error);
            return false;
        }
    }

    /**
     * Get a specific user's filter/exclusion settings
     */
    async getUserFilters(email: string): Promise<{ excludedTypes: string[] }> {
        try {
            const users = await this.getUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            return { excludedTypes: user?.excludedTypes || [] };
        } catch {
            return { excludedTypes: [] };
        }
    }

    /**
     * Check if an email is whitelisted (Edge-safe fetch-only version in whitelist-check.ts)
     * This server-side version uses googleapis for completeness.
     */
    async isWhitelisted(email: string, userAccessToken: string): Promise<boolean> {
        // Super admins always allowed
        if (SUPER_ADMIN_EMAILS.some(a => a.toLowerCase() === email.toLowerCase())) return true;

        try {
            let token = await this.refreshMasterToken();
            if (!token) token = userAccessToken;
            if (!token) return false;

            const drive = await this.getDriveClient(token);
            const users = await this.readWhitelist(drive);

            if (users.length === 0) {
                // No whitelist file yet — fail open so admin isn't locked out
                console.warn('[whitelist] No whitelist file found. Allowing login as fail-safe.');
                return true;
            }

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
            console.error('[whitelist] Server check failed, allowing as fail-safe:', err);
            return true;
        }
    }
}

export const adminService = new AdminService();
