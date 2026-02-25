// ═══════════════════════════════════════════════════════════════════════════
// KAAL Local Nudge System - Usage Examples
// Complete integration examples
// ═══════════════════════════════════════════════════════════════════════════

import { getUserEnergyPattern } from './energyPatterns';
import { getTaskCompletionRate } from './taskCalibration';
import { getUserRecentCompletions } from './productivityScore';
import { sendPushNotification, initializeOneSignal } from './oneSignalService';
import { supabase } from '../services/supabase-client';

// ─────────────────────────────────────────────────────────────────────────────
// Example 1: Generate a gentle nudge for overdue task
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleGentleNudge(userId: string) {
  // Get user's preferred tone from behavioral data
  const preferredTone = await getPreferredTone(userId, supabase);
  
  // Get current streak
  const streak = await getCurrentStreak(userId);
  
  // Generate message locally
  const message = selectTemplate({
    nudge_type: 'gentle',
    energy_level: 2, // medium
    task_title: 'Write quarterly report',
    task_estimated_minutes: 45,
    minutes_overdue: 8,
    tasks_done_today: 2,
    inactive_hours: 0,
    streak_days: streak,
    last_clicked_tone: preferredTone,
    message_index: getAndIncrementMessageIndex()
  });
  
  console.log('Generated nudge:', message);
  // Example output: "KAAL has Write quarterly report... ranked highest for your current state. Ready when you are."
  
  return message;
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 2: Send re-engagement notification after user been away
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleReengagementNudge(userId: string, hoursInactive: number) {
  // Get user's energy level from last check-in
  const { data: lastCheckin } = await supabase
    .from('energy_checkins')
    .select('energy_level')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const energyLevel = lastCheckin?.energy_level || 2;
  const preferredTone = await getPreferredTone(userId, supabase);
  const streak = await getCurrentStreak(userId);
  
  // Get next pending task
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, estimated_minutes')
    .eq('user_id', userId)
    .neq('status', 'completed')
    .order('priority', { ascending: true })
    .limit(1);
  
  const nextTask = tasks?.[0];
  
  const message = selectTemplate({
    nudge_type: 'reengagement_hours',
    energy_level: energyLevel,
    task_title: nextTask?.title || 'your tasks',
    task_estimated_minutes: nextTask?.estimated_minutes || 30,
    minutes_overdue: 0,
    tasks_done_today: 0,
    inactive_hours: hoursInactive,
    streak_days: streak,
    last_clicked_tone: preferredTone,
    message_index: getAndIncrementMessageIndex()
  });
  
  // Send as push notification
  const toneTier = energyLevelToTone(energyLevel);
  await sendPushNotification(userId, message, toneTier);
  
  console.log('Sent re-engagement push:', message);
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 3: Update streak on energy check-in submission
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleHandleCheckin(userId: string, energyLevel: number) {
  // Save the check-in
  await supabase.from('energy_checkins').insert({
    user_id: userId,
    energy_level: energyLevel,
    created_at: new Date().toISOString()
  });
  
  // Update streak
  const newStreak = await updateStreak(userId);
  
  console.log('Check-in saved. New streak:', newStreak);
  
  // If milestone reached, send celebration nudge
  if ([3, 7, 14, 30].includes(newStreak)) {
    const message = selectTemplate({
      nudge_type: 'streak',
      energy_level: energyLevel,
      task_title: '',
      task_estimated_minutes: 0,
      minutes_overdue: 0,
      tasks_done_today: 0,
      inactive_hours: 0,
      streak_days: newStreak,
      last_clicked_tone: null,
      message_index: getAndIncrementMessageIndex()
    });
    
    const toneTier = energyLevelToTone(energyLevel);
    await sendPushNotification(userId, message, toneTier);
    
    console.log('Streak milestone reached! Sent:', message);
  }
  
  return newStreak;
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 4: Active nudge when task is significantly overdue
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleActiveNudge(userId: string, taskId: string) {
  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('title, estimated_minutes, scheduled_start')
    .eq('id', taskId)
    .single();
  
  if (!task || !task.scheduled_start) return;
  
  // Calculate how overdue
  const scheduledStart = new Date(task.scheduled_start);
  const now = new Date();
  const minutesOverdue = Math.round((now.getTime() - scheduledStart.getTime()) / 60000);
  
  if (minutesOverdue < 15) return; // Not yet in "active" range
  
  // Get user context
  const { data: lastCheckin } = await supabase
    .from('energy_checkins')
    .select('energy_level')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const energyLevel = lastCheckin?.energy_level || 2;
  const preferredTone = await getPreferredTone(userId, supabase);
  const streak = await getCurrentStreak(userId);
  
  const message = selectTemplate({
    nudge_type: 'active',
    energy_level: energyLevel,
    task_title: task.title,
    task_estimated_minutes: task.estimated_minutes || 30,
    minutes_overdue: minutesOverdue,
    tasks_done_today: 0, // Can fetch from database
    inactive_hours: 0,
    streak_days: streak,
    last_clicked_tone: preferredTone,
    message_index: getAndIncrementMessageIndex()
  });
  
  // Send push notification
  const toneTier = energyLevelToTone(energyLevel);
  await sendPushNotification(userId, message, toneTier);
  
  console.log('Active nudge sent:', message);
  
  // Log the nudge for tone learning
  await supabase.from('nudge_events').insert({
    user_id: userId,
    task_id: taskId,
    nudge_type: 'active',
    nudge_text: message,
    tone_tier: toneTier,
    sent_at: new Date().toISOString()
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 5: Celebration nudge when user completes multiple tasks
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleCelebrationNudge(userId: string) {
  // Count tasks completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('updated_at', today.toISOString());
  
  const tasksCompletedToday = completedTasks?.length || 0;
  
  if (tasksCompletedToday < 3) return; // Only celebrate 3+
  
  const { data: lastCheckin } = await supabase
    .from('energy_checkins')
    .select('energy_level')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const energyLevel = lastCheckin?.energy_level || 2;
  const streak = await getCurrentStreak(userId);
  
  const message = selectTemplate({
    nudge_type: 'celebration',
    energy_level: energyLevel,
    task_title: '',
    task_estimated_minutes: 0,
    minutes_overdue: 0,
    tasks_done_today: tasksCompletedToday,
    inactive_hours: 0,
    streak_days: streak,
    last_clicked_tone: null,
    message_index: getAndIncrementMessageIndex()
  });
  
  const toneTier = energyLevelToTone(energyLevel);
  await sendPushNotification(userId, message, toneTier);
  
  console.log('Celebration sent:', message);
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 6: Initialize OneSignal on app load
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleInitializeApp() {
  // Initialize OneSignal for web push
  await initializeOneSignal();
  
  console.log('OneSignal initialized');
  
  // Later, when user completes first check-in, show permission prompt
  // This is handled by <NotificationPermissionPrompt /> component
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 7: Log nudge outcome for behavioral learning
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleLogNudgeOutcome(
  nudgeEventId: string,
  outcome: 'started' | 'dismissed' | 'ignored'
) {
  // When user clicks a notification and starts the task
  await supabase
    .from('nudge_events')
    .update({ outcome: outcome })
    .eq('id', nudgeEventId);
  
  console.log('Nudge outcome logged:', outcome);
  
  // This data feeds into getPreferredTone() to learn which tone works
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 8: Complete integration - Dashboard background check
// ─────────────────────────────────────────────────────────────────────────────

export async function exampleDashboardNudgeCheck(userId: string) {
  // This runs in the background while user is on dashboard
  
  // 1. Check for overdue tasks
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id, title, estimated_minutes, scheduled_start')
    .eq('user_id', userId)
    .neq('status', 'completed')
    .not('scheduled_start', 'is', null)
    .order('scheduled_start', { ascending: true });
  
  if (!overdueTasks || overdueTasks.length === 0) return;
  
  const now = new Date();
  const mostOverdueTask = overdueTasks[0];
  const scheduledStart = new Date(mostOverdueTask.scheduled_start);
  const minutesOverdue = Math.round((now.getTime() - scheduledStart.getTime()) / 60000);
  
  if (minutesOverdue <= 0) return; // Not overdue yet
  
  // 2. Get user state
  const { data: lastCheckin } = await supabase
    .from('energy_checkins')
    .select('energy_level')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const energyLevel = lastCheckin?.energy_level || 2;
  const preferredTone = await getPreferredTone(userId, supabase);
  const streak = await getCurrentStreak(userId);
  
  // 3. Determine nudge type based on severity
  let nudgeType: string;
  if (minutesOverdue < 15) {
    nudgeType = 'gentle';
  } else if (minutesOverdue < 45) {
    nudgeType = 'active';
  } else {
    nudgeType = 'intervention';
  }
  
  // 4. Generate message
  const message = selectTemplate({
    nudge_type: nudgeType,
    energy_level: energyLevel,
    task_title: mostOverdueTask.title,
    task_estimated_minutes: mostOverdueTask.estimated_minutes || 30,
    minutes_overdue: minutesOverdue,
    tasks_done_today: 0,
    inactive_hours: 0,
    streak_days: streak,
    last_clicked_tone: preferredTone,
    message_index: getAndIncrementMessageIndex()
  });
  
  console.log('Dashboard nudge generated:', message);
  
  // 5. Show as in-app notification or send push if user not active
  // (implementation depends on your notification UI)
  
  return message;
}