import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { AuthService } from '../services/auth/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    initializeAuth();

    // Subscribe to auth state changes with error handling
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = AuthService.onAuthStateChange((user, session) => {
        console.log('[AuthContext] Auth state changed:', user ? 'signed in' : 'signed out');
        setUser(user);
        setSession(session);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('[AuthContext] Failed to subscribe to auth changes:', error);
      // Proceed without auth state change subscription
      unsubscribe = () => {}; // No-op unsubscribe
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('[AuthContext] Error during unsubscribe:', error);
        }
      }
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const currentSession = await AuthService.getSession();
      const currentUser = await AuthService.getCurrentUser();

      setSession(currentSession);
      setUser(currentUser);
    } catch (error) {
      console.error('[AuthContext] Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user, session, error } = await AuthService.signIn(email, password);

    if (error) {
      throw error;
    }

    setUser(user);
    setSession(session);
  };

  const signUp = async (email: string, password: string) => {
    const { user, session, error } = await AuthService.signUp(email, password);

    if (error) {
      throw error;
    }

    setUser(user);
    setSession(session);
  };

  const signOut = async () => {
    const { error } = await AuthService.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
