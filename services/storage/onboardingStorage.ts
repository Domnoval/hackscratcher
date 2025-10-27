/**
 * Onboarding Storage Service
 *
 * Manages persistent storage for onboarding state using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@scratch_oracle_onboarding_complete';

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('[OnboardingStorage] Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('[OnboardingStorage] Onboarding marked as complete');
  } catch (error) {
    console.error('[OnboardingStorage] Error saving onboarding status:', error);
    throw error;
  }
}

/**
 * Reset onboarding status (for testing/debugging)
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('[OnboardingStorage] Onboarding status reset');
  } catch (error) {
    console.error('[OnboardingStorage] Error resetting onboarding:', error);
    throw error;
  }
}
