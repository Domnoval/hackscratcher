// AI Prediction Engine Types

export interface HistoricalDataPoint {
  date: string;
  gameId: string;
  ev: number;
  hotness: number;
  prizesRemaining: number;
  topPrizesRemaining: number;
  salesVelocity: number; // Estimated tickets sold per day
}

export interface PredictionModel {
  type: 'linear_regression' | 'pattern_matching' | 'ensemble';
  accuracy: number; // 0-1
  lastTrained: string;
  features: string[];
  weights: number[];
}

export interface HotTicketPrediction {
  gameId: string;
  gameName: string;
  currentHotness: number;
  predictedHotness: number; // In 24-48 hours
  confidence: number; // 0-100
  timeframe: '24h' | '48h' | '7d';
  signals: PredictionSignal[];
  recommendation: 'buy_now' | 'wait' | 'avoid';
  reasoning: string[];
}

export interface PredictionSignal {
  type: 'prize_velocity' | 'ev_trend' | 'seasonal_pattern' | 'store_clustering' | 'moon_phase';
  strength: number; // 0-1
  direction: 'positive' | 'negative';
  description: string;
}

export interface PatternMatch {
  gameId: string;
  pattern: string;
  matchScore: number;
  historicalOutcome: 'heated_up' | 'cooled_down' | 'stable';
  confidence: number;
}

export interface AIInsight {
  type: 'opportunity' | 'warning' | 'trend' | 'anomaly';
  title: string;
  description: string;
  affectedGames: string[];
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  expiresAt?: string;
}

export interface PredictionAccuracy {
  modelType: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  lastUpdated: string;
  byTimeframe: {
    '24h': number;
    '48h': number;
    '7d': number;
  };
  note?: string; // Optional note about validation status
}

export interface TrendAnalysis {
  gameId: string;
  trend: 'heating_up' | 'cooling_down' | 'stable' | 'volatile';
  velocity: number; // Rate of change
  inflectionPoint?: string; // Date when trend may reverse
  supportingData: {
    evChange: number;
    prizeClaimRate: number;
    salesTrend: number;
  };
}
