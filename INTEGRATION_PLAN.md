# Scratch Oracle - Supabase Integration Plan

**Date**: October 19, 2025
**Status**: PLANNING PHASE - DO NOT IMPLEMENT YET
**Purpose**: Connect React Native app to real Supabase data and AI predictions

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Files to Modify](#files-to-modify)
4. [Database Schema Review](#database-schema-review)
5. [Data Fetching Strategy](#data-fetching-strategy)
6. [State Management Approach](#state-management-approach)
7. [UI Enhancements for AI Scores](#ui-enhancements-for-ai-scores)
8. [Loading States & Error Handling](#loading-states--error-handling)
9. [Offline Caching Strategy](#offline-caching-strategy)
10. [Performance Optimization](#performance-optimization)
11. [Migration Strategy](#migration-strategy)
12. [Testing Plan](#testing-plan)
13. [Implementation Timeline](#implementation-timeline)

---

## Executive Summary

### Goals
- Replace mock data with real Supabase queries
- Display AI prediction scores (0-100) with confidence levels
- Implement robust caching to minimize network requests
- Maintain app performance with loading states and error handling
- Enable gradual migration from mock to real data

### Key Metrics
- **Database**: Supabase PostgreSQL with 41 real MN lottery games
- **API Helper Functions**: Already configured in `lib/supabase.ts`
- **Mock Data Files**: 1 primary file (`services/lottery/minnesotaData.ts`)
- **Components Using Mock Data**: 8+ screens
- **Expected Performance**: <2s initial load, <500ms cached responses

### Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | React Query (TanStack Query) | Best for server state, built-in caching, automatic refetching |
| **Offline Storage** | AsyncStorage + React Query Persist | Seamless offline experience, automatic sync |
| **Loading UI** | Skeleton screens + Shimmer effects | Better UX than spinners, matches Vegas theme |
| **Error Handling** | Exponential backoff + Fallback UI | Graceful degradation, retry logic |
| **Migration** | Feature flags (gradual rollout) | A/B test real vs mock, rollback capability |

---

## Current State Analysis

### Mock Data Usage

**Primary Mock Data File**:
- `D:\Scratch_n_Sniff\scratch-oracle-app\services\lottery\minnesotaData.ts` (148 lines)
  - Contains 5 hardcoded games
  - Simulates API delays (500ms, 200ms)
  - Includes `mockGames` array with prize tiers
  - Methods: `getActiveGames()`, `getGameById()`, `refreshGameData()`

### Files Currently Using Mock Data

| File Path | Lines | Usage | Priority |
|-----------|-------|-------|----------|
| `services/lottery/minnesotaData.ts` | 148 | Primary mock data source | **HIGH** |
| `services/recommendations/recommendationEngine.ts` | 222 | Calls `MinnesotaLotteryService.getActiveGames()` | **HIGH** |
| `services/calculator/evCalculator.ts` | 201 | Processes game data (data-agnostic) | Medium |
| `services/ai/aiPredictionEngine.ts` | 525 | Calls `MinnesotaLotteryService.getActiveGames()` | **HIGH** |
| `App.tsx` | 528 | Displays recommendations | **HIGH** |
| `components/AI/AIPredictionsScreen.tsx` | TBD | Shows AI predictions | **HIGH** |
| `components/Stats/WinLossStatsScreen.tsx` | TBD | Displays game stats | Medium |
| `components/Stores/StoreHeatMapScreen.tsx` | TBD | Shows stores and wins | Medium |

### Supabase Client Status

**Already Configured**: `lib/supabase.ts` (237 lines)
- Supabase client initialized with AsyncStorage persistence
- Complete TypeScript interfaces for all tables:
  - `Game` (42 fields)
  - `PrizeTier` (9 fields)
  - `Prediction` (14 fields) - **AI SCORES HERE**
  - `Store` (15 fields)
  - `Win` (9 fields)
  - `UserScan` (12 fields)

**Helper Functions Already Available**:
1. `getActiveGamesWithPredictions()` - Fetches games with AI scores
2. `getGameDetails(gameId)` - Full game details + prize tiers + prediction
3. `getTopStoresNearby(lat, lng, radius)` - Stores within radius
4. `logTicketScan(scan)` - Log user scan
5. `getGameTrend(gameId, days)` - Historical snapshots
6. `getUserScanHistory(userId, limit)` - User's scan history

### Database Views

**Key View**: `active_games_with_predictions`
- Combines `games` + `predictions` tables
- Pre-joined for performance
- Includes:
  - All game fields
  - Latest `ai_score` (0-100)
  - `win_probability` (0.0-1.0)
  - `confidence_level` (0-100)
  - `recommendation` ('strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid')
  - `reasoning` (text explanation)

---

## Files to Modify

### Phase 1: Core Data Layer (HIGH PRIORITY)

#### 1.1. Create New Data Service: `services/lottery/supabaseLotteryService.ts`

**Purpose**: Supabase-backed implementation replacing mock data

**File**: `D:\Scratch_n_Sniff\scratch-oracle-app\services\lottery\supabaseLotteryService.ts`

```typescript
// NEW FILE - Supabase-backed lottery data service
import { getActiveGamesWithPredictions, getGameDetails } from '../../lib/supabase';
import type { Game, Prediction, PrizeTier } from '../../lib/supabase';
import { LotteryGame, Prize } from '../../types/lottery';

export class SupabaseLotteryService {
  /**
   * Convert Supabase Game to app's LotteryGame format
   */
  private static convertGame(
    dbGame: Game,
    prizeTiers: PrizeTier[],
    prediction?: Prediction | null
  ): LotteryGame {
    return {
      id: dbGame.id,
      name: dbGame.game_name,
      price: Number(dbGame.ticket_price),
      overall_odds: dbGame.overall_odds || '1 in 4.0',
      status: dbGame.is_active ? 'Active' : 'Retired',
      prizes: prizeTiers.map((tier): Prize => ({
        tier: this.getPrizeTierName(tier.prize_amount),
        amount: Number(tier.prize_amount),
        total: tier.total_prizes,
        remaining: tier.remaining_prizes,
      })),
      launch_date: dbGame.game_start_date || dbGame.created_at,
      last_updated: dbGame.updated_at,
      total_tickets: dbGame.total_tickets_printed
        ? Number(dbGame.total_tickets_printed)
        : undefined,

      // NEW: AI prediction fields
      ai_score: prediction?.ai_score || undefined,
      confidence: prediction?.confidence_level || undefined,
      recommendation: prediction?.recommendation || undefined,
      ai_reasoning: prediction?.reasoning || undefined,
    };
  }

  /**
   * Get all active games with AI predictions
   */
  static async getActiveGames(): Promise<LotteryGame[]> {
    try {
      // Uses database view that joins games + predictions
      const data = await getActiveGamesWithPredictions();

      if (!data || data.length === 0) {
        console.warn('No active games found in Supabase');
        return [];
      }

      // Data from view already has predictions joined
      return data.map(row => ({
        id: row.id,
        name: row.game_name,
        price: Number(row.ticket_price),
        overall_odds: row.overall_odds || '1 in 4.0',
        status: 'Active',
        prizes: this.extractPrizeTiers(row),
        launch_date: row.game_start_date || row.created_at,
        last_updated: row.updated_at,
        total_tickets: row.total_tickets_printed
          ? Number(row.total_tickets_printed)
          : undefined,

        // AI fields from prediction join
        ai_score: row.ai_score || undefined,
        confidence: row.confidence_level || undefined,
        recommendation: row.recommendation || undefined,
        ai_reasoning: row.reasoning || undefined,
      }));
    } catch (error) {
      console.error('Error fetching games from Supabase:', error);
      throw new Error('Failed to load lottery games. Please check your connection.');
    }
  }

  /**
   * Get game by ID with full details
   */
  static async getGameById(id: string): Promise<LotteryGame | null> {
    try {
      const { game, prizeTiers, prediction } = await getGameDetails(id);

      if (!game) return null;

      return this.convertGame(game, prizeTiers, prediction);
    } catch (error) {
      console.error('Error fetching game details:', error);
      return null;
    }
  }

  /**
   * Refresh game data (no-op for Supabase, data is always fresh)
   */
  static async refreshGameData(): Promise<void> {
    // In Supabase implementation, data is always fresh from database
    // This method exists for API compatibility with mock service
    console.log('Supabase data is always fresh - no manual refresh needed');
  }

  /**
   * Helper: Extract prize tiers from view row
   * (Assumes view aggregates prize_tiers into JSONB array)
   */
  private static extractPrizeTiers(row: any): Prize[] {
    // If view includes aggregated prize_tiers as JSON
    if (row.prize_tiers && Array.isArray(row.prize_tiers)) {
      return row.prize_tiers.map((tier: any) => ({
        tier: this.getPrizeTierName(tier.prize_amount),
        amount: Number(tier.prize_amount),
        total: tier.total_prizes,
        remaining: tier.remaining_prizes,
      }));
    }

    // Fallback: single top prize
    return [{
      tier: 'Top Prize',
      amount: Number(row.top_prize_amount),
      total: row.total_top_prizes,
      remaining: row.remaining_top_prizes,
    }];
  }

  /**
   * Helper: Get prize tier name based on amount
   */
  private static getPrizeTierName(amount: number): string {
    if (amount >= 1000000) return 'Jackpot';
    if (amount >= 100000) return 'Second';
    if (amount >= 10000) return 'Third';
    if (amount >= 1000) return 'Fourth';
    return 'Fifth';
  }

  /**
   * Validate game data (same as mock implementation)
   */
  static validateGameData(game: LotteryGame): boolean {
    if (!game.id || !game.name || game.price <= 0) return false;

    for (const prize of game.prizes) {
      if (prize.remaining < 0 || prize.remaining > prize.total) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get data freshness message
   */
  static getDataFreshness(): string {
    // For Supabase, data is real-time
    return 'Live data from Minnesota Lottery';
  }
}
```

#### 1.2. Update Type Definitions: `types/lottery.ts`

**Additions** to existing interfaces:

```typescript
// MODIFY EXISTING FILE: types/lottery.ts

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

  // NEW: AI prediction fields
  ai_score?: number;          // 0-100
  confidence?: number;        // 0-100
  recommendation?: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid';
  ai_reasoning?: string;      // Human-readable explanation
}

export interface Prize {
  tier: string;
  amount: number;
  total: number;
  remaining: number;
  odds?: string;              // NEW: individual tier odds
}

// NEW: Feature flag configuration
export interface FeatureFlags {
  useSupabaseData: boolean;   // true = Supabase, false = mock
  enableAIScores: boolean;    // Show AI predictions
  enableOfflineMode: boolean; // Cache data for offline
}
```

#### 1.3. Create Feature Flag Service: `services/config/featureFlags.ts`

**Purpose**: Control gradual rollout of Supabase integration

**File**: `D:\Scratch_n_Sniff\scratch-oracle-app\services\config\featureFlags.ts`

```typescript
// NEW FILE - Feature flag configuration
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEATURE_FLAGS_KEY = 'feature_flags';

export interface FeatureFlags {
  useSupabaseData: boolean;
  enableAIScores: boolean;
  enableOfflineMode: boolean;
  enablePredictionCache: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  useSupabaseData: false,      // Start with mock data
  enableAIScores: false,       // Hide AI scores until Supabase enabled
  enableOfflineMode: true,     // Always cache for offline
  enablePredictionCache: true, // Cache predictions for 1 hour
};

export class FeatureFlagService {
  private static flags: FeatureFlags = DEFAULT_FLAGS;
  private static initialized = false;

  /**
   * Initialize feature flags from storage
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
      if (stored) {
        this.flags = { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }

    this.initialized = true;
  }

  /**
   * Get current flags
   */
  static getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update flags (for admin/testing)
   */
  static async setFlags(updates: Partial<FeatureFlags>): Promise<void> {
    this.flags = { ...this.flags, ...updates };
    await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(this.flags));
  }

  /**
   * Check if Supabase data is enabled
   */
  static useSupabase(): boolean {
    return this.flags.useSupabaseData;
  }

  /**
   * Check if AI scores should be displayed
   */
  static showAIScores(): boolean {
    return this.flags.enableAIScores;
  }

  /**
   * Enable Supabase (for migration)
   */
  static async enableSupabase(): Promise<void> {
    await this.setFlags({
      useSupabaseData: true,
      enableAIScores: true,  // Auto-enable AI when using Supabase
    });
  }
}
```

#### 1.4. Update Recommendation Engine: `services/recommendations/recommendationEngine.ts`

**Changes**:
- Replace direct `MinnesotaLotteryService` calls with abstracted data service
- Add AI score integration

```typescript
// MODIFY EXISTING FILE: services/recommendations/recommendationEngine.ts

import { LotteryGame, UserProfile, Recommendation } from '../../types/lottery';
import { MinnesotaLotteryService } from '../lottery/minnesotaData';
import { SupabaseLotteryService } from '../lottery/supabaseLotteryService'; // NEW
import { FeatureFlagService } from '../config/featureFlags'; // NEW
import { EVCalculator } from '../calculator/evCalculator';

export class RecommendationEngine {
  /**
   * Get data service based on feature flag
   */
  private static getDataService() {
    return FeatureFlagService.useSupabase()
      ? SupabaseLotteryService
      : MinnesotaLotteryService;
  }

  /**
   * Get top recommendations based on user budget and preferences
   */
  static async getRecommendations(
    budget: number,
    userProfile?: UserProfile,
    limit: number = 3
  ): Promise<Recommendation[]> {
    // Use feature flag to determine data source
    const dataService = this.getDataService();
    const games = await dataService.getActiveGames();

    // Filter games within budget
    const affordableGames = games.filter(game => game.price <= budget);

    if (affordableGames.length === 0) {
      return [];
    }

    // Calculate EV for each game
    const gameAnalyses = affordableGames.map(game => {
      const ev = EVCalculator.calculateEV(game, userProfile);

      // NEW: Blend AI score with EV-based score
      const baseScore = this.calculateRecommendationScore(ev, userProfile);
      const aiScore = this.incorporateAIScore(game, baseScore);

      return {
        game,
        ev,
        score: aiScore,
      };
    });

    // Remove zombie games
    const validGames = gameAnalyses.filter(analysis =>
      analysis.ev.adjustedEV !== -Infinity
    );

    // Sort by recommendation score (now includes AI)
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
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * NEW: Incorporate AI score into recommendation score
   */
  private static incorporateAIScore(game: LotteryGame, baseScore: number): number {
    // Only use AI score if Supabase is enabled and game has AI data
    if (!FeatureFlagService.showAIScores() || !game.ai_score) {
      return baseScore;
    }

    // Blend: 70% base EV score + 30% AI score
    const aiContribution = (game.ai_score / 100) * 30;
    const blendedScore = baseScore * 0.7 + aiContribution;

    // Boost if AI confidence is high
    if (game.confidence && game.confidence > 80) {
      return Math.min(100, blendedScore * 1.1);
    }

    return Math.max(0, Math.min(100, blendedScore));
  }

  private static calculateRecommendationScore(
    ev: any,
    userProfile?: UserProfile
  ): number {
    // ... existing implementation unchanged ...
  }

  private static generateReasons(
    ev: any,
    game: LotteryGame,
    userProfile?: UserProfile
  ): string[] {
    const reasons: string[] = [];

    // ... existing EV-based reasons ...

    // NEW: Add AI-based reasons
    if (FeatureFlagService.showAIScores() && game.ai_score) {
      if (game.ai_score >= 80) {
        reasons.push(`AI Prediction: Strong buy (${game.ai_score}/100 score)`);
      } else if (game.ai_score >= 60) {
        reasons.push(`AI Prediction: Good opportunity (${game.ai_score}/100)`);
      }

      if (game.recommendation === 'strong_buy' && game.confidence && game.confidence > 75) {
        reasons.push(`High confidence AI recommendation`);
      }

      if (game.ai_reasoning) {
        reasons.push(game.ai_reasoning);
      }
    }

    return reasons.slice(0, 4); // Limit to 4 most relevant reasons
  }

  // ... rest of existing methods unchanged ...
}
```

### Phase 2: UI Components (HIGH PRIORITY)

#### 2.1. Update Main App: `App.tsx`

**Changes**:
- Initialize feature flags on startup
- Add AI score badges to game cards
- Show loading skeletons

```typescript
// MODIFY EXISTING FILE: App.tsx

import React, { useState, useEffect, useCallback } from 'react';
// ... existing imports ...
import { FeatureFlagService } from './services/config/featureFlags'; // NEW

export default function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [budget, setBudget] = useState('20');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // NEW: Initialize feature flags
  const initializeApp = async () => {
    try {
      await FeatureFlagService.initialize();
      await checkAgeVerification();
    } catch (error) {
      console.error('App initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRecommendation = useCallback(({ item, index }: { item: Recommendation; index: number }) => (
    <View style={styles.recommendationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.gameTitle}>#{index + 1} {item.game.name}</Text>
        <Text style={styles.gamePrice}>${item.game.price}</Text>
      </View>

      {/* NEW: AI Score Badge */}
      {FeatureFlagService.showAIScores() && item.game.ai_score && (
        <View style={styles.aiScoreBadge}>
          <Text style={styles.aiScoreLabel}>AI Score</Text>
          <Text style={[
            styles.aiScoreValue,
            { color: getAIScoreColor(item.game.ai_score) }
          ]}>
            {item.game.ai_score}/100
          </Text>
          {item.game.confidence && (
            <Text style={styles.aiConfidence}>
              {item.game.confidence}% confidence
            </Text>
          )}
        </View>
      )}

      {/* Existing EV container */}
      <View style={styles.evContainer}>
        {/* ... existing EV display ... */}
      </View>

      {/* Existing metrics */}
      <View style={styles.metricsContainer}>
        {/* ... existing metrics ... */}
      </View>

      {/* NEW: AI Recommendation Badge */}
      {item.game.recommendation && (
        <View style={[
          styles.recommendationBadge,
          { backgroundColor: getRecommendationColor(item.game.recommendation) }
        ]}>
          <Text style={styles.recommendationText}>
            {getRecommendationLabel(item.game.recommendation)}
          </Text>
        </View>
      )}

      {/* Existing reasons */}
      <View style={styles.reasonsContainer}>
        {/* ... existing reasons display ... */}
      </View>
    </View>
  ), []);

  // ... rest of existing code ...
}

// NEW: Helper functions for AI display
function getAIScoreColor(score: number): string {
  if (score >= 80) return '#00FF7F'; // Green
  if (score >= 60) return '#FFD700'; // Gold
  if (score >= 40) return '#FFA500'; // Orange
  return '#FF4500'; // Red
}

function getRecommendationColor(rec: string): string {
  switch (rec) {
    case 'strong_buy': return '#00FF7F';
    case 'buy': return '#7FFF00';
    case 'neutral': return '#FFD700';
    case 'avoid': return '#FFA500';
    case 'strong_avoid': return '#FF4500';
    default: return '#708090';
  }
}

function getRecommendationLabel(rec: string): string {
  switch (rec) {
    case 'strong_buy': return 'Strong Buy';
    case 'buy': return 'Buy';
    case 'neutral': return 'Neutral';
    case 'avoid': return 'Avoid';
    case 'strong_avoid': return 'Strong Avoid';
    default: return '';
  }
}

const styles = StyleSheet.create({
  // ... existing styles ...

  // NEW: AI score badge styles
  aiScoreBadge: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00FFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiScoreLabel: {
    color: '#00FFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  aiScoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiConfidence: {
    color: '#708090',
    fontSize: 11,
  },
  recommendationBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

#### 2.2. Create AI Predictions Screen Component

**File**: `D:\Scratch_n_Sniff\scratch-oracle-app\components\AI\AIPredictionsWithScoresScreen.tsx`

```typescript
// NEW FILE - Enhanced AI Predictions Screen with Supabase scores

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getActiveGamesWithPredictions } from '../../lib/supabase';
import type { Game, Prediction } from '../../lib/supabase';

interface GameWithPrediction extends Game {
  prediction?: Prediction;
}

export function AIPredictionsWithScoresScreen() {
  const [games, setGames] = useState<GameWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setError(null);
      const data = await getActiveGamesWithPredictions();

      // Sort by AI score descending
      const sorted = data.sort((a, b) =>
        (b.ai_score || 0) - (a.ai_score || 0)
      );

      setGames(sorted);
    } catch (err) {
      setError('Failed to load AI predictions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPredictions();
  };

  const renderGame = ({ item }: { item: any }) => (
    <View style={styles.gameCard}>
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <Text style={styles.gameName}>{item.game_name}</Text>
        <Text style={styles.gamePrice}>${Number(item.ticket_price).toFixed(2)}</Text>
      </View>

      {/* AI Score Display */}
      <View style={styles.aiScoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[
            styles.scoreValue,
            { color: getScoreColor(item.ai_score) }
          ]}>
            {item.ai_score || 0}
          </Text>
          <Text style={styles.scoreLabel}>AI Score</Text>
        </View>

        <View style={styles.scoreDetails}>
          <View style={styles.scoreStat}>
            <Text style={styles.statLabel}>Confidence</Text>
            <Text style={styles.statValue}>{item.confidence_level || 0}%</Text>
          </View>
          <View style={styles.scoreStat}>
            <Text style={styles.statLabel}>Win Probability</Text>
            <Text style={styles.statValue}>
              {((item.win_probability || 0) * 100).toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Recommendation Badge */}
      {item.recommendation && (
        <View style={[
          styles.recommendationBadge,
          { backgroundColor: getRecommendationColor(item.recommendation) }
        ]}>
          <Text style={styles.recommendationText}>
            {formatRecommendation(item.recommendation)}
          </Text>
        </View>
      )}

      {/* AI Reasoning */}
      {item.reasoning && (
        <View style={styles.reasoningContainer}>
          <Text style={styles.reasoningLabel}>AI Analysis:</Text>
          <Text style={styles.reasoningText}>{item.reasoning}</Text>
        </View>
      )}

      {/* Prize Info */}
      <View style={styles.prizeInfo}>
        <Text style={styles.prizeLabel}>Top Prize:</Text>
        <Text style={styles.prizeAmount}>
          ${Number(item.top_prize_amount).toLocaleString()}
        </Text>
        <Text style={styles.prizeRemaining}>
          {item.remaining_top_prizes} of {item.total_top_prizes} remaining
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>Loading AI predictions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Predictions</Text>
      <Text style={styles.subtitle}>
        Powered by machine learning analysis of 41 Minnesota games
      </Text>

      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00FFFF"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#00FF7F';
  if (score >= 60) return '#FFD700';
  if (score >= 40) return '#FFA500';
  return '#FF4500';
}

function getRecommendationColor(rec: string): string {
  switch (rec) {
    case 'strong_buy': return '#00FF7F';
    case 'buy': return '#7FFF00';
    case 'neutral': return '#FFD700';
    case 'avoid': return '#FFA500';
    case 'strong_avoid': return '#FF4500';
    default: return '#708090';
  }
}

function formatRecommendation(rec: string): string {
  return rec.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#708090',
    textAlign: 'center',
    marginBottom: 20,
  },
  listContent: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    flex: 1,
  },
  gamePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  aiScoreContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E2E3F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#00FFFF',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#708090',
  },
  scoreDetails: {
    flex: 1,
    justifyContent: 'space-around',
  },
  scoreStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    color: '#708090',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FFFF',
  },
  recommendationBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    color: '#0A0A0F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reasoningContainer: {
    backgroundColor: '#2E2E3F',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reasoningLabel: {
    fontSize: 12,
    color: '#00FFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 13,
    color: '#E0E0E0',
    lineHeight: 18,
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prizeLabel: {
    fontSize: 12,
    color: '#708090',
  },
  prizeAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  prizeRemaining: {
    fontSize: 11,
    color: '#708090',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  loadingText: {
    color: '#E0E0E0',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
    padding: 20,
  },
  errorText: {
    color: '#FF4500',
    textAlign: 'center',
  },
});
```

---

## State Management Approach

### Decision: React Query (TanStack Query)

**Why React Query?**
1. **Built for server state**: Designed specifically for async data from APIs
2. **Automatic caching**: Reduces network requests, improves performance
3. **Background refetching**: Keeps data fresh without user action
4. **Optimistic updates**: Better UX for mutations
5. **DevTools**: Built-in debugging for queries
6. **Offline support**: Persists cache to AsyncStorage

### Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-persist-client
```

### Implementation

#### 3.1. Query Client Setup: `lib/queryClient.ts`

```typescript
// NEW FILE - React Query configuration

import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache queries for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Keep cached data for 1 hour
      gcTime: 60 * 60 * 1000,

      // Retry failed requests 2 times
      retry: 2,

      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (when user returns to app)
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
  },
});

// Persister for offline support
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'SCRATCH_ORACLE_QUERY_CACHE',
  throttleTime: 1000, // Save to storage max once per second
});
```

#### 3.2. Custom Hooks for Data Fetching: `hooks/useGames.ts`

```typescript
// NEW FILE - React Query hooks for game data

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SupabaseLotteryService } from '../services/lottery/supabaseLotteryService';
import { MinnesotaLotteryService } from '../services/lottery/minnesotaData';
import { FeatureFlagService } from '../services/config/featureFlags';
import type { LotteryGame } from '../types/lottery';

/**
 * Hook: Fetch all active games with AI predictions
 */
export function useActiveGames() {
  return useQuery<LotteryGame[], Error>({
    queryKey: ['games', 'active'],
    queryFn: async () => {
      const service = FeatureFlagService.useSupabase()
        ? SupabaseLotteryService
        : MinnesotaLotteryService;

      return service.getActiveGames();
    },
    // Refetch every 1 hour
    refetchInterval: 60 * 60 * 1000,
  });
}

/**
 * Hook: Fetch single game details
 */
export function useGameDetails(gameId: string | undefined) {
  return useQuery<LotteryGame | null, Error>({
    queryKey: ['games', gameId],
    queryFn: async () => {
      if (!gameId) return null;

      const service = FeatureFlagService.useSupabase()
        ? SupabaseLotteryService
        : MinnesotaLotteryService;

      return service.getGameById(gameId);
    },
    enabled: !!gameId, // Only run if gameId is provided
    // Keep individual game data fresh for 30 minutes
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook: Prefetch game details (for better UX when user taps game)
 */
export function usePrefetchGame() {
  const queryClient = useQueryClient();

  return (gameId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['games', gameId],
      queryFn: async () => {
        const service = FeatureFlagService.useSupabase()
          ? SupabaseLotteryService
          : MinnesotaLotteryService;

        return service.getGameById(gameId);
      },
    });
  };
}
```

#### 3.3. App Provider Wrapper: `App.tsx` (Updated)

```typescript
// MODIFY App.tsx to wrap with QueryClientProvider

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './lib/queryClient';

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {/* Existing app content */}
      <YourAppContent />
    </PersistQueryClientProvider>
  );
}
```

#### 3.4. Usage in Components

```typescript
// Example: Using the hook in a component

import { useActiveGames } from '../hooks/useGames';

function RecommendationsScreen() {
  const { data: games, isLoading, error, refetch } = useActiveGames();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <FlatList
      data={games}
      renderItem={({ item }) => <GameCard game={item} />}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    />
  );
}
```

---

## UI Enhancements for AI Scores

### Design Mockups (Text Descriptions)

#### 1. Game Card with AI Badge

```
┌─────────────────────────────────────────┐
│ #1 Lucky 7s                        $5   │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ AI Score            85/100          │ │
│ │ ─────────────────────────────────── │ │
│ │ 92% confidence                      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Expected Value: +$2.34                  │
├─────────────────────────────────────────┤
│ [STRONG BUY]                            │
│                                         │
│ Why this game:                          │
│ • AI predicts 85% win probability       │
│ • High confidence recommendation        │
│ • Top prize still available ($100,000)  │
│ • Fresh game with most prizes remaining │
└─────────────────────────────────────────┘
```

#### 2. AI Score Indicator States

**High Score (80-100)**: Green circle, pulsing animation
```
   ╔═══╗
   ║ 85║  ← Pulsing green glow
   ╚═══╝
  AI Score
```

**Medium Score (60-79)**: Gold/yellow, steady
```
   ╔═══╗
   ║ 72║  ← Gold color
   ╚═══╝
  AI Score
```

**Low Score (0-59)**: Orange/red, warning
```
   ╔═══╗
   ║ 42║  ← Orange/red
   ╚═══╝
  AI Score
```

#### 3. Recommendation Badge Styles

```
[STRONG BUY]    - Bright green (#00FF7F), bold
[BUY]           - Light green (#7FFF00)
[NEUTRAL]       - Gold (#FFD700)
[AVOID]         - Orange (#FFA500)
[STRONG AVOID]  - Red (#FF4500), warning icon
```

#### 4. Confidence Level Display

```
Confidence:  ████████░░  82%
            ↑
    Progress bar visualization
```

#### 5. AI Reasoning Tooltip/Expandable

```
┌─────────────────────────────────────┐
│ AI Analysis (tap to expand)         │
├─────────────────────────────────────┤
│ "This game shows strong momentum    │
│ with 3 top prizes claimed in the    │
│ last 7 days. Historical patterns    │
│ suggest increased winning odds      │
│ during this phase."                 │
└─────────────────────────────────────┘
```

### Component Structure

```typescript
// AI Score Badge Component
<AIScoreBadge
  score={85}
  confidence={92}
  recommendation="strong_buy"
  showDetails={true}
/>

// Renders to:
<View style={styles.aiScoreBadge}>
  <CircularProgress
    value={85}
    maxValue={100}
    color={getScoreColor(85)}
    animate={true}
  />
  <View>
    <Text>85/100</Text>
    <Text>92% confidence</Text>
  </View>
  <RecommendationBadge type="strong_buy" />
</View>
```

---

## Loading States & Error Handling

### Loading Strategy: Skeleton Screens

**Why Skeletons > Spinners?**
- Show layout structure immediately
- Reduce perceived loading time
- Match Vegas neon theme with shimmer effect

#### Implementation

```typescript
// NEW FILE: components/common/SkeletonCard.tsx

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export function SkeletonGameCard() {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonLine, styles.title, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.subtitle, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.score, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, styles.button, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  skeletonLine: {
    backgroundColor: '#2E2E3F',
    borderRadius: 4,
    marginBottom: 12,
  },
  title: {
    height: 20,
    width: '70%',
  },
  subtitle: {
    height: 16,
    width: '50%',
  },
  score: {
    height: 60,
    width: '100%',
  },
  button: {
    height: 40,
    width: '100%',
  },
});
```

### Error Handling Strategy

#### 1. Network Errors

```typescript
// Error component with retry
function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>📡</Text>
      <Text style={styles.errorTitle}>Connection Issue</Text>
      <Text style={styles.errorMessage}>
        Unable to load lottery data. Check your connection.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### 2. Exponential Backoff for Retries

```typescript
// Built into React Query config (already in queryClient.ts)
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)

// Retry schedule:
// 1st retry: 1 second
// 2nd retry: 2 seconds
// 3rd retry: 4 seconds (max 30s)
```

#### 3. Graceful Degradation

```typescript
// If AI scores fail to load, fall back to EV-only recommendations
function RecommendationCard({ game }: { game: LotteryGame }) {
  const hasAIScore = game.ai_score !== undefined;

  return (
    <View>
      {hasAIScore ? (
        <AIScoreBadge score={game.ai_score} />
      ) : (
        <View style={styles.evOnlyBadge}>
          <Text>EV-Based Recommendation</Text>
        </View>
      )}
    </View>
  );
}
```

#### 4. Error Boundaries

```typescript
// NEW FILE: components/common/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#0A0A0F',
    fontWeight: 'bold',
  },
});
```

---

## Offline Caching Strategy

### Goals
1. App works without internet (displays last fetched data)
2. Automatic sync when connection restored
3. Visual indicator of data freshness
4. Background refresh every hour

### Implementation

#### 1. Cache Persistence (Already configured in React Query)

```typescript
// From queryClient.ts
staleTime: 5 * 60 * 1000,      // Data fresh for 5 minutes
gcTime: 60 * 60 * 1000,        // Keep in cache for 1 hour
refetchOnReconnect: true,       // Auto-sync on reconnect
```

#### 2. Network Status Detection

```typescript
// NEW FILE: hooks/useNetworkStatus.ts

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOffline: !isConnected || !isInternetReachable,
  };
}
```

#### 3. Offline Indicator UI

```typescript
// Component to show when offline
function OfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>
        📡 Offline - Showing cached data
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: '#0A0A0F',
    textAlign: 'center',
    fontWeight: '600',
  },
});
```

#### 4. Data Freshness Indicator

```typescript
// Show when data was last updated
function DataFreshnessLabel({ updatedAt }: { updatedAt: string }) {
  const timeAgo = useTimeAgo(updatedAt);

  return (
    <Text style={styles.freshness}>
      Updated {timeAgo}
    </Text>
  );
}

function useTimeAgo(timestamp: string): string {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = Date.now();
      const then = new Date(timestamp).getTime();
      const diff = now - then;

      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (minutes < 1) {
        setTimeAgo('just now');
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}m ago`);
      } else if (hours < 24) {
        setTimeAgo(`${hours}h ago`);
      } else {
        setTimeAgo('over 1 day ago');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
}
```

#### 5. Background Sync

```typescript
// Already configured in React Query
refetchInterval: 60 * 60 * 1000, // Refetch every 1 hour

// Or use Expo Background Fetch (for when app is backgrounded)
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-data-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Fetch latest data
    await queryClient.refetchQueries({ queryKey: ['games', 'active'] });
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background task
async function registerBackgroundFetch() {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 60, // 1 hour
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

---

## Performance Optimization

### Goals
- Initial load: <2 seconds
- Cached responses: <500ms
- Smooth 60fps scrolling
- Minimal re-renders

### Strategies

#### 1. Query Optimization

```typescript
// Prefetch data before user needs it
const prefetchGame = usePrefetchGame();

<TouchableOpacity
  onPress={() => navigateToGame(game.id)}
  onPressIn={() => prefetchGame(game.id)} // Prefetch on touch down
>
  <GameCard game={game} />
</TouchableOpacity>
```

#### 2. Memoization

```typescript
// Memoize expensive components
const GameCard = React.memo(({ game }: { game: LotteryGame }) => {
  // ... component code
}, (prevProps, nextProps) => {
  // Only re-render if game ID changes
  return prevProps.game.id === nextProps.game.id;
});

// Memoize expensive calculations
const sortedGames = useMemo(() => {
  return games.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
}, [games]);
```

#### 3. FlatList Optimization

```typescript
<FlatList
  data={games}
  renderItem={renderGame}
  keyExtractor={(item) => item.id}

  // Performance props
  removeClippedSubviews={true}        // Unmount off-screen views
  maxToRenderPerBatch={5}             // Render 5 items per batch
  windowSize={10}                     // Keep 10 screens of items in memory
  initialNumToRender={5}              // Render 5 items initially
  getItemLayout={(data, index) => ({  // Skip measurement for known sizes
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}

  // Use React.memo for renderItem
  renderItem={renderGame}
/>
```

#### 4. Image Optimization (if using game images)

```typescript
import { Image } from 'expo-image'; // Instead of react-native Image

<Image
  source={{ uri: game.imageUrl }}
  style={styles.gameImage}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk" // Cache images
/>
```

#### 5. Database Query Optimization

**Use database view for common queries**:
```sql
-- Already exists: active_games_with_predictions
-- Joins games + predictions in single query
-- Add index for fast lookups:
CREATE INDEX idx_predictions_latest
ON predictions(game_id, prediction_date DESC);
```

#### 6. Bundle Size Optimization

```json
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: true, // Preserve for debugging
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
};
```

---

## Migration Strategy

### Phase 1: Setup (Week 1)

**Goal**: Install dependencies, create new service layer

- [ ] Install React Query: `npm install @tanstack/react-query`
- [ ] Install persist: `npm install @tanstack/react-query-persist-client`
- [ ] Install NetInfo: `npm install @react-native-community/netinfo`
- [ ] Create `lib/queryClient.ts`
- [ ] Create `services/lottery/supabaseLotteryService.ts`
- [ ] Create `services/config/featureFlags.ts`
- [ ] Create `hooks/useGames.ts`
- [ ] Test Supabase connection in isolation

**Success Criteria**:
- Can fetch games from Supabase successfully
- Feature flags working (can toggle mock/real)
- React Query caching observable in DevTools

### Phase 2: Parallel Testing (Week 2)

**Goal**: Run mock and Supabase side-by-side, compare results

- [ ] Add feature flag UI in Settings (toggle Supabase on/off)
- [ ] Log comparison between mock and Supabase data
- [ ] Verify AI scores load correctly
- [ ] Test offline mode (airplane mode)
- [ ] Measure performance (loading times, memory)

**Testing Script**:
```typescript
// Compare mock vs Supabase data
async function compareMockVsSupabase() {
  const mockGames = await MinnesotaLotteryService.getActiveGames();
  const supabaseGames = await SupabaseLotteryService.getActiveGames();

  console.log('Mock games:', mockGames.length);
  console.log('Supabase games:', supabaseGames.length);

  // Validate structure
  mockGames.forEach(game => {
    console.assert(MinnesotaLotteryService.validateGameData(game));
  });

  supabaseGames.forEach(game => {
    console.assert(SupabaseLotteryService.validateGameData(game));
  });
}
```

### Phase 3: Gradual Rollout (Week 3)

**Goal**: Enable Supabase for subset of users

**A/B Testing Strategy**:
```typescript
// Enable Supabase for 10% of users
async function initializeFeatureFlags() {
  const userId = await getUserId();
  const cohort = hash(userId) % 100; // 0-99

  if (cohort < 10) {
    // 10% get Supabase
    await FeatureFlagService.enableSupabase();
  } else {
    // 90% stay on mock
    await FeatureFlagService.setFlags({ useSupabaseData: false });
  }
}
```

**Monitoring**:
- Track error rates (mock vs Supabase)
- Track performance metrics
- Collect user feedback
- Monitor Supabase API usage/costs

### Phase 4: Full Migration (Week 4)

**Goal**: 100% Supabase, remove mock data

- [ ] Enable Supabase for all users
- [ ] Monitor for 48 hours
- [ ] If stable, remove `services/lottery/minnesotaData.ts`
- [ ] Remove feature flags (always use Supabase)
- [ ] Clean up legacy code

**Rollback Plan**:
- Keep mock service for 1 month after migration
- Feature flag allows instant rollback if issues
- Database view ensures no schema changes needed

### Phase 5: Optimization (Ongoing)

**Goal**: Fine-tune performance, add advanced features

- [ ] Implement predictive prefetching
- [ ] Add real-time updates (Supabase Realtime)
- [ ] Optimize database queries (analyze slow queries)
- [ ] Add analytics (track which games users view most)
- [ ] A/B test UI variations (AI badge placement, colors)

---

## Database Schema Review

### Verified Tables (from Supabase)

#### 1. `games` Table
```sql
✓ id UUID PRIMARY KEY
✓ game_number VARCHAR (unique identifier)
✓ game_name VARCHAR (display name)
✓ ticket_price DECIMAL (e.g., 5.00)
✓ top_prize_amount DECIMAL (e.g., 100000.00)
✓ total_top_prizes INTEGER
✓ remaining_top_prizes INTEGER
✓ overall_odds VARCHAR (e.g., "1 in 3.45")
✓ is_active BOOLEAN
✓ created_at TIMESTAMP
✓ updated_at TIMESTAMP
```

#### 2. `prize_tiers` Table
```sql
✓ id UUID PRIMARY KEY
✓ game_id UUID (FK to games)
✓ prize_amount DECIMAL
✓ total_prizes INTEGER
✓ remaining_prizes INTEGER
✓ odds VARCHAR
```

#### 3. `predictions` Table (AI SCORES)
```sql
✓ id UUID PRIMARY KEY
✓ game_id UUID (FK to games)
✓ prediction_date DATE
✓ ai_score DECIMAL(5,2)         ← 0-100 score
✓ win_probability DECIMAL(8,6)  ← 0.0-1.0
✓ confidence_level DECIMAL(4,2) ← 0-100
✓ recommendation VARCHAR        ← strong_buy, buy, neutral, avoid, strong_avoid
✓ reasoning TEXT                ← Human-readable explanation
✓ model_version VARCHAR
✓ features_used JSONB
```

### Key Database View

```sql
-- This view should exist (or create it):
CREATE OR REPLACE VIEW active_games_with_predictions AS
SELECT
  g.*,
  p.ai_score,
  p.win_probability,
  p.confidence_level,
  p.recommendation,
  p.reasoning,
  p.prediction_date,

  -- Aggregate prize tiers into JSON array
  (
    SELECT json_agg(
      json_build_object(
        'prize_amount', pt.prize_amount,
        'total_prizes', pt.total_prizes,
        'remaining_prizes', pt.remaining_prizes,
        'odds', pt.odds
      )
    )
    FROM prize_tiers pt
    WHERE pt.game_id = g.id
  ) as prize_tiers

FROM games g
LEFT JOIN LATERAL (
  SELECT *
  FROM predictions
  WHERE game_id = g.id
  ORDER BY prediction_date DESC
  LIMIT 1
) p ON true
WHERE g.is_active = true
ORDER BY p.ai_score DESC NULLS LAST;
```

### Required Indexes

```sql
-- Ensure these indexes exist for performance:
CREATE INDEX IF NOT EXISTS idx_games_active
ON games(is_active, state);

CREATE INDEX IF NOT EXISTS idx_predictions_latest
ON predictions(game_id, prediction_date DESC);

CREATE INDEX IF NOT EXISTS idx_prize_tiers_game
ON prize_tiers(game_id);
```

---

## Testing Plan

### Unit Tests

```typescript
// tests/services/supabaseLotteryService.test.ts

import { SupabaseLotteryService } from '../services/lottery/supabaseLotteryService';

describe('SupabaseLotteryService', () => {
  it('should fetch active games', async () => {
    const games = await SupabaseLotteryService.getActiveGames();
    expect(games.length).toBeGreaterThan(0);
    expect(games[0]).toHaveProperty('id');
    expect(games[0]).toHaveProperty('name');
    expect(games[0]).toHaveProperty('ai_score');
  });

  it('should fetch game by ID', async () => {
    const games = await SupabaseLotteryService.getActiveGames();
    const firstGame = games[0];

    const game = await SupabaseLotteryService.getGameById(firstGame.id);
    expect(game).not.toBeNull();
    expect(game?.id).toBe(firstGame.id);
  });

  it('should validate game data', () => {
    const validGame = {
      id: 'test-id',
      name: 'Test Game',
      price: 5,
      overall_odds: '1 in 3',
      status: 'Active',
      prizes: [
        { tier: 'Top', amount: 100000, total: 5, remaining: 3 }
      ],
      launch_date: '2025-01-01',
      last_updated: '2025-01-15',
    };

    expect(SupabaseLotteryService.validateGameData(validGame)).toBe(true);
  });
});
```

### Integration Tests

```typescript
// tests/integration/recommendations.test.ts

import { RecommendationEngine } from '../services/recommendations/recommendationEngine';
import { FeatureFlagService } from '../services/config/featureFlags';

describe('Recommendations with Supabase', () => {
  beforeAll(async () => {
    await FeatureFlagService.initialize();
    await FeatureFlagService.enableSupabase();
  });

  it('should return recommendations with AI scores', async () => {
    const recs = await RecommendationEngine.getRecommendations(20);

    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].game.ai_score).toBeDefined();
    expect(recs[0].game.confidence).toBeDefined();
    expect(recs[0].reasons).toContain(/AI/i); // Should mention AI in reasons
  });

  it('should blend EV and AI scores', async () => {
    const recs = await RecommendationEngine.getRecommendations(50);

    // Top recommendation should consider both EV and AI
    const topRec = recs[0];
    expect(topRec.score).toBeGreaterThan(50); // Blended score
  });
});
```

### E2E Tests (Manual)

**Test Script**:
1. **Cold Start Test**
   - Close app completely
   - Enable airplane mode
   - Open app
   - ✓ Should show cached data
   - ✓ Should display "Offline" banner
   - Disable airplane mode
   - ✓ Should auto-sync within 5 seconds

2. **AI Score Display Test**
   - Navigate to home screen
   - ✓ Each game card should show AI score badge
   - ✓ AI score should be 0-100
   - ✓ Confidence should be 0-100%
   - ✓ Recommendation badge should be color-coded

3. **Performance Test**
   - Clear app cache
   - Start timer
   - Open app
   - ✓ Initial load should complete in <2 seconds
   - ✓ Scroll should be smooth (60fps)
   - ✓ Game detail load should be <500ms

4. **Error Handling Test**
   - Enable airplane mode
   - Pull to refresh
   - ✓ Should show error message
   - ✓ Should offer "Retry" button
   - Enable connection
   - Tap "Retry"
   - ✓ Should successfully fetch data

---

## Implementation Timeline

### Week 1: Foundation (20 hours)

**Day 1-2: Setup**
- [ ] Install dependencies (React Query, NetInfo)
- [ ] Create `queryClient.ts`
- [ ] Create `featureFlags.ts`
- [ ] Test Supabase connection

**Day 3-4: Data Service**
- [ ] Create `supabaseLotteryService.ts`
- [ ] Create `useGames.ts` hooks
- [ ] Update type definitions
- [ ] Write unit tests

**Day 5: Integration**
- [ ] Update `recommendationEngine.ts`
- [ ] Test mock vs Supabase side-by-side
- [ ] Fix any bugs

### Week 2: UI Enhancement (25 hours)

**Day 1-2: Components**
- [ ] Create `AIScoreBadge.tsx`
- [ ] Create `SkeletonCard.tsx`
- [ ] Create `ErrorBoundary.tsx`
- [ ] Create `OfflineBanner.tsx`

**Day 3-4: Screens**
- [ ] Update `App.tsx` with AI badges
- [ ] Create `AIPredictionsWithScoresScreen.tsx`
- [ ] Update existing screens to use hooks
- [ ] Add loading states everywhere

**Day 5: Polish**
- [ ] Add animations (shimmer, pulsing)
- [ ] Color-code AI scores
- [ ] Test on real device

### Week 3: Testing & Optimization (20 hours)

**Day 1-2: Testing**
- [ ] Write integration tests
- [ ] Manual E2E testing
- [ ] Fix bugs
- [ ] Performance profiling

**Day 3-4: Optimization**
- [ ] Optimize FlatList rendering
- [ ] Add prefetching
- [ ] Optimize database queries
- [ ] Reduce bundle size

**Day 5: A/B Test Prep**
- [ ] Set up feature flag rollout
- [ ] Add analytics tracking
- [ ] Create monitoring dashboard

### Week 4: Migration (15 hours)

**Day 1-2: Gradual Rollout**
- [ ] Enable for 10% of users
- [ ] Monitor error rates
- [ ] Collect feedback
- [ ] Fix issues

**Day 3-4: Full Rollout**
- [ ] Enable for 50% of users
- [ ] Monitor for 24 hours
- [ ] Enable for 100% if stable
- [ ] Monitor for 48 hours

**Day 5: Cleanup**
- [ ] Remove mock data service (keep backed up)
- [ ] Remove feature flags
- [ ] Update documentation
- [ ] Celebrate! 🎉

---

## Success Metrics

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load Time | <2s | Time to display first game |
| Cached Response | <500ms | Time to display from cache |
| API Response Time | <1s | Supabase query execution |
| FPS During Scroll | 60fps | React DevTools Profiler |
| Bundle Size Increase | <100KB | Metro bundler output |
| Memory Usage | <150MB | Android Profiler |

### Data Quality Targets

| Metric | Target | Validation |
|--------|--------|------------|
| Games Available | 41 | Count from Supabase |
| AI Score Coverage | 100% | All games have predictions |
| Confidence Level | >70% | Average across all predictions |
| Data Freshness | <24h | `last_scraped_at` timestamp |
| Cache Hit Rate | >80% | React Query DevTools |

### User Experience Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Crash Rate | 0% | Sentry/Crashlytics |
| Error Rate | <1% | Failed API calls / total |
| Offline Capability | 100% | Works without network |
| Loading Perception | <1s | Skeleton appears immediately |
| User Satisfaction | 4.5+ stars | Play Store rating |

---

## Rollback Plan

### If Issues Arise

**Instant Rollback** (Feature Flag):
```typescript
// In Settings or Admin Panel
await FeatureFlagService.setFlags({
  useSupabaseData: false,
  enableAIScores: false,
});
```

**Emergency Rollback** (Code):
```typescript
// In recommendationEngine.ts
private static getDataService() {
  // Force mock data
  return MinnesotaLotteryService;

  // Original code:
  // return FeatureFlagService.useSupabase()
  //   ? SupabaseLotteryService
  //   : MinnesotaLotteryService;
}
```

**Full Rollback** (Git):
```bash
# Revert to pre-integration commit
git revert <integration-commit-hash>
git push origin main
```

### Monitoring Alerts

Set up alerts for:
- API error rate >5%
- Response time >3s (95th percentile)
- Crash rate >0.1%
- Negative user reviews mentioning "broken" or "not working"

---

## Questions & Answers

### Q: What if Supabase goes down?
**A**: React Query cache persists data to AsyncStorage. Users can still view last fetched data offline. Add fallback to mock data if cache is empty.

### Q: How much will Supabase cost?
**A**: Free tier supports:
- 500MB database
- 1GB file storage
- 2GB data transfer
- 50,000 monthly active users

For 41 games with predictions, estimate ~10MB of data. Well within free tier.

### Q: Can we update predictions in real-time?
**A**: Yes! Use Supabase Realtime:
```typescript
supabase
  .channel('predictions')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'predictions' },
    (payload) => {
      // Update React Query cache
      queryClient.setQueryData(['games', payload.new.game_id], payload.new);
    }
  )
  .subscribe();
```

### Q: How do we populate AI scores initially?
**A**: Two options:
1. **Batch Script**: Run Python ML model on historical data, insert predictions
2. **Gradual**: Start with EV-based scores, train ML model over 3-6 months

### Q: What if a game has no AI prediction yet?
**A**: Graceful fallback:
```typescript
const aiScore = game.ai_score ?? calculateFallbackScore(game.ev);
```

---

## Conclusion

This integration plan provides a **comprehensive, step-by-step roadmap** for connecting the Scratch Oracle app to real Supabase data and AI predictions.

### Key Takeaways

1. **Use React Query**: Best tool for server state, caching, and offline support
2. **Feature Flags**: Enable gradual rollout and instant rollback
3. **Graceful Degradation**: App works without AI scores, without internet
4. **Performance First**: Skeleton screens, prefetching, memoization
5. **Migration in Phases**: Test thoroughly before full rollout

### Next Steps

1. **Review this plan** with team/stakeholders
2. **Set up Supabase project** (if not already done)
3. **Verify database schema** matches plan
4. **Install dependencies** (Week 1, Day 1)
5. **Begin implementation** following timeline

### Estimated Effort

- **Total**: 80 hours (~2 weeks full-time, 4 weeks part-time)
- **Risk**: Low (feature flags allow rollback)
- **Impact**: High (real data + AI scores = killer feature)

---

**Ready to implement?** Start with Week 1, Day 1: Install dependencies and create `queryClient.ts`.

**Questions?** Review the Q&A section or create GitHub issues for clarification.

**Good luck!** 🚀
