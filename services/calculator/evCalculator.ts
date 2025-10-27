// EV Calculator - Core algorithm for Scratch Oracle
import { LotteryGame, EVCalculation, UserProfile } from '../../types/lottery';
import { validate, ValidationError } from '../validation/validator';
import { GameSchema, UserProfileSchema } from '../validation/schemas';
import { z } from 'zod';

export class EVCalculator {
  /**
   * Calculate Expected Value with dynamic weighting and confidence scoring
   * Now includes comprehensive validation using Zod schemas
   */
  static calculateEV(
    game: LotteryGame,
    userProfile?: UserProfile
  ): EVCalculation {
    // Validate game data using Zod schema
    // This replaces manual validation with comprehensive schema validation
    try {
      // Create a schema compatible with LotteryGame type
      const GameValidationSchema = z.object({
        id: z.string(),
        name: z.string().min(1).max(200),
        price: z.number().positive().max(100),
        overall_odds: z.string(),
        status: z.enum(['Active', 'Retired', 'New', 'active', 'ended']),
        prizes: z.array(
          z.object({
            tier: z.string(),
            amount: z.number().positive().max(10000000),
            total: z.number().int().nonnegative(),
            remaining: z.number().int().nonnegative(),
            odds: z.string().optional(),
          })
        ).min(1),
        launch_date: z.string(),
        last_updated: z.string(),
        total_tickets: z.number().int().positive().optional(),
        ai_score: z.number().optional(),
        confidence: z.number().optional(),
        recommendation: z.enum(['strong_buy', 'buy', 'neutral', 'avoid', 'strong_avoid']).optional(),
        ai_reasoning: z.string().optional(),
        win_probability: z.number().optional(),
      });

      // Validate game structure
      const validGame = validate(GameValidationSchema, game, 'game');

      // Validate user profile if provided
      if (userProfile) {
        validate(UserProfileSchema, userProfile, 'userProfile');
      }

      // Normalize status to match LotteryGame type (Active, Retired, New)
      if (validGame.status === 'active') validGame.status = 'Active';
      if (validGame.status === 'ended') validGame.status = 'Retired';

      // Continue with validated data
      game = validGame as LotteryGame;
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('[EVCalculator] Validation error:', error.getMessages());
        throw new Error(`Invalid game data: ${error.getFirstMessage()}`);
      }
      throw error;
    }

    const baseEV = this.calculateBaseEV(game);
    const confidence = this.calculateConfidence(game);
    const hotness = this.calculateHotness(game);

    // Dynamic factor weights
    const factors = {
      prizePoolWeight: 0.45, // 45% weight on pure math
      recencyBias: 0.25,     // 25% weight on recent activity
      concentrationScore: 0.20, // 20% weight on prize distribution
      userRiskProfile: 0.10  // 10% weight on user preference
    };

    const adjustedEV = this.applyAdjustments(
      baseEV,
      game,
      factors,
      userProfile
    );

    return {
      gameId: game.id,
      baseEV,
      adjustedEV,
      confidence,
      hotness,
      factors
    };
  }

  private static calculateBaseEV(game: LotteryGame): number {
    if (!game.total_tickets || game.total_tickets === 0) {
      return -game.price; // Conservative estimate
    }

    // Calculate expected value: sum(prize * probability) - ticket_cost
    let expectedWinnings = 0;

    for (const prize of game.prizes) {
      // Validate prize data before calculations
      if (prize.remaining < 0 || prize.remaining > prize.total) {
        console.warn(`Invalid prize data for game ${game.id}`);
        continue;
      }
      if (prize.remaining > 0) {
        const probability = prize.remaining / game.total_tickets;
        expectedWinnings += prize.amount * probability;
      }
    }

    return expectedWinnings - game.price;
  }

  private static calculateConfidence(game: LotteryGame): number {
    let confidence = 1.0;

    // Reduce confidence for missing data
    if (!game.total_tickets) confidence *= 0.6;

    // Reduce confidence for stale data
    const hoursOld = (Date.now() - new Date(game.last_updated).getTime()) / (1000 * 60 * 60);
    if (hoursOld > 24) confidence *= 0.8;
    if (hoursOld > 72) confidence *= 0.6;

    // Reduce confidence for games with few remaining prizes
    const totalRemaining = game.prizes.reduce((sum, p) => sum + p.remaining, 0);
    const totalPrizes = game.prizes.reduce((sum, p) => sum + p.total, 0);

    // Prevent division by zero
    if (totalPrizes === 0) {
      return 0.3; // Minimum confidence for invalid data
    }

    const remainingRatio = totalRemaining / totalPrizes;

    if (remainingRatio < 0.1) confidence *= 0.7; // Very few prizes left
    if (remainingRatio < 0.05) confidence *= 0.5; // Almost no prizes left

    return Math.max(0.3, confidence); // Minimum 30% confidence
  }

  private static calculateHotness(game: LotteryGame): number {
    // MVP: Simple hotness based on prize depletion and game age
    const totalPrizes = game.prizes.reduce((sum, p) => sum + p.total, 0);
    const remainingPrizes = game.prizes.reduce((sum, p) => sum + p.remaining, 0);

    // Prevent division by zero
    if (totalPrizes === 0) {
      return 0;
    }

    const depletionRate = 1 - (remainingPrizes / totalPrizes);

    // Recent games with high depletion are "hot"
    const daysOld = (Date.now() - new Date(game.launch_date).getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0, 1 - (daysOld / 30)); // Fade over 30 days

    // Detect if top prizes are being claimed quickly
    const topPrizes = game.prizes.slice(0, Math.min(2, game.prizes.length));
    if (topPrizes.length === 0) {
      return 0;
    }

    const topPrizeDepletionRate = topPrizes.reduce((sum, p) => {
      // Prevent division by zero for individual prizes
      if (p.total === 0) return sum;
      return sum + (1 - (p.remaining / p.total));
    }, 0) / topPrizes.length;

    const hotness = (depletionRate * 0.4) + (recencyFactor * 0.3) + (topPrizeDepletionRate * 0.3);

    return Math.min(1.0, hotness);
  }

  private static applyAdjustments(
    baseEV: number,
    game: LotteryGame,
    factors: any,
    userProfile?: UserProfile
  ): number {
    let adjustedEV = baseEV;

    // Check for zombie games (no top prizes left)
    const topPrizes = game.prizes.slice(0, 2);
    const hasTopPrizes = topPrizes.some(p => p.remaining > 0);

    if (!hasTopPrizes) {
      return -Infinity; // Remove zombie games from recommendations
    }

    // Apply risk profile adjustments
    if (userProfile) {
      switch (userProfile.riskProfile) {
        case 'low':
          // Conservative players prefer consistent smaller wins
          adjustedEV *= 0.9; // Slight penalty for uncertainty
          break;
        case 'high':
          // Aggressive players chase big prizes
          const hasBigPrizes = game.prizes.some(p => p.amount >= 100000 && p.remaining > 0);
          if (hasBigPrizes) adjustedEV *= 1.1;
          break;
        default:
          // Balanced players - no adjustment
          break;
      }

      // Budget considerations
      if (game.price > userProfile.budget.daily * 0.5) {
        adjustedEV *= 0.8; // Penalty for expensive tickets vs budget
      }
    }

    // Prize concentration bonus (entropy-based)
    const concentration = this.calculatePrizeConcentration(game);
    adjustedEV += concentration * 0.5; // Small bonus for good distribution

    return adjustedEV;
  }

  private static calculatePrizeConcentration(game: LotteryGame): number {
    // Calculate entropy of prize distribution
    const totalValue = game.prizes.reduce((sum, p) => sum + (p.amount * p.remaining), 0);

    if (totalValue === 0) return 0;

    let entropy = 0;
    for (const prize of game.prizes) {
      if (prize.remaining > 0) {
        const probability = (prize.amount * prize.remaining) / totalValue;
        if (probability > 0) {
          entropy -= probability * Math.log2(probability);
        }
      }
    }

    // Normalize entropy (higher = more distributed prizes)
    const maxEntropy = Math.log2(game.prizes.length);

    // Prevent division by zero if maxEntropy is 0 or negative
    if (maxEntropy <= 0) {
      return 0;
    }

    return entropy / maxEntropy;
  }

  /**
   * Quick utility to check if a game is a "zombie" (no valuable prizes left)
   */
  static isZombieGame(game: LotteryGame): boolean {
    const topPrizes = game.prizes.slice(0, 2);
    return !topPrizes.some(p => p.remaining > 0);
  }

  /**
   * Get human-readable explanation of EV calculation
   */
  static explainEV(calculation: EVCalculation): string[] {
    const explanations: string[] = [];

    if (calculation.adjustedEV > 0) {
      explanations.push(`Positive expected value: +$${calculation.adjustedEV.toFixed(2)}`);
    } else if (calculation.adjustedEV === -Infinity) {
      explanations.push('Zombie game: No top prizes remaining');
    } else {
      explanations.push(`Negative expected value: $${calculation.adjustedEV.toFixed(2)}`);
    }

    if (calculation.confidence < 0.7) {
      explanations.push('Low confidence due to limited data');
    }

    if (calculation.hotness > 0.7) {
      explanations.push('Hot game: Prizes being claimed quickly');
    }

    return explanations;
  }
}