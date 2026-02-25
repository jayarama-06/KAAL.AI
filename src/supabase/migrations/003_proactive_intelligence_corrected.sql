-- KAAL Proactive Intelligence Schema
-- Supports: Google Calendar sync, micro-interactions, statistical models, aggressive nudges
-- Corrected: Uses proper auth.uid() for RLS, removed ai_insights dependency

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
  model_type TEXT NOT NULL CHECK (model_type IN ('energy_forecast', 'task_completion', 'productivity_score', 'optimal_timing', 'break_timing')),
  algorithm TEXT, -- 'bayesian_network', 'time_series', 'regression', 'markov_chain'
  
  -- Model parameters (serialized)
  parameters JSONB NOT NULL DEFAULT '{}',
  
  -- Performance metrics
  accuracy NUMERIC(3,2), -- 0-1
  confidence NUMERIC(3,2), -- 0-1
  sample_size INTEGER DEFAULT 0,
  
  -- Training info
  trained_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  
  -- Status
  active BOOLEAN DEFAULT TRUE
);

-- Predictions (cached for performance)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES prediction_models(id) ON DELETE CASCADE,
  
  -- Prediction details
  prediction_type TEXT NOT NULL,
  prediction_time TIMESTAMP NOT NULL, -- When this prediction is for
  
  -- Predicted values
  predicted_value NUMERIC,
  predicted_label TEXT,
  confidence NUMERIC(3,2), -- 0-1
  
  -- Supporting data
  reasoning TEXT, -- Human-readable explanation
  factors JSONB, -- What influenced this prediction
  
  -- Validation
  actual_value NUMERIC, -- What actually happened
  actual_label TEXT,
  prediction_error NUMERIC,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Predictions become stale
);

-- Task Completion Analytics
CREATE TABLE IF NOT EXISTS task_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Completion metrics
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  accuracy_ratio NUMERIC(3,2), -- actual/estimated
  
  -- Context when completed
  completed_at TIMESTAMP NOT NULL,
  completed_hour INTEGER, -- 0-23
  completed_day INTEGER, -- 0-6 (Sunday-Saturday)
  
  energy_level_at_start INTEGER,
  energy_level_at_end INTEGER,
  mood_at_start TEXT,
  mood_at_end TEXT,
  
  -- Performance feedback
  difficulty_reported INTEGER CHECK (difficulty_reported >= 1 AND difficulty_reported <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  -- Interruptions & focus
  interruption_count INTEGER DEFAULT 0,
  focus_score INTEGER CHECK (focus_score >= 0 AND focus_score <= 100),
  
  -- AI analysis
  optimal_match BOOLEAN, -- Was this the right task for the state?
  recommendation_followed BOOLEAN -- Did user do AI recommendation?
);

-- Productivity Streaks & Achievements
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Streak details
  streak_type TEXT NOT NULL CHECK (streak_type IN ('daily_checkin', 'task_completion', 'focus_session', 'morning_routine', 'evening_reflection')),
  
  current_count INTEGER DEFAULT 0,
  best_count INTEGER DEFAULT 0,
  
  last_activity_date DATE,
  streak_start_date DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, streak_type)
);

-- Nudge Delivery & Effectiveness (removed ai_insights foreign key)
CREATE TABLE IF NOT EXISTS nudge_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Nudge details (storing message directly instead of linking to ai_insights)
  nudge_type TEXT NOT NULL CHECK (nudge_type IN ('task_reminder', 'break_suggestion', 'energy_check', 'celebration', 'recommendation')),
  message TEXT NOT NULL,
  title TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Delivery details
  channel TEXT NOT NULL CHECK (channel IN ('web_push', 'desktop', 'mobile', 'email', 'in_app', 'browser_extension')),
  delivered_at TIMESTAMP DEFAULT NOW(),
  
  -- User interaction
  viewed_at TIMESTAMP,
  clicked_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  acted_upon_at TIMESTAMP,
  
  action_taken TEXT, -- What did user do?
  
  -- Effectiveness
  helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
  
  -- Context
  context_data JSONB DEFAULT '{}'
);

-- User Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Aggressiveness level
  nudge_frequency TEXT DEFAULT 'aggressive' CHECK (nudge_frequency IN ('conservative', 'moderate', 'aggressive', 'custom')),
  
  -- Channel preferences
  web_push_enabled BOOLEAN DEFAULT TRUE,
  desktop_enabled BOOLEAN DEFAULT TRUE,
  mobile_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT TRUE,
  
  -- Timing preferences
  do_not_disturb_start TIME, -- e.g., '22:00'
  do_not_disturb_end TIME, -- e.g., '07:00'
  timezone TEXT,
  
  -- Custom frequencies (if nudge_frequency = 'custom')
  max_nudges_per_day INTEGER DEFAULT 20,
  min_minutes_between_nudges INTEGER DEFAULT 15,
  
  -- Specific nudge types
  break_reminders BOOLEAN DEFAULT TRUE,
  energy_check_ins BOOLEAN DEFAULT TRUE,
  celebration_messages BOOLEAN DEFAULT TRUE,
  task_suggestions BOOLEAN DEFAULT TRUE,
  productivity_insights BOOLEAN DEFAULT TRUE,
  
  -- Learning preferences
  micro_interaction_frequency TEXT DEFAULT 'high' CHECK (micro_interaction_frequency IN ('low', 'medium', 'high')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Schedule Density Analysis (for calendar intelligence)
CREATE TABLE IF NOT EXISTS schedule_density (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Time window
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  -- Density metrics
  meeting_minutes INTEGER DEFAULT 0,
  focus_block_minutes INTEGER DEFAULT 0,
  free_minutes INTEGER DEFAULT 0,
  
  -- Cognitive load
  total_cognitive_load NUMERIC(3,2),
  meeting_load NUMERIC(3,2),
  
  -- AI recommendations
  suitable_for_deep_work BOOLEAN,
  suitable_for_meetings BOOLEAN,
  optimal_for_breaks BOOLEAN,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date, hour)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_deleted ON calendar_events(deleted) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_micro_interactions_user_responded ON micro_interactions(user_id, responded_at);
CREATE INDEX IF NOT EXISTS idx_micro_interactions_pending ON micro_interactions(user_id, asked_at) WHERE responded_at IS NULL AND skipped = FALSE;
CREATE INDEX IF NOT EXISTS idx_predictions_user_type ON predictions(user_id, prediction_type, prediction_time);
CREATE INDEX IF NOT EXISTS idx_predictions_active ON predictions(expires_at) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_task_analytics_user_completed ON task_analytics(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_nudge_delivery_user_delivered ON nudge_delivery(user_id, delivered_at);
CREATE INDEX IF NOT EXISTS idx_schedule_density_user_date ON schedule_density(user_id, date, hour);

-- Enable Row Level Security
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_density ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users manage their calendar connections" ON calendar_connections FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users view their calendar events" ON calendar_events FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users manage their micro-interactions" ON micro_interactions FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users view their prediction models" ON prediction_models FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users view their predictions" ON predictions FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users view their task analytics" ON task_analytics FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users view their streaks" ON user_streaks FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users view their nudge delivery" ON nudge_delivery FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users manage their notification preferences" ON notification_preferences FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users view their schedule density" ON schedule_density FOR ALL USING (auth.uid()::text = user_id);

-- Function: Calculate schedule density after calendar sync
CREATE OR REPLACE FUNCTION calculate_schedule_density(p_user_id TEXT, p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_hour INTEGER;
BEGIN
  FOR v_hour IN 0..23 LOOP
    INSERT INTO schedule_density (
      user_id,
      date,
      hour,
      meeting_minutes,
      focus_block_minutes,
      free_minutes,
      total_cognitive_load
    )
    SELECT
      p_user_id,
      p_date,
      v_hour,
      COALESCE(SUM(CASE WHEN event_type = 'meeting' THEN EXTRACT(EPOCH FROM (end_time - start_time))/60 END), 0)::INTEGER,
      COALESCE(SUM(CASE WHEN event_type = 'focus_block' THEN EXTRACT(EPOCH FROM (end_time - start_time))/60 END), 0)::INTEGER,
      60 - COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/60), 0)::INTEGER,
      AVG(cognitive_load)
    FROM calendar_events
    WHERE user_id = p_user_id
      AND deleted = FALSE
      AND DATE(start_time) = p_date
      AND EXTRACT(HOUR FROM start_time) = v_hour
    ON CONFLICT (user_id, date, hour) 
    DO UPDATE SET
      meeting_minutes = EXCLUDED.meeting_minutes,
      focus_block_minutes = EXCLUDED.focus_block_minutes,
      free_minutes = EXCLUDED.free_minutes,
      total_cognitive_load = EXCLUDED.total_cognitive_load,
      calculated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id TEXT,
  p_streak_type TEXT,
  p_activity_date DATE
)
RETURNS VOID AS $$
DECLARE
  v_current_streak INTEGER;
  v_last_date DATE;
BEGIN
  SELECT current_count, last_activity_date
  INTO v_current_streak, v_last_date
  FROM user_streaks
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
  
  IF NOT FOUND THEN
    -- Create new streak
    INSERT INTO user_streaks (user_id, streak_type, current_count, best_count, last_activity_date, streak_start_date)
    VALUES (p_user_id, p_streak_type, 1, 1, p_activity_date, p_activity_date);
  ELSE
    -- Check if consecutive day
    IF p_activity_date = v_last_date + INTERVAL '1 day' THEN
      -- Continue streak
      UPDATE user_streaks
      SET 
        current_count = current_count + 1,
        best_count = GREATEST(best_count, current_count + 1),
        last_activity_date = p_activity_date,
        updated_at = NOW()
      WHERE user_id = p_user_id AND streak_type = p_streak_type;
    ELSIF p_activity_date > v_last_date + INTERVAL '1 day' THEN
      -- Streak broken, reset
      UPDATE user_streaks
      SET
        current_count = 1,
        last_activity_date = p_activity_date,
        streak_start_date = p_activity_date,
        updated_at = NOW()
      WHERE user_id = p_user_id AND streak_type = p_streak_type;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get optimal work hours based on historical data
CREATE OR REPLACE FUNCTION get_optimal_work_hours(p_user_id TEXT)
RETURNS TABLE (
  hour INTEGER,
  avg_completion_rate NUMERIC,
  avg_energy NUMERIC,
  avg_focus NUMERIC,
  confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ta.completed_hour as hour,
    (COUNT(*)::NUMERIC / NULLIF(SUM(COUNT(*)) OVER (), 0)) as avg_completion_rate,
    AVG(ta.energy_level_at_start) as avg_energy,
    AVG(ta.focus_score) as avg_focus,
    LEAST(COUNT(*) / 10.0, 1.0) as confidence
  FROM task_analytics ta
  WHERE ta.user_id = p_user_id
    AND ta.completed_at > NOW() - INTERVAL '30 days'
  GROUP BY ta.completed_hour
  ORDER BY avg_completion_rate DESC, avg_energy DESC
  LIMIT 6;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: Recent micro-interactions for pattern analysis
CREATE OR REPLACE VIEW recent_micro_interactions AS
SELECT
  mi.user_id,
  mi.question_type,
  mi.response_value,
  mi.asked_at,
  mi.context_data,
  ROW_NUMBER() OVER (PARTITION BY mi.user_id, mi.question_type ORDER BY mi.asked_at DESC) as recency_rank
FROM micro_interactions mi
WHERE mi.responded_at IS NOT NULL
  AND mi.asked_at > NOW() - INTERVAL '7 days';

-- View: Active predictions
CREATE OR REPLACE VIEW active_predictions AS
SELECT
  p.user_id,
  p.prediction_type,
  p.prediction_time,
  p.predicted_value,
  p.predicted_label,
  p.confidence,
  p.reasoning,
  pm.model_type,
  pm.accuracy as model_accuracy
FROM predictions p
JOIN prediction_models pm ON p.model_id = pm.id
WHERE p.expires_at > NOW()
  AND pm.active = TRUE
ORDER BY p.prediction_time;

-- Initialize notification preferences for existing users
INSERT INTO notification_preferences (user_id, nudge_frequency, timezone)
SELECT 
  user_id,
  'aggressive',
  COALESCE(timezone, 'UTC')
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

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
  RAISE NOTICE '';
  RAISE NOTICE '🔐 All tables have RLS enabled';
  RAISE NOTICE '🚀 Ready for proactive AI features!';
END $$;
