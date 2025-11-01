/**
 * Error Handling Utilities
 * Centralized error handling for network errors, timeouts, and other failures
 */

import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export class ErrorHandler {
  /**
   * Handle network errors with user-friendly messages
   */
  static handleNetworkError(error: any, context: string = 'Network request'): void {
    console.error(`[ErrorHandler] ${context} failed:`, error);

    const message = this.getErrorMessage(error);

    Alert.alert(
      'Connection Error',
      message,
      [{ text: 'OK' }]
    );
  }

  /**
   * Get user-friendly error message from error object
   */
  static getErrorMessage(error: any): string {
    // Network/timeout errors
    if (error.message?.includes('Network request failed')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (error.message?.includes('timeout')) {
      return 'The request took too long. Please check your connection and try again.';
    }

    // Supabase errors
    if (error.message?.includes('Failed to load lottery games')) {
      return 'Could not load lottery data. Please check your internet connection.';
    }

    if (error.code === 'PGRST116') {
      return 'No data available. Please try again later.';
    }

    // Database errors
    if (error.code?.startsWith('PG')) {
      return 'Database error. Please try again later or contact support.';
    }

    // Generic error
    if (error.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Handle errors silently (log but don't alert)
   */
  static logError(error: any, context: string = 'Error'): void {
    console.error(`[ErrorHandler] ${context}:`, error);
  }

  /**
   * Check if error is network-related
   */
  static isNetworkError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch failed') ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT'
    );
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries && this.isNetworkError(error)) {
          console.log(`[ErrorHandler] Retry attempt ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }
}

/**
 * Network Status Monitor
 * Detects online/offline status using React Native NetInfo
 */
export class NetworkMonitor {
  private static listeners: Array<(isOnline: boolean) => void> = [];
  private static isOnline: boolean = true;
  private static unsubscribe: (() => void) | null = null;

  /**
   * Initialize network monitoring
   */
  static initialize(): void {
    try {
      // Use NetInfo for React Native
      this.unsubscribe = NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? true;

        // Notify listeners on status change
        if (wasOnline !== this.isOnline) {
          if (this.isOnline) {
            this.handleOnline();
          } else {
            this.handleOffline();
          }
        }
      });

      // Get initial state
      NetInfo.fetch().then(state => {
        this.isOnline = state.isConnected ?? true;
      }).catch(error => {
        console.warn('[NetworkMonitor] Failed to fetch initial state:', error);
        this.isOnline = true; // Assume online if we can't check
      });
    } catch (error) {
      console.error('[NetworkMonitor] Failed to initialize:', error);
      // Assume online if NetInfo is not available
      this.isOnline = true;
    }
  }

  /**
   * Clean up listeners
   */
  static cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Subscribe to network status changes
   */
  static subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current network status (synchronous)
   */
  static getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Fetch current network status from NetInfo (async)
   */
  static async fetchStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? true;
  }

  private static handleOnline = (): void => {
    console.log('[NetworkMonitor] Connection restored');
    this.isOnline = true;
    this.notifyListeners(true);
  };

  private static handleOffline = (): void => {
    console.log('[NetworkMonitor] Connection lost');
    this.isOnline = false;
    this.notifyListeners(false);
    Alert.alert(
      'No Internet Connection',
      'You are currently offline. Some features may not work properly.',
      [{ text: 'OK' }]
    );
  };

  private static notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('[NetworkMonitor] Listener error:', error);
      }
    });
  }
}
