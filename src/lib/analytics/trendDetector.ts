// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 4: Trend Detector
// Detect real improvement vs noise using Mann-Kendall Trend Test
// ═══════════════════════════════════════════════════════════════════════════

import type { TrendResult, DailyStats } from './types';

/**
 * Mann-Kendall Trend Test — detects monotonic trends in time-series data
 * No assumption of linearity. Works well with small noisy datasets (7-30 points).
 */
export function mannKendallTrend(values: number[]): TrendResult {
  if (values.length < 4) {
    return {
      direction: 'no_trend',
      strength: 'weak',
      display: 'Not enough data',
      sparkData: values,
    };
  }

  // Count concordant (S+) and discordant (S-) pairs
  let S = 0;
  for (let i = 0; i < values.length - 1; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[j] > values[i]) S++;
      else if (values[j] < values[i]) S--;
    }
  }

  const n = values.length;
  // Variance of S under null hypothesis (no trend)
  const varS = (n * (n - 1) * (2 * n + 5)) / 18;
  const stdev = Math.sqrt(varS);

  // Normalized test statistic
  const Z = S > 0 ? (S - 1) / stdev : S < 0 ? (S + 1) / stdev : 0;

  // |Z| > 1.96 → 95% confidence of a trend
  const direction: TrendResult['direction'] =
    Z > 1.96 ? 'increasing' : Z < -1.96 ? 'decreasing' : 'no_trend';
  const strength: TrendResult['strength'] =
    Math.abs(Z) > 3 ? 'strong' : Math.abs(Z) > 2 ? 'moderate' : 'weak';

  // Normalize sparkData for chart rendering
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sparkData = max > min ? values.map((v) => (v - min) / (max - min)) : values.map(() => 0.5);

  const pctChange =
    values.length >= 2
      ? Math.round(((values[values.length - 1] - values[0]) / Math.max(0.01, values[0])) * 100)
      : 0;

  const display =
    direction === 'no_trend'
      ? 'Consistent — no significant change'
      : direction === 'increasing'
      ? `${strength === 'strong' ? 'Strong' : 'Gradual'} improvement (+${pctChange}%)`
      : `${strength === 'strong' ? 'Significant' : 'Gradual'} decline (${pctChange}%)`;

  return { direction, strength, display, sparkData };
}

/**
 * Compute trends for all key metrics shown on Focus Quality Trends card
 */
export function computeAllTrends(dailyStats: DailyStats[]) {
  const sessionCounts = dailyStats.map((d) => d.tasks_completed);
  const sessionLengths = dailyStats.map((d) => d.avg_session_length_mins);
  const consistencyScores = dailyStats.map((d) => d.focus_consistency_score || 0);
  const deepWorkHours = dailyStats.map((d) => d.deep_work_hours);

  return {
    deepWorkSessions: mannKendallTrend(sessionCounts),
    avgSessionLength: mannKendallTrend(sessionLengths),
    focusConsistency: mannKendallTrend(consistencyScores),
    deepWorkHours: mannKendallTrend(deepWorkHours),
  };
}

/**
 * Get display styling for trend arrows
 */
export function getTrendDisplay(trend: TrendResult): {
  icon: '↑' | '→' | '↓';
  color: string;
  weight: 'bold' | 'normal';
} {
  if (trend.direction === 'increasing') {
    return {
      icon: '↑',
      color: trend.strength === 'strong' ? '#10B981' : '#6EE7B7',
      weight: trend.strength === 'strong' ? 'bold' : 'normal',
    };
  }
  
  if (trend.direction === 'decreasing') {
    return {
      icon: '↓',
      color: trend.strength === 'strong' ? '#EF4444' : '#F59E0B',
      weight: trend.strength === 'strong' ? 'bold' : 'normal',
    };
  }

  return {
    icon: '→',
    color: '#9CA3AF',
    weight: 'normal',
  };
}

/**
 * Simple linear regression for trend line overlay
 * Returns slope and intercept for y = mx + b
 */
export function linearRegression(xValues: number[], yValues: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = xValues.length;
  if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 };

  const sumX = xValues.reduce((s, v) => s + v, 0);
  const sumY = yValues.reduce((s, v) => s + v, 0);
  const sumXY = xValues.reduce((s, v, i) => s + v * yValues[i], 0);
  const sumX2 = xValues.reduce((s, v) => s + v * v, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared: how well the line fits the data (0-1)
  const yMean = sumY / n;
  const ssTot = yValues.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = yValues.reduce((s, v, i) => s + (v - (slope * xValues[i] + intercept)) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}
