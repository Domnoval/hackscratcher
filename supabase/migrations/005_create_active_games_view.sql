-- Migration 005: Create active_games_with_predictions view
-- This view joins games with their predictions for easy querying

-- Drop view if exists (for re-running migration)
DROP VIEW IF EXISTS active_games_with_predictions;

-- Create view that shows active games with their predictions
CREATE VIEW active_games_with_predictions AS
SELECT
  g.id,
  g.game_number,
  g.game_name,
  g.ticket_price,
  g.overall_odds,
  g.top_prize_amount,
  g.total_top_prizes,
  g.remaining_top_prizes,
  g.is_active,
  g.game_start_date,
  g.created_at,
  g.updated_at,
  g.total_tickets_printed,
  g.state,

  -- Prediction fields (NULL if no prediction exists yet)
  p.ai_score,
  p.confidence_level,
  p.recommendation,
  p.reasoning,
  p.win_probability,
  p.created_at as prediction_created_at
FROM games g
LEFT JOIN predictions p ON g.id = p.game_id
WHERE g.is_active = true
ORDER BY g.game_number DESC;

-- Grant access to authenticated and anonymous users
GRANT SELECT ON active_games_with_predictions TO anon, authenticated;

-- Also ensure base tables have proper access
GRANT SELECT ON games TO anon, authenticated;
GRANT SELECT ON predictions TO anon, authenticated;

-- Enable RLS on games and predictions if not already enabled
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access
DROP POLICY IF EXISTS "Allow public read access to games" ON games;
CREATE POLICY "Allow public read access to games" ON games
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to predictions" ON predictions;
CREATE POLICY "Allow public read access to predictions" ON predictions
  FOR SELECT USING (true);

-- Verify view was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'active_games_with_predictions'
  ) THEN
    RAISE NOTICE 'View active_games_with_predictions created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create view active_games_with_predictions';
  END IF;
END $$;
