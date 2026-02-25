// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 8: Anomaly Detector
// Find breakout days and burnout risk using Z-Score + IQR
// ═══════════════════════════════════════════════════════════════════════════

import type { AnomalyResult, BurnoutRisk, DailyStats } from './types';
import { mannKendallTrend } from './trendDetector';

/**
 * Z-Score anomaly detection — personal baselines, not generic thresholds
 * A 92% day for one user is exceptional; for another it's normal.
 */
export function detectDayAnomaly(
  todayScore: number,
  historicalScores: number[], // last 30 days
  minSamples = 7
): AnomalyResult {
  if (historicalScores.length < minSamples) {
    // Not enough history — use generic thresholds
    if (todayScore >= 85) return { type: 'high', zScore: 0 };
    if (todayScore >= 60) return { type: 'moderate', zScore: 0 };
    return { type: 'normal', zScore: 0 };
  }

  const mean = historicalScores.reduce((s, v) => s + v, 0) / historicalScores.length;
  const variance = historicalScores.reduce((s, v) => s + (v - mean) ** 2, 0) / historicalScores.length;
  const stdev = Math.sqrt(variance);

  // Z-score: how many standard deviations above/below mean
  const zScore = stdev > 0 ? (todayScore - mean) / stdev : 0;

  // ── IQR for extreme outlier detection ──
  const sorted = [...historicalScores].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const isExtremeHigh = todayScore > q3 + 1.5 * iqr;
  const isExtremeLow = todayScore < q1 - 1.5 * iqr;

  if (isExtremeHigh || zScore > 2.0) return { type: 'breakout_day', zScore };
  if (isExtremeLow || zScore < -2.0) return { type: 'burnout_risk', zScore };
  if (zScore >= 0.5) return { type: 'high', zScore };
  if (zScore >= -0.5) return { type: 'moderate', zScore };
  return { type: 'normal', zScore };
}

/**
 * Detect burnout pattern across multiple days
 * Track multi-day patterns, not just single-day anomalies
 */
export function detectBurnoutPattern(
  last10Days: Array<{
    productivity_score: number | null;
    deep_work_hours: number;
    tasks_deferred: number;
  }>
): BurnoutRisk {
  if (last10Days.length < 5) return { risk_level: 'none', signals: [] };

  const signals: string[] = [];
  let riskScore = 0;

  // Signal 1: Declining productivity trend
  const scores = last10Days.map((d) => d.productivity_score || 0);
  const trend = mannKendallTrend(scores);
  if (trend.direction === 'decreasing' && trend.strength !== 'weak') {
    riskScore += 3;
    signals.push('Productivity declining over last 10 days');
  }

  // Signal 2: Deep work hours collapsing
  const recentDW = last10Days.slice(-3).map((d) => d.deep_work_hours);
  const earlierDW = last10Days.slice(0, 3).map((d) => d.deep_work_hours);
  const recentAvg = recentDW.reduce((s, v) => s + v, 0) / 3;
  const earlierAvg = earlierDW.reduce((s, v) => s + v, 0) / 3;
  const dwDrop = recentAvg - earlierAvg;
  if (dwDrop < -1.5) {
    riskScore += 2;
    signals.push('Deep work hours dropped significantly');
  }

  // Signal 3: Deferrals spiking
  const recentDeferred = last10Days.slice(-3).reduce((s, d) => s + d.tasks_deferred, 0);
  const avgDeferred = last10Days.reduce((s, d) => s + d.tasks_deferred, 0) / last10Days.length;
  if (recentDeferred > avgDeferred * 3 * 1.5) {
    riskScore += 2;
    signals.push('Task deferrals spiked in recent days');
  }

  // Signal 4: Multiple low-score days in a row
  const last3Scores = scores.slice(-3);
  if (last3Scores.every((s) => s < 50)) {
    riskScore += 2;
    signals.push('Three consecutive low-productivity days');
  }

  return {
    risk_level:
      riskScore >= 5 ? 'high' : riskScore >= 3 ? 'medium' : riskScore >= 1 ? 'low' : ('none' as const),
    signals,
  };
}

/**
 * Get display styling for anomaly type
 */
export function getAnomalyDisplay(anomaly: AnomalyResult): {
  label: string;
  color: string;
  icon: string;
  message: string;
} {
  switch (anomaly.type) {
    case 'breakout_day':
      return {
        label: 'EXCEPTIONAL',
        color: '#7C3AED',
        icon: '🏆',
        message: `Outstanding performance — ${Math.abs(Math.round(anomaly.zScore * 10) / 10)}σ above your average`,
      };
    case 'burnout_risk':
      return {
        label: 'LOW OUTPUT',
        color: '#DC2626',
        icon: '⚠️',
        message: 'Significantly below your usual performance — consider taking a break',
      };
    case 'high':
      return {
        label: 'HIGH PRODUCTIVITY',
        color: '#10B981',
        icon: '✅',
        message: 'Above your average — strong day',
      };
    case 'moderate':
      return {
        label: 'MODERATE',
        color: '#3B82F6',
        icon: '📊',
        message: 'Consistent with your typical performance',
      };
    case 'normal':
      return {
        label: 'STEADY',
        color: '#9CA3AF',
        icon: '📝',
        message: 'Normal activity day',
      };
  }
}

/**
 * Get burnout risk display
 */
export function getBurnoutRiskDisplay(risk: BurnoutRisk): {
  color: string;
  icon: string;
  title: string;
} {
  switch (risk.risk_level) {
    case 'high':
      return {
        color: '#DC2626',
        icon: '🚨',
        title: 'High Burnout Risk Detected',
      };
    case 'medium':
      return {
        color: '#F59E0B',
        icon: '⚠️',
        title: 'Moderate Burnout Signals',
      };
    case 'low':
      return {
        color: '#3B82F6',
        icon: 'ℹ️',
        title: 'Minor Burnout Indicators',
      };
    case 'none':
      return {
        color: '#10B981',
        icon: '✅',
        title: 'No Burnout Signals',
      };
  }
}
