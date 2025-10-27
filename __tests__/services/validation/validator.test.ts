/**
 * Validator Utility Tests
 * Tests for validation helper functions
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  validate,
  validateAsync,
  validateSafe,
  validateSafeAsync,
  validatePartial,
  validateArray,
  createValidator,
  isValid,
  ValidationError,
} from '../../../services/validation/validator';

describe('ValidationError', () => {
  it('should create a validation error with messages', () => {
    const schema = z.object({ name: z.string().min(3) });

    try {
      schema.parse({ name: 'ab' });
    } catch (error) {
      const validationError = new ValidationError(error as z.ZodError, 'test');

      expect(validationError.name).toBe('ValidationError');
      expect(validationError.validationType).toBe('test');
      expect(validationError.getMessages().length).toBeGreaterThan(0);
    }
  });

  it('should get field errors grouped by field', () => {
    const schema = z.object({
      name: z.string().min(3),
      age: z.number().min(18),
    });

    try {
      schema.parse({ name: 'ab', age: 10 });
    } catch (error) {
      const validationError = new ValidationError(error as z.ZodError);
      const fieldErrors = validationError.getFieldErrors();

      expect(fieldErrors).toHaveProperty('name');
      expect(fieldErrors).toHaveProperty('age');
    }
  });

  it('should get first error message', () => {
    const schema = z.object({
      name: z.string().min(3),
      age: z.number().min(18),
    });

    try {
      schema.parse({ name: 'ab', age: 10 });
    } catch (error) {
      const validationError = new ValidationError(error as z.ZodError);
      const firstMessage = validationError.getFirstMessage();

      expect(typeof firstMessage).toBe('string');
      expect(firstMessage.length).toBeGreaterThan(0);
    }
  });

  it('should convert to JSON', () => {
    const schema = z.object({ name: z.string().min(3) });

    try {
      schema.parse({ name: 'ab' });
    } catch (error) {
      const validationError = new ValidationError(error as z.ZodError, 'test');
      const json = validationError.toJSON();

      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('validationType');
      expect(json).toHaveProperty('errors');
    }
  });
});

describe('validate', () => {
  it('should validate correct data', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 30 };

    expect(() => validate(schema, data)).not.toThrow();
    const result = validate(schema, data);
    expect(result).toEqual(data);
  });

  it('should throw ValidationError for invalid data', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 'not a number' };

    expect(() => validate(schema, data)).toThrow(ValidationError);
  });

  it('should include validation type in error', () => {
    const schema = z.string().email();

    try {
      validate(schema, 'not-an-email', 'email');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.validationType).toBe('email');
      }
    }
  });
});

describe('validateAsync', () => {
  it('should validate correct data asynchronously', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 30 };

    await expect(validateAsync(schema, data)).resolves.toEqual(data);
  });

  it('should throw ValidationError for invalid data', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 'not a number' };

    await expect(validateAsync(schema, data)).rejects.toThrow(ValidationError);
  });
});

describe('validateSafe', () => {
  it('should return success object for valid data', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 30 };

    const result = validateSafe(schema, data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should return error object for invalid data', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 'not a number' };

    const result = validateSafe(schema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });
});

describe('validateSafeAsync', () => {
  it('should return success object for valid data', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 30 };

    const result = await validateSafeAsync(schema, data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should return error object for invalid data', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 'not a number' };

    const result = await validateSafeAsync(schema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });
});

describe('validatePartial', () => {
  it('should validate partial objects', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().email(),
    });

    const partialData = { name: 'John' };

    expect(() => validatePartial(schema, partialData)).not.toThrow();
  });

  it('should still validate provided fields', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const invalidPartialData = { age: 'not a number' };

    expect(() => validatePartial(schema, invalidPartialData)).toThrow();
  });
});

describe('validateArray', () => {
  it('should validate arrays of items', () => {
    const itemSchema = z.object({ id: z.number(), name: z.string() });
    const data = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    expect(() => validateArray(itemSchema, data)).not.toThrow();
    const result = validateArray(itemSchema, data);
    expect(result).toHaveLength(2);
  });

  it('should throw if any item is invalid', () => {
    const itemSchema = z.object({ id: z.number(), name: z.string() });
    const data = [
      { id: 1, name: 'Item 1' },
      { id: 'not a number', name: 'Item 2' },
    ];

    expect(() => validateArray(itemSchema, data)).toThrow(ValidationError);
  });

  it('should validate empty arrays', () => {
    const itemSchema = z.string();
    const data: string[] = [];

    expect(() => validateArray(itemSchema, data)).not.toThrow();
  });
});

describe('createValidator', () => {
  it('should create a reusable validator function', () => {
    const schema = z.string().email();
    const validateEmail = createValidator(schema, 'email');

    expect(() => validateEmail('user@example.com')).not.toThrow();
    expect(() => validateEmail('invalid')).toThrow(ValidationError);
  });

  it('should maintain validation type', () => {
    const schema = z.number();
    const validateNumber = createValidator(schema, 'number');

    try {
      validateNumber('not a number');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.validationType).toBe('number');
      }
    }
  });
});

describe('isValid', () => {
  it('should return true for valid data', () => {
    const schema = z.string().email();
    expect(isValid(schema, 'user@example.com')).toBe(true);
  });

  it('should return false for invalid data', () => {
    const schema = z.string().email();
    expect(isValid(schema, 'not-an-email')).toBe(false);
  });

  it('should work as type guard', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data: unknown = { name: 'John', age: 30 };

    if (isValid(schema, data)) {
      // TypeScript should know data is of the correct type
      expect(data.name).toBe('John');
      expect(data.age).toBe(30);
    }
  });
});

describe('Complex Validation Scenarios', () => {
  it('should handle nested object validation', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        profile: z.object({
          age: z.number(),
          email: z.string().email(),
        }),
      }),
    });

    const validData = {
      user: {
        name: 'John',
        profile: {
          age: 30,
          email: 'john@example.com',
        },
      },
    };

    expect(() => validate(schema, validData)).not.toThrow();
  });

  it('should handle custom refinements', () => {
    const schema = z
      .object({
        password: z.string(),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords must match',
      });

    const validData = { password: 'test123', confirmPassword: 'test123' };
    const invalidData = { password: 'test123', confirmPassword: 'different' };

    expect(() => validate(schema, validData)).not.toThrow();
    expect(() => validate(schema, invalidData)).toThrow(ValidationError);
  });

  it('should handle union types', () => {
    const schema = z.union([z.string(), z.number()]);

    expect(() => validate(schema, 'text')).not.toThrow();
    expect(() => validate(schema, 123)).not.toThrow();
    expect(() => validate(schema, true)).toThrow();
  });

  it('should handle optional fields', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().optional(),
    });

    expect(() => validate(schema, { name: 'John' })).not.toThrow();
    expect(() => validate(schema, { name: 'John', age: 30 })).not.toThrow();
  });

  it('should handle default values', () => {
    const schema = z.object({
      name: z.string(),
      role: z.string().default('user'),
    });

    const result = validate(schema, { name: 'John' });
    expect(result.role).toBe('user');
  });
});
