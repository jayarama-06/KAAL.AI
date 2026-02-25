/**
 * KAAL Storage Service - Supabase Data Persistence
 * Manages all app data with Supabase backend (no localStorage)
 */

import { focusSessionsService, streakService } from './supabase-service';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  createdAt: number;
  completedAt?: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
}

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  energyLevel: 'low' | 'medium' | 'high';
  estimatedTime: string;
  createdAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
  isRecurring: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  type: 'meeting' | 'deadline' | 'event';
  link?: string;
  userId: string;
  createdAt?: Date;
}

export interface FocusSession {
  id?: string;
  sessionId: string;
  title: string;
  startTime: number;
  endTime?: number;
  plannedDuration: number;
  actualDuration?: number;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  focusScore?: number;
  interruptions?: number;
  contextSwitches?: number;
  tags?: string[];
  notes?: string;
  energyLevel?: number;
  completionPercentage?: number;
}

export interface EnergyLog {
  id: string;
  timestamp: number;
  level: number;
  mood?: string;
  notes?: string;
  activities: string[];
}

export interface WorkspacePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  apps: Array<{ name: string; url: string }>;
  tasks: string[];
  createdAt: number;
}

export interface UserProfile {
  name: string;
  fullName?: string; // For compatibility with auth service
  email?: string;
  avatar?: string;
  profileImage?: string; // For compatibility with ProfileContext
  workStyle: 'sprint' | 'cyclic' | 'marathon';
  focusBaseline: number;
  timezone: string;
  preferences: {
    enableNotifications: boolean;
    enableNudges: boolean;
    autoStartSessions: boolean;
    defaultSessionLength: number;
  };
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  deepWorkMinutes: number;
  tasksCompleted: number;
  sessionsCount: number;
  avgFocusScore: number;
  avgEnergyLevel: number;
  topTags: string[];
}

class StorageService {
  private readonly KEYS = {
    SESSIONS: 'kaal_sessions',
    ENERGY_LOGS: 'kaal_energy_logs',
    WORKSPACES: 'kaal_workspaces',
    PROFILE: 'kaal_profile',
    DAILY_STATS: 'kaal_daily_stats',
    CURRENT_SESSION: 'kaal_current_session',
    STREAKS: 'kaal_streaks',
    BACKLOG: 'kaal_backlog',
    REMINDERS: 'kaal_reminders',
    CALENDAR_EVENTS: 'kaal_calendar_events'
  };

  // ==================== TASKS (DEPRECATED - USE SUPABASE) ====================
  // All task methods have been removed. Use /services/task-service.ts instead.
  // Tasks are now managed via Supabase with useTasks() hook.

  /**
   * DEPRECATED: Tasks are now managed via Supabase
   * This stub exists only for backwards compatibility
   * Use useTasks() hook instead
   */
  async getTasks(): Promise<never[]> {
    console.warn('⚠️ storageService.getTasks() is deprecated. Use useTasks() hook instead.');
    return [];
  }

  // ==================== FOCUS SESSIONS (SUPABASE) ====================

  async getSessions(): Promise<FocusSession[]> {
    try {
      return await focusSessionsService.getAll();
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  async saveSession(session: FocusSession): Promise<void> {
    try {
      if (session.id) {
        // Update existing
        await focusSessionsService.update(session.sessionId, session);
      } else {
        // Create new
        await focusSessionsService.create(session);
      }
      this.updateDailyStats();
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  async getCurrentSession(): Promise<FocusSession | null> {
    try {
      return await focusSessionsService.getActiveSession();
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  async setCurrentSession(session: FocusSession | null): Promise<void> {
    // Not needed - active sessions are managed by status in DB
    if (session) {
      await this.saveSession(session);
    }
  }

  async endCurrentSession(updates: Partial<FocusSession>): Promise<void> {
    const current = await this.getCurrentSession();
    if (current) {
      await focusSessionsService.update(current.sessionId, {
        ...updates,
        status: 'completed',
        endTime: Date.now(),
        actualDuration: Date.now() - current.startTime
      });
      this.updateDailyStats();
    }
  }

  async getSessionsForDate(date: string): Promise<FocusSession[]> {
    const targetDate = new Date(date);
    const sessions = await this.getSessions();
    return sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate.toDateString() === targetDate.toDateString();
    });
  }

  async getSessionStats(days: number = 7): Promise<{
    totalSessions: number;
    totalMinutes: number;
    avgFocusScore: number;
    avgContextSwitches: number;
  }> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentSessions = await this.getSessions();
    const filteredSessions = recentSessions.filter(s => s.startTime >= cutoff);

    return {
      totalSessions: filteredSessions.length,
      totalMinutes: filteredSessions.reduce((sum, s) => sum + (s.actualDuration || s.plannedDuration), 0) / (1000 * 60),
      avgFocusScore: filteredSessions.length > 0
        ? filteredSessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / filteredSessions.length
        : 0,
      avgContextSwitches: filteredSessions.length > 0
        ? filteredSessions.reduce((sum, s) => sum + (s.contextSwitches || 0), 0) / filteredSessions.length
        : 0
    };
  }

  // ==================== ENERGY LOGS ====================

  getEnergyLogs(): EnergyLog[] {
    const data = localStorage.getItem(this.KEYS.ENERGY_LOGS);
    return data ? JSON.parse(data) : [];
  }

  saveEnergyLog(log: EnergyLog): void {
    const logs = this.getEnergyLogs();
    logs.push(log);
    // Keep only last 30 days
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = logs.filter(l => l.timestamp >= cutoff);
    localStorage.setItem(this.KEYS.ENERGY_LOGS, JSON.stringify(filtered));
    this.updateDailyStats();
  }

  getEnergyLogsForDate(date: string): EnergyLog[] {
    const targetDate = new Date(date);
    return this.getEnergyLogs().filter(l => {
      const logDate = new Date(l.timestamp);
      return logDate.toDateString() === targetDate.toDateString();
    });
  }

  getAverageEnergyByHour(): { [hour: number]: number } {
    const logs = this.getEnergyLogs();
    const byHour: { [hour: number]: number[] } = {};

    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (!byHour[hour]) byHour[hour] = [];
      byHour[hour].push(log.level);
    });

    const averages: { [hour: number]: number } = {};
    Object.keys(byHour).forEach(hour => {
      const levels = byHour[parseInt(hour)];
      averages[parseInt(hour)] = levels.reduce((a, b) => a + b, 0) / levels.length;
    });

    return averages;
  }

  // ==================== WORKSPACE PRESETS ====================

  getWorkspaces(): WorkspacePreset[] {
    const data = localStorage.getItem(this.KEYS.WORKSPACES);
    return data ? JSON.parse(data) : this.getDefaultWorkspaces();
  }

  saveWorkspace(workspace: WorkspacePreset): void {
    const workspaces = this.getWorkspaces();
    const index = workspaces.findIndex(w => w.id === workspace.id);
    if (index >= 0) {
      workspaces[index] = workspace;
    } else {
      workspaces.push(workspace);
    }
    localStorage.setItem(this.KEYS.WORKSPACES, JSON.stringify(workspaces));
  }

  deleteWorkspace(workspaceId: string): void {
    const workspaces = this.getWorkspaces().filter(w => w.id !== workspaceId);
    localStorage.setItem(this.KEYS.WORKSPACES, JSON.stringify(workspaces));
  }

  private getDefaultWorkspaces(): WorkspacePreset[] {
    return [
      {
        id: 'default-1',
        name: 'Deep Work',
        description: 'Focus mode for complex tasks',
        icon: '🎯',
        apps: [
          { name: 'VS Code', url: 'vscode://open' },
          { name: 'Figma', url: 'https://figma.com' }
        ],
        tasks: [],
        createdAt: Date.now()
      },
      {
        id: 'default-2',
        name: 'Writing Flow',
        description: 'Distraction-free writing',
        icon: '✍️',
        apps: [
          { name: 'Notion', url: 'https://notion.so' },
          { name: 'Docs', url: 'https://docs.google.com' }
        ],
        tasks: [],
        createdAt: Date.now()
      }
    ];
  }

  // ==================== USER PROFILE ====================

  /**
   * Get user profile from localStorage
   * @returns UserProfile object or empty profile
   * 
   * NOTE: This is DEPRECATED - profile is now managed by Supabase
   * This method exists only for backwards compatibility
   */
  getProfile(): UserProfile {
    // Silent cleanup of old data without warnings
    const oldData = localStorage.getItem(this.KEYS.PROFILE);
    if (oldData) {
      localStorage.removeItem(this.KEYS.PROFILE);
    }
    // Return empty profile - NO static data
    return {
      name: '',
      workStyle: 'cyclic',
      focusBaseline: 75,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferences: {
        enableNotifications: true,
        enableNudges: true,
        autoStartSessions: false,
        defaultSessionLength: 90
      }
    };
  }

  /**
   * Save complete user profile to localStorage
   * @param profile - Complete UserProfile object to save
   * 
   * NOTE: This is DEPRECATED and does nothing
   * Profile is now managed by Supabase ProfileContext
   */
  saveProfile(profile: UserProfile): void {
    // Silent no-op - profile now managed by Supabase ProfileContext
    // No localStorage write, no warning needed
  }

  /**
   * Update specific profile fields
   * @param updates - Partial UserProfile object with fields to update
   * 
   * NOTE: This is DEPRECATED and does nothing
   * Profile is now managed by Supabase ProfileContext
   */
  updateProfile(updates: Partial<UserProfile>): void {
    // Silent no-op - profile now managed by Supabase ProfileContext
    // No localStorage write, no warning needed
  }

  // ==================== DAILY STATS ====================

  getDailyStats(date: string): DailyStats {
    const allStats = this.getAllDailyStats();
    return allStats[date] || this.getEmptyDailyStats(date);
  }

  private getAllDailyStats(): { [date: string]: DailyStats } {
    const data = localStorage.getItem(this.KEYS.DAILY_STATS);
    return data ? JSON.parse(data) : {};
  }

  private getEmptyDailyStats(date: string): DailyStats {
    return {
      date,
      focusMinutes: 0,
      deepWorkMinutes: 0,
      tasksCompleted: 0,
      sessionsCount: 0,
      avgFocusScore: 0,
      avgEnergyLevel: 0,
      topTags: []
    };
  }

  private updateDailyStats(): void {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.calculateDailyStats(today);
    const allStats = this.getAllDailyStats();
    allStats[today] = stats;
    localStorage.setItem(this.KEYS.DAILY_STATS, JSON.stringify(allStats));
  }

  private calculateDailyStats(date: string): DailyStats {
    const sessions = this.getSessionsForDate(date);
    // Note: Task stats are no longer calculated here since tasks moved to Supabase
    // This method now only tracks session-based stats
    const energyLogs = this.getEnergyLogsForDate(date);

    const focusMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const deepWorkMinutes = sessions
      .filter(s => s.focusScore >= 75)
      .reduce((sum, s) => sum + s.duration, 0);

    const avgFocusScore = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length
      : 0;

    const avgEnergyLevel = energyLogs.length > 0
      ? energyLogs.reduce((sum, l) => sum + l.level, 0) / energyLogs.length
      : 0;

    return {
      date,
      focusMinutes,
      deepWorkMinutes,
      tasksCompleted: 0, // Tasks now tracked in Supabase
      sessionsCount: sessions.length,
      avgFocusScore,
      avgEnergyLevel,
      topTags: [] // Tags now tracked in Supabase
    };
  }

  // ==================== STREAKS ====================

  getStreak(): { current: number; longest: number; lastActive: string } {
    const data = localStorage.getItem(this.KEYS.STREAKS);
    const streak = data ? JSON.parse(data) : { current: 0, longest: 0, lastActive: '' };
    
    // Update streak based on today's activity
    const today = new Date().toISOString().split('T')[0];
    const todayStats = this.getDailyStats(today);
    
    if (todayStats.sessionsCount > 0) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (streak.lastActive === yesterday || streak.lastActive === today) {
        // Continue streak
        if (streak.lastActive !== today) {
          streak.current += 1;
        }
      } else if (streak.lastActive === '') {
        // First day
        streak.current = 1;
      } else {
        // Streak broken
        streak.current = 1;
      }
      
      streak.lastActive = today;
      streak.longest = Math.max(streak.longest, streak.current);
      localStorage.setItem(this.KEYS.STREAKS, JSON.stringify(streak));
    }
    
    return streak;
  }

  // ==================== BACKLOG ====================

  getBacklogItems(): BacklogItem[] {
    const data = localStorage.getItem(this.KEYS.BACKLOG);
    return data ? JSON.parse(data) : this.getDefaultBacklogItems();
  }

  private getDefaultBacklogItems(): BacklogItem[] {
    return [
      {
        id: '1',
        title: 'Quarterly Review Deck',
        description: 'Compile Q3 analytics and draft key strategy points for Q4 roadmap.',
        priority: 'high',
        energyLevel: 'high',
        estimatedTime: '~2h est.',
        createdAt: Date.now()
      },
      {
        id: '2',
        title: 'Client Onboarding Flow',
        description: 'Review wireframes for the new signup process optimization.',
        priority: 'medium',
        energyLevel: 'medium',
        estimatedTime: '45m est.',
        createdAt: Date.now()
      },
      {
        id: '3',
        title: 'Update Brand Assets',
        description: 'Export new logos for social media profiles.',
        priority: 'low',
        energyLevel: 'low',
        estimatedTime: '15m est.',
        createdAt: Date.now()
      },
      {
        id: '4',
        title: 'Email Campaign Setup',
        description: 'Configure segmentation for the newsletter release.',
        priority: 'medium',
        energyLevel: 'medium',
        estimatedTime: '30m est.',
        createdAt: Date.now()
      }
    ];
  }

  saveBacklogItem(item: BacklogItem): void {
    const items = this.getBacklogItems();
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(this.KEYS.BACKLOG, JSON.stringify(items));
  }

  deleteBacklogItem(itemId: string): void {
    const items = this.getBacklogItems().filter(i => i.id !== itemId);
    localStorage.setItem(this.KEYS.BACKLOG, JSON.stringify(items));
  }

  // ==================== REMINDERS ====================

  getReminders(): Reminder[] {
    const data = localStorage.getItem(this.KEYS.REMINDERS);
    return data ? JSON.parse(data) : this.getDefaultReminders();
  }

  private getDefaultReminders(): Reminder[] {
    return [
      {
        id: '1',
        title: 'Review Q4 Marketing Strategy',
        description: 'Include update on social media metrics.',
        time: '14:00',
        completed: false,
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: '2',
        title: 'Team Standup',
        description: 'Prepare updates on the dashboard UI.',
        time: '15:30',
        completed: false,
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: '3',
        title: 'Submit Weekly Report',
        description: 'End-of-week documentation.',
        time: '17:00',
        completed: false,
        isRecurring: true,
        createdAt: Date.now()
      }
    ];
  }

  saveReminder(reminder: Reminder): void {
    const reminders = this.getReminders();
    const index = reminders.findIndex(r => r.id === reminder.id);
    if (index >= 0) {
      reminders[index] = reminder;
    } else {
      reminders.push(reminder);
    }
    localStorage.setItem(this.KEYS.REMINDERS, JSON.stringify(reminders));
  }

  deleteReminder(reminderId: string): void {
    const reminders = this.getReminders().filter(r => r.id !== reminderId);
    localStorage.setItem(this.KEYS.REMINDERS, JSON.stringify(reminders));
  }

  toggleReminderComplete(reminderId: string): void {
    const reminders = this.getReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.completed = !reminder.completed;
      localStorage.setItem(this.KEYS.REMINDERS, JSON.stringify(reminders));
    }
  }

  // ==================== CALENDAR EVENTS ====================

  async createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<void> {
    // For now, store in localStorage
    // TODO: Move to Supabase calendar_events table
    const events = this.getCalendarEvents();
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}`,
      createdAt: new Date()
    };
    events.push(newEvent);
    localStorage.setItem(this.KEYS.CALENDAR_EVENTS, JSON.stringify(events));
  }

  getCalendarEvents(): CalendarEvent[] {
    const data = localStorage.getItem(this.KEYS.CALENDAR_EVENTS);
    return data ? JSON.parse(data) : this.getDefaultCalendarEvents();
  }

  private getDefaultCalendarEvents(): CalendarEvent[] {
    return [
      {
        id: '1',
        title: 'Project Kickoff Meeting',
        date: '2023-10-01',
        time: '10:00',
        duration: 60,
        type: 'meeting',
        link: 'https://zoom.us/j/1234567890',
        userId: 'user123',
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Product Launch Deadline',
        date: '2023-10-15',
        type: 'deadline',
        userId: 'user123',
        createdAt: new Date()
      },
      {
        id: '3',
        title: 'Team Lunch',
        date: '2023-10-20',
        time: '12:00',
        duration: 90,
        type: 'event',
        userId: 'user123',
        createdAt: new Date()
      }
    ];
  }

  saveCalendarEvent(event: CalendarEvent): void {
    const events = this.getCalendarEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }
    localStorage.setItem(this.KEYS.CALENDAR_EVENTS, JSON.stringify(events));
  }

  deleteCalendarEvent(eventId: string): void {
    const events = this.getCalendarEvents().filter(e => e.id !== eventId);
    localStorage.setItem(this.KEYS.CALENDAR_EVENTS, JSON.stringify(events));
  }

  // ==================== EXPORT / IMPORT ====================

  exportData(): string {
    const data = {
      // Note: Tasks are excluded as they're now in Supabase
      sessions: this.getSessions(),
      energyLogs: this.getEnergyLogs(),
      workspaces: this.getWorkspaces(),
      profile: this.getProfile(),
      dailyStats: this.getAllDailyStats(),
      backlogItems: this.getBacklogItems(),
      reminders: this.getReminders(),
      calendarEvents: this.getCalendarEvents(),
      exportedAt: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      // Note: Task import is skipped as tasks are now in Supabase
      if (data.sessions) localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(data.sessions));
      if (data.energyLogs) localStorage.setItem(this.KEYS.ENERGY_LOGS, JSON.stringify(data.energyLogs));
      if (data.workspaces) localStorage.setItem(this.KEYS.WORKSPACES, JSON.stringify(data.workspaces));
      if (data.profile) localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(data.profile));
      if (data.dailyStats) localStorage.setItem(this.KEYS.DAILY_STATS, JSON.stringify(data.dailyStats));
      if (data.backlogItems) localStorage.setItem(this.KEYS.BACKLOG, JSON.stringify(data.backlogItems));
      if (data.reminders) localStorage.setItem(this.KEYS.REMINDERS, JSON.stringify(data.reminders));
      if (data.calendarEvents) localStorage.setItem(this.KEYS.CALENDAR_EVENTS, JSON.stringify(data.calendarEvents));
      
      console.log('✅ Data imported successfully');
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      throw new Error('Invalid data format');
    }
  }

  clearAllData(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ All data cleared');
  }
}

export const storageService = new StorageService();