-- ═══════════════════════════════════════════════════════════════════════════
-- KAAL Algorithm System - Database Migrations
-- Adds columns for task calibration, CLS auto-scoring, and productivity tracking
-- ═══════════════════════════════════════════════════════════════════════════

-- Add task timing and calibration columns
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS actual_minutes INTEGER,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cognitive_load_score INTEGER CHECK (cognitive_load_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS auto_category TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_actual_time 
ON tasks(user_id, actual_minutes) 
WHERE actual_minutes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_cls 
ON tasks(user_id, cognitive_load_score) 
WHERE cognitive_load_score IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN tasks.actual_minutes IS 'Actual time spent on task (in minutes)';
COMMENT ON COLUMN tasks.started_at IS 'When user clicked Start on this task';
COMMENT ON COLUMN tasks.cognitive_load_score IS 'Auto-scored cognitive load (1=trivial, 10=intense)';
COMMENT ON COLUMN tasks.auto_category IS 'Auto-tagged category from keyword analysis';

-- ─────────────────────────────────────────────────────────────────────────────
-- Energy Pattern Analysis Functions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_energy_by_hour(p_user_id UUID)
RETURNS TABLE (
  hour_of_day INTEGER,
  avg_energy NUMERIC,
  sample_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::INTEGER AS hour_of_day,
    ROUND(AVG(energy_level)::NUMERIC, 2) AS avg_energy,
    COUNT(*) AS sample_size
  FROM energy_checkins
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days'
  GROUP BY hour_of_day
  ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_energy_by_day(p_user_id UUID)
RETURNS TABLE (
  day_of_week TEXT,
  day_number INTEGER,
  avg_energy NUMERIC,
  sample_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(created_at, 'Day') AS day_of_week,
    EXTRACT(DOW FROM created_at)::INTEGER AS day_number,
    ROUND(AVG(energy_level)::NUMERIC, 2) AS avg_energy,
    COUNT(*) AS sample_size
  FROM energy_checkins
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days'
  GROUP BY day_of_week, day_number
  ORDER BY avg_energy DESC;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- Task Calibration Function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_calibration_factor(p_user_id UUID)
RETURNS TABLE (
  calibration_factor NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(
      AVG(actual_minutes::float / NULLIF(estimated_minutes, 0))::NUMERIC,
      2
    ) AS calibration_factor
  FROM tasks
  WHERE user_id = p_user_id
    AND actual_minutes IS NOT NULL
    AND estimated_minutes > 0
    AND created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- Performance Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- Energy check-ins by hour and day (for pattern analysis)
CREATE INDEX IF NOT EXISTS idx_energy_checkins_hour 
ON energy_checkins(user_id, (EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::INTEGER));

CREATE INDEX IF NOT EXISTS idx_energy_checkins_day 
ON energy_checkins(user_id, (EXTRACT(DOW FROM created_at)::INTEGER));

-- Task completion tracking (for burnout detection)
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at 
ON tasks(user_id, status, updated_at) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_tasks_deferred_at 
ON tasks(user_id, status, updated_at) 
WHERE status = 'deferred';

-- Daily productivity score calculations
CREATE INDEX IF NOT EXISTS idx_tasks_daily 
ON tasks(user_id, created_at, status);

CREATE INDEX IF NOT EXISTS idx_energy_checkins_daily 
ON energy_checkins(user_id, created_at);
