// React Query configuration with offline persistence
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Create query client with optimized defaults for mobile
 * - 5 minute stale time for games (data changes slowly)
 * - 1 hour garbage collection time (keep in memory for offline use)
 * - 2 retries with exponential backoff
 * - Auto refetch on focus and reconnect
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache queries for 5 minutes before considering stale
      staleTime: 5 * 60 * 1000,

      // Keep cached data in memory for 1 hour
      gcTime: 60 * 60 * 1000,

      // Retry failed requests 2 times
      retry: 2,

      // Exponential backoff: 1s, 2s, 4s (max 30s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (when user returns to app)
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
  },
});

/**
 * Persister for offline support using AsyncStorage
 * Saves React Query cache to disk for offline functionality
 */
export const asyncStoragePersister = {
  persistClient: async (client: any) => {
    try {
      const dataToStore = JSON.stringify(client);
      await AsyncStorage.setItem('SCRATCH_ORACLE_QUERY_CACHE', dataToStore);
    } catch (error) {
      console.error('[QueryClient] Failed to persist cache:', error);
    }
  },
  restoreClient: async () => {
    try {
      const storedData = await AsyncStorage.getItem('SCRATCH_ORACLE_QUERY_CACHE');
      return storedData ? JSON.parse(storedData) : undefined;
    } catch (error) {
      console.error('[QueryClient] Failed to restore cache:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await AsyncStorage.removeItem('SCRATCH_ORACLE_QUERY_CACHE');
    } catch (error) {
      console.error('[QueryClient] Failed to remove cache:', error);
    }
  },
};

/**
 * Invalidate all game-related queries (force refresh)
 * Useful after user actions or manual refresh
 */
export function invalidateGamesCache() {
  console.log('[QueryClient] Invalidating games cache');
  return queryClient.invalidateQueries({ queryKey: ['games'] });
}

/**
 * Clear all cached data (useful for logout or reset)
 */
export function clearQueryCache() {
  console.log('[QueryClient] Clearing all cache');
  return queryClient.clear();
}
