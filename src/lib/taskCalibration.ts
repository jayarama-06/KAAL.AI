// ═══════════════════════════════════════════════════════════════════════════
// Task Calibration Service
// Tracks how long tasks actually take vs estimates, improves future predictions
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase-client';

export interface CalibrationData {
  calibration_factor: number; // e.g., 1.4 = user takes 40% longer than estimated
  total_tasks: number;
  avg_estimated_minutes: number;
  avg_actual_minutes: number;
  accuracy_trend: 'improving' | 'declining' | 'stable';
}

/**
 * Get user's personal calibration factor
 * How accurate are their time estimates?
 */
export async function getCalibrationFactor(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_calibration_factor', {
    p_user_id: userId
  });

  if (error || !data || data.length === 0) {
    return 1.0; // Default: assume estimates are accurate until proven otherwise
  }

  return data[0].calibration_factor || 1.0;
}

/**
 * SQL function to create in Supabase:
 * 
 * CREATE OR REPLACE FUNCTION get_calibration_factor(p_user_id UUID)
 * RETURNS TABLE (
 *   calibration_factor NUMERIC
 * ) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     ROUND(
 *       AVG(actual_minutes::float / NULLIF(estimated_minutes, 0))::NUMERIC,
 *       2
 *     ) AS calibration_factor
 *   FROM tasks
 *   WHERE user_id = p_user_id
 *     AND actual_minutes IS NOT NULL
 *     AND estimated_minutes > 0
 *     AND created_at > NOW() - INTERVAL '30 days';
 * END;
 * $$ LANGUAGE plpgsql;
 */

/**
 * Get detailed calibration data for analytics
 */
export async function getCalibrationData(userId: string): Promise<CalibrationData | null> {
  // Get calibration factor
  const factor = await getCalibrationFactor(userId);

  // Get task statistics
  const { data: tasks } = await supabase
    .from('tasks')
    .select('estimated_minutes, actual_minutes, created_at')
    .eq('user_id', userId)
    .not('actual_minutes', 'is', null)
    .gt('estimated_minutes', 0)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!tasks || tasks.length === 0) return null;

  const total_tasks = tasks.length;
  const avg_estimated = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0) / total_tasks;
  const avg_actual = tasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0) / total_tasks;

  // Calculate trend (recent 7 days vs previous 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const recentTasks = tasks.filter(t => new Date(t.created_at) >= sevenDaysAgo);
  const previousTasks = tasks.filter(
    t => new Date(t.created_at) < sevenDaysAgo && new Date(t.created_at) >= fourteenDaysAgo
  );

  let accuracy_trend: 'improving' | 'declining' | 'stable' = 'stable';

  if (recentTasks.length >= 3 && previousTasks.length >= 3) {
    const recentFactor =
      recentTasks.reduce((sum, t) => sum + (t.actual_minutes || 0) / (t.estimated_minutes || 1), 0) /
      recentTasks.length;
    const previousFactor =
      previousTasks.reduce((sum, t) => sum + (t.actual_minutes || 0) / (t.estimated_minutes || 1), 0) /
      previousTasks.length;

    const diff = Math.abs(recentFactor - 1) - Math.abs(previousFactor - 1);
    if (diff < -0.1) accuracy_trend = 'improving';
    if (diff > 0.1) accuracy_trend = 'declining';
  }

  return {
    calibration_factor: factor,
    total_tasks,
    avg_estimated_minutes: Math.round(avg_estimated),
    avg_actual_minutes: Math.round(avg_actual),
    accuracy_trend,
  };
}

/**
 * Adjust estimated time using calibration factor
 * Show this to user when they enter an estimate
 */
export function adjustEstimate(
  estimatedMinutes: number,
  calibrationFactor: number
): number {
  return Math.round(estimatedMinutes * calibrationFactor);
}

/**
 * Get calibration message for display
 */
export function getCalibrationMessage(
  estimatedMinutes: number,
  calibrationFactor: number
): string | null {
  if (calibrationFactor < 0.9 || calibrationFactor === 1.0) return null;

  const adjusted = adjustEstimate(estimatedMinutes, calibrationFactor);
  const diff = adjusted - estimatedMinutes;

  if (diff < 5) return null; // Don't show if difference is trivial

  return `Based on your history, this will likely take ~${adjusted} min`;
}

/**
 * Get accuracy label for UI display
 */
export function getAccuracyLabel(calibrationFactor: number): string {
  if (calibrationFactor >= 0.9 && calibrationFactor <= 1.1) return 'Accurate';
  if (calibrationFactor > 1.1 && calibrationFactor <= 1.3) return 'Slightly optimistic';
  if (calibrationFactor > 1.3) return 'Optimistic';
  if (calibrationFactor < 0.9) return 'Pessimistic';
  return 'Unknown';
}

/**
 * Get accuracy color for UI
 */
export function getAccuracyColor(calibrationFactor: number): string {
  if (calibrationFactor >= 0.9 && calibrationFactor <= 1.1) return '#10B981'; // green
  if (calibrationFactor > 1.1 && calibrationFactor <= 1.3) return '#F59E0B'; // amber
  if (calibrationFactor > 1.3) return '#EF4444'; // red
  return '#6B7280'; // gray
}

/**
 * Record actual time spent on task
 * Call this when user completes a task
 */
export async function recordActualTime(
  taskId: string,
  startedAt: Date,
  completedAt: Date
): Promise<void> {
  const actualMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);

  await supabase
    .from('tasks')
    .update({
      actual_minutes: actualMinutes,
      started_at: startedAt.toISOString(),
    })
    .eq('id', taskId);
}