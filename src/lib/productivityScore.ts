// ═══════════════════════════════════════════════════════════════════════════
// Productivity Score Service
// Calculate overall productivity score based on multiple metrics
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase-client';

export interface DailyData {
  tasks_done: number;
  tasks_created: number;
  morning_energy: number;
  evening_energy: number;
  actual_mins: number;
  estimated_mins: number;
  checkins_today: number;
  high_cls_done: number; // Count of high-CLS tasks completed
}

export interface DailyScore {
  total_score: number; // 0-100
  breakdown: {
    completion_score: number; // max 30
    energy_score: number; // max 20
    accuracy_score: number; // max 20
    checkin_score: number; // max 15
    deep_work_score: number; // max 15
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  insight: string;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Compute daily productivity score
 * Returns 0-100 score based on 5 signals
 */
export function computeDailyScore(data: DailyData): DailyScore {
  // Signal 1: Task completion rate (30 points max)
  const completion_rate = data.tasks_done / Math.max(data.tasks_created, 1);
  const completion_score = Math.round(completion_rate * 30);

  // Signal 2: Energy consistency (20 points max)
  // Reward users who maintain steady or improving energy across the day
  const energy_variance = Math.abs(data.morning_energy - data.evening_energy);
  const energy_score = Math.max(0, 20 - energy_variance * 8);

  // Signal 3: Estimation accuracy (20 points max)
  // Reward when actual time is within 20% of estimated time
  const accuracy =
    1 - Math.abs(data.actual_mins - data.estimated_mins) / Math.max(data.estimated_mins, 1);
  const accuracy_score = Math.round(Math.max(0, accuracy) * 20);

  // Signal 4: Check-in consistency (15 points max)
  // Did user check in at the right intervals today?
  const checkin_score = Math.min(15, data.checkins_today * 5);

  // Signal 5: Deep work ratio (15 points max)
  // Ratio of high-CLS tasks done vs total tasks done
  const deep_ratio = data.high_cls_done / Math.max(data.tasks_done, 1);
  const deep_work_score = Math.round(deep_ratio * 15);

  const total_score =
    completion_score + energy_score + accuracy_score + checkin_score + deep_work_score;

  // Determine grade
  const grade = getGrade(total_score);

  // Generate insight from breakdown
  const insight = generateInsight(
    {
      completion_score,
      energy_score,
      accuracy_score,
      checkin_score,
      deep_work_score,
    },
    data
  );

  return {
    total_score,
    breakdown: {
      completion_score,
      energy_score,
      accuracy_score,
      checkin_score,
      deep_work_score,
    },
    grade,
    insight,
    trend: 'stable', // Calculated separately with historical data
  };
}

/**
 * Get letter grade from score
 */
function getGrade(score: number): DailyScore['grade'] {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Generate actionable insight based on score breakdown
 * Compliment highest score, suggest improvement for lowest
 */
function generateInsight(
  breakdown: DailyScore['breakdown'],
  data: DailyData
): string {
  const signals = [
    { name: 'completion', score: breakdown.completion_score, max: 30 },
    { name: 'energy', score: breakdown.energy_score, max: 20 },
    { name: 'accuracy', score: breakdown.accuracy_score, max: 20 },
    { name: 'checkin', score: breakdown.checkin_score, max: 15 },
    { name: 'deep_work', score: breakdown.deep_work_score, max: 15 },
  ];

  // Find best and worst signals
  const best = signals.reduce((max, s) =>
    s.score / s.max > max.score / max.max ? s : max
  );
  const worst = signals.reduce((min, s) =>
    s.score / s.max < min.score / min.max ? s : min
  );

  // Insight templates
  const insights = {
    completion: {
      high: `You cleared ${data.tasks_done} of ${data.tasks_created} tasks today. Strong execution.`,
      low: `Only ${data.tasks_done} of ${data.tasks_created} tasks completed. Try breaking tasks into smaller chunks tomorrow.`,
    },
    energy: {
      high: 'Your energy stayed consistent throughout the day. Well-managed.',
      low: 'Your energy fluctuated significantly today. Consider taking breaks earlier.',
    },
    accuracy: {
      high: 'Your time estimates were spot-on today. You know your pace.',
      low: 'Your tasks took longer than expected. Try adding 20% buffer next time.',
    },
    checkin: {
      high: `${data.checkins_today} check-ins today. KAAL has good data on your state.`,
      low: `Only ${data.checkins_today} check-ins today. More frequent check-ins = better task matching.`,
    },
    deep_work: {
      high: `${data.high_cls_done} deep work tasks completed. You tackled the hard stuff.`,
      low: 'Mostly light tasks today. Schedule deep work blocks when energy is highest.',
    },
  };

  // Return insight for worst-performing signal
  return insights[worst.name as keyof typeof insights].low;
}

/**
 * Fetch daily data from Supabase
 */
export async function fetchDailyData(
  userId: string,
  date?: Date
): Promise<DailyData | null> {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, estimated_minutes, actual_minutes, cognitive_load_score')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (!tasks) return null;

  const tasks_done = tasks.filter(t => t.status === 'completed').length;
  const tasks_created = tasks.length;
  const high_cls_done = tasks.filter(
    t => t.status === 'completed' && (t.cognitive_load_score || 0) >= 7
  ).length;

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const actual_mins = completedTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0);
  const estimated_mins = completedTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  // Fetch energy check-ins
  const { data: checkins } = await supabase
    .from('energy_checkins')
    .select('energy_level, created_at')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .order('created_at', { ascending: true });

  const checkins_today = checkins?.length || 0;
  const morning_energy = checkins?.[0]?.energy_level || 2;
  const evening_energy = checkins?.[checkins.length - 1]?.energy_level || 2;

  return {
    tasks_done,
    tasks_created,
    morning_energy,
    evening_energy,
    actual_mins,
    estimated_mins,
    checkins_today,
    high_cls_done,
  };
}

/**
 * Get daily score for a user
 */
export async function getDailyScore(
  userId: string,
  date?: Date
): Promise<DailyScore | null> {
  const data = await fetchDailyData(userId, date);
  if (!data) return null;

  return computeDailyScore(data);
}

/**
 * Calculate trend by comparing with previous days
 */
export async function calculateTrend(userId: string): Promise<'improving' | 'stable' | 'declining'> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const [scoreToday, scoreYesterday, scoreTwoDaysAgo] = await Promise.all([
    getDailyScore(userId, today),
    getDailyScore(userId, yesterday),
    getDailyScore(userId, twoDaysAgo),
  ]);

  if (!scoreToday || !scoreYesterday || !scoreTwoDaysAgo) return 'stable';

  const avgRecent = (scoreToday.total_score + scoreYesterday.total_score) / 2;
  const avgPrevious = scoreTwoDaysAgo.total_score;

  if (avgRecent > avgPrevious + 5) return 'improving';
  if (avgRecent < avgPrevious - 5) return 'declining';
  return 'stable';
}

/**
 * Get score color for UI
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // green
  if (score >= 70) return '#3B82F6'; // blue
  if (score >= 60) return '#F59E0B'; // amber
  if (score >= 50) return '#F97316'; // orange
  return '#EF4444'; // red
}

/**
 * Get weekly average score
 */
export async function getWeeklyAverage(userId: string): Promise<number | null> {
  const today = new Date();
  const scores: number[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayScore = await getDailyScore(userId, date);
    if (dayScore) {
      scores.push(dayScore.total_score);
    }
  }

  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}