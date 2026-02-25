/**
 * KAAL Nudge Service
 * 
 * Handles:
 * 1. Calling the AI nudge generation API
 * 2. Logging nudge events to Supabase
 * 3. Fetching nudge history
 */

import { supabase } from './supabase-client';
import { NudgeType } from '../lib/nudgeEngine';
import { projectId } from '../utils/supabase/info.tsx';

export interface NudgeGenerationRequest {
  task_title: string;
  estimated_minutes: number;
  nudge_type: string;
  energy_level: number;
  cognitive_mode: string;
  tasks_done_today: number;
  minutes_overdue: number;
  history_hint: string;
}

export interface NudgeEvent {
  id?: string;
  user_id: string;
  task_id: string | null;
  nudge_type: NudgeType;
  nudge_message: string;
  sent_at: string;
  outcome: 'started' | 'deferred' | 'dismissed' | 'ignored' | null;
  response_delay_seconds: number | null;
}

const SUPABASE_URL = `https://${projectId}.supabase.co`;

/**
 * Generate AI nudge message via Supabase Edge Function
 */
export async function generateNudgeMessage(
  request: NudgeGenerationRequest
): Promise<{ message: string; fallback: boolean }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-nudge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      message: data.message,
      fallback: data.fallback || false,
    };

  } catch (error) {
    console.error('Error generating nudge:', error);
    // Return fallback message
    return {
      message: getFallbackMessage(request.nudge_type),
      fallback: true,
    };
  }
}

/**
 * Log a nudge event to Supabase
 */
export async function logNudgeEvent(event: Omit<NudgeEvent, 'id'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('nudge_events')
      .insert({
        user_id: event.user_id,
        task_id: event.task_id,
        nudge_type: event.nudge_type,
        nudge_message: event.nudge_message,
        sent_at: event.sent_at,
        outcome: event.outcome,
        response_delay_seconds: event.response_delay_seconds,
      });

    if (error) {
      console.error('Error logging nudge event:', error);
    }
  } catch (error) {
    console.error('Error logging nudge event:', error);
  }
}

/**
 * Update a nudge event's outcome
 */
export async function updateNudgeOutcome(
  eventId: string,
  outcome: 'started' | 'deferred' | 'dismissed' | 'ignored',
  responseDelaySeconds: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('nudge_events')
      .update({
        outcome,
        response_delay_seconds: responseDelaySeconds,
      })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating nudge outcome:', error);
    }
  } catch (error) {
    console.error('Error updating nudge outcome:', error);
  }
}

/**
 * Fetch recent nudge events for the current user
 */
export async function getNudgeHistory(
  daysBack: number = 30
): Promise<{ nudge_type: string; outcome: string }[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data, error } = await supabase
      .from('nudge_events')
      .select('nudge_type, outcome')
      .eq('user_id', user.id)
      .gte('sent_at', cutoffDate.toISOString())
      .not('outcome', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching nudge history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching nudge history:', error);
    return [];
  }
}

/**
 * Get fallback message when AI is unavailable
 */
function getFallbackMessage(nudgeType: string): string {
  const fallbacks: Record<string, string> = {
    gentle: 'Your next task is ready when you are. What would make starting easier right now?',
    active: 'This task has been waiting. Starting now protects the rest of your day.',
    intervention: 'This task needs your attention. Time to make a decision: start it or reschedule it.',
    context_switch: 'Your energy has shifted. Here is a better-matched task for right now.',
    break_reminder: 'You have been focused for over 90 minutes. A short break improves output.',
  };

  return fallbacks[nudgeType] || 'Your next task is waiting. What is one small step you can take right now?';
}

/**
 * Helper: Get nudge history hint for AI personalization
 */
export async function getNudgeHistoryHint(): Promise<string> {
  const history = await getNudgeHistory(30);
  
  if (history.length === 0) {
    return 'No nudge history for this user yet.';
  }

  // Count outcomes by type
  const typeOutcomes: Record<string, Record<string, number>> = {};
  
  history.forEach(event => {
    if (!typeOutcomes[event.nudge_type]) {
      typeOutcomes[event.nudge_type] = {};
    }
    if (!typeOutcomes[event.nudge_type][event.outcome]) {
      typeOutcomes[event.nudge_type][event.outcome] = 0;
    }
    typeOutcomes[event.nudge_type][event.outcome]++;
  });

  // Build hint string
  const hints: string[] = [];
  for (const [type, outcomes] of Object.entries(typeOutcomes)) {
    const total = Object.values(outcomes).reduce((sum, count) => sum + count, 0);
    const mostCommon = Object.entries(outcomes).sort(
      (a, b) => b[1] - a[1]
    )[0];
    
    if (mostCommon && total >= 2) {
      hints.push(
        `For ${type} nudges, user typically ${mostCommon[0]}s (${Math.round((mostCommon[1] / total) * 100)}%)`
      );
    }
  }

  return hints.length > 0
    ? hints.join('. ') + '.'
    : 'Limited nudge history available.';
}