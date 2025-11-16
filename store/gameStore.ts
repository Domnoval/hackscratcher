/**
 * Zustand Game Store - Modern State Management
 *
 * REPLACES: Redux/Redux Toolkit (@reduxjs/toolkit, react-redux)
 *
 * Benefits over Redux:
 * - 90% less boilerplate code
 * - No providers needed (works anywhere)
 * - Better TypeScript inference
 * - Smaller bundle size (~1KB vs ~20KB)
 * - Easier to test and debug
 * - Works with React Query for server state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recommendation, LotteryGame } from '../types/lottery';

// Define store state type
interface GameState {
  // UI State
  selectedState: 'MN' | 'FL';
  budget: string;
  isLoading: boolean;

  // Data State
  recommendations: Recommendation[];
  games: LotteryGame[];
  favoriteGameIds: string[];

  // Network State
  isOnline: boolean;
  lastSync: string | null;

  // User Preferences
  preferences: {
    showAIBadges: boolean;
    notificationsEnabled: boolean;
    theme: 'dark' | 'light';
  };

  // Actions
  setSelectedState: (state: 'MN' | 'FL') => void;
  setBudget: (budget: string) => void;
  setIsLoading: (loading: boolean) => void;
  setRecommendations: (recommendations: Recommendation[]) => void;
  setGames: (games: LotteryGame[]) => void;
  addFavorite: (gameId: string) => void;
  removeFavorite: (gameId: string) => void;
  toggleFavorite: (gameId: string) => void;
  setIsOnline: (online: boolean) => void;
  updateLastSync: () => void;
  updatePreferences: (preferences: Partial<GameState['preferences']>) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  selectedState: 'MN' as 'MN' | 'FL',
  budget: '20',
  isLoading: false,
  recommendations: [],
  games: [],
  favoriteGameIds: [],
  isOnline: true,
  lastSync: null,
  preferences: {
    showAIBadges: true,
    notificationsEnabled: true,
    theme: 'dark' as const,
  },
};

/**
 * Main Game Store
 *
 * Usage in components:
 *
 * // Select entire state (re-renders on any change)
 * const state = useGameStore();
 *
 * // Select specific values (only re-renders when they change)
 * const budget = useGameStore(state => state.budget);
 * const setSelectedState = useGameStore(state => state.setSelectedState);
 *
 * // Multiple selectors
 * const { recommendations, isLoading } = useGameStore(state => ({
 *   recommendations: state.recommendations,
 *   isLoading: state.isLoading
 * }));
 */
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setSelectedState: (selectedState) => set({ selectedState }),

      setBudget: (budget) => set({ budget }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setRecommendations: (recommendations) => set({ recommendations }),

      setGames: (games) => set({ games }),

      addFavorite: (gameId) =>
        set((state) => ({
          favoriteGameIds: [...state.favoriteGameIds, gameId]
        })),

      removeFavorite: (gameId) =>
        set((state) => ({
          favoriteGameIds: state.favoriteGameIds.filter(id => id !== gameId)
        })),

      toggleFavorite: (gameId) => {
        const { favoriteGameIds } = get();
        if (favoriteGameIds.includes(gameId)) {
          set({ favoriteGameIds: favoriteGameIds.filter(id => id !== gameId) });
        } else {
          set({ favoriteGameIds: [...favoriteGameIds, gameId] });
        }
      },

      setIsOnline: (isOnline) => set({ isOnline }),

      updateLastSync: () => set({ lastSync: new Date().toISOString() }),

      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'game-storage', // Storage key
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields
      partialize: (state) => ({
        selectedState: state.selectedState,
        budget: state.budget,
        favoriteGameIds: state.favoriteGameIds,
        preferences: state.preferences,
      }),
    }
  )
);

/**
 * Selectors - Pre-built selectors for common use cases
 * These prevent re-renders by only selecting specific slices
 */
export const gameSelectors = {
  // Get favorite games
  useFavoriteGames: () =>
    useGameStore((state) => {
      const { games, favoriteGameIds } = state;
      return games.filter(game => favoriteGameIds.includes(game.id));
    }),

  // Check if game is favorited
  useIsFavorite: (gameId: string) =>
    useGameStore((state) => state.favoriteGameIds.includes(gameId)),

  // Get recommendations for current budget
  useValidRecommendations: () =>
    useGameStore((state) => {
      const budget = parseFloat(state.budget);
      return state.recommendations.filter(rec => rec.game.price <= budget);
    }),

  // Get online status
  useOnlineStatus: () =>
    useGameStore((state) => state.isOnline),
};

/**
 * Store Actions - Async actions that work with the store
 * These can be called from anywhere, not just components
 */
export const gameActions = {
  /**
   * Load recommendations with loading state
   */
  loadRecommendations: async (
    fetchFn: () => Promise<Recommendation[]>
  ): Promise<void> => {
    const { setIsLoading, setRecommendations, updateLastSync } = useGameStore.getState();

    try {
      setIsLoading(true);
      const recommendations = await fetchFn();
      setRecommendations(recommendations);
      updateLastSync();
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },

  /**
   * Sync favorites with backend (when auth is enabled)
   */
  syncFavorites: async (
    userId: string,
    syncFn: (favorites: string[]) => Promise<void>
  ): Promise<void> => {
    const { favoriteGameIds } = useGameStore.getState();
    await syncFn(favoriteGameIds);
  },
};

/**
 * Dev Tools - Subscribe to state changes for debugging
 */
if (__DEV__) {
  useGameStore.subscribe((state) => {
    console.log('[GameStore] State changed:', state);
  });
}
