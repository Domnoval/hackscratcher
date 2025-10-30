import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { pinnedFetch } from '../services/security/certificatePinning';
import { validate, ValidationError } from '../services/validation/validator';
import { SupabaseResponseSchema, SupabaseArrayResponseSchema, UUIDSchema } from '../services/validation/schemas';
import { sanitizeString, sanitizeNumber } from '../services/validation/sanitizer';

// Get environment variables from expo-constants
// In development: loaded from .env via app.config.js
// In production: loaded from EAS secrets via app.config.js
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Debug logging to help diagnose env var issues
console.log('[Supabase] Environment check:', {
  hasExpoConfig: !!Constants.expoConfig,
  hasExtra: !!Constants.expoConfig?.extra,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'MISSING',
});

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage =
    'Missing Supabase environment variables.\n' +
    'Supabase URL: ' + (supabaseUrl ? 'OK' : 'MISSING') + '\n' +
    'Supabase Key: ' + (supabaseAnonKey ? 'OK' : 'MISSING') + '\n' +
    'Constants.expoConfig: ' + (Constants.expoConfig ? 'exists' : 'MISSING') + '\n' +
    'Constants.expoConfig.extra: ' + (Constants.expoConfig?.extra ? 'exists' : 'MISSING');

  console.error('[Supabase] ' + errorMessage);
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Use custom fetch with SSL certificate pinning for all Supabase requests
    fetch: pinnedFetch as unknown as typeof fetch,
  },
});

// =====================================================
// Database Types (Auto-generated from schema)
// =====================================================

export interface Game {
  id: string;
  game_number: string;
  game_name: string;
  ticket_price: number;
  top_prize_amount: number;
  total_top_prizes: number;
  remaining_top_prizes: number;
  overall_odds?: string;
  game_start_date?: string;
  game_end_date?: string;
  is_active: boolean;
  total_tickets_printed?: number;
  tickets_remaining_estimate?: number;
  state: string;
  created_at: string;
  updated_at: string;
  last_scraped_at?: string;
}

export interface PrizeTier {
  id: string;
  game_id: string;
  prize_amount: number;
  total_prizes: number;
  remaining_prizes: number;
  odds?: string;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  game_id: string;
  prediction_date: string;
  ai_score: number; // 0-100
  win_probability?: number; // 0.0 - 1.0
  expected_value?: number;
  confidence_level?: number; // 0-100
  model_version?: string;
  features_used?: Record<string, any>;
  recommendation?: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid';
  reasoning?: string;
  created_at: string;
}

export interface Store {
  id: string;
  store_name: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  total_wins_reported: number;
  total_top_prize_wins: number;
  last_win_date?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Win {
  id: string;
  game_id?: string;
  store_id?: string;
  prize_amount: number;
  win_date: string;
  claimed_date?: string;
  source?: string;
  source_url?: string;
  is_verified: boolean;
  created_at: string;
}

export interface UserScan {
  id: string;
  user_id?: string;
  game_id?: string;
  store_id?: string;
  scan_date: string;
  was_winner?: boolean;
  prize_amount?: number;
  device_id?: string;
  app_version?: string;
  created_at: string;
}

// =====================================================
// API Helper Functions
// =====================================================

/**
 * Fetch all active games with their latest AI predictions
 * Now validates response data structure
 */
export async function getActiveGamesWithPredictions() {
  const { data, error } = await supabase
    .from('active_games_with_predictions')
    .select('*')
    .order('ai_score', { ascending: false });

  // Validate response structure
  const response = { data, error };
  validate(SupabaseArrayResponseSchema, response, 'getActiveGamesWithPredictions');

  if (error) {
    console.error('Error fetching games:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch a specific game by ID with all details
 * Now validates game ID input and response data
 */
export async function getGameDetails(gameId: string) {
  // Validate and sanitize game ID
  const validGameId = sanitizeString(gameId, 100);

  if (!validGameId) {
    throw new Error('Invalid game ID provided');
  }

  const [gameResult, prizeTiersResult, latestPrediction] = await Promise.all([
    supabase.from('games').select('*').eq('id', validGameId).single(),
    supabase.from('prize_tiers').select('*').eq('game_id', validGameId),
    supabase
      .from('predictions')
      .select('*')
      .eq('game_id', validGameId)
      .order('prediction_date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Validate responses
  validate(SupabaseResponseSchema, gameResult, 'getGameDetails.game');
  validate(SupabaseArrayResponseSchema, prizeTiersResult, 'getGameDetails.prizeTiers');
  validate(SupabaseResponseSchema, latestPrediction, 'getGameDetails.prediction');

  if (gameResult.error) throw gameResult.error;

  return {
    game: gameResult.data,
    prizeTiers: prizeTiersResult.data || [],
    prediction: latestPrediction.data || null,
  };
}

/**
 * Fetch top performing stores near a location
 * Now validates coordinate inputs
 */
export async function getTopStoresNearby(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
) {
  // Validate and sanitize coordinates
  const validLatitude = sanitizeNumber(latitude, -90, 90);
  const validLongitude = sanitizeNumber(longitude, -180, 180);
  const validRadius = sanitizeNumber(radiusMiles, 1, 500);

  // Note: This uses the helper function we created in SQL
  const { data, error } = await supabase.rpc('get_stores_within_radius', {
    lat: validLatitude,
    lng: validLongitude,
    radius: validRadius,
  });

  // Validate response
  validate(SupabaseArrayResponseSchema, { data, error }, 'getTopStoresNearby');

  if (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }

  return data;
}

/**
 * Log a user ticket scan
 * Now validates scan data before insertion
 */
export async function logTicketScan(scan: Omit<UserScan, 'id' | 'created_at'>) {
  // Sanitize string fields to prevent injection
  const sanitizedScan = {
    ...scan,
    user_id: scan.user_id ? sanitizeString(scan.user_id, 100) : undefined,
    game_id: scan.game_id ? sanitizeString(scan.game_id, 100) : undefined,
    store_id: scan.store_id ? sanitizeString(scan.store_id, 100) : undefined,
    device_id: scan.device_id ? sanitizeString(scan.device_id, 200) : undefined,
    app_version: scan.app_version ? sanitizeString(scan.app_version, 50) : undefined,
    prize_amount: scan.prize_amount !== undefined
      ? sanitizeNumber(scan.prize_amount, 0, 10000000)
      : undefined,
  };

  const { data, error } = await supabase
    .from('user_scans')
    .insert(sanitizedScan)
    .select()
    .single();

  // Validate response
  validate(SupabaseResponseSchema, { data, error }, 'logTicketScan');

  if (error) {
    console.error('Error logging scan:', error);
    throw error;
  }

  return data;
}

/**
 * Get historical trend for a game
 * Now validates inputs
 */
export async function getGameTrend(gameId: string, days: number = 30) {
  // Validate and sanitize inputs
  const validGameId = sanitizeString(gameId, 100);
  const validDays = sanitizeNumber(days, 1, 365);

  if (!validGameId) {
    throw new Error('Invalid game ID provided');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - validDays);

  const { data, error } = await supabase
    .from('historical_snapshots')
    .select('*')
    .eq('game_id', validGameId)
    .gte('snapshot_date', cutoffDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  // Validate response
  validate(SupabaseArrayResponseSchema, { data, error }, 'getGameTrend');

  if (error) {
    console.error('Error fetching trend:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's scan history
 * Now validates inputs
 */
export async function getUserScanHistory(userId: string, limit: number = 50) {
  // Validate and sanitize inputs
  const validUserId = sanitizeString(userId, 100);
  const validLimit = sanitizeNumber(limit, 1, 1000);

  if (!validUserId) {
    throw new Error('Invalid user ID provided');
  }

  const { data, error } = await supabase
    .from('user_scans')
    .select('*, games(game_name, ticket_price)')
    .eq('user_id', validUserId)
    .order('scan_date', { ascending: false })
    .limit(validLimit);

  // Validate response
  validate(SupabaseArrayResponseSchema, { data, error }, 'getUserScanHistory');

  if (error) {
    console.error('Error fetching scan history:', error);
    throw error;
  }

  return data;
}
