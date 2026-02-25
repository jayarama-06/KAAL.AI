/**
 * KAAL Nudge Decision Engine
 * 
 * Runs silently in the background. Decides WHEN to show a nudge.
 * Does NOT generate the message — that's Component 3 (AI generation).
 * 
 * This is pure logic — no UI is created here.
 */

import { RankedTask } from './rankTasks';

export type NudgeType = 
  | 'gentle'           // 0-15 min overdue
  | 'active'           // 15-45 min overdue
  | 'intervention'     // 45+ min overdue
  | 'context_switch'   // Energy dropped since last check-in
  | 'break_reminder';  // 90+ minutes of continuous work

export interface NudgeDecision {
  type: NudgeType;
  task: RankedTask;
  minutes_overdue: number;
  reason: string; // For debugging/logging
}

export interface NudgeEngineState {
  last_nudge_sent_at: number | null;
  nudges_dismissed_this_session: number;
  session_start_time: number;
  current_nudge: NudgeDecision | null;
  prev_energy_level: number | null;
  break_reminder_sent: boolean;
  dashboard_load_time: number;
}

/**
 * Create initial nudge engine state
 */
export function createNudgeEngineState(): NudgeEngineState {
  return {
    last_nudge_sent_at: null,
    nudges_dismissed_this_session: 0,
    session_start_time: Date.now(),
    current_nudge: null,
    prev_energy_level: null,
    break_reminder_sent: false,
    dashboard_load_time: Date.now(),
  };
}

/**
 * Main decision function — runs every 10 minutes
 * 
 * @returns NudgeDecision if a nudge should be shown, null otherwise
 */
export function shouldShowNudge(
  rankedTasks: RankedTask[],
  state: NudgeEngineState,
  currentEnergyLevel: number
): NudgeDecision | null {
  const now = Date.now();

  // ──────────────────────────────────────────────────────────────
  // INDEPENDENT CHECKS (run regardless of main flow)
  // ──────────────────────────────────────────────────────────────

  // BREAK REMINDER CHECK
  // If 90+ minutes have passed since session start
  const sessionDuration = now - state.session_start_time;
  if (!state.break_reminder_sent && sessionDuration > 5400000) {
    // 90 minutes = 5,400,000 ms
    return {
      type: 'break_reminder',
      task: {} as RankedTask, // No specific task
      minutes_overdue: 0,
      reason: 'User has been working for 90+ minutes without a break',
    };
  }

  // CONTEXT SWITCH CHECK
  // If energy has dropped since last check-in
  if (
    state.prev_energy_level !== null &&
    currentEnergyLevel < state.prev_energy_level
  ) {
    // Only trigger if we have at least 2 tasks to suggest a switch
    if (rankedTasks.length >= 2) {
      return {
        type: 'context_switch',
        task: rankedTasks[1], // Suggest the second-ranked task
        minutes_overdue: 0,
        reason: `Energy dropped from ${state.prev_energy_level} to ${currentEnergyLevel}`,
      };
    }
  }

  // ──────────────────────────────────────────────────────────────
  // MAIN OVERDUE TASK FLOW (5 checks)
  // ──────────────────────────────────────────────────────────────

  // CHECK 1: Are there any pending tasks?
  const pendingTasks = rankedTasks.filter(t => t.status === 'pending');
  if (pendingTasks.length === 0) {
    return null; // No tasks to nudge about
  }

  // CHECK 2: Is the top pending task overdue?
  const topTask = pendingTasks[0];
  const expectedStartTime =
    state.dashboard_load_time +
    (topTask.estimated_minutes || 25) * 60000 * 1.5; // 1.5x buffer

  const timeSinceShouldHaveStarted = now - expectedStartTime;
  if (timeSinceShouldHaveStarted <= 0) {
    return null; // Not overdue yet
  }

  // CHECK 3: Is any task currently in_progress?
  const hasActiveTask = rankedTasks.some(t => t.status === 'in_progress');
  if (hasActiveTask) {
    return null; // Never interrupt active work
  }

  // CHECK 4: Was a nudge sent in the last 30 minutes?
  if (state.last_nudge_sent_at) {
    const timeSinceLastNudge = now - state.last_nudge_sent_at;
    if (timeSinceLastNudge < 1800000) {
      // 30 minutes = 1,800,000 ms
      return null; // Too soon to send another nudge
    }
  }

  // CHECK 5: Has the user dismissed 3+ nudges this session?
  if (state.nudges_dismissed_this_session >= 3) {
    return null; // Stop nudging this session
  }

  // All checks passed — determine nudge type by minutes overdue
  const minutesOverdue = Math.floor(timeSinceShouldHaveStarted / 60000);

  let nudgeType: NudgeType;
  if (minutesOverdue < 15) {
    nudgeType = 'gentle';
  } else if (minutesOverdue < 45) {
    nudgeType = 'active';
  } else {
    nudgeType = 'intervention';
  }

  return {
    type: nudgeType,
    task: topTask,
    minutes_overdue: minutesOverdue,
    reason: `Task "${topTask.title}" is ${minutesOverdue} minutes overdue`,
  };
}

/**
 * Update state after a nudge is sent
 */
export function markNudgeSent(
  state: NudgeEngineState,
  decision: NudgeDecision
): NudgeEngineState {
  const updates: Partial<NudgeEngineState> = {
    last_nudge_sent_at: Date.now(),
    current_nudge: decision,
  };

  // Mark break reminder as sent if applicable
  if (decision.type === 'break_reminder') {
    updates.break_reminder_sent = true;
  }

  return { ...state, ...updates };
}

/**
 * Update state after a nudge is dismissed
 */
export function markNudgeDismissed(
  state: NudgeEngineState
): NudgeEngineState {
  return {
    ...state,
    nudges_dismissed_this_session: state.nudges_dismissed_this_session + 1,
    current_nudge: null,
  };
}

/**
 * Update state after a nudge is acted on (started/deferred)
 */
export function markNudgeActedOn(
  state: NudgeEngineState
): NudgeEngineState {
  return {
    ...state,
    current_nudge: null,
    // Don't increment dismissed count — user acted on it
  };
}

/**
 * Update energy level tracking
 */
export function updateEnergyLevel(
  state: NudgeEngineState,
  newEnergyLevel: number
): NudgeEngineState {
  return {
    ...state,
    prev_energy_level: newEnergyLevel,
  };
}

/**
 * Get nudge history hint for AI personalization
 * 
 * Analyzes recent nudge outcomes to guide AI message generation
 */
export function getNudgeHistoryHint(nudgeEvents: {
  nudge_type: string;
  outcome: string;
}[]): string {
  if (nudgeEvents.length === 0) {
    return 'No nudge history for this user yet.';
  }

  // Count outcomes by type
  const typeOutcomes: Record<string, Record<string, number>> = {};
  
  nudgeEvents.forEach(event => {
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
