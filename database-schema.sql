-- ============================================
-- SCRATCH ORACLE DATABASE SCHEMA
-- Copy this entire file and paste into Supabase SQL Editor
-- ============================================

-- 1. Games Table
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

-- 2. Prize Tiers Table
CREATE TABLE IF NOT EXISTS prize_tiers (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  prize_amount BIGINT NOT NULL,
  total_prizes INTEGER,
  prizes_remaining INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Predictions Table
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

-- 4. Historical Snapshots Table
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

-- 5. User Scans Table
CREATE TABLE IF NOT EXISTS user_scans (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  was_winner BOOLEAN DEFAULT FALSE,
  prize_amount DECIMAL(10,2),
  scan_date TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_state_status ON games(state, status);
CREATE INDEX IF NOT EXISTS idx_predictions_game_id ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_game_date ON historical_snapshots(game_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_prize_tiers_game_id ON prize_tiers(game_id);

-- 7. Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scans ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
DROP POLICY IF EXISTS "Allow public read access to games" ON games;
CREATE POLICY "Allow public read access to games" ON games FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to games" ON games;
CREATE POLICY "Allow public insert to games" ON games FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to games" ON games;
CREATE POLICY "Allow public update to games" ON games FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access to predictions" ON predictions;
CREATE POLICY "Allow public read access to predictions" ON predictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to predictions" ON predictions;
CREATE POLICY "Allow public insert to predictions" ON predictions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to snapshots" ON historical_snapshots;
CREATE POLICY "Allow public read access to snapshots" ON historical_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to snapshots" ON historical_snapshots;
CREATE POLICY "Allow public insert to snapshots" ON historical_snapshots FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to prize_tiers" ON prize_tiers;
CREATE POLICY "Allow public read access to prize_tiers" ON prize_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to prize_tiers" ON prize_tiers;
CREATE POLICY "Allow public insert to prize_tiers" ON prize_tiers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public operations on user_scans" ON user_scans;
CREATE POLICY "Allow public operations on user_scans" ON user_scans FOR ALL USING (true) WITH CHECK (true);

-- Done!
SELECT 'Database schema created successfully!' AS status;
