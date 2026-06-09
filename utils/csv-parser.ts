import * as XLSX from 'xlsx';

export interface Consultant {
    ppn: string;
    name: string;
    role: string;
    employer: string;
    experience: string;
    visa: string;
    otherVisa: string;
    location: string;
    editedDLs: string;
    relocation: string;
    resumeLink: string;
    email: string;
    phone: string;
}

export interface SheetRow {
    [key: string]: string | number | boolean | undefined;
    __isDivider?: boolean;
    __dividerTitle?: string;
    __resumeLink__?: string;
    __resumeName__?: string;
}

export interface SheetData {
    type: 'hotlist' | 'generic';
    headers: string[];
    rows: SheetRow[];
}

export async function fetchWorkbook(url: string): Promise<XLSX.WorkBook> {
    try {
        let downloadUrl = url;

        if (url.includes('docs.google.com/spreadsheets')) {
            const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (matches && matches[1]) {
                const sheetId = matches[1];
                downloadUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
            }
        }

        const response = await fetch(downloadUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch workbook: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        return workbook;
    } catch (error) {
        console.error("Error fetching workbook:", error);
        throw error;
    }
}

export function parseSheet(workbook: XLSX.WorkBook, sheetName: string): SheetData {
    try {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return { type: 'generic', headers: [], rows: [] };

        const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
        const maxRow = range.e.r;
        // maxCol is not used

        if (maxRow < 0) return { type: 'generic', headers: [], rows: [] };

        const rawRows: (string | number | boolean | null | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let headerRowIndex = -1;
        // isHotlist is not used

        // Find the best header row
        for (let i = 0; i < Math.min(rawRows.length, 50); i++) {
            const rowValues: string[] = (rawRows[i] || []).map((cell: unknown) => String(cell || '').toLowerCase().trim());
            const nonEmpties = rowValues.filter(v => v && v !== '-').length;

            if (nonEmpties >= 3) {
                const hasName = rowValues.some(v => v.includes('name') || v.includes('consultant'));
                const hasJob = rowValues.some(v => v.includes('job') || v.includes('title') || v.includes('role') || v.includes('tech'));
                const hasExp = rowValues.some(v => v.includes('exp') || v.includes('year'));
                const hasEmail = rowValues.some(v => v.includes('email') || v.includes('mail'));

                if ((hasName && (hasJob || hasExp || hasEmail)) || sheetName.toLowerCase().includes('hotlist')) {
                    headerRowIndex = i;
                    // isHotlist was assigned here but not used
                    break;
                }
            }
        }

        if (headerRowIndex === -1) {
            // Fallback: use first row with > 3 columns as header
            for (let i = 0; i < rawRows.length; i++) {
                if ((rawRows[i] || []).filter((v: unknown) => v).length > 3) {
                    headerRowIndex = i;
                    break;
                }
            }
        }

        if (headerRowIndex === -1) return { type: 'generic', headers: [], rows: [] };

        const headers: string[] = (rawRows[headerRowIndex] || []).map((h: unknown) => String(h || '').trim());
        const headersLower: string[] = headers.map(h => h.toLowerCase());

        const colMap: Record<string, number> = {};
        headersLower.forEach((h, idx) => {
            const hClean = h.replace(/[^a-z0-9]/g, '');
            if (hClean.includes('name') || hClean.includes('consultant')) colMap['name'] = idx;
            else if (hClean.includes('link') || hClean.includes('resume') || hClean.includes('drive') || hClean.includes('folder') || hClean.includes('action')) colMap['resumeLink'] = idx;
        });

        const checkDivider = (row: (string | number | boolean | null | undefined)[]) => {
            if (!row || !Array.isArray(row)) return null;
            const nonEmpties = row.map(v => String(v || '').trim()).filter(v => v.length > 0 && v !== '-');
            // A divider typically spans one cell or is the only text in a row
            if (nonEmpties.length === 1 && nonEmpties[0].length > 3) {
                const text = nonEmpties[0];
                // Ignore if it looks like a header (e.g., contains 'Name')
                if (text.toLowerCase().includes('name') || text.toLowerCase().includes('job')) return null;
                return text;
            }
            return null;
        };

        const finalRows: SheetRow[] = [];
        for (let R = 0; R <= maxRow; R++) {
            if (R === headerRowIndex) continue;

            const rawRow = rawRows[R] || [];
            const dividerTitle = checkDivider(rawRow);

            if (dividerTitle) {
                finalRows.push({ __isDivider: true, __dividerTitle: dividerTitle });
                continue;
            }

            // Only process as data if we are after the header row
            if (R < headerRowIndex) continue;

            const getVal = (colIdx: number) => {
                const cellRef = XLSX.utils.encode_cell({ c: colIdx, r: R });
                const cell = worksheet[cellRef];
                return cell ? String(cell.v || '').trim() : '';
            };

            const getLink = (colIdx: number) => {
                const cellRef = XLSX.utils.encode_cell({ c: colIdx, r: R });
                const cell = worksheet[cellRef];
                if (!cell) return '';
                if (cell.l && cell.l.Target) return cell.l.Target;
                const val = String(cell.v || '').trim();
                return val.startsWith('http') ? val : '';
            };

            const hasData = rawRow.some((v: unknown) => v && String(v).trim().length > 0);
            if (!hasData) continue;

            const rowObj: SheetRow = {};
            headers.forEach((h, idx) => {
                rowObj[h] = getVal(idx);
            });

            // Map special hidden fields
            if (colMap['resumeLink'] !== undefined) {
                rowObj['__resumeLink__'] = getLink(colMap['resumeLink']);
            }

            if (colMap['name'] !== undefined) {
                rowObj['__resumeName__'] = getVal(colMap['name']);
            } else {
                rowObj['__resumeName__'] = (rowObj['Name'] as string || rowObj['Consultant'] as string || 'Candidate');
            }

            // Final sanity check: if the row has no content in the mapped columns and it's not a divider, skip it
            if (!rowObj['__resumeName__'] && !dividerTitle) {
                const content = Object.values(rowObj).filter(v => String(v).trim().length > 0);
                if (content.length < 2) continue;
            }

            finalRows.push(rowObj);
        }

        return { type: 'hotlist', headers, rows: finalRows };

    } catch (error) {
        console.error("Error parsing sheet:", error);
        return { type: 'generic', headers: [], rows: [] };
    }
}
