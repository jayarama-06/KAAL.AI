/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  KAAL Cognitive State Estimator                           ║
 * ║                                                           ║
 * ║  Infers the user's real-time cognitive and emotional      ║
 * ║  state from behavioral signals — without asking.          ║
 * ║                                                           ║
 * ║  States drive:                                            ║
 * ║   ─ WHICH nudge types are appropriate right now           ║
 * ║   ─ HOW urgent the tone should be                         ║
 * ║   ─ WHETHER to nudge at all (receptivity gate)            ║
 * ║                                                           ║
 * ║  Critical insight: nudging someone who's overwhelmed      ║
 * ║  with "you have 3 overdue tasks" makes things worse.      ║
 * ║  The state determines what's safe to surface.             ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

export type CognitiveState =
  | 'flow'          // Deep focused work — only critical alerts
  | 'primed'        // High energy, ready, no session — ideal for nudges
  | 'shallow_work'  // Active but not in deep focus
  | 'avoidance'     // Has work, not starting — needs a gentle push
  | 'overwhelmed'   // Too many demands, stress signals — handle carefully
  | 'anxious'       // Deadlines + inaction + low energy
  | 'fatigued'      // Long continuous work, cognitive decline
  | 'recovery'      // Just finished a session — needs rest
  | 'idle'          // Not working, low engagement
  | 'unknown';

export interface StateSignals {
  hour:                number;
  focusSessionActive:  boolean;
  focusSessionMinutes: number;
  todayFocusMinutes:   number;
  energyLevel:         number;   // 1–5
  tasksTotal:          number;
  tasksCompleted:      number;
  tasksOverdue:        number;
  lastActivityMs:      number;   // ms since last UI activity
  recentSessionEnded:  boolean;  // ended a session in the last 20 min
  tasksCreatedToday?:  number;
  weeklyCompletionRate?: number; // 0–1
}

export interface CognitiveStateResult {
  state:         CognitiveState;
  confidence:    number;      // 0–1
  receptivity:   number;      // 0–1 — will they respond to a nudge?
  allowedNudges: string[];    // types that are appropriate for this state
  blockedNudges: string[];    // types that would be counterproductive
  stateLabel:    string;      // human-readable label
  reasoning:     string;      // why KAAL inferred this state
}

// ─── State profiles ────────────────────────────────────────────────────────────
// Receptivity = probability the user will engage with a nudge in this state.
// Allowed / blocked = nudge types that help vs. harm in this state.

const PROFILES: Record<CognitiveState, {
  receptivity:   number;
  allowedNudges: string[];
  blockedNudges: string[];
  label:         string;
}> = {
  flow: {
    receptivity:   0.05,
    allowedNudges: ['break_needed'],
    blockedNudges: ['morning_brief', 'task_suggestion', 'idle_warning', 'quick_win',
                    'momentum_boost', 'streak_at_risk', 'procrastination_detected',
                    'velocity_warning', 'workload_infeasible'],
    label: 'In Deep Work',
  },
  primed: {
    receptivity:   0.92,
    allowedNudges: ['peak_energy', 'task_suggestion', 'quick_win', 'morning_brief',
                    'task_overdue', 'deadline_risk', 'procrastination_detected',
                    'anomaly_detected', 'workload_infeasible'],
    blockedNudges: [],
    label: 'Primed & Ready',
  },
  shallow_work: {
    receptivity:   0.68,
    allowedNudges: ['task_overdue', 'deadline_risk', 'quick_win', 'momentum_boost',
                    'task_suggestion', 'break_needed'],
    blockedNudges: ['idle_warning'],
    label: 'In Shallow Work',
  },
  avoidance: {
    receptivity:   0.78,
    allowedNudges: ['gentle_start', 'quick_win', 'reentry', 'task_suggestion',
                    'procrastination_detected', 'momentum_boost'],
    blockedNudges: ['task_overdue', 'workload_infeasible'],  // pressure deepens avoidance
    label: 'Avoiding Tasks',
  },
  overwhelmed: {
    receptivity:   0.35,
    allowedNudges: ['gentle_start', 'quick_win'],
    blockedNudges: ['task_overdue', 'streak_at_risk', 'workload_infeasible',
                    'deadline_risk', 'procrastination_detected', 'velocity_warning'],
    label: 'Overwhelmed',
  },
  anxious: {
    receptivity:   0.30,
    allowedNudges: ['gentle_start'],
    blockedNudges: ['task_overdue', 'streak_at_risk', 'deadline_risk',
                    'procrastination_detected', 'workload_infeasible'],
    label: 'Running Anxious',
  },
  fatigued: {
    receptivity:   0.55,
    allowedNudges: ['break_needed', 'afternoon_slump'],
    blockedNudges: ['peak_energy', 'morning_brief', 'quick_win', 'velocity_warning'],
    label: 'Cognitively Fatigued',
  },
  recovery: {
    receptivity:   0.65,
    allowedNudges: ['momentum_boost', 'evening_wrap', 'task_suggestion'],
    blockedNudges: ['break_needed', 'idle_warning'],
    label: 'Post-Session Recovery',
  },
  idle: {
    receptivity:   0.75,
    allowedNudges: ['idle_warning', 'quick_win', 'reentry', 'morning_brief',
                    'task_suggestion', 'streak_at_risk', 'velocity_warning'],
    blockedNudges: ['break_needed', 'momentum_boost', 'focus_celebrate'],
    label: 'Idle',
  },
  unknown: {
    receptivity:   0.50,
    allowedNudges: ['morning_brief', 'task_overdue', 'streak_at_risk'],
    blockedNudges: [],
    label: 'State Unknown',
  },
};

// ─── Estimator ────────────────────────────────────────────────────────────────

class CognitiveStateEstimator {

  estimate(signals: StateSignals): CognitiveStateResult {
    const state   = this.infer(signals);
    const profile = PROFILES[state];

    return {
      state,
      confidence:    this.confidence(state, signals),
      receptivity:   profile.receptivity,
      allowedNudges: profile.allowedNudges,
      blockedNudges: profile.blockedNudges,
      stateLabel:    profile.label,
      reasoning:     this.reason(state, signals),
    };
  }

  private infer(s: StateSignals): CognitiveState {
    const pending = s.tasksTotal - s.tasksCompleted;

    // ── Flow: active, sustained, decent energy ──────────────────────────────
    if (s.focusSessionActive && s.focusSessionMinutes >= 20 && s.energyLevel >= 3) {
      return 'flow';
    }

    // ── Fatigued: very long continuous session ───────────────────────────────
    if (s.focusSessionActive && s.focusSessionMinutes >= 80) {
      return 'fatigued';
    }

    // ── Recovery: session just ended ────────────────────────────────────────
    if (s.recentSessionEnded && s.todayFocusMinutes >= 40) {
      return 'recovery';
    }

    // ── Overwhelmed: many overdue + low energy + large backlog ──────────────
    if (s.tasksOverdue >= 3 && s.energyLevel <= 2 && pending > 8) {
      return 'overwhelmed';
    }

    // ── Anxious: multiple overdue + idle + low energy ───────────────────────
    if (s.tasksOverdue >= 2 && s.lastActivityMs > 30 * 60_000 && s.energyLevel <= 3) {
      return 'anxious';
    }

    // ── Primed: high energy, work hours, no active session, tasks waiting ───
    if (s.energyLevel >= 4 && !s.focusSessionActive && s.hour >= 8 && s.hour <= 17 && pending > 0) {
      return 'primed';
    }

    // ── Avoidance: work to do, idle in work hours ────────────────────────────
    if (!s.focusSessionActive && s.lastActivityMs > 40 * 60_000 && s.hour >= 9 && s.hour <= 18 && pending > 0) {
      return 'avoidance';
    }

    // ── Shallow work: short/early session ───────────────────────────────────
    if (s.focusSessionActive && s.focusSessionMinutes < 20) {
      return 'shallow_work';
    }

    // ── Idle: no focus time, mid-late morning ────────────────────────────────
    if (!s.focusSessionActive && s.todayFocusMinutes === 0 && s.hour >= 9) {
      return 'idle';
    }

    return 'unknown';
  }

  private confidence(state: CognitiveState, s: StateSignals): number {
    switch (state) {
      case 'flow':        return s.focusSessionMinutes >= 30 ? 0.92 : 0.75;
      case 'fatigued':    return s.focusSessionMinutes >= 90 ? 0.95 : 0.80;
      case 'primed':      return s.energyLevel === 5 ? 0.90 : 0.74;
      case 'overwhelmed': return s.tasksOverdue >= 5 ? 0.88 : 0.68;
      case 'avoidance':   return s.lastActivityMs > 60 * 60_000 ? 0.85 : 0.63;
      case 'recovery':    return 0.80;
      case 'anxious':     return 0.72;
      case 'idle':        return s.todayFocusMinutes === 0 && s.hour >= 11 ? 0.87 : 0.63;
      default:            return 0.50;
    }
  }

  private reason(state: CognitiveState, s: StateSignals): string {
    switch (state) {
      case 'flow':
        return `Active session (${s.focusSessionMinutes} min), energy ${s.energyLevel}/5 — in deep work.`;
      case 'fatigued':
        return `${s.focusSessionMinutes} min of continuous work — past the point of diminishing returns.`;
      case 'recovery':
        return `Session recently ended, ${s.todayFocusMinutes} min total — natural recovery window.`;
      case 'primed':
        return `Energy ${s.energyLevel}/5, no active session, ${s.hour}:00 work hours — optimal nudge window.`;
      case 'avoidance':
        return `${Math.round(s.lastActivityMs / 60_000)} min inactive with ${s.tasksTotal - s.tasksCompleted} tasks pending.`;
      case 'overwhelmed':
        return `${s.tasksOverdue} overdue, energy ${s.energyLevel}/5, ${s.tasksTotal - s.tasksCompleted} pending — capacity exceeded.`;
      case 'anxious':
        return `${s.tasksOverdue} overdue, idle ${Math.round(s.lastActivityMs / 60_000)} min, energy ${s.energyLevel}/5.`;
      case 'idle':
        return `No focus time today, ${s.hour >= 11 ? 'mid-day' : 'morning'} — disengaged.`;
      case 'shallow_work':
        return `Active session but only ${s.focusSessionMinutes} min in — not yet in deep work mode.`;
      default:
        return 'Insufficient signals to determine current state.';
    }
  }

  /** Quick gate: is it appropriate to deliver this nudge type right now? */
  isNudgeAppropriate(nudgeType: string, signals: StateSignals): boolean {
    const result = this.estimate(signals);
    if (result.blockedNudges.includes(nudgeType)) return false;
    if (result.receptivity < 0.25)               return nudgeType === 'break_needed';
    return true;
  }
}

export const cognitiveStateEstimator = new CognitiveStateEstimator();
