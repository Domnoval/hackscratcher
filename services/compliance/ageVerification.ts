// Age Verification Service - Minnesota compliance requirement (18+)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validate, ValidationError } from '../validation/validator';
import { BirthDateSchema } from '../validation/schemas';

export interface AgeVerificationResult {
  isVerified: boolean;
  age?: number;
  verificationDate?: string;
  requiresReverification: boolean;
}

export class AgeVerificationService {
  private static readonly MIN_AGE = 18;
  private static readonly STORAGE_KEY = 'age_verification';
  private static readonly REVERIFY_DAYS = 90; // Re-verify every 90 days

  /**
   * Verify user's age and store verification
   * Now includes Zod validation for birth date
   */
  static async verifyAge(birthDate: Date): Promise<AgeVerificationResult> {
    try {
      // Validate birth date using Zod schema (checks age >= 18, valid date, etc.)
      const validBirthDate = validate(BirthDateSchema, birthDate, 'birthDate');

      const age = this.calculateAge(validBirthDate);
      const isVerified = age >= this.MIN_AGE;

      if (isVerified) {
        const verification = {
          age,
          verificationDate: new Date().toISOString(),
          birthDate: validBirthDate.toISOString()
        };

        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(verification));

        return {
          isVerified: true,
          age,
          verificationDate: verification.verificationDate,
          requiresReverification: false
        };
      }

      return {
        isVerified: false,
        requiresReverification: false
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('[AgeVerification] Validation error:', error.getMessages());
        // Return verification failure with helpful message
        return {
          isVerified: false,
          requiresReverification: false
        };
      }
      throw error;
    }
  }

  /**
   * Check existing age verification status
   */
  static async checkVerificationStatus(): Promise<AgeVerificationResult> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);

      if (!stored) {
        return {
          isVerified: false,
          requiresReverification: true
        };
      }

      const verification = JSON.parse(stored);
      const verificationDate = new Date(verification.verificationDate);
      const daysSinceVerification = Math.floor(
        (Date.now() - verificationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if reverification is needed
      if (daysSinceVerification > this.REVERIFY_DAYS) {
        return {
          isVerified: false,
          age: verification.age,
          verificationDate: verification.verificationDate,
          requiresReverification: true
        };
      }

      return {
        isVerified: true,
        age: verification.age,
        verificationDate: verification.verificationDate,
        requiresReverification: false
      };
    } catch (error) {
      console.error('Age verification check failed:', error);
      return {
        isVerified: false,
        requiresReverification: true
      };
    }
  }

  /**
   * Clear age verification (for testing or user request)
   */
  static async clearVerification(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get required disclaimers for age gate
   */
  static getAgeGateDisclaimers(): string[] {
    return [
      'You must be 18 years or older to use this app',
      'This app is for entertainment purposes only',
      'Lottery games involve risk of loss',
      'Problem gambling help: 1-800-333-HOPE'
    ];
  }

  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Validate birth date input
   */
  static validateBirthDate(birthDate: Date): {
    isValid: boolean;
    error?: string;
  } {
    const today = new Date();

    // Check if date is in the future
    if (birthDate > today) {
      return {
        isValid: false,
        error: 'Birth date cannot be in the future'
      };
    }

    // Check if date is too far in the past (reasonable age limit)
    const maxAge = 120;
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - maxAge);

    if (birthDate < minDate) {
      return {
        isValid: false,
        error: 'Please enter a valid birth date'
      };
    }

    return { isValid: true };
  }
}