// ═══════════════════════════════════════════════════════════════════════════
// KAAL Nudge Selection Engine - 1,351 Template System
// Persona-aware selection with behavioral learning
// ═══════════════════════════════════════════════════════════════════════════

import { templates, getUserPersona, filterByPersona, type Persona } from './nudgeTemplates1351';

export interface NudgeContext {
  nudge_type: string;
  energy_level: number; // 1 | 2 | 3
  task_title: string;
  task_estimated_minutes: number;
  minutes_overdue: number;
  tasks_done_today: number;
  inactive_hours: number;
  streak_days: number;
  last_clicked_tone: string | null; // 'low' | 'medium' | 'high' | null
  message_index: number;
  user_persona?: Persona; // New: persona targeting
}

/**
 * Main selection function with persona awareness
 * Takes user context and returns a personalized nudge message
 */
export function selectTemplate(ctx: NudgeContext): string {
  // Step 1: Determine persona
  const persona = ctx.user_persona || 'Universal';

  // Step 2: Pick energy tier
  let tier: 'low' | 'medium' | 'high';
  
  if (ctx.last_clicked_tone) {
    tier = ctx.last_clicked_tone as 'low' | 'medium' | 'high';
  } else {
    tier =
      ctx.energy_level === 1
        ? 'low'
        : ctx.energy_level === 2
        ? 'medium'
        : 'high';
  }

  // Step 3: Get the right template array with persona filtering
  let pool: string[] = [];
  const nudgeType = ctx.nudge_type;

  // Map nudge types to template categories
  if (nudgeType === 'gentle') {
    const category = tier === 'low' ? templates.gentle_low
                   : tier === 'medium' ? templates.gentle_medium
                   : templates.gentle_high;
    pool = filterByPersona(category, persona);
  }
  else if (nudgeType === 'active') {
    const category = tier === 'low' ? templates.active_low
                   : tier === 'medium' ? templates.active_medium
                   : templates.active_high;
    pool = filterByPersona(category, persona);
  }
  else if (nudgeType === 'intervention') {
    const category = tier === 'low' ? templates.intervention_low
                   : tier === 'medium' ? templates.intervention_medium
                   : templates.intervention_high;
    pool = filterByPersona(category, persona);
  }
  else if (nudgeType === 'context_switch') {
    pool = filterByPersona(templates.context_switch, persona);
  }
  else if (nudgeType === 'break_reminder') {
    pool = filterByPersona(templates.break_reminder, persona);
  }
  else if (nudgeType === 'reengagement_hours') {
    const category = ctx.inactive_hours < 6 ? templates.reengagement_hours_low
                   : ctx.inactive_hours < 12 ? templates.reengagement_hours_medium
                   : templates.reengagement_hours_high;
    pool = filterByPersona(category, persona);
  }
  else if (nudgeType === 'reengagement_days') {
    pool = filterByPersona(templates.reengagement_days, persona);
  }
  else if (nudgeType === 'celebration') {
    pool = filterByPersona(templates.celebration, persona);
  }
  else if (nudgeType === 'streak') {
    pool = filterByPersona(templates.streak, persona);
  }

  // Fallback if pool is empty
  if (pool.length === 0) {
    pool = filterByPersona(templates.gentle_medium, 'Universal');
  }

  // Step 4: Pick from pool using message_index to avoid repetition
  const index = ctx.message_index % pool.length;
  let template = pool[index];

  // Step 5: Inject variables
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
  const next = (current + 1) % 10000; // Reset at 10000 to cycle through all templates multiple times
  localStorage.setItem(key, String(next));
  return current;
}

/**
 * Get user's preferred tone from behavioral data
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
    .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
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

/**
 * Get template statistics
 */
export function getTemplateStats(): {
  total: number;
  by_category: Record<string, number>;
  by_persona: Record<Persona, number>;
} {
  const stats = {
    total: 1351,
    by_category: {
      gentle_low: 50,
      gentle_medium: 50,
      gentle_high: 50,
      active_low: 50,
      active_medium: 50,
      active_high: 50,
      intervention_low: 50,
      intervention_medium: 50,
      intervention_high: 50,
      context_switch: 150,
      break_reminder: 150,
      reengagement_hours_low: 50,
      reengagement_hours_medium: 50,
      reengagement_hours_high: 50,
      reengagement_days: 151,
      celebration: 150,
      streak: 150,
    },
    by_persona: {
      Student: 15,
      Dev: 38,
      KW: 54,
      Universal: 1244,
    } as Record<Persona, number>,
  };

  return stats;
}
