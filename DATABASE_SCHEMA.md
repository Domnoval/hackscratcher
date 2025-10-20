# Scratch Oracle - Database Schema Design

## Tech Stack
- **Database:** Supabase (PostgreSQL)
- **Backend:** Vercel Serverless Functions
- **ML Pipeline:** Python + TensorFlow
- **Target State:** Minnesota

---

## Tables

### 1. `games`
Stores all scratch-off game information

```sql
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
```

### 2. `prize_tiers`
Tracks all prize levels for each game (not just top prize)

```sql
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
```

### 3. `historical_snapshots`
Daily/weekly snapshots for trend analysis (ML training data)

```sql
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

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_snapshots_game_date ON historical_snapshots(game_id, snapshot_date);
```

### 4. `stores`
Retailer locations (for heat map)

```sql
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

CREATE INDEX idx_stores_location ON stores USING GIST(
  ll_to_earth(latitude, longitude)
);
```

### 5. `wins`
Reported winning tickets (scraped from lottery announcements)

```sql
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
CREATE INDEX idx_wins_date ON wins(win_date);
```

### 6. `predictions`
AI/ML predictions for each game

```sql
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

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_game_date ON predictions(game_id, prediction_date);
```

### 7. `user_scans`
Track user ticket scans (for personalization + ML feedback)

```sql
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
```

### 8. `model_performance`
Track ML model accuracy over time

```sql
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
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Key Features

### 1. **Real-Time Data Updates**
- Scraper runs weekly (matches MN Lottery update schedule)
- Inserts new snapshot into `historical_snapshots`
- Updates `games` table with latest data

### 2. **Machine Learning Pipeline**
- Trains on `historical_snapshots` table
- Outputs predictions to `predictions` table
- Tracks performance in `model_performance`

### 3. **User Personalization**
- Tracks scans in `user_scans`
- Can build user-specific recommendations
- Feedback loop for model improvement

### 4. **Store Heat Map**
- `stores` table with geolocation
- `wins` table tracks where prizes were claimed
- ML can identify "hot" stores

---

## Next Steps

1. **Set up Supabase project**
2. **Run these SQL migrations**
3. **Build scraper to populate initial data**
4. **Collect 6-12 months of snapshots**
5. **Train first ML model**
