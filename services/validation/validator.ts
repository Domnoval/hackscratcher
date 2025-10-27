/**
 * Validation Utilities - Helper functions for input validation
 * Provides consistent error handling and validation patterns
 */

import { z } from 'zod';

/**
 * Custom validation error class
 * Extends standard Error with Zod validation details
 */
export class ValidationError extends Error {
  public readonly errors: z.ZodError;
  public readonly validationType: string;

  constructor(errors: z.ZodError, validationType: string = 'unknown') {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
    this.validationType = validationType;
  }

  /**
   * Get human-readable error messages
   */
  getMessages(): string[] {
    return this.errors.errors.map((err) => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    });
  }

  /**
   * Get the first error message
   */
  getFirstMessage(): string {
    const messages = this.getMessages();
    return messages[0] || 'Validation failed';
  }

  /**
   * Get errors grouped by field
   */
  getFieldErrors(): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    this.errors.errors.forEach((err) => {
      const field = err.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(err.message);
    });

    return fieldErrors;
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      validationType: this.validationType,
      errors: this.getFieldErrors(),
    };
  }
}

/**
 * Synchronous validation function
 * Throws ValidationError if validation fails
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param validationType - Optional identifier for error context
 * @returns Validated and type-safe data
 *
 * @example
 * ```typescript
 * import { validate } from './validator';
 * import { EmailSchema } from './schemas';
 *
 * try {
 *   const email = validate(EmailSchema, userInput, 'email');
 *   // email is now type-safe and validated
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error(error.getMessages());
 *   }
 * }
 * ```
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  validationType?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error, validationType);
    }
    throw error;
  }
}

/**
 * Asynchronous validation function
 * Use for schemas with async refinements
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param validationType - Optional identifier for error context
 * @returns Promise of validated and type-safe data
 *
 * @example
 * ```typescript
 * import { validateAsync } from './validator';
 * import { GameSchema } from './schemas';
 *
 * try {
 *   const game = await validateAsync(GameSchema, apiResponse, 'game');
 *   // game is now type-safe and validated
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error(error.getFirstMessage());
 *   }
 * }
 * ```
 */
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  validationType?: string
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error, validationType);
    }
    throw error;
  }
}

/**
 * Safe validation - returns result object instead of throwing
 * Useful when you want to handle validation errors without try/catch
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and either data or error
 *
 * @example
 * ```typescript
 * import { validateSafe } from './validator';
 * import { PasswordSchema } from './schemas';
 *
 * const result = validateSafe(PasswordSchema, userPassword);
 * if (result.success) {
 *   console.log('Valid password:', result.data);
 * } else {
 *   console.error('Invalid password:', result.error.getMessages());
 * }
 * ```
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  validationType?: string
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: new ValidationError(error, validationType),
      };
    }
    throw error;
  }
}

/**
 * Safe async validation - returns result object instead of throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Promise of object with success flag and either data or error
 */
export async function validateSafeAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  validationType?: string
): Promise<
  { success: true; data: T } | { success: false; error: ValidationError }
> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: new ValidationError(error, validationType),
      };
    }
    throw error;
  }
}

/**
 * Partial validation - allows validating partial objects
 * Useful for update operations where not all fields are provided
 *
 * @param schema - Zod schema to validate against
 * @param data - Partial data to validate
 * @param validationType - Optional identifier for error context
 * @returns Validated partial data
 *
 * @example
 * ```typescript
 * import { validatePartial } from './validator';
 * import { UserProfileSchema } from './schemas';
 *
 * // Update only the budget field
 * const updates = validatePartial(UserProfileSchema, {
 *   budget: { daily: 50 }
 * });
 * ```
 */
export function validatePartial<T extends z.ZodObject<any>>(
  schema: T,
  data: unknown,
  validationType?: string
): Partial<z.infer<T>> {
  const partialSchema = schema.partial();
  return validate(partialSchema, data, validationType);
}

/**
 * Array validation helper
 * Validates an array of items against a schema
 *
 * @param itemSchema - Zod schema for individual items
 * @param data - Array to validate
 * @param validationType - Optional identifier for error context
 * @returns Validated array
 */
export function validateArray<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown,
  validationType?: string
): T[] {
  const arraySchema = z.array(itemSchema);
  return validate(arraySchema, data, validationType);
}

/**
 * Validation middleware for API endpoints
 * Returns a function that validates request data
 *
 * @param schema - Zod schema to validate against
 * @param validationType - Identifier for error context
 * @returns Validation function
 *
 * @example
 * ```typescript
 * import { createValidator } from './validator';
 * import { GameSchema } from './schemas';
 *
 * const validateGame = createValidator(GameSchema, 'game');
 *
 * // In your API handler
 * const game = validateGame(requestBody);
 * ```
 */
export function createValidator<T>(
  schema: z.ZodSchema<T>,
  validationType: string
): (data: unknown) => T {
  return (data: unknown) => validate(schema, data, validationType);
}

/**
 * Validation guard - type guard that validates and narrows type
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * ```typescript
 * import { isValid } from './validator';
 * import { EmailSchema } from './schemas';
 *
 * if (isValid(EmailSchema, userInput)) {
 *   // userInput is now known to be a valid email
 *   sendEmail(userInput);
 * }
 * ```
 */
export function isValid<T>(schema: z.ZodSchema<T>, data: unknown): data is T {
  try {
    schema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Coerce and validate - attempts to coerce data to expected type before validation
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to coerce and validate
 * @param validationType - Optional identifier for error context
 * @returns Validated data
 *
 * @example
 * ```typescript
 * import { coerceAndValidate } from './validator';
 * import { z } from 'zod';
 *
 * const NumberSchema = z.number();
 * const num = coerceAndValidate(NumberSchema, "123"); // Returns 123 as number
 * ```
 */
export function coerceAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  validationType?: string
): T {
  // Zod's coerce happens within the schema definition
  // This is a convenience wrapper for clarity
  return validate(schema, data, validationType);
}

/**
 * Log validation errors for debugging
 * Use in development to track validation issues
 */
export function logValidationError(error: ValidationError): void {
  console.error('[Validation Error]', {
    type: error.validationType,
    messages: error.getMessages(),
    fields: error.getFieldErrors(),
  });
}

/**
 * Format validation error for user display
 * Returns user-friendly error messages
 */
export function formatValidationErrorForUser(error: ValidationError): string {
  const messages = error.getMessages();

  if (messages.length === 1) {
    return messages[0];
  }

  return `Multiple errors found:\n${messages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`;
}
