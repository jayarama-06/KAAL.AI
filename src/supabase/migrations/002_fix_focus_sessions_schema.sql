-- Migration: Fix focus_sessions table schema
-- Run this in your Supabase SQL Editor to fix the duration column issue

-- Drop the old table if it exists (WARNING: This will delete existing focus session data)
-- If you want to preserve data, you'll need to do a more complex migration
DROP TABLE IF EXISTS focus_sessions CASCADE;

-- Recreate the table with the correct schema
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  planned_duration INTEGER NOT NULL,
  actual_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  focus_score INTEGER CHECK (focus_score >= 0 AND focus_score <= 100),
  interruptions INTEGER DEFAULT 0,
  context_switches INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  completion_percentage INTEGER DEFAULT 0,
  created_at BIGINT,
  updated_at BIGINT
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON focus_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON focus_sessions(status);

-- Re-enable Row Level Security
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "Allow all operations" ON focus_sessions;
CREATE POLICY "Allow all operations" ON focus_sessions FOR ALL USING (true);
