// Feature flag configuration for gradual rollout of Supabase integration
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEATURE_FLAGS_KEY = 'scratch_oracle_feature_flags';

export interface FeatureFlags {
  // Main toggle: Use Supabase data vs mock data
  useSupabaseData: boolean;

  // Show AI prediction scores and recommendations
  enableAIScores: boolean;

  // Enable offline caching with AsyncStorage
  enableOfflineMode: boolean;

  // Cache AI predictions for this duration
  enablePredictionCache: boolean;
}

/**
 * Default flags - start with mock data and no AI features
 * This ensures safe rollout without breaking existing functionality
 */
const DEFAULT_FLAGS: FeatureFlags = {
  useSupabaseData: false,      // FALSE: Use mock data by default
  enableAIScores: false,       // FALSE: Hide AI scores until Supabase enabled
  enableOfflineMode: true,     // TRUE: Always cache for offline (works with mock too)
  enablePredictionCache: true, // TRUE: Cache predictions for performance
};

/**
 * Feature Flag Service
 * Controls which data source and features are active
 * Allows A/B testing and gradual rollout
 */
export class FeatureFlagService {
  private static flags: FeatureFlags = DEFAULT_FLAGS;
  private static initialized = false;

  /**
   * Initialize feature flags from storage on app startup
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[FeatureFlags] Already initialized');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        this.flags = { ...DEFAULT_FLAGS, ...parsedFlags };
        console.log('[FeatureFlags] Loaded from storage:', this.flags);
      } else {
        console.log('[FeatureFlags] Using defaults:', this.flags);
      }
    } catch (error) {
      console.error('[FeatureFlags] Failed to load from storage:', error);
      this.flags = DEFAULT_FLAGS;
    }

    this.initialized = true;
  }

  /**
   * Get current flags (read-only copy)
   */
  static getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update flags and persist to storage
   * For admin/testing purposes
   */
  static async setFlags(updates: Partial<FeatureFlags>): Promise<void> {
    this.flags = { ...this.flags, ...updates };

    try {
      await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(this.flags));
      console.log('[FeatureFlags] Updated and saved:', this.flags);
    } catch (error) {
      console.error('[FeatureFlags] Failed to save flags:', error);
    }
  }

  /**
   * Check if Supabase data should be used
   * Returns TRUE to use Supabase, FALSE to use mock data
   */
  static useSupabase(): boolean {
    const useSupabase = this.flags.useSupabaseData;
    if (useSupabase) {
      console.log('[FeatureFlags] Using REAL Supabase data');
    } else {
      console.log('[FeatureFlags] Using MOCK data');
    }
    return useSupabase;
  }

  /**
   * Check if AI scores should be displayed
   * Only show AI features when using Supabase data
   */
  static showAIScores(): boolean {
    return this.flags.enableAIScores && this.flags.useSupabaseData;
  }

  /**
   * Check if offline mode is enabled
   */
  static isOfflineModeEnabled(): boolean {
    return this.flags.enableOfflineMode;
  }

  /**
   * Enable Supabase and AI features (for migration/testing)
   * This is the "switch" to turn on real data
   */
  static async enableSupabase(): Promise<void> {
    console.log('[FeatureFlags] Enabling Supabase data and AI features');
    await this.setFlags({
      useSupabaseData: true,
      enableAIScores: true,  // Auto-enable AI when using Supabase
    });
  }

  /**
   * Disable Supabase and return to mock data (rollback)
   */
  static async disableSupabase(): Promise<void> {
    console.log('[FeatureFlags] Disabling Supabase, reverting to mock data');
    await this.setFlags({
      useSupabaseData: false,
      enableAIScores: false,
    });
  }

  /**
   * Reset all flags to defaults
   */
  static async resetToDefaults(): Promise<void> {
    console.log('[FeatureFlags] Resetting to defaults');
    this.flags = DEFAULT_FLAGS;
    await AsyncStorage.removeItem(FEATURE_FLAGS_KEY);
  }

  /**
   * Get a human-readable status message
   */
  static getStatusMessage(): string {
    if (this.flags.useSupabaseData) {
      return `Using REAL data from Supabase ${this.flags.enableAIScores ? 'with AI predictions' : '(AI disabled)'}`;
    }
    return 'Using MOCK data for testing';
  }
}
