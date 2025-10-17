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
}

export interface Prize {
  tier: string;
  amount: number;
  total: number;
  remaining: number;
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