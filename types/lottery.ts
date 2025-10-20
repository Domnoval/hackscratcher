// Core lottery types for Scratch Oracle MVP

export interface LotteryGame {
  id: string;
  name: string;
  price: number;
  overall_odds: string;
  status: 'Active' | 'Retired' | 'New';
  prizes: Prize[];
  launch_date: string;
  last_updated: string;
  total_tickets?: number;

  // AI prediction fields (from Supabase predictions table)
  ai_score?: number;          // 0-100 AI prediction score
  confidence?: number;        // 0-100 confidence level
  recommendation?: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid';
  ai_reasoning?: string;      // Human-readable explanation from AI
  win_probability?: number;   // 0.0-1.0 probability
}

export interface Prize {
  tier: string;
  amount: number;
  total: number;
  remaining: number;
  odds?: string;              // Individual tier odds (e.g., "1 in 100,000")
}

export interface EVCalculation {
  gameId: string;
  baseEV: number;
  adjustedEV: number;
  confidence: number;
  hotness: number;
  factors: {
    prizePoolWeight: number;
    recencyBias: number;
    concentrationScore: number;
  };
}

export interface Recommendation {
  gameId: string;
  game: LotteryGame;
  score: number;
  ev: EVCalculation;
  reasons: string[];
  timestamp: string;
}

export interface UserProfile {
  age: number;
  budget: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  riskProfile: 'low' | 'medium' | 'high';
  preferences: {
    maxPrice: number;
    luckyModeEnabled: boolean;
  };
}