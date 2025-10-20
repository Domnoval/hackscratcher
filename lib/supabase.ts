import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
 */
export async function getActiveGamesWithPredictions() {
  const { data, error } = await supabase
    .from('active_games_with_predictions')
    .select('*')
    .order('ai_score', { ascending: false });

  if (error) {
    console.error('Error fetching games:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch a specific game by ID with all details
 */
export async function getGameDetails(gameId: string) {
  const [gameResult, prizeTiersResult, latestPrediction] = await Promise.all([
    supabase.from('games').select('*').eq('id', gameId).single(),
    supabase.from('prize_tiers').select('*').eq('game_id', gameId),
    supabase
      .from('predictions')
      .select('*')
      .eq('game_id', gameId)
      .order('prediction_date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (gameResult.error) throw gameResult.error;

  return {
    game: gameResult.data,
    prizeTiers: prizeTiersResult.data || [],
    prediction: latestPrediction.data || null,
  };
}

/**
 * Fetch top performing stores near a location
 */
export async function getTopStoresNearby(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
) {
  // Note: This uses the helper function we created in SQL
  const { data, error } = await supabase.rpc('get_stores_within_radius', {
    lat: latitude,
    lng: longitude,
    radius: radiusMiles,
  });

  if (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }

  return data;
}

/**
 * Log a user ticket scan
 */
export async function logTicketScan(scan: Omit<UserScan, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('user_scans').insert(scan).select().single();

  if (error) {
    console.error('Error logging scan:', error);
    throw error;
  }

  return data;
}

/**
 * Get historical trend for a game
 */
export async function getGameTrend(gameId: string, days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from('historical_snapshots')
    .select('*')
    .eq('game_id', gameId)
    .gte('snapshot_date', cutoffDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) {
    console.error('Error fetching trend:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's scan history
 */
export async function getUserScanHistory(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('user_scans')
    .select('*, games(game_name, ticket_price)')
    .eq('user_id', userId)
    .order('scan_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching scan history:', error);
    throw error;
  }

  return data;
}
