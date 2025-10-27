/**
 * Validation Schema Tests
 * Tests for all Zod validation schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  EmailSchema,
  PasswordSchema,
  BirthDateSchema,
  PrizeTierSchema,
  GameSchema,
  UserProfileSchema,
  CoordinateSchema,
  RadiusSchema,
  UUIDSchema,
  SafeStringSchema,
} from '../../../services/validation/schemas';

describe('Email Schema Validation', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'firstname+lastname@company.org',
    ];

    validEmails.forEach((email) => {
      expect(() => EmailSchema.parse(email)).not.toThrow();
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user@.com',
      '<script>alert(1)</script>@example.com',
      'javascript:alert(1)',
    ];

    invalidEmails.forEach((email) => {
      expect(() => EmailSchema.parse(email)).toThrow();
    });
  });

  it('should reject emails with dangerous patterns', () => {
    const dangerousEmails = [
      'test<script>@example.com',
      'user@example.com javascript:',
      'admin@site.com onclick=',
    ];

    dangerousEmails.forEach((email) => {
      expect(() => EmailSchema.parse(email)).toThrow();
    });
  });

  it('should reject emails that are too long', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(() => EmailSchema.parse(longEmail)).toThrow();
  });
});

describe('Password Schema Validation', () => {
  it('should accept strong passwords', () => {
    const strongPasswords = [
      'SecurePass123',
      'MyP@ssw0rd',
      'Complex1ty!',
      'Testing123ABC',
    ];

    strongPasswords.forEach((password) => {
      expect(() => PasswordSchema.parse(password)).not.toThrow();
    });
  });

  it('should reject passwords without uppercase letters', () => {
    expect(() => PasswordSchema.parse('password123')).toThrow();
  });

  it('should reject passwords without lowercase letters', () => {
    expect(() => PasswordSchema.parse('PASSWORD123')).toThrow();
  });

  it('should reject passwords without numbers', () => {
    expect(() => PasswordSchema.parse('PasswordABC')).toThrow();
  });

  it('should reject passwords that are too short', () => {
    expect(() => PasswordSchema.parse('Pass1')).toThrow();
  });

  it('should reject common weak passwords', () => {
    const weakPasswords = [
      'Password123',
      'Qwerty123',
      '12345678Aa',
      'Letmein1',
    ];

    weakPasswords.forEach((password) => {
      expect(() => PasswordSchema.parse(password)).toThrow();
    });
  });

  it('should reject passwords that are too long', () => {
    const longPassword = 'A1' + 'a'.repeat(130);
    expect(() => PasswordSchema.parse(longPassword)).toThrow();
  });
});

describe('Birth Date Schema Validation', () => {
  it('should accept valid birth dates for 18+ users', () => {
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

    const thirtyYearsAgo = new Date();
    thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);

    expect(() => BirthDateSchema.parse(twentyYearsAgo)).not.toThrow();
    expect(() => BirthDateSchema.parse(thirtyYearsAgo)).not.toThrow();
  });

  it('should reject birth dates for users under 18', () => {
    const sixteenYearsAgo = new Date();
    sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);

    expect(() => BirthDateSchema.parse(sixteenYearsAgo)).toThrow();
  });

  it('should reject future birth dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(() => BirthDateSchema.parse(tomorrow)).toThrow();
  });

  it('should reject birth dates too far in the past', () => {
    const tooOld = new Date();
    tooOld.setFullYear(tooOld.getFullYear() - 125);

    expect(() => BirthDateSchema.parse(tooOld)).toThrow();
  });

  it('should accept exact 18th birthday', () => {
    const exactlyEighteen = new Date();
    exactlyEighteen.setFullYear(exactlyEighteen.getFullYear() - 18);

    expect(() => BirthDateSchema.parse(exactlyEighteen)).not.toThrow();
  });
});

describe('Prize Tier Schema Validation', () => {
  it('should accept valid prize tier data', () => {
    const validPrizeTier = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      prize_amount: 1000,
      total: 100,
      remaining: 50,
      game_id: 'game_123',
    };

    expect(() => PrizeTierSchema.parse(validPrizeTier)).not.toThrow();
  });

  it('should reject prize tiers with remaining > total', () => {
    const invalidPrizeTier = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      prize_amount: 1000,
      total: 50,
      remaining: 100, // More remaining than total
      game_id: 'game_123',
    };

    expect(() => PrizeTierSchema.parse(invalidPrizeTier)).toThrow();
  });

  it('should reject negative prize amounts', () => {
    const invalidPrizeTier = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      prize_amount: -100,
      total: 50,
      remaining: 25,
      game_id: 'game_123',
    };

    expect(() => PrizeTierSchema.parse(invalidPrizeTier)).toThrow();
  });

  it('should reject prize amounts exceeding maximum', () => {
    const invalidPrizeTier = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      prize_amount: 20000000, // Exceeds $10M max
      total: 1,
      remaining: 1,
      game_id: 'game_123',
    };

    expect(() => PrizeTierSchema.parse(invalidPrizeTier)).toThrow();
  });

  it('should reject non-integer total or remaining', () => {
    const invalidPrizeTier = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      prize_amount: 1000,
      total: 50.5, // Should be integer
      remaining: 25,
      game_id: 'game_123',
    };

    expect(() => PrizeTierSchema.parse(invalidPrizeTier)).toThrow();
  });
});

describe('Game Schema Validation', () => {
  it('should accept valid game data', () => {
    const validGame = {
      id: 'game_123',
      name: 'Lucky 7s',
      game_number: 1234,
      price: 5,
      total_tickets: 1000000,
      status: 'active',
      prizes: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          prize_amount: 10000,
          total: 10,
          remaining: 5,
          game_id: 'game_123',
        },
      ],
    };

    expect(() => GameSchema.parse(validGame)).not.toThrow();
  });

  it('should reject games with no prizes', () => {
    const invalidGame = {
      id: 'game_123',
      name: 'Lucky 7s',
      game_number: 1234,
      price: 5,
      total_tickets: 1000000,
      status: 'active',
      prizes: [], // Empty prizes array
    };

    expect(() => GameSchema.parse(invalidGame)).toThrow();
  });

  it('should reject games with more prizes than tickets', () => {
    const invalidGame = {
      id: 'game_123',
      name: 'Lucky 7s',
      game_number: 1234,
      price: 5,
      total_tickets: 100,
      status: 'active',
      prizes: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          prize_amount: 1000,
          total: 150, // More prizes than tickets
          remaining: 150,
          game_id: 'game_123',
        },
      ],
    };

    expect(() => GameSchema.parse(invalidGame)).toThrow();
  });

  it('should reject games with invalid status', () => {
    const invalidGame = {
      id: 'game_123',
      name: 'Lucky 7s',
      game_number: 1234,
      price: 5,
      total_tickets: 1000000,
      status: 'invalid_status',
      prizes: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          prize_amount: 1000,
          total: 10,
          remaining: 5,
          game_id: 'game_123',
        },
      ],
    };

    expect(() => GameSchema.parse(invalidGame)).toThrow();
  });

  it('should reject games with ticket price exceeding maximum', () => {
    const invalidGame = {
      id: 'game_123',
      name: 'Expensive Game',
      game_number: 1234,
      price: 150, // Exceeds $100 max
      total_tickets: 1000000,
      status: 'active',
      prizes: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          prize_amount: 1000,
          total: 10,
          remaining: 5,
          game_id: 'game_123',
        },
      ],
    };

    expect(() => GameSchema.parse(invalidGame)).toThrow();
  });
});

describe('User Profile Schema Validation', () => {
  it('should accept valid user profiles', () => {
    const validProfile = {
      age: 25,
      budget: {
        daily: 20,
        weekly: 100,
        monthly: 400,
      },
      riskProfile: 'medium' as const,
      preferences: {
        maxPrice: 10,
        luckyModeEnabled: true,
      },
    };

    expect(() => UserProfileSchema.parse(validProfile)).not.toThrow();
  });

  it('should reject profiles with age under 18', () => {
    const invalidProfile = {
      age: 16,
      budget: { daily: 20, weekly: 100, monthly: 400 },
      riskProfile: 'medium' as const,
      preferences: { maxPrice: 10, luckyModeEnabled: true },
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('should reject profiles with negative budgets', () => {
    const invalidProfile = {
      age: 25,
      budget: { daily: -10, weekly: 100, monthly: 400 },
      riskProfile: 'medium' as const,
      preferences: { maxPrice: 10, luckyModeEnabled: true },
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('should reject profiles with invalid risk profile', () => {
    const invalidProfile = {
      age: 25,
      budget: { daily: 20, weekly: 100, monthly: 400 },
      riskProfile: 'super_high',
      preferences: { maxPrice: 10, luckyModeEnabled: true },
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('should reject profiles with excessive budgets', () => {
    const invalidProfile = {
      age: 25,
      budget: { daily: 20, weekly: 100, monthly: 500000 }, // Exceeds max
      riskProfile: 'medium' as const,
      preferences: { maxPrice: 10, luckyModeEnabled: true },
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });
});

describe('Coordinate Schema Validation', () => {
  it('should accept valid coordinates', () => {
    const validCoordinates = [
      { latitude: 45.5, longitude: -93.2 }, // Minneapolis
      { latitude: 0, longitude: 0 }, // Equator/Prime Meridian
      { latitude: 90, longitude: 180 }, // North Pole, Date Line
      { latitude: -90, longitude: -180 }, // South Pole
    ];

    validCoordinates.forEach((coord) => {
      expect(() => CoordinateSchema.parse(coord)).not.toThrow();
    });
  });

  it('should reject invalid latitudes', () => {
    const invalidCoordinates = [
      { latitude: 91, longitude: 0 }, // Too far north
      { latitude: -91, longitude: 0 }, // Too far south
    ];

    invalidCoordinates.forEach((coord) => {
      expect(() => CoordinateSchema.parse(coord)).toThrow();
    });
  });

  it('should reject invalid longitudes', () => {
    const invalidCoordinates = [
      { latitude: 0, longitude: 181 }, // Too far east
      { latitude: 0, longitude: -181 }, // Too far west
    ];

    invalidCoordinates.forEach((coord) => {
      expect(() => CoordinateSchema.parse(coord)).toThrow();
    });
  });
});

describe('UUID Schema Validation', () => {
  it('should accept valid UUIDs', () => {
    const validUUIDs = [
      '123e4567-e89b-12d3-a456-426614174000',
      '00000000-0000-0000-0000-000000000000',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
    ];

    validUUIDs.forEach((uuid) => {
      expect(() => UUIDSchema.parse(uuid)).not.toThrow();
    });
  });

  it('should reject invalid UUIDs', () => {
    const invalidUUIDs = [
      'not-a-uuid',
      '123e4567-e89b-12d3-a456', // Too short
      '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
      'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    ];

    invalidUUIDs.forEach((uuid) => {
      expect(() => UUIDSchema.parse(uuid)).toThrow();
    });
  });
});

describe('Safe String Schema Validation', () => {
  it('should accept safe strings', () => {
    const safeStrings = ['Hello World', 'User Input 123', 'Valid-String_Input'];

    safeStrings.forEach((str) => {
      expect(() => SafeStringSchema.parse(str)).not.toThrow();
    });
  });

  it('should reject strings with dangerous patterns', () => {
    const dangerousStrings = [
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      '<img onerror="alert(1)">',
      'onclick=alert(1)',
    ];

    dangerousStrings.forEach((str) => {
      expect(() => SafeStringSchema.parse(str)).toThrow();
    });
  });

  it('should reject empty strings', () => {
    expect(() => SafeStringSchema.parse('')).toThrow();
    expect(() => SafeStringSchema.parse('   ')).toThrow();
  });

  it('should reject strings that are too long', () => {
    const longString = 'a'.repeat(1001);
    expect(() => SafeStringSchema.parse(longString)).toThrow();
  });
});

describe('Radius Schema Validation', () => {
  it('should accept valid radii', () => {
    expect(() => RadiusSchema.parse(25)).not.toThrow();
    expect(() => RadiusSchema.parse(100)).not.toThrow();
  });

  it('should use default value when not provided', () => {
    const result = RadiusSchema.parse(undefined);
    expect(result).toBe(25);
  });

  it('should reject negative radii', () => {
    expect(() => RadiusSchema.parse(-10)).toThrow();
  });

  it('should reject radii that are too large', () => {
    expect(() => RadiusSchema.parse(600)).toThrow();
  });
});
