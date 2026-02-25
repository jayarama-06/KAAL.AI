// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 5: Peak Performance Finder
// Find when you focus best using Circular Buffer Heatmap
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../../services/supabase-client';

interface HourlyHeatmapEntry {
  hour: number; // 0-23
  intensity: number; // 0-1 normalized
  confidence: 'high' | 'medium' | 'low';
  avg_focus_score: number;
  session_count: number;
}

/**
 * Update heatmap after every session ends
 * Incremental update — O(1), no full recompute needed
 */
export async function updateHeatmap(
  userId: string,
  sessionStartHour: number,
  focusScore: number
): Promise<void> {
  try {
    // Get existing entry for this hour
    const { data: existing } = await supabase
      .from('hourly_heatmap')
      .select('*')
      .eq('user_id', userId)
      .eq('hour_slot', sessionStartHour)
      .eq('day_of_week', new Date().getDay())
      .single();

    if (!existing) {
      // First session at this hour
      await supabase.from('hourly_heatmap').insert({
        user_id: userId,
        hour_slot: sessionStartHour,
        day_of_week: new Date().getDay(),
        avg_focus_score: focusScore,
        session_count: 1,
        avg_tasks_completed: 0,
        avg_deep_work_ratio: 0,
      });
    } else {
      // Incremental running average: new_avg = (old_avg * n + new_value) / (n+1)
      const newCount = existing.session_count + 1;
      const newAvg = (existing.avg_focus_score * existing.session_count + focusScore) / newCount;
      await supabase
        .from('hourly_heatmap')
        .update({ avg_focus_score: Math.round(newAvg), session_count: newCount })
        .match({ user_id: userId, hour_slot: sessionStartHour, day_of_week: new Date().getDay() });
    }
  } catch (error) {
    console.error('Error updating hourly heatmap:', error);
  }
}

/**
 * Get the full heatmap for the Peak Performance widget
 */
export async function getPeakPerformanceData(userId: string): Promise<{
  peakWindowLabel: string;
  peakScore: number;
  heatmap: HourlyHeatmapEntry[];
  totalDeepWorkHours: number;
  hasSufficientData: boolean;
} | null> {
  try {
    const { data: heatmap } = await supabase
      .from('hourly_heatmap')
      .select('*')
      .eq('user_id', userId)
      .order('hour_slot');

    if (!heatmap || heatmap.length === 0) return null;

    // ── Find peak window (contiguous block of 2+ hours with highest average) ──
    // Sliding window of size 2 to find best 2-hour block
    let bestWindowScore = 0;
    let peakStartHour = 9;

    for (let h = 0; h < 22; h++) {
      const entry1 = heatmap.find((e) => e.hour_slot === h);
      const entry2 = heatmap.find((e) => e.hour_slot === h + 1);
      if (!entry1 || !entry2) continue;
      if (entry1.session_count < 2 || entry2.session_count < 2) continue; // need data

      const windowScore = (entry1.avg_focus_score + entry2.avg_focus_score) / 2;
      if (windowScore > bestWindowScore) {
        bestWindowScore = windowScore;
        peakStartHour = h;
      }
    }

    // ── Normalize heatmap scores to 0-1 for the clock face visualization ──
    const maxScore = Math.max(...heatmap.map((e) => e.avg_focus_score));
    const normalizedHeatmap: HourlyHeatmapEntry[] = heatmap.map((e) => ({
      hour: e.hour_slot,
      intensity: maxScore > 0 ? e.avg_focus_score / maxScore : 0,
      confidence:
        e.session_count >= 5 ? 'high' : e.session_count >= 2 ? 'medium' : ('low' as const),
      avg_focus_score: e.avg_focus_score,
      session_count: e.session_count,
    }));

    const peakHour12 =
      peakStartHour === 0
        ? '12–2am'
        : peakStartHour >= 12
        ? `${peakStartHour === 12 ? 12 : peakStartHour - 12}–${
            peakStartHour + 2 > 12 ? peakStartHour - 10 : peakStartHour + 2
          }pm`
        : `${peakStartHour}–${peakStartHour + 2}am`;

    return {
      peakWindowLabel: peakHour12,
      peakScore: Math.round(bestWindowScore),
      heatmap: normalizedHeatmap,
      totalDeepWorkHours: heatmap.reduce((s, e) => s + e.session_count * 0.75, 0), // approx
      hasSufficientData: heatmap.filter((e) => e.session_count >= 2).length >= 4,
    };
  } catch (error) {
    console.error('Error getting peak performance data:', error);
    return null;
  }
}

/**
 * Generate 24-hour clock face segments for visualization
 */
export function generateClockFaceData(heatmap: HourlyHeatmapEntry[]): Array<{
  hour: number;
  angle: number;
  intensity: number;
  label: string;
  color: string;
}> {
  const segments = [];
  
  for (let h = 0; h < 24; h++) {
    const entry = heatmap.find((e) => e.hour === h);
    const intensity = entry?.intensity || 0;
    
    // Convert hour to angle (0 = top, clockwise)
    const angle = (h / 24) * 360 - 90; // -90 to start at top
    
    // Color based on intensity
    const color =
      intensity >= 0.8
        ? '#10B981' // high - green
        : intensity >= 0.5
        ? '#3B82F6' // medium - blue
        : intensity >= 0.2
        ? '#9CA3AF' // low - gray
        : '#E5E7EB'; // no data - light gray

    const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

    segments.push({
      hour: h,
      angle,
      intensity,
      label,
      color,
    });
  }

  return segments;
}
