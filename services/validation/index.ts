/**
 * Validation Module - Centralized exports for input validation
 *
 * This module provides comprehensive input validation and sanitization
 * to protect against SQL injection, XSS, and data corruption.
 *
 * Usage:
 * ```typescript
 * import { validate, EmailSchema, sanitizeString } from '@/services/validation';
 *
 * // Validate email
 * const email = validate(EmailSchema, userInput);
 *
 * // Sanitize user input
 * const safe = sanitizeString(userInput);
 * ```
 */

// Export all schemas
export * from './schemas';

// Export validator utilities
export {
  validate,
  validateAsync,
  validateSafe,
  validateSafeAsync,
  validatePartial,
  validateArray,
  createValidator,
  isValid,
  ValidationError,
  logValidationError,
  formatValidationErrorForUser,
} from './validator';

// Export sanitizer functions
export {
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  sanitizeHTML,
  sanitizeSQL,
  sanitizeFilename,
  sanitizeURL,
  sanitizeObject,
  stripNullBytes,
  normalizeWhitespace,
  sanitizePhoneNumber,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeBoolean,
} from './sanitizer';
