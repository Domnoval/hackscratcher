/**
 * Florida Lottery Prize Scraper
 *
 * Scrapes remaining prize data from FL Lottery's Top Remaining Prizes page
 * Updates games table with current remaining prize counts
 * Creates historical snapshots for ML training
 *
 * Run: npm run scrape:prizes:fl
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

async function scrapeFLPrizes(): Promise<PrizeData[]> {
  console.log('🌴 Starting Florida Prize Scraper (Puppeteer Edition)...\n');
  console.log('🌐 Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('📡 Navigating to Top Remaining Prizes page...');
    await page.goto('https://floridalottery.com/games/scratch-offs/top-remaining-prizes', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('⏳ Waiting for prize table to load...');

    // Wait for the prize table to load (adjust selector as needed)
    await page.waitForSelector('table, .prize-table, [class*="prize"], [class*="table"]', { timeout: 30000 });

    // Give it extra time for JavaScript to populate
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Extracting prize data...');

    // Extract prize table data
    const prizeData = await page.evaluate(() => {
      const data: PrizeData[] = [];

      // Try to find the main prize table
      const tables = document.querySelectorAll('table');

      tables.forEach((table) => {
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return; // Skip malformed rows

          // Florida format (adjust based on actual page structure):
          // Typical: Game # | Game Name | Prize Amount | Remaining
          // OR: Game Name | Game # | Top Prize | Remaining

          const cell0 = cells[0]?.textContent?.trim() || '';
          const cell1 = cells[1]?.textContent?.trim() || '';
          const cell2 = cells[2]?.textContent?.trim() || '';
          const cell3 = cells[3]?.textContent?.trim() || '';

          // Try to identify which cell is game number (contains only digits)
          let gameNumber = '';
          let gameName = '';
          let prizeText = '';
          let remainingText = '';

          // Pattern matching to identify fields
          if (/^\d+$/.test(cell0)) {
            gameNumber = cell0;
            gameName = cell1;
            prizeText = cell2;
            remainingText = cell3;
          } else if (/^\d+$/.test(cell1)) {
            gameName = cell0;
            gameNumber = cell1;
            prizeText = cell2;
            remainingText = cell3;
          }

          // Parse prize amount (remove $, commas, and extract number)
          const prizeMatch = prizeText.match(/[\d,]+/);
          const prizeAmount = prizeMatch ? parseFloat(prizeMatch[0].replace(/,/g, '')) : 0;

          // Parse remaining count
          const remainingMatch = remainingText.match(/\d+/);
          const remainingPrizes = remainingMatch ? parseInt(remainingMatch[0], 10) : 0;

          if (gameNumber && !isNaN(prizeAmount) && !isNaN(remainingPrizes)) {
            data.push({
              gameNumber,
              gameName,
              prizeAmount,
              totalPrizes: 0, // Not available on this page
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

  // Group by game number
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
      // Find top prize
      const topPrize = prizes.reduce((max, p) =>
        p.prizeAmount > max.prizeAmount ? p : max
      );

      // Find the game in database
      const { data: existingGame, error: fetchError } = await supabase
        .from('games')
        .select('id, game_name')
        .eq('game_number', gameNumber)
        .eq('state', 'FL')
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
  console.log('📊 FLORIDA PRIZE SCRAPE COMPLETE');
  console.log('='.repeat(70));
  console.log(`✅ Updated: ${updated} games`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
}

async function main() {
  try {
    const prizeData = await scrapeFLPrizes();

    if (prizeData.length === 0) {
      console.warn('⚠️  No prize data found. Page structure may have changed.');
      process.exit(1);
    }

    await updateDatabase(prizeData);
  } catch (error: any) {
    console.error('\n❌ Florida prize scraper failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as scrapeFLPrizes };
