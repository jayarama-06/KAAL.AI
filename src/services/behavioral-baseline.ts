/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  KAAL Behavioral Baseline Engine                          ║
 * ║                                                           ║
 * ║  Learns each user's personal rhythm over 30 days:         ║
 * ║  ─ Circadian energy map: avg energy by day × hour         ║
 * ║  ─ Productivity velocity: tasks + focus minutes/day       ║
 * ║  ─ Anomaly detection: today vs personal baseline          ║
 * ║  ─ Energy curve prediction at session start               ║
 * ║                                                           ║
 * ║  Every user has a different peak. This engine learns it.  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const RHYTHM_KEY   = 'kaal_rhythm_v2';
const READINGS_KEY = 'kaal_readings_v2';
const MAX_READINGS = 1000;
const WINDOW_DAYS  = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnergyReading {
  hour:           number;   // 0–23
  dayOfWeek:      number;   // 0=Sun … 6=Sat
  energy:         number;   // 1–5
  focusMinutes:   number;
  tasksCompleted: number;
  timestamp:      number;
}

export interface HourlyBaseline {
  avgEnergy:   number;
  avgFocus:    number;
  avgTasks:    number;
  sampleCount: number;
  confidence:  number;  // 0–1 (saturates at 10 samples)
}

export interface PersonalRhythm {
  /** [dayOfWeek 0-6][hour 0-23] → baseline */
  matrix:             Record<number, Record<number, HourlyBaseline>>;
  peakHours:          number[];  // top 3 hours by avg energy (learned)
  troughHours:        number[];  // bottom 3 hours
  typicalDailyFocus:  number;   // minutes/day rolling avg
  typicalDailyTasks:  number;
  focusHistory30d:    number[];  // newest first
  taskHistory30d:     number[];
  lastRecomputed:     number;
  totalReadings:      number;
}

export interface AnomalyReport {
  isAnomaly:  boolean;
  direction:  'below' | 'above' | 'normal';
  severity:   number;  // 0–1
  message:    string;
  expected:   number;
  actual:     number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

class BehavioralBaselineEngine {
  private rhythm:   PersonalRhythm;
  private readings: EnergyReading[];

  constructor() {
    this.readings = this.loadReadings();
    this.rhythm   = this.loadRhythm();
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private loadRhythm(): PersonalRhythm {
    try {
      const s = localStorage.getItem(RHYTHM_KEY);
      return s ? JSON.parse(s) : this.defaultRhythm();
    } catch { return this.defaultRhythm(); }
  }

  private loadReadings(): EnergyReading[] {
    try {
      const s = localStorage.getItem(READINGS_KEY);
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  }

  private save() {
    try {
      localStorage.setItem(RHYTHM_KEY,   JSON.stringify(this.rhythm));
      localStorage.setItem(READINGS_KEY, JSON.stringify(this.readings.slice(-MAX_READINGS)));
    } catch {}
  }

  private defaultRhythm(): PersonalRhythm {
    return {
      matrix:            {},
      peakHours:         [9, 10, 11],   // sensible defaults before data
      troughHours:       [13, 14, 22],
      typicalDailyFocus: 120,
      typicalDailyTasks: 5,
      focusHistory30d:   [],
      taskHistory30d:    [],
      lastRecomputed:    0,
      totalReadings:     0,
    };
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /** Call whenever the user logs energy or ends a focus session */
  recordReading(r: Omit<EnergyReading, 'timestamp'>) {
    this.readings.push({ ...r, timestamp: Date.now() });
    this.recompute();
    this.save();
  }

  /** Call once per day with yesterday's productivity totals */
  recordDaySummary(focusMinutes: number, tasksCompleted: number) {
    this.rhythm.focusHistory30d = [focusMinutes, ...this.rhythm.focusHistory30d].slice(0, 30);
    this.rhythm.taskHistory30d  = [tasksCompleted, ...this.rhythm.taskHistory30d].slice(0, 30);
    if (this.rhythm.focusHistory30d.length >= 5) {
      this.rhythm.typicalDailyFocus = mean(this.rhythm.focusHistory30d);
    }
    if (this.rhythm.taskHistory30d.length >= 5) {
      this.rhythm.typicalDailyTasks = mean(this.rhythm.taskHistory30d);
    }
    this.save();
  }

  /**
   * Baseline for a specific hour × day-of-week.
   * Falls back to cross-day average when per-day data is thin.
   */
  getBaseline(hour: number, dayOfWeek: number): HourlyBaseline | null {
    const specific = this.rhythm.matrix[dayOfWeek]?.[hour];
    if (specific && specific.confidence >= 0.3) return specific;

    // cross-day fallback
    const all = [0,1,2,3,4,5,6]
      .map(d => this.rhythm.matrix[d]?.[hour])
      .filter(Boolean) as HourlyBaseline[];
    if (all.length === 0) return null;

    return {
      avgEnergy:   mean(all.map(b => b.avgEnergy)),
      avgFocus:    mean(all.map(b => b.avgFocus)),
      avgTasks:    mean(all.map(b => b.avgTasks)),
      sampleCount: all.reduce((s, b) => s + b.sampleCount, 0),
      confidence:  mean(all.map(b => b.confidence)) * 0.6,
    };
  }

  /** Detect if current energy significantly deviates from personal baseline */
  detectEnergyAnomaly(energy: number, hour: number, dayOfWeek: number): AnomalyReport {
    const b = this.getBaseline(hour, dayOfWeek);
    if (!b || b.confidence < 0.25) {
      return { isAnomaly: false, direction: 'normal', severity: 0,
               message: 'Still building your personal baseline...', expected: energy, actual: energy };
    }

    const delta     = energy - b.avgEnergy;
    const deviation = Math.abs(delta) / Math.max(b.avgEnergy, 0.5);

    if (deviation < 0.35) {
      return { isAnomaly: false, direction: 'normal', severity: deviation,
               message: 'Within your normal range', expected: b.avgEnergy, actual: energy };
    }

    const direction = delta < 0 ? 'below' : 'above';
    const pct       = (deviation * 100).toFixed(0);

    return {
      isAnomaly: true,
      direction,
      severity:  Math.min(deviation, 1),
      expected:  b.avgEnergy,
      actual:    energy,
      message:   direction === 'below'
        ? `Energy is ${pct}% below your usual level for this time — something's off from your baseline`
        : `Energy is ${pct}% above your historical baseline — this is a rare peak window`,
    };
  }

  /**
   * Predict today's energy curve (indices = hours 0–23).
   * Returns null for hours with insufficient data.
   */
  predictEnergyByHour(dayOfWeek: number): (number | null)[] {
    return Array.from({ length: 24 }, (_, h) => {
      const b = this.getBaseline(h, dayOfWeek);
      return (b && b.confidence > 0.2) ? b.avgEnergy : null;
    });
  }

  /** Is today's focus pace behind the user's personal average? */
  isVelocityBehind(todayFocusMin: number, workHoursElapsed: number): boolean {
    if (this.rhythm.focusHistory30d.length < 7) return false;
    // Assume 9-hour productive window; scale expectation by elapsed time
    const expectedSoFar = (this.rhythm.typicalDailyFocus / 9) * workHoursElapsed;
    return todayFocusMin < expectedSoFar * 0.45;
  }

  /** Learned peak hours (not assumed 9–11, but actually measured) */
  get peakHours() { return this.rhythm.peakHours; }

  /** True once we have 15+ readings — enough to give meaningful predictions */
  get isCalibrated() { return this.readings.length >= 15; }

  get rhythm_() { return this.rhythm; }

  // ── Recomputation ────────────────────────────────────────────────────────────

  private recompute() {
    const cutoff = Date.now() - WINDOW_DAYS * 86400000;
    const recent = this.readings.filter(r => r.timestamp > cutoff);

    // Group by [dayOfWeek][hour]
    const grouped: Record<number, Record<number, EnergyReading[]>> = {};
    for (const r of recent) {
      grouped[r.dayOfWeek]         ??= {};
      grouped[r.dayOfWeek][r.hour] ??= [];
      grouped[r.dayOfWeek][r.hour].push(r);
    }

    const matrix: PersonalRhythm['matrix'] = {};
    for (const [d, hours] of Object.entries(grouped)) {
      matrix[+d] = {};
      for (const [h, rds] of Object.entries(hours)) {
        matrix[+d][+h] = {
          avgEnergy:   mean(rds.map(r => r.energy)),
          avgFocus:    mean(rds.map(r => r.focusMinutes)),
          avgTasks:    mean(rds.map(r => r.tasksCompleted)),
          sampleCount: rds.length,
          confidence:  Math.min(rds.length / 10, 1),
        };
      }
    }
    this.rhythm.matrix = matrix;

    // Derive peak / trough hours across all days
    const byHour: Record<number, number[]> = {};
    for (const r of recent) {
      byHour[r.hour] ??= [];
      byHour[r.hour].push(r.energy);
    }
    const sorted = Object.entries(byHour)
      .map(([h, e]) => ({ hour: +h, avg: mean(e) }))
      .sort((a, b) => b.avg - a.avg);

    this.rhythm.peakHours   = sorted.slice(0, 3).map(x => x.hour).sort((a, b) => a - b);
    this.rhythm.troughHours = sorted.slice(-3).map(x => x.hour).sort((a, b) => a - b);
    this.rhythm.totalReadings  = this.readings.length;
    this.rhythm.lastRecomputed = Date.now();
  }
}

export const behavioralBaseline = new BehavioralBaselineEngine();
