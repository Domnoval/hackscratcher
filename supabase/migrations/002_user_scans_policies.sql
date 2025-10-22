-- Enable Row Level Security on user_scans table
ALTER TABLE user_scans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own scan results
-- (Later we'll restrict this to authenticated users when we add auth)
CREATE POLICY "Allow anyone to insert scan results"
ON user_scans
FOR INSERT
WITH CHECK (true);

-- Allow users to read their own scan history
-- (For now, allow all reads - will restrict by user_id after auth)
CREATE POLICY "Allow anyone to read scan results"
ON user_scans
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_scans_game_id ON user_scans(game_id);
CREATE INDEX IF NOT EXISTS idx_user_scans_scan_date ON user_scans(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_scans_was_winner ON user_scans(was_winner);

-- Add helpful comment
COMMENT ON TABLE user_scans IS 'Tracks user ticket purchases and wins/losses for model validation and gamification';
