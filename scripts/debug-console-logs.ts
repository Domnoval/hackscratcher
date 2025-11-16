import puppeteer from 'puppeteer';

async function debugConsoleLogs() {
  console.log('🚀 Launching browser to debug console logs...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser so we can see what's happening
    args: ['--window-size=1920,1080'],
  });

  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Capture all console messages
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, text);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.error(`[PAGE ERROR]:`, error.message);
  });

  try {
    console.log('📱 Navigating to Expo web app...');
    await page.goto('http://localhost:8081', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('✅ Page loaded, waiting for app to initialize...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Handle age verification modal if it appears
    console.log('🔞 Checking for age verification modal...');
    const allModalButtons = await page.$$('button');
    for (const button of allModalButtons) {
      const text = await button.evaluate((el) => el.textContent);
      if (text?.includes('18') || text?.includes('Confirm') || text?.includes('Yes')) {
        console.log(`✅ Found age verification button: "${text}" - clicking it...`);
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Age verification completed\n');
        break;
      }
    }

    console.log('🔍 Looking for budget input field...');

    // Find and fill the budget input FIRST
    const allInputs = await page.$$('input');
    let budgetFilled = false;

    console.log(`Found ${allInputs.length} input fields total`);

    for (const input of allInputs) {
      const inputType = await input.evaluate((el) => (el as HTMLInputElement).type);
      const placeholder = await input.evaluate((el) => (el as HTMLInputElement).placeholder);
      const value = await input.evaluate((el) => (el as HTMLInputElement).value);

      console.log(`  Input: type="${inputType}", placeholder="${placeholder}", value="${value}"`);

      // The budget input has placeholder="20" and is numeric
      if (inputType === 'number' || placeholder === '20') {
        console.log('✅ Found budget input! Filling with $20...');
        await input.click({ clickCount: 3 }); // Select all
        await new Promise(resolve => setTimeout(resolve, 200));
        await input.type('20', { delay: 100 });
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify the value was set
        const newValue = await input.evaluate((el) => (el as HTMLInputElement).value);
        console.log(`✅ Budget input value is now: "${newValue}"`);
        budgetFilled = true;
        break;
      }
    }

    if (!budgetFilled) {
      console.log('⚠️  WARNING: Could not find or fill budget input field!');
    }

    console.log('\n🔍 Looking for "Get Smart Recommendations" button...');

    // Now try to find and click the button
    const allButtons = await page.$$('button, [role="button"]');
    console.log(`Found ${allButtons.length} buttons total`);

    let buttonFound = false;
    for (const button of allButtons) {
      const text = await button.evaluate((el) => el.textContent);
      console.log(`  Button text: "${text}"`);

      if (text?.includes('Get Smart') || text?.includes('Recommend')) {
        console.log(`✅ Found recommendation button!`);
        console.log('🖱️  Clicking button with DOM event...\n');

        // Try multiple click methods to ensure it works with React Native Web
        await button.evaluate((el) => {
          // Dispatch a real mouse click event
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1,
          });
          el.dispatchEvent(clickEvent);
        });

        await new Promise(resolve => setTimeout(resolve, 500));
        await button.click(); // Also try Puppeteer's native click
        buttonFound = true;

        // Wait for recommendations to load
        console.log('⏳ Waiting for recommendations to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\n📊 CONSOLE LOGS SUMMARY:');
        console.log('='.repeat(80));
        const relevantLogs = consoleLogs.filter(log =>
          log.includes('[App]') ||
          log.includes('[ThreeTierRecs]') ||
          log.includes('SupabaseLotteryService') ||
          log.includes('RecommendationEngine') ||
          log.includes('Price from DB') ||
          log.includes('Sample prices') ||
          log.includes('Price:')
        );

        if (relevantLogs.length > 0) {
          console.log('\n🎯 RELEVANT LOGS (Price debugging):');
          relevantLogs.forEach(log => console.log(log));
        } else {
          console.log('\n⚠️  No price-related logs found. All console logs:');
          consoleLogs.forEach(log => console.log(log));
        }

        break;
      }
    }

    if (!buttonFound) {
      console.log('❌ Could not find "Get Smart Recommendations" button');
      console.log('📸 Taking screenshot for debugging...');
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log('💾 Screenshot saved to debug-screenshot.png');
    }

    console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    console.log('🏁 Browser closed');
  }
}

debugConsoleLogs().catch(console.error);
