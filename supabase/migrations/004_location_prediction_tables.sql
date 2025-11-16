-- Migration 004: AI Location Prediction Tables
-- Creates tables to collect training data for location-based predictions
-- Frontend will show "Coming Soon" while backend silently collects data

-- ============================================================
-- 1. RETAILERS TABLE
-- Stores lottery retailer information
-- ============================================================

CREATE TABLE IF NOT EXISTS retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  retailer_type TEXT, -- gas_station, grocery, convenience, liquor, pharmacy, etc.

  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  county TEXT,

  -- Contact
  phone TEXT,
  hours_of_operation JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_verified_at TIMESTAMP,

  -- Data quality
  geocode_quality TEXT, -- exact, approximate, unknown
  data_source TEXT -- mn_lottery, fl_lottery, manual, etc.
);

-- Indexes for performance
CREATE INDEX idx_retailers_location ON retailers (state, city);
CREATE INDEX idx_retailers_coords ON retailers (latitude, longitude);
CREATE INDEX idx_retailers_active ON retailers (is_active) WHERE is_active = true;
CREATE INDEX idx_retailers_state ON retailers (state);
CREATE UNIQUE INDEX idx_retailers_license ON retailers (license_number) WHERE license_number IS NOT NULL;

-- ============================================================
-- 2. WINNING TICKETS TABLE
-- Tracks where and when winning tickets were sold
-- This is the GOLD for training the AI model
-- ============================================================

CREATE TABLE IF NOT EXISTS winning_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Game info
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  game_number INTEGER NOT NULL,
  game_name TEXT,

  -- Prize info
  prize_tier TEXT, -- top_prize, second_prize, or dollar amount
  prize_amount DECIMAL(12, 2) NOT NULL,

  -- Location info (CRITICAL for model)
  retailer_id UUID REFERENCES retailers(id) ON DELETE SET NULL,
  retailer_name TEXT, -- Denormalized for data preservation
  city TEXT,
  state TEXT NOT NULL,

  -- Temporal info (CRITICAL for model)
  sold_at TIMESTAMP, -- When ticket was purchased (if known)
  claimed_at TIMESTAMP, -- When prize was claimed
  announced_at TIMESTAMP, -- When lottery announced the win

  -- Ticket details
  ticket_number TEXT,
  batch_number TEXT,
  claim_status TEXT DEFAULT 'claimed', -- claimed, unclaimed, expired

  -- Data quality
  scrape_source TEXT NOT NULL, -- mn_lottery_winners, fl_lottery_winners, user_scan
  verification_status TEXT DEFAULT 'unverified', -- verified, unverified, disputed
  raw_data JSONB, -- Store original scraped data

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ML training queries
CREATE INDEX idx_winning_tickets_retailer ON winning_tickets (retailer_id);
CREATE INDEX idx_winning_tickets_game ON winning_tickets (game_number);
CREATE INDEX idx_winning_tickets_date ON winning_tickets (claimed_at DESC NULLS LAST);
CREATE INDEX idx_winning_tickets_prize ON winning_tickets (prize_amount);
CREATE INDEX idx_winning_tickets_state ON winning_tickets (state);
CREATE INDEX idx_winning_tickets_location ON winning_tickets (retailer_id, claimed_at);

-- ============================================================
-- 3. RETAILER STATS TABLE (Materialized View Alternative)
-- Pre-computed statistics for faster ML feature extraction
-- Updated by triggers or daily job
-- ============================================================

CREATE TABLE IF NOT EXISTS retailer_stats (
  retailer_id UUID PRIMARY KEY REFERENCES retailers(id) ON DELETE CASCADE,

  -- Win counts by time period
  total_wins_lifetime INTEGER DEFAULT 0,
  total_wins_365d INTEGER DEFAULT 0,
  total_wins_90d INTEGER DEFAULT 0,
  total_wins_30d INTEGER DEFAULT 0,
  total_wins_7d INTEGER DEFAULT 0,

  -- Prize statistics
  total_prize_amount DECIMAL(14, 2) DEFAULT 0,
  avg_prize_amount DECIMAL(12, 2) DEFAULT 0,
  max_prize_amount DECIMAL(12, 2) DEFAULT 0,
  median_prize_amount DECIMAL(12, 2),

  -- Temporal patterns
  days_since_last_win INTEGER,
  last_win_date TIMESTAMP,
  first_win_date TIMESTAMP,
  avg_days_between_wins DECIMAL(8, 2),

  -- Win distribution by prize tier
  top_prize_wins INTEGER DEFAULT 0,
  high_prize_wins INTEGER DEFAULT 0, -- $10,000+
  medium_prize_wins INTEGER DEFAULT 0, -- $1,000 - $9,999
  low_prize_wins INTEGER DEFAULT 0, -- Under $1,000

  -- Trends
  win_trend TEXT, -- heating_up, stable, cooling_down, insufficient_data
  momentum_7d INTEGER DEFAULT 0, -- Net change in weekly wins

  -- Last calculated
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retailer_stats_updated ON retailer_stats (last_updated);

-- ============================================================
-- 4. RETAILER PREDICTIONS TABLE (For Future Use)
-- Will store ML model predictions once trained
-- Currently empty - will be populated when model is ready
-- ============================================================

CREATE TABLE IF NOT EXISTS retailer_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,

  -- Predictions (placeholders for now)
  hotness_score DECIMAL(5, 4), -- 0.0000 to 1.0000
  predicted_next_win_days INTEGER,
  confidence_level DECIMAL(5, 4),

  -- Features snapshot
  features JSONB, -- Store feature vector used for prediction

  -- Model info
  model_version TEXT,
  model_type TEXT, -- xgboost, neural_network, etc.

  -- Validity
  predicted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Predictions expire after 24-48 hours

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retailer_predictions_retailer ON retailer_predictions (retailer_id);
CREATE INDEX idx_retailer_predictions_expires ON retailer_predictions (expires_at);

-- ============================================================
-- 5. DATA COLLECTION LOG
-- Track scraping runs for monitoring
-- ============================================================

CREATE TABLE IF NOT EXISTS data_collection_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  job_type TEXT NOT NULL, -- winner_scrape, retailer_update, stats_calculation
  state TEXT, -- MN, FL, etc.

  -- Results
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL, -- success, partial_success, failed
  error_message TEXT,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Metadata
  triggered_by TEXT, -- github_action, manual, scheduled
  run_id TEXT -- GitHub run ID or UUID
);

CREATE INDEX idx_data_collection_log_type ON data_collection_log (job_type, started_at DESC);
CREATE INDEX idx_data_collection_log_status ON data_collection_log (status);

-- ============================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update retailer_stats when winning_ticket is inserted
CREATE OR REPLACE FUNCTION update_retailer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update stats
  INSERT INTO retailer_stats (retailer_id, last_updated)
  VALUES (NEW.retailer_id, NOW())
  ON CONFLICT (retailer_id)
  DO UPDATE SET last_updated = NOW();

  -- Trigger a stats recalculation (will be done by background job)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on winning_tickets insert
CREATE TRIGGER trigger_update_retailer_stats
AFTER INSERT ON winning_tickets
FOR EACH ROW
WHEN (NEW.retailer_id IS NOT NULL)
EXECUTE FUNCTION update_retailer_stats();

-- ============================================================
-- 7. INITIAL DATA
-- ============================================================

-- Insert data collection log entry for this migration
INSERT INTO data_collection_log (
  job_type,
  status,
  records_processed,
  triggered_by,
  run_id
) VALUES (
  'migration',
  'success',
  0,
  'migration_004',
  '004_location_prediction_tables'
);

-- ============================================================
-- NOTES
-- ============================================================

COMMENT ON TABLE retailers IS 'Lottery retailers where tickets are sold';
COMMENT ON TABLE winning_tickets IS 'Historical winning tickets - PRIMARY TRAINING DATA for location AI';
COMMENT ON TABLE retailer_stats IS 'Pre-computed retailer statistics for ML feature extraction';
COMMENT ON TABLE retailer_predictions IS 'AI-generated predictions (populated when model is trained)';
COMMENT ON TABLE data_collection_log IS 'Audit log for data collection jobs';

COMMENT ON COLUMN winning_tickets.claimed_at IS 'Primary temporal feature for ML training';
COMMENT ON COLUMN winning_tickets.retailer_id IS 'Primary location feature for ML training';
COMMENT ON COLUMN winning_tickets.prize_amount IS 'Target variable for ML training';
