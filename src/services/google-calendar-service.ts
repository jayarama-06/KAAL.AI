/**
 * Google Calendar Integration Service
 * Read-only access to fetch events and analyze schedule density
 */

import { supabase } from './supabase-client';

export interface CalendarEvent {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  timezone?: string;
  eventType?: 'meeting' | 'focus_block' | 'personal' | 'break' | 'other';
  attendeeCount: number;
  cognitiveLoad?: number; // 1-5
  energyRequired?: number; // 1-5
}

export interface ScheduleDensity {
  date: Date;
  hour: number;
  meetingMinutes: number;
  focusBlockMinutes: number;
  freeMinutes: number;
  totalCognitiveLoad: number;
  suitableForDeepWork: boolean;
  suitableForMeetings: boolean;
  optimalForBreaks: boolean;
}

class GoogleCalendarService {
  private readonly GOOGLE_CLIENT_ID: string | undefined;
  private readonly SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
  
  constructor() {
    // Google Calendar integration is optional — no import.meta.env needed
    this.GOOGLE_CLIENT_ID = '';  // Set via Supabase secrets or localStorage if needed
    
    // Silent mode: Only log in debug mode
    if (!this.GOOGLE_CLIENT_ID) {
      if (false) { // debug logging removed — no import.meta.env in Figma Make
        console.info('ℹ️ Google Calendar: Not configured (optional feature)');
      }
    } else {
      if (false) { // debug logging removed
        console.log('✅ Google Calendar service initialized');
      }
    }
  }
  
  /**
   * Initialize Google OAuth (call this when user clicks "Connect Calendar")
   */
  async connectGoogleCalendar(userId: string): Promise<{ success: boolean; error?: string }> {
    // Check if Google Client ID is configured
    if (!this.GOOGLE_CLIENT_ID) {
      return { 
        success: false, 
        error: 'Google Calendar not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.' 
      };
    }

    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
      return {
        success: false,
        error: 'Google Identity Services not loaded. Please refresh the page and try again.'
      };
    }

    try {
      // Use Google Identity Services for OAuth
      const client = google.accounts.oauth2.initTokenClient({
        client_id: this.GOOGLE_CLIENT_ID,
        scope: this.SCOPES,
        callback: async (response: any) => {
          if (response.error) {
            console.error('Google OAuth error:', response.error);
            return;
          }

          // Save connection to database
          await this.saveConnection(userId, response.access_token);
          
          // Immediately sync calendar
          await this.syncCalendar(userId);
        },
      });

      client.requestAccessToken();
      return { success: true };
    } catch (error) {
      console.error('Calendar connection error:', error);
      return { success: false, error: 'Failed to connect calendar' };
    }
  }

  /**
   * Save calendar connection to database
   */
  private async saveConnection(userId: string, accessToken: string): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

    try {
      const { error } = await supabase
        .from('calendar_connections')
        .upsert({
          user_id: userId,
          provider: 'google',
          access_token: accessToken,
          token_expiry: expiryDate.toISOString(),
          last_sync_at: new Date().toISOString(),
          sync_enabled: true,
        });

      if (error) {
        // Silent mode: Only log in debug mode for optional proactive intelligence features
        if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
          if (false) { // debug logging removed — no import.meta.env in Figma Make
            console.info('ℹ️ Calendar connections: Database table not found (optional proactive intelligence feature)');
          }
          return;
        }
        console.error('Error saving calendar connection:', error);
        throw error;
      }
    } catch (error: any) {
      if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
        if (false) { // debug logging removed
          console.info('ℹ️ Calendar connections: Database table not found (optional proactive intelligence feature)');
        }
        return;
      }
      throw error;
    }
  }

  /**
   * Sync calendar events from Google
   */
  async syncCalendar(userId: string): Promise<{ success: boolean; eventCount?: number }> {
    try {
      // Get connection
      const { data: connection, error: connError } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

      if (connError) {
        // Silent mode for table not found
        if (connError.code === 'PGRST204' || connError.code === '42P01' || connError.message?.includes('does not exist')) {
          if (false) { // debug logging removed
            console.info('ℹ️ Calendar connections: Database table not found (optional proactive intelligence feature)');
          }
          return { success: false };
        }
        return { success: false };
      }
      
      if (!connection) {
        return { success: false };
      }

      // Check if token is expired
      if (new Date(connection.token_expiry) < new Date()) {
        console.log('Token expired, need to re-authenticate');
        return { success: false };
      }

      // Fetch events from Google Calendar API
      const events = await this.fetchGoogleEvents(connection.access_token);

      // Save events to database
      await this.saveEvents(userId, connection.id, events);

      // Calculate schedule density
      await this.calculateScheduleDensity(userId);

      // Update last sync time
      try {
        await supabase
          .from('calendar_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', connection.id);
      } catch (error: any) {
        // Silent mode
        if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
          if (false) { // debug logging removed
            console.info('ℹ️ Calendar connections: Database table not found (optional proactive intelligence feature)');
          }
        }
      }

      return { success: true, eventCount: events.length };
    } catch (error: any) {
      // Silent mode for all proactive intelligence table errors
      if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
        if (false) { // debug logging removed
          console.info('ℹ️ Calendar sync: Database tables not found (optional proactive intelligence feature)');
        }
        return { success: false };
      }
      console.error('Calendar sync error:', error);
      return { success: false };
    }
  }

  /**
   * Fetch events from Google Calendar API
   */
  private async fetchGoogleEvents(accessToken: string): Promise<CalendarEvent[]> {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${now.toISOString()}` +
        `&timeMax=${sevenDaysLater.toISOString()}` +
        `&singleEvents=true` +
        `&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    
    return data.items.map((item: any) => this.parseGoogleEvent(item));
  }

  /**
   * Parse Google Calendar event
   */
  private parseGoogleEvent(googleEvent: any): CalendarEvent {
    const start = googleEvent.start.dateTime || googleEvent.start.date;
    const end = googleEvent.end.dateTime || googleEvent.end.date;
    const allDay = !googleEvent.start.dateTime;

    // Classify event type
    const eventType = this.classifyEvent(googleEvent);

    // Estimate cognitive load and energy required
    const { cognitiveLoad, energyRequired } = this.estimateEventLoad(googleEvent, eventType);

    return {
      id: crypto.randomUUID(),
      externalId: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      startTime: new Date(start),
      endTime: new Date(end),
      allDay,
      timezone: googleEvent.start.timeZone,
      eventType,
      attendeeCount: googleEvent.attendees?.length || 0,
      cognitiveLoad,
      energyRequired,
    };
  }

  /**
   * Classify event type based on title, attendees, etc.
   */
  private classifyEvent(googleEvent: any): CalendarEvent['eventType'] {
    const title = (googleEvent.summary || '').toLowerCase();
    const attendeeCount = googleEvent.attendees?.length || 0;

    // Focus blocks
    if (title.includes('focus') || title.includes('deep work') || title.includes('coding time')) {
      return 'focus_block';
    }

    // Breaks
    if (title.includes('break') || title.includes('lunch') || title.includes('gym')) {
      return 'break';
    }

    // Personal
    if (title.includes('personal') || title.includes('appointment') || title.includes('doctor')) {
      return 'personal';
    }

    // Meetings (has attendees)
    if (attendeeCount > 1) {
      return 'meeting';
    }

    return 'other';
  }

  /**
   * Estimate cognitive load and energy required for event
   */
  private estimateEventLoad(googleEvent: any, eventType: CalendarEvent['eventType']): {
    cognitiveLoad: number;
    energyRequired: number;
  } {
    const duration = googleEvent.end && googleEvent.start
      ? (new Date(googleEvent.end.dateTime || googleEvent.end.date).getTime() -
         new Date(googleEvent.start.dateTime || googleEvent.start.date).getTime()) /
        (1000 * 60)
      : 30;

    const attendeeCount = googleEvent.attendees?.length || 0;
    const title = (googleEvent.summary || '').toLowerCase();

    let cognitiveLoad = 3; // Default medium
    let energyRequired = 3;

    // Adjust based on event type
    switch (eventType) {
      case 'meeting':
        cognitiveLoad = attendeeCount > 5 ? 4 : 3;
        energyRequired = attendeeCount > 5 ? 4 : 3;
        break;
      case 'focus_block':
        cognitiveLoad = 5; // High cognitive load
        energyRequired = 4;
        break;
      case 'break':
        cognitiveLoad = 1;
        energyRequired = 1;
        break;
      case 'personal':
        cognitiveLoad = 2;
        energyRequired = 2;
        break;
    }

    // Adjust based on keywords
    if (title.includes('presentation') || title.includes('demo')) {
      cognitiveLoad = 5;
      energyRequired = 5;
    } else if (title.includes('1:1') || title.includes('one-on-one')) {
      cognitiveLoad = 3;
      energyRequired = 3;
    } else if (title.includes('standup') || title.includes('daily')) {
      cognitiveLoad = 2;
      energyRequired = 2;
    }

    // Long meetings are more draining
    if (duration > 60) {
      cognitiveLoad = Math.min(5, cognitiveLoad + 1);
      energyRequired = Math.min(5, energyRequired + 1);
    }

    return { cognitiveLoad, energyRequired };
  }

  /**
   * Save events to database
   */
  private async saveEvents(
    userId: string,
    connectionId: string,
    events: CalendarEvent[]
  ): Promise<void> {
    if (events.length === 0) return;

    const eventInserts = events.map((event) => ({
      user_id: userId,
      connection_id: connectionId,
      external_id: event.externalId,
      title: event.title,
      description: event.description,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      all_day: event.allDay,
      timezone: event.timezone,
      event_type: event.eventType,
      attendee_count: event.attendeeCount,
      cognitive_load: event.cognitiveLoad,
      energy_required: event.energyRequired,
    }));

    // Upsert events (update if exists, insert if new)
    const { error } = await supabase
      .from('calendar_events')
      .upsert(eventInserts, {
        onConflict: 'user_id,external_id',
      });

    if (error) {
      console.error('Error saving calendar events:', error);
      throw error;
    }
  }

  /**
   * Calculate schedule density for next 7 days
   */
  private async calculateScheduleDensity(userId: string): Promise<void> {
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Call database function to calculate density
      await supabase.rpc('calculate_schedule_density', {
        p_user_id: userId,
        p_date: date.toISOString().split('T')[0],
      });
    }
  }

  /**
   * Get schedule density for a specific date
   */
  async getScheduleDensity(userId: string, date: Date): Promise<ScheduleDensity[]> {
    const dateString = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('schedule_density')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateString)
      .order('hour');

    if (error) {
      console.error('Error fetching schedule density:', error);
      return [];
    }

    return (data || []).map((row) => ({
      date: new Date(row.date),
      hour: row.hour,
      meetingMinutes: row.meeting_minutes,
      focusBlockMinutes: row.focus_block_minutes,
      freeMinutes: row.free_minutes,
      totalCognitiveLoad: row.total_cognitive_load,
      suitableForDeepWork: row.suitable_for_deep_work,
      suitableForMeetings: row.suitable_for_meetings,
      optimalForBreaks: row.optimal_for_breaks,
    }));
  }

  /**
   * Get upcoming events (next 24 hours)
   */
  async getUpcomingEvents(userId: string): Promise<CalendarEvent[]> {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('deleted', false)
      .gte('start_time', now.toISOString())
      .lte('start_time', tomorrow.toISOString())
      .order('start_time');

    if (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      externalId: row.external_id,
      title: row.title,
      description: row.description,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      allDay: row.all_day,
      timezone: row.timezone,
      eventType: row.event_type,
      attendeeCount: row.attendee_count,
      cognitiveLoad: row.cognitive_load,
      energyRequired: row.energy_required,
    }));
  }

  /**
   * Find optimal deep work windows (free slots with low cognitive load nearby)
   */
  async findDeepWorkWindows(userId: string, date: Date): Promise<Array<{ hour: number; duration: number; score: number }>> {
    const density = await this.getScheduleDensity(userId, date);
    
    const windows: Array<{ hour: number; duration: number; score: number }> = [];
    
    let currentWindow: { hour: number; duration: number; score: number } | null = null;

    density.forEach((slot) => {
      // A slot is good for deep work if:
      // - It has >= 45 free minutes
      // - Low cognitive load before/after
      const isGoodSlot = slot.freeMinutes >= 45 && slot.totalCognitiveLoad < 3;

      if (isGoodSlot) {
        if (!currentWindow) {
          currentWindow = {
            hour: slot.hour,
            duration: slot.freeMinutes,
            score: 100 - slot.totalCognitiveLoad * 10,
          };
        } else {
          // Extend window
          currentWindow.duration += slot.freeMinutes;
          currentWindow.score += (100 - slot.totalCognitiveLoad * 10);
        }
      } else if (currentWindow) {
        // End of window
        windows.push(currentWindow);
        currentWindow = null;
      }
    });

    // Add last window if exists
    if (currentWindow) {
      windows.push(currentWindow);
    }

    // Sort by score (best windows first)
    return windows.sort((a, b) => b.score - a.score);
  }

  /**
   * Check if user has calendar connected
   */
  async hasCalendarConnected(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .eq('sync_enabled', true)
      .single();

    return !error && !!data;
  }

  /**
   * Disconnect calendar
   */
  async disconnectCalendar(userId: string): Promise<void> {
    await supabase
      .from('calendar_connections')
      .update({ sync_enabled: false })
      .eq('user_id', userId)
      .eq('provider', 'google');
  }
}

export const googleCalendar = new GoogleCalendarService();