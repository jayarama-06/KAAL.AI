// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 6: Focus Consistency
// Measure regularity, not just total output
// Streak + Variance Scorer
// ═══════════════════════════════════════════════════════════════════════════

import type { DailyStats } from './types';

/**
 * Focus Consistency % on the 'Focus Quality Trends' card
 * Measures: how regularly is the user doing focused work?
 * Different from total output — a user who does 1h every day scores higher
 *   than a user who does 8h on Monday and nothing all week.
 */
export function computeFocusConsistency(
  dailyStats: Array<{ date: string; deep_work_hours: number }>
): { score: number; streak: number; insight: string } {
  const last14 = dailyStats.slice(-14); // 2 weeks
  if (last14.length === 0) {
    return { score: 0, streak: 0, insight: 'No data yet' };
  }

  const TARGET_DAILY_DEEP_WORK = 2.0; // hours — considered a 'consistent' day

  // ── Component 1: Days hit target (50% of score) ──
  const daysHitTarget = last14.filter((d) => d.deep_work_hours >= TARGET_DAILY_DEEP_WORK).length;
  const hitRateScore = (daysHitTarget / last14.length) * 50;

  // ── Component 2: Coefficient of Variation inverse (30% of score) ──
  // Low variance = more consistent. CV = stdev/mean.
  const values = last14.map((d) => d.deep_work_hours);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const varianceScore = Math.max(0, 30 * (1 - Math.min(1, cv))); // cv=0 → 30pts

  // ── Component 3: Current streak (20% of score) ──
  let streak = 0;
  for (let i = last14.length - 1; i >= 0; i--) {
    if (last14[i].deep_work_hours >= 1.0) streak++; // 1h = minimum for streak
    else break;
  }
  const streakScore = Math.min(20, streak * 4); // 5+ day streak = full 20 pts

  const total = Math.round(hitRateScore + varianceScore + streakScore);

  const insight =
    total >= 80
      ? 'Exceptional consistency — you show up every day'
      : total >= 60
      ? 'Good consistency — minor gaps this period'
      : total >= 40
      ? 'Moderate consistency — some days much stronger than others'
      : 'Building consistency — the habit is forming';

  return { score: total, streak, insight };
}

/**
 * Compute current deep work streak (consecutive days with ≥1h deep work)
 */
export function computeCurrentStreak(dailyStats: DailyStats[]): number {
  let streak = 0;
  for (let i = dailyStats.length - 1; i >= 0; i--) {
    if (dailyStats[i].deep_work_hours >= 1.0) streak++;
    else break;
  }
  return streak;
}

/**
 * Get visual representation of consistency over time
 * Returns array of boolean (hit target or not) for visualization
 */
export function getConsistencyPattern(
  dailyStats: Array<{ date: string; deep_work_hours: number }>,
  days = 14
): Array<{ date: string; hit: boolean; hours: number }> {
  const TARGET = 2.0;
  return dailyStats.slice(-days).map((d) => ({
    date: d.date,
    hit: d.deep_work_hours >= TARGET,
    hours: d.deep_work_hours,
  }));
}

/**
 * Predict likelihood of maintaining streak
 * Based on historical consistency patterns
 */
export function predictStreakMaintenance(
  dailyStats: DailyStats[]
): { probability: number; confidence: 'high' | 'medium' | 'low' } {
  if (dailyStats.length < 7) {
    return { probability: 0.5, confidence: 'low' };
  }

  const last30 = dailyStats.slice(-30);
  const daysWithWork = last30.filter((d) => d.deep_work_hours >= 1.0).length;
  const probability = daysWithWork / last30.length;

  const confidence =
    last30.length >= 20 ? 'high' : last30.length >= 10 ? 'medium' : ('low' as const);

  return { probability: Math.round(probability * 100) / 100, confidence };
}
