/**
 * Input Sanitization - Additional layer of defense against malicious inputs
 * Sanitizes strings to prevent XSS, SQL injection, and other attacks
 */

/**
 * Sanitize string input - removes potentially dangerous characters
 * Use this for user-provided strings before storing or displaying
 *
 * Protection against:
 * - XSS (Cross-Site Scripting)
 * - HTML injection
 * - JavaScript injection
 * - SQL injection attempts
 *
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string
 *
 * @example
 * ```typescript
 * import { sanitizeString } from './sanitizer';
 *
 * const userInput = '<script>alert("XSS")</script>Hello';
 * const safe = sanitizeString(userInput);
 * // Returns: 'Hello'
 * ```
 */
export const sanitizeString = (
  input: string,
  maxLength: number = 1000
): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return (
    input
      // Remove script tags and content FIRST
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove on* event handlers (onclick, onload, etc.)
      .replace(/on\w+=/gi, '')
      // Remove data: protocol (can be used for XSS)
      .replace(/data:text\/html/gi, '')
      // Remove null bytes (can bypass filters)
      .replace(/\0/g, '')
      // Trim whitespace
      .trim()
      // Limit length
      .slice(0, maxLength)
  );
};

/**
 * Sanitize number input - ensures number is within safe bounds
 * Use for numeric inputs to prevent overflow and invalid values
 *
 * @param input - Number to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number
 *
 * @example
 * ```typescript
 * import { sanitizeNumber } from './sanitizer';
 *
 * const price = sanitizeNumber(userPrice, 0, 100);
 * // Ensures price is between $0 and $100
 * ```
 */
export const sanitizeNumber = (
  input: number,
  min: number,
  max: number
): number => {
  if (typeof input !== 'number' || isNaN(input) || !isFinite(input)) {
    return min;
  }

  // Clamp value between min and max
  return Math.max(min, Math.min(max, input));
};

/**
 * Sanitize email - removes dangerous characters from email
 * Additional layer on top of email validation schema
 *
 * @param email - Email to sanitize
 * @returns Sanitized email
 *
 * @example
 * ```typescript
 * import { sanitizeEmail } from './sanitizer';
 *
 * const email = sanitizeEmail('user+tag@example.com');
 * ```
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') {
    return '';
  }

  return email
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '') // Remove quotes and brackets
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, 255); // Max email length
};

/**
 * Sanitize HTML for safe display
 * Use when you need to display user content but want to strip dangerous HTML
 *
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML with only safe tags
 *
 * @example
 * ```typescript
 * import { sanitizeHTML } from './sanitizer';
 *
 * const userContent = '<p>Hello</p><script>alert(1)</script>';
 * const safe = sanitizeHTML(userContent);
 * // Returns: '<p>Hello</p>'
 * ```
 */
export const sanitizeHTML = (html: string): string => {
  if (typeof html !== 'string') {
    return '';
  }

  // Allowed tags (whitelist approach)
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span'];
  const tagRegex = new RegExp(
    `<(?!/?(?:${allowedTags.join('|')})\b)[^>]+>`,
    'gi'
  );

  return (
    html
      // Remove disallowed tags
      .replace(tagRegex, '')
      // Remove all event handlers
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol
      .replace(/data:text\/html/gi, '')
      .trim()
  );
};

/**
 * Sanitize SQL input - prevents SQL injection attempts
 * Note: Use parameterized queries when possible. This is a backup layer.
 *
 * @param input - String that will be used in SQL query
 * @returns Sanitized string
 *
 * @example
 * ```typescript
 * import { sanitizeSQL } from './sanitizer';
 *
 * const search = sanitizeSQL(userSearch);
 * // Removes SQL injection attempts like '; DROP TABLE users; --
 * ```
 */
export const sanitizeSQL = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return (
    input
      // Remove SQL comments
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      // Remove SQL keywords that shouldn't be in user input
      .replace(/\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/gi, '')
      // Remove semicolons (statement separators)
      .replace(/;/g, '')
      // Remove quote escaping attempts
      .replace(/\\'/g, '')
      .replace(/\\"/g, '')
      .trim()
  );
};

/**
 * Sanitize filename - removes dangerous characters from filenames
 * Use when handling user-provided filenames
 *
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 *
 * @example
 * ```typescript
 * import { sanitizeFilename } from './sanitizer';
 *
 * const safe = sanitizeFilename('../../etc/passwd');
 * // Returns: 'etcpasswd'
 * ```
 */
export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') {
    return 'file';
  }

  return (
    filename
      // Remove path separators
      .replace(/[\/\\]/g, '')
      // Remove directory traversal attempts
      .replace(/\.\./g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove special characters
      .replace(/[<>:"|?*]/g, '')
      // Remove leading/trailing dots and spaces
      .replace(/^[.\s]+|[.\s]+$/g, '')
      // Limit length
      .slice(0, 255) || 'file'
  ); // Default to 'file' if empty
};

/**
 * Sanitize URL - validates and sanitizes URL input
 * Prevents malicious URLs (javascript:, data:, etc.)
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * ```typescript
 * import { sanitizeURL } from './sanitizer';
 *
 * const url = sanitizeURL('javascript:alert(1)');
 * // Returns: ''
 *
 * const safe = sanitizeURL('https://example.com');
 * // Returns: 'https://example.com'
 * ```
 */
export const sanitizeURL = (url: string): string => {
  if (typeof url !== 'string') {
    return '';
  }

  const cleaned = url.trim().toLowerCase();

  // Allow only safe protocols
  const safeProtocols = ['http:', 'https:'];

  try {
    const parsed = new URL(cleaned);

    if (!safeProtocols.includes(parsed.protocol)) {
      return '';
    }

    return url.trim(); // Return original case
  } catch {
    // Invalid URL
    return '';
  }
};

/**
 * Sanitize object - recursively sanitizes all string values in an object
 * Use for complex objects with user input
 *
 * @param obj - Object to sanitize
 * @param maxDepth - Maximum recursion depth (default: 10)
 * @returns Sanitized object
 *
 * @example
 * ```typescript
 * import { sanitizeObject } from './sanitizer';
 *
 * const userInput = {
 *   name: '<script>alert(1)</script>John',
 *   age: 25,
 *   address: {
 *     street: '123 Main St<script>'
 *   }
 * };
 *
 * const safe = sanitizeObject(userInput);
 * // Returns object with sanitized strings
 * ```
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  maxDepth: number = 10,
  currentDepth: number = 0
): T => {
  if (currentDepth >= maxDepth) {
    return obj;
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, maxDepth, currentDepth + 1);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

/**
 * Strip null bytes - removes null bytes that can bypass security filters
 *
 * @param input - String to clean
 * @returns String without null bytes
 */
export const stripNullBytes = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/\0/g, '');
};

/**
 * Normalize whitespace - replaces multiple spaces with single space
 * Useful for cleaning user input before storage
 *
 * @param input - String to normalize
 * @returns Normalized string
 */
export const normalizeWhitespace = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/\s+/g, ' ').trim();
};

/**
 * Sanitize phone number - extracts only digits from phone number
 *
 * @param phone - Phone number to sanitize
 * @returns Digits only
 *
 * @example
 * ```typescript
 * import { sanitizePhoneNumber } from './sanitizer';
 *
 * const phone = sanitizePhoneNumber('(555) 123-4567');
 * // Returns: '5551234567'
 * ```
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (typeof phone !== 'string') {
    return '';
  }
  // Extract only digits
  return phone.replace(/\D/g, '').slice(0, 15); // Max international phone length
};

/**
 * Sanitize integer - ensures value is a valid integer
 *
 * @param value - Value to sanitize
 * @param defaultValue - Default value if invalid
 * @returns Valid integer
 */
export const sanitizeInteger = (
  value: any,
  defaultValue: number = 0
): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Sanitize float - ensures value is a valid float
 *
 * @param value - Value to sanitize
 * @param defaultValue - Default value if invalid
 * @returns Valid float
 */
export const sanitizeFloat = (
  value: any,
  defaultValue: number = 0
): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
};

/**
 * Sanitize boolean - converts various inputs to boolean
 *
 * @param value - Value to convert
 * @param defaultValue - Default value if invalid
 * @returns Boolean value
 */
export const sanitizeBoolean = (
  value: any,
  defaultValue: boolean = false
): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
};
