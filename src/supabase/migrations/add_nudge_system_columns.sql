-- ═══════════════════════════════════════════════════════════════════════════
-- KAAL Local Nudge System - Database Migrations
-- Adds columns for streak tracking, tone learning, and OneSignal integration
-- ═══════════════════════════════════════════════════════════════════════════

-- Add streak tracking columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checkin_date DATE,
ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT;

-- Add tone tier tracking to nudge_events
ALTER TABLE nudge_events 
ADD COLUMN IF NOT EXISTS tone_tier TEXT CHECK (tone_tier IN ('low', 'medium', 'high'));

-- Add index for faster tone preference queries
CREATE INDEX IF NOT EXISTS idx_nudge_events_tone_learning 
ON nudge_events(user_id, outcome, sent_at) 
WHERE outcome = 'started' AND tone_tier IS NOT NULL;

-- Add index for streak queries
CREATE INDEX IF NOT EXISTS idx_profiles_streak 
ON profiles(id, streak_days, last_checkin_date);

-- Add index for OneSignal player ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onesignal 
ON profiles(onesignal_player_id) 
WHERE onesignal_player_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN profiles.streak_days IS 'Number of consecutive days user has checked in';
COMMENT ON COLUMN profiles.last_checkin_date IS 'Date of last energy check-in (YYYY-MM-DD)';
COMMENT ON COLUMN profiles.onesignal_player_id IS 'OneSignal subscription ID for web push notifications';
COMMENT ON COLUMN nudge_events.tone_tier IS 'Energy tier used for this nudge: low, medium, or high';
