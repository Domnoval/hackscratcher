-- Multi-State Support Migration
-- Allows Minnesota and Florida (and future states) to coexist

-- Drop old unique constraint on game_number alone
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_game_number_key;

-- Add new compound unique constraint: (state, game_number)
-- This allows game #2066 to exist in both MN and FL
ALTER TABLE games ADD CONSTRAINT games_state_game_number_key
  UNIQUE (state, game_number);

-- Add index for faster state-based queries
CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
CREATE INDEX IF NOT EXISTS idx_games_state_active ON games(state, is_active);

-- Update comments
COMMENT ON COLUMN games.state IS 'Two-letter state code (MN, FL, TX, etc.)';
COMMENT ON CONSTRAINT games_state_game_number_key ON games IS 'Each game number must be unique within a state';

-- Ensure all existing games have state set (default to MN)
UPDATE games SET state = 'MN' WHERE state IS NULL;

-- Make state NOT NULL going forward
ALTER TABLE games ALTER COLUMN state SET NOT NULL;
ALTER TABLE games ALTER COLUMN state SET DEFAULT 'MN';
