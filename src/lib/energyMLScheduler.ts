// ═══════════════════════════════════════════════════════════════════════════
// Energy ML Scheduler
// Trains ML model on user energy patterns and schedules tasks optimally
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase-client';
import { trainModel, type CheckinRow } from './energyML';

const TRAIN_THRESHOLD = 10; // minimum check-ins before first train
const RETRAIN_INTERVAL = 5; // retrain every 5 new check-ins after that

/**
 * Check if model should be trained/retrained and do it if needed
 * Runs in background, fire-and-forget
 */
export async function maybeTrainOrRetrain(userId: string): Promise<void> {
  try {
    // Fetch all check-ins for this user
    const { data: checkins, error } = await supabase
      .from('energy_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('KAAL: Error fetching check-ins for training:', error);
      return;
    }

    if (!checkins || checkins.length < TRAIN_THRESHOLD) {
      console.log(
        'KAAL: Not enough check-ins to train (need',
        TRAIN_THRESHOLD,
        'have',
        checkins?.length || 0,
        ')'
      );
      return;
    }

    // Check if we should train/retrain
    let lastTrainCount = 0;
    try {
      lastTrainCount = parseInt(localStorage.getItem('kaal_last_train_count') || '0');
    } catch {
      // localStorage not available, train anyway
    }

    const shouldTrain =
      lastTrainCount === 0 || checkins.length - lastTrainCount >= RETRAIN_INTERVAL;

    if (!shouldTrain) {
      console.log(
        'KAAL: Skipping training, not enough new check-ins since last train (',
        checkins.length - lastTrainCount,
        'new, need',
        RETRAIN_INTERVAL,
        ')'
      );
      return;
    }

    // Enrich check-ins with context fields
    const enriched = await enrichCheckins(checkins, userId);

    // Train the model (runs in background)
    const model = await trainModel(enriched);

    if (model) {
      // Update last train count
      try {
        localStorage.setItem('kaal_last_train_count', String(checkins.length));
      } catch {
        // localStorage not available
      }
      console.log('KAAL: Energy model trained on', checkins.length, 'check-ins');
    }
  } catch (error) {
    console.error('KAAL: Error in maybeTrainOrRetrain:', error);
  }
}

/**
 * Enrich check-in rows with context features
 * These are computed from related data, not stored directly
 */
async function enrichCheckins(
  checkins: any[],
  userId: string
): Promise<CheckinRow[]> {
  // Get tasks for computing tasks_done_last_2h
  const { data: tasks } = await supabase
    .from('tasks')
    .select('updated_at, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: true });

  // Get session start time for this user
  const sessionStartKey = `kaal_session_start_${userId}`;
  let sessionStartTime: number;
  try {
    const stored = localStorage.getItem(sessionStartKey);
    sessionStartTime = stored ? parseInt(stored) : Date.now();
  } catch {
    sessionStartTime = Date.now();
  }

  // Get last break time
  const lastBreakKey = `kaal_last_break_time_${userId}`;
  let lastBreakTime: number;
  try {
    const stored = localStorage.getItem(lastBreakKey);
    lastBreakTime = stored ? parseInt(stored) : Date.now() - 60 * 60 * 1000; // default 1 hour ago
  } catch {
    lastBreakTime = Date.now() - 60 * 60 * 1000;
  }

  return checkins.map((checkin, i) => {
    const checkinTime = new Date(checkin.created_at).getTime();
    const twoHoursAgo = checkinTime - 2 * 60 * 60 * 1000;

    // Count tasks completed in 2 hours before this check-in
    const tasks_done_last_2h = tasks
      ? tasks.filter((t) => {
          const taskTime = new Date(t.updated_at).getTime();
          return taskTime > twoHoursAgo && taskTime <= checkinTime;
        }).length
      : 0;

    // Session duration: time since first check-in of the day
    const dayStart = new Date(checkin.created_at);
    dayStart.setHours(0, 0, 0, 0);
    const firstCheckinOfDay = checkins.find(
      (c) => new Date(c.created_at) >= dayStart && new Date(c.created_at) <= new Date(checkin.created_at)
    );
    const sessionStart = firstCheckinOfDay
      ? new Date(firstCheckinOfDay.created_at).getTime()
      : checkinTime;
    const session_duration_mins = Math.max(0, (checkinTime - sessionStart) / (60 * 1000));

    // Break gap: use stored value or default
    const mins_since_last_break = Math.max(0, (checkinTime - lastBreakTime) / (60 * 1000));

    return {
      created_at: checkin.created_at,
      energy_level: checkin.energy_level as 1 | 2 | 3,
      tasks_done_last_2h,
      session_duration_mins: Math.min(session_duration_mins, 240), // cap at 4 hours
      mins_since_last_break: Math.min(mins_since_last_break, 180), // cap at 3 hours
    };
  });
}

/**
 * Get current context for prediction
 * Computes features from current state
 */
export async function getCurrentContext(userId: string): Promise<{
  tasks_done_last_2h: number;
  session_duration_mins: number;
  mins_since_last_break: number;
}> {
  try {
    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    // Count tasks completed in last 2 hours
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', new Date(twoHoursAgo).toISOString());

    const tasks_done_last_2h = tasks?.length || 0;

    // Get session start time
    const sessionStartKey = `kaal_session_start_${userId}`;
    let sessionStartTime: number;
    try {
      const stored = localStorage.getItem(sessionStartKey);
      if (!stored) {
        // Initialize session start to now
        sessionStartTime = now;
        localStorage.setItem(sessionStartKey, String(now));
      } else {
        sessionStartTime = parseInt(stored);
      }
    } catch {
      sessionStartTime = now;
    }

    const session_duration_mins = Math.max(0, (now - sessionStartTime) / (60 * 1000));

    // Get last break time
    const lastBreakKey = `kaal_last_break_time_${userId}`;
    let lastBreakTime: number;
    try {
      const stored = localStorage.getItem(lastBreakKey);
      lastBreakTime = stored ? parseInt(stored) : now - 60 * 60 * 1000; // default 1 hour ago
    } catch {
      lastBreakTime = now - 60 * 60 * 1000;
    }

    const mins_since_last_break = Math.max(0, (now - lastBreakTime) / (60 * 1000));

    return {
      tasks_done_last_2h,
      session_duration_mins: Math.min(session_duration_mins, 240), // cap at 4 hours
      mins_since_last_break: Math.min(mins_since_last_break, 180), // cap at 3 hours
    };
  } catch (error) {
    console.error('KAAL: Error getting current context:', error);
    return {
      tasks_done_last_2h: 0,
      session_duration_mins: 0,
      mins_since_last_break: 60,
    };
  }
}

/**
 * Record that a break was taken
 * Updates last break timestamp
 */
export function recordBreakTaken(userId: string): void {
  try {
    const lastBreakKey = `kaal_last_break_time_${userId}`;
    localStorage.setItem(lastBreakKey, String(Date.now()));
  } catch {
    // localStorage not available
  }
}

/**
 * Reset session start time (e.g., on new day)
 */
export function resetSessionStart(userId: string): void {
  try {
    const sessionStartKey = `kaal_session_start_${userId}`;
    localStorage.setItem(sessionStartKey, String(Date.now()));
  } catch {
    // localStorage not available
  }
}