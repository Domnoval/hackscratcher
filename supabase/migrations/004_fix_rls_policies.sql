-- Fix Row Level Security Policies
-- This migration removes insecure policies and enforces proper authentication-based access control

-- =====================================================
-- DROP INSECURE POLICIES FROM MIGRATION 002
-- =====================================================

-- These policies allowed anyone to read/write all user data (security vulnerability)
DROP POLICY IF EXISTS "Allow anyone to insert scan results" ON user_scans;
DROP POLICY IF EXISTS "Allow anyone to read scan results" ON user_scans;

-- =====================================================
-- CREATE SECURE AUTH-BASED POLICIES
-- =====================================================

-- Users can only insert their own scan results
-- Ensures user_id matches the authenticated user's ID
CREATE POLICY "Users can insert own scans"
ON user_scans FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only read their own scan results
-- Prevents users from accessing other users' data
CREATE POLICY "Users can read own scans"
ON user_scans FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is enabled (should already be enabled from previous migrations)
DO $$
BEGIN
  IF NOT (
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'user_scans'
  ) THEN
    RAISE EXCEPTION 'Row Level Security is not enabled on user_scans table!';
  END IF;

  RAISE NOTICE '✅ Row Level Security policies fixed successfully!';
  RAISE NOTICE 'Users can now only access their own scan data.';
  RAISE NOTICE 'Auth-based policies: auth.uid() = user_id';
END $$;
