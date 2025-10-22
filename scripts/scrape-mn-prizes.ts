/**
 * Minnesota Lottery Prize Scraper
 *
 * Scrapes remaining prize data from MN Lottery's Unclaimed Prizes page
 * Updates games table with current remaining prize counts
 * Creates historical snapshots for ML training
 *
 * Run: npm run scrape:prizes:mn
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface PrizeData {
  gameNumber: string;
  gameName: string;
  prizeAmount: number;
  totalPrizes: number;
  remainingPrizes: number;
}

async function scrapeMNPrizes(): Promise<PrizeData[]> {
  console.log('🎰 Starting Minnesota Prize Scraper (Puppeteer Edition)...\n');
  console.log('🌐 Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('📡 Navigating to Unclaimed Prizes page...');
    await page.goto('https://www.mnlottery.com/games/unclaimed-prizes', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('⏳ Waiting for prize table to load...');

    // Wait for the scratch games widget to load
    await page.waitForSelector('#scratchUnclaimedPrizeWidget', { timeout: 30000 });

    // Give it extra time for JavaScript to populate the table
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Extracting prize data...');

    // Extract prize table data
    const prizeData = await page.evaluate(() => {
      const data: any[] = [];

      // Find the scratch games widget
      const widget = document.querySelector('#scratchUnclaimedPrizeWidget');
      if (!widget) return data;

      // Find all game cards (each game has its own card with a table)
      const gameCards = widget.querySelectorAll('.MuiCard-root');

      gameCards.forEach((card) => {
        // Extract game name and number from card title
        // Format: "$10 - 30 Days of Winning (2066)"
        const titleElement = card.querySelector('h3, .MuiTypography-h5');
        const titleText = titleElement?.textContent?.trim() || '';

        // Parse game number from title (in parentheses)
        const gameNumberMatch = titleText.match(/\((\d+)\)/);
        const gameNumber = gameNumberMatch ? gameNumberMatch[1] : '';

        // Parse game name (everything before the parentheses, after the price)
        const gameNameMatch = titleText.match(/\$\d+\s*-\s*(.+?)\s*\(/);
        const gameName = gameNameMatch ? gameNameMatch[1].trim() : '';

        if (!gameNumber) return; // Skip if we can't find game number

        // Find the prize table within this card
        const table = card.querySelector('.MuiTable-root');
        if (!table) return;

        // Find all prize rows in this table
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return; // Need at least Prize, Odds, Remaining

          // Extract prize data
          // Typical columns: Prize | Odds | Remaining
          const prizeText = cells[0]?.textContent?.trim() || '';
          const remainingText = cells[2]?.textContent?.trim() || '';

          // Parse prize amount (remove $ and commas)
          const prizeMatch = prizeText.match(/\$?([\d,]+)/);
          const prizeAmount = prizeMatch ? parseFloat(prizeMatch[1].replace(/,/g, '')) : 0;

          // Parse remaining count
          const remainingMatch = remainingText.match(/(\d+)/);
          const remainingPrizes = remainingMatch ? parseInt(remainingMatch[1], 10) : 0;

          if (prizeAmount > 0 && remainingPrizes >= 0) {
            data.push({
              gameNumber,
              gameName,
              prizeAmount,
              totalPrizes: 0,
              remainingPrizes,
            });
          }
        });
      });

      return data;
    });

    console.log(`✅ Extracted ${prizeData.length} prize records\n`);

    return prizeData;
  } finally {
    await browser.close();
    console.log('🔒 Browser closed\n');
  }
}

async function updateDatabase(prizeData: PrizeData[]): Promise<void> {
  console.log('💾 Updating database...\n');

  // Group by game number (a game can have multiple prize tiers)
  const gameMap = new Map<string, PrizeData[]>();

  prizeData.forEach((prize) => {
    const existing = gameMap.get(prize.gameNumber) || [];
    existing.push(prize);
    gameMap.set(prize.gameNumber, existing);
  });

  let updated = 0;
  let errors = 0;

  for (const [gameNumber, prizes] of gameMap.entries()) {
    try {
      // Find top prize (highest amount)
      const topPrize = prizes.reduce((max, p) =>
        p.prizeAmount > max.prizeAmount ? p : max
      );

      // Find the game in database
      const { data: existingGame, error: fetchError } = await supabase
        .from('games')
        .select('id, game_name')
        .eq('game_number', gameNumber)
        .eq('state', 'MN')
        .single();

      if (fetchError) {
        console.log(`⚠️  Game #${gameNumber} not found in database (may not be scraped yet)`);
        continue;
      }

      // Update game with top prize remaining count
      const { error: updateError } = await supabase
        .from('games')
        .update({
          remaining_top_prizes: topPrize.remainingPrizes,
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGame.id);

      if (updateError) throw updateError;

      // Create historical snapshot
      const today = new Date().toISOString().split('T')[0];
      const { error: snapshotError } = await supabase
        .from('historical_snapshots')
        .upsert(
          {
            game_id: existingGame.id,
            snapshot_date: today,
            remaining_top_prizes: topPrize.remainingPrizes,
            tickets_remaining_estimate: null,
            days_since_launch: null,
            top_prize_depletion_rate: null,
            expected_value: null,
          },
          {
            onConflict: 'game_id,snapshot_date',
          }
        );

      if (snapshotError) {
        console.error(`Error creating snapshot for game ${gameNumber}:`, snapshotError.message);
      }

      updated++;
      console.log(`✅ ${existingGame.game_name} (#${gameNumber}) - ${topPrize.remainingPrizes} top prizes left`);
    } catch (error: any) {
      errors++;
      console.error(`❌ Error updating game #${gameNumber}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 PRIZE SCRAPE COMPLETE');
  console.log('='.repeat(70));
  console.log(`✅ Updated: ${updated} games`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
}

async function main() {
  try {
    const prizeData = await scrapeMNPrizes();

    if (prizeData.length === 0) {
      console.warn('⚠️  No prize data found. Page structure may have changed.');
      process.exit(1);
    }

    await updateDatabase(prizeData);
  } catch (error: any) {
    console.error('\n❌ Prize scraper failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as scrapeMNPrizes };
