/**
 * Validation Schemas - Comprehensive input validation using Zod
 * Protects against SQL injection, XSS, and data corruption
 */

import { z } from 'zod';

// =====================================================
// Common Validation Patterns
// =====================================================

/**
 * UUID validation - ensures valid UUID format for database IDs
 * Prevents SQL injection through ID parameters
 */
export const UUIDSchema = z.string().uuid({
  message: 'Invalid UUID format',
});

/**
 * Safe string validation - removes dangerous characters
 * Protects against XSS and injection attacks
 */
export const SafeStringSchema = z
  .string()
  .trim()
  .min(1, 'String cannot be empty')
  .max(1000, 'String too long')
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    'String contains potentially dangerous content'
  );

// =====================================================
// Prize Tier Validation
// =====================================================

/**
 * Prize tier schema - validates individual prize tier data
 * Ensures prize amounts and quantities are within reasonable bounds
 */
export const PrizeTierSchema = z
  .object({
    id: UUIDSchema,
    prize_amount: z
      .number()
      .positive('Prize amount must be positive')
      .max(10000000, 'Prize amount cannot exceed $10M'),
    total: z
      .number()
      .int('Total must be an integer')
      .nonnegative('Total cannot be negative'),
    remaining: z
      .number()
      .int('Remaining must be an integer')
      .nonnegative('Remaining cannot be negative'),
    game_id: z.string().min(1, 'Game ID is required'),
  })
  .refine(
    (data) => data.remaining <= data.total,
    {
      message: 'Remaining prizes cannot exceed total prizes',
      path: ['remaining'],
    }
  );

// =====================================================
// Game Data Validation
// =====================================================

/**
 * Game schema - validates complete lottery game data
 * Critical for EV calculations and preventing malicious data
 */
export const GameSchema = z
  .object({
    id: z.string().min(1, 'Game ID is required'),
    name: z.string().min(1).max(200, 'Game name too long'),
    game_number: z
      .number()
      .int('Game number must be an integer')
      .positive('Game number must be positive'),
    price: z
      .number()
      .positive('Ticket price must be positive')
      .max(100, 'Ticket price cannot exceed $100'),
    total_tickets: z
      .number()
      .int('Total tickets must be an integer')
      .positive('Total tickets must be positive')
      .max(1000000000, 'Total tickets exceeds reasonable limit'),
    status: z.enum(['active', 'ended', 'Active', 'Retired', 'New'], {
      errorMap: () => ({ message: 'Invalid game status' }),
    }),
    prizes: z
      .array(PrizeTierSchema)
      .min(1, 'Game must have at least one prize tier')
      .max(50, 'Too many prize tiers'),
    launch_date: z.string().datetime().optional(),
    last_updated: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      // Custom validation: total prizes shouldn't exceed total tickets
      const totalPrizes = data.prizes.reduce((sum: number, p) => sum + p.total, 0);
      return totalPrizes <= data.total_tickets;
    },
    {
      message: 'Total prizes cannot exceed total tickets',
      path: ['prizes'],
    }
  );

// =====================================================
// User Authentication Validation
// =====================================================

/**
 * Email validation - strict email format validation
 * Prevents malformed email inputs
 */
export const EmailSchema = z
  .string()
  .trim()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .refine(
    (email) => {
      // Additional validation: check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/i,
        /<script/i,
        /on\w+=/i,
        /\.\./,
      ];
      return !suspiciousPatterns.some((pattern) => pattern.test(email));
    },
    'Email contains invalid characters'
  );

/**
 * Password validation - enforces strong password requirements
 * Minnesota compliance: minimum 8 characters with complexity requirements
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .refine(
    (password) => {
      // Check for common weak passwords
      const weakPasswords = [
        'password',
        '12345678',
        'qwerty',
        'letmein',
        'welcome',
      ];
      return !weakPasswords.some((weak) =>
        password.toLowerCase().includes(weak)
      );
    },
    'Password is too common or weak'
  );

// =====================================================
// Age Verification Validation
// =====================================================

/**
 * Birth date validation - ensures valid date and minimum age requirement
 * Minnesota compliance: 18+ only
 */
export const BirthDateSchema = z
  .date()
  .max(new Date(), 'Birth date cannot be in the future')
  .refine(
    (date) => {
      // Check minimum date (120 years ago)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 120);
      return date >= minDate;
    },
    {
      message: 'Birth date is too far in the past',
    }
  )
  .refine(
    (date) => {
      // Calculate age - must be 18+
      const age = Math.floor(
        (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      return age >= 18;
    },
    {
      message: 'Must be at least 18 years old',
    }
  );

/**
 * Alternative birth date schema accepting ISO string
 */
export const BirthDateStringSchema = z
  .string()
  .datetime()
  .transform((str) => new Date(str))
  .pipe(BirthDateSchema);

// =====================================================
// User Scan Validation
// =====================================================

/**
 * User scan schema - validates ticket scan data
 * Prevents fraudulent scan submissions
 */
export const UserScanSchema = z.object({
  user_id: UUIDSchema,
  game_id: z.string().min(1, 'Game ID is required'),
  scan_date: z.date(),
  result: z.enum(['winner', 'loser'], {
    errorMap: () => ({ message: 'Result must be either winner or loser' }),
  }),
  prize_amount: z
    .number()
    .nonnegative('Prize amount cannot be negative')
    .max(10000000, 'Prize amount exceeds maximum')
    .optional(),
});

// =====================================================
// API Response Validation
// =====================================================

/**
 * Supabase response schema - validates API responses
 * Ensures we handle errors properly and detect compromised responses
 */
export const SupabaseResponseSchema = z.object({
  data: z.any().nullable(),
  error: z
    .object({
      message: z.string(),
      details: z.string().optional(),
      hint: z.string().optional(),
      code: z.string().optional(),
    })
    .nullable(),
});

/**
 * Generic array response schema
 */
export const SupabaseArrayResponseSchema = z.object({
  data: z.array(z.any()).nullable(),
  error: z
    .object({
      message: z.string(),
      details: z.string().optional(),
      hint: z.string().optional(),
      code: z.string().optional(),
    })
    .nullable(),
});

// =====================================================
// EV Calculation Input Validation
// =====================================================

/**
 * User profile validation - ensures valid user preference data
 * Used for personalized EV calculations
 */
export const UserProfileSchema = z.object({
  age: z
    .number()
    .int('Age must be an integer')
    .min(18, 'User must be at least 18')
    .max(120, 'Invalid age'),
  budget: z.object({
    daily: z
      .number()
      .nonnegative('Daily budget cannot be negative')
      .max(10000, 'Daily budget exceeds reasonable limit'),
    weekly: z
      .number()
      .nonnegative('Weekly budget cannot be negative')
      .max(50000, 'Weekly budget exceeds reasonable limit'),
    monthly: z
      .number()
      .nonnegative('Monthly budget cannot be negative')
      .max(200000, 'Monthly budget exceeds reasonable limit'),
  }),
  riskProfile: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Invalid risk profile' }),
  }),
  preferences: z.object({
    maxPrice: z
      .number()
      .positive('Max price must be positive')
      .max(100, 'Max price exceeds ticket price limit'),
    luckyModeEnabled: z.boolean(),
  }),
});

// =====================================================
// Store/Location Validation
// =====================================================

/**
 * Coordinate validation - ensures valid latitude/longitude
 * Prevents invalid location queries
 */
export const CoordinateSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
});

/**
 * Radius validation - for store search queries
 */
export const RadiusSchema = z
  .number()
  .positive('Radius must be positive')
  .max(500, 'Radius too large')
  .default(25);

// =====================================================
// Type Inference Helpers
// =====================================================

/**
 * Infer TypeScript types from Zod schemas
 * Ensures type safety throughout the application
 */
export type PrizeTier = z.infer<typeof PrizeTierSchema>;
export type Game = z.infer<typeof GameSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type Password = z.infer<typeof PasswordSchema>;
export type BirthDate = z.infer<typeof BirthDateSchema>;
export type UserScan = z.infer<typeof UserScanSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Coordinate = z.infer<typeof CoordinateSchema>;
