// AI Prediction Engine - Machine Learning for Hot Ticket Prediction
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HistoricalDataPoint,
  HotTicketPrediction,
  PredictionSignal,
  PatternMatch,
  AIInsight,
  TrendAnalysis,
  PredictionAccuracy
} from '../../types/ai';
import { MinnesotaLotteryService } from '../lottery/minnesotaData';
import { EVCalculator } from '../calculator/evCalculator';
import { LuckyModeService } from '../lucky/luckyModeService';

export class AIPredictionEngine {
  private static readonly HISTORY_KEY = 'ai_historical_data';
  private static readonly PREDICTIONS_KEY = 'ai_predictions';
  private static readonly ACCURACY_KEY = 'ai_accuracy';

  /**
   * Analyze game and generate prediction
   */
  static async predictHotTickets(timeframe: '24h' | '48h' | '7d' = '24h'): Promise<HotTicketPrediction[]> {
    const games = await MinnesotaLotteryService.getActiveGames();
    const history = await this.getHistoricalData();
    const moonPhase = LuckyModeService.getCurrentMoonPhase();

    const predictions: HotTicketPrediction[] = [];

    for (const game of games) {
      const currentEV = EVCalculator.calculateEV(game);
      const gameHistory = history.filter(h => h.gameId === game.id);

      // Analyze trends
      const trend = this.analyzeTrend(gameHistory, currentEV);

      // Detect patterns
      const patterns = this.detectPatterns(gameHistory);

      // Generate signals
      const signals = this.generateSignals(game, gameHistory, trend, moonPhase);

      // Calculate predicted hotness
      const predictedHotness = this.predictFutureHotness(
        currentEV.hotness,
        signals,
        timeframe
      );

      // Calculate confidence
      const confidence = this.calculateConfidence(signals, patterns);

      // Generate recommendation
      const recommendation = this.generateRecommendation(
        currentEV.hotness,
        predictedHotness,
        confidence
      );

      // Generate reasoning
      const reasoning = this.generateReasoning(signals, trend, patterns);

      predictions.push({
        gameId: game.id,
        gameName: game.name,
        currentHotness: currentEV.hotness,
        predictedHotness,
        confidence,
        timeframe,
        signals,
        recommendation,
        reasoning
      });
    }

    // Sort by predicted hotness (descending)
    predictions.sort((a, b) => b.predictedHotness - a.predictedHotness);

    // Save predictions for accuracy tracking
    await this.savePredictions(predictions);

    return predictions;
  }

  /**
   * Analyze trend from historical data
   */
  private static analyzeTrend(
    history: HistoricalDataPoint[],
    currentEV: any
  ): TrendAnalysis {
    if (history.length < 3) {
      return {
        gameId: currentEV.gameId,
        trend: 'stable',
        velocity: 0,
        supportingData: {
          evChange: 0,
          prizeClaimRate: 0,
          salesTrend: 0
        }
      };
    }

    // Sort by date
    const sorted = [...history].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate EV trend
    const recent = sorted.slice(-5);
    const evChange = recent.length > 1
      ? ((recent[recent.length - 1].ev - recent[0].ev) / recent[0].ev) * 100
      : 0;

    // Calculate prize claim rate
    const prizeChange = recent.length > 1
      ? recent[0].topPrizesRemaining - recent[recent.length - 1].topPrizesRemaining
      : 0;
    const prizeClaimRate = prizeChange / (recent.length - 1);

    // Calculate velocity (rate of hotness change)
    const hotnessValues = recent.map(h => h.hotness);
    const velocity = hotnessValues.length > 1
      ? (hotnessValues[hotnessValues.length - 1] - hotnessValues[0]) / (hotnessValues.length - 1)
      : 0;

    // Determine trend
    let trend: 'heating_up' | 'cooling_down' | 'stable' | 'volatile';
    if (Math.abs(velocity) < 5) {
      trend = 'stable';
    } else if (velocity > 10) {
      trend = 'heating_up';
    } else if (velocity < -10) {
      trend = 'cooling_down';
    } else {
      trend = 'volatile';
    }

    return {
      gameId: currentEV.gameId,
      trend,
      velocity,
      supportingData: {
        evChange,
        prizeClaimRate,
        salesTrend: 0 // Would calculate from actual sales data
      }
    };
  }

  /**
   * Detect patterns in historical data
   */
  private static detectPatterns(history: HistoricalDataPoint[]): PatternMatch[] {
    const patterns: PatternMatch[] = [];

    if (history.length < 7) return patterns;

    // Pattern 1: Big prize claim spike (2+ top prizes claimed in short period)
    const recentClaims = history.slice(-3);
    const prizeClaimSpike = recentClaims[0]?.topPrizesRemaining -
      recentClaims[recentClaims.length - 1]?.topPrizesRemaining;

    if (prizeClaimSpike >= 2) {
      patterns.push({
        gameId: history[0].gameId,
        pattern: 'big_prize_claim_spike',
        matchScore: 0.9,
        historicalOutcome: 'heated_up',
        confidence: 85
      });
    }

    // Pattern 2: EV ascending trend
    const evTrend = history.slice(-5).map(h => h.ev);
    const isAscending = evTrend.every((val, i) => i === 0 || val >= evTrend[i - 1]);

    if (isAscending && evTrend.length === 5) {
      patterns.push({
        gameId: history[0].gameId,
        pattern: 'ev_ascending_trend',
        matchScore: 0.8,
        historicalOutcome: 'heated_up',
        confidence: 75
      });
    }

    // Pattern 3: Weekly cycle (games heat up on weekends)
    const weekendData = history.filter(h => {
      const day = new Date(h.date).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });

    if (weekendData.length >= 3) {
      const avgWeekendHotness = weekendData.reduce((sum, h) => sum + h.hotness, 0) / weekendData.length;
      const avgOverallHotness = history.reduce((sum, h) => sum + h.hotness, 0) / history.length;

      if (avgWeekendHotness > avgOverallHotness * 1.2) {
        patterns.push({
          gameId: history[0].gameId,
          pattern: 'weekend_spike',
          matchScore: 0.7,
          historicalOutcome: 'heated_up',
          confidence: 65
        });
      }
    }

    return patterns;
  }

  /**
   * Generate prediction signals
   */
  private static generateSignals(
    game: any,
    history: HistoricalDataPoint[],
    trend: TrendAnalysis,
    moonPhase: any
  ): PredictionSignal[] {
    const signals: PredictionSignal[] = [];

    // Prize velocity signal
    if (trend.supportingData.prizeClaimRate > 1) {
      signals.push({
        type: 'prize_velocity',
        strength: Math.min(trend.supportingData.prizeClaimRate / 3, 1),
        direction: 'positive',
        description: `${Math.round(trend.supportingData.prizeClaimRate)} top prizes claimed recently. Game heating up!`
      });
    }

    // EV trend signal
    if (trend.supportingData.evChange > 5) {
      signals.push({
        type: 'ev_trend',
        strength: Math.min(trend.supportingData.evChange / 20, 1),
        direction: 'positive',
        description: `EV increased ${trend.supportingData.evChange.toFixed(1)}% recently.`
      });
    } else if (trend.supportingData.evChange < -5) {
      signals.push({
        type: 'ev_trend',
        strength: Math.min(Math.abs(trend.supportingData.evChange) / 20, 1),
        direction: 'negative',
        description: `EV decreased ${Math.abs(trend.supportingData.evChange).toFixed(1)}% recently.`
      });
    }

    // Moon phase signal
    if (moonPhase.phase === 'full_moon' && game.price >= 20) {
      signals.push({
        type: 'moon_phase',
        strength: 0.6,
        direction: 'positive',
        description: 'Full moon favors high-value tickets!'
      });
    } else if (moonPhase.phase === 'new_moon' && game.price <= 2) {
      signals.push({
        type: 'moon_phase',
        strength: 0.6,
        direction: 'positive',
        description: 'New moon favors new beginnings and low-cost tickets!'
      });
    }

    // Seasonal pattern signal (simplified)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      signals.push({
        type: 'seasonal_pattern',
        strength: 0.5,
        direction: 'positive',
        description: 'Weekend sales spike predicted.'
      });
    }

    return signals;
  }

  /**
   * Predict future hotness
   */
  private static predictFutureHotness(
    currentHotness: number,
    signals: PredictionSignal[],
    timeframe: '24h' | '48h' | '7d'
  ): number {
    let predicted = currentHotness;

    // Apply signal impacts
    for (const signal of signals) {
      const impact = signal.strength * 15; // Max 15 point impact per signal
      predicted += signal.direction === 'positive' ? impact : -impact;
    }

    // Apply timeframe decay
    const timeframeMultiplier = {
      '24h': 1.0,
      '48h': 0.9,
      '7d': 0.7
    }[timeframe];

    predicted *= timeframeMultiplier;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(predicted)));
  }

  /**
   * Calculate prediction confidence
   */
  private static calculateConfidence(
    signals: PredictionSignal[],
    patterns: PatternMatch[]
  ): number {
    if (signals.length === 0) return 30; // Low confidence

    const avgSignalStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
    const patternConfidence = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;

    const baseConfidence = avgSignalStrength * 50;
    const patternBonus = patternConfidence * 0.3;

    return Math.min(95, Math.round(baseConfidence + patternBonus));
  }

  /**
   * Generate recommendation
   */
  private static generateRecommendation(
    current: number,
    predicted: number,
    confidence: number
  ): 'buy_now' | 'wait' | 'avoid' {
    if (confidence < 50) return 'wait';

    const increase = predicted - current;

    if (increase >= 15 && confidence >= 70) return 'buy_now';
    if (increase < -10) return 'avoid';
    if (current >= 70) return 'buy_now';

    return 'wait';
  }

  /**
   * Generate reasoning
   */
  private static generateReasoning(
    signals: PredictionSignal[],
    trend: TrendAnalysis,
    patterns: PatternMatch[]
  ): string[] {
    const reasons: string[] = [];

    // Trend reason
    if (trend.trend === 'heating_up') {
      reasons.push(`📈 Trend Analysis: Game is ${trend.trend.replace('_', ' ')} with velocity ${trend.velocity.toFixed(1)}`);
    }

    // Signal reasons
    const strongSignals = signals.filter(s => s.strength >= 0.6);
    strongSignals.forEach(signal => {
      reasons.push(`🔔 ${signal.description}`);
    });

    // Pattern reasons
    patterns.forEach(pattern => {
      const outcome = pattern.historicalOutcome === 'heated_up' ? 'increased' : 'decreased';
      reasons.push(`🔍 Pattern Detected: ${pattern.pattern.replace(/_/g, ' ')} → historically ${outcome} hotness`);
    });

    if (reasons.length === 0) {
      reasons.push('⚖️ Stable conditions. No strong signals detected.');
    }

    return reasons;
  }

  /**
   * Generate AI insights
   */
  static async generateInsights(): Promise<AIInsight[]> {
    const predictions = await this.predictHotTickets('24h');
    const insights: AIInsight[] = [];

    // Opportunity: High confidence buy recommendations
    const buyNow = predictions.filter(p => p.recommendation === 'buy_now' && p.confidence >= 75);
    if (buyNow.length > 0) {
      insights.push({
        type: 'opportunity',
        title: '🎯 High Confidence Opportunities',
        description: `${buyNow.length} game(s) predicted to heat up in next 24h`,
        affectedGames: buyNow.map(p => p.gameName),
        actionable: true,
        priority: 'high'
      });
    }

    // Warning: Games cooling down
    const cooling = predictions.filter(p =>
      p.currentHotness > 60 && p.predictedHotness < p.currentHotness - 15
    );
    if (cooling.length > 0) {
      insights.push({
        type: 'warning',
        title: '⚠️ Cooling Alert',
        description: `${cooling.length} hot game(s) predicted to cool down`,
        affectedGames: cooling.map(p => p.gameName),
        actionable: true,
        priority: 'medium'
      });
    }

    // Trend: Overall market heating
    const avgPredicted = predictions.reduce((sum, p) => sum + p.predictedHotness, 0) / predictions.length;
    const avgCurrent = predictions.reduce((sum, p) => sum + p.currentHotness, 0) / predictions.length;

    if (avgPredicted > avgCurrent + 5) {
      insights.push({
        type: 'trend',
        title: '📊 Market Heating Up',
        description: 'Overall lottery market trending upward',
        affectedGames: predictions.map(p => p.gameName),
        actionable: false,
        priority: 'low'
      });
    }

    return insights;
  }

  /**
   * Track prediction accuracy
   * NOTE: Accuracy tracking requires historical validation data
   * Currently returns null until we have sufficient data to validate predictions
   */
  static async trackAccuracy(): Promise<PredictionAccuracy | null> {
    // TODO: Implement actual accuracy tracking once we have:
    // 1. Historical predictions stored with timestamps
    // 2. Actual outcomes collected (did hotness increase/decrease as predicted?)
    // 3. At least 30 days of validation data

    // For now, return null to indicate no validated accuracy data
    // This is more honest than showing fake metrics
    return null;
  }

  /**
   * Save historical data point
   */
  static async saveHistoricalDataPoint(
    gameId: string,
    ev: number,
    hotness: number,
    prizesRemaining: number,
    topPrizesRemaining: number
  ): Promise<void> {
    const history = await this.getHistoricalData();

    const dataPoint: HistoricalDataPoint = {
      date: new Date().toISOString(),
      gameId,
      ev,
      hotness,
      prizesRemaining,
      topPrizesRemaining,
      salesVelocity: 0 // Would calculate from actual sales data
    };

    history.push(dataPoint);

    // Keep last 1000 data points
    const trimmed = history.slice(-1000);

    await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmed));
  }

  /**
   * Get historical data
   */
  private static async getHistoricalData(): Promise<HistoricalDataPoint[]> {
    try {
      const stored = await AsyncStorage.getItem(this.HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save predictions for accuracy tracking
   */
  private static async savePredictions(predictions: HotTicketPrediction[]): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.PREDICTIONS_KEY);
      const allPredictions = stored ? JSON.parse(stored) : [];

      const timestamped = predictions.map(p => ({
        ...p,
        createdAt: new Date().toISOString()
      }));

      allPredictions.push(...timestamped);

      // Keep last 500 predictions
      const trimmed = allPredictions.slice(-500);

      await AsyncStorage.setItem(this.PREDICTIONS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save predictions:', error);
    }
  }
}
