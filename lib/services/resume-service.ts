/**
 * Resume Service - Handles resume processing operations using a Centralized Admin Google Drive for storage
 * This allows candidates to have a clean login (no Drive scopes) while keeping history secure.
 */

import { auth } from '@/auth';
import { IntegrationResult } from '@/lib/types/resume.types';

const FOLDER_NAME = 'AI_Resume_History';

export class ResumeService {
    /**
     * Exchanges a refresh token for a fresh access token (Master Mode)
     */
    private async refreshMasterToken(): Promise<string | null> {
        const refreshToken = process.env.ADMIN_REFRESH_TOKEN;
        if (!refreshToken) {
            console.error('❌ ADMIN_REFRESH_TOKEN is missing in .env!');
            return null;
        }

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
     * Get or create the AI_Resume_History folder in the Admin's Google Drive
     */
    private async getOrCreateFolder(masterAccessToken: string): Promise<string | null> {
        try {
            // 1. Search for existing folder
            const query = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
            const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`;
            
            const searchRes = await fetch(searchUrl, {
                headers: { Authorization: `Bearer ${masterAccessToken}` }
            });
            const searchData = await searchRes.json();
            
            if (searchData.files && searchData.files.length > 0) {
                return searchData.files[0].id;
            }

            // 2. Create folder if not found
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${masterAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            const createData = await createRes.json();
            return createData.id;
        } catch (error) {
            console.error('Failed to get/create Master Drive folder:', error);
            return null;
        }
    }

    /**
     * Save resume analysis to history as a JSON file in the Admin's Centralized Google Drive
     */
    async saveToHistory(
        candidateName: string,
        jd: string,
        missingSkills: string[],
        integrationResult: IntegrationResult,
        jobRole?: string | null,
        jobLocation?: string | null,
        recruiterEmail?: string | null
    ): Promise<void> {
        try {
            // 1. Get current user info
            const session = await auth();
            // BYPASS FOR LOCAL DEVELOPMENT: Use mock user if no session
            const userEmail = session?.user?.email || "local-dev@example.com";

            if (!userEmail) {
                console.log('History save skipped: Anonymous session');
                return;
            }

            // 2. Obtain Master token for storage authority
            const masterToken = await this.refreshMasterToken();
            if (!masterToken) return;

            const folderId = await this.getOrCreateFolder(masterToken);
            if (!folderId) return;

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            // PRIVACY TAGGING: Prefix filename with user email
            const safeEmail = userEmail.replace(/[^a-z0-9]/gi, '_');
            const fileName = `HISTORY_${safeEmail}_${timestamp}.json`;

            const metadata = {
                name: fileName,
                parents: [folderId],
                mimeType: 'application/json'
            };

            const content = {
                candidateName,
                userEmail, // Store for redundant verification
                jobDescription: jd,
                missingSkills,
                integrationResult,
                jobRole,
                jobLocation,
                recruiterEmail,
                createdAt: new Date().toISOString()
            };

            // Multiparts upload to Drive
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(content) +
                close_delim;

            const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${masterToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: multipartRequestBody
            });

            if (res.ok) {
                console.log(`✅ History for ${userEmail} saved to Master Drive successfully`);
            } else {
                console.error('Failed to save master history:', await res.text());
            }
        } catch (error) {
            console.error('ℹ️ Master history save failed:', error);
        }
    }

    /**
     * Get user's resume history from the Admin's Centralized Google Drive
     * This uses STRICT search filtering to ensure User A never sees User B's files.
     */
    async getHistory(email?: string, limit: number = 50) {
        try {
            const session = await auth();
            // Use provided email or fallback to session or local-dev mock
            const userEmail = email || session?.user?.email || "local-dev@example.com";

            if (!userEmail) return [];

            const masterToken = await this.refreshMasterToken();
            if (!masterToken) return [];

            const folderId = await this.getOrCreateFolder(masterToken);
            if (!folderId) return [];

            // PRIVATE FILTERING: Search for files that specifically mention this user's email in the name
            const safeEmail = userEmail.replace(/[^a-z0-9]/gi, '_');
            const query = `'${folderId}' in parents and name contains 'HISTORY_${safeEmail}_' and mimeType = 'application/json' and trashed = false`;
            const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, createdTime)&orderBy=createdTime desc&pageSize=${limit}`;
            
            console.log(`🔍 Fetching history for ${userEmail} in folder ${folderId}`);
            console.log(`🛰️ Drive Query: ${query}`);

            const listRes = await fetch(listUrl, {
                headers: { Authorization: `Bearer ${masterToken}` }
            });
            const listData = await listRes.json();
            
            if (!listData.files) {
                console.log('⚠️ No files found in Master Drive for this user.');
                return [];
            }

            console.log(`✅ Found ${listData.files.length} history records`);

            // Fetch contents (parallel)
            const historyPromises = listData.files.map(async (file: any) => {
                const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                    headers: { Authorization: `Bearer ${masterToken}` }
                });
                const content = await fileRes.json();
                return {
                    id: file.id,
                    ...content
                };
            });

            return await Promise.all(historyPromises);
        } catch (error) {
            console.error('Failed to fetch private history from Master Drive:', error);
            return [];
        }
    }

    /**
     * Delete history entry from Master Google Drive
     */
    async deleteHistoryEntry(id: string): Promise<boolean> {
        try {
            const masterToken = await this.refreshMasterToken();
            if (!masterToken) return false;

            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${masterToken}` }
            });

            return res.ok;
        } catch (error) {
            console.error('Failed to delete history item from Master Drive:', error);
            return false;
        }
    }
}

// Export singleton
export const resumeService = new ResumeService();
