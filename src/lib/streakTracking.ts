// ═══════════════════════════════════════════════════════════════════════════
// Streak Tracking
// Track consecutive days of task completion
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase-client';

/**
 * Update user's check-in streak
 * Call this every time a user submits an energy check-in
 */
export async function updateStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Fetch current streak data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('streak_days, last_checkin_date')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile for streak:', error);
    return 0;
  }

  const currentStreak = profile?.streak_days || 0;
  const lastCheckinDate = profile?.last_checkin_date;

  let newStreak = currentStreak;

  if (!lastCheckinDate) {
    // First ever check-in
    newStreak = 1;
  } else {
    const lastDate = new Date(lastCheckinDate);
    lastDate.setHours(0, 0, 0, 0);
    const lastDateStr = lastDate.toISOString().split('T')[0];

    if (lastDateStr === todayStr) {
      // Already checked in today, no change
      return currentStreak;
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDateStr === yesterdayStr) {
        // Checked in yesterday, increment streak
        newStreak = currentStreak + 1;
      } else {
        // Streak broken, restart
        newStreak = 1;
      }
    }
  }

  // Update profile with new streak
  await supabase
    .from('profiles')
    .update({
      streak_days: newStreak,
      last_checkin_date: todayStr,
    })
    .eq('id', userId);

  // Fire streak milestone notifications
  if ([3, 7, 14, 30, 60, 90].includes(newStreak)) {
    fireStreakMilestoneNotification(userId, newStreak);
  }

  return newStreak;
}

/**
 * Get current streak for a user
 */
export async function getCurrentStreak(userId: string): Promise<number> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_days, last_checkin_date')
    .eq('id', userId)
    .single();

  if (!profile) return 0;

  // Check if streak is still valid (checked in today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastCheckin = profile.last_checkin_date
    ? new Date(profile.last_checkin_date)
    : null;

  if (!lastCheckin) return 0;

  lastCheckin.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCheckinStr = lastCheckin.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastCheckinStr === todayStr || lastCheckinStr === yesterdayStr) {
    return profile.streak_days || 0;
  }

  // Streak is broken (last check-in was more than 1 day ago)
  return 0;
}

/**
 * Fire a streak milestone notification
 */
function fireStreakMilestoneNotification(userId: string, streak: number) {
  // Store this as a pending notification to be sent
  // The notification will be picked up by the push notification system
  localStorage.setItem(
    `kaal_streak_milestone_${userId}`,
    JSON.stringify({
      streak,
      timestamp: Date.now(),
    })
  );

  // Trigger browser notification if available
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('KAAL • Streak Milestone', {
      body: `${streak} days in a row. KAAL is starting to understand how you work.`,
      icon: '/kaal-logo.png',
      tag: 'kaal-streak',
    });
  }
}

/**
 * Check if user should see streak display
 */
export function shouldShowStreak(streak: number): boolean {
  return streak > 0;
}

/**
 * Get streak display text
 */
export function getStreakDisplayText(streak: number): string {
  if (streak === 0) return '';
  return `🔥 ${streak} day streak`;
}