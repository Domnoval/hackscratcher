# 🚀 Production Launch Plan - Supabase + Google Play Store

**Goal**: Get working Supabase database + non-crashing build on Play Store
**Timeline**: 30-60 minutes
**Status**: In Progress

---

## Phase 1: Supabase Setup (10 minutes)

### Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in with your account

2. **Create Project**
   - Click "New Project"
   - **Organization**: Select your org (or create one)
   - **Name**: `scratch-oracle-production`
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: `US East (North Virginia)` - closest to Minnesota
   - **Pricing Plan**: Free tier (perfect for MVP)
   - Click "Create New Project"
   - ⏳ Wait 2-3 minutes for provisioning

3. **Get API Credentials**
   - Go to **Project Settings** → **API**
   - Copy these values:
     - **Project URL**: `https://[your-ref].supabase.co`
     - **anon/public key**: Long JWT token starting with `eyJ...`

### Step 2: Update Environment Variables

**Edit `.env` file:**
```bash
# D:\Scratch_n_Sniff\scratch-oracle-app\.env

# OLD (broken):
# EXPO_PUBLIC_SUPABASE_URL=https://wqealxmdjpwjbhfrnplk.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=[old-key]

# NEW (replace with your actual values):
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### Step 3: Run Database Migration

**In Supabase Dashboard → SQL Editor**, paste and run this SQL:

```sql
-- ============================================
-- SCRATCH ORACLE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Games Table (core lottery game data)
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  game_number VARCHAR(10) NOT NULL,
  state VARCHAR(2) DEFAULT 'MN',
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  top_prize BIGINT NOT NULL,
  overall_odds DECIMAL(10,2),
  launch_date DATE,
  status VARCHAR(50) DEFAULT 'PUBLISHED',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state, game_number)
);

-- 2. Prize Tiers Table (detailed prize breakdown)
CREATE TABLE IF NOT EXISTS prize_tiers (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  prize_amount BIGINT NOT NULL,
  total_prizes INTEGER,
  prizes_remaining INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Predictions Table (AI recommendations)
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  ai_score DECIMAL(5,2) NOT NULL CHECK (ai_score >= 0 AND ai_score <= 100),
  recommendation VARCHAR(50) CHECK (recommendation IN ('strong_buy', 'buy', 'neutral', 'avoid')),
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high')),
  expected_value DECIMAL(10,4),
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  model_version VARCHAR(50) DEFAULT 'xgboost-v1.0'
);

-- 4. Historical Snapshots Table (for ML training)
CREATE TABLE IF NOT EXISTS historical_snapshots (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prizes_remaining JSONB,
  tickets_remaining INTEGER,
  days_active INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, snapshot_date)
);

-- 5. User Scans Table (track user wins for model validation)
CREATE TABLE IF NOT EXISTS user_scans (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  was_winner BOOLEAN DEFAULT FALSE,
  prize_amount DECIMAL(10,2),
  scan_date TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_state_status ON games(state, status);
CREATE INDEX IF NOT EXISTS idx_predictions_game_id ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_game_date ON historical_snapshots(game_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_prize_tiers_game_id ON prize_tiers(game_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scans ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies (open for MVP - restrict later!)
CREATE POLICY "Allow public read access to games"
  ON games FOR SELECT USING (true);

CREATE POLICY "Allow public insert to games"
  ON games FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to games"
  ON games FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to predictions"
  ON predictions FOR SELECT USING (true);

CREATE POLICY "Allow public insert to predictions"
  ON predictions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to snapshots"
  ON historical_snapshots FOR SELECT USING (true);

CREATE POLICY "Allow public insert to snapshots"
  ON historical_snapshots FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to prize_tiers"
  ON prize_tiers FOR SELECT USING (true);

CREATE POLICY "Allow public insert to prize_tiers"
  ON prize_tiers FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public operations on user_scans"
  ON user_scans FOR ALL USING (true) WITH CHECK (true);

-- 9. Create View for Active Games with Predictions
CREATE OR REPLACE VIEW active_games_with_predictions AS
SELECT
  g.id,
  g.game_number,
  g.state,
  g.name,
  g.price,
  g.top_prize,
  g.overall_odds,
  g.launch_date,
  g.status,
  g.image_url,
  g.created_at,
  g.updated_at,
  p.ai_score,
  p.recommendation,
  p.confidence_level,
  p.expected_value,
  p.predicted_at,
  p.model_version
FROM games g
LEFT JOIN predictions p ON g.id = p.game_id
WHERE g.status = 'PUBLISHED'
ORDER BY p.ai_score DESC NULLS LAST, g.price ASC;

-- 10. Create Function to Update Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create Triggers for Auto-Update Timestamps
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prize_tiers_updated_at
  BEFORE UPDATE ON prize_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration Complete!
-- ============================================

-- Verify tables created
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Output**: Should show 5 tables (games, predictions, historical_snapshots, prize_tiers, user_scans)

### Step 4: Test Connection & Populate Data

```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app

# Test connection
npx tsx scripts/test-supabase-connection.ts

# Should see:
# ✅ Successfully queried games table
# ✅ Successfully queried predictions table

# Populate database with 41 real games
npm run scrape:all

# Should see:
# ✅ Power Shot Multiplier: Success
# ✅ Winter Fun: Success
# ... (41 games total)
```

**✅ Checkpoint**: Supabase is now working with 41 games in database!

---

## Phase 2: Production Build (15-20 minutes)

### Step 5: Verify Build Configuration

**Check `eas.json`:**
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### Step 6: Build Production APK

```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app

# Build production APK (not AAB for easier testing)
eas build --platform android --profile production --local

# OR if you want to build in cloud:
eas build --platform android --profile production

# Wait 15-20 minutes for build to complete
```

**What this does**:
- Creates signed `.apk` file
- Uses production Supabase credentials
- Optimized and minified code
- Ready for Play Store

### Step 7: Download & Test APK

**Once build completes:**
```bash
# Download APK
# EAS provides download link: https://expo.dev/accounts/[your-account]/builds/[build-id]

# Install on phone via ADB
adb install scratch-oracle-v1.0.12-production.apk

# OR
# Download APK to phone and install manually
```

**Test on device**:
- [ ] App launches without crash ✅
- [ ] 41 games display correctly ✅
- [ ] Game details show (price, odds, prizes) ✅
- [ ] No "Network Error" messages ✅
- [ ] Smooth scrolling and navigation ✅
- [ ] Age verification works ✅

**✅ Checkpoint**: Non-crashing APK tested and working!

---

## Phase 3: Google Play Store Upload (10 minutes)

### Step 8: Prepare Store Assets (if not done)

**Required Files**:
- [x] APK/AAB file (from Step 6)
- [ ] App Icon 512x512 PNG
- [ ] Feature Graphic 1024x500 PNG
- [ ] Screenshots (minimum 2, recommended 8)
  - 1080x1920 or similar
  - Show: Home screen, game list, game details, predictions, settings

**Quick Screenshots**:
```bash
# Take screenshots from running app on phone
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots/01-home.png

# Repeat for different screens
```

### Step 9: Google Play Console Setup

1. **Go to Play Console**
   - Visit: https://play.google.com/console
   - Select your developer account ($25 one-time if not registered)

2. **Create App**
   - Click "Create App"
   - **App Name**: "Scratch Oracle - Lottery Insights"
   - **Default Language**: English (United States)
   - **App/Game**: Application
   - **Free/Paid**: Free
   - Accept declarations

3. **Fill Required Info** (Dashboard will guide you):
   - **Store Listing**:
     - Short Description (80 chars max)
     - Full Description (4000 chars max)
     - App Icon (512x512)
     - Feature Graphic (1024x500)
     - Screenshots (at least 2)

   - **Content Rating**:
     - Complete questionnaire
     - Select "Utility/Productivity" category
     - 18+ age gate (gambling-related)

   - **Target Audience**:
     - Age: 18+
     - Content for adults only

   - **Privacy Policy**:
     - URL to your privacy policy (required!)
     - Can use https://www.privacypolicygenerator.info/

4. **Upload APK to Closed Testing**
   - Go to **Testing → Closed Testing**
   - Create new release
   - Upload APK/AAB
   - Release name: "Beta v1.0.12"
   - Release notes: Use CHANGELOG_DRAFT.md

5. **Add Testers**
   - Create email list
   - Add 5-10 beta testers
   - They'll get invite link

6. **Submit for Review**
   - Review everything
   - Click "Submit for Review"
   - Wait 1-7 days for approval

**✅ Checkpoint**: App on Play Store in closed beta!

---

## Quick Troubleshooting

### Issue: Supabase "Cannot connect"
**Solution**:
- Check .env has correct URL and key
- Restart Metro: `npx expo start --clear`
- Verify RLS policies enabled

### Issue: Build fails with "Missing credentials"
**Solution**:
```bash
# Re-authenticate with EAS
eas login

# Check credentials
eas credentials
```

### Issue: APK crashes on launch
**Solution**:
```bash
# Check logs
adb logcat | grep -i "scratch"

# Common fix: Clear app data
adb shell pm clear com.scratchoracle.app
```

### Issue: "Network request failed" in app
**Solution**:
- Check internet connection
- Verify Supabase project not paused
- Check .env variables copied correctly

---

## Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Create Supabase project | 5 min | ⏳ Pending |
| Run database migration | 2 min | ⏳ Pending |
| Test & populate data | 3 min | ⏳ Pending |
| Build production APK | 20 min | ⏳ Pending |
| Test on device | 5 min | ⏳ Pending |
| Upload to Play Store | 10 min | ⏳ Pending |
| **Total** | **45 min** | ⏳ In Progress |

---

## Success Criteria

**Phase 1 Complete** when:
- ✅ Supabase project created
- ✅ Database schema deployed
- ✅ 41 games in database
- ✅ Connection test passes

**Phase 2 Complete** when:
- ✅ Production APK built
- ✅ APK tested on real device
- ✅ No crashes
- ✅ All 41 games display

**Phase 3 Complete** when:
- ✅ App uploaded to Play Console
- ✅ Closed testing track active
- ✅ Beta testers invited
- ✅ Submitted for review

---

## Next Steps After Launch

1. **Invite Beta Testers** (this week)
   - Friends, family, colleagues
   - Get feedback on bugs and UX

2. **Monitor Crashes** (daily)
   - Check Play Console crash reports
   - Fix critical issues immediately

3. **Collect Data** (weekly)
   - Run scraper every Sunday
   - Build historical data for ML model

4. **Iterate** (2-4 weeks)
   - Fix bugs from beta feedback
   - Polish UI based on user feedback
   - Improve ML predictions

5. **Public Launch** (Month 2-3)
   - Move from closed testing to production
   - Marketing push
   - Scale to multi-state

---

**Let's get started! Which do you want to do first:**
1. **Set up Supabase together** (I'll guide you step-by-step)
2. **Build production APK now** (while you set up Supabase)
3. **Both in parallel** (I'll create the SQL, you create Supabase)
