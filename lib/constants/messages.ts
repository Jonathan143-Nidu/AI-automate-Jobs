/**
 * Application-wide constants and error messages
 */

export const ERROR_MESSAGES = {
    // Validation errors
    MISSING_JD: 'Job description is required',
    MISSING_RESUME: 'Resume text is required',
    MISSING_FILE: 'File is required',
    MISSING_SKILLS: 'Missing skills array is required',

    // File errors
    INVALID_FILE_TYPE: 'Invalid file type. Only DOCX, PDF, and TXT files are supported',
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    FILE_PARSE_ERROR: 'Failed to parse resume file',

    // AI errors
    AI_REQUEST_FAILED: 'Failed to process AI request',
    AI_RESPONSE_INVALID: 'AI response was not valid JSON',
    AI_TIMEOUT: 'AI request timed out',

    // Database errors
    DB_CONNECTION_FAILED: 'Database connection failed',
    DB_QUERY_FAILED: 'Database query failed',

    // Auth errors
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to access this resource',

    // General errors
    INTERNAL_ERROR: 'An internal server error occurred',
    NOT_FOUND: 'Resource not found'
} as const;

export const SUCCESS_MESSAGES = {
    RESUME_ANALYZED: 'Resume analyzed successfully',
    SKILLS_INTEGRATED: 'Skills integrated successfully',
    FILE_UPLOADED: 'File uploaded successfully',
    RESUME_GENERATED: 'Resume generated successfully'
} as const;

export const API_ROUTES = {
    ANALYZE: '/labs/prismautomation/api/analyze',
    INTEGRATE: '/labs/prismautomation/api/integrate',
    EXTRACT_JD: '/labs/prismautomation/api/extract-jd',
    PARSE_RESUME: '/labs/prismautomation/api/parse-resume',
    GENERATE_COVER_LETTER: '/labs/prismautomation/api/generate-cover-letter',
    BENCH_CANDIDATES: '/labs/prismautomation/api/bench/candidates',
    BENCH_SYNC: '/labs/prismautomation/api/bench/sync',
    DRIVE_GENERATE_RESUME: '/labs/prismautomation/api/drive/generate-resume'
} as const;

export const FILE_LIMITS = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['docx', 'pdf', 'txt'] as const
} as const;

export const AI_LIMITS = {
    MAX_RESUME_LENGTH: 20000, // characters
    MAX_JD_LENGTH: 15000, // characters
    REQUEST_TIMEOUT: 60000 // 60 seconds
} as const;
