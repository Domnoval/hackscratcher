/**
 * Debug Script: Inspect Minnesota Lottery Winners Page
 * Saves HTML and screenshot to understand page structure
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';

async function debugWinnersPage() {
  console.log('🔍 Debugging Minnesota Lottery Winners Page...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Try different possible URLs
    const urls = [
      'https://www.mnlottery.com/games/scratchers/winning-tickets',
      'https://www.mnlottery.com/games/scratchers/winners',
      'https://www.mnlottery.com/winners',
      'https://www.mnlottery.com/games/instant/winners',
    ];

    for (const url of urls) {
      try {
        console.log(`Trying: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        // Save HTML
        const html = await page.content();
        const filename = url.replace(/[^a-z0-9]/gi, '_');
        fs.writeFileSync(`mn-winners-${filename}.html`, html);
        console.log(`✅ Saved HTML: mn-winners-${filename}.html`);

        // Save screenshot
        await page.screenshot({
          path: `mn-winners-${filename}.png`,
          fullPage: true,
        });
        console.log(`✅ Saved screenshot: mn-winners-${filename}.png\n`);

        // Try to find any tables or lists
        const tables = await page.$$('table');
        const lists = await page.$$('ul, ol');
        const divs = await page.$$('[class*="winner"], [class*="prize"], [class*="claim"]');

        console.log(`Found ${tables.length} tables`);
        console.log(`Found ${lists.length} lists`);
        console.log(`Found ${divs.length} divs with winner/prize/claim classes\n`);

      } catch (error) {
        console.log(`❌ Failed to load: ${url}`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
      }
    }

    console.log('\n✅ Debug complete! Check the generated files.');
    console.log('Next step: Open the HTML files or screenshots to see page structure');

  } finally {
    await browser.close();
  }
}

debugWinnersPage().catch(console.error);
