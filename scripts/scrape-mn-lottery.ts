/**
 * Minnesota Lottery Scraper - API Edition
 *
 * Fetches real data from MN Lottery's public API
 * Updates Supabase database with latest prize information
 *
 * Run manually: npm run scrape
 * Or deploy as Vercel cron job (see vercel.json)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// =====================================================
// Configuration
// =====================================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// MN Lottery API endpoints (discovered via network inspection)
const API_BASE = 'https://gateway.gameon.mnlottery.com';
const SCRATCH_GAMES_API = `${API_BASE}/services/game/api/published-games`;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// Types (based on actual API response)
// =====================================================

interface APIGame {
  gameId: string;
  gameName: string;
  gameNumber?: string;
  ticketPrice?: number;
  price?: number;
  topPrize?: number;
  topPrizeAmount?: number;
  overallOdds?: string;
  playEndDate?: string;
  playEnd?: string;
  prizeTable?: APIPrizeTier[];
  [key: string]: any; // Allow other fields we haven't discovered yet
}

interface APIPrizeTier {
  prizeAmount: number;
  totalAvailable?: number;
  remaining?: number;
  totalPrizes?: number;
  remainingPrizes?: number;
  odds?: string;
}

// =====================================================
// API Fetching
// =====================================================

async function fetchGamesFromAPI(): Promise<APIGame[]> {
  console.log('📡 Fetching scratch games from MN Lottery API...');

  // gameTypeId=1 is scratch games
  // size=200 to get all games (instead of default 10)
  const url = `${SCRATCH_GAMES_API}?gameTypeId.in=1&sort=gameId,desc&size=200`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ScratchOracle/1.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Received data from API`);

  // The API may return paginated data
  let games: APIGame[] = [];

  if (Array.isArray(data)) {
    games = data;
  } else if (data.content && Array.isArray(data.content)) {
    // Spring Boot pagination format
    games = data.content;
    console.log(`📄 Page ${data.number + 1} of ${data.totalPages} (${data.totalElements} total games)`);
  } else if (data.games || data.data) {
    games = data.games || data.data;
  } else {
    console.warn('⚠️  Unexpected API response format');
    console.log('Response keys:', Object.keys(data));
    console.log('Response preview:', JSON.stringify(data).substring(0, 500));
    return [];
  }

  console.log(`📦 Found ${games.length} scratch games`);

  // Debug: show first game structure
  if (games.length > 0) {
    console.log('\n🔍 First game structure:');
    console.log(JSON.stringify(games[0], null, 2).substring(0, 800));
  }

  return games;
}

// =====================================================
// Database Operations
// =====================================================

async function upsertGame(game: APIGame) {
  // Extract top prize info from prize table if available
  const topPrize = game.prizeTable && game.prizeTable.length > 0
    ? game.prizeTable.reduce((max, prize) => prize.prizeAmount > max.prizeAmount ? prize : max)
    : null;

  const topPrizeAmount = game.topPrizeAmount || game.topPrize || topPrize?.prizeAmount || 0;
  const totalTopPrizes = topPrize?.totalAvailable || topPrize?.totalPrizes || 1; // Default to 1 if not available
  const remainingTopPrizes = topPrize?.remaining || topPrize?.remainingPrizes || 1; // Default to 1 if not available

  const gameName = game.gameName || game.name; // API uses "name" field
  const ticketPrice = game.ticketPrice || game.price || game.retailPrice || 0;
  const gameNumber = game.gameNumber || String(game.gameId);

  const { data, error } = await supabase
    .from('games')
    .upsert(
      {
        game_number: gameNumber,
        game_name: gameName,
        ticket_price: ticketPrice,
        top_prize_amount: topPrizeAmount,
        total_top_prizes: totalTopPrizes,
        remaining_top_prizes: remainingTopPrizes,
        overall_odds: game.overallOdds ? String(game.overallOdds) : null,
        game_end_date: game.playEndDate || game.playEnd,
        is_active: true, // All published games are active
        state: 'MN',
        last_scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'game_number',
      }
    )
    .select()
    .single();

  if (error) {
    console.error(`Error upserting game ${gameNumber} (${gameName}):`, error);
    throw error;
  }

  return data;
}

async function upsertPrizeTiers(gameId: string, prizes: APIPrizeTier[]) {
  if (!prizes || prizes.length === 0) return;

  // Delete existing prize tiers for this game
  await supabase.from('prize_tiers').delete().eq('game_id', gameId);

  // Insert new prize tiers
  const prizeTiers = prizes.map(prize => ({
    game_id: gameId,
    prize_amount: prize.prizeAmount,
    total_prizes: prize.totalPrizes,
    remaining_prizes: prize.remainingPrizes,
    odds: prize.odds,
  }));

  const { error } = await supabase.from('prize_tiers').insert(prizeTiers);

  if (error) {
    console.error(`Error upserting prize tiers for game ${gameId}:`, error);
  }
}

async function createSnapshot(gameId: string, game: APIGame) {
  const today = new Date().toISOString().split('T')[0];

  // Extract remaining prizes the same way upsertGame does
  const topPrize = game.prizeTable && game.prizeTable.length > 0
    ? game.prizeTable.reduce((max, prize) => prize.prizeAmount > max.prizeAmount ? prize : max)
    : null;

  const remainingTopPrizes = topPrize?.remaining || topPrize?.remainingPrizes || null;

  const { error } = await supabase
    .from('historical_snapshots')
    .upsert(
      {
        game_id: gameId,
        snapshot_date: today,
        remaining_top_prizes: remainingTopPrizes,
        tickets_remaining_estimate: null,
        days_since_launch: null,
        top_prize_depletion_rate: null,
        expected_value: null,
      },
      {
        onConflict: 'game_id,snapshot_date',
      }
    );

  if (error) {
    console.error(`Error creating snapshot for game ${gameId}:`, error);
  }
}

// =====================================================
// Main Execution
// =====================================================

async function main() {
  console.log('🎰 Starting Minnesota Lottery Scraper (API Edition)...\n');

  try {
    // Step 1: Fetch data from API
    const games = await fetchGamesFromAPI();

    if (games.length === 0) {
      console.warn('⚠️  No games found from API');
      return;
    }

    console.log(`\n📦 Found ${games.length} scratch games\n`);

    // Step 2: Update database
    console.log('💾 Updating database...\n');
    let successCount = 0;
    let errorCount = 0;

    for (const game of games) {
      try {
        // Extract fields for logging (same way upsertGame does it)
        const gameName = game.name || game.gameName || 'Unknown Game';
        const gameNumber = String(game.gameId || game.gameNumber || '???');
        const ticketPrice = game.retailPrice || game.price || game.ticketPrice || 0;

        const dbGame = await upsertGame(game);

        // Only create snapshot if we have prize table data
        if (game.prizeTable && game.prizeTable.length > 0) {
          await createSnapshot(dbGame.id, game);
        }

        // Also save prize tiers if available
        if (game.prizes && game.prizes.length > 0) {
          await upsertPrizeTiers(dbGame.id, game.prizes);
        }

        successCount++;
        console.log(
          `✅ ${gameName} (#${gameNumber}) - $${ticketPrice} - Saved to DB`
        );
      } catch (error) {
        errorCount++;
        const errorGameName = game.name || game.gameName || 'Unknown';
        console.error(`❌ ${errorGameName}:`, error);
      }
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SCRAPE COMPLETE');
    console.log('='.repeat(70));
    console.log(`✅ Success: ${successCount} games updated`);
    console.log(`❌ Errors: ${errorCount} games failed`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🗄️  Database: ${SUPABASE_URL.replace('https://', '').split('.')[0]}.supabase.co`);
    console.log('='.repeat(70));
  } catch (error) {
    console.error('\n❌ Scraper failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as scrapeMNLottery };
