// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 10: Predictive Insights
// What your next week looks like using Linear Regression + Trajectory Projection
// ═══════════════════════════════════════════════════════════════════════════

import type { DailyStats, UserModel } from './types';
import { linearRegression } from './trendDetector';
import { computeCurrentStreak } from './focusConsistency';

/**
 * Generate predictive insights based on trend analysis
 * The analytics feature that no other tool has
 */
export function generatePredictiveInsights(
  dailyStats: DailyStats[],
  userModel: UserModel
): string[] {
  const insights: string[] = [];
  if (dailyStats.length < 7) return insights;

  const x = dailyStats.map((_, i) => i); // day index

  // ── Insight 1: Deep work ratio trajectory ──
  const dwRatios = dailyStats.map((d) => d.deep_work_ratio * 100);
  const dwReg = linearRegression(x, dwRatios);

  if (dwReg.rSquared > 0.3 && dwReg.slope !== 0) {
    const currentRatio = dwRatios[dwRatios.length - 1];
    const TARGET = 65;

    if (currentRatio < TARGET && dwReg.slope > 0) {
      const daysToTarget = Math.round((TARGET - currentRatio) / dwReg.slope);
      if (daysToTarget > 0 && daysToTarget < 60)
        insights.push(`At your current pace, you'll hit the 65% deep work target in ${daysToTarget} days`);
    } else if (currentRatio >= TARGET && dwReg.slope < 0) {
      insights.push('Deep work ratio is declining — you may drop below target this week');
    }
  }

  // ── Insight 2: Best day scheduling recommendation ──
  const byDay = Array(7)
    .fill(0)
    .map(() => ({ sum: 0, count: 0 }));
  dailyStats.forEach((d) => {
    const dow = new Date(d.date).getDay();
    byDay[dow].sum += d.productivity_score || 0;
    byDay[dow].count++;
  });
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bestDow = byDay.reduce((best, b, i) => {
    const bestAvg = byDay[best].sum / Math.max(1, byDay[best].count);
    const currentAvg = b.sum / Math.max(1, b.count);
    return b.count >= 2 && currentAvg > bestAvg ? i : best;
  }, 1);
  const bestHour = userModel.peak_energy_hour ?? 9;
  const bestHourLabel = bestHour >= 12 ? `${bestHour === 12 ? 12 : bestHour - 12}pm` : `${bestHour}am`;
  insights.push(
    `Your highest-output day is ${DAYS[bestDow]} — schedule hard tasks for ${DAYS[bestDow]} at ${bestHourLabel}`
  );

  // ── Insight 3: Productivity trajectory ──
  const scores = dailyStats.slice(-14).map((d) => d.productivity_score || 0);
  const scoreReg = linearRegression(
    scores.map((_, i) => i),
    scores
  );
  if (scoreReg.rSquared > 0.25) {
    const projected7 = scores[scores.length - 1] + scoreReg.slope * 7;
    if (scoreReg.slope > 1.5)
      insights.push(
        `Trajectory: your productivity score is on track to reach ${Math.min(100, Math.round(projected7))} next week`
      );
    else if (scoreReg.slope < -1.5)
      insights.push(
        `Watch out: current trend projects your score dropping to ${Math.max(0, Math.round(projected7))} next week`
      );
  }

  // ── Insight 4: Streak projection ──
  const streak = computeCurrentStreak(dailyStats);
  if (streak >= 3) {
    const nextCheckpoint = [7, 14, 21, 30, 60].find((cp) => cp > streak);
    if (nextCheckpoint) {
      const daysToCP = nextCheckpoint - streak;
      insights.push(
        `Keep going — you're ${daysToCP} day${daysToCP === 1 ? '' : 's'} from a ${nextCheckpoint}-day streak milestone`
      );
    }
  }

  // ── Insight 5: Energy pattern prediction ──
  if (userModel.peak_energy_hour) {
    const peakLabel =
      userModel.peak_energy_hour >= 12
        ? `${userModel.peak_energy_hour === 12 ? 12 : userModel.peak_energy_hour - 12}pm`
        : `${userModel.peak_energy_hour}am`;
    insights.push(`Your energy peaks around ${peakLabel} — protect this time for deep work`);
  }

  // ── Insight 6: Consistency prediction ──
  const last7 = dailyStats.slice(-7);
  const consistentDays = last7.filter((d) => d.deep_work_hours >= 2.0).length;
  if (consistentDays >= 5) {
    insights.push(
      `You hit your deep work target ${consistentDays}/7 days last week — you're building a strong habit`
    );
  } else if (consistentDays <= 2) {
    insights.push('Focus on consistency — aim for at least 2h deep work per day this week');
  }

  return insights;
}

/**
 * Project future productivity based on current trends
 */
export function projectProductivity(dailyStats: DailyStats[], daysAhead: number): {
  projected: number;
  confidence: 'high' | 'medium' | 'low';
  range: { min: number; max: number };
} {
  if (dailyStats.length < 7) {
    return {
      projected: 0,
      confidence: 'low',
      range: { min: 0, max: 100 },
    };
  }

  const scores = dailyStats.slice(-14).map((d) => d.productivity_score || 0);
  const x = scores.map((_, i) => i);
  const reg = linearRegression(x, scores);

  const currentScore = scores[scores.length - 1];
  const projected = Math.max(0, Math.min(100, Math.round(currentScore + reg.slope * daysAhead)));

  // Confidence based on R-squared
  const confidence = reg.rSquared > 0.6 ? 'high' : reg.rSquared > 0.3 ? 'medium' : ('low' as const);

  // Range: ±1 stdev from projection
  const residuals = scores.map((s, i) => s - (reg.slope * x[i] + reg.intercept));
  const stdev = Math.sqrt(residuals.reduce((sum, r) => sum + r ** 2, 0) / residuals.length);
  const range = {
    min: Math.max(0, Math.round(projected - stdev)),
    max: Math.min(100, Math.round(projected + stdev)),
  };

  return { projected, confidence, range };
}

/**
 * Predict when user will hit a specific target
 */
export function predictTargetDate(
  dailyStats: DailyStats[],
  metricName: 'productivity_score' | 'deep_work_ratio' | 'deep_work_hours',
  targetValue: number
): { daysUntil: number; confidence: 'high' | 'medium' | 'low'; achievable: boolean } | null {
  if (dailyStats.length < 7) return null;

  const values =
    metricName === 'deep_work_ratio'
      ? dailyStats.map((d) => d.deep_work_ratio * 100)
      : metricName === 'productivity_score'
      ? dailyStats.map((d) => d.productivity_score || 0)
      : dailyStats.map((d) => d.deep_work_hours);

  const x = values.map((_, i) => i);
  const reg = linearRegression(x, values);

  if (reg.slope === 0 || reg.rSquared < 0.2) {
    return null; // No meaningful trend
  }

  const currentValue = values[values.length - 1];

  // Already at or above target
  if (currentValue >= targetValue) {
    return {
      daysUntil: 0,
      confidence: 'high',
      achievable: true,
    };
  }

  // Moving away from target
  if (reg.slope < 0) {
    return {
      daysUntil: -1,
      confidence: reg.rSquared > 0.5 ? 'medium' : 'low',
      achievable: false,
    };
  }

  // Calculate days to target
  const daysUntil = Math.round((targetValue - currentValue) / reg.slope);

  return {
    daysUntil,
    confidence: reg.rSquared > 0.6 ? 'high' : reg.rSquared > 0.3 ? 'medium' : ('low' as const),
    achievable: daysUntil > 0 && daysUntil < 120, // Within 4 months is achievable
  };
}
