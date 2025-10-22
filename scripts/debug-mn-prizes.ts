import 'dotenv/config';
import puppeteer from 'puppeteer';
import fs from 'fs';

async function debug() {
  console.log('🔍 Debugging MN Prize Page...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser so we can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('📡 Navigating to page...');
    await page.goto('https://www.mnlottery.com/games/unclaimed-prizes', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('⏳ Waiting for widget...');
    await page.waitForSelector('#scratchUnclaimedPrizeWidget', { timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('💾 Saving page HTML...');
    const html = await page.content();
    fs.writeFileSync('mn-prizes-debug.html', html);
    console.log('✅ Saved to mn-prizes-debug.html');

    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'mn-prizes-debug.png', fullPage: true });
    console.log('✅ Saved to mn-prizes-debug.png');

    console.log('\n🔍 Analyzing widget content...');
    const widgetHTML = await page.evaluate(() => {
      const widget = document.querySelector('#scratchUnclaimedPrizeWidget');
      return widget ? widget.innerHTML : 'WIDGET NOT FOUND';
    });

    console.log('Widget HTML (first 1000 chars):');
    console.log(widgetHTML.substring(0, 1000));

    console.log('\n✅ Debug complete. Check mn-prizes-debug.html and mn-prizes-debug.png');

  } finally {
    await browser.close();
  }
}

debug();
