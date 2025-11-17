import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDatabaseSchema() {
  console.log('🚀 Creating Scratch Oracle database schema...\n');

  const migrationSQL = `
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
DROP POLICY IF EXISTS "Allow public read access to games" ON games;
CREATE POLICY "Allow public read access to games"
  ON games FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to games" ON games;
CREATE POLICY "Allow public insert to games"
  ON games FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to games" ON games;
CREATE POLICY "Allow public update to games"
  ON games FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access to predictions" ON predictions;
CREATE POLICY "Allow public read access to predictions"
  ON predictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to predictions" ON predictions;
CREATE POLICY "Allow public insert to predictions"
  ON predictions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to snapshots" ON historical_snapshots;
CREATE POLICY "Allow public read access to snapshots"
  ON historical_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to snapshots" ON historical_snapshots;
CREATE POLICY "Allow public insert to snapshots"
  ON historical_snapshots FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to prize_tiers" ON prize_tiers;
CREATE POLICY "Allow public read access to prize_tiers"
  ON prize_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to prize_tiers" ON prize_tiers;
CREATE POLICY "Allow public insert to prize_tiers"
  ON prize_tiers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public operations on user_scans" ON user_scans;
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
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prize_tiers_updated_at ON prize_tiers;
CREATE TRIGGER update_prize_tiers_updated_at
  BEFORE UPDATE ON prize_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

  try {
    console.log('📝 Executing migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try alternative method using REST API
      console.log('⚠️  RPC method not available, trying direct execution...');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            console.log(`⚠️  Statement may have failed (${response.status}): ${statement.substring(0, 50)}...`);
          }
        } catch (err) {
          // Continue even if some statements fail (they might already exist)
          console.log(`⚠️  Error on statement: ${statement.substring(0, 50)}...`);
        }
      }
    }

    // Verify tables were created
    console.log('\n✅ Verifying tables...');
    const { data: games, error: gamesError } = await supabase.from('games').select('count').limit(1);
    const { data: prizeTiers, error: prizeError } = await supabase.from('prize_tiers').select('count').limit(1);
    const { data: predictions, error: predError } = await supabase.from('predictions').select('count').limit(1);
    const { data: snapshots, error: snapError } = await supabase.from('historical_snapshots').select('count').limit(1);
    const { data: scans, error: scanError } = await supabase.from('user_scans').select('count').limit(1);

    console.log('\n📊 Table Status:');
    console.log(`   games: ${gamesError ? '❌ Not found' : '✅ Created'}`);
    console.log(`   prize_tiers: ${prizeError ? '❌ Not found' : '✅ Created'}`);
    console.log(`   predictions: ${predError ? '❌ Not found' : '✅ Created'}`);
    console.log(`   historical_snapshots: ${snapError ? '❌ Not found' : '✅ Created'}`);
    console.log(`   user_scans: ${scanError ? '❌ Not found' : '✅ Created'}`);

    if (!gamesError && !prizeError && !predError && !snapError && !scanError) {
      console.log('\n🎉 Database schema created successfully!');
      console.log('✅ Ready to populate with lottery data');
      return true;
    } else {
      console.log('\n⚠️  Some tables may not have been created.');
      console.log('📝 Please run the SQL manually in the Supabase SQL Editor');
      return false;
    }

  } catch (error) {
    console.error('❌ Error creating database schema:', error);
    console.log('\n📝 Manual Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/cwkkutgejrworuoaobvx/editor');
    console.log('2. Paste the SQL from PRODUCTION_LAUNCH_PLAN.md');
    console.log('3. Click Run');
    return false;
  }
}

createDatabaseSchema();