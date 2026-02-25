// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 1: Deep Work Detector
// Classifies each focus session as deep_work, shallow_work, or admin
// Tracks ratio with a sliding window
// ═══════════════════════════════════════════════════════════════════════════

import type { SessionClassificationInput, DailyStats } from './types';

/**
 * Classifies a completed focus session as deep_work, shallow_work, or admin
 * Runs at session END, returns session_type to be written to focus_sessions table
 */
export function classifySession(s: SessionClassificationInput): 'deep_work' | 'shallow_work' | 'admin' {
  let deepScore = 0;

  // ── Duration signal (deep work = sustained, ≥25 minutes) ──
  if (s.duration_minutes >= 90) deepScore += 40;
  else if (s.duration_minutes >= 45) deepScore += 25;
  else if (s.duration_minutes >= 25) deepScore += 10;
  else return 'shallow_work'; // < 25 min cannot qualify as deep work

  // ── Cognitive load signal ──
  if (s.avg_cls_of_tasks >= 8) deepScore += 35;
  else if (s.avg_cls_of_tasks >= 6) deepScore += 20;
  else if (s.avg_cls_of_tasks >= 4) deepScore += 5;
  else return 'admin'; // pure admin/low-CLS work

  // ── Interruption penalty ──
  if (s.interruptions === 0) deepScore += 25;
  else if (s.interruptions <= 2) deepScore += 10;
  else deepScore -= 15; // heavy interruptions → cannot be deep work

  // ── Completion signal (finishing things = productive deep work) ──
  if (s.tasks_completed >= 2) deepScore += 10;
  else if (s.tasks_completed === 1) deepScore += 5;

  return deepScore >= 60 ? 'deep_work' : deepScore >= 30 ? 'shallow_work' : 'admin';
}

/**
 * Computes Deep Work Ratio using a sliding 7-day window
 * Avoids one great day distorting the metric
 */
export function computeDeepWorkRatio(
  dailyStats: Array<{ date: string; deep_work_hours: number; shallow_work_hours: number }>
): { ratio: number; trend: 'improving' | 'stable' | 'declining'; vs_target: number } {
  const last7 = dailyStats.slice(-7); // most recent 7 days
  const totalDeep = last7.reduce((s, d) => s + d.deep_work_hours, 0);
  const totalWork = last7.reduce((s, d) => s + d.deep_work_hours + d.shallow_work_hours, 0);

  const ratio = totalWork > 0 ? (totalDeep / totalWork) * 100 : 0;

  // Trend: compare first half vs second half of window
  const firstHalf = last7.slice(0, 3);
  const secondHalf = last7.slice(4);
  const firstRatio =
    firstHalf.reduce((s, d) => s + d.deep_work_hours, 0) /
    Math.max(0.1, firstHalf.reduce((s, d) => s + d.deep_work_hours + d.shallow_work_hours, 0));
  const secondRatio =
    secondHalf.reduce((s, d) => s + d.deep_work_hours, 0) /
    Math.max(0.1, secondHalf.reduce((s, d) => s + d.deep_work_hours + d.shallow_work_hours, 0));

  const trend =
    secondRatio > firstRatio + 0.05
      ? 'improving'
      : secondRatio < firstRatio - 0.05
      ? 'declining'
      : 'stable';

  return { ratio: Math.round(ratio), trend, vs_target: Math.round(ratio - 65) };
}

/**
 * Get display metadata for the Deep Work Ratio gauge
 */
export function getDeepWorkRatioDisplay(ratio: number): {
  color: string;
  label: string;
  status: 'excellent' | 'good' | 'needs_improvement';
} {
  if (ratio >= 65) {
    return {
      color: '#10B981',
      label: 'Target achieved',
      status: 'excellent',
    };
  }
  if (ratio >= 50) {
    return {
      color: '#F59E0B',
      label: 'Close to target',
      status: 'good',
    };
  }
  return {
    color: '#EF4444',
    label: 'Below target',
    status: 'needs_improvement',
  };
}
