/**
 * Verify Scraping Setup
 * Checks if everything is configured correctly for automated scraping
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const checks: CheckResult[] = [];

function check(name: string, condition: boolean, passMsg: string, failMsg: string, isWarning = false): void {
  checks.push({
    name,
    status: condition ? 'pass' : (isWarning ? 'warning' : 'fail'),
    message: condition ? passMsg : failMsg,
  });
}

console.log('🔍 Verifying Scraping Setup...\n');

// Check 1: Scraper scripts exist
const scrapers = [
  'scripts/scrape-mn-lottery.ts',
  'scripts/scrape-mn-prizes.ts',
  'scripts/scrape-fl-prizes.ts',
];

scrapers.forEach(scraper => {
  const exists = fs.existsSync(path.join(process.cwd(), scraper));
  check(
    `Scraper: ${scraper}`,
    exists,
    '✅ Found',
    '❌ Missing',
  );
});

// Check 2: GitHub workflow exists
const workflowPath = '.github/workflows/scheduled-scraping.yml';
const workflowExists = fs.existsSync(path.join(process.cwd(), workflowPath));
check(
  'GitHub Actions Workflow',
  workflowExists,
  '✅ Scheduled scraping configured',
  '❌ Workflow file missing',
);

// Check 3: Package.json scripts
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
const requiredScripts = ['scrape', 'scrape:prizes:mn', 'scrape:prizes:fl'];

requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  check(
    `npm script: ${script}`,
    !!exists,
    '✅ Configured',
    '❌ Missing in package.json',
  );
});

// Check 4: Environment variables
const hasSupabaseUrl = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
const hasSupabaseKey = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

check(
  'Supabase URL',
  hasSupabaseUrl,
  '✅ Configured',
  '⚠️ Not found in .env',
  true,
);

check(
  'Supabase API Key',
  hasSupabaseKey,
  '✅ Configured',
  '⚠️ Not found in .env',
  true,
);

// Check 5: Data freshness service
const freshnessServicePath = 'services/data/dataFreshnessService.ts';
const freshnessServiceExists = fs.existsSync(path.join(process.cwd(), freshnessServicePath));
check(
  'Data Freshness Service',
  freshnessServiceExists,
  '✅ Monitoring configured',
  '⚠️ Service not found',
  true,
);

// Check 6: Git repository
const isGitRepo = fs.existsSync(path.join(process.cwd(), '.git'));
check(
  'Git Repository',
  isGitRepo,
  '✅ Git initialized',
  '⚠️ Not a git repository (required for GitHub Actions)',
  true,
);

// Print results
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

checks.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}`);
  console.log(`   ${result.message}\n`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Summary
const passed = checks.filter(c => c.status === 'pass').length;
const warnings = checks.filter(c => c.status === 'warning').length;
const failed = checks.filter(c => c.status === 'fail').length;

console.log('📊 Summary:');
console.log(`   ✅ Passed:   ${passed}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log(`   ❌ Failed:   ${failed}\n`);

if (failed > 0) {
  console.log('❌ Setup incomplete. Please fix failed checks before deploying.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Setup mostly complete. Review warnings for production deployment.\n');
  console.log('📝 Next Steps:');
  console.log('   1. Add Supabase credentials to GitHub Secrets');
  console.log('   2. Push code to GitHub to activate workflows');
  console.log('   3. Verify first automated scraping run\n');
  process.exit(0);
} else {
  console.log('✅ All checks passed! Scraping system is ready.\n');
  console.log('📝 Next Steps:');
  console.log('   1. Ensure Supabase secrets are in GitHub repo settings');
  console.log('   2. Push code to activate automated scraping');
  console.log('   3. Monitor Actions tab for first run\n');
  process.exit(0);
}
