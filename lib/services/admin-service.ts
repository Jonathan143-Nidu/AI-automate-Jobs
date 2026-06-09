/**
 * Admin Service - Handles user management using Google Sheets as the database (Whitelist Mode)
 * Optimized for Next.js Edge Runtime compatibility.
 */

import { auth } from '@/auth';

const ADMIN_SHEET_NAME = 'AI_Resume_Admin_Access';
const SUPER_ADMIN_EMAIL = 'hiring@innovcentric.com';

export interface AdminUser {
    email: string;
    role: string;
    status: 'active' | 'inactive';
    createdAt: string;
    accessStart?: string;
    accessEnd?: string;
    excludedTypes?: string[];
}

export class AdminService {
    /**
     * Internal helper to create the OAuth client dynamically to avoid Edge runtime issues
     */
    private async getSheetsClient(accessToken: string) {
        // Dynamic import to avoid loading 'googleapis' in Edge runtime
        const { google } = await import('googleapis');
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        return google.sheets({ version: 'v4', auth: oauth2Client });
    }

    private async getDriveClient(accessToken: string) {
        const { google } = await import('googleapis');
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    /**
     * Unified authority helper: Prioritizes Master Token for all Admin operations.
     * This avoids scope errors when the logged-in user doesn't have Drive permissions.
     */
    private async getAdminToken(userAccessToken?: string): Promise<string | null> {
        const masterToken = await this.refreshMasterToken();
        if (masterToken) return masterToken;

        console.warn('⚠️ Admin Master Token not found or failed to refresh. Falling back to session token.');
        return userAccessToken || null;
    }

    /**
     * Get or create the Admin Access Google Sheet
     */
    private async getOrCreateSheet(token: string): Promise<string | null> {
        try {
            const drive = await this.getDriveClient(token);
            
            // 1. Search for existing sheet
            const searchRes = await drive.files.list({
                q: `name = '${ADMIN_SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
                fields: 'files(id)',
            });

            if (searchRes.data.files && searchRes.data.files.length > 0) {
                return searchRes.data.files[0].id!;
            }

            // 2. Create sheet if not found
            const sheets = await this.getSheetsClient(token);
            const createRes = await sheets.spreadsheets.create({
                requestBody: {
                    properties: { title: ADMIN_SHEET_NAME },
                    sheets: [{ properties: { title: 'Users' } }]
                }
            });

            const sheetId = createRes.data.spreadsheetId!;

            // 3. Initialize headers: Email, Role, Status, CreatedAt, AccessStart, AccessEnd, ExcludedTypes
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: 'Users!A1:G1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['Email', 'Role', 'Status', 'CreatedAt', 'AccessStart', 'AccessEnd', 'ExcludedTypes']]
                }
            });

            console.log('✅ Admin Whitelist Google Sheet initialized with Status support.');
            return sheetId;
        } catch (error) {
            console.error('Failed to get/create Admin Sheet:', error);
            return null;
        }
    }

    /**
     * Get all users from the Google Sheet
     */
    async getUsers(): Promise<AdminUser[]> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const accessToken = await this.getAdminToken(session?.accessToken);

            if (!accessToken) return [];

            const sheetId = await this.getOrCreateSheet(accessToken);
            if (!sheetId) return [];

            const sheets = await this.getSheetsClient(accessToken);
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'Users!A2:H',
            });

            const rows = res.data.values || [];
            return rows.map(row => ({
                email: row[0],
                role: row[1],
                status: (row[2] || 'active') as 'active' | 'inactive', // Default to active for legacy rows
                createdAt: row[3],
                accessStart: row[4] || null,
                accessEnd: row[5] || null,
                excludedTypes: row[6] ? row[6].split(',').map((t: string) => t.trim()).filter(Boolean) : []
            }));
        } catch (error) {
            console.error('Failed to fetch users from Sheet:', error);
            return [];
        }
    }

    /**
     * Add a new email to the Whitelist
     */
    async addUser(email: string, role: 'admin' | 'user' = 'user', accessStart?: string, accessEnd?: string): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const accessToken = await this.getAdminToken(session?.accessToken);

            if (!accessToken) return false;

            const sheetId = await this.getOrCreateSheet(accessToken);
            if (!sheetId) return false;

            const createdAt = new Date().toISOString();

            const sheets = await this.getSheetsClient(accessToken);
            await sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'Users!A:G',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[email.toLowerCase(), role, 'active', createdAt, accessStart || '', accessEnd || '', '']]
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to add user to Sheet:', error);
            return false;
        }
    }

    /**
     * Toggle a user's status between Active and Inactive
     */
    async toggleUserStatus(email: string, currentStatus: 'active' | 'inactive'): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const accessToken = await this.getAdminToken(session?.accessToken);

            if (!accessToken) return false;

            const sheetId = await this.getOrCreateSheet(accessToken);
            if (!sheetId) return false;

            const sheets = await this.getSheetsClient(accessToken);
            
            // 1. Find the row
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'Users!A:A',
            });

            const rows = res.data.values || [];
            const rowIndex = rows.findIndex(row => row[0].toLowerCase() === email.toLowerCase());

            if (rowIndex === -1) return false;

            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const rowNumber = rowIndex + 1; // 1-indexed for range

            // 2. Update status in Column C
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: `Users!C${rowNumber}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[newStatus]]
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            return false;
        }
    }

    /**
     * Toggle a user's exclusion for a specific job type
     */
    async toggleUserExclusion(email: string, jobType: string): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const accessToken = await this.getAdminToken(session?.accessToken);

            if (!accessToken) return false;

            const sheetId = await this.getOrCreateSheet(accessToken);
            if (!sheetId) return false;

            const sheets = await this.getSheetsClient(accessToken);
            
            // 1. Find the row and current exclusions
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'Users!A:G',
            });

            const rows = res.data.values || [];
            const rowIndex = rows.findIndex(row => row[0].toLowerCase() === email.toLowerCase());

            if (rowIndex === -1) return false;

            const currentRow = rows[rowIndex];
            const currentExclusionsStr = currentRow[6] || '';
            let exclusions = currentExclusionsStr.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);

            if (jobType === 'ALL_CLEAR') {
                exclusions = [];
            } else if (exclusions.includes(jobType.toLowerCase())) {
                // Remove if exists
                exclusions = exclusions.filter(t => t !== jobType.toLowerCase());
            } else {
                // Add if not exists
                exclusions.push(jobType.toLowerCase());
            }

            const newValue = exclusions.join(',');
            const rowNumber = rowIndex + 1;

            // 2. Update Column G (ExcludedTypes)
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: `Users!G${rowNumber}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[newValue]]
                }
            });

            return true;
        } catch (error) {
            console.error(`Failed to toggle user exclusion for ${jobType}:`, error);
            return false;
        }
    }

    /**
     * Delete an email from the Whitelist
     */
    async deleteUser(email: string): Promise<boolean> {
        try {
            const session = await auth();
            // @ts-expect-error - accessToken added in auth.ts callback
            const accessToken = await this.getAdminToken(session?.accessToken);

            if (!accessToken) return false;

            const sheetId = await this.getOrCreateSheet(accessToken);
            if (!sheetId) return false;

            const sheets = await this.getSheetsClient(accessToken);
            
            // Get all data to find the row index
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'Users!A:A',
            });

            const rows = res.data.values || [];
            const rowIndex = rows.findIndex(row => row[0].toLowerCase() === email.toLowerCase());

            if (rowIndex === -1) return false;

            // 1. Get the spreadsheet metadata to find the correct sheetId for the 'Users' sheet
            const spreadSheet = await sheets.spreadsheets.get({
                spreadsheetId: sheetId
            });

            const sheetEntry = spreadSheet.data.sheets?.find(s => s.properties?.title === 'Users');
            const internalSheetId = sheetEntry?.properties?.sheetId;

            if (internalSheetId === undefined || internalSheetId === null) {
                console.error('Could not find internal sheetId for "Users" sheet');
                return false;
            }

            // 2. Delete the row using the correct internal sheetId
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: internalSheetId, 
                                dimension: 'ROWS',
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1
                            }
                        }
                    }]
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to delete user from Sheet:', error);
            return false;
        }
    }

    /**
     * Exchanges a refresh token for a fresh access token (Master Mode)
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
     * Check if an email is whitelisted using Admin Master Authority
     */
    async isWhitelisted(email: string, userAccessToken: string): Promise<boolean> {
        try {
            // hiring@innovcentric.com is always whitelisted
            if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;

            // 1. Determine authority: Use Master Token if available, otherwise fallback to User Token
            let checkToken = await this.refreshMasterToken();
            if (!checkToken) {
                console.warn('⚠️ Admin Master Token not found in .env. Falling back to candidate authority.');
                checkToken = userAccessToken;
            }

            if (!checkToken) return false;

            // 2. Locate the sheet via authority
            const query = encodeURIComponent(`name = '${ADMIN_SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
            const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
            
            const searchRes = await fetch(searchUrl, {
                headers: { Authorization: `Bearer ${checkToken}` }
            });
            const searchData = await searchRes.json();
            
            if (!searchData.files || searchData.files.length === 0) {
                console.warn('Admin Sheet not found during verification.');
                return false;
            }

            const sheetId = searchData.files[0].id;

            // 3. Read the whitelist (fetching Email, Status, AccessStart, AccessEnd)
            // Range A2:F captures Email(A), Role(B), Status(C), CreatedAt(D), AccessStart(E), AccessEnd(F)
            const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Users!A2:F?majorDimension=ROWS`;
            const sheetsRes = await fetch(sheetsUrl, {
                headers: { Authorization: `Bearer ${checkToken}` }
            });
            const sheetsData = await sheetsRes.json();

            const rows = sheetsData.values || [];
            
            // Check if user is present AND status is 'active' AND within date range
            const now = new Date();

            return rows.some((row: string[]) => {
                const rowEmail = row[0]?.toLowerCase();
                const status = (row[2]?.toLowerCase() || 'active');
                const accessStart = row[4] ? new Date(row[4]) : null;
                const accessEnd = row[5] ? new Date(row[5]) : null;

                // Basic validation: must be active and match email
                if (rowEmail !== email.toLowerCase() || status !== 'active') return false;

                // Date Validation logic
                // 1. If AccessStart is set, now must be >= AccessStart
                if (accessStart && now < accessStart) return false;

                // 2. If AccessEnd is set, now must be <= AccessEnd (specifically 11:59:59 PM of that day)
                if (accessEnd) {
                    // Normalize accessEnd to the very last second of that day
                    const endOfDay = new Date(accessEnd);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (now > endOfDay) return false;
                }

                return true;
            });
        } catch (error) {
            console.error('Whitelist check failed:', error);
            return false;
        }
    }

    /**
     * Fetch exclusion settings for a user
     */
    async getUserFilters(email: string): Promise<{ excludedTypes: string[] }> {
        try {
            // Master admin always sees everything
            if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
                return { excludedTypes: [] };
            }

            let checkToken = await this.refreshMasterToken();
            if (!checkToken) return { excludedTypes: [] };

            // 1. Locate the sheet
            const query = encodeURIComponent(`name = '${ADMIN_SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
            const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
            const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${checkToken}` } });
            const searchData = await searchRes.json();
            if (!searchData.files || searchData.files.length === 0) return { excludedTypes: [] };
            const sheetId = searchData.files[0].id;

            // 2. Read user row from A:G
            const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Users!A2:G?majorDimension=ROWS`;
            const sheetsRes = await fetch(sheetsUrl, { headers: { Authorization: `Bearer ${checkToken}` } });
            const sheetsData = await sheetsRes.json();
            const rows = sheetsData.values || [];

            const userRow = rows.find((row: string[]) => row[0]?.toLowerCase() === email.toLowerCase());
            if (!userRow) return { excludedTypes: [] };

            const excludedStr = userRow[6] || '';
            const excludedTypes = excludedStr.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);

            return { excludedTypes };
        } catch (error) {
            console.error('Failed to fetch user filters:', error);
            return { excludedTypes: [] };
        }
    }
}

export const adminService = new AdminService();
