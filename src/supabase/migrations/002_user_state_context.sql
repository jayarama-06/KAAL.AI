-- User State & Context Tracking for Proactive AI
-- This enables KAAL to know user's mood, energy, and context in real-time

-- User State Check-ins table
CREATE TABLE IF NOT EXISTS user_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  
  -- Energy & Mood tracking
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
  mood TEXT NOT NULL CHECK (mood IN ('energized', 'focused', 'calm', 'tired', 'stressed', 'overwhelmed', 'anxious', 'motivated')),
  mental_clarity INTEGER NOT NULL CHECK (mental_clarity >= 1 AND mental_clarity <= 5),
  physical_state TEXT CHECK (physical_state IN ('rested', 'normal', 'fatigued', 'restless', 'sick')),
  
  -- Context information
  location TEXT, -- 'home', 'office', 'cafe', 'other'
  environment_noise TEXT CHECK (environment_noise IN ('silent', 'quiet', 'moderate', 'noisy')),
  time_available INTEGER, -- minutes available for work
  
  -- AI analysis results
  ai_recommendations JSONB DEFAULT '[]',
  optimal_task_types TEXT[] DEFAULT '{}', -- ['creative', 'analytical', 'routine', 'collaborative']
  suggested_session_duration INTEGER, -- AI suggested focus duration
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Energy patterns analysis table (for ML/pattern recognition)
CREATE TABLE IF NOT EXISTS energy_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  
  -- Time-based patterns
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  avg_energy_level NUMERIC(3,2),
  avg_focus_quality NUMERIC(3,2),
  
  -- Pattern metadata
  sample_size INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, hour_of_day, day_of_week),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- AI Insights & Nudges table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  
  -- Insight details
  type TEXT NOT NULL CHECK (type IN ('nudge', 'warning', 'celebration', 'suggestion', 'recommendation')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Action data
  action_label TEXT,
  action_type TEXT, -- 'start_focus', 'take_break', 'switch_task', etc.
  action_data JSONB,
  
  -- State
  dismissed BOOLEAN DEFAULT FALSE,
  acted_upon BOOLEAN DEFAULT FALSE,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  dismissed_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Context switches tracking (for cognitive load analysis)
CREATE TABLE IF NOT EXISTS context_switches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  session_id TEXT, -- optional: link to focus session
  
  from_context TEXT NOT NULL,
  to_context TEXT NOT NULL,
  switch_reason TEXT CHECK (switch_reason IN ('user', 'notification', 'scheduled', 'break')),
  cognitive_cost INTEGER, -- estimated cost in minutes
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES focus_sessions(id) ON DELETE SET NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_states_user_id ON user_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_states_created_at ON user_states(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_energy_patterns_user_id ON energy_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_patterns_time ON energy_patterns(hour_of_day, day_of_week);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_dismissed ON ai_insights(dismissed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_context_switches_user_id ON context_switches(user_id);
CREATE INDEX IF NOT EXISTS idx_context_switches_session ON context_switches(session_id);

-- Enable Row Level Security
ALTER TABLE user_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_switches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_states
CREATE POLICY "Users can view their own state" ON user_states
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own state" ON user_states
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- RLS Policies for energy_patterns
CREATE POLICY "Users can view their own patterns" ON energy_patterns
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own patterns" ON energy_patterns
  FOR ALL USING (auth.uid()::text = user_id);

-- RLS Policies for ai_insights
CREATE POLICY "Users can view their own insights" ON ai_insights
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own insights" ON ai_insights
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "System can create insights" ON ai_insights
  FOR INSERT WITH CHECK (TRUE); -- Allows system to create insights

-- RLS Policies for context_switches
CREATE POLICY "Users can view their own switches" ON context_switches
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own switches" ON context_switches
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Function to update energy patterns (called after each check-in)
CREATE OR REPLACE FUNCTION update_energy_pattern()
RETURNS TRIGGER AS $$
DECLARE
  current_hour INTEGER;
  current_day INTEGER;
BEGIN
  current_hour := EXTRACT(HOUR FROM NEW.created_at);
  current_day := EXTRACT(DOW FROM NEW.created_at);
  
  INSERT INTO energy_patterns (
    user_id,
    hour_of_day,
    day_of_week,
    avg_energy_level,
    avg_focus_quality,
    sample_size
  )
  VALUES (
    NEW.user_id,
    current_hour,
    current_day,
    NEW.energy_level,
    NEW.mental_clarity,
    1
  )
  ON CONFLICT (user_id, hour_of_day, day_of_week)
  DO UPDATE SET
    avg_energy_level = (
      (energy_patterns.avg_energy_level * energy_patterns.sample_size + NEW.energy_level) 
      / (energy_patterns.sample_size + 1)
    ),
    avg_focus_quality = (
      (energy_patterns.avg_focus_quality * energy_patterns.sample_size + NEW.mental_clarity)
      / (energy_patterns.sample_size + 1)
    ),
    sample_size = energy_patterns.sample_size + 1,
    last_updated = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update energy patterns
CREATE TRIGGER on_user_state_created
  AFTER INSERT ON user_states
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_pattern();

-- Function to get optimal hours for a user
CREATE OR REPLACE FUNCTION get_optimal_hours(p_user_id TEXT)
RETURNS TABLE (
  hour_of_day INTEGER,
  avg_energy NUMERIC,
  avg_focus NUMERIC,
  confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ep.hour_of_day,
    ep.avg_energy_level as avg_energy,
    ep.avg_focus_quality as avg_focus,
    LEAST(ep.sample_size / 10.0, 1.0) as confidence
  FROM energy_patterns ep
  WHERE ep.user_id = p_user_id
    AND ep.sample_size >= 3
  ORDER BY (ep.avg_energy_level + ep.avg_focus_quality) DESC
  LIMIT 6;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: Recent user states for quick access
CREATE OR REPLACE VIEW recent_user_states AS
SELECT 
  user_id,
  energy_level,
  mood,
  mental_clarity,
  physical_state,
  created_at,
  ai_recommendations,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as recency_rank
FROM user_states
WHERE created_at > NOW() - INTERVAL '24 hours';

-- View: Active AI insights
CREATE OR REPLACE VIEW active_ai_insights AS
SELECT
  id,
  user_id,
  type,
  priority,
  title,
  message,
  action_label,
  action_type,
  action_data,
  created_at
FROM ai_insights
WHERE dismissed = FALSE
  AND created_at > NOW() - INTERVAL '4 hours'
ORDER BY 
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC;
