# 🔧 Supabase Connection Fix Guide

## Problem
DNS cannot resolve `wqealxmdjpwjbhfrnplk.supabase.co` - project is likely deleted or suspended.

## Solution Options

### Option A: Check Existing Project (2 minutes)
1. Visit https://supabase.com/dashboard
2. Log in with your account
3. Look for project `wqealxmdjpwjbhfrnplk`
4. If paused: Click "Resume Project"
5. If deleted: Proceed to Option B

### Option B: Create New Supabase Project (5 minutes)

#### Step 1: Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: "scratch-oracle-prod"
4. Database Password: Generate strong password (save it!)
5. Region: Choose closest to Minnesota (US East or Central)
6. Click "Create New Project" (takes ~2 minutes)

#### Step 2: Get Credentials
1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon/public key**: Long JWT token starting with `eyJ...`

#### Step 3: Update .env File
```bash
# Edit D:\Scratch_n_Sniff\scratch-oracle-app\.env
EXPO_PUBLIC_SUPABASE_URL=https://[your-new-project-ref].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[your-new-anon-key]
```

#### Step 4: Run Database Migration
```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app

# Create tables (run these SQL commands in Supabase SQL Editor)
```

**SQL to run in Supabase Dashboard → SQL Editor:**

```sql
-- 1. Create games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  game_number VARCHAR(10) UNIQUE NOT NULL,
  state VARCHAR(2) DEFAULT 'MN',
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  top_prize BIGINT NOT NULL,
  overall_odds DECIMAL(10,2),
  launch_date DATE,
  status VARCHAR(50),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state, game_number)
);

-- 2. Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  ai_score DECIMAL(5,2) NOT NULL,
  recommendation VARCHAR(50),
  confidence_level VARCHAR(20),
  expected_value DECIMAL(10,4),
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  model_version VARCHAR(50)
);

-- 3. Create historical_snapshots table
CREATE TABLE IF NOT EXISTS historical_snapshots (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  prizes_remaining JSONB,
  tickets_remaining INTEGER,
  days_active INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create prize_tiers table
CREATE TABLE IF NOT EXISTS prize_tiers (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  prize_amount BIGINT NOT NULL,
  total_prizes INTEGER,
  prizes_remaining INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create user_scans table (for tracking)
CREATE TABLE IF NOT EXISTS user_scans (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  was_winner BOOLEAN,
  prize_amount DECIMAL(10,2),
  scan_date TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_predictions_game_id ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_game_date ON historical_snapshots(game_id, snapshot_date);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scans ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies (allow all for now - restrict in production!)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on predictions" ON predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on snapshots" ON historical_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on prize_tiers" ON prize_tiers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_scans" ON user_scans FOR ALL USING (true) WITH CHECK (true);

-- 9. Create view for active games with predictions
CREATE OR REPLACE VIEW active_games_with_predictions AS
SELECT
  g.*,
  p.ai_score,
  p.recommendation,
  p.confidence_level,
  p.expected_value,
  p.predicted_at
FROM games g
LEFT JOIN predictions p ON g.id = p.game_id
WHERE g.status = 'PUBLISHED'
ORDER BY p.ai_score DESC NULLS LAST;
```

#### Step 5: Test Connection
```bash
npx tsx scripts/test-supabase-connection.ts
```

Should see:
```
✅ Successfully queried games table
✅ Successfully queried predictions table
✅ Connection successful!
```

#### Step 6: Reload Data
```bash
# Run scraper to populate database
npm run scrape:all

# Should see:
# ✅ Power Shot Multiplier: Success
# ✅ Winter Fun: Success
# ... (41 games)
```

### Option C: Use SQLite as Temporary Backup (10 minutes)

If Supabase is down, use local SQLite:

```bash
# Install better-sqlite3
npm install better-sqlite3 @types/better-sqlite3

# Create local database adapter
# (I can help generate this code)
```

## Quick Fix Checklist

- [ ] Visit Supabase dashboard
- [ ] Check project status
- [ ] Resume or create new project
- [ ] Update .env with new credentials
- [ ] Run SQL migration in Supabase
- [ ] Test connection
- [ ] Re-run scraper
- [ ] Verify 41 games in database

## Common Issues

### "Could not resolve host"
→ Project deleted or DNS issue
→ Create new project (Option B)

### "Invalid API key"
→ Wrong anon key in .env
→ Copy fresh key from Supabase Settings → API

### "relation 'games' does not exist"
→ Tables not created
→ Run SQL migration (Step 4)

### "permission denied for table games"
→ RLS policies not set
→ Run RLS policy SQL (Step 8)

---

**Need help?** I can:
1. Generate the SQL migration automatically
2. Create a local SQLite fallback
3. Help debug specific errors

Let me know which option you want to pursue!
