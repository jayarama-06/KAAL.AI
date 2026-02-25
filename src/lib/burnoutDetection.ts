// ═══════════════════════════════════════════════════════════════════════════
// Burnout Detection Service
// Analyzes user activity and energy patterns to detect early burnout signals
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase-client';

export interface BurnoutSignals {
  energy_declining: boolean;
  task_completion_dropping: boolean;
  deferrals_spiking: boolean;
  check_in_gaps_growing: boolean;
}

export interface BurnoutAssessment {
  signals: BurnoutSignals;
  score: number; // 0-4 (count of active signals)
  level: 'none' | 'watch' | 'concern' | 'intervention';
  message: string;
  recommendation: string;
}

/**
 * Detect burnout signals for a user
 * Run once per day per user
 */
export async function detectBurnoutSignals(userId: string): Promise<BurnoutSignals> {
  const signals: BurnoutSignals = {
    energy_declining: false,
    task_completion_dropping: false,
    deferrals_spiking: false,
    check_in_gaps_growing: false,
  };

  // Signal 1: Energy declining over last 7 days
  const energyTrend = await checkEnergyTrend(userId);
  signals.energy_declining = energyTrend;

  // Signal 2: Task completion rate dropping
  const completionTrend = await checkCompletionTrend(userId);
  signals.task_completion_dropping = completionTrend;

  // Signal 3: Deferrals spiking
  const deferralSpike = await checkDeferralSpike(userId);
  signals.deferrals_spiking = deferralSpike;

  // Signal 4: Check-in gaps growing
  const gapsGrowing = await checkCheckinGaps(userId);
  signals.check_in_gaps_growing = gapsGrowing;

  return signals;
}

/**
 * Check if energy is declining
 * Compare last 7 days vs previous 7 days
 */
async function checkEnergyTrend(userId: string): Promise<boolean> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Last 7 days
  const { data: recent } = await supabase
    .from('energy_checkins')
    .select('energy_level')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .lt('created_at', now.toISOString());

  // Previous 7 days
  const { data: previous } = await supabase
    .from('energy_checkins')
    .select('energy_level')
    .eq('user_id', userId)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .lt('created_at', sevenDaysAgo.toISOString());

  if (!recent || recent.length === 0 || !previous || previous.length === 0) {
    return false; // Not enough data
  }

  const avgRecent = recent.reduce((sum, e) => sum + e.energy_level, 0) / recent.length;
  const avgPrevious = previous.reduce((sum, e) => sum + e.energy_level, 0) / previous.length;

  // Declining if recent average is 0.5+ points lower
  return avgRecent < avgPrevious - 0.5;
}

/**
 * Check if task completion rate is dropping
 */
async function checkCompletionTrend(userId: string): Promise<boolean> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Last 7 days
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());

  // Previous 7 days
  const { data: previousTasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('user_id', userId)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .lt('created_at', sevenDaysAgo.toISOString());

  if (!recentTasks || recentTasks.length === 0 || !previousTasks || previousTasks.length === 0) {
    return false;
  }

  const recentDone = recentTasks.filter(t => t.status === 'completed').length;
  const recentRate = recentDone / recentTasks.length;

  const previousDone = previousTasks.filter(t => t.status === 'completed').length;
  const previousRate = previousDone / previousTasks.length;

  // Dropping if rate decreased by >20%
  return recentRate < previousRate - 0.2;
}

/**
 * Check if deferrals are spiking
 */
async function checkDeferralSpike(userId: string): Promise<boolean> {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // Last 3 days
  const { data: recentDeferrals } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'deferred')
    .gte('updated_at', threeDaysAgo.toISOString());

  // Weekly average
  const { data: weeklyDeferrals } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'deferred')
    .gte('updated_at', tenDaysAgo.toISOString());

  if (!weeklyDeferrals || weeklyDeferrals.length === 0) return false;

  const recentCount = recentDeferrals?.length || 0;
  const weeklyAvg = weeklyDeferrals.length / 10; // per day

  // Spiking if recent 3 days have >2x the daily average
  return recentCount > weeklyAvg * 3 * 2;
}

/**
 * Check if check-in gaps are growing
 */
async function checkCheckinGaps(userId: string): Promise<boolean> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Last 7 days
  const { data: recent } = await supabase
    .from('energy_checkins')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Previous 7 days
  const { data: previous } = await supabase
    .from('energy_checkins')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .lt('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (!recent || recent.length < 2 || !previous || previous.length < 2) {
    return false;
  }

  // Calculate average gap between check-ins
  const recentGaps = [];
  for (let i = 1; i < recent.length; i++) {
    const gap =
      (new Date(recent[i].created_at).getTime() -
        new Date(recent[i - 1].created_at).getTime()) /
      3600000;
    recentGaps.push(gap);
  }

  const previousGaps = [];
  for (let i = 1; i < previous.length; i++) {
    const gap =
      (new Date(previous[i].created_at).getTime() -
        new Date(previous[i - 1].created_at).getTime()) /
      3600000;
    previousGaps.push(gap);
  }

  const recentAvgGap = recentGaps.reduce((sum, g) => sum + g, 0) / recentGaps.length;
  const previousAvgGap = previousGaps.reduce((sum, g) => sum + g, 0) / previousGaps.length;

  // Growing if recent average gap is >1.5x previous
  return recentAvgGap > previousAvgGap * 1.5;
}

/**
 * Get full burnout assessment with recommendations
 */
export async function getBurnoutAssessment(
  userId: string
): Promise<BurnoutAssessment> {
  const signals = await detectBurnoutSignals(userId);
  const score = Object.values(signals).filter(Boolean).length;

  let level: BurnoutAssessment['level'] = 'none';
  let message = '';
  let recommendation = '';

  if (score === 0 || score === 1) {
    level = 'none';
    message = 'Your pace looks healthy';
    recommendation = 'Keep up the good work';
  } else if (score === 2) {
    level = 'watch';
    message = 'KAAL noticed your pace has shifted';
    recommendation = 'Consider taking it easy today';
  } else if (score === 3) {
    level = 'concern';
    message = 'Multiple burnout signals detected';
    recommendation = 'Focus on lighter tasks today. Your CLS scores have been auto-reduced.';
  } else {
    level = 'intervention';
    message = 'Strong burnout pattern detected';
    recommendation =
      'KAAL suggests a rest day. Only admin/low-CLS tasks will be shown.';
  }

  return {
    signals,
    score,
    level,
    message,
    recommendation,
  };
}

/**
 * Adjust task CLS based on burnout level
 * Call this when ranking tasks
 */
export function applyBurnoutAdjustment(
  cls: number,
  burnoutLevel: BurnoutAssessment['level']
): number {
  if (burnoutLevel === 'concern') {
    return Math.max(1, cls - 2); // Reduce by 2 points
  }
  if (burnoutLevel === 'intervention') {
    return Math.max(1, cls - 4); // Reduce by 4 points
  }
  return cls; // No adjustment
}

/**
 * Filter tasks for burnout mode
 * When burnout intervention is active, show only low-CLS tasks
 */
export function filterTasksForBurnout<T extends { cognitive_load_score?: number }>(
  tasks: T[],
  burnoutLevel: BurnoutAssessment['level']
): T[] {
  if (burnoutLevel !== 'intervention') return tasks;

  // Only show tasks with CLS <= 4 (admin/light tasks)
  return tasks.filter(t => (t.cognitive_load_score || 5) <= 4);
}