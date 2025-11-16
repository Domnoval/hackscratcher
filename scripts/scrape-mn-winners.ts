/**
 * Minnesota Lottery Winners Scraper
 * Collects data on where winning tickets were sold
 * This data is used to train the AI location prediction model
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

interface WinnerRecord {
  gameName: string;
  gameNumber: number | null;
  prizeAmount: number;
  retailerName: string;
  city: string;
  state: string;
  claimedDate: Date | null;
}

const LOG_ID = `winner_scrape_${Date.now()}`;
let stats = {
  processed: 0,
  created: 0,
  updated: 0,
  errors: 0,
};

async function scrapeMinnesotaWinners(): Promise<void> {
  console.log('[MN Winners] Starting scraper...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Navigate to winners page
    console.log('[MN Winners] Loading page...');
    await page.goto('https://www.mnlottery.com/games/scratchers/winning-tickets', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for content to load
    await page.waitForSelector('.winner-table, .winners-list, table', { timeout: 10000 });

    // Extract winner data
    console.log('[MN Winners] Extracting data...');
    const winners = await page.evaluate(() => {
      const rows: any[] = [];

      // Try multiple selector patterns since we don't know exact structure
      const tables = document.querySelectorAll('table, .winner-table, .winners-list');

      tables.forEach(table => {
        const tableRows = table.querySelectorAll('tr, .winner-row');

        tableRows.forEach((row, index) => {
          // Skip header row
          if (index === 0 && row.querySelector('th')) return;

          try {
            // Extract data (adjust selectors based on actual site structure)
            const cells = row.querySelectorAll('td, .winner-cell');

            if (cells.length >= 4) {
              const data = {
                gameName: cells[0]?.textContent?.trim() || '',
                prizeAmount: cells[1]?.textContent?.trim() || '',
                retailerName: cells[2]?.textContent?.trim() || '',
                location: cells[3]?.textContent?.trim() || '',
                claimedDate: cells[4]?.textContent?.trim() || null,
              };

              if (data.gameName && data.retailerName) {
                rows.push(data);
              }
            }
          } catch (e) {
            console.error('Row parsing error:', e);
          }
        });
      });

      return rows;
    });

    console.log(`[MN Winners] Found ${winners.length} winner records`);

    // Process each winner
    for (const winner of winners) {
      try {
        stats.processed++;
        await processWinner(winner);
      } catch (error) {
        console.error('[MN Winners] Error processing winner:', error);
        stats.errors++;
      }
    }

    // Log screenshot for debugging
    await page.screenshot({ path: 'mn-winners-debug.png', fullPage: true });
    console.log('[MN Winners] Screenshot saved for debugging');

  } catch (error) {
    console.error('[MN Winners] Scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function processWinner(rawData: any): Promise<void> {
  // Parse prize amount
  const prizeAmount = parsePrizeAmount(rawData.prizeAmount);

  // Parse location (format: "City, State" or just "City")
  const { city, state } = parseLocation(rawData.location);

  // Extract game number from name (e.g., "$50 Bonus Crossword #2066" -> 2066)
  const gameNumber = extractGameNumber(rawData.gameName);

  // Parse claimed date
  const claimedDate = parseDate(rawData.claimedDate);

  const winnerRecord: WinnerRecord = {
    gameName: rawData.gameName.trim(),
    gameNumber,
    prizeAmount,
    retailerName: rawData.retailerName.trim(),
    city,
    state: state || 'MN',
    claimedDate,
  };

  // Find or create retailer
  const retailer = await findOrCreateRetailer(winnerRecord);

  // Insert winning ticket
  await insertWinningTicket(winnerRecord, retailer?.id || null);
}

async function findOrCreateRetailer(winner: WinnerRecord) {
  // Try to find existing retailer
  const { data: existing } = await supabase
    .from('retailers')
    .select('id')
    .eq('name', winner.retailerName)
    .eq('city', winner.city)
    .eq('state', winner.state)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Create new retailer
  const { data: newRetailer } = await supabase
    .from('retailers')
    .insert({
      name: winner.retailerName,
      city: winner.city,
      state: winner.state,
      address: `${winner.city}, ${winner.state}`, // Placeholder
      retailer_type: guessRetailerType(winner.retailerName),
      is_active: true,
      data_source: 'mn_lottery',
      geocode_quality: 'unknown',
    })
    .select('id')
    .single();

  if (newRetailer) {
    console.log(`[Retailer] Created: ${winner.retailerName} in ${winner.city}`);
  }

  return newRetailer;
}

async function insertWinningTicket(winner: WinnerRecord, retailerId: string | null) {
  // Check if we already have this exact winner
  const { data: existing } = await supabase
    .from('winning_tickets')
    .select('id')
    .eq('retailer_name', winner.retailerName)
    .eq('prize_amount', winner.prizeAmount)
    .eq('game_name', winner.gameName)
    .maybeSingle();

  if (existing) {
    stats.updated++;
    return; // Already have this winner
  }

  // Insert new winning ticket
  const { error } = await supabase.from('winning_tickets').insert({
    game_number: winner.gameNumber,
    game_name: winner.gameName,
    prize_amount: winner.prizeAmount,
    prize_tier: categorizePrize(winner.prizeAmount),
    retailer_id: retailerId,
    retailer_name: winner.retailerName,
    city: winner.city,
    state: winner.state,
    claimed_at: winner.claimedDate,
    announced_at: new Date(),
    claim_status: 'claimed',
    scrape_source: 'mn_lottery_winners',
    verification_status: 'unverified',
  });

  if (error) {
    console.error('[Winning Ticket] Insert error:', error);
    stats.errors++;
  } else {
    stats.created++;
    console.log(`[Winner] Added: $${winner.prizeAmount} at ${winner.retailerName}`);
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function parsePrizeAmount(text: string): number {
  // Extract number from string like "$50,000" or "50000" or "$50K"
  const cleaned = text.replace(/[$,\s]/g, '');

  if (cleaned.includes('K')) {
    return parseFloat(cleaned.replace('K', '')) * 1000;
  }

  if (cleaned.includes('M')) {
    return parseFloat(cleaned.replace('M', '')) * 1000000;
  }

  return parseFloat(cleaned) || 0;
}

function parseLocation(text: string): { city: string; state: string } {
  const parts = text.split(',').map(p => p.trim());

  if (parts.length === 2) {
    return { city: parts[0], state: parts[1] };
  }

  // Assume Minnesota if only city given
  return { city: parts[0] || 'Unknown', state: 'MN' };
}

function extractGameNumber(gameName: string): number | null {
  // Look for patterns like "#2066" or "Game 2066"
  const match = gameName.match(/#?(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

function parseDate(text: string | null): Date | null {
  if (!text) return null;

  try {
    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function categorizePrize(amount: number): string {
  if (amount >= 1000000) return 'top_prize';
  if (amount >= 100000) return 'high_prize';
  if (amount >= 10000) return 'medium_prize';
  return 'low_prize';
}

function guessRetailerType(name: string): string {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('holiday') || nameLower.includes('speedway') || nameLower.includes('kwik trip')) {
    return 'gas_station';
  }
  if (nameLower.includes('cub') || nameLower.includes('hyvee') || nameLower.includes('walmart')) {
    return 'grocery';
  }
  if (nameLower.includes('liquor') || nameLower.includes('spirits')) {
    return 'liquor';
  }
  if (nameLower.includes('walgreens') || nameLower.includes('cvs')) {
    return 'pharmacy';
  }

  return 'convenience';
}

async function logRun(status: 'success' | 'failed', error?: string) {
  await supabase.from('data_collection_log').insert({
    job_type: 'winner_scrape',
    state: 'MN',
    status,
    records_processed: stats.processed,
    records_created: stats.created,
    records_updated: stats.updated,
    errors_count: stats.errors,
    error_message: error,
    completed_at: new Date(),
    triggered_by: 'script',
    run_id: LOG_ID,
  });
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('MINNESOTA LOTTERY WINNERS SCRAPER');
  console.log('Purpose: Collect training data for AI location prediction');
  console.log('='.repeat(60));

  try {
    await scrapeMinnesotaWinners();

    console.log('\n' + '='.repeat(60));
    console.log('SCRAPING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Records processed: ${stats.processed}`);
    console.log(`New records created: ${stats.created}`);
    console.log(`Records updated: ${stats.updated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(60));

    await logRun('success');

    if (stats.created === 0 && stats.processed > 0) {
      console.log('\n⚠️  No new winners found - data may be stale or already collected');
    }

    if (stats.errors > 0) {
      console.log('\n⚠️  Some errors occurred during scraping');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SCRAPING FAILED:', error);
    await logRun('failed', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
