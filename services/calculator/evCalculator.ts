// EV Calculator - Core algorithm for Scratch Oracle
import { LotteryGame, EVCalculation, UserProfile } from '../../types/lottery';
import { validate, ValidationError } from '../validation/validator';
import { GameSchema, UserProfileSchema } from '../validation/schemas';
import { z } from 'zod';
import {
  HypergeometricCalculator,
  KellyCalculator,
  MonteCarloSimulator,
  RiskMetrics,
  VarianceAnalyzer,
  BayesianUpdater
} from './advancedStats';

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
        ai_score: z.number().nullable().optional(),
        confidence: z.number().nullable().optional(),
        recommendation: z.enum(['strong_buy', 'buy', 'neutral', 'avoid', 'strong_avoid']).nullable().optional(),
        ai_reasoning: z.string().nullable().optional(),
        win_probability: z.number().nullable().optional(),
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

    // Calculate expected value using HYPERGEOMETRIC DISTRIBUTION
    // More accurate than simple probability - accounts for sampling without replacement
    let expectedWinnings = 0;

    for (const prize of game.prizes) {
      // Validate prize data before calculations
      if (prize.remaining < 0 || prize.remaining > prize.total) {
        console.warn(`Invalid prize data for game ${game.id}`);
        continue;
      }
      if (prize.remaining > 0) {
        // Use hypergeometric probability instead of naive probability
        const probability = HypergeometricCalculator.winProbability(
          game.total_tickets,
          prize.remaining
        );
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

  // ========================================================================
  // ADVANCED STATISTICAL METHODS
  // ========================================================================

  /**
   * Calculate comprehensive risk metrics for a game
   * Includes variance, standard deviation, Sharpe ratio, VaR
   */
  static calculateRiskMetrics(game: LotteryGame): {
    variance: number;
    stdDeviation: number;
    semiVariance: number;
    sharpeRatio: number;
    coefficientOfVariation: number;
    winRate: number;
    valueAtRisk95: number;
  } {
    const baseEV = this.calculateBaseEV(game);
    const variance = VarianceAnalyzer.calculateVariance(game);
    const stdDev = Math.sqrt(variance);
    const semiVariance = VarianceAnalyzer.calculateSemiVariance(game, 0);
    const sharpe = RiskMetrics.sharpeRatio(baseEV, stdDev);
    const cv = RiskMetrics.coefficientOfVariation(baseEV, stdDev);
    const winRate = RiskMetrics.winRate(game);

    // VaR is typically the price you could lose (since lottery has limited downside)
    const valueAtRisk95 = game.price;

    return {
      variance,
      stdDeviation: stdDev,
      semiVariance,
      sharpeRatio: sharpe,
      coefficientOfVariation: cv,
      winRate,
      valueAtRisk95,
    };
  }

  /**
   * Run Monte Carlo simulation to estimate return distribution
   * WARNING: Computationally intensive - use sparingly
   */
  static runMonteCarloAnalysis(
    game: LotteryGame,
    numSimulations: number = 10000
  ): {
    meanReturn: number;
    medianReturn: number;
    stdDeviation: number;
    confidenceInterval95: [number, number];
    probabilityOfProfit: number;
    valueAtRisk95: number;
  } {
    return MonteCarloSimulator.simulate(game, numSimulations, 1);
  }

  /**
   * Calculate Kelly Criterion optimal bet size
   * Returns recommended ticket quantity based on bankroll
   */
  static calculateKellyCriterion(
    game: LotteryGame,
    userBankroll: number
  ): {
    optimalBetSize: number;
    kellyFraction: number;
    recommendation: string;
    maxTickets: number;
  } {
    const kelly = KellyCalculator.calculateForLottery(game, userBankroll);

    const maxTickets = Math.floor(kelly.kellyBetSize / game.price);

    return {
      optimalBetSize: kelly.kellyBetSize,
      kellyFraction: kelly.kellyFraction,
      recommendation: kelly.recommendation,
      maxTickets: Math.max(0, maxTickets),
    };
  }

  /**
   * Calculate exact win probability using hypergeometric distribution
   * More accurate than simple probability for finite prize pools
   */
  static calculateExactWinProbability(game: LotteryGame): number {
    return RiskMetrics.winRate(game);
  }

  /**
   * Calculate probability of winning a specific prize tier
   */
  static calculatePrizeTierProbability(
    game: LotteryGame,
    tierIndex: number
  ): number {
    if (tierIndex < 0 || tierIndex >= game.prizes.length) return 0;
    if (!game.total_tickets || game.total_tickets === 0) return 0;

    const prize = game.prizes[tierIndex];
    if (prize.remaining === 0) return 0;

    return HypergeometricCalculator.winProbability(
      game.total_tickets,
      prize.remaining
    );
  }

  /**
   * Get comprehensive analysis with all advanced metrics
   * This is the "kitchen sink" method that returns everything
   */
  static getAdvancedAnalysis(
    game: LotteryGame,
    userProfile?: UserProfile
  ): {
    basicEV: EVCalculation;
    riskMetrics: ReturnType<typeof EVCalculator.calculateRiskMetrics>;
    kellyCriterion?: ReturnType<typeof EVCalculator.calculateKellyCriterion>;
    prizeTierProbabilities: number[];
    recommendation: string;
    riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  } {
    const basicEV = this.calculateEV(game, userProfile);
    const riskMetrics = this.calculateRiskMetrics(game);

    const kellyCriterion = userProfile?.budget.daily
      ? this.calculateKellyCriterion(game, userProfile.budget.daily * 7) // Weekly bankroll
      : undefined;

    const prizeTierProbs = game.prizes.map((_, idx) =>
      this.calculatePrizeTierProbability(game, idx)
    );

    // Determine risk level based on coefficient of variation
    let riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' = 'medium';
    const cv = riskMetrics.coefficientOfVariation;

    if (cv < 0.5) riskLevel = 'very_low';
    else if (cv < 1.0) riskLevel = 'low';
    else if (cv < 2.0) riskLevel = 'medium';
    else if (cv < 5.0) riskLevel = 'high';
    else riskLevel = 'very_high';

    // Build recommendation
    let recommendation = '';
    if (basicEV.adjustedEV > 0 && riskMetrics.sharpeRatio > 0.5) {
      recommendation = 'Strong Buy - Positive EV with acceptable risk';
    } else if (basicEV.adjustedEV > 0) {
      recommendation = 'Buy - Positive EV but higher volatility';
    } else if (basicEV.adjustedEV > -0.5) {
      recommendation = 'Neutral - Minimal expected loss';
    } else {
      recommendation = 'Avoid - Negative expected value';
    }

    return {
      basicEV,
      riskMetrics,
      kellyCriterion,
      prizeTierProbabilities: prizeTierProbs,
      recommendation,
      riskLevel,
    };
  }
}