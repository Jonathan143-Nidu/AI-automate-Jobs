/**
 * Shared TypeScript types for Resume Builder
 */

export interface LogEntry {
    timestamp: string;
    type: 'info' | 'success' | 'error' | 'json';
    message: string;
    data?: unknown;
}

export interface GapAnalysisItem {
    skill: string;
    jd_requirement: string;
    resume_experience: string;
    status: 'Matched' | 'Partial' | 'Missing';
    note?: string;
}

export interface PartialMatchSkill {
    skill: string;
    jdRequirement: string;
    candidateHas: string;
}

export interface MissingMatchSkill {
    skill: string;
    jdRequirement: string;
}

export interface AnalysisResult {
    candidate_name?: string;
    match_percentage?: number;
    missing_skills?: string[];
    gap_analysis?: GapAnalysisItem[];
    executive_summary?: string;
    analysis_summary?: string;
    email_pitch?: string;
    
    // New fields from strict granular JSON prompt
    internalReasoning?: string;
    matchStatus?: 'High Match' | 'Partial Match' | 'Low Match' | string;
    matchedSkills?: string[];
    partialMatchSkills?: PartialMatchSkill[];
    missingSkills?: MissingMatchSkill[];
    missingCertifications?: string[];
}

export interface ChangeRequest {
    type: 'MODIFY' | 'ADD';
    old?: string;
    new: string;
    anchor?: string;
    reason: string;
    section?: string;
    selected?: boolean;
}

export interface IntegrationResult {
    candidate_name?: string;
    changes: ChangeRequest[];
    analysis_summary: string;
    optimized_match_percentage: number;
    gap_reasons?: string[];
}



export type Step = 'input' | 'upload' | 'analysis' | 'integration' | 'integration_summary' | 'review' | 'download';
export type FileType = 'docx' | 'pdf' | 'txt';
export type MobileView = 'editor' | 'preview';
