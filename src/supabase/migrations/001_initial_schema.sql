-- KAAL Database Schema
-- Production migration for multi-user support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at BIGINT NOT NULL,
  completed_at BIGINT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER
);

-- Focus sessions table
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

-- Energy logs table
CREATE TABLE IF NOT EXISTS energy_logs (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 100),
  mood TEXT,
  notes TEXT,
  activities TEXT[] DEFAULT '{}'
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  apps JSONB DEFAULT '[]',
  tasks TEXT[] DEFAULT '{}',
  created_at BIGINT NOT NULL
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY DEFAULT 'default-user',
  name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  work_style TEXT CHECK (work_style IN ('sprint', 'cyclic', 'marathon')),
  focus_baseline INTEGER DEFAULT 75,
  timezone TEXT,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_energy_timestamp ON energy_logs(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on auth needs)
CREATE POLICY "Allow all operations" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON focus_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON energy_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON workspaces FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON profiles FOR ALL USING (true);