/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAAL Context Engine                                         ║
 * ║  The living mental model of the user.                        ║
 * ║                                                              ║
 * ║  Aggregates signals from:                                    ║
 * ║    • 19 Supabase tables (259+ columns)                       ║
 * ║    • Integration hub (Gmail, Calendar, Notion, Spotify)      ║
 * ║    • Real-time behavioural observations                      ║
 * ║    • Time-based & pattern-based inference                    ║
 * ║                                                              ║
 * ║  Outputs a rich UserContext that drives:                     ║
 * ║    • Proactive nudges                                        ║
 * ║    • Agent response tone & urgency                           ║
 * ║    • Task prioritisation                                     ║
 * ║    • Integration actions                                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { integrationHub, SpotifyState, CalendarEvent, EmailDigest, NotionActivity } from './integration-hub';

// ─── Core context types ───────────────────────────────────────────────────────

export type EnergyTrend  = 'rising' | 'stable' | 'falling' | 'recovering';
export type MoodLabel    = 'energised' | 'focused' | 'neutral' | 'tired' | 'stressed' | 'anxious' | 'overwhelmed';
export type CognitiveState = 'deep_work_ready' | 'shallow_ok' | 'rest_needed' | 'recovery';

export interface UserVitals {
  /** 0-100 composite energy score */
  energyScore: number;
  energyTrend: EnergyTrend;
  /** 0-100 — how cognitively loaded the user is */
  cognitiveLoad: number;
  /** 0-100 — inferred stress from task overload, email volume, deadlines */
  stressScore: number;
  /** inferred from energy + task patterns + time */
  mood: MoodLabel;
  cognitiveState: CognitiveState;
  /** minutes until KAAL predicts the user will need a break */
  sustainableMinutesLeft: number;
}

export interface TaskSituation {
  totalActive: number;
  overdueCount: number;
  dueTodayCount: number;
  completedTodayCount: number;
  completionRatioToday: number; // 0-1
  topUrgentTask: { id: string; title: string; priority: string } | null;
  estimatedBacklogHours: number;
  weeklyVelocity: number; // tasks completed per day avg
  blockedCount: number;
}

export interface TimeContext {
  now: Date;
  hour: number;
  minuteOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isPeakHour: boolean;
  timeOfDayLabel: 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';
  nextEvent: CalendarEvent | null;
  minutesToNextEvent: number;
  availableWindowMinutes: number;
  /** KAAL's recommended action for the current moment */
  recommendedAction: 'deep_work' | 'shallow_work' | 'break' | 'prepare_for_meeting' | 'wrap_up' | 'rest';
}

export interface IntegrationSignals {
  spotify: SpotifyState | null;
  calendar: { events: CalendarEvent[]; summary: string };
  email: EmailDigest | null;
  notion: NotionActivity | null;
  /** derived: is the user in a "do not disturb" state from Spotify cues */
  impliedDND: boolean;
  /** derived: urgency level from email */
  emailUrgency: 'none' | 'low' | 'medium' | 'high';
}

export interface ProactiveAction {
  id: string;
  type: 'remind' | 'draft' | 'schedule' | 'block_time' | 'summarise' | 'nudge' | 'celebrate' | 'reroute';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggerAt?: Date;
  status: 'queued' | 'executing' | 'done' | 'dismissed';
  /** the tool call to execute */
  tool: string;
  params: Record<string, any>;
  /** why KAAL decided this matters right now */
  rationale: string;
}

export interface WinEvent {
  id: string;
  type: 'task_complete' | 'streak' | 'focus_pb' | 'goal_milestone' | 'weekly_record' | 'energy_recovery' | 'early_finish' | 'comeback';
  title: string;
  description: string;
  magnitude: 'small' | 'medium' | 'large' | 'legendary';
  timestamp: number;
  celebrated: boolean;
  xpAwarded: number;
}

/** The full living model KAAL maintains of the user */
export interface UserContext {
  userId: string;
  refreshedAt: Date;

  vitals: UserVitals;
  tasks: TaskSituation;
  time: TimeContext;
  integrations: IntegrationSignals;
  proactiveQueue: ProactiveAction[];
  recentWins: WinEvent[];

  /** KAAL's one-sentence assessment of where the user is */
  situationSummary: string;
  /** 0-100 — how confident KAAL is in its current model */
  confidenceScore: number;
  /** how many data sources contributed */
  dataSourceCount: number;
}

// ─── Context Engine class ─────────────────────────────────────────────────────

class ContextEngine {
  private _ctx: UserContext | null = null;
  private _listeners: Array<(ctx: UserContext) => void> = [];
  private _refreshTimer: number | null = null;
  private _activityBuffer: number[] = []; // timestamps of recent interactions

  /** Subscribe to context updates */
  subscribe(fn: (ctx: UserContext) => void) {
    this._listeners.push(fn);
    if (this._ctx) fn(this._ctx);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  /** Record user activity (keypress, click, focus event) */
  recordActivity() {
    this._activityBuffer.push(Date.now());
    // Keep only last 30 activity timestamps
    if (this._activityBuffer.length > 30) this._activityBuffer = this._activityBuffer.slice(-30);
  }

  /** Derive seconds since last activity */
  private _secondsIdle(): number {
    if (this._activityBuffer.length === 0) return 9999;
    return (Date.now() - this._activityBuffer[this._activityBuffer.length - 1]) / 1000;
  }

  /** Start background refresh loop */
  start() {
    this.refresh();
    this._refreshTimer = window.setInterval(() => this.refresh(), 60_000); // every minute
  }

  stop() {
    if (this._refreshTimer) window.clearInterval(this._refreshTimer);
  }

  async refresh(): Promise<UserContext> {
    const ctx = await this._build();
    this._ctx = ctx;
    this._listeners.forEach(fn => fn(ctx));
    return ctx;
  }

  get current(): UserContext | null { return this._ctx; }

  // ── Private builders ──────────────────────────────────────────────────────

  private async _build(): Promise<UserContext> {
    const now = new Date();
    const [integrationSignals, storedData] = await Promise.all([
      this._gatherIntegrationSignals(),
      this._gatherLocalData(),
    ]);

    const vitals   = this._deriveVitals(storedData, integrationSignals, now);
    const taskSit  = this._deriveTaskSituation(storedData);
    const timeCtx  = this._deriveTimeContext(now, integrationSignals, vitals, storedData);
    const wins     = this._gatherRecentWins();
    const queue    = this._buildProactiveQueue(vitals, taskSit, timeCtx, integrationSignals, wins);
    const summary  = this._generateSituationSummary(vitals, taskSit, timeCtx, integrationSignals);

    return {
      userId: storedData.userId,
      refreshedAt: now,
      vitals,
      tasks: taskSit,
      time: timeCtx,
      integrations: integrationSignals,
      proactiveQueue: queue,
      recentWins: wins,
      situationSummary: summary,
      confidenceScore: this._computeConfidence(storedData, integrationSignals),
      dataSourceCount: this._countDataSources(storedData, integrationSignals),
    };
  }

  // ── Integration signals ───────────────────────────────────────────────────

  private async _gatherIntegrationSignals(): Promise<IntegrationSignals> {
    const [spotify, events, email, notion] = await Promise.all([
      integrationHub.getSpotifyState().catch(() => null),
      integrationHub.getCalendarEvents().catch(() => [] as CalendarEvent[]),
      integrationHub.getEmailDigest().catch(() => null),
      integrationHub.getNotionActivity().catch(() => null),
    ]);

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start) > now);
    const calSummary = upcomingEvents.length === 0
      ? 'Clear until end of day'
      : `${upcomingEvents.length} event${upcomingEvents.length > 1 ? 's' : ''} today — next: ${upcomingEvents[0]?.title ?? ''}`;

    const impliedDND = !!(spotify?.isPlaying && (
      spotify.playlistName?.toLowerCase().includes('focus') ||
      spotify.playlistName?.toLowerCase().includes('deep') ||
      spotify.playlistName?.toLowerCase().includes('study') ||
      spotify.trackTempo > 100
    ));

    let emailUrgency: IntegrationSignals['emailUrgency'] = 'none';
    if (email) {
      if (email.urgentCount > 0) emailUrgency = 'high';
      else if (email.needsResponseCount > 2) emailUrgency = 'medium';
      else if (email.unreadCount > 20) emailUrgency = 'low';
    }

    return { spotify, calendar: { events, summary: calSummary }, email, notion, impliedDND, emailUrgency };
  }

  // ── Local data (localStorage + sessionStorage) ────────────────────────────

  private _gatherLocalData() {
    const safe = (key: string, fallback: any = null) => {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    };

    const userId = safe('kaal_user_id', 'anonymous');
    const tasks = safe('kaal_tasks', []) as any[];
    const energyLogs = safe('kaal_energy_logs', []) as any[];
    const focusSessions = safe('kaal_focus_sessions', []) as any[];
    const patterns = safe('kaal_user_patterns', {});
    const dailyStats = safe('kaal_daily_stats', {});
    const streak = safe('kaal_streak', { current: 0, best: 0 });
    const goals = safe('kaal_goals', []) as any[];
    const habits = safe('kaal_habits', []) as any[];
    const moodEntries = safe('kaal_mood_entries', []) as any[];
    const lastEnergyLevel = Number(localStorage.getItem('kaal_last_energy_level') || '3');

    return { userId, tasks, energyLogs, focusSessions, patterns, dailyStats, streak, goals, habits, moodEntries, lastEnergyLevel };
  }

  // ── Vitals derivation ─────────────────────────────────────────────────────

  private _deriveVitals(data: any, signals: IntegrationSignals, now: Date): UserVitals {
    const hour = now.getHours();

    // Energy: combine explicit log + time-of-day curve + Spotify signal
    const baseEnergy = (data.lastEnergyLevel / 5) * 100;
    const recentLog = data.energyLogs.find((l: any) =>
      Date.now() - new Date(l.timestamp).getTime() < 2 * 60 * 60 * 1000
    );
    const loggedEnergy = recentLog ? (recentLog.level / 5) * 100 : baseEnergy;

    // Circadian modifier (-15 to +10)
    const circadian =
      (hour >= 7 && hour <= 10)  ?  8 :
      (hour >= 10 && hour <= 12) ? 10 :
      (hour >= 12 && hour <= 14) ? -5 :
      (hour >= 14 && hour <= 16) ?  5 :
      (hour >= 16 && hour <= 18) ? -3 :
      (hour >= 18 && hour <= 20) ? -8 : -15;

    // Spotify boost (upbeat playlist = energy signal)
    const spotifyBoost = signals.spotify?.isPlaying
      ? signals.spotify.trackTempo > 120 ? 8 : 3
      : 0;

    const energyScore = Math.min(100, Math.max(0, loggedEnergy + circadian + spotifyBoost));

    // Energy trend: compare to 2 logs ago
    let energyTrend: EnergyTrend = 'stable';
    if (data.energyLogs.length >= 2) {
      const [l1, l2] = data.energyLogs.slice(0, 2);
      const delta = (l1.level - l2.level);
      energyTrend = delta > 0.5 ? 'rising' : delta < -0.5 ? 'falling' : 'stable';
    }

    // Cognitive load: open tasks × overdue penalty + focus session drain
    const activeTasks = data.tasks.filter((t: any) => t.status !== 'completed').length;
    const overdueTasks = data.tasks.filter((t: any) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;
    const todayFocus = data.dailyStats?.[now.toISOString().split('T')[0]]?.focusMinutes || 0;
    const focusDrain = Math.min(30, (todayFocus / 240) * 30); // cap at 30 pts after 4h
    const cognitiveLoad = Math.min(100, activeTasks * 4 + overdueTasks * 12 + focusDrain + (signals.emailUrgency === 'high' ? 15 : signals.emailUrgency === 'medium' ? 8 : 0));

    // Stress: overdue × urgency × email pressure
    const urgentCount = data.tasks.filter((t: any) => t.priority === 'urgent' && t.status !== 'completed').length;
    const stressScore = Math.min(100, overdueTasks * 15 + urgentCount * 10 + (signals.emailUrgency === 'high' ? 20 : 0) + (cognitiveLoad > 70 ? 15 : 0));

    // Mood inference
    const mood: MoodLabel =
      stressScore > 70 ? 'overwhelmed' :
      stressScore > 50 ? 'stressed' :
      energyScore < 30 ? 'tired' :
      cognitiveLoad > 75 ? 'anxious' :
      energyScore > 70 && cognitiveLoad < 50 ? 'focused' :
      energyScore > 60 ? 'energised' : 'neutral';

    // Cognitive state
    const cognitiveState: CognitiveState =
      energyScore > 65 && cognitiveLoad < 60 ? 'deep_work_ready' :
      energyScore > 45 && cognitiveLoad < 75 ? 'shallow_ok' :
      energyScore < 30 || cognitiveLoad > 85 ? 'rest_needed' : 'recovery';

    // Sustainable minutes
    const sustainableMinutesLeft =
      cognitiveState === 'deep_work_ready' ? 90 :
      cognitiveState === 'shallow_ok' ? 45 :
      cognitiveState === 'recovery' ? 20 : 0;

    return { energyScore, energyTrend, cognitiveLoad, stressScore, mood, cognitiveState, sustainableMinutesLeft };
  }

  // ── Task situation ────────────────────────────────────────────────────────

  private _deriveTaskSituation(data: any): TaskSituation {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const active  = data.tasks.filter((t: any) => t.status !== 'completed' && t.status !== 'archived');
    const overdue = active.filter((t: any) => t.dueDate && new Date(t.dueDate) < now);
    const dueToday = active.filter((t: any) => t.dueDate && t.dueDate.startsWith(todayStr));
    const completedToday = data.tasks.filter((t: any) => t.status === 'completed' && (t.completedAt || '').startsWith(todayStr));
    const urgent = active.filter((t: any) => t.priority === 'urgent' || t.priority === 'high');
    const blocked = active.filter((t: any) => t.status === 'blocked');
    const topUrgent = urgent[0] ? { id: urgent[0].id, title: urgent[0].title, priority: urgent[0].priority } : null;
    const estimatedBacklogHours = active.reduce((s: number, t: any) => s + (t.estimatedMinutes || 30), 0) / 60;

    // Weekly velocity from dailyStats
    const weekKeys = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const weekCompleted = weekKeys.reduce((s, k) => s + (data.dailyStats?.[k]?.tasksCompleted || 0), 0);
    const weeklyVelocity = weekCompleted / 7;

    const total = active.length + completedToday.length;
    const completionRatioToday = total > 0 ? completedToday.length / total : 0;

    return {
      totalActive: active.length, overdueCount: overdue.length,
      dueTodayCount: dueToday.length, completedTodayCount: completedToday.length,
      completionRatioToday, topUrgentTask: topUrgent, estimatedBacklogHours,
      weeklyVelocity, blockedCount: blocked.length,
    };
  }

  // ── Time context ──────────────────────────────────────────────────────────

  private _deriveTimeContext(now: Date, signals: IntegrationSignals, vitals: UserVitals, data: any): TimeContext {
    const hour = now.getHours();
    const minuteOfDay = hour * 60 + now.getMinutes();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const peakHours: number[] = data.patterns?.peakHours || [9, 10, 14];
    const isPeakHour = peakHours.includes(hour);

    const timeOfDayLabel =
      hour < 6  ? 'night' :
      hour < 9  ? 'early_morning' :
      hour < 12 ? 'morning' :
      hour < 14 ? 'midday' :
      hour < 18 ? 'afternoon' :
      hour < 22 ? 'evening' : 'night';

    // Next calendar event
    const futureEvents = signals.calendar.events
      .filter(e => new Date(e.start) > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const nextEvent = futureEvents[0] ?? null;
    const minutesToNextEvent = nextEvent
      ? Math.round((new Date(nextEvent.start).getTime() - now.getTime()) / 60000)
      : 480;

    // Available window — time before next event or end of work day (6pm)
    const workEndMin = 18 * 60;
    const availableWindowMinutes = Math.min(
      minutesToNextEvent,
      workEndMin - minuteOfDay
    );

    // Recommended action
    const recommendedAction =
      minutesToNextEvent < 10  ? 'prepare_for_meeting' :
      minutesToNextEvent < 20  ? 'shallow_work' :
      vitals.cognitiveState === 'rest_needed' ? 'rest' :
      vitals.cognitiveState === 'deep_work_ready' && availableWindowMinutes >= 45 ? 'deep_work' :
      vitals.cognitiveState === 'recovery' ? 'break' :
      hour >= 17 ? 'wrap_up' :
      availableWindowMinutes < 25 ? 'shallow_work' : 'deep_work';

    return {
      now, hour, minuteOfDay, dayOfWeek, isWeekend, isPeakHour,
      timeOfDayLabel, nextEvent, minutesToNextEvent, availableWindowMinutes, recommendedAction,
    };
  }

  // ── Win gathering ─────────────────────────────────────────────────────────

  private _gatherRecentWins(): WinEvent[] {
    try {
      const raw = localStorage.getItem('kaal_win_events');
      if (!raw) return [];
      const wins: WinEvent[] = JSON.parse(raw);
      // Return last 7 days
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return wins.filter(w => w.timestamp > cutoff).sort((a, b) => b.timestamp - a.timestamp);
    } catch { return []; }
  }

  // ── Proactive queue builder ───────────────────────────────────────────────

  private _buildProactiveQueue(
    vitals: UserVitals, tasks: TaskSituation, time: TimeContext,
    signals: IntegrationSignals, wins: WinEvent[]
  ): ProactiveAction[] {
    const queue: ProactiveAction[] = [];
    const now = new Date();

    // 1. Deep work window opportunity
    if (time.recommendedAction === 'deep_work' && tasks.topUrgentTask) {
      queue.push({
        id: `pa-deepwork-${Date.now()}`,
        type: 'block_time',
        priority: 'high',
        title: `Start "${tasks.topUrgentTask.title}"`,
        description: `${time.availableWindowMinutes} min window available — your highest priority task.`,
        status: 'queued',
        tool: 'start_focus',
        params: { taskId: tasks.topUrgentTask.id, duration: Math.min(90, time.availableWindowMinutes) },
        rationale: `${time.availableWindowMinutes} min free, cognitive state is ${vitals.cognitiveState}`,
      });
    }

    // 2. Pre-meeting prep
    if (time.minutesToNextEvent > 0 && time.minutesToNextEvent <= 20 && time.nextEvent) {
      queue.push({
        id: `pa-meeting-${Date.now()}`,
        type: 'remind',
        priority: 'high',
        title: `Prepare for "${time.nextEvent.title}"`,
        description: `Meeting in ${time.minutesToNextEvent} min. Want me to pull up notes?`,
        triggerAt: new Date(now.getTime() + (time.minutesToNextEvent - 5) * 60000),
        status: 'queued',
        tool: 'navigate',
        params: { route: '/calendar' },
        rationale: `${time.minutesToNextEvent} minutes until meeting`,
      });
    }

    // 3. Email urgency response
    if (signals.emailUrgency === 'high' && signals.email) {
      queue.push({
        id: `pa-email-${Date.now()}`,
        type: 'draft',
        priority: 'medium',
        title: 'Draft urgent email replies',
        description: `${signals.email.urgentCount} urgent email${signals.email.urgentCount > 1 ? 's' : ''} waiting. I can draft responses.`,
        status: 'queued',
        tool: 'navigate',
        params: { route: '/agent', action: 'draft_emails' },
        rationale: 'Email urgency is high',
      });
    }

    // 4. Overdue task warning
    if (tasks.overdueCount > 0) {
      queue.push({
        id: `pa-overdue-${Date.now()}`,
        type: 'reroute',
        priority: tasks.overdueCount > 3 ? 'critical' : 'medium',
        title: `${tasks.overdueCount} overdue task${tasks.overdueCount > 1 ? 's' : ''} need attention`,
        description: `Let me help you reschedule or complete these.`,
        status: 'queued',
        tool: 'filter_tasks',
        params: { filter: 'overdue' },
        rationale: `${tasks.overdueCount} tasks past due date`,
      });
    }

    // 5. Notion follow-up
    if (signals.notion?.pendingActionItems && signals.notion.pendingActionItems > 0) {
      queue.push({
        id: `pa-notion-${Date.now()}`,
        type: 'summarise',
        priority: 'low',
        title: `${signals.notion.pendingActionItems} Notion action items pending`,
        description: `Sync these into your KAAL task list?`,
        status: 'queued',
        tool: 'navigate',
        params: { route: '/agent', action: 'sync_notion' },
        rationale: 'Notion has unsynced action items',
      });
    }

    // 6. Energy-based break suggestion
    if (vitals.cognitiveState === 'rest_needed' || (vitals.sustainableMinutesLeft === 0 && vitals.cognitiveLoad > 70)) {
      queue.push({
        id: `pa-break-${Date.now()}`,
        type: 'nudge',
        priority: 'medium',
        title: 'You need a break',
        description: `Cognitive load is ${Math.round(vitals.cognitiveLoad)}%. A 10-min break now saves the afternoon.`,
        status: 'queued',
        tool: 'schedule_break',
        params: { duration: 10 },
        rationale: `Cognitive load ${Math.round(vitals.cognitiveLoad)}% — rest_needed state`,
      });
    }

    // 7. Win celebration (uncelebrated)
    const uncelebrated = wins.find(w => !w.celebrated);
    if (uncelebrated) {
      queue.push({
        id: `pa-win-${Date.now()}`,
        type: 'celebrate',
        priority: 'low',
        title: `🎉 ${uncelebrated.title}`,
        description: uncelebrated.description,
        status: 'queued',
        tool: 'celebrate_win',
        params: { winId: uncelebrated.id },
        rationale: 'Recent win not yet celebrated',
      });
    }

    return queue.slice(0, 5); // Cap at 5 — avoid overwhelm
  }

  // ── Situation summary ─────────────────────────────────────────────────────

  private _generateSituationSummary(
    vitals: UserVitals, tasks: TaskSituation, time: TimeContext, signals: IntegrationSignals
  ): string {
    const parts: string[] = [];

    if (vitals.cognitiveState === 'deep_work_ready' && time.availableWindowMinutes >= 45)
      parts.push(`${time.availableWindowMinutes}-min deep work window available`);
    else if (vitals.cognitiveState === 'rest_needed')
      parts.push('rest recommended before continuing');
    else if (vitals.mood === 'overwhelmed')
      parts.push('high cognitive load — let\'s prioritise together');

    if (tasks.overdueCount > 0) parts.push(`${tasks.overdueCount} overdue task${tasks.overdueCount > 1 ? 's' : ''}`);
    if (time.nextEvent) parts.push(`${time.nextEvent.title} in ${time.minutesToNextEvent} min`);
    if (signals.impliedDND) parts.push('Spotify focus session active');
    if (signals.emailUrgency === 'high') parts.push('urgent emails waiting');

    if (parts.length === 0) return 'All clear — steady pace, you\'re on track.';
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) +
      (parts.length > 1 ? ` · ${parts.slice(1).join(' · ')}` : '') + '.';
  }

  // ── Confidence + data source count ───────────────────────────────────────

  private _computeConfidence(data: any, signals: IntegrationSignals): number {
    let score = 30; // baseline from local data
    if (data.energyLogs?.length > 0) score += 15;
    if (data.focusSessions?.length > 0) score += 10;
    if (data.moodEntries?.length > 0) score += 10;
    if (signals.spotify) score += 10;
    if (signals.calendar.events.length > 0) score += 10;
    if (signals.email) score += 10;
    if (signals.notion) score += 5;
    return Math.min(100, score);
  }

  private _countDataSources(data: any, signals: IntegrationSignals): number {
    return [
      data.tasks?.length > 0,
      data.energyLogs?.length > 0,
      data.focusSessions?.length > 0,
      signals.spotify !== null,
      signals.calendar.events.length > 0,
      signals.email !== null,
      signals.notion !== null,
    ].filter(Boolean).length;
  }
}

export const contextEngine = new ContextEngine();
