// Supabase-backed lottery data service - Production implementation
import { getActiveGamesWithPredictions, getGameDetails } from '../../lib/supabase';
import type { Game, Prediction, PrizeTier } from '../../lib/supabase';
import { LotteryGame, Prize } from '../../types/lottery';

/**
 * Supabase Lottery Service
 * Fetches real lottery data from Supabase database with AI predictions
 * Replaces mock data service for production use
 */
export class SupabaseLotteryService {
  /**
   * Convert Supabase Game to app's LotteryGame format
   * Maps database fields to application types
   */
  private static convertGame(
    dbGame: Game,
    prizeTiers: PrizeTier[],
    prediction?: Prediction | null
  ): LotteryGame {
    return {
      id: dbGame.id,
      name: dbGame.name,
      price: Number(dbGame.price),
      overall_odds: dbGame.overall_odds || '1 in 4.0',
      status: dbGame.status === 'PUBLISHED' ? 'Active' : 'Retired',
      prizes: prizeTiers.map((tier): Prize => ({
        tier: this.getPrizeTierName(tier.prize_amount),
        amount: Number(tier.prize_amount),
        total: tier.total_prizes,
        remaining: tier.remaining_prizes,
        odds: tier.odds,
      })),
      launch_date: dbGame.launch_date || dbGame.created_at,
      last_updated: dbGame.updated_at,
      total_tickets: undefined,

      // AI prediction fields (only if prediction exists)
      ai_score: prediction?.ai_score,
      confidence: prediction?.confidence_level,
      recommendation: prediction?.recommendation,
      ai_reasoning: prediction?.reasoning,
      win_probability: prediction?.win_probability,
    };
  }

  /**
   * Get all active games with AI predictions
   * Uses the active_games_with_predictions view for performance
   */
  static async getActiveGames(): Promise<LotteryGame[]> {
    try {
      console.log('[SupabaseLotteryService] Fetching active games from Supabase...');

      // Uses database view that joins games + predictions
      const data = await getActiveGamesWithPredictions();

      if (!data || data.length === 0) {
        console.warn('[SupabaseLotteryService] No active games found in Supabase');
        return [];
      }

      console.log(`[SupabaseLotteryService] Found ${data.length} active games`);

      // Convert database rows to app format
      const games = data.map(row => {
        const price = Number(row.price);
        console.log(`[SupabaseLotteryService] Game: ${row.name} - Price from DB: ${row.price} -> Converted: $${price}`);

        return {
          id: row.id,
          name: row.name,
          price: price,
          overall_odds: row.overall_odds || '1 in 4.0',
          status: 'Active' as const,
          prizes: this.extractPrizeTiers(row),
          launch_date: row.launch_date || row.created_at,
          last_updated: row.updated_at,
          total_tickets: undefined,

          // AI predictions are completely separate - always undefined here
          // To add predictions, query the predictions table separately
          ai_score: undefined,
          confidence: undefined,
          recommendation: undefined,
          ai_reasoning: undefined,
          win_probability: undefined,
        };
      });

      console.log(`[SupabaseLotteryService] Sample prices: ${games.slice(0, 5).map(g => `${g.name}: $${g.price}`).join(', ')}`);
      return games;
    } catch (error) {
      console.error('[SupabaseLotteryService] Error fetching games from Supabase:', error);
      throw new Error('Failed to load lottery games. Please check your connection.');
    }
  }

  /**
   * Get game by ID with full details
   */
  static async getGameById(id: string): Promise<LotteryGame | null> {
    try {
      console.log(`[SupabaseLotteryService] Fetching game details for ${id}`);

      const { game, prizeTiers, prediction } = await getGameDetails(id);

      if (!game) {
        console.warn(`[SupabaseLotteryService] Game ${id} not found`);
        return null;
      }

      return this.convertGame(game, prizeTiers, prediction);
    } catch (error) {
      console.error('[SupabaseLotteryService] Error fetching game details:', error);
      return null;
    }
  }

  /**
   * Get top recommended games sorted by AI score
   * Returns games with highest AI scores first
   */
  static async getTopRecommendations(limit: number = 3): Promise<LotteryGame[]> {
    try {
      const games = await this.getActiveGames();

      // Filter games with AI scores and sort by score descending
      const gamesWithScores = games
        .filter(game => game.ai_score !== undefined && game.ai_score !== null)
        .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

      return gamesWithScores.slice(0, limit);
    } catch (error) {
      console.error('[SupabaseLotteryService] Error fetching top recommendations:', error);
      return [];
    }
  }

  /**
   * Refresh game data (no-op for Supabase, data is always fresh)
   * This method exists for API compatibility with mock service
   */
  static async refreshGameData(): Promise<void> {
    console.log('[SupabaseLotteryService] Supabase data is always fresh - no manual refresh needed');
    // In Supabase implementation, data is always fresh from database
    // React Query handles caching and refetching automatically
  }

  /**
   * Helper: Extract prize tiers from view row
   * The view may aggregate prize_tiers into a JSON array or we fetch separately
   */
  private static extractPrizeTiers(row: any): Prize[] {
    // If view includes aggregated prize_tiers as JSON array
    if (row.prize_tiers && Array.isArray(row.prize_tiers)) {
      return row.prize_tiers.map((tier: any) => ({
        tier: this.getPrizeTierName(tier.prize_amount),
        amount: Number(tier.prize_amount),
        total: tier.total_prizes,
        remaining: tier.remaining_prizes,
        odds: tier.odds,
      }));
    }

    // Fallback: single top prize from main game record
    if (row.top_prize) {
      return [{
        tier: 'Top Prize',
        amount: Number(row.top_prize),
        total: 1,
        remaining: 1,
      }];
    }

    return [];
  }

  /**
   * Helper: Get prize tier name based on amount
   * Categorizes prizes into tiers
   */
  private static getPrizeTierName(amount: number): string {
    if (amount >= 1000000) return 'Jackpot';
    if (amount >= 100000) return 'Second';
    if (amount >= 10000) return 'Third';
    if (amount >= 1000) return 'Fourth';
    return 'Fifth';
  }

  /**
   * Validate game data structure
   * Same validation as mock implementation
   */
  static validateGameData(game: LotteryGame): boolean {
    if (!game.id || !game.name || game.price <= 0) {
      console.warn('[SupabaseLotteryService] Invalid game data:', game);
      return false;
    }

    // Check prize structure
    for (const prize of game.prizes) {
      if (prize.remaining < 0 || prize.remaining > prize.total) {
        console.warn('[SupabaseLotteryService] Invalid prize data:', prize);
        return false;
      }
    }

    return true;
  }

  /**
   * Get data freshness message
   */
  static getDataFreshness(): string {
    // For Supabase, data is always real-time from database
    return 'Live data from Minnesota Lottery via Supabase';
  }

  /**
   * Get statistics about available games
   * Useful for debugging and monitoring
   */
  static async getStats(): Promise<{
    totalGames: number;
    gamesWithAI: number;
    averageAIScore: number;
    topRecommendation: string | null;
  }> {
    try {
      const games = await this.getActiveGames();

      const gamesWithAI = games.filter(g => g.ai_score !== undefined);
      const totalAIScore = gamesWithAI.reduce((sum, g) => sum + (g.ai_score || 0), 0);
      const averageAIScore = gamesWithAI.length > 0 ? totalAIScore / gamesWithAI.length : 0;

      const topGame = gamesWithAI.length > 0
        ? gamesWithAI.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))[0]
        : null;

      return {
        totalGames: games.length,
        gamesWithAI: gamesWithAI.length,
        averageAIScore: Math.round(averageAIScore),
        topRecommendation: topGame?.name || null,
      };
    } catch (error) {
      console.error('[SupabaseLotteryService] Error getting stats:', error);
      return {
        totalGames: 0,
        gamesWithAI: 0,
        averageAIScore: 0,
        topRecommendation: null,
      };
    }
  }
}
