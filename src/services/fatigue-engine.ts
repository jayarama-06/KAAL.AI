/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAAL Fatigue Engine                                         ║
 * ║                                                              ║
 * ║  Tracks continuous work time, computes exhaustion, and       ║
 * ║  manages the break ↔ re-engagement protocol.                 ║
 * ║                                                              ║
 * ║  Philosophy: The agent's job is not to maximize output.      ║
 * ║  It's to sustain the human. A well-timed break produces      ║
 * ║  more than grinding through fatigue.                         ║
 * ║                                                              ║
 * ║  Fatigue model:                                              ║
 * ║    • Continuous work time (resets after break)               ║
 * ║    • Total cognitive work today (energy loans from sleep)    ║
 * ║    • Task completion velocity (high speed = burning fast)    ║
 * ║    • Explicit energy log from user                           ║
 * ║    • Time-of-day circadian modifier                          ║
 * ║                                                              ║
 * ║  Thresholds:                                                 ║
 * ║    45 min  → Gentle heads-up                                 ║
 * ║    75 min  → Strong suggestion                               ║
 * ║    90 min  → Proactive intervention (fire to agent)          ║
 * ║    120 min → Critical — KAAL actively pauses suggestions     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export type FatigueLevel = 'fresh' | 'warming' | 'tired' | 'exhausted' | 'critical';
export type SessionPhase = 'working' | 'break' | 'reengaging' | 'idle';

export interface FatigueState {
  phase: SessionPhase;
  continuousWorkMin: number;   // minutes since last break
  totalWorkTodayMin: number;   // total cognitive minutes today
  fatigueLevel: FatigueLevel;
  fatigueScore: number;        // 0-100
  breaksTakenToday: number;
  lastBreakAt: number | null;  // timestamp
  sessionStartAt: number;      // timestamp
  breakStartAt: number | null; // timestamp
  plannedBreakMin: number;     // recommended break duration
  nextCheckAt: number;         // timestamp for next evaluation
  interventionFired: FatigueLevel | null; // last level we fired an intervention for (avoid spam)
  tasksCompletedThisSession: number;
  /** KAAL's empathetic message for current state */
  message: string;
  /** Recommended action */
  recommendation: 'keep_going' | 'heads_up' | 'take_break' | 'force_break' | 'rest';
}

export interface FatigueIntervention {
  level: FatigueLevel;
  title: string;
  message: string;
  breakMinutes: number;
  reengageMessage: string;
}

// ─── Intervention templates ───────────────────────────────────────────────────

const INTERVENTIONS: Record<Exclude<FatigueLevel, 'fresh' | 'warming'>, FatigueIntervention> = {
  tired: {
    level: 'tired',
    title: "You've been at it a while.",
    message: "You've been working continuously for over 75 minutes. Focus quality starts declining around this point — not because you're failing, but because that's how human cognition works. A 10-minute break now preserves the next 2 hours.",
    breakMinutes: 10,
    reengageMessage: "Break done. Your cognitive slate is cleaner now. I've broken down your next task into a starting step — it's smaller than you think.",
  },
  exhausted: {
    level: 'exhausted',
    title: "You need a break. I'm serious.",
    message: "You've been working for 90+ minutes straight, and I can see the task completion rate has slowed. This is your brain conserving resources — it's not laziness. A proper 15-minute break (away from screens) will restore more than continuing right now.",
    breakMinutes: 15,
    reengageMessage: "Welcome back. You rested — that was the right call. Let's start with the smallest possible step on your next task. Momentum builds fast.",
  },
  critical: {
    level: 'critical',
    title: "KAAL is pausing new suggestions.",
    message: "You've worked 2+ hours without a real break. I'm not going to give you more tasks right now — that would be counterproductive. Please step away for 20 minutes. Get water, move your body. When you return, I'll have everything ready for you.",
    breakMinutes: 20,
    reengageMessage: "You did the right thing. Here's what I've prepared while you were away: I've reprioritised your remaining tasks based on what will have the highest impact in the time you have left today.",
  },
};

// ─── Break duration guidelines ─────────────────────────────────────────────────

function recommendedBreakMinutes(continuousWorkMin: number, totalTodayMin: number): number {
  if (continuousWorkMin >= 120) return 20;
  if (continuousWorkMin >= 90)  return 15;
  if (continuousWorkMin >= 75)  return 10;
  if (continuousWorkMin >= 45)  return 5;
  return 5;
}

// ─── Fatigue messages by state ────────────────────────────────────────────────

const FRESH_MESSAGES = [
  "You're fresh — this is the time to tackle hard things.",
  "Good cognitive capacity right now. Use it on what matters.",
  "Energy is available. Deep work window is open.",
];
const WARMING_MESSAGES = [
  "Still in good shape — keep going.",
  "Building momentum. You're in the zone.",
  "Steady pace. Keep the rhythm.",
];

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY = 'kaal_fatigue_state';

function load(): Partial<FatigueState> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function persist(state: FatigueState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

// ─── Fatigue Engine class ─────────────────────────────────────────────────────

class FatigueEngine {
  private _state: FatigueState;
  private _listeners: Array<(state: FatigueState, intervention?: FatigueIntervention) => void> = [];
  private _timer: number | null = null;

  constructor() {
    const saved = load();
    const now = Date.now();
    // If more than 4 hours since last save, reset session
    const stale = !saved.sessionStartAt || (now - saved.sessionStartAt) > 4 * 60 * 60 * 1000;

    this._state = stale ? this._freshState() : {
      phase: saved.phase ?? 'working',
      continuousWorkMin: saved.continuousWorkMin ?? 0,
      totalWorkTodayMin: saved.totalWorkTodayMin ?? 0,
      fatigueLevel: saved.fatigueLevel ?? 'fresh',
      fatigueScore: saved.fatigueScore ?? 0,
      breaksTakenToday: saved.breaksTakenToday ?? 0,
      lastBreakAt: saved.lastBreakAt ?? null,
      sessionStartAt: saved.sessionStartAt ?? now,
      breakStartAt: saved.breakStartAt ?? null,
      plannedBreakMin: saved.plannedBreakMin ?? 10,
      nextCheckAt: saved.nextCheckAt ?? now + 5 * 60 * 1000,
      interventionFired: saved.interventionFired ?? null,
      tasksCompletedThisSession: saved.tasksCompletedThisSession ?? 0,
      message: saved.message ?? FRESH_MESSAGES[0],
      recommendation: saved.recommendation ?? 'keep_going',
    };
  }

  private _freshState(): FatigueState {
    const now = Date.now();
    return {
      phase: 'working',
      continuousWorkMin: 0,
      totalWorkTodayMin: 0,
      fatigueLevel: 'fresh',
      fatigueScore: 0,
      breaksTakenToday: 0,
      lastBreakAt: null,
      sessionStartAt: now,
      breakStartAt: null,
      plannedBreakMin: 10,
      nextCheckAt: now + 5 * 60 * 1000,
      interventionFired: null,
      tasksCompletedThisSession: 0,
      message: FRESH_MESSAGES[Math.floor(Math.random() * FRESH_MESSAGES.length)],
      recommendation: 'keep_going',
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  get state(): FatigueState { return this._state; }

  /** Subscribe to state changes and interventions */
  subscribe(fn: (state: FatigueState, intervention?: FatigueIntervention) => void) {
    this._listeners.push(fn);
    fn(this._state, undefined);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  /** Start the background tick */
  start() {
    this._tick();
    this._timer = window.setInterval(() => this._tick(), 30_000); // every 30 seconds
  }

  stop() {
    if (this._timer) window.clearInterval(this._timer);
  }

  /** Call when user starts a break */
  startBreak(durationMin?: number) {
    const planned = durationMin ?? this._state.plannedBreakMin;
    this._state = {
      ...this._state,
      phase: 'break',
      breakStartAt: Date.now(),
      plannedBreakMin: planned,
    };
    persist(this._state);
    this._notify();

    // Auto end break
    window.setTimeout(() => this.endBreak(), planned * 60 * 1000);
  }

  /** Call when break ends (auto or manual) */
  endBreak() {
    if (this._state.phase !== 'break') return;
    const now = Date.now();
    const actualBreakMin = this._state.breakStartAt
      ? Math.round((now - this._state.breakStartAt) / 60000)
      : this._state.plannedBreakMin;

    // How much fatigue does this break recover?
    const recovery = Math.min(this._state.fatigueScore, actualBreakMin * 2.5);

    this._state = {
      ...this._state,
      phase: 'reengaging',
      continuousWorkMin: 0,  // Reset continuous timer
      fatigueScore: Math.max(0, this._state.fatigueScore - recovery),
      fatigueLevel: 'fresh',
      breaksTakenToday: this._state.breaksTakenToday + 1,
      lastBreakAt: now,
      breakStartAt: null,
      interventionFired: null,
      tasksCompletedThisSession: 0,
      message: "Break complete. You're ready to re-enter.",
      recommendation: 'keep_going',
    };
    persist(this._state);
    this._notify();

    // Move from re-engaging to working after 30s
    window.setTimeout(() => {
      if (this._state.phase === 'reengaging') {
        this._state = { ...this._state, phase: 'working' };
        persist(this._state);
        this._notify();
      }
    }, 30_000);
  }

  /** Call whenever a task is completed */
  recordTaskCompletion() {
    this._state = {
      ...this._state,
      tasksCompletedThisSession: this._state.tasksCompletedThisSession + 1,
    };
    persist(this._state);
    this._tick(); // Re-evaluate immediately
  }

  /** Get the right intervention for current state (or null) */
  getIntervention(): FatigueIntervention | null {
    if (this._state.fatigueLevel === 'fresh' || this._state.fatigueLevel === 'warming') return null;
    return INTERVENTIONS[this._state.fatigueLevel as 'tired' | 'exhausted' | 'critical'] ?? null;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _tick() {
    if (this._state.phase === 'break') return; // Don't accumulate during break

    const now = Date.now();
    const sessionAgeMin = (now - this._state.sessionStartAt) / 60000;
    const continuousMin = this._state.continuousWorkMin + 0.5; // +30s per tick
    const totalMin = this._state.totalWorkTodayMin + 0.5;

    // Fatigue score calculation
    const continuousScore  = Math.min(50, (continuousMin / 120) * 50);     // 0-50 from continuous time
    const totalScore       = Math.min(30, (totalMin / 360) * 30);           // 0-30 from total today (6h cap)
    const velocityPenalty  = this._state.tasksCompletedThisSession > 5 ? 10 : 0; // burning through tasks fast
    const hourPenalty      = this._circadianPenalty(new Date().getHours());
    const fatigueScore     = Math.min(100, continuousScore + totalScore + velocityPenalty + hourPenalty);

    const fatigueLevel: FatigueLevel =
      fatigueScore >= 80 ? 'critical'  :
      fatigueScore >= 60 ? 'exhausted' :
      fatigueScore >= 40 ? 'tired'     :
      fatigueScore >= 20 ? 'warming'   : 'fresh';

    const recommendation =
      fatigueScore >= 80 ? 'force_break'  :
      fatigueScore >= 60 ? 'take_break'   :
      fatigueScore >= 40 ? 'heads_up'     :
      fatigueScore >= 20 ? 'keep_going'   : 'keep_going';

    const message =
      fatigueLevel === 'fresh'    ? FRESH_MESSAGES[Math.floor(Math.random() * FRESH_MESSAGES.length)] :
      fatigueLevel === 'warming'  ? WARMING_MESSAGES[Math.floor(Math.random() * WARMING_MESSAGES.length)] :
      fatigueLevel === 'tired'    ? `Working ${Math.round(continuousMin)} min straight. Consider a 10-min break.` :
      fatigueLevel === 'exhausted'? `${Math.round(continuousMin)} min continuous. Quality degrades here — rest now.` :
                                    `${Math.round(continuousMin)} min without a break. I'm pausing suggestions until you rest.`;

    const prevLevel = this._state.fatigueLevel;
    const shouldFire = fatigueLevel !== 'fresh' && fatigueLevel !== 'warming'
      && fatigueLevel !== this._state.interventionFired
      && fatigueLevel !== prevLevel;

    this._state = {
      ...this._state,
      continuousWorkMin: continuousMin,
      totalWorkTodayMin: totalMin,
      fatigueScore,
      fatigueLevel,
      plannedBreakMin: recommendedBreakMinutes(continuousMin, totalMin),
      recommendation,
      message,
      nextCheckAt: now + 30_000,
      interventionFired: shouldFire ? fatigueLevel : this._state.interventionFired,
    };

    persist(this._state);

    if (shouldFire) {
      const intervention = INTERVENTIONS[fatigueLevel as 'tired' | 'exhausted' | 'critical'];
      this._notify(intervention);
    } else {
      this._notify();
    }
  }

  private _circadianPenalty(hour: number): number {
    // Post-lunch dip and late evening
    if (hour >= 13 && hour <= 15) return 8;
    if (hour >= 21) return 12;
    if (hour < 7) return 15;
    return 0;
  }

  private _notify(intervention?: FatigueIntervention) {
    this._listeners.forEach(fn => fn(this._state, intervention));
  }
}

export const fatigueEngine = new FatigueEngine();
