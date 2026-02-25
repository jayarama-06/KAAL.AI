# KAAL Analytics - Database Schema

Complete schema for all analytics engines. Add these tables to your Supabase database.

## Core Tables

### 1. focus_sessions
**One row per focus session — the foundation of all analytics**

```sql
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,            -- ended_at - started_at in minutes
  session_type TEXT CHECK (session_type IN ('deep_work','shallow_work','admin','break')),
  tasks_completed INTEGER DEFAULT 0,
  avg_cls_this_session FLOAT,          -- avg cognitive load score of completed tasks
  interruptions INTEGER DEFAULT 0,     -- how many times user switched away
  focus_score INTEGER,                 -- computed by Engine 3 at session end (0-100)
  energy_at_start INTEGER CHECK (energy_at_start BETWEEN 1 AND 3),
  energy_at_end INTEGER CHECK (energy_at_end BETWEEN 1 AND 3),
  created_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT valid_focus_score CHECK (focus_score IS NULL OR (focus_score BETWEEN 0 AND 100))
);

CREATE INDEX idx_focus_sessions_user_started ON focus_sessions(user_id, started_at DESC);
CREATE INDEX idx_focus_sessions_user_type ON focus_sessions(user_id, session_type);
```

**Usage:**
- Created when user starts a focus timer
- Updated when session ends with computed metrics
- Powers: Deep Work Ratio, Focus Score, Timeline, Peak Performance

---

### 2. daily_stats
**Materialized view computed nightly — makes Analytics load instantly**

```sql
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  date DATE NOT NULL,
  productivity_score INTEGER CHECK (productivity_score BETWEEN 0 AND 100),
  deep_work_hours FLOAT DEFAULT 0,
  shallow_work_hours FLOAT DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_deferred INTEGER DEFAULT 0,
  avg_session_length_mins FLOAT,
  deep_work_ratio FLOAT CHECK (deep_work_ratio BETWEEN 0 AND 1),
  focus_consistency_score FLOAT CHECK (focus_consistency_score BETWEEN 0 AND 100),
  best_focus_hour INTEGER CHECK (best_focus_hour BETWEEN 0 AND 23),
  cognitive_load_avg FLOAT,
  milestone_id UUID REFERENCES milestones(id),
  anomaly_type TEXT CHECK (anomaly_type IN ('breakout_day','burnout_risk')),
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);
CREATE INDEX idx_daily_stats_anomaly ON daily_stats(user_id, anomaly_type) WHERE anomaly_type IS NOT NULL;
```

**Computed by:** Nightly rollup job (runs at 2am UTC)
**Powers:** All trend analysis, anomaly detection, burnout risk, predictive insights

---

### 3. milestones
**Auto-detected achievements**

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT CHECK (milestone_type IN ('streak','deep_work','completion','custom','major','personal_best','score')),
  detected_at TIMESTAMP DEFAULT now(),
  dismissed BOOLEAN DEFAULT false,
  notified BOOLEAN DEFAULT false
);

CREATE INDEX idx_milestones_user_detected ON milestones(user_id, detected_at DESC);
CREATE INDEX idx_milestones_type ON milestones(user_id, milestone_type);
```

**Computed by:** Engine 9 (Milestone Detector) after each session end and daily rollup
**Powers:** Timeline milestones, achievement notifications

---

### 4. hourly_heatmap
**24-hour productivity heatmap**

```sql
CREATE TABLE hourly_heatmap (
  user_id UUID REFERENCES profiles(id) NOT NULL,
  hour_slot INTEGER CHECK (hour_slot BETWEEN 0 AND 23) NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL,
  avg_focus_score FLOAT DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  avg_tasks_completed FLOAT DEFAULT 0,
  avg_deep_work_ratio FLOAT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now(),
  
  PRIMARY KEY (user_id, hour_slot, day_of_week)
);

CREATE INDEX idx_hourly_heatmap_user ON hourly_heatmap(user_id);
```

**Updated by:** Engine 5 (Peak Performance Finder) after each session end
**Powers:** Peak Performance widget, best time recommendations

---

## Rollup Functions

### Nightly Daily Stats Rollup
**Run this function every night at 2am UTC via Supabase cron or external scheduler**

```sql
CREATE OR REPLACE FUNCTION compute_daily_stats(target_date DATE, target_user_id UUID)
RETURNS void AS $$
DECLARE
  v_deep_work_hours FLOAT;
  v_shallow_work_hours FLOAT;
  v_tasks_completed INT;
  v_avg_session_length FLOAT;
  v_deep_work_ratio FLOAT;
  v_productivity_score INT;
  v_best_focus_hour INT;
  v_cognitive_load_avg FLOAT;
BEGIN
  -- Calculate metrics from focus_sessions
  SELECT 
    COALESCE(SUM(CASE WHEN session_type = 'deep_work' THEN duration_minutes ELSE 0 END) / 60.0, 0),
    COALESCE(SUM(CASE WHEN session_type = 'shallow_work' THEN duration_minutes ELSE 0 END) / 60.0, 0),
    COALESCE(SUM(tasks_completed), 0),
    COALESCE(AVG(duration_minutes), 0),
    COALESCE(AVG(focus_score), 0),
    COALESCE(AVG(avg_cls_this_session), 0)
  INTO 
    v_deep_work_hours,
    v_shallow_work_hours,
    v_tasks_completed,
    v_avg_session_length,
    v_productivity_score,
    v_cognitive_load_avg
  FROM focus_sessions
  WHERE user_id = target_user_id
    AND DATE(started_at) = target_date;

  -- Calculate deep work ratio
  v_deep_work_ratio := CASE 
    WHEN (v_deep_work_hours + v_shallow_work_hours) > 0 
    THEN v_deep_work_hours / (v_deep_work_hours + v_shallow_work_hours)
    ELSE 0
  END;

  -- Find best focus hour
  SELECT EXTRACT(HOUR FROM started_at)::INT
  INTO v_best_focus_hour
  FROM focus_sessions
  WHERE user_id = target_user_id
    AND DATE(started_at) = target_date
    AND focus_score IS NOT NULL
  ORDER BY focus_score DESC
  LIMIT 1;

  -- Insert or update daily_stats
  INSERT INTO daily_stats (
    user_id, date, productivity_score, deep_work_hours, shallow_work_hours,
    tasks_completed, avg_session_length_mins, deep_work_ratio, 
    best_focus_hour, cognitive_load_avg
  ) VALUES (
    target_user_id, target_date, v_productivity_score, v_deep_work_hours, 
    v_shallow_work_hours, v_tasks_completed, v_avg_session_length,
    v_deep_work_ratio, v_best_focus_hour, v_cognitive_load_avg
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    productivity_score = EXCLUDED.productivity_score,
    deep_work_hours = EXCLUDED.deep_work_hours,
    shallow_work_hours = EXCLUDED.shallow_work_hours,
    tasks_completed = EXCLUDED.tasks_completed,
    avg_session_length_mins = EXCLUDED.avg_session_length_mins,
    deep_work_ratio = EXCLUDED.deep_work_ratio,
    best_focus_hour = EXCLUDED.best_focus_hour,
    cognitive_load_avg = EXCLUDED.cognitive_load_avg;
END;
$$ LANGUAGE plpgsql;
```

---

## Integration Points

### When to Update Each Table

| Event | Tables to Update | Engines to Run |
|-------|-----------------|----------------|
| Session starts | `focus_sessions` (create row) | None |
| Session ends | `focus_sessions` (update), `hourly_heatmap` | Engine 3 (Focus Score), Engine 5 (Peak Performance) |
| End of day (2am UTC) | `daily_stats` | Engine 8 (Anomaly), Engine 9 (Milestone) |
| User views Analytics | None (read-only) | Engine 4 (Trends), Engine 10 (Predictions) |

---

## Migration Script

```sql
-- Run this in Supabase SQL Editor to create all tables

BEGIN;

-- 1. Focus Sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  session_type TEXT CHECK (session_type IN ('deep_work','shallow_work','admin','break')),
  tasks_completed INTEGER DEFAULT 0,
  avg_cls_this_session FLOAT,
  interruptions INTEGER DEFAULT 0,
  focus_score INTEGER,
  energy_at_start INTEGER CHECK (energy_at_start BETWEEN 1 AND 3),
  energy_at_end INTEGER CHECK (energy_at_end BETWEEN 1 AND 3),
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT valid_focus_score CHECK (focus_score IS NULL OR (focus_score BETWEEN 0 AND 100))
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started ON focus_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_type ON focus_sessions(user_id, session_type);

-- 2. Daily Stats
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  date DATE NOT NULL,
  productivity_score INTEGER CHECK (productivity_score BETWEEN 0 AND 100),
  deep_work_hours FLOAT DEFAULT 0,
  shallow_work_hours FLOAT DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_deferred INTEGER DEFAULT 0,
  avg_session_length_mins FLOAT,
  deep_work_ratio FLOAT CHECK (deep_work_ratio BETWEEN 0 AND 1),
  focus_consistency_score FLOAT CHECK (focus_consistency_score BETWEEN 0 AND 100),
  best_focus_hour INTEGER CHECK (best_focus_hour BETWEEN 0 AND 23),
  cognitive_load_avg FLOAT,
  milestone_id UUID,
  anomaly_type TEXT CHECK (anomaly_type IN ('breakout_day','burnout_risk')),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_anomaly ON daily_stats(user_id, anomaly_type) WHERE anomaly_type IS NOT NULL;

-- 3. Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT CHECK (milestone_type IN ('streak','deep_work','completion','custom','major','personal_best','score')),
  detected_at TIMESTAMP DEFAULT now(),
  dismissed BOOLEAN DEFAULT false,
  notified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_detected ON milestones(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(user_id, milestone_type);

-- 4. Hourly Heatmap
CREATE TABLE IF NOT EXISTS hourly_heatmap (
  user_id UUID REFERENCES profiles(id) NOT NULL,
  hour_slot INTEGER CHECK (hour_slot BETWEEN 0 AND 23) NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL,
  avg_focus_score FLOAT DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  avg_tasks_completed FLOAT DEFAULT 0,
  avg_deep_work_ratio FLOAT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, hour_slot, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_hourly_heatmap_user ON hourly_heatmap(user_id);

COMMIT;
```

---

## Next Steps

1. **Run migration script** in Supabase SQL Editor
2. **Implement focus timer** in KAAL UI (creates `focus_sessions` rows)
3. **Set up nightly cron** to run `compute_daily_stats()` function
4. **Update Analytics components** to query from these tables
5. **Test with sample data** to verify all 10 engines work correctly

---

## Sample Data for Testing

```sql
-- Insert sample focus sessions for testing
-- Replace YOUR_USER_ID with actual user UUID

INSERT INTO focus_sessions (user_id, started_at, ended_at, duration_minutes, session_type, tasks_completed, avg_cls_this_session, interruptions, focus_score, energy_at_start, energy_at_end)
VALUES
  ('YOUR_USER_ID', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '90 minutes', 90, 'deep_work', 3, 8.5, 0, 92, 3, 3),
  ('YOUR_USER_ID', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes', 45, 'shallow_work', 2, 5.0, 2, 68, 2, 2),
  ('YOUR_USER_ID', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 60, 'deep_work', 2, 7.5, 1, 85, 3, 2);

-- Run rollup for yesterday
SELECT compute_daily_stats(CURRENT_DATE - INTERVAL '1 day', 'YOUR_USER_ID'::UUID);
```
