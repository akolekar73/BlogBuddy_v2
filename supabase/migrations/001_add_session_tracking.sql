-- BlogBuddy v2 Migration: Add session tracking and refinement data
-- Run this in Supabase SQL Editor after the initial schema

-- 1. Add refinement_data column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS refinement_data JSONB DEFAULT '{}';

-- 2. Add session_id to api_usage for real-time session monitoring
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 3. Create index for session-based queries
CREATE INDEX IF NOT EXISTS idx_usage_session ON api_usage(session_id);

-- 4. Add comment explaining session_id purpose
COMMENT ON COLUMN api_usage.session_id IS 'Tracks usage within a single user session for real-time monitoring';

-- 5. Ensure created_at index exists for time-based queries
CREATE INDEX IF NOT EXISTS idx_usage_created ON api_usage(created_at DESC);
