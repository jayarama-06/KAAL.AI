/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  KAAL Proactive AI Service — Intelligence Layer v2                ║
 * ║                                                                   ║
 * ║  Upgraded from rule-based → intelligence-driven:                  ║
 * ║                                                                   ║
 * ║  v1 (before):                                                     ║
 * ║    14 hardcoded rules fired on time + threshold conditions.       ║
 * ║    Same nudge for every user at 9am with energy ≥ 4.             ║
 * ║                                                                   ║
 * ║  v2 (now):                                                        ║
 * ║    1. Cognitive state estimation  → receptivity gate              ║
 * ║    2. Predictive risk assessment  → forward-looking danger        ║
 * ║    3. Behavioral baseline         → is today off personal norm?   ║
 * ║    4. Intervention effectiveness  → what works for THIS user?     ║
 * ║    5. Weighted scoring + dispatch → best nudge for this moment    ║
 * ║    6. Outcome tracking            → feedback loop closes here     ║
 * ║                                                                   ║
 * ║  API is fully backward-compatible with v1.                        ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { behavioralBaseline }       from './behavioral-baseline';
import { predictiveRisk }           from './predictive-risk';
import { interventionIntelligence } from './intervention-intelligence';
import { cognitiveStateEstimator }  from './cognitive-state-estimator';
import type { TaskForRisk }         from './predictive-risk';
import type { NudgeOutcome }        from './intervention-intelligence';

// ─── Exported types (backward-compatible with v1) ─────────────────────────────

export type ProactiveNudgeType =
  // ── Core (v1) ────────────────────────────────────────────────────────────────
  | 'morning_brief'
  | 'peak_energy'
  | 'task_overdue'
  | 'idle_warning'
  | 'focus_celebrate'
  | 'break_needed'
  | 'afternoon_slump'
  | 'evening_wrap'
  | 'quick_win'
  | 'task_suggestion'
  | 'distraction_alert'
  | 'streak_at_risk'
  | 'momentum_boost'
  | 'gentle_start'
  | 'reentry'
  | 'custom'
  // ── Intelligence layer (v2) ───────────────────────────────────────────────────
  | 'deadline_risk'             // predictive: task about to miss its deadline
  | 'procrastination_detected'  // specific task showing avoidance pattern
  | 'workload_infeasible'       // this week cannot be completed at current pace
  | 'velocity_warning'          // behind personal productivity baseline today
  | 'anomaly_detected'          // today's energy is significantly above personal baseline
  | 'cascade_warning';          // stalled task about to block dependent work

export type NudgePriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProactiveInsight {
  id:               string;
  type:             ProactiveNudgeType;
  priority:         NudgePriority;
  category:         'coach' | 'warning' | 'celebration' | 'suggestion' | 'info';
  title:            string;
  message:          string;
  action?: {
    label:   string;
    route?:  string;
    handler?: () => void;
  };
  secondaryAction?: {
    label:   string;
    handler?: () => void;
  };
  timestamp:         number;
  dismissed:         boolean;
  snoozedUntil?:     number;
  emoji?:            string;
  context?:          Record<string, any>;
  // ── Intelligence metadata (v2) ────────────────────────────────────────────────
  intelligenceScore?: number;  // 0–1, how well-timed this nudge is
  cognitiveState?:    string;  // user state when this fired
  isPersonalized?:    boolean; // backed by real behavioral data
}

// ─── Signal types ─────────────────────────────────────────────────────────────

export interface BehaviorSignals {
  hour:                number;
  dayOfWeek:           number;
  tasksTotal:          number;
  tasksCompleted:      number;
  tasksOverdue:        number;
  tasksHighPriority:   number;
  lastActivityMs:      number;
  focusSessionActive:  boolean;
  focusSessionMinutes: number;
  energyLevel:         number;
  todayFocusMinutes:   number;
  streakDays:          number;
  lastNudgeTimes:      Record<ProactiveNudgeType, number>;
}

/** Extended signals — pass these for the full intelligence layer */
export interface EnrichedBehaviorSignals extends BehaviorSignals {
  tasks?:               TaskForRisk[];
  tasksCreatedToday?:   number;
  weekTasksCompleted?:  number;
  recentSessionEnded?:  boolean;
  weeklyCompletionRate?: number;
}

// ─── Cooldowns ────────────────────────────────────────────────────────────────

const CD = {
  SHORT:  30 * 60_000,
  MEDIUM:  2 * 60 * 60_000,
  LONG:    6 * 60 * 60_000,
  DAILY:  24 * 60 * 60_000,
};

// ─── Rule type ────────────────────────────────────────────────────────────────

type NudgeRule = {
  type:       ProactiveNudgeType;
  cooldownMs: number;
  baseScore:  number;   // 0–1 intrinsic urgency/importance
  condition:  (s: EnrichedBehaviorSignals) => boolean;
  generate:   (s: EnrichedBehaviorSignals) => Omit<ProactiveInsight, 'id' | 'timestamp' | 'dismissed'>;
};

// ─── Rule registry ────────────────────────────────────────────────────────────

const NUDGE_RULES: NudgeRule[] = [

  // ══ CORE RULES (v1, preserved) ══════════════════════════════════════════════

  {
    type: 'morning_brief', cooldownMs: CD.DAILY, baseScore: 0.72,
    condition: s => s.hour >= 7 && s.hour <= 10 && s.tasksTotal > 0,
    generate:  s => ({
      type: 'morning_brief', priority: 'high', category: 'coach', emoji: '☀️',
      title: 'Morning Brief',
      message: `Good morning. ${s.tasksTotal - s.tasksCompleted} tasks pending${
        s.tasksHighPriority > 0 ? `, including ${s.tasksHighPriority} high-priority` : ''
      }. Let's make today count.`,
      action: { label: 'Plan My Day', route: '/tasks' },
    }),
  },

  {
    type: 'peak_energy', cooldownMs: CD.LONG, baseScore: 0.85,
    condition: s => s.hour >= 9 && s.hour <= 11 && s.energyLevel >= 4 && !s.focusSessionActive && s.tasksHighPriority > 0,
    generate:  s => ({
      type: 'peak_energy', priority: 'high', category: 'suggestion', emoji: '⚡',
      title: behavioralBaseline.isCalibrated ? 'Your Personal Peak Window' : 'Peak Energy Window',
      message: behavioralBaseline.isCalibrated
        ? `Energy at ${s.energyLevel}/5 — above your historical baseline for this time. Best window for hard work today.`
        : `You're in prime focus territory — energy at ${s.energyLevel}/5. Tackle your hardest task before the afternoon dip.`,
      action:          { label: 'Start Focus Session', route: '/focus' },
      isPersonalized:  behavioralBaseline.isCalibrated,
    }),
  },

  {
    type: 'gentle_start', cooldownMs: CD.DAILY, baseScore: 0.65,
    condition: s => s.hour >= 8 && s.hour <= 10 && s.energyLevel <= 2 && s.tasksTotal > 0,
    generate:  s => ({
      type: 'gentle_start', priority: 'medium', category: 'coach', emoji: '🌱',
      title: 'Gentle Start',
      message: `Energy is low (${s.energyLevel}/5). Start with one quick task to build momentum — don't jump into the deep end first.`,
      action: { label: 'Find Quick Win', route: '/tasks' },
    }),
  },

  {
    type: 'task_overdue', cooldownMs: CD.MEDIUM, baseScore: 0.88,
    condition: s => s.tasksOverdue >= 2 && s.hour >= 9 && s.hour <= 20,
    generate:  s => ({
      type: 'task_overdue', priority: 'high', category: 'warning', emoji: '⏰',
      title: `${s.tasksOverdue} Tasks Overdue`,
      message: `Tasks are piling up. Overdue items create mental overhead even when you're not actively thinking about them.`,
      action:        { label: 'Review Now', route: '/tasks' },
      secondaryAction: { label: 'Snooze 1hr' },
    }),
  },

  {
    type: 'idle_warning', cooldownMs: CD.SHORT, baseScore: 0.60,
    condition: s => !s.focusSessionActive && s.lastActivityMs > 45 * 60_000 && s.hour >= 9 && s.hour <= 18 && s.tasksTotal - s.tasksCompleted > 0,
    generate:  () => ({
      type: 'idle_warning', priority: 'medium', category: 'coach', emoji: '👋',
      title: 'Still There?',
      message: `You've been idle for a while. Even 15 focused minutes moves the needle. What's one thing you can knock out right now?`,
      action:        { label: 'Start a Session', route: '/focus' },
      secondaryAction: { label: 'I need a break' },
    }),
  },

  {
    type: 'focus_celebrate', cooldownMs: CD.SHORT, baseScore: 0.55,
    condition: s => s.focusSessionActive && s.focusSessionMinutes >= 45 && s.focusSessionMinutes % 45 < 2,
    generate:  s => ({
      type: 'focus_celebrate', priority: 'low', category: 'celebration', emoji: '🔥',
      title: `${s.focusSessionMinutes} Min Flow State!`,
      message: `You've been in deep focus for ${s.focusSessionMinutes} minutes. Elite-level concentration. Keep it going.`,
    }),
  },

  {
    type: 'break_needed', cooldownMs: CD.SHORT, baseScore: 0.92,
    condition: s => s.focusSessionActive && s.focusSessionMinutes >= 90,
    generate:  s => ({
      type: 'break_needed', priority: 'high', category: 'warning', emoji: '☕',
      title: 'Break Time',
      message: `${s.focusSessionMinutes} minutes deep — your prefrontal cortex is asking for a 10-minute reset. A pause now = better output after.`,
      action:        { label: 'Take a Break' },
      secondaryAction: { label: 'Keep Going' },
    }),
  },

  {
    type: 'afternoon_slump', cooldownMs: CD.DAILY, baseScore: 0.62,
    condition: s => s.hour >= 13 && s.hour <= 15 && s.energyLevel <= 3,
    generate:  () => ({
      type: 'afternoon_slump', priority: 'medium', category: 'suggestion', emoji: '🫠',
      title: 'Post-Lunch Dip Detected',
      message: `Energy typically drops 1–3pm. Route admin tasks here, save creative work for 4pm when it often rebounds.`,
      action: { label: 'View Schedule', route: '/tasks' },
    }),
  },

  {
    type: 'evening_wrap', cooldownMs: CD.DAILY, baseScore: 0.70,
    condition: s => s.hour >= 17 && s.hour <= 19 && s.tasksCompleted > 0,
    generate:  s => ({
      type: 'evening_wrap', priority: 'medium', category: 'coach', emoji: '🌅',
      title: 'End-of-Day Check',
      message: `You completed ${s.tasksCompleted} tasks today with ${s.todayFocusMinutes} focus minutes. Take 3 min to set tomorrow's top 3.`,
      action: { label: 'Plan Tomorrow', route: '/tasks' },
    }),
  },

  {
    type: 'quick_win', cooldownMs: CD.MEDIUM, baseScore: 0.65,
    condition: s => !s.focusSessionActive && s.hour >= 10 && s.hour <= 16 && s.tasksTotal - s.tasksCompleted > 0 && s.todayFocusMinutes === 0,
    generate:  () => ({
      type: 'quick_win', priority: 'medium', category: 'suggestion', emoji: '🎯',
      title: 'No Focus Time Yet',
      message: `The day is moving. Try the 2-minute rule — pick one task and just start. Starting is the hardest part.`,
      action: { label: 'Pick a Task', route: '/tasks' },
    }),
  },

  {
    type: 'streak_at_risk', cooldownMs: CD.DAILY, baseScore: 0.80,
    condition: s => s.streakDays >= 3 && s.hour >= 15 && s.hour <= 22 && s.todayFocusMinutes === 0,
    generate:  s => ({
      type: 'streak_at_risk', priority: 'high', category: 'warning', emoji: '⚠️',
      title: `${s.streakDays}-Day Streak at Risk`,
      message: `No focus time today and your ${s.streakDays}-day streak is on the line. Even 10 minutes counts.`,
      action: { label: 'Save My Streak', route: '/focus' },
    }),
  },

  {
    type: 'momentum_boost', cooldownMs: CD.SHORT, baseScore: 0.58,
    condition: s => s.tasksCompleted >= 3 && s.tasksCompleted % 3 === 0 && !s.focusSessionActive,
    generate:  s => ({
      type: 'momentum_boost', priority: 'low', category: 'celebration', emoji: '🚀',
      title: `${s.tasksCompleted} Tasks Done!`,
      message: `You're in a rhythm. Consider tackling one more before switching contexts.`,
      action: { label: 'Keep Going', route: '/tasks' },
    }),
  },

  {
    type: 'reentry', cooldownMs: CD.MEDIUM, baseScore: 0.68,
    condition: s => s.lastActivityMs > 2 * 60 * 60_000 && s.hour >= 9 && s.hour <= 20,
    generate:  () => ({
      type: 'reentry', priority: 'medium', category: 'coach', emoji: '🧭',
      title: 'Welcome Back',
      message: `You've been away for a bit. Take 60 seconds to orient — review your top priority and pick one task to start.`,
      action: { label: 'Review Tasks', route: '/tasks' },
    }),
  },

  // ══ INTELLIGENCE LAYER RULES (v2) ═══════════════════════════════════════════
  // These rules use the predictive engines for forward-looking, personalized nudges.

  {
    type: 'deadline_risk', cooldownMs: CD.MEDIUM, baseScore: 0.93,
    condition: s => {
      if (!s.tasks || s.tasks.length === 0) return false;
      const risk = predictiveRisk.assess(s.tasks, {
        tasksPerDay:      Math.max(s.tasksCompleted, 1),
        focusHoursPerDay: Math.max(s.todayFocusMinutes / 60, 1.5),
      });
      return risk.deadlineRisks.some(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
    },
    generate: s => {
      const risk = predictiveRisk.assess(s.tasks ?? [], {
        tasksPerDay:      Math.max(s.tasksCompleted, 1),
        focusHoursPerDay: Math.max(s.todayFocusMinutes / 60, 1.5),
      });
      const top = risk.deadlineRisks[0];
      return {
        type: 'deadline_risk',
        priority: top.riskLevel === 'critical' ? 'critical' : 'high',
        category: 'warning', emoji: '📅',
        title:   top.riskLevel === 'critical' ? 'Deadline Missed' : 'Deadline at Risk',
        message: top.reason,
        action:  { label: 'Review Task', route: '/tasks' },
        isPersonalized: true,
        context: { taskId: top.taskId, riskScore: top.riskScore },
      };
    },
  },

  {
    type: 'procrastination_detected', cooldownMs: CD.LONG, baseScore: 0.78,
    condition: s => {
      if (!s.tasks || s.tasks.length === 0) return false;
      const risk = predictiveRisk.assess(s.tasks, {
        tasksPerDay:      Math.max(s.tasksCompleted, 1),
        focusHoursPerDay: Math.max(s.todayFocusMinutes / 60, 1.5),
      });
      return risk.procrastinations.length > 0;
    },
    generate: s => {
      const risk = predictiveRisk.assess(s.tasks ?? [], {
        tasksPerDay:      Math.max(s.tasksCompleted, 1),
        focusHoursPerDay: Math.max(s.todayFocusMinutes / 60, 1.5),
      });
      const top = risk.procrastinations[0];
      return {
        type: 'procrastination_detected', priority: 'medium',
        category: 'coach', emoji: '🔍',
        title:   'Avoidance Pattern Detected',
        message: top.message,
        action:  { label: 'Start This Task', route: '/tasks' },
        isPersonalized: true,
        context: { taskId: top.taskId, daysStale: top.daysStale, pattern: top.pattern },
      };
    },
  },

  {
    type: 'workload_infeasible', cooldownMs: CD.DAILY, baseScore: 0.88,
    condition: s => {
      if (!s.tasks || s.tasks.length === 0) return false;
      const wl = predictiveRisk.assess(s.tasks, {
        tasksPerDay:      Math.max(s.tasksCompleted, 1),
        focusHoursPerDay: Math.max(s.todayFocusMinutes / 60, 1.5),
      }).workload;
      return !wl.feasible && wl.confidence >= 0.4;
    },
    generate: s => {
      const wl = predictiveRisk.assess(s.tasks ?? [], {
        tasksPerDay:      Math.max(s.tasksCompleted, 1),
        focusHoursPerDay: Math.max(s.todayFocusMinutes / 60, 1.5),
      }).workload;
      return {
        type: 'workload_infeasible', priority: 'high',
        category: 'warning', emoji: '⚖️',
        title:   'Week is Overloaded',
        message: wl.recommendation,
        action:  { label: 'Triage Tasks', route: '/tasks' },
        isPersonalized: true,
        context: { overloadHours: wl.overloadHours, totalHours: wl.totalEstimatedHours },
      };
    },
  },

  {
    type: 'anomaly_detected', cooldownMs: CD.LONG, baseScore: 0.75,
    condition: s => {
      if (!behavioralBaseline.isCalibrated) return false;
      const r = behavioralBaseline.detectEnergyAnomaly(s.energyLevel, s.hour, s.dayOfWeek);
      return r.isAnomaly && r.direction === 'above' && r.severity > 0.45;
    },
    generate: s => {
      const r = behavioralBaseline.detectEnergyAnomaly(s.energyLevel, s.hour, s.dayOfWeek);
      return {
        type: 'anomaly_detected', priority: 'medium',
        category: 'suggestion', emoji: '📊',
        title:   'Above Your Baseline Right Now',
        message: r.message + ` Don't waste this window on low-impact work.`,
        action:  { label: 'Start Deep Work', route: '/focus' },
        isPersonalized: true,
        context: { severity: r.severity, expected: r.expected, actual: r.actual },
      };
    },
  },

  {
    type: 'velocity_warning', cooldownMs: CD.LONG, baseScore: 0.70,
    condition: s => {
      if (!behavioralBaseline.isCalibrated) return false;
      const hoursElapsed = Math.max(s.hour - 9, 0);
      return hoursElapsed >= 2 && behavioralBaseline.isVelocityBehind(s.todayFocusMinutes, hoursElapsed);
    },
    generate: s => {
      const hoursElapsed = Math.max(s.hour - 9, 0);
      return {
        type: 'velocity_warning', priority: 'medium',
        category: 'coach', emoji: '📉',
        title:   'Behind Your Usual Pace',
        message: `You're tracking below your typical focus output for this time of day. Not a judgment — just data. Even a 20-minute session puts you back on track.`,
        action:  { label: 'Start Session', route: '/focus' },
        isPersonalized: true,
        context: { hoursElapsed, todayFocusMinutes: s.todayFocusMinutes },
      };
    },
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

class ProactiveAIService {
  private activeInsights:  ProactiveInsight[]  = [];
  private lastNudgeTimes:  Record<string, number> = {};
  private listeners:       Array<(i: ProactiveInsight) => void> = [];
  private intervalId:      ReturnType<typeof setInterval> | null = null;
  private pendingOutcomes: Map<string, { type: ProactiveNudgeType; cogState: string }> = new Map();

  constructor() { this.loadState(); }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private loadState() {
    try {
      const s = localStorage.getItem('kaal_proactive_ai_state');
      if (s) { const { lastNudgeTimes } = JSON.parse(s); this.lastNudgeTimes = lastNudgeTimes || {}; }
    } catch {}
  }

  private saveState() {
    try {
      localStorage.setItem('kaal_proactive_ai_state', JSON.stringify({ lastNudgeTimes: this.lastNudgeTimes }));
    } catch {}
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  start(getSignals: () => BehaviorSignals | EnrichedBehaviorSignals) {
    if (this.intervalId) return;
    const run = () => this.evaluate(getSignals());
    run();
    this.intervalId = setInterval(run, 60_000);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  triggerEvaluation(signals: BehaviorSignals | EnrichedBehaviorSignals) {
    this.evaluate(signals);
  }

  // ── Intelligence-driven evaluation ───────────────────────────────────────────

  private evaluate(signals: BehaviorSignals | EnrichedBehaviorSignals) {
    const now = Date.now();
    const s   = signals as EnrichedBehaviorSignals;

    // ── 1. Estimate cognitive state ────────────────────────────────────────────
    const cogResult = cognitiveStateEstimator.estimate({
      hour:                s.hour,
      focusSessionActive:  s.focusSessionActive,
      focusSessionMinutes: s.focusSessionMinutes,
      todayFocusMinutes:   s.todayFocusMinutes,
      energyLevel:         s.energyLevel,
      tasksTotal:          s.tasksTotal,
      tasksCompleted:      s.tasksCompleted,
      tasksOverdue:        s.tasksOverdue,
      lastActivityMs:      s.lastActivityMs,
      recentSessionEnded:  s.recentSessionEnded ?? false,
      tasksCreatedToday:   s.tasksCreatedToday,
      weeklyCompletionRate: s.weeklyCompletionRate,
    });

    // ── 2. Score every qualifying rule ─────────────────────────────────────────
    const scored: Array<{ rule: NudgeRule; score: number }> = [];

    for (const rule of NUDGE_RULES) {
      // Cooldown check
      if (now - (this.lastNudgeTimes[rule.type] || 0) < rule.cooldownMs) continue;

      // Already showing this type
      if (this.activeInsights.some(i => i.type === rule.type && !i.dismissed)) continue;

      // Condition check
      if (!rule.condition(s)) continue;

      // Cognitive state gate — some nudges are counterproductive in certain states
      if (cogResult.blockedNudges.includes(rule.type)) continue;

      // Global receptivity gate — very low receptivity blocks everything non-critical
      if (cogResult.receptivity < 0.25 && rule.baseScore < 0.88) continue;

      // Fatigue gate — skip nudge types the user consistently ignores
      if (interventionIntelligence.isFatigued(rule.type)) continue;

      // Compute final score
      const profile      = interventionIntelligence.getProfile(rule.type);
      const effectAdjust = profile.sampleCount >= 3 ? (profile.actRate - 0.5) * 0.28 : 0;
      const personBoost  = (rule.type === 'deadline_risk' || rule.type === 'procrastination_detected' ||
                            rule.type === 'workload_infeasible' || rule.type === 'anomaly_detected' ||
                            rule.type === 'velocity_warning') ? 0.06 : 0;
      const receptBoost  = (cogResult.receptivity - 0.5) * 0.10; // +/- 0.05
      const finalScore   = Math.min(rule.baseScore + effectAdjust + personBoost + receptBoost, 1);

      scored.push({ rule, score: finalScore });
    }

    if (scored.length === 0) return;

    // ── 3. Pick highest-scoring rule ──────────────────────────────────────────
    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0];

    // Only fire if the score clears the minimum threshold
    if (winner.score < 0.38) return;

    // ── 4. Generate and emit ──────────────────────────────────────────────────
    const partial  = winner.rule.generate(s);
    const insight: ProactiveInsight = {
      ...partial,
      id:               `${winner.rule.type}-${now}`,
      timestamp:        now,
      dismissed:        false,
      intelligenceScore: winner.score,
      cognitiveState:   cogResult.state,
    };

    this.activeInsights               = [insight, ...this.activeInsights].slice(0, 8);
    this.lastNudgeTimes[winner.rule.type] = now;
    this.pendingOutcomes.set(insight.id, { type: insight.type, cogState: cogResult.state });
    this.saveState();
    this.emit(insight);
  }

  // ── Outcome tracking (closes the feedback loop) ───────────────────────────────

  /** Call when user clicks the primary action button */
  recordAction(id: string) {
    const meta = this.pendingOutcomes.get(id);
    if (meta) {
      interventionIntelligence.recordOutcome(id, meta.type, 'acted', meta.cogState);
      this.pendingOutcomes.delete(id);
    }
    // Record a reading for behavioral baseline if energy info is available
  }

  dismiss(id: string) {
    this.activeInsights = this.activeInsights.map(i => i.id === id ? { ...i, dismissed: true } : i);
    const meta = this.pendingOutcomes.get(id);
    if (meta) {
      interventionIntelligence.recordOutcome(id, meta.type, 'dismissed', meta.cogState);
      this.pendingOutcomes.delete(id);
    }
    this.saveState();
  }

  snooze(id: string, ms = 60 * 60_000) {
    const insight = this.activeInsights.find(i => i.id === id);
    if (insight) { insight.snoozedUntil = Date.now() + ms; insight.dismissed = true; }
    const meta = this.pendingOutcomes.get(id);
    if (meta) {
      interventionIntelligence.recordOutcome(id, meta.type, 'snoozed', meta.cogState);
      this.pendingOutcomes.delete(id);
    }
  }

  /** Feed an energy reading into the behavioral baseline engine */
  recordEnergyReading(energy: number, focusMinutes: number, tasksCompleted: number) {
    const now = new Date();
    behavioralBaseline.recordReading({
      hour:           now.getHours(),
      dayOfWeek:      now.getDay(),
      energy,
      focusMinutes,
      tasksCompleted,
    });
  }

  // ── Query ────────────────────────────────────────────────────────────────────

  getActive(): ProactiveInsight[] {
    return this.activeInsights.filter(i => !i.dismissed);
  }

  getAllHistory(): ProactiveInsight[] {
    return [...this.activeInsights];
  }

  onInsight(cb: (insight: ProactiveInsight) => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private emit(i: ProactiveInsight) { this.listeners.forEach(l => l(i)); }

  pushInsight(partial: Omit<ProactiveInsight, 'id' | 'timestamp' | 'dismissed'>): ProactiveInsight {
    const insight: ProactiveInsight = {
      ...partial,
      id:        `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      dismissed: false,
    };
    this.activeInsights = [insight, ...this.activeInsights].slice(0, 8);
    this.emit(insight);
    return insight;
  }

  clearAll() { this.activeInsights = []; }
}

export const proactiveAI = new ProactiveAIService();
