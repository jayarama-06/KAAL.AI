// ═══════════════════════════════════════════════════════════════════════════
// Energy Patterns Service
// Analyzes user's historical energy check-ins to build time-of-day patterns
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase-client';

export interface EnergyByHour {
  hour_of_day: number;
  avg_energy: number;
  sample_size: number;
}

export interface EnergyByDay {
  day_of_week: string;
  day_number: number;
  avg_energy: number;
  sample_size: number;
}

export interface PeakHours {
  morning_peak?: number; // hour of day (0-23)
  afternoon_peak?: number;
  evening_peak?: number;
  best_overall_hour: number;
  worst_overall_hour: number;
}

/**
 * Get user's average energy by hour of day
 * Uses last 30 days of check-ins
 */
export async function getEnergyByHour(userId: string): Promise<EnergyByHour[]> {
  const { data, error } = await supabase.rpc('get_energy_by_hour', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error fetching energy by hour:', error);
    return [];
  }

  return data || [];
}

/**
 * SQL function to create in Supabase:
 * 
 * CREATE OR REPLACE FUNCTION get_energy_by_hour(p_user_id UUID)
 * RETURNS TABLE (
 *   hour_of_day INTEGER,
 *   avg_energy NUMERIC,
 *   sample_size BIGINT
 * ) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::INTEGER AS hour_of_day,
 *     ROUND(AVG(energy_level)::NUMERIC, 2) AS avg_energy,
 *     COUNT(*) AS sample_size
 *   FROM energy_checkins
 *   WHERE user_id = p_user_id
 *     AND created_at > NOW() - INTERVAL '30 days'
 *   GROUP BY hour_of_day
 *   ORDER BY hour_of_day;
 * END;
 * $$ LANGUAGE plpgsql;
 */

/**
 * Get user's average energy by day of week
 */
export async function getEnergyByDay(userId: string): Promise<EnergyByDay[]> {
  const { data, error } = await supabase.rpc('get_energy_by_day', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error fetching energy by day:', error);
    return [];
  }

  return data || [];
}

/**
 * SQL function to create in Supabase:
 * 
 * CREATE OR REPLACE FUNCTION get_energy_by_day(p_user_id UUID)
 * RETURNS TABLE (
 *   day_of_week TEXT,
 *   day_number INTEGER,
 *   avg_energy NUMERIC,
 *   sample_size BIGINT
 * ) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     TO_CHAR(created_at, 'Day') AS day_of_week,
 *     EXTRACT(DOW FROM created_at)::INTEGER AS day_number,
 *     ROUND(AVG(energy_level)::NUMERIC, 2) AS avg_energy,
 *     COUNT(*) AS sample_size
 *   FROM energy_checkins
 *   WHERE user_id = p_user_id
 *     AND created_at > NOW() - INTERVAL '30 days'
 *   GROUP BY day_of_week, day_number
 *   ORDER BY avg_energy DESC;
 * END;
 * $$ LANGUAGE plpgsql;
 */

/**
 * Identify user's peak hours
 */
export async function identifyPeakHours(userId: string): Promise<PeakHours | null> {
  const hourlyData = await getEnergyByHour(userId);

  if (hourlyData.length === 0) return null;

  // Filter by time of day
  const morningHours = hourlyData.filter(h => h.hour_of_day >= 5 && h.hour_of_day < 12);
  const afternoonHours = hourlyData.filter(h => h.hour_of_day >= 12 && h.hour_of_day < 17);
  const eveningHours = hourlyData.filter(h => h.hour_of_day >= 17 && h.hour_of_day < 22);

  // Find peaks
  const findPeak = (hours: EnergyByHour[]) =>
    hours.length > 0
      ? hours.reduce((max, h) => (h.avg_energy > max.avg_energy ? h : max)).hour_of_day
      : undefined;

  const morning_peak = findPeak(morningHours);
  const afternoon_peak = findPeak(afternoonHours);
  const evening_peak = findPeak(eveningHours);

  // Overall best and worst
  const best = hourlyData.reduce((max, h) => (h.avg_energy > max.avg_energy ? h : max));
  const worst = hourlyData.reduce((min, h) => (h.avg_energy < min.avg_energy ? h : min));

  return {
    morning_peak,
    afternoon_peak,
    evening_peak,
    best_overall_hour: best.hour_of_day,
    worst_overall_hour: worst.hour_of_day,
  };
}

/**
 * Predict energy for a given hour
 * Returns predicted energy level (1-3) or null if no data
 */
export async function predictEnergyForHour(
  userId: string,
  hour: number
): Promise<number | null> {
  const hourlyData = await getEnergyByHour(userId);
  const match = hourlyData.find(h => h.hour_of_day === hour);

  if (!match || match.sample_size < 2) return null; // Need at least 2 samples

  return Math.round(match.avg_energy);
}

/**
 * Get suggested check-in time (user's historically highest energy hour)
 */
export async function getSuggestedCheckinTime(userId: string): Promise<number> {
  const peaks = await identifyPeakHours(userId);
  return peaks?.best_overall_hour ?? 9; // Default to 9am if no data
}

/**
 * Get peak hours summary for dashboard display
 */
export async function getPeakHoursSummary(userId: string): Promise<string | null> {
  const peaks = await identifyPeakHours(userId);
  const dayData = await getEnergyByDay(userId);

  if (!peaks || dayData.length === 0) return null;

  const bestDay = dayData[0]; // Already sorted by avg_energy DESC
  const hourLabel = formatHour(peaks.best_overall_hour);
  const dayName = bestDay.day_of_week.trim();

  return `You are historically sharpest at ${hourLabel} on ${dayName}s`;
}

/**
 * Format hour for display
 */
function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}${period}`;
}

/**
 * Get time of day from hour
 */
export function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}