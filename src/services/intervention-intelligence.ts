/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  KAAL Intervention Intelligence                           ║
 * ║                                                           ║
 * ║  Learns WHAT works for THIS user over time.              ║
 * ║                                                           ║
 * ║  Every nudge outcome is recorded:                         ║
 * ║   acted    → user took the action  (+strong signal)       ║
 * ║   snoozed  → not ready, not rejected (neutral)            ║
 * ║   dismissed → ignored              (–negative signal)     ║
 * ║   expired  → never seen            (mild negative)        ║
 * ║                                                           ║
 * ║  Over time: stop firing nudges that never work.           ║
 * ║  Double down on the ones that consistently do.            ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const OUTCOMES_KEY = 'kaal_nudge_outcomes_v2';
const MAX_OUTCOMES = 600;

// ─── Types ────────────────────────────────────────────────────────────────────

export type NudgeOutcome = 'acted' | 'snoozed' | 'dismissed' | 'expired';

export interface NudgeRecord {
  type:      string;    // ProactiveNudgeType as string to avoid circular dep
  outcome:   NudgeOutcome;
  hour:      number;
  dayOfWeek: number;
  cogState:  string;
  timestamp: number;
}

export interface EffectivenessProfile {
  type:        string;
  actRate:     number;   // 0–1 — proportion resulting in action
  dismissRate: number;   // 0–1
  fatigued:    boolean;  // 3+ dismissals in last 5 firings
  sampleCount: number;
  bestHours:   number[]; // hours with highest act rates
  trending:    'up' | 'down' | 'stable'; // recent vs. older performance
}

// ─── Service ──────────────────────────────────────────────────────────────────

class InterventionIntelligence {
  private outcomes: NudgeRecord[] = [];

  constructor() { this.load(); }

  private load() {
    try {
      const s = localStorage.getItem(OUTCOMES_KEY);
      if (s) this.outcomes = JSON.parse(s);
    } catch {}
  }

  private save() {
    try {
      localStorage.setItem(OUTCOMES_KEY, JSON.stringify(this.outcomes.slice(-MAX_OUTCOMES)));
    } catch {}
  }

  // ── Recording ────────────────────────────────────────────────────────────────

  recordOutcome(nudgeId: string, type: string, outcome: NudgeOutcome, cogState: string) {
    const now = new Date();
    this.outcomes.push({
      type, outcome, cogState,
      hour:      now.getHours(),
      dayOfWeek: now.getDay(),
      timestamp: Date.now(),
    });
    this.save();
  }

  // ── Analysis ─────────────────────────────────────────────────────────────────

  getProfile(type: string): EffectivenessProfile {
    const all = this.outcomes.filter(o => o.type === type);

    // No data: return neutral defaults (0.5 act rate — don't penalize new nudge types)
    if (all.length === 0) {
      return { type, actRate: 0.5, dismissRate: 0.3, fatigued: false,
               sampleCount: 0, bestHours: [], trending: 'stable' };
    }

    const acted     = all.filter(o => o.outcome === 'acted').length;
    const dismissed = all.filter(o => o.outcome === 'dismissed').length;
    const actRate     = acted / all.length;
    const dismissRate = dismissed / all.length;

    // Fatigue: 3+ dismissals in last 5 fires → back off
    const last5    = all.slice(-5);
    const fatigued = last5.filter(o => o.outcome === 'dismissed').length >= 3;

    // Best hours: where act rate exceeds average
    const byHour: Record<number, { act: number; total: number }> = {};
    for (const r of all) {
      byHour[r.hour] ??= { act: 0, total: 0 };
      byHour[r.hour].total++;
      if (r.outcome === 'acted') byHour[r.hour].act++;
    }
    const bestHours = Object.entries(byHour)
      .map(([h, s]) => ({ hour: +h, rate: s.act / s.total }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(x => x.hour);

    // Trending: compare first half vs. second half act rates
    const mid    = Math.floor(all.length / 2);
    const older  = all.slice(0, mid);
    const recent = all.slice(mid);
    const olderRate  = older.length  ? older.filter(o => o.outcome === 'acted').length / older.length   : 0.5;
    const recentRate = recent.length ? recent.filter(o => o.outcome === 'acted').length / recent.length : 0.5;
    const trending: EffectivenessProfile['trending'] =
      recentRate > olderRate + 0.1 ? 'up'   :
      recentRate < olderRate - 0.1 ? 'down' : 'stable';

    return { type, actRate, dismissRate, fatigued, sampleCount: all.length, bestHours, trending };
  }

  /** Is this nudge type fatigued for this user right now? */
  isFatigued(type: string): boolean {
    if (this.outcomes.filter(o => o.type === type).length < 3) return false;
    return this.getProfile(type).fatigued;
  }

  /**
   * Select the single best intervention from a candidate list.
   * Filters out fatigued types. Returns null if all are fatigued.
   */
  selectBest(candidates: string[], currentHour: number): string | null {
    const scored = candidates
      .filter(t => !this.isFatigued(t))
      .map(type => {
        const p = this.getProfile(type);
        const hourBoost = p.bestHours.includes(currentHour) ? 0.12 : 0;
        // Score = weighted effectiveness
        const score = (p.actRate * 0.65 + (1 - p.dismissRate) * 0.35) + hourBoost;
        return { type, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored.length > 0 ? scored[0].type : null;
  }

  /** All profiles, sorted by effectiveness */
  getAllProfiles(): EffectivenessProfile[] {
    const types = [...new Set(this.outcomes.map(o => o.type))];
    return types.map(t => this.getProfile(t)).sort((a, b) => b.actRate - a.actRate);
  }

  get recordCount() { return this.outcomes.length; }
}

export const interventionIntelligence = new InterventionIntelligence();
