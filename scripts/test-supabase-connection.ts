/**
 * Diagnostic Script: Test Supabase Connection and Database Access
 * Tests if we can query tables directly vs. view
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Query games table directly
  console.log('📋 Test 1: Query games table directly');
  try {
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(5);

    if (gamesError) {
      console.log('❌ Error querying games:', gamesError);
    } else {
      console.log(`✅ Success! Found ${games?.length || 0} games`);
      if (games && games.length > 0) {
        console.log('Sample game:', games[0].game_name);
      }
    }
  } catch (error) {
    console.log('❌ Exception:', error);
  }

  console.log('');

  // Test 2: Query predictions table directly
  console.log('📋 Test 2: Query predictions table directly');
  try {
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .limit(5);

    if (predError) {
      console.log('❌ Error querying predictions:', predError);
    } else {
      console.log(`✅ Success! Found ${predictions?.length || 0} predictions`);
    }
  } catch (error) {
    console.log('❌ Exception:', error);
  }

  console.log('');

  // Test 3: Query the view
  console.log('📋 Test 3: Query active_games_with_predictions view');
  try {
    const { data: viewData, error: viewError } = await supabase
      .from('active_games_with_predictions')
      .select('*')
      .limit(5);

    if (viewError) {
      console.log('❌ Error querying view:', viewError);
    } else {
      console.log(`✅ Success! Found ${viewData?.length || 0} games from view`);
      if (viewData && viewData.length > 0) {
        console.log('Sample game from view:', viewData[0].game_name);
      }
    }
  } catch (error) {
    console.log('❌ Exception:', error);
  }

  console.log('');

  // Test 4: Manual JOIN query (bypassing view)
  console.log('📋 Test 4: Manual JOIN query (games LEFT JOIN predictions)');
  try {
    const { data: joinData, error: joinError } = await supabase
      .from('games')
      .select(`
        *,
        predictions (
          ai_score,
          confidence_level,
          recommendation,
          reasoning,
          win_probability
        )
      `)
      .eq('is_active', true)
      .limit(5);

    if (joinError) {
      console.log('❌ Error with manual join:', joinError);
    } else {
      console.log(`✅ Success! Found ${joinData?.length || 0} games with manual join`);
      if (joinData && joinData.length > 0) {
        console.log('Sample game with join:', joinData[0].game_name);
      }
    }
  } catch (error) {
    console.log('❌ Exception:', error);
  }

  console.log('\n✅ Diagnostic complete!');
}

testConnection().catch(console.error);
