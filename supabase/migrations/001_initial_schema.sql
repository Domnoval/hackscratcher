-- Scratch Oracle - Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- =====================================================
-- TABLE: games
-- =====================================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_number VARCHAR(20) UNIQUE NOT NULL,
  game_name VARCHAR(255) NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  top_prize_amount DECIMAL(12,2) NOT NULL,
  total_top_prizes INTEGER NOT NULL,
  remaining_top_prizes INTEGER NOT NULL,
  overall_odds VARCHAR(50),
  game_start_date DATE,
  game_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  total_tickets_printed BIGINT,
  tickets_remaining_estimate BIGINT,

  -- Metadata
  state VARCHAR(2) DEFAULT 'MN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_scraped_at TIMESTAMP
);

CREATE INDEX idx_games_active ON games(is_active, state);
CREATE INDEX idx_games_number ON games(game_number);
CREATE INDEX idx_games_updated ON games(updated_at DESC);

-- =====================================================
-- TABLE: prize_tiers
-- =====================================================
CREATE TABLE prize_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  prize_amount DECIMAL(10,2) NOT NULL,
  total_prizes INTEGER NOT NULL,
  remaining_prizes INTEGER NOT NULL,
  odds VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prize_tiers_game ON prize_tiers(game_id);

-- =====================================================
-- TABLE: historical_snapshots
-- =====================================================
CREATE TABLE historical_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Prize data at this point in time
  remaining_top_prizes INTEGER NOT NULL,
  tickets_remaining_estimate BIGINT,
  days_since_launch INTEGER,

  -- Calculated metrics
  top_prize_depletion_rate DECIMAL(5,4), -- prizes claimed per day
  expected_value DECIMAL(10,4), -- EV calculation

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(game_id, snapshot_date)
);

CREATE INDEX idx_snapshots_game_date ON historical_snapshots(game_id, snapshot_date DESC);

-- =====================================================
-- TABLE: stores
-- =====================================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) DEFAULT 'MN',
  zip_code VARCHAR(10),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Performance tracking
  total_wins_reported INTEGER DEFAULT 0,
  total_top_prize_wins INTEGER DEFAULT 0,
  last_win_date DATE,

  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Geospatial index for location queries
CREATE INDEX idx_stores_location ON stores(latitude, longitude);
CREATE INDEX idx_stores_city ON stores(city, state);

-- =====================================================
-- TABLE: wins
-- =====================================================
CREATE TABLE wins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

  prize_amount DECIMAL(12,2) NOT NULL,
  win_date DATE NOT NULL,
  claimed_date DATE,

  -- Source verification
  source VARCHAR(50), -- 'official', 'news', 'user_report'
  source_url TEXT,
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wins_game ON wins(game_id);
CREATE INDEX idx_wins_store ON wins(store_id);
CREATE INDEX idx_wins_date ON wins(win_date DESC);

-- =====================================================
-- TABLE: predictions
-- =====================================================
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  prediction_date DATE NOT NULL,

  -- Model outputs
  ai_score DECIMAL(5,2) NOT NULL, -- 0-100 score
  win_probability DECIMAL(8,6), -- 0.0 to 1.0
  expected_value DECIMAL(10,4),
  confidence_level DECIMAL(4,2), -- Model confidence 0-100

  -- Model metadata
  model_version VARCHAR(50),
  features_used JSONB, -- Which features the model considered

  -- Recommendation
  recommendation VARCHAR(20), -- 'strong_buy', 'buy', 'neutral', 'avoid', 'strong_avoid'
  reasoning TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(game_id, prediction_date, model_version)
);

CREATE INDEX idx_predictions_game_date ON predictions(game_id, prediction_date DESC);
CREATE INDEX idx_predictions_score ON predictions(ai_score DESC);

-- =====================================================
-- TABLE: user_scans
-- =====================================================
CREATE TABLE user_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- From Supabase Auth
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

  scan_date TIMESTAMP DEFAULT NOW(),
  was_winner BOOLEAN,
  prize_amount DECIMAL(10,2),

  -- Context
  device_id VARCHAR(255),
  app_version VARCHAR(20),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scans_user ON user_scans(user_id);
CREATE INDEX idx_scans_game ON user_scans(game_id);
CREATE INDEX idx_scans_date ON user_scans(scan_date DESC);

-- =====================================================
-- TABLE: model_performance
-- =====================================================
CREATE TABLE model_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_version VARCHAR(50) NOT NULL,
  evaluation_date DATE NOT NULL,

  -- Metrics
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  mean_absolute_error DECIMAL(10,4),

  -- Test set info
  test_set_size INTEGER,
  training_set_size INTEGER,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(model_version, evaluation_date)
);

CREATE INDEX idx_model_perf_version ON model_performance(model_version, evaluation_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance ENABLE ROW LEVEL SECURITY;

-- Public read access for most tables
CREATE POLICY "Public read access for games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read access for prize_tiers" ON prize_tiers FOR SELECT USING (true);
CREATE POLICY "Public read access for historical_snapshots" ON historical_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read access for stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read access for wins" ON wins FOR SELECT USING (true);
CREATE POLICY "Public read access for predictions" ON predictions FOR SELECT USING (true);

-- User scans - users can only read their own scans
CREATE POLICY "Users can read own scans" ON user_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON user_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Model performance - public read
CREATE POLICY "Public read access for model_performance" ON model_performance FOR SELECT USING (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate expected value
CREATE OR REPLACE FUNCTION calculate_expected_value(
  p_game_id UUID
) RETURNS DECIMAL(10,4) AS $$
DECLARE
  v_ev DECIMAL(10,4);
BEGIN
  SELECT
    SUM((prize_amount * remaining_prizes) / NULLIF(tickets_remaining_estimate, 0))
  INTO v_ev
  FROM prize_tiers pt
  JOIN games g ON g.id = pt.game_id
  WHERE pt.game_id = p_game_id;

  RETURN COALESCE(v_ev, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get distance between two coordinates (miles)
CREATE OR REPLACE FUNCTION distance_miles(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    3959 * ACOS(
      COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
      COS(RADIANS(lon2) - RADIANS(lon1)) +
      SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Active games with latest predictions
CREATE OR REPLACE VIEW active_games_with_predictions AS
SELECT
  g.*,
  p.ai_score,
  p.win_probability,
  p.expected_value,
  p.recommendation,
  p.confidence_level,
  p.prediction_date
FROM games g
LEFT JOIN LATERAL (
  SELECT * FROM predictions
  WHERE game_id = g.id
  ORDER BY prediction_date DESC
  LIMIT 1
) p ON true
WHERE g.is_active = true
ORDER BY p.ai_score DESC NULLS LAST;

-- View: Top performing stores
CREATE OR REPLACE VIEW top_stores AS
SELECT
  s.*,
  COUNT(w.id) as total_verified_wins,
  SUM(w.prize_amount) as total_prize_amount
FROM stores s
LEFT JOIN wins w ON w.store_id = s.id AND w.is_verified = true
GROUP BY s.id
ORDER BY total_verified_wins DESC, total_prize_amount DESC;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL SEED DATA (Optional)
-- =====================================================

-- This will be populated by the scraper
-- But we can add a test game for development

INSERT INTO games (
  game_number,
  game_name,
  ticket_price,
  top_prize_amount,
  total_top_prizes,
  remaining_top_prizes,
  overall_odds,
  is_active
) VALUES (
  'TEST-001',
  'Test Scratch Game - DO NOT USE IN PRODUCTION',
  5.00,
  100000.00,
  5,
  3,
  '1 in 3.5',
  false
) ON CONFLICT (game_number) DO NOTHING;

-- =====================================================
-- COMPLETE!
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE 'Tables created: 8';
  RAISE NOTICE 'Indexes created: 20+';
  RAISE NOTICE 'Views created: 2';
  RAISE NOTICE 'Ready for scraper integration!';
END $$;
