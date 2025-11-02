import { supabase } from '../../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { validate, ValidationError } from '../validation/validator';
import { EmailSchema, PasswordSchema } from '../validation/schemas';
import { sanitizeEmail } from '../validation/sanitizer';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Authentication Service
 * Handles all Supabase authentication operations
 */
export class AuthService {
  /**
   * Sign up a new user with email and password
   * Validates email and password format before submission
   */
  static async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate and sanitize email
      const validEmail = validate(EmailSchema, sanitizeEmail(email), 'email');

      // Validate password strength
      const validPassword = validate(PasswordSchema, password, 'password');

      const { data, error } = await supabase.auth.signUp({
        email: validEmail,
        password: validPassword,
      });

      if (error) {
        console.error('[AuthService] Sign up error:', error);
        return {
          user: null,
          session: null,
          error,
        };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('[AuthService] Validation error:', error.getMessages());
        // Convert validation error to AuthError format
        return {
          user: null,
          session: null,
          error: {
            name: 'ValidationError',
            message: error.getFirstMessage(),
            status: 400,
          } as AuthError,
        };
      }

      console.error('[AuthService] Sign up exception:', error);
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in an existing user with email and password
   * Validates email format before submission
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate and sanitize email
      const validEmail = validate(EmailSchema, sanitizeEmail(email), 'email');

      // Basic validation for password (not as strict as signup)
      if (!password || password.length < 1) {
        return {
          user: null,
          session: null,
          error: {
            name: 'ValidationError',
            message: 'Password is required',
            status: 400,
          } as AuthError,
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validEmail,
        password,
      });

      if (error) {
        console.error('[AuthService] Sign in error:', error);
        return {
          user: null,
          session: null,
          error,
        };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('[AuthService] Validation error:', error.getMessages());
        return {
          user: null,
          session: null,
          error: {
            name: 'ValidationError',
            message: error.getFirstMessage(),
            status: 400,
          } as AuthError,
        };
      }

      console.error('[AuthService] Sign in exception:', error);
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[AuthService] Sign out error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('[AuthService] Sign out exception:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Get the currently authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('[AuthService] Get user error:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('[AuthService] Get user exception:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  static async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthService] Get session error:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('[AuthService] Get session exception:', error);
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   * Returns an unsubscribe function
   */
  static onAuthStateChange(
    callback: (user: User | null, session: Session | null) => void
  ): () => void {
    try {
      // Check if supabase.auth.onAuthStateChange exists
      if (!supabase?.auth?.onAuthStateChange || typeof supabase.auth.onAuthStateChange !== 'function') {
        console.error('[AuthService] onAuthStateChange not available on supabase.auth');
        console.error('[AuthService] supabase:', !!supabase);
        console.error('[AuthService] supabase.auth:', !!supabase?.auth);
        // Return no-op unsubscribe function
        return () => {};
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('[AuthService] Auth state changed:', event);
          callback(session?.user ?? null, session);
        }
      );

      // Return unsubscribe function with safety check
      return () => {
        try {
          if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
        } catch (error) {
          console.error('[AuthService] Error unsubscribing from auth changes:', error);
        }
      };
    } catch (error) {
      console.error('[AuthService] Failed to subscribe to auth state changes:', error);
      // Return no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Reset password for a user
   * Validates email format before submission
   */
  static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      // Validate and sanitize email
      const validEmail = validate(EmailSchema, sanitizeEmail(email), 'email');

      const { error } = await supabase.auth.resetPasswordForEmail(validEmail);

      if (error) {
        console.error('[AuthService] Reset password error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('[AuthService] Validation error:', error.getMessages());
        return {
          error: {
            name: 'ValidationError',
            message: error.getFirstMessage(),
            status: 400,
          } as AuthError,
        };
      }

      console.error('[AuthService] Reset password exception:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Update user password
   * Validates new password strength before submission
   */
  static async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      // Validate password strength
      const validPassword = validate(PasswordSchema, newPassword, 'password');

      const { error } = await supabase.auth.updateUser({
        password: validPassword,
      });

      if (error) {
        console.error('[AuthService] Update password error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('[AuthService] Validation error:', error.getMessages());
        return {
          error: {
            name: 'ValidationError',
            message: error.getFirstMessage(),
            status: 400,
          } as AuthError,
        };
      }

      console.error('[AuthService] Update password exception:', error);
      return { error: error as AuthError };
    }
  }
}
