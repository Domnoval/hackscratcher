// Recommendation Engine - Smart lottery recommendations for Scratch Oracle
import { LotteryGame, UserProfile, Recommendation } from '../../types/lottery';
import { MinnesotaLotteryService } from '../lottery/minnesotaData';
import { EVCalculator } from '../calculator/evCalculator';

export class RecommendationEngine {
  /**
   * Get top recommendations based on user budget and preferences
   */
  static async getRecommendations(
    budget: number,
    userProfile?: UserProfile,
    limit: number = 3
  ): Promise<Recommendation[]> {
    // Get all active games
    const games = await MinnesotaLotteryService.getActiveGames();

    // Filter games within budget
    const affordableGames = games.filter(game => game.price <= budget);

    if (affordableGames.length === 0) {
      return [];
    }

    // Calculate EV for each game
    const gameAnalyses = affordableGames.map(game => {
      const ev = EVCalculator.calculateEV(game, userProfile);
      return {
        game,
        ev,
        score: this.calculateRecommendationScore(ev, userProfile)
      };
    });

    // Remove zombie games
    const validGames = gameAnalyses.filter(analysis =>
      analysis.ev.adjustedEV !== -Infinity
    );

    // Sort by recommendation score
    validGames.sort((a, b) => b.score - a.score);

    // Take top recommendations
    const topRecommendations = validGames.slice(0, limit);

    // Convert to recommendation format
    return topRecommendations.map(analysis => ({
      gameId: analysis.game.id,
      game: analysis.game,
      score: analysis.score,
      ev: analysis.ev,
      reasons: this.generateReasons(analysis.ev, analysis.game, userProfile),
      timestamp: new Date().toISOString()
    }));
  }

  private static calculateRecommendationScore(
    ev: any,
    userProfile?: UserProfile
  ): number {
    if (ev.adjustedEV === -Infinity) return 0;

    let score = 50; // Base score

    // EV contribution (40% of score)
    const evContribution = Math.max(-20, Math.min(40, ev.adjustedEV * 4));
    score += evContribution;

    // Confidence contribution (30% of score)
    score += ev.confidence * 30;

    // Hotness contribution (20% of score)
    score += ev.hotness * 20;

    // User preference adjustments (10% of score)
    if (userProfile) {
      // Risk profile preferences already baked into adjustedEV
      score += this.getUserPreferenceBonus(ev, userProfile) * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private static getUserPreferenceBonus(ev: any, userProfile: UserProfile): number {
    // Additional user-specific bonuses
    let bonus = 0;

    // Lucky mode considerations (future feature)
    if (userProfile.preferences.luckyModeEnabled) {
      // Would add numerology/cosmic factors here
      bonus += 0.1;
    }

    return bonus;
  }

  private static generateReasons(
    ev: any,
    game: LotteryGame,
    userProfile?: UserProfile
  ): string[] {
    const reasons: string[] = [];

    // EV-based reasons
    if (ev.adjustedEV > 2) {
      reasons.push(`Excellent value: +$${ev.adjustedEV.toFixed(2)} expected return`);
    } else if (ev.adjustedEV > 0) {
      reasons.push(`Positive expected value: +$${ev.adjustedEV.toFixed(2)}`);
    } else if (ev.adjustedEV > -2) {
      reasons.push('Break-even odds with upside potential');
    }

    // Confidence-based reasons
    if (ev.confidence > 0.9) {
      reasons.push('High confidence in data accuracy');
    } else if (ev.confidence < 0.6) {
      reasons.push('Limited data - proceed with caution');
    }

    // Hotness-based reasons
    if (ev.hotness > 0.8) {
      reasons.push('🔥 Hot game: Prizes being claimed rapidly');
    } else if (ev.hotness > 0.6) {
      reasons.push('Active game with recent winners');
    }

    // Game-specific reasons
    const topPrizes = game.prizes.filter(p => p.amount >= 50000 && p.remaining > 0);
    if (topPrizes.length > 0) {
      const maxPrize = Math.max(...topPrizes.map(p => p.amount));
      reasons.push(`Top prize available: $${maxPrize.toLocaleString()}`);
    }

    // Prize availability
    const totalRemaining = game.prizes.reduce((sum, p) => sum + p.remaining, 0);
    const totalPrizes = game.prizes.reduce((sum, p) => sum + p.total, 0);
    const availabilityRatio = totalRemaining / totalPrizes;

    if (availabilityRatio > 0.8) {
      reasons.push('Fresh game with most prizes remaining');
    } else if (availabilityRatio < 0.2) {
      reasons.push('⚠️ Limited prizes remaining');
    }

    // Budget considerations
    if (userProfile) {
      const budgetRatio = game.price / userProfile.budget.daily;
      if (budgetRatio < 0.2) {
        reasons.push('Budget-friendly choice');
      } else if (budgetRatio > 0.5) {
        reasons.push('Premium option - higher risk/reward');
      }
    }

    // Odds-based reasons
    const overallOdds = parseFloat(game.overall_odds.replace('1 in ', ''));
    if (overallOdds < 3) {
      reasons.push(`Great odds: ${game.overall_odds}`);
    } else if (overallOdds > 4) {
      reasons.push(`Lower odds but bigger potential prizes`);
    }

    return reasons.slice(0, 4); // Limit to 4 most relevant reasons
  }

  /**
   * Get quick recommendations for a specific budget
   */
  static async getQuickRecommendation(budget: number): Promise<Recommendation | null> {
    const recommendations = await this.getRecommendations(budget, undefined, 1);
    return recommendations.length > 0 ? recommendations[0] : null;
  }

  /**
   * Check if user should be warned about spending
   */
  static shouldWarnSpending(
    currentSpend: number,
    userProfile: UserProfile
  ): { warn: boolean; message?: string } {
    if (currentSpend >= userProfile.budget.daily) {
      return {
        warn: true,
        message: 'You\'ve reached your daily spending limit. Play responsibly!'
      };
    }

    if (currentSpend >= userProfile.budget.daily * 0.8) {
      return {
        warn: true,
        message: 'You\'re approaching your daily spending limit.'
      };
    }

    return { warn: false };
  }

  /**
   * Get analytics for recommendation performance
   */
  static getRecommendationStats(recommendations: Recommendation[]): {
    avgEV: number;
    avgConfidence: number;
    avgHotness: number;
    totalGames: number;
  } {
    if (recommendations.length === 0) {
      return { avgEV: 0, avgConfidence: 0, avgHotness: 0, totalGames: 0 };
    }

    const avgEV = recommendations.reduce((sum, r) => sum + r.ev.adjustedEV, 0) / recommendations.length;
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.ev.confidence, 0) / recommendations.length;
    const avgHotness = recommendations.reduce((sum, r) => sum + r.ev.hotness, 0) / recommendations.length;

    return {
      avgEV,
      avgConfidence,
      avgHotness,
      totalGames: recommendations.length
    };
  }
}