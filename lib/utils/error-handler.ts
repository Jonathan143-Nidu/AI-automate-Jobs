/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 500,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super('VALIDATION_ERROR', message, 400, details);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super('NOT_FOUND', message, 404);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super('UNAUTHORIZED', message, 401);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Format error for API response
 */
export const formatErrorResponse = (error: unknown) => {
    if (error instanceof AppError) {
        return {
            error: error.message,
            code: error.code,
            details: error.details,
            statusCode: error.statusCode
        };
    }

    if (error instanceof Error) {
        return {
            error: error.message,
            code: 'INTERNAL_ERROR',
            statusCode: 500
        };
    }

    return {
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500
    };
};

/**
 * Safe error handler for API routes
 */
export const handleAPIError = (error: unknown) => {
    const formatted = formatErrorResponse(error);

    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.error('[API Error]', error);
    }

    const response: {
        error: string;
        code: string;
        statusCode: number;
        details?: unknown;
    } = {
        error: formatted.error,
        code: formatted.code,
        statusCode: formatted.statusCode
    };

    if (formatted.details !== undefined) {
        response.details = formatted.details;
    }

    return response;
};
