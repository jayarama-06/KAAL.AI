/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAAL Win Detector                                           ║
 * ║                                                              ║
 * ║  Detects, stores, and celebrates user achievements.          ║
 * ║  ADHD-optimised: celebrates SMALL wins that neurotypical     ║
 * ║  apps ignore — because dopamine from recognition directly    ║
 * ║  supports executive function.                                ║
 * ║                                                              ║
 * ║  Win categories:                                             ║
 * ║    • task_complete  — any task done                          ║
 * ║    • streak         — daily streak milestones                ║
 * ║    • focus_pb       — personal best focus session            ║
 * ║    • goal_milestone — goal checkpoint reached                ║
 * ║    • weekly_record  — best week ever                         ║
 * ║    • energy_recovery— bounced back from low energy           ║
 * ║    • early_finish   — task done before deadline              ║
 * ║    • comeback       — returned after days away               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type { WinEvent } from './context-engine';

const WINS_KEY = 'kaal_win_events';
const WIN_XP: Record<WinEvent['type'], number> = {
  task_complete: 10,
  streak: 50,
  focus_pb: 75,
  goal_milestone: 100,
  weekly_record: 150,
  energy_recovery: 30,
  early_finish: 40,
  comeback: 25,
};

const WIN_MAGNITUDE: Record<WinEvent['type'], WinEvent['magnitude']> = {
  task_complete: 'small',
  streak: 'medium',
  focus_pb: 'large',
  goal_milestone: 'large',
  weekly_record: 'legendary',
  energy_recovery: 'small',
  early_finish: 'medium',
  comeback: 'small',
};

function loadWins(): WinEvent[] {
  try { return JSON.parse(localStorage.getItem(WINS_KEY) || '[]'); } catch { return []; }
}
function saveWins(wins: WinEvent[]) {
  try { localStorage.setItem(WINS_KEY, JSON.stringify(wins.slice(-100))); } catch {} // keep last 100
}

// ─── Win templates ────────────────────────────────────────────────────────────

const WIN_TITLES: Record<WinEvent['type'], string[]> = {
  task_complete: [
    'Task crushed!', 'Done and dusted.', 'Off the list!',
    'One down.', 'Momentum built.', 'Progress made.',
  ],
  streak: [
    'Streak milestone!', 'Consistency pays.', 'You showed up — again.',
    'Habit forming.', 'Streak power!',
  ],
  focus_pb: [
    'New focus record!', 'Personal best — focus depth.',
    'You went deeper than ever.', 'Flow state achieved.',
  ],
  goal_milestone: [
    'Goal checkpoint!', 'Milestone reached.', 'Closer to the vision.',
    'Goal progress — real.', 'You\'re building something.',
  ],
  weekly_record: [
    'Best week ever!', 'Weekly record smashed.',
    'Your best performance yet.', 'Peak week unlocked.',
  ],
  energy_recovery: [
    'Energy bounced back!', 'Recovery complete.',
    'Low point → comeback.', 'Resilience logged.',
  ],
  early_finish: [
    'Finished early!', 'Ahead of schedule.',
    'Beat the deadline.', 'Under budget — time-wise.',
  ],
  comeback: [
    'You\'re back!', 'Return to the arena.',
    'Comeback started.', 'First step back.',
  ],
};

const WIN_DESCRIPTIONS: Record<WinEvent['type'], (meta: Record<string, any>) => string> = {
  task_complete: (m) => m.priority === 'urgent' || m.priority === 'high'
    ? `Completed "${m.title}" — a ${m.priority} priority task. That took real effort.`
    : `"${m.title}" is done. Every task completed is momentum.`,
  streak: (m) => `${m.days}-day streak. You've shown up ${m.days} days in a row. That's not luck — it's character.`,
  focus_pb: (m) => `${m.minutes} minutes of unbroken focus. Your previous best was ${m.prevBest} min. You just rewrote your ceiling.`,
  goal_milestone: (m) => `"${m.goalTitle}" milestone reached — ${m.progress}% complete. You're building something real.`,
  weekly_record: (m) => `${m.count} tasks completed this week — your personal record. Peak output unlocked.`,
  energy_recovery: (m) => `You went from ${m.from}% energy to ${m.to}% energy. Recovery is a skill. You've got it.`,
  early_finish: (m) => `"${m.title}" delivered ${m.daysBefore} day${m.daysBefore !== 1 ? 's' : ''} before deadline. Future-you appreciates it.`,
  comeback: (m) => `${m.daysAway} days away and you're back. Starting again is harder than continuing. Respect.`,
};

// ─── WinDetector class ────────────────────────────────────────────────────────

class WinDetector {
  private _listeners: Array<(win: WinEvent) => void> = [];

  onWin(fn: (win: WinEvent) => void) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  private _emit(win: WinEvent) {
    const wins = loadWins();
    wins.unshift(win);
    saveWins(wins);
    this._listeners.forEach(fn => fn(win));
  }

  private _create(type: WinEvent['type'], meta: Record<string, any>): WinEvent {
    const titles = WIN_TITLES[type];
    return {
      id: `win-${type}-${Date.now()}`,
      type,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: WIN_DESCRIPTIONS[type](meta),
      magnitude: WIN_MAGNITUDE[type],
      timestamp: Date.now(),
      celebrated: false,
      xpAwarded: WIN_XP[type],
    };
  }

  // ── Detection methods — call these from wherever the event occurs ──────────

  taskCompleted(task: { id: string; title: string; priority: string; dueDate?: string | null }) {
    const win = this._create('task_complete', { title: task.title, priority: task.priority });
    this._emit(win);

    // Check for early finish
    if (task.dueDate) {
      const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
      if (daysLeft >= 1) {
        const earlyWin = this._create('early_finish', { title: task.title, daysBefore: daysLeft });
        setTimeout(() => this._emit(earlyWin), 1500); // delay so both toasts are visible
      }
    }
  }

  streakMilestone(days: number) {
    if ([3, 5, 7, 14, 21, 30, 60, 90].includes(days)) {
      this._emit(this._create('streak', { days }));
    }
  }

  focusSessionComplete(minutes: number) {
    try {
      const prevBest = Number(localStorage.getItem('kaal_focus_pb') || '0');
      if (minutes > prevBest) {
        localStorage.setItem('kaal_focus_pb', String(minutes));
        this._emit(this._create('focus_pb', { minutes, prevBest }));
      } else if (minutes >= 25) {
        // Still celebrate any proper Pomodoro
        const smallWin: WinEvent = {
          ...this._create('task_complete', { title: `${minutes}-minute focus session`, priority: 'medium' }),
          title: `${minutes} min deep work done.`,
          description: `You held focus for ${minutes} minutes. Every session sharpens the blade.`,
        };
        this._emit(smallWin);
      }
    } catch {}
  }

  goalMilestone(goalTitle: string, progress: number) {
    const milestones = [25, 50, 75, 100];
    if (milestones.includes(Math.round(progress))) {
      this._emit(this._create('goal_milestone', { goalTitle, progress }));
    }
  }

  weeklyRecord(count: number) {
    try {
      const prevRecord = Number(localStorage.getItem('kaal_weekly_record') || '0');
      if (count > prevRecord) {
        localStorage.setItem('kaal_weekly_record', String(count));
        this._emit(this._create('weekly_record', { count }));
      }
    } catch {}
  }

  energyRecovery(fromLevel: number, toLevel: number) {
    if (toLevel - fromLevel >= 30) { // meaningful jump
      this._emit(this._create('energy_recovery', { from: fromLevel, to: toLevel }));
    }
  }

  comeback(daysAway: number) {
    if (daysAway >= 2) {
      this._emit(this._create('comeback', { daysAway }));
    }
  }

  // ── Mark a win as celebrated ──────────────────────────────────────────────

  markCelebrated(winId: string) {
    const wins = loadWins();
    const idx = wins.findIndex(w => w.id === winId);
    if (idx !== -1) { wins[idx].celebrated = true; saveWins(wins); }
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  getRecent(days = 7): WinEvent[] {
    const cutoff = Date.now() - days * 86400000;
    return loadWins().filter(w => w.timestamp > cutoff);
  }

  getUncelebrated(): WinEvent[] {
    return loadWins().filter(w => !w.celebrated).slice(0, 3);
  }

  getTotalXP(): number {
    return loadWins().reduce((s, w) => s + w.xpAwarded, 0);
  }

  getStreak(): number {
    try { return JSON.parse(localStorage.getItem('kaal_streak') || '{}').current || 0; } catch { return 0; }
  }
}

export const winDetector = new WinDetector();
