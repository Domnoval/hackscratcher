/**
 * Debug script to see actual API response structure
 * Run: npm run debug-api
 */

import 'dotenv/config';

const API_URL = 'https://gateway.gameon.mnlottery.com/services/game/api/game/prizes/unclaimed?gameTypeIds=2,7,5';

async function main() {
  console.log('📡 Fetching from API...\n');

  const response = await fetch(API_URL, {
    headers: {
      'User-Agent': 'ScratchOracle/1.0',
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  console.log('📊 Full Response:\n');
  console.log(JSON.stringify(data, null, 2));

  if (Array.isArray(data) && data.length > 0) {
    console.log('\n📝 First Game Fields:\n');
    console.log(Object.keys(data[0]));
  }
}

main().catch(console.error);
