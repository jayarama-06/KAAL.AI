-- KAAL Proactive Intelligence Schema
-- Supports: Google Calendar sync, micro-interactions, statistical models, aggressive nudges
-- Fixed: Compatible with existing profiles table structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Google Calendar Integration
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  
  -- Sync metadata
  last_sync_at TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INTEGER DEFAULT 30,
  
  -- Permissions
  calendar_ids TEXT[] DEFAULT '{}', -- Which calendars to sync
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

-- Calendar Events (synced from external calendars)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  
  -- Event details
  external_id TEXT NOT NULL, -- ID from Google/Outlook
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  timezone TEXT,
  
  -- Classification
  event_type TEXT CHECK (event_type IN ('meeting', 'focus_block', 'personal', 'break', 'other')),
  attendee_count INTEGER DEFAULT 0,
  
  -- AI analysis
  cognitive_load INTEGER CHECK (cognitive_load >= 1 AND cognitive_load <= 5), -- How draining is this?
  energy_required INTEGER CHECK (energy_required >= 1 AND energy_required <= 5),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, external_id)
);

-- Micro-Interactions (conversational AI learning)
CREATE TABLE IF NOT EXISTS micro_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Interaction details
  type TEXT NOT NULL CHECK (type IN ('scheduled', 'state_triggered', 'celebration', 'followup')),
  trigger TEXT, -- What caused this? 'morning_checkin', 'task_completed', 'energy_drop', etc.
  
  -- Question & Answer
  question TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('energy', 'mood', 'productivity', 'task_feedback', 'context', 'why')),
  
  -- Response data
  response_type TEXT CHECK (response_type IN ('yes_no', 'emoji', 'scale', 'multi_choice', 'text')),
  response_value JSONB, -- Flexible storage for any response format
  
  -- Timing
  asked_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  skipped BOOLEAN DEFAULT FALSE,
  snoozed_until TIMESTAMP,
  
  -- Context when asked
  context_data JSONB DEFAULT '{}', -- Current energy, tasks pending, time of day, etc.
  
  -- Learning metadata
  confidence_impact NUMERIC(3,2) -- How much this improved our understanding (0-1)
);

-- Statistical Models & Predictions
CREATE TABLE IF NOT EXISTS prediction_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Model details
  model_type TEXT NOT NULL CHECK (model_type IN ('task_duration', 'energy_forecast', 'productivity_peak', 'task_difficulty')),
  algorithm TEXT, -- 'linear_regression', 'bayesian', 'time_series', etc.
  
  -- Model data
  parameters JSONB DEFAULT '{}', -- Model weights, coefficients, etc.
  feature_importance JSONB DEFAULT '{}', -- Which features matter most
  
  -- Performance metrics
  accuracy NUMERIC(4,3), -- 0-1 scale
  confidence NUMERIC(4,3),
  sample_size INTEGER DEFAULT 0,
  
  -- Training metadata
  trained_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Predictions (cached for performance)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES prediction_models(id) ON DELETE CASCADE,
  
  -- Prediction details
  prediction_type TEXT NOT NULL,
  target TEXT, -- What we're predicting: task_id, time window, etc.
  
  -- Result
  predicted_value JSONB NOT NULL, -- Flexible format for any prediction
  confidence NUMERIC(4,3),
  
  -- Validation (if we got actual result later)
  actual_value JSONB,
  prediction_error NUMERIC,
  
  -- Context at time of prediction
  input_features JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- When to invalidate this prediction
  validated_at TIMESTAMP -- When we got actual result
);

-- Task Analytics (detailed completion analysis)
CREATE TABLE IF NOT EXISTS task_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  
  -- Completion analysis
  completed_at TIMESTAMP NOT NULL,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  accuracy_ratio NUMERIC(4,2), -- actual / estimated
  
  -- Context when completed
  energy_at_completion INTEGER CHECK (energy_at_completion >= 1 AND energy_at_completion <= 5),
  mood_at_completion TEXT,
  time_of_day INTEGER CHECK (time_of_day >= 0 AND time_of_day <= 23), -- Hour (0-23)
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  
  -- Difficulty & satisfaction
  perceived_difficulty INTEGER CHECK (perceived_difficulty >= 1 AND perceived_difficulty <= 5),
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  
  -- Interruptions & focus
  interruption_count INTEGER DEFAULT 0,
  context_switches INTEGER DEFAULT 0,
  
  -- Tags & classification
  task_tags TEXT[] DEFAULT '{}',
  task_category TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Streaks (gamification)
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Streak details
  streak_type TEXT NOT NULL CHECK (streak_type IN ('daily_checkin', 'task_completion', 'focus_session', 'early_start')),
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  
  -- Timing
  current_start_date DATE,
  last_activity_date DATE,
  
  -- Rewards
  milestone_reached INTEGER DEFAULT 0, -- Track milestones: 3, 7, 14, 30, 50, 100 days
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, streak_type)
);

-- Nudge Delivery (multi-channel notification tracking)
CREATE TABLE IF NOT EXISTS nudge_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Nudge details
  nudge_type TEXT NOT NULL CHECK (nudge_type IN ('task_reminder', 'break_suggestion', 'energy_check', 'celebration', 'recommendation')),
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 5 = highest
  
  -- Delivery
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  
  -- User response
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  snoozed_until TIMESTAMP,
  
  -- Effectiveness
  action_taken BOOLEAN DEFAULT FALSE,
  action_type TEXT, -- 'completed_task', 'started_focus', 'took_break', etc.
  
  -- Context
  context_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Preferences (user control)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Channel settings
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  
  -- Frequency limits (per day)
  max_nudges_per_day INTEGER DEFAULT 10,
  
  -- Quiet hours
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME,   -- e.g., '07:00'
  
  -- Type preferences
  task_reminders_enabled BOOLEAN DEFAULT TRUE,
  break_suggestions_enabled BOOLEAN DEFAULT TRUE,
  energy_checks_enabled BOOLEAN DEFAULT TRUE,
  celebrations_enabled BOOLEAN DEFAULT TRUE,
  recommendations_enabled BOOLEAN DEFAULT TRUE,
  
  -- Smart settings
  adaptive_timing BOOLEAN DEFAULT TRUE, -- Let AI pick best times
  respect_calendar BOOLEAN DEFAULT TRUE, -- Don't nudge during meetings
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Schedule Density (pre-computed for performance)
CREATE TABLE IF NOT EXISTS schedule_density (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Time window
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  -- Metrics
  total_events INTEGER DEFAULT 0,
  meeting_count INTEGER DEFAULT 0,
  focus_block_count INTEGER DEFAULT 0,
  free_minutes INTEGER DEFAULT 60,
  
  -- Analysis
  average_cognitive_load NUMERIC(3,2), -- 1-5 scale
  is_good_for_deep_work BOOLEAN DEFAULT FALSE,
  context_switch_risk TEXT CHECK (context_switch_risk IN ('low', 'medium', 'high')),
  
  -- Recommendations
  recommended_task_types TEXT[] DEFAULT '{}', -- ['quick', 'routine', 'creative', 'strategic']
  
  computed_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date, hour)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_deleted ON calendar_events(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_micro_interactions_user_responded ON micro_interactions(user_id, responded_at);
CREATE INDEX IF NOT EXISTS idx_micro_interactions_pending ON micro_interactions(user_id, responded_at) WHERE responded_at IS NULL AND skipped = FALSE;
CREATE INDEX IF NOT EXISTS idx_predictions_user_type ON predictions(user_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_expires ON predictions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_analytics_user_completed ON task_analytics(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_type ON user_streaks(user_id, streak_type);
CREATE INDEX IF NOT EXISTS idx_nudge_delivery_user_sent ON nudge_delivery(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_schedule_density_user_date ON schedule_density(user_id, date, hour);

-- Row Level Security (RLS) Policies

-- Calendar Connections
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (user_id = current_setting('app.user_id', TRUE));

CREATE POLICY "Users can manage own calendar connections"
  ON calendar_connections FOR ALL
  USING (user_id = current_setting('app.user_id', TRUE));

-- Calendar Events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  USING (user_id = current_setting('app.user_id', TRUE));

CREATE POLICY "Users can manage own calendar events"
  ON calendar_events FOR ALL
  USING (user_id = current_setting('app.user_id', TRUE));

-- Micro Interactions
ALTER TABLE micro_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own micro interactions"
  ON micro_interactions FOR SELECT
  USING (user_id = current_setting('app.user_id', TRUE));

CREATE POLICY "Users can manage own micro interactions"
  ON micro_interactions FOR ALL
  USING (user_id = current_setting('app.user_id', TRUE));

-- All other tables follow same pattern
ALTER TABLE prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_density ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ KAAL Proactive Intelligence schema created successfully!';
  RAISE NOTICE '📊 Created 10 new tables:';
  RAISE NOTICE '   - calendar_connections';
  RAISE NOTICE '   - calendar_events';
  RAISE NOTICE '   - micro_interactions';
  RAISE NOTICE '   - prediction_models';
  RAISE NOTICE '   - predictions';
  RAISE NOTICE '   - task_analytics';
  RAISE NOTICE '   - user_streaks';
  RAISE NOTICE '   - nudge_delivery';
  RAISE NOTICE '   - notification_preferences';
  RAISE NOTICE '   - schedule_density';
END $$;
