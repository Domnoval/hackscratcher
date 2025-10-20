// React Query hooks for game data fetching
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SupabaseLotteryService } from '../services/lottery/supabaseLotteryService';
import { MinnesotaLotteryService } from '../services/lottery/minnesotaData';
import { FeatureFlagService } from '../services/config/featureFlags';
import type { LotteryGame } from '../types/lottery';

/**
 * Get the appropriate data service based on feature flag
 * Returns Supabase or Mock service
 */
function getDataService() {
  const useSupabase = FeatureFlagService.useSupabase();
  return useSupabase ? SupabaseLotteryService : MinnesotaLotteryService;
}

/**
 * Hook: Fetch all active games
 * Automatically uses correct data source (Supabase or Mock)
 * Cached for 5 minutes, refetches every hour
 *
 * @example
 * const { data: games, isLoading, error, refetch } = useActiveGames();
 */
export function useActiveGames() {
  return useQuery<LotteryGame[], Error>({
    queryKey: ['games', 'active'],
    queryFn: async () => {
      const service = getDataService();
      const games = await service.getActiveGames();

      // Log which data source is being used
      const source = FeatureFlagService.useSupabase() ? 'Supabase (REAL)' : 'Mock';
      console.log(`[useActiveGames] Fetched ${games.length} games from ${source}`);

      return games;
    },
    // Refetch every 1 hour (games don't change frequently)
    refetchInterval: 60 * 60 * 1000,
    // Consider data stale after 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Fetch single game details
 * Only runs if gameId is provided
 *
 * @param gameId - The game ID to fetch (optional)
 * @example
 * const { data: game, isLoading } = useGameDetails('MN-2025-001');
 */
export function useGameDetails(gameId: string | undefined) {
  return useQuery<LotteryGame | null, Error>({
    queryKey: ['games', gameId],
    queryFn: async () => {
      if (!gameId) return null;

      const service = getDataService();
      const game = await service.getGameById(gameId);

      const source = FeatureFlagService.useSupabase() ? 'Supabase (REAL)' : 'Mock';
      console.log(`[useGameDetails] Fetched game ${gameId} from ${source}`);

      return game;
    },
    // Only run if gameId is provided
    enabled: !!gameId,
    // Keep individual game data fresh for 30 minutes
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook: Fetch top recommended games
 * Returns games sorted by AI score (if available)
 *
 * @param limit - Number of top games to return (default: 3)
 * @example
 * const { data: topGames } = useTopGames(5);
 */
export function useTopGames(limit: number = 3) {
  return useQuery<LotteryGame[], Error>({
    queryKey: ['games', 'top', limit],
    queryFn: async () => {
      const service = getDataService();

      // If using Supabase, use getTopRecommendations
      if (FeatureFlagService.useSupabase() && 'getTopRecommendations' in service) {
        const games = await (service as typeof SupabaseLotteryService).getTopRecommendations(limit);
        console.log(`[useTopGames] Fetched ${games.length} top games from Supabase`);
        return games;
      }

      // Fallback: Get all games and sort by price (simple heuristic for mock)
      const games = await service.getActiveGames();
      return games.slice(0, limit);
    },
    // Refetch every hour
    refetchInterval: 60 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Prefetch game details for better UX
 * Call this when user hovers/touches a game card to preload data
 *
 * @example
 * const prefetchGame = usePrefetchGame();
 * <TouchableOpacity onPressIn={() => prefetchGame('MN-2025-001')}>
 */
export function usePrefetchGame() {
  const queryClient = useQueryClient();

  return (gameId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['games', gameId],
      queryFn: async () => {
        const service = getDataService();
        return service.getGameById(gameId);
      },
      // Cache for 30 minutes
      staleTime: 30 * 60 * 1000,
    });
  };
}

/**
 * Hook: Get game statistics
 * Only works with Supabase service
 *
 * @example
 * const { data: stats } = useGameStats();
 */
export function useGameStats() {
  return useQuery({
    queryKey: ['games', 'stats'],
    queryFn: async () => {
      if (!FeatureFlagService.useSupabase()) {
        return null; // Stats only available with Supabase
      }

      return SupabaseLotteryService.getStats();
    },
    // Only run if using Supabase
    enabled: FeatureFlagService.useSupabase(),
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook: Check data freshness
 * Returns a human-readable message about data source
 *
 * @example
 * const dataSource = useDataSource();
 * <Text>{dataSource}</Text> // "Using MOCK data" or "Using REAL Supabase data"
 */
export function useDataSource() {
  return FeatureFlagService.getStatusMessage();
}
