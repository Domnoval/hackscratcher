import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Mock Supabase module before importing AuthService
jest.mock('../../../lib/supabase', () => {
  const mockAuth: any = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
  };
  return {
    supabase: {
      auth: mockAuth,
    },
  };
});

// Now we can safely import AuthService and get mockSupabaseAuth
import { AuthService } from '../../../services/auth/authService';
const { supabase } = require('../../../lib/supabase');
const mockSupabaseAuth = supabase.auth;

describe('AuthService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Property-based tests', () => {
    it('should handle any valid email/password combination', () => {
      fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 100 }),
          async (email, password) => {
            const mockUser = { id: '123', email } as User;
            const mockSession = { access_token: 'token' } as Session;

            mockSupabaseAuth.signUp.mockResolvedValueOnce({
              data: { user: mockUser, session: mockSession },
              error: null,
            });

            const result = await AuthService.signUp(email, password);

            expect(result.error).toBeNull();
            expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
              email,
              password,
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should never throw unhandled errors for any input', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          async (email, password) => {
            mockSupabaseAuth.signUp.mockResolvedValueOnce({
              data: { user: null, session: null },
              error: { message: 'Invalid input' } as AuthError,
            });

            // Should not throw
            const result = await AuthService.signUp(email, password);
            expect(result).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Sign Up', () => {
    it('should successfully sign up a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { id: '123', email } as User;
      const mockSession = { access_token: 'token' } as Session;

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await AuthService.signUp(email, password);

      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email,
        password,
      });
    });

    it('should handle sign up errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockError = { message: 'User already exists' } as AuthError;

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.signUp(email, password);

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should handle sign up exceptions', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockException = new Error('Network error');

      mockSupabaseAuth.signUp.mockRejectedValueOnce(mockException);

      const result = await AuthService.signUp(email, password);

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toEqual(mockException);
    });

    it('should handle weak password errors', async () => {
      const email = 'test@example.com';
      const password = '123';
      const mockError = { message: 'Password is too weak' } as AuthError;

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.signUp(email, password);

      expect(result.error).toEqual(mockError);
    });

    it('should handle invalid email format', async () => {
      const email = 'invalid-email';
      const password = 'password123';
      const mockError = { message: 'Invalid email format' } as AuthError;

      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.signUp(email, password);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('Sign In', () => {
    it('should successfully sign in an existing user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { id: '123', email } as User;
      const mockSession = { access_token: 'token' } as Session;

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await AuthService.signIn(email, password);

      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
    });

    it('should handle invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockError = { message: 'Invalid credentials' } as AuthError;

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.signIn(email, password);

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should handle sign in exceptions', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockException = new Error('Database connection failed');

      mockSupabaseAuth.signInWithPassword.mockRejectedValueOnce(mockException);

      const result = await AuthService.signIn(email, password);

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toEqual(mockException);
    });

    it('should handle user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';
      const mockError = { message: 'User not found' } as AuthError;

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.signIn(email, password);

      expect(result.error).toEqual(mockError);
    });

    it('should handle account locked errors', async () => {
      const email = 'locked@example.com';
      const password = 'password123';
      const mockError = { message: 'Account is locked' } as AuthError;

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.signIn(email, password);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('Sign Out', () => {
    it('should successfully sign out', async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const result = await AuthService.signOut();

      expect(result.error).toBeNull();
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed' } as AuthError;

      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: mockError,
      });

      const result = await AuthService.signOut();

      expect(result.error).toEqual(mockError);
    });

    it('should handle sign out exceptions', async () => {
      const mockException = new Error('Network timeout');

      mockSupabaseAuth.signOut.mockRejectedValueOnce(mockException);

      const result = await AuthService.signOut();

      expect(result.error).toEqual(mockException);
    });
  });

  describe('Get Current User', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' } as User;

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    });

    it('should return null when not authenticated', async () => {
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const mockError = { message: 'Session expired' } as AuthError;

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: mockError,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      const mockException = new Error('Network error');

      mockSupabaseAuth.getUser.mockRejectedValueOnce(mockException);

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('Get Session', () => {
    it('should return current session when authenticated', async () => {
      const mockSession = { access_token: 'token', refresh_token: 'refresh' } as Session;

      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await AuthService.getSession();

      expect(result).toEqual(mockSession);
      expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
    });

    it('should return null when no session exists', async () => {
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await AuthService.getSession();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const mockError = { message: 'Session retrieval failed' } as AuthError;

      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: mockError,
      });

      const result = await AuthService.getSession();

      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      const mockException = new Error('Connection failed');

      mockSupabaseAuth.getSession.mockRejectedValueOnce(mockException);

      const result = await AuthService.getSession();

      expect(result).toBeNull();
    });
  });

  describe('Auth State Change', () => {
    it('should subscribe to auth state changes', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockSubscription = { unsubscribe: mockUnsubscribe };

      mockSupabaseAuth.onAuthStateChange.mockReturnValueOnce({
        data: { subscription: mockSubscription },
      });

      const unsubscribe = AuthService.onAuthStateChange(mockCallback);

      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      // Call unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should call callback on auth state change', () => {
      const mockCallback = jest.fn();
      const mockUser = { id: '123', email: 'test@example.com' } as User;
      const mockSession = { access_token: 'token' } as Session;

      let authChangeCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementationOnce((callback: any) => {
        authChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      AuthService.onAuthStateChange(mockCallback);

      // Simulate auth state change
      authChangeCallback('SIGNED_IN', mockSession);

      expect(mockCallback).toHaveBeenCalledWith(mockSession.user ?? null, mockSession);
    });

    it('should handle null session in callback', () => {
      const mockCallback = jest.fn();

      let authChangeCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementationOnce((callback: any) => {
        authChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      AuthService.onAuthStateChange(mockCallback);

      // Simulate sign out
      authChangeCallback('SIGNED_OUT', null);

      expect(mockCallback).toHaveBeenCalledWith(null, null);
    });
  });

  describe('Reset Password', () => {
    it('should successfully send password reset email', async () => {
      const email = 'test@example.com';

      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValueOnce({
        error: null,
      });

      const result = await AuthService.resetPassword(email);

      expect(result.error).toBeNull();
      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(email);
    });

    it('should handle reset password errors', async () => {
      const email = 'nonexistent@example.com';
      const mockError = { message: 'Email not found' } as AuthError;

      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValueOnce({
        error: mockError,
      });

      const result = await AuthService.resetPassword(email);

      expect(result.error).toEqual(mockError);
    });

    it('should handle reset password exceptions', async () => {
      const email = 'test@example.com';
      const mockException = new Error('Email service unavailable');

      mockSupabaseAuth.resetPasswordForEmail.mockRejectedValueOnce(mockException);

      const result = await AuthService.resetPassword(email);

      expect(result.error).toEqual(mockException);
    });
  });

  describe('Update Password', () => {
    it('should successfully update password', async () => {
      const newPassword = 'newpassword123';

      mockSupabaseAuth.updateUser.mockResolvedValueOnce({
        error: null,
      });

      const result = await AuthService.updatePassword(newPassword);

      expect(result.error).toBeNull();
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it('should handle update password errors', async () => {
      const newPassword = 'weak';
      const mockError = { message: 'Password is too weak' } as AuthError;

      mockSupabaseAuth.updateUser.mockResolvedValueOnce({
        error: mockError,
      });

      const result = await AuthService.updatePassword(newPassword);

      expect(result.error).toEqual(mockError);
    });

    it('should handle update password exceptions', async () => {
      const newPassword = 'newpassword123';
      const mockException = new Error('Not authenticated');

      mockSupabaseAuth.updateUser.mockRejectedValueOnce(mockException);

      const result = await AuthService.updatePassword(newPassword);

      expect(result.error).toEqual(mockException);
    });

    it('should handle update when user is not logged in', async () => {
      const newPassword = 'newpassword123';
      const mockError = { message: 'User not authenticated' } as AuthError;

      mockSupabaseAuth.updateUser.mockResolvedValueOnce({
        error: mockError,
      });

      const result = await AuthService.updatePassword(newPassword);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete sign up and sign in flow', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const mockUser = { id: '123', email } as User;
      const mockSession = { access_token: 'token' } as Session;

      // Sign up
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const signUpResult = await AuthService.signUp(email, password);
      expect(signUpResult.user).toEqual(mockUser);

      // Get current user
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const currentUser = await AuthService.getCurrentUser();
      expect(currentUser).toEqual(mockUser);

      // Sign out
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const signOutResult = await AuthService.signOut();
      expect(signOutResult.error).toBeNull();
    });

    it('should handle sign in after failed sign up', async () => {
      const email = 'existing@example.com';
      const password = 'password123';
      const mockUser = { id: '123', email } as User;
      const mockSession = { access_token: 'token' } as Session;

      // Failed sign up (user exists)
      mockSupabaseAuth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already exists' } as AuthError,
      });

      const signUpResult = await AuthService.signUp(email, password);
      expect(signUpResult.error).toBeDefined();

      // Successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const signInResult = await AuthService.signIn(email, password);
      expect(signInResult.user).toEqual(mockUser);
    });
  });
});
