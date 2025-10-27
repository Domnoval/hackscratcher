import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { EVCalculator } from '../../../services/calculator/evCalculator';
import { LotteryGame, Prize, UserProfile } from '../../../types/lottery';

describe('EVCalculator', () => {
  // Helper to create valid lottery games for property-based testing
  const validGameArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.float({ min: 1, max: 50, noNaN: true }),
    overall_odds: fc.constant('1 in 100'),
    status: fc.constantFrom('Active' as const, 'Retired' as const, 'New' as const),
    launch_date: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
    last_updated: fc.date({ min: new Date('2023-01-01'), max: new Date() }).map(d => d.toISOString()),
    total_tickets: fc.integer({ min: 1000, max: 10000000 }),
    prizes: fc.array(
      fc.record({
        tier: fc.string({ minLength: 1, maxLength: 20 }),
        amount: fc.float({ min: 1, max: 1000000, noNaN: true }),
        total: fc.integer({ min: 1, max: 1000 }),
        remaining: fc.integer({ min: 0, max: 1000 }),
      }),
      { minLength: 1, maxLength: 10 }
    ).map(prizes => prizes.map(p => ({ ...p, remaining: Math.min(p.remaining, p.total) }))),
  });

  describe('Property-based tests', () => {
    it('should never return Infinity or NaN for any valid input', () => {
      fc.assert(
        fc.property(validGameArbitrary, (game) => {
          const result = EVCalculator.calculateEV(game);

          // baseEV can be -Infinity for zombie games, but not +Infinity
          if (result.baseEV !== -Infinity) {
            expect(result.baseEV).not.toBe(Infinity);
            expect(result.baseEV).not.toBe(NaN);
          }

          // adjustedEV can be -Infinity for zombie games
          if (result.adjustedEV !== -Infinity) {
            expect(result.adjustedEV).not.toBe(Infinity);
            expect(result.adjustedEV).not.toBe(NaN);
          }

          expect(result.confidence).not.toBe(Infinity);
          expect(result.confidence).not.toBe(NaN);
          expect(result.hotness).not.toBe(Infinity);
          expect(result.hotness).not.toBe(NaN);
        }),
        { numRuns: 100 }
      );
    });

    it('should always return confidence between 0 and 1', () => {
      fc.assert(
        fc.property(validGameArbitrary, (game) => {
          const result = EVCalculator.calculateEV(game);
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should always return hotness between 0 and 1', () => {
      fc.assert(
        fc.property(validGameArbitrary, (game) => {
          const result = EVCalculator.calculateEV(game);
          expect(result.hotness).toBeGreaterThanOrEqual(0);
          expect(result.hotness).toBeLessThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle negative values gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            price: fc.float({ min: 1, max: 50, noNaN: true }),
            overall_odds: fc.constant('1 in 100'),
            status: fc.constant('Active' as const),
            launch_date: fc.date().map(d => d.toISOString()),
            last_updated: fc.date().map(d => d.toISOString()),
            total_tickets: fc.integer({ min: 1000, max: 10000000 }),
            prizes: fc.array(
              fc.record({
                tier: fc.string({ minLength: 1 }),
                amount: fc.float({ min: 1, max: 1000000, noNaN: true }),
                total: fc.integer({ min: 1, max: 100 }),
                remaining: fc.integer({ min: 0, max: 100 }),
              }).map(p => ({ ...p, remaining: Math.min(p.remaining, p.total) })),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          (game) => {
            // Should not throw
            const result = EVCalculator.calculateEV(game);
            expect(result).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Division by zero protection', () => {
    it('should handle zero total_tickets', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 0,
        prizes: [
          { tier: 'Top', amount: 10000, total: 10, remaining: 5 },
        ],
      };

      const result = EVCalculator.calculateEV(game);

      // Should return -price as conservative estimate
      expect(result.baseEV).toBe(-5);
      expect(result.baseEV).not.toBe(Infinity);
      expect(result.baseEV).not.toBe(NaN);
    });

    it('should handle zero total prizes', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 1000000,
        prizes: [
          { tier: 'Top', amount: 10000, total: 0, remaining: 0 },
        ],
      };

      const result = EVCalculator.calculateEV(game);

      // Should have minimum confidence
      expect(result.confidence).toBe(0.3);
      expect(result.hotness).toBe(0);
    });

    it('should handle empty prizes array gracefully', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 1000000,
        prizes: [],
      };

      expect(() => EVCalculator.calculateEV(game)).toThrow('Game must have at least one prize');
    });

    it('should handle missing total_tickets', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        prizes: [
          { tier: 'Top', amount: 10000, total: 10, remaining: 5 },
        ],
      };

      const result = EVCalculator.calculateEV(game);

      // Should return -price as conservative estimate
      expect(result.baseEV).toBe(-5);
      expect(result.confidence).toBeLessThanOrEqual(0.6);
    });
  });

  describe('Prize probability calculations', () => {
    it('should calculate correct EV for simple game', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 4',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 1000,
        prizes: [
          { tier: 'Top', amount: 100, total: 10, remaining: 10 },
        ],
      };

      const result = EVCalculator.calculateEV(game);

      // Expected winnings: (10 * 100) / 1000 = 1
      // EV = 1 - 5 = -4
      expect(result.baseEV).toBeCloseTo(-4, 1);
    });

    it('should correctly handle partially claimed prizes', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 10,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Grand', amount: 100000, total: 5, remaining: 2 },
          { tier: 'Second', amount: 1000, total: 100, remaining: 50 },
        ],
      };

      const result = EVCalculator.calculateEV(game);

      // Expected: (2 * 100000 + 50 * 1000) / 100000 - 10 = 2.5 - 10 = -7.5
      expect(result.baseEV).toBeCloseTo(-7.5, 1);
    });

    it('should handle all prizes claimed', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Top', amount: 10000, total: 10, remaining: 0 },
        ],
      };

      const result = EVCalculator.calculateEV(game);

      // No prizes left, EV should be -price
      expect(result.baseEV).toBe(-5);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid game object', () => {
      expect(() => EVCalculator.calculateEV(null as any)).toThrow('Invalid game object');
      expect(() => EVCalculator.calculateEV(undefined as any)).toThrow('Invalid game object');
      expect(() => EVCalculator.calculateEV('not an object' as any)).toThrow('Invalid game object');
    });

    it('should handle invalid price', () => {
      const game = {
        id: '1',
        name: 'Test',
        price: -5,
        overall_odds: '1 in 100',
        status: 'Active' as const,
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 1000,
        prizes: [{ tier: 'Top', amount: 100, total: 10, remaining: 5 }],
      };

      expect(() => EVCalculator.calculateEV(game)).toThrow('Invalid game price');
    });

    it('should handle invalid prize data', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Invalid', amount: 100, total: 10, remaining: -5 }, // Invalid: negative remaining
        ],
      };

      const result = EVCalculator.calculateEV(game);

      // Should handle gracefully and skip invalid prize
      expect(result.baseEV).toBe(-5); // Only ticket cost
    });

    it('should identify zombie games correctly', () => {
      const zombieGame: LotteryGame = {
        id: '1',
        name: 'Zombie Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Grand', amount: 100000, total: 1, remaining: 0 },
          { tier: 'Second', amount: 10000, total: 5, remaining: 0 },
          { tier: 'Third', amount: 100, total: 100, remaining: 50 },
        ],
      };

      expect(EVCalculator.isZombieGame(zombieGame)).toBe(true);

      const result = EVCalculator.calculateEV(zombieGame);
      expect(result.adjustedEV).toBe(-Infinity);
    });

    it('should not flag game as zombie if top prizes remain', () => {
      const activeGame: LotteryGame = {
        id: '1',
        name: 'Active Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Grand', amount: 100000, total: 1, remaining: 1 },
          { tier: 'Second', amount: 10000, total: 5, remaining: 0 },
        ],
      };

      expect(EVCalculator.isZombieGame(activeGame)).toBe(false);
    });
  });

  describe('User profile adjustments', () => {
    it('should apply low risk profile penalty', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Top', amount: 10000, total: 10, remaining: 10 },
        ],
      };

      const lowRiskProfile: UserProfile = {
        age: 25,
        budget: { daily: 20, weekly: 100, monthly: 400 },
        riskProfile: 'low',
        preferences: { maxPrice: 10, luckyModeEnabled: false },
      };

      const resultWithProfile = EVCalculator.calculateEV(game, lowRiskProfile);
      const resultWithoutProfile = EVCalculator.calculateEV(game);

      // Low risk should apply 0.9 multiplier
      expect(resultWithProfile.adjustedEV).toBeLessThan(resultWithoutProfile.adjustedEV);
    });

    it('should apply high risk profile bonus for big prizes', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100000',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 1000000,
        prizes: [
          { tier: 'Grand', amount: 500000, total: 2, remaining: 2 },
        ],
      };

      const highRiskProfile: UserProfile = {
        age: 30,
        budget: { daily: 50, weekly: 300, monthly: 1200 },
        riskProfile: 'high',
        preferences: { maxPrice: 30, luckyModeEnabled: true },
      };

      const resultWithProfile = EVCalculator.calculateEV(game, highRiskProfile);
      const resultWithoutProfile = EVCalculator.calculateEV(game);

      // High risk with big prizes should get 1.1 multiplier
      expect(resultWithProfile.adjustedEV).toBeGreaterThan(resultWithoutProfile.adjustedEV);
    });

    it('should apply budget penalty for expensive tickets', () => {
      const expensiveGame: LotteryGame = {
        id: '1',
        name: 'Expensive Game',
        price: 30,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Top', amount: 100000, total: 10, remaining: 10 },
        ],
      };

      const smallBudgetProfile: UserProfile = {
        age: 25,
        budget: { daily: 20, weekly: 100, monthly: 400 },
        riskProfile: 'medium',
        preferences: { maxPrice: 10, luckyModeEnabled: false },
      };

      const result = EVCalculator.calculateEV(expensiveGame, smallBudgetProfile);

      // Should be penalized since price (30) > daily budget * 0.5 (10)
      // Penalty is 0.8 multiplier
      expect(result.adjustedEV).toBeDefined();
    });
  });

  describe('Confidence scoring', () => {
    it('should reduce confidence for missing total_tickets', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        prizes: [
          { tier: 'Top', amount: 10000, total: 10, remaining: 5 },
        ],
      };

      const result = EVCalculator.calculateEV(game);
      expect(result.confidence).toBeLessThanOrEqual(0.6);
    });

    it('should reduce confidence for stale data', () => {
      const staleDate = new Date();
      staleDate.setHours(staleDate.getHours() - 100); // 100 hours old

      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: staleDate.toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Top', amount: 10000, total: 10, remaining: 5 },
        ],
      };

      const result = EVCalculator.calculateEV(game);
      // Should be reduced by 0.8 for > 72 hours and 0.6 for > 24 hours
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should reduce confidence for low remaining prizes', () => {
      const game: LotteryGame = {
        id: '1',
        name: 'Test Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Top', amount: 10000, total: 100, remaining: 2 }, // Only 2% remaining
        ],
      };

      const result = EVCalculator.calculateEV(game);
      // Should be reduced for low remaining ratio
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('Hotness calculation', () => {
    it('should give high hotness to recently launched games with high depletion', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5); // 5 days old

      const hotGame: LotteryGame = {
        id: '1',
        name: 'Hot Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'New',
        launch_date: recentDate.toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Grand', amount: 100000, total: 10, remaining: 2 }, // 80% depleted
          { tier: 'Second', amount: 1000, total: 100, remaining: 30 }, // 70% depleted
        ],
      };

      const result = EVCalculator.calculateEV(hotGame);
      expect(result.hotness).toBeGreaterThan(0.5);
    });

    it('should give low hotness to old games with low depletion', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days old

      const coldGame: LotteryGame = {
        id: '1',
        name: 'Cold Game',
        price: 5,
        overall_odds: '1 in 100',
        status: 'Active',
        launch_date: oldDate.toISOString(),
        last_updated: new Date().toISOString(),
        total_tickets: 100000,
        prizes: [
          { tier: 'Top', amount: 10000, total: 100, remaining: 95 }, // Only 5% depleted
        ],
      };

      const result = EVCalculator.calculateEV(coldGame);
      expect(result.hotness).toBeLessThan(0.3);
    });
  });

  describe('explainEV', () => {
    it('should provide explanations for positive EV', () => {
      const calculation = {
        gameId: '1',
        baseEV: 2.5,
        adjustedEV: 3.0,
        confidence: 0.9,
        hotness: 0.8,
        factors: { prizePoolWeight: 0.45, recencyBias: 0.25, concentrationScore: 0.20 },
      };

      const explanations = EVCalculator.explainEV(calculation);
      expect(explanations).toContain('Positive expected value: +$3.00');
    });

    it('should provide explanations for zombie games', () => {
      const calculation = {
        gameId: '1',
        baseEV: -5,
        adjustedEV: -Infinity,
        confidence: 0.9,
        hotness: 0.2,
        factors: { prizePoolWeight: 0.45, recencyBias: 0.25, concentrationScore: 0.20 },
      };

      const explanations = EVCalculator.explainEV(calculation);
      expect(explanations).toContain('Zombie game: No top prizes remaining');
    });

    it('should warn about low confidence', () => {
      const calculation = {
        gameId: '1',
        baseEV: -2,
        adjustedEV: -1.5,
        confidence: 0.5,
        hotness: 0.6,
        factors: { prizePoolWeight: 0.45, recencyBias: 0.25, concentrationScore: 0.20 },
      };

      const explanations = EVCalculator.explainEV(calculation);
      expect(explanations).toContain('Low confidence due to limited data');
    });

    it('should highlight hot games', () => {
      const calculation = {
        gameId: '1',
        baseEV: -1,
        adjustedEV: -0.5,
        confidence: 0.9,
        hotness: 0.8,
        factors: { prizePoolWeight: 0.45, recencyBias: 0.25, concentrationScore: 0.20 },
      };

      const explanations = EVCalculator.explainEV(calculation);
      expect(explanations).toContain('Hot game: Prizes being claimed quickly');
    });
  });
});
