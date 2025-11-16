/**
 * Advanced Statistical Methods for Lottery Analysis
 * Implements professional-grade probability theory and risk analysis
 */

import { LotteryGame, Prize } from '../../types/lottery';

/**
 * Hypergeometric Distribution
 * Calculates exact probability of winning when sampling without replacement
 * More accurate than simple probability for finite prize pools
 */
export class HypergeometricCalculator {
  /**
   * Calculate probability of getting exactly k successes in n draws
   * from population N with K successes total
   */
  static probability(
    N: number, // Total tickets
    K: number, // Total winning tickets for this prize
    n: number, // Number of draws (1 for single ticket)
    k: number  // Desired successes (1 for a win)
  ): number {
    if (K === 0 || N === 0 || n === 0) return 0;
    if (k > K || k > n) return 0;

    // P(X = k) = C(K,k) * C(N-K, n-k) / C(N,n)
    const numerator = this.combination(K, k) * this.combination(N - K, n - k);
    const denominator = this.combination(N, n);

    return numerator / denominator;
  }

  /**
   * Calculate exact win probability for a prize tier
   */
  static winProbability(totalTickets: number, remainingPrizes: number): number {
    if (totalTickets === 0 || remainingPrizes === 0) return 0;
    return this.probability(totalTickets, remainingPrizes, 1, 1);
  }

  /**
   * Binomial coefficient: C(n, k) = n! / (k! * (n-k)!)
   * Uses logarithms to prevent overflow for large numbers
   */
  private static combination(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    // Use symmetry: C(n,k) = C(n, n-k)
    k = Math.min(k, n - k);

    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= (n - i) / (i + 1);
    }

    return Math.round(result);
  }
}

/**
 * Kelly Criterion
 * Determines optimal bet size to maximize long-term growth
 */
export class KellyCalculator {
  /**
   * Calculate optimal fraction of bankroll to wager
   * f* = (bp - q) / b
   * where:
   *   b = odds received on the bet (net odds)
   *   p = probability of winning
   *   q = probability of losing (1-p)
   */
  static optimalBetSize(
    winProbability: number,
    netOdds: number, // How much you win per dollar wagered
    bankroll: number
  ): number {
    const p = winProbability;
    const q = 1 - p;
    const b = netOdds;

    const kellyFraction = (b * p - q) / b;

    // Apply fractional Kelly for safety (use 25% of full Kelly)
    const fractionalKelly = kellyFraction * 0.25;

    // Never bet more than 10% of bankroll
    const maxFraction = 0.10;

    const optimalFraction = Math.max(0, Math.min(fractionalKelly, maxFraction));

    return optimalFraction * bankroll;
  }

  /**
   * Calculate Kelly fraction for lottery ticket purchase
   */
  static calculateForLottery(
    game: LotteryGame,
    userBankroll: number
  ): { kellyBetSize: number; kellyFraction: number; recommendation: string } {
    // Calculate overall win probability and average payout
    let totalWinProb = 0;
    let weightedPayout = 0;

    if (!game.total_tickets || game.total_tickets === 0) {
      return {
        kellyBetSize: 0,
        kellyFraction: 0,
        recommendation: 'Insufficient data for Kelly calculation'
      };
    }

    for (const prize of game.prizes) {
      if (prize.remaining > 0) {
        const prob = HypergeometricCalculator.winProbability(
          game.total_tickets,
          prize.remaining
        );
        totalWinProb += prob;
        weightedPayout += prob * prize.amount;
      }
    }

    // Net odds: how much you win per dollar (minus the dollar you spent)
    const averagePayout = totalWinProb > 0 ? weightedPayout / totalWinProb : 0;
    const netOdds = (averagePayout - game.price) / game.price;

    const kellyFraction = totalWinProb > 0
      ? ((netOdds * totalWinProb) - (1 - totalWinProb)) / netOdds
      : 0;

    // Apply fractional Kelly (25% of full Kelly for safety)
    const safeFraction = Math.max(0, kellyFraction * 0.25);
    const kellyBetSize = Math.min(safeFraction * userBankroll, userBankroll * 0.10);

    let recommendation = '';
    if (kellyFraction <= 0) {
      recommendation = 'Do not play - negative expected value';
    } else if (kellyFraction < 0.01) {
      recommendation = 'Minimal bet advised - low edge';
    } else if (kellyFraction < 0.05) {
      recommendation = 'Small bet acceptable';
    } else {
      recommendation = 'Favorable odds detected';
    }

    return { kellyBetSize, kellyFraction: safeFraction, recommendation };
  }
}

/**
 * Monte Carlo Simulation
 * Runs thousands of simulated plays to estimate confidence intervals
 */
export class MonteCarloSimulator {
  /**
   * Simulate N ticket purchases and calculate statistics
   */
  static simulate(
    game: LotteryGame,
    numSimulations: number = 10000,
    ticketsPerSim: number = 1
  ): {
    meanReturn: number;
    medianReturn: number;
    stdDeviation: number;
    confidenceInterval95: [number, number];
    probabilityOfProfit: number;
    valueAtRisk95: number;
  } {
    if (!game.total_tickets || game.total_tickets === 0) {
      return {
        meanReturn: -game.price,
        medianReturn: -game.price,
        stdDeviation: 0,
        confidenceInterval95: [-game.price, -game.price],
        probabilityOfProfit: 0,
        valueAtRisk95: game.price,
      };
    }

    const results: number[] = [];

    for (let sim = 0; sim < numSimulations; sim++) {
      let totalReturn = 0;

      for (let ticket = 0; ticket < ticketsPerSim; ticket++) {
        totalReturn += this.simulateSingleTicket(game);
      }

      results.push(totalReturn - (game.price * ticketsPerSim));
    }

    // Sort for percentile calculations
    results.sort((a, b) => a - b);

    const mean = results.reduce((sum, r) => sum + r, 0) / numSimulations;
    const median = results[Math.floor(numSimulations / 2)];

    // Standard deviation
    const variance = results.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / numSimulations;
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (2.5th to 97.5th percentile)
    const lowerBound = results[Math.floor(numSimulations * 0.025)];
    const upperBound = results[Math.floor(numSimulations * 0.975)];

    // Probability of profit
    const profitableRuns = results.filter(r => r > 0).length;
    const probProfit = profitableRuns / numSimulations;

    // Value at Risk (95% confidence) - max loss expected 95% of the time
    const var95 = Math.abs(results[Math.floor(numSimulations * 0.05)]);

    return {
      meanReturn: mean,
      medianReturn: median,
      stdDeviation: stdDev,
      confidenceInterval95: [lowerBound, upperBound],
      probabilityOfProfit: probProfit,
      valueAtRisk95: var95,
    };
  }

  /**
   * Simulate a single ticket purchase
   */
  private static simulateSingleTicket(game: LotteryGame): number {
    // Build cumulative probability distribution
    const cumulativeProbs: { prize: number; cumProb: number }[] = [];
    let cumProb = 0;

    for (const prize of game.prizes) {
      if (prize.remaining > 0) {
        const prob = HypergeometricCalculator.winProbability(
          game.total_tickets!,
          prize.remaining
        );
        cumProb += prob;
        cumulativeProbs.push({ prize: prize.amount, cumProb });
      }
    }

    // Random draw
    const rand = Math.random();

    // Check if ticket wins
    for (const entry of cumulativeProbs) {
      if (rand < entry.cumProb) {
        return entry.prize; // Won this prize
      }
    }

    return 0; // Losing ticket
  }
}

/**
 * Risk Metrics Calculator
 * Professional risk analysis metrics
 */
export class RiskMetrics {
  /**
   * Calculate Sharpe Ratio - risk-adjusted return
   * Higher is better (> 1.0 is good, > 2.0 is excellent)
   */
  static sharpeRatio(
    expectedReturn: number,
    stdDeviation: number,
    riskFreeRate: number = 0
  ): number {
    if (stdDeviation === 0) return 0;
    return (expectedReturn - riskFreeRate) / stdDeviation;
  }

  /**
   * Calculate Coefficient of Variation - risk per unit of return
   * Lower is better
   */
  static coefficientOfVariation(mean: number, stdDev: number): number {
    if (mean === 0) return Infinity;
    return Math.abs(stdDev / mean);
  }

  /**
   * Calculate maximum drawdown - worst case scenario
   */
  static maxDrawdown(game: LotteryGame): number {
    // In lottery context, max drawdown is simply losing your ticket price
    return game.price;
  }

  /**
   * Calculate win rate (any prize)
   */
  static winRate(game: LotteryGame): number {
    if (!game.total_tickets || game.total_tickets === 0) return 0;

    let totalWinProb = 0;
    for (const prize of game.prizes) {
      if (prize.remaining > 0) {
        totalWinProb += HypergeometricCalculator.winProbability(
          game.total_tickets,
          prize.remaining
        );
      }
    }

    return totalWinProb;
  }
}

/**
 * Bayesian Inference for Dynamic Probability Updates
 * Updates win probabilities based on observed data
 */
export class BayesianUpdater {
  /**
   * Update probability estimate given new evidence
   * Using Bayes' Theorem: P(A|B) = P(B|A) * P(A) / P(B)
   */
  static updateProbability(
    priorProbability: number,
    likelihoodOfEvidence: number,
    evidenceProbability: number
  ): number {
    if (evidenceProbability === 0) return priorProbability;

    return (likelihoodOfEvidence * priorProbability) / evidenceProbability;
  }

  /**
   * Update game win probability based on recent claims
   * If prizes are being claimed faster/slower than expected, adjust probabilities
   */
  static updateGameProbability(
    game: LotteryGame,
    observedClaimRate: number, // Claims per day observed
    expectedClaimRate: number   // Claims per day expected
  ): number {
    // Start with hypergeometric probability
    const baseProbability = RiskMetrics.winRate(game);

    // If claims are happening faster than expected, reduce win probability
    // If slower, increase it (game is "colder" than average)
    const claimRateRatio = observedClaimRate / expectedClaimRate;

    // Bayesian adjustment factor
    const adjustmentFactor = 1 / claimRateRatio;

    // Update probability (bounded between 0 and 1)
    const updatedProb = Math.min(1, Math.max(0, baseProbability * adjustmentFactor));

    return updatedProb;
  }
}

/**
 * Variance and Volatility Analysis
 */
export class VarianceAnalyzer {
  /**
   * Calculate variance of returns
   */
  static calculateVariance(game: LotteryGame): number {
    if (!game.total_tickets || game.total_tickets === 0) {
      return Math.pow(game.price, 2);
    }

    // E[X^2] - (E[X])^2
    let expectedValue = 0;
    let expectedSquare = 0;

    for (const prize of game.prizes) {
      if (prize.remaining > 0) {
        const prob = HypergeometricCalculator.winProbability(
          game.total_tickets,
          prize.remaining
        );

        const netReturn = prize.amount - game.price;
        expectedValue += prob * netReturn;
        expectedSquare += prob * Math.pow(netReturn, 2);
      }
    }

    // Add losing outcome
    const loseProb = 1 - RiskMetrics.winRate(game);
    const loseReturn = -game.price;
    expectedValue += loseProb * loseReturn;
    expectedSquare += loseProb * Math.pow(loseReturn, 2);

    const variance = expectedSquare - Math.pow(expectedValue, 2);

    return variance;
  }

  /**
   * Calculate standard deviation (volatility)
   */
  static calculateStdDeviation(game: LotteryGame): number {
    return Math.sqrt(this.calculateVariance(game));
  }

  /**
   * Calculate semi-variance (downside risk only)
   */
  static calculateSemiVariance(game: LotteryGame, threshold: number = 0): number {
    if (!game.total_tickets || game.total_tickets === 0) {
      return Math.pow(game.price, 2);
    }

    let semiVariance = 0;

    for (const prize of game.prizes) {
      if (prize.remaining > 0) {
        const prob = HypergeometricCalculator.winProbability(
          game.total_tickets,
          prize.remaining
        );

        const netReturn = prize.amount - game.price;

        // Only count returns below threshold
        if (netReturn < threshold) {
          semiVariance += prob * Math.pow(netReturn - threshold, 2);
        }
      }
    }

    // Add losing outcome (always below threshold)
    const loseProb = 1 - RiskMetrics.winRate(game);
    const loseReturn = -game.price;
    semiVariance += loseProb * Math.pow(loseReturn - threshold, 2);

    return semiVariance;
  }
}
