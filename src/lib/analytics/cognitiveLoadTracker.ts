// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 2: Cognitive Load Tracker
// Track mental demand over time using Exponential Moving Average
// ═══════════════════════════════════════════════════════════════════════════

import type { FocusSession } from './types';

/**
 * Exponential Moving Average — gives more weight to recent sessions
 * α = 0.3: responds to recent changes without overreacting to outliers
 * Formula: EMA_t = α × current + (1-α) × EMA_t-1
 */
export function computeCognitiveLoadEMA(
  dailyCLSValues: number[], // ordered oldest→newest, one per day
  alpha = 0.3
): number {
  if (dailyCLSValues.length === 0) return 0;
  
  let ema = dailyCLSValues[0];
  for (let i = 1; i < dailyCLSValues.length; i++) {
    ema = alpha * dailyCLSValues[i] + (1 - alpha) * ema;
  }
  
  return Math.round(ema * 10) / 10; // one decimal place
}

/**
 * Find the hour of day with highest average cognitive load
 * Returns hour (0-23)
 */
export function findCLSPeakHour(
  sessions: Array<{ started_at: string; avg_cls_this_session: number }>
): number {
  const hourlySum = new Float64Array(24).fill(0);
  const hourlyCount = new Int32Array(24).fill(0);

  for (const s of sessions) {
    const hour = new Date(s.started_at).getHours();
    hourlySum[hour] += s.avg_cls_this_session;
    hourlyCount[hour]++;
  }

  let peakHour = 9; // default
  let peakAvg = 0;
  for (let h = 0; h < 24; h++) {
    if (hourlyCount[h] < 2) continue; // need at least 2 sessions to be meaningful
    const avg = hourlySum[h] / hourlyCount[h];
    if (avg > peakAvg) {
      peakAvg = avg;
      peakHour = h;
    }
  }
  
  return peakHour;
}

/**
 * Get context label for cognitive load score
 * Makes the number meaningful by comparing to historical average
 */
export function getCLSContextLabel(ema: number, historicalAvg: number): string {
  const diff = ema - historicalAvg;
  
  if (ema >= 8) return 'Peak cognitive week — highest demand in recent history';
  if (ema >= 6.5) return 'High demand — you worked on complex, meaningful tasks';
  if (ema >= 4.5) {
    if (diff > 1) return 'Higher than usual — cognitive load trending up';
    if (diff < -1) return 'Lower than usual — lighter tasks this period';
    return 'Steady cognitive demand — consistent with your average';
  }
  return 'Light cognitive load — mostly admin and routine tasks this period';
}

/**
 * Generate sparkline data for cognitive load trend
 * Returns normalized 0-1 values for visualization
 */
export function generateCLSSparkline(dailyCLSValues: number[]): {
  normalized: number[];
  peak: number;
  peakDay: number;
} {
  if (dailyCLSValues.length === 0) {
    return { normalized: [], peak: 0, peakDay: 0 };
  }

  const peak = Math.max(...dailyCLSValues);
  const peakDay = dailyCLSValues.indexOf(peak);
  const min = Math.min(...dailyCLSValues);
  const range = peak - min;

  const normalized = range > 0 
    ? dailyCLSValues.map(v => (v - min) / range)
    : dailyCLSValues.map(() => 0.5);

  return { normalized, peak, peakDay };
}

/**
 * Compute cognitive load percentile rank
 * Shows how demanding this period was compared to history
 */
export function computeCLSPercentile(currentEMA: number, historicalValues: number[]): number {
  if (historicalValues.length === 0) return 50;

  const belowCurrent = historicalValues.filter(v => v < currentEMA).length;
  return Math.round((belowCurrent / historicalValues.length) * 100);
}
