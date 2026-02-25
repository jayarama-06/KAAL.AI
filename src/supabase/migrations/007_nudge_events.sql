-- =====================================================
-- NUDGE EVENTS TABLE
-- =====================================================
-- Tracks all nudge interactions for behavioral learning

CREATE TABLE IF NOT EXISTS nudge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Nudge details
  nudge_type TEXT NOT NULL CHECK (nudge_type IN (
    'gentle',
    'active', 
    'intervention',
    'context_switch',
    'break_reminder'
  )),
  nudge_message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User response
  outcome TEXT CHECK (outcome IN (
    'started',
    'deferred',
    'dismissed',
    'ignored'
  )),
  response_delay_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_nudge_events_user_id ON nudge_events(user_id);
CREATE INDEX IF NOT EXISTS idx_nudge_events_task_id ON nudge_events(task_id);
CREATE INDEX IF NOT EXISTS idx_nudge_events_sent_at ON nudge_events(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nudge_events_outcome ON nudge_events(outcome);

-- Enable Row Level Security
ALTER TABLE nudge_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nudge events"
  ON nudge_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nudge events"
  ON nudge_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get nudge history hint for AI personalization
CREATE OR REPLACE FUNCTION get_nudge_history_hint(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hint TEXT;
  v_total_count INTEGER;
  v_gentle_started INTEGER;
  v_active_started INTEGER;
  v_intervention_started INTEGER;
BEGIN
  -- Get total nudge count in last 30 days
  SELECT COUNT(*)
  INTO v_total_count
  FROM nudge_events
  WHERE user_id = p_user_id
    AND sent_at > NOW() - INTERVAL '30 days';
  
  IF v_total_count = 0 THEN
    RETURN 'No nudge history for this user yet.';
  END IF;
  
  -- Get outcome stats by type
  SELECT 
    COUNT(*) FILTER (WHERE nudge_type = 'gentle' AND outcome = 'started'),
    COUNT(*) FILTER (WHERE nudge_type = 'active' AND outcome = 'started'),
    COUNT(*) FILTER (WHERE nudge_type = 'intervention' AND outcome = 'started')
  INTO v_gentle_started, v_active_started, v_intervention_started
  FROM nudge_events
  WHERE user_id = p_user_id
    AND sent_at > NOW() - INTERVAL '30 days';
  
  -- Build hint string
  v_hint := 'Nudge history: ';
  
  IF v_gentle_started > 0 THEN
    v_hint := v_hint || 'responds well to gentle nudges; ';
  END IF;
  
  IF v_active_started > v_gentle_started THEN
    v_hint := v_hint || 'prefers direct action prompts; ';
  END IF;
  
  IF v_intervention_started > 0 THEN
    v_hint := v_hint || 'needs firm interventions for overdue tasks; ';
  END IF;
  
  RETURN v_hint;
END;
$$;

-- View: Recent nudge events for quick access
CREATE OR REPLACE VIEW recent_nudge_events AS
SELECT 
  user_id,
  task_id,
  nudge_type,
  outcome,
  sent_at,
  response_delay_seconds,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY sent_at DESC) as recency_rank
FROM nudge_events
WHERE sent_at > NOW() - INTERVAL '30 days'
  AND outcome IS NOT NULL;

COMMENT ON TABLE nudge_events IS 'Tracks all KAAL nudge interactions for behavioral learning and AI personalization';
COMMENT ON COLUMN nudge_events.nudge_type IS 'Type of nudge: gentle (auto-dismiss), active (with action), intervention (modal), context_switch, break_reminder';
COMMENT ON COLUMN nudge_events.outcome IS 'User response: started (acted on), deferred (rescheduled), dismissed (closed), ignored (auto-dismissed)';
COMMENT ON COLUMN nudge_events.response_delay_seconds IS 'Time between nudge sent and user action, used to measure nudge effectiveness';
