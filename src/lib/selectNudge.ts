// ═══════════════════════════════════════════════════════════════════════════
// KAAL Nudge Selection Engine
// Selects the right template and injects variables
// Runs entirely in browser, zero API cost
// ═══════════════════════════════════════════════════════════════════════════

import { templates } from './nudgeTemplates';

export interface NudgeContext {
  nudge_type: string;
  energy_level: number; // 1 | 2 | 3
  task_title: string;
  task_estimated_minutes: number;
  minutes_overdue: number;
  tasks_done_today: number;
  inactive_hours: number; // hours since last visit
  streak_days: number; // current daily check-in streak
  last_clicked_tone: string | null; // 'low' | 'medium' | 'high' | null
  // last_clicked_tone = the energy level category of the last notification the user clicked
  // This is how KAAL learns which tone works for this person
  message_index: number; // increment per session to avoid repetition
}

/**
 * Main selection function
 * Takes user context and returns a personalized nudge message
 */
export function selectTemplate(ctx: NudgeContext): string {
  // Step 1: pick energy tier
  // If we have behavioral data (last_clicked_tone), bias toward that tone
  // Otherwise use the current energy_level
  let tier: 'low' | 'medium' | 'high';
  
  if (ctx.last_clicked_tone) {
    tier = ctx.last_clicked_tone as 'low' | 'medium' | 'high'; // use what has worked before
  } else {
    tier =
      ctx.energy_level === 1
        ? 'low'
        : ctx.energy_level === 2
        ? 'medium'
        : 'high';
  }

  // Step 2: get the right template array
  let pool: string[] = [];

  if (ctx.nudge_type === 'gentle') pool = templates.gentle[tier];
  if (ctx.nudge_type === 'active') pool = templates.active[tier];
  if (ctx.nudge_type === 'intervention') pool = templates.intervention[tier];
  if (ctx.nudge_type === 'context_switch') pool = templates.context_switch;
  if (ctx.nudge_type === 'break_reminder') pool = templates.break_reminder;
  if (ctx.nudge_type === 'reengagement_days') pool = templates.reengagement_days;
  if (ctx.nudge_type === 'celebration') pool = templates.celebration;
  if (ctx.nudge_type === 'streak') pool = templates.streak;
  if (ctx.nudge_type === 'reengagement_hours') {
    pool =
      ctx.inactive_hours < 6
        ? templates.reengagement_hours.low
        : ctx.inactive_hours < 12
        ? templates.reengagement_hours.medium
        : templates.reengagement_hours.high;
  }

  // Fallback if pool is empty
  if (pool.length === 0) {
    pool = templates.gentle.medium;
  }

  // Step 3: pick from pool using message_index to avoid repetition
  // cycle through the pool, never repeat until all have been shown
  const index = ctx.message_index % pool.length;
  let template = pool[index];

  // Step 4: inject variables
  const words = ctx.task_title.split(' ');
  const task_short =
    words.length > 3 ? words.slice(0, 3).join(' ') + '...' : ctx.task_title;

  const hour = new Date().getHours();
  const time_of_day =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const day = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][new Date().getDay()];

  template = template
    .replace(/{task}/g, ctx.task_title)
    .replace(/{task_short}/g, task_short)
    .replace(/{mins}/g, String(ctx.task_estimated_minutes))
    .replace(/{overdue}/g, String(Math.round(ctx.minutes_overdue)))
    .replace(/{done_today}/g, String(ctx.tasks_done_today))
    .replace(/{inactive_hrs}/g, String(Math.round(ctx.inactive_hours)))
    .replace(/{inactive_days}/g, String(Math.round(ctx.inactive_hours / 24)))
    .replace(/{streak}/g, String(ctx.streak_days))
    .replace(/{time_of_day}/g, time_of_day)
    .replace(/{day}/g, day)
    .replace(/{energy}/g, tier);

  return template;
}

/**
 * Get message index from localStorage and increment
 */
export function getAndIncrementMessageIndex(): number {
  const key = 'kaal_msg_index';
  const stored = localStorage.getItem(key);
  const current = stored ? parseInt(stored, 10) : 0;
  const next = (current + 1) % 1000; // Reset at 1000 to prevent overflow
  localStorage.setItem(key, String(next));
  return current;
}

/**
 * Get user's preferred tone from behavioral data
 * Query nudge_events to find which tone gets the most 'started' outcomes
 */
export async function getPreferredTone(
  userId: string,
  supabase: any
): Promise<'low' | 'medium' | 'high' | null> {
  const { data, error } = await supabase
    .from('nudge_events')
    .select('tone_tier')
    .eq('user_id', userId)
    .eq('outcome', 'started')
    .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // last 30 days
    .not('tone_tier', 'is', null);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Count occurrences of each tone
  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    const tone = row.tone_tier;
    counts[tone] = (counts[tone] || 0) + 1;
  });

  // Find the most clicked tone
  let maxTone: string | null = null;
  let maxCount = 0;
  Object.entries(counts).forEach(([tone, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxTone = tone;
    }
  });

  return maxTone as 'low' | 'medium' | 'high' | null;
}

/**
 * Energy level to tone tier mapping
 */
export function energyLevelToTone(energyLevel: number): 'low' | 'medium' | 'high' {
  if (energyLevel === 1) return 'low';
  if (energyLevel === 2) return 'medium';
  return 'high';
}
