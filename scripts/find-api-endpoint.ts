/**
 * Network request interceptor to find the API endpoint
 * Run: npm run find-api
 */

import 'dotenv/config';
import puppeteer from 'puppeteer';

async function main() {
  console.log('🕵️  Launching browser to intercept API calls...\n');

  const browser = await puppeteer.launch({
    headless: false, // Run with visible browser to see what's happening
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // Store all network requests
  const requests: any[] = [];

  // Intercept all requests
  page.on('request', (request) => {
    const url = request.url();
    if (
      url.includes('api') ||
      url.includes('game') ||
      url.includes('scratch') ||
      url.includes('prize') ||
      url.includes('.json')
    ) {
      console.log(`📡 REQUEST: ${request.method()} ${url}`);
      requests.push({
        method: request.method(),
        url: url,
        type: request.resourceType(),
      });
    }
  });

  // Intercept all responses
  page.on('response', async (response) => {
    const url = response.url();
    if (
      url.includes('api') ||
      url.includes('game') ||
      url.includes('scratch') ||
      url.includes('prize') ||
      url.includes('.json')
    ) {
      try {
        const contentType = response.headers()['content-type'] || '';
        console.log(`✅ RESPONSE: ${response.status()} ${url}`);
        console.log(`   Content-Type: ${contentType}`);

        if (contentType.includes('json')) {
          const data = await response.json();
          console.log(`   JSON Data (preview):`, JSON.stringify(data).substring(0, 200));
        }
      } catch (err) {
        // Ignore errors
      }
    }
  });

  console.log('📡 Navigating to MN Lottery...\n');
  await page.goto('https://www.mnlottery.com/games/unclaimed-prizes', {
    waitUntil: 'networkidle2',
    timeout: 45000,
  });

  console.log('\n⏳ Waiting 15 seconds for all async requests...\n');
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total API-related requests: ${requests.length}`);
  console.log('\nAll Requests:');
  requests.forEach((req, i) => {
    console.log(`${i + 1}. [${req.method}] ${req.url}`);
  });

  console.log('\n⚠️  Browser will stay open for 30 seconds for inspection...');
  console.log('   Check the page and network tab manually.\n');
  await new Promise(resolve => setTimeout(resolve, 30000));

  await browser.close();
}

main().catch(console.error);
