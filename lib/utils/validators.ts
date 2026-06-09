/**
 * Input validation utilities for API routes
 */

import { ValidationError } from './error-handler';

/**
 * Validate required string field
 */
export const validateRequired = (
    value: unknown,
    fieldName: string
): string => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new ValidationError(`${fieldName} is required`);
    }
    return value.trim();
};

/**
 * Validate optional string field
 */
export const validateOptionalString = (
    value: unknown,
    fieldName: string
): string | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`);
    }

    return value.trim() || undefined;
};

/**
 * Validate array field
 */
export const validateArray = (
    value: unknown,
    fieldName: string
): unknown[] => {
    if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`);
    }
    return value;
};

/**
 * Validate string array
 */
export const validateStringArray = (
    value: unknown,
    fieldName: string
): string[] => {
    const arr = validateArray(value, fieldName);

    if (!arr.every(item => typeof item === 'string')) {
        throw new ValidationError(`${fieldName} must contain only strings`);
    }

    return arr as string[];
};

/**
 * Validate number field
 */
export const validateNumber = (
    value: unknown,
    fieldName: string,
    min?: number,
    max?: number
): number => {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`${fieldName} must be a valid number`);
    }

    if (min !== undefined && value < min) {
        throw new ValidationError(`${fieldName} must be at least ${min}`);
    }

    if (max !== undefined && value > max) {
        throw new ValidationError(`${fieldName} must be at most ${max}`);
    }

    return value;
};

/**
 * Validate email format
 */
export const validateEmail = (value: unknown, fieldName: string): string => {
    const email = validateRequired(value, fieldName);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new ValidationError(`${fieldName} must be a valid email address`);
    }

    return email;
};

/**
 * Validate URL format
 */
export const validateURL = (value: unknown, fieldName: string): string => {
    const url = validateRequired(value, fieldName);

    try {
        new URL(url);
        return url;
    } catch {
        throw new ValidationError(`${fieldName} must be a valid URL`);
    }
};

/**
 * Validate JSON object
 */
export const validateObject = (
    value: unknown,
    fieldName: string
): Record<string, unknown> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be a valid object`);
    }

    return value as Record<string, unknown>;
};
