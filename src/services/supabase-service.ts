import { supabase } from './supabase-client';
import { EnergyLog } from '../hooks/useEnergyHub';
import { FocusSession } from './storage-service';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getCurrentUserId(): string {
  // NOTE: This sync version is kept for legacy callers but all new code
  // should use await supabase.auth.getUser() directly.
  // This function returns a placeholder — async callers bypass it.
  throw new Error('Use await supabase.auth.getUser() directly');
}

// CamelCase to snake_case converter
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

// snake_case to camelCase converter
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

// =====================================================
// ENERGY LOGS SERVICE
// =====================================================

export const energyLogsService = {
  async getAll(): Promise<EnergyLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('energy_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(log: Omit<EnergyLog, 'id'>): Promise<EnergyLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('energy_logs')
      .insert(toSnakeCase({
        userId: user.id,
        ...log
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: Partial<EnergyLog>): Promise<void> {
    const { error } = await supabase
      .from('energy_logs')
      .update(toSnakeCase(updates))
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('energy_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// =====================================================
// FOCUS SESSIONS SERVICE
// =====================================================

export const focusSessionsService = {
  async getAll(): Promise<FocusSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(toSnakeCase({
        userId: user.id,
        ...session
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(sessionId: string, updates: Partial<FocusSession>): Promise<void> {
    const { error } = await supabase
      .from('focus_sessions')
      .update(toSnakeCase(updates))
      .eq('session_id', sessionId);

    if (error) throw error;
  },

  async delete(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
  },

  async getActiveSession(): Promise<FocusSession | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  }
};

// =====================================================
// SAVE STATES SERVICE
// =====================================================

export interface SaveState {
  id?: string;
  userId?: string;
  stateId: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  createdAtTs: number;
  lastUsedAt?: number;
  usageCount: number;
  settings: any;
  metadata?: any;
}

export interface StateUsageLog {
  id?: string;
  userId?: string;
  logId: string;
  stateId: string;
  stateName: string;
  startTime: number;
  endTime?: number;
  duration: number;
  focusScore?: number;
  isActive: boolean;
}

export const saveStatesService = {
  async getAll(): Promise<SaveState[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('save_states')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at_ts', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(state: Omit<SaveState, 'id' | 'userId'>): Promise<SaveState> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('save_states')
      .insert(toSnakeCase({
        userId: user.id,
        ...state
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(stateId: string, updates: Partial<SaveState>): Promise<void> {
    const { error } = await supabase
      .from('save_states')
      .update(toSnakeCase(updates))
      .eq('state_id', stateId);

    if (error) throw error;
  },

  async delete(stateId: string): Promise<void> {
    const { error } = await supabase
      .from('save_states')
      .delete()
      .eq('state_id', stateId);

    if (error) throw error;
  },

  // Usage Logs
  async getAllUsageLogs(): Promise<StateUsageLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('state_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async createUsageLog(log: Omit<StateUsageLog, 'id' | 'userId'>): Promise<StateUsageLog> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('state_usage_logs')
      .insert(toSnakeCase({
        userId: user.id,
        ...log
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async updateUsageLog(logId: string, updates: Partial<StateUsageLog>): Promise<void> {
    const { error } = await supabase
      .from('state_usage_logs')
      .update(toSnakeCase(updates))
      .eq('log_id', logId);

    if (error) throw error;
  }
};

// =====================================================
// REMINDERS SERVICE
// =====================================================

export interface Reminder {
  id?: string;
  userId?: string;
  reminderId: string;
  title: string;
  description?: string;
  dueDate: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  recurring?: string;
  notificationSent?: boolean;
}

export const remindersService = {
  async getAll(): Promise<Reminder[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(reminder: Omit<Reminder, 'id' | 'userId'>): Promise<Reminder> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reminders')
      .insert(toSnakeCase({
        userId: user.id,
        ...reminder
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(reminderId: string, updates: Partial<Reminder>): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .update(toSnakeCase(updates))
      .eq('reminder_id', reminderId);

    if (error) throw error;
  },

  async delete(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('reminder_id', reminderId);

    if (error) throw error;
  }
};

// =====================================================
// BACKLOG SERVICE
// =====================================================

export interface BacklogItem {
  id?: string;
  userId?: string;
  itemId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAtTs: number;
}

export const backlogService = {
  async getAll(): Promise<BacklogItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('backlog_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at_ts', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(item: Omit<BacklogItem, 'id' | 'userId'>): Promise<BacklogItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('backlog_items')
      .insert(toSnakeCase({
        userId: user.id,
        ...item
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(itemId: string, updates: Partial<BacklogItem>): Promise<void> {
    const { error } = await supabase
      .from('backlog_items')
      .update(toSnakeCase(updates))
      .eq('item_id', itemId);

    if (error) throw error;
  },

  async delete(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('backlog_items')
      .delete()
      .eq('item_id', itemId);

    if (error) throw error;
  }
};

// =====================================================
// CALENDAR EVENTS SERVICE
// =====================================================

export interface CalendarEvent {
  id?: string;
  userId?: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  location?: string;
  attendees: string[];
  color?: string;
  category?: string;
  reminderMinutes?: number;
  recurrenceRule?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  externalId?: string;
  externalProvider?: string;
}

export const CalendarEventsService = {
  async getAll(): Promise<CalendarEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        // Silent mode: Only log in debug mode for optional proactive intelligence features
        if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
          if (false) { // debug logging removed — no import.meta.env in Figma Make
            console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
          }
          return [];
        }
        throw error;
      }
      return toCamelCase(data || []);
    } catch (error: any) {
      // Silent mode for table not found errors
      if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
        if (false) { // debug logging removed
          console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
        }
        return [];
      }
      throw error;
    }
  },

  async getByDateRange(startDate: number, endDate: number): Promise<CalendarEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true });

      if (error) {
        // Silent mode: Only log in debug mode
        if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
          if (false) { // debug logging removed
            console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
          }
          return [];
        }
        throw error;
      }
      return toCamelCase(data || []);
    } catch (error: any) {
      if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
        if (false) { // debug logging removed
          console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
        }
        return [];
      }
      throw error;
    }
  },

  async create(event: Omit<CalendarEvent, 'id' | 'userId'>): Promise<CalendarEvent | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(toSnakeCase({
          userId: user.id,
          ...event
        }))
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
          if (false) { // debug logging removed
            console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
          }
          return null;
        }
        throw error;
      }
      return toCamelCase(data);
    } catch (error: any) {
      if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
        if (false) { // debug logging removed
          console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
        }
        return null;
      }
      throw error;
    }
  },

  async update(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(toSnakeCase(updates))
        .eq('event_id', eventId);

      if (error) {
        if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
          if (false) { // debug logging removed
            console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
          }
          return;
        }
        throw error;
      }
    } catch (error: any) {
      if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
        if (false) { // debug logging removed
          console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
        }
        return;
      }
      throw error;
    }
  },

  async delete(eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('event_id', eventId);

      if (error) {
        if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
          if (false) { // debug logging removed
            console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
          }
          return;
        }
        throw error;
      }
    } catch (error: any) {
      if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
        if (false) { // debug logging removed
          console.info('ℹ️ Calendar events: Database table not found (optional proactive intelligence feature)');
        }
        return;
      }
      throw error;
    }
  }
};

// =====================================================
// MEETINGS SERVICE
// =====================================================

export interface Meeting {
  id?: string;
  userId?: string;
  meetingId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  participants: string[];
  meetingLink?: string;
  notes?: string;
  actionItems: any[];
  recordingUrl?: string;
  transcript?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
}

export const meetingsService = {
  async getAll(): Promise<Meeting[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(meeting: Omit<Meeting, 'id' | 'userId'>): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('meetings')
      .insert(toSnakeCase({
        userId: user.id,
        ...meeting
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(meetingId: string, updates: Partial<Meeting>): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .update(toSnakeCase(updates))
      .eq('meeting_id', meetingId);

    if (error) throw error;
  },

  async delete(meetingId: string): Promise<void> {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('meeting_id', meetingId);

    if (error) throw error;
  }
};

// =====================================================
// WORKSPACES & PROJECTS SERVICE
// =====================================================

export interface Workspace {
  id?: string;
  userId?: string;
  workspaceId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  settings: any;
  isArchived: boolean;
}

export interface Project {
  id?: string;
  userId?: string;
  workspaceId?: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: number;
  dueDate?: number;
  completionPercentage: number;
  tags: string[];
  color?: string;
  icon?: string;
  members: string[];
  metadata: any;
}

export const workspacesService = {
  async getAll(): Promise<Workspace[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(workspace: Omit<Workspace, 'id' | 'userId'>): Promise<Workspace> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('workspaces')
      .insert(toSnakeCase({
        userId: user.id,
        ...workspace
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(workspaceId: string, updates: Partial<Workspace>): Promise<void> {
    const { error } = await supabase
      .from('workspaces')
      .update(toSnakeCase(updates))
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  },

  async delete(workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  }
};

export const projectsService = {
  async getAll(): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getByWorkspace(workspaceId: string): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(project: Omit<Project, 'id' | 'userId'>): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert(toSnakeCase({
        userId: user.id,
        ...project
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(projectId: string, updates: Partial<Project>): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update(toSnakeCase(updates))
      .eq('project_id', projectId);

    if (error) throw error;
  },

  async delete(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  }
};

// =====================================================
// SHARE LINKS SERVICE
// =====================================================

export interface ShareLink {
  id?: string;
  userId?: string;
  linkId: string;
  title: string;
  resourceType: string;
  resourceId: string;
  shortCode: string;
  accessLevel: 'view' | 'comment' | 'edit';
  passwordHash?: string;
  expiresAt?: number;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  metadata: any;
}

export const shareLinksService = {
  async getAll(): Promise<ShareLink[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(link: Omit<ShareLink, 'id' | 'userId'>): Promise<ShareLink> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('share_links')
      .insert(toSnakeCase({
        userId: user.id,
        ...link
      }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(linkId: string, updates: Partial<ShareLink>): Promise<void> {
    const { error } = await supabase
      .from('share_links')
      .update(toSnakeCase(updates))
      .eq('link_id', linkId);

    if (error) throw error;
  },

  async delete(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('link_id', linkId);

    if (error) throw error;
  },

  generateShortCode(): string {
    return Math.random().toString(36).substring(2, 10);
  }
};

// =====================================================
// STREAK DATA SERVICE
// =====================================================

export const streakService = {
  async updateTodayStreak(focusMinutes: number, tasksCompleted: number, energyLogsCount: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const isActiveDay = focusMinutes >= 30 || tasksCompleted > 0;

    const { error } = await supabase
      .from('streak_data')
      .upsert({
        user_id: user.id,
        date: today,
        focus_minutes: focusMinutes,
        tasks_completed: tasksCompleted,
        energy_logs_count: energyLogsCount,
        is_active_day: isActiveDay
      }, {
        onConflict: 'user_id,date'
      });

    if (error) throw error;
  },

  async getStreakData(): Promise<{ current: number; longest: number; lastActive: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { current: 0, longest: 0, lastActive: '' };

    const { data, error } = await supabase
      .from('streak_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active_day', true)
      .order('date', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { current: 0, longest: 0, lastActive: '' };

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < data.length; i++) {
      const recordDate = new Date(data[i].date);
      recordDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (recordDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < data.length; i++) {
      const prevDate = new Date(data[i - 1].date);
      const currDate = new Date(data[i].date);
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActive: data[0]?.date || ''
    };
  }
};

// =====================================================
// DATABASE STATUS & SETUP SERVICE
// =====================================================

export interface DatabaseStatus {
  configured: boolean;
  ready: boolean;
  tables: {
    [tableName: string]: boolean;
  };
  error?: string;
}

export const supabaseService = {
  async checkDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const tablesToCheck = [
        'profiles',
        'tasks',
        'energy_logs',
        'focus_sessions',
        'save_states',
        'state_usage_logs',
        'reminders',
        'backlog_items',
        'calendar_events',
        'meetings',
        'workspaces',
        'projects',
        'share_links',
        'streak_data'
      ];

      const tables: { [tableName: string]: boolean } = {};
      let allTablesExist = true;

      for (const tableName of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);

          tables[tableName] = !error;
          if (error) {
            allTablesExist = false;
          }
        } catch {
          tables[tableName] = false;
          allTablesExist = false;
        }
      }

      return {
        configured: true,
        ready: allTablesExist,
        tables
      };
    } catch (error) {
      return {
        configured: false,
        ready: false,
        tables: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async setupDatabase(): Promise<{ success: boolean; error?: string }> {
    // This method returns instructions since we can't run DDL from client
    return {
      success: false,
      error: 'Please run /supabase-schema.sql in Supabase SQL Editor to create tables'
    };
  }
};

export default {
  energyLogsService,
  focusSessionsService,
  saveStatesService,
  remindersService,
  backlogService,
  calendarEventsService: CalendarEventsService,
  meetingsService,
  workspacesService,
  projectsService,
  shareLinksService,
  streakService,
  supabaseService
};