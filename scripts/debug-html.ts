/**
 * Debug script to inspect MN Lottery HTML structure
 * Run: npm run debug-html
 */

import 'dotenv/config';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const MN_LOTTERY_URL = 'https://www.mnlottery.com/games/unclaimed-prizes';

async function main() {
  console.log('Fetching MN Lottery page...\n');

  const response = await fetch(MN_LOTTERY_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const html = await response.text();

  // Save to file for inspection
  fs.writeFileSync('mnlottery-page.html', html);
  console.log('✅ HTML saved to: mnlottery-page.html');

  // Parse and show structure
  const $ = cheerio.load(html);

  console.log('\n📊 Page Structure:');
  console.log('='.repeat(50));

  // Find all tables
  const tables = $('table');
  console.log(`\nFound ${tables.length} table(s)`);

  tables.each((i, table) => {
    const $table = $(table);
    console.log(`\nTable ${i + 1}:`);
    console.log(`- Class: ${$table.attr('class')}`);
    console.log(`- ID: ${$table.attr('id')}`);
    console.log(`- Rows: ${$table.find('tr').length}`);
    console.log(`- Headers: ${$table.find('th').map((_, th) => $(th).text().trim()).get().join(', ')}`);
  });

  // Find divs with game data
  const gameDivs = $('[class*="game"], [class*="scratch"]');
  console.log(`\nFound ${gameDivs.length} divs with 'game' or 'scratch' in class name`);

  // Show first few rows of data
  console.log('\n📝 First Table Rows:');
  console.log('='.repeat(50));
  $('table').first().find('tr').slice(0, 5).each((i, row) => {
    const cells = $(row).find('td, th').map((_, cell) => $(cell).text().trim()).get();
    console.log(`Row ${i}: ${JSON.stringify(cells)}`);
  });

  console.log('\n✅ Done! Check mnlottery-page.html for full HTML');
}

main().catch(console.error);
