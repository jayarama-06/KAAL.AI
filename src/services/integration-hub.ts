/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAAL Integration Hub                                        ║
 * ║                                                              ║
 * ║  Connects to external services and makes their data          ║
 * ║  available to the context engine and agent actions.          ║
 * ║                                                              ║
 * ║  Integrations:                                               ║
 * ║    • Spotify Web API (mood/focus signal)                     ║
 * ║    • Google Calendar API (schedule + meeting prep)           ║
 * ║    • Gmail API (email urgency + drafting)                    ║
 * ║    • Notion API (project/task sync)                          ║
 * ║    • Google Drive (doc creation)                             ║
 * ║    • Slack (notifications)                                   ║
 * ║                                                              ║
 * ║  Each integration:                                           ║
 * ║    - Has an OAuth connection flow                            ║
 * ║    - Falls back to demo data when disconnected               ║
 * ║    - Exposes a typed data interface                          ║
 * ║    - Reports connection status + last sync time              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─── Shared types ─────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'demo';

export interface IntegrationMeta {
  id: string;
  name: string;
  description: string;
  icon: string;   // emoji
  color: string;  // hex
  status: ConnectionStatus;
  lastSynced: Date | null;
  scopes: string[];
  capabilities: string[];
  oauthUrl?: string;
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

export interface SpotifyState {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  albumArt: string;
  trackTempo: number;       // BPM — high = energetic, low = calm
  trackValence: number;     // 0-1 — happiness
  trackEnergy: number;      // 0-1 — intensity
  playlistName: string | null;
  /** KAAL's inferred focus state from track characteristics */
  focusSignal: 'deep_focus' | 'light_focus' | 'distracted' | 'energising' | 'relaxing';
  progressPct: number;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;   // ISO string
  end: string;
  isAllDay: boolean;
  meetingLink?: string;
  attendees: string[];
  calendarId: string;
  description?: string;
  colorId?: string;
  /** KAAL-derived: how much prep time this event needs */
  prepMinutes: number;
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
  isUrgent: boolean;
  needsResponse: boolean;
  labels: string[];
}

export interface EmailDigest {
  unreadCount: number;
  urgentCount: number;
  needsResponseCount: number;
  threads: EmailThread[];
  lastFetched: Date;
  /** KAAL-drafted reply subjects queued for approval */
  draftsPending: number;
}

// ─── Notion ───────────────────────────────────────────────────────────────────

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
  dbName: string;
  status?: string;
  assignee?: string;
}

export interface NotionActivity {
  recentPages: NotionPage[];
  pendingActionItems: number;
  stalePagesCount: number; // pages not edited in >7 days
  lastSynced: Date;
}

// ─── Integration Hub class ────────────────────────────────────────────────────

const STORAGE_KEY = 'kaal_integrations';

function loadTokens(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveTokens(tokens: Record<string, any>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens)); } catch {}
}

class IntegrationHub {

  // ── Integration registry ──────────────────────────────────────────────────

  getAll(): IntegrationMeta[] {
    const tokens = loadTokens();
    return [
      {
        id: 'google_calendar',
        name: 'Google Calendar',
        description: 'Read your schedule, detect free windows, prep for meetings',
        icon: '📅',
        color: '#4285F4',
        status: tokens.google_calendar ? 'connected' : 'demo',
        lastSynced: tokens.google_calendar?.lastSynced ? new Date(tokens.google_calendar.lastSynced) : null,
        scopes: ['calendar.readonly'],
        capabilities: ['View upcoming events', 'Detect focus windows', 'Pre-meeting briefings', 'Auto-block deep work'],
        oauthUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback/google')}&scope=https://www.googleapis.com/auth/calendar.readonly&response_type=code&access_type=offline`,
      },
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Triage inbox, draft replies, surface urgent threads',
        icon: '📧',
        color: '#EA4335',
        status: tokens.gmail ? 'connected' : 'demo',
        lastSynced: tokens.gmail?.lastSynced ? new Date(tokens.gmail.lastSynced) : null,
        scopes: ['gmail.readonly', 'gmail.compose'],
        capabilities: ['Urgency triage', 'Draft replies', 'Daily digest', 'Unsubscribe suggestions'],
        oauthUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback/google')}&scope=https://www.googleapis.com/auth/gmail.readonly+https://www.googleapis.com/auth/gmail.compose&response_type=code&access_type=offline`,
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'Sync action items, create pages, update databases',
        icon: '📝',
        color: '#000000',
        status: tokens.notion ? 'connected' : 'demo',
        lastSynced: tokens.notion?.lastSynced ? new Date(tokens.notion.lastSynced) : null,
        scopes: ['read_content', 'update_content', 'insert_content'],
        capabilities: ['Sync tasks from databases', 'Create meeting notes', 'Update project status', 'Pull action items'],
        oauthUrl: `https://api.notion.com/v1/oauth/authorize?client_id=YOUR_NOTION_CLIENT_ID&response_type=code&owner=user&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback/notion')}`,
      },
      {
        id: 'spotify',
        name: 'Spotify',
        description: 'Use your listening habits as focus and energy signals',
        icon: '🎵',
        color: '#1DB954',
        status: tokens.spotify ? 'connected' : 'demo',
        lastSynced: tokens.spotify?.lastSynced ? new Date(tokens.spotify.lastSynced) : null,
        scopes: ['user-read-currently-playing', 'user-read-playback-state'],
        capabilities: ['Focus signal from playlist', 'Energy detection from BPM', 'DND from focus playlists', 'Mood inference'],
        oauthUrl: `https://accounts.spotify.com/authorize?client_id=YOUR_SPOTIFY_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback/spotify')}&scope=user-read-currently-playing+user-read-playback-state`,
      },
      {
        id: 'google_drive',
        name: 'Google Drive',
        description: 'Create docs, attach files to tasks, generate reports',
        icon: '📁',
        color: '#0F9D58',
        status: tokens.google_drive ? 'connected' : 'disconnected',
        lastSynced: null,
        scopes: ['drive.file'],
        capabilities: ['Create meeting notes docs', 'Attach files to tasks', 'Generate weekly reports'],
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Surface important messages, set DND, post updates',
        icon: '💬',
        color: '#4A154B',
        status: tokens.slack ? 'connected' : 'disconnected',
        lastSynced: null,
        scopes: ['channels:read', 'chat:write', 'dnd:write'],
        capabilities: ['Triage important messages', 'Auto DND during focus', 'Post standup updates'],
      },
    ];
  }

  connect(integrationId: string) {
    const meta = this.getAll().find(i => i.id === integrationId);
    if (!meta?.oauthUrl) {
      // Simulate connection for demo
      const tokens = loadTokens();
      tokens[integrationId] = { connectedAt: new Date().toISOString(), demo: true, lastSynced: new Date().toISOString() };
      saveTokens(tokens);
      return;
    }
    // Real OAuth: open popup
    const popup = window.open(meta.oauthUrl, 'oauth', 'width=500,height=600,scrollbars=yes');
    // In production: listen for postMessage from callback page
  }

  disconnect(integrationId: string) {
    const tokens = loadTokens();
    delete tokens[integrationId];
    saveTokens(tokens);
  }

  isConnected(id: string): boolean {
    return !!loadTokens()[id];
  }

  // ── Spotify ───────────────────────────────────────────────────────────────

  async getSpotifyState(): Promise<SpotifyState | null> {
    const tokens = loadTokens();
    if (!tokens.spotify) return this._demoSpotifyState();

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${tokens.spotify.accessToken}` },
      });
      if (!res.ok || res.status === 204) return null;
      const data = await res.json();
      if (!data?.item) return null;

      const features = data.item.audio_features || {};
      return {
        isPlaying: data.is_playing,
        trackName: data.item.name,
        artistName: data.item.artists?.[0]?.name ?? '',
        albumArt: data.item.album?.images?.[0]?.url ?? '',
        trackTempo: features.tempo || 110,
        trackValence: features.valence || 0.5,
        trackEnergy: features.energy || 0.5,
        playlistName: data.context?.type === 'playlist' ? (data.context.uri?.split(':').pop() ?? null) : null,
        focusSignal: this._deriveSpotifyFocusSignal(features),
        progressPct: data.item.duration_ms > 0 ? (data.progress_ms / data.item.duration_ms) * 100 : 0,
      };
    } catch {
      return this._demoSpotifyState();
    }
  }

  private _deriveSpotifyFocusSignal(features: any): SpotifyState['focusSignal'] {
    const { tempo = 110, energy = 0.5, valence = 0.5, instrumentalness = 0 } = features;
    if (instrumentalness > 0.5 && tempo > 60 && tempo < 130) return 'deep_focus';
    if (tempo > 130 && energy > 0.7) return 'energising';
    if (tempo < 80 && energy < 0.4) return 'relaxing';
    if (energy > 0.6 && valence > 0.5) return 'light_focus';
    return 'distracted';
  }

  private _demoSpotifyState(): SpotifyState {
    const demos: SpotifyState[] = [
      { isPlaying: true, trackName: 'Weightless', artistName: 'Marconi Union', albumArt: '', trackTempo: 65, trackValence: 0.4, trackEnergy: 0.2, playlistName: 'Deep Focus', focusSignal: 'deep_focus', progressPct: 42 },
      { isPlaying: true, trackName: 'Intro', artistName: 'The xx', albumArt: '', trackTempo: 120, trackValence: 0.3, trackEnergy: 0.4, playlistName: 'Late Night Study', focusSignal: 'light_focus', progressPct: 18 },
      { isPlaying: false, trackName: '', artistName: '', albumArt: '', trackTempo: 0, trackValence: 0, trackEnergy: 0, playlistName: null, focusSignal: 'relaxing', progressPct: 0 },
    ];
    const hour = new Date().getHours();
    return demos[hour % demos.length];
  }

  // ── Google Calendar ───────────────────────────────────────────────────────

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const tokens = loadTokens();
    if (!tokens.google_calendar) return this._demoCalendarEvents();

    try {
      const now = new Date();
      const end = new Date(now); end.setHours(23, 59, 59);
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${tokens.google_calendar.accessToken}` } }
      );
      if (!res.ok) return this._demoCalendarEvents();
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.summary || '(No title)',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        isAllDay: !item.start?.dateTime,
        meetingLink: item.hangoutLink || item.location,
        attendees: (item.attendees || []).map((a: any) => a.email),
        calendarId: 'primary',
        description: item.description,
        prepMinutes: (item.attendees?.length || 0) > 3 ? 15 : 5,
      }));
    } catch {
      return this._demoCalendarEvents();
    }
  }

  private _demoCalendarEvents(): CalendarEvent[] {
    const now = new Date();
    const addMin = (m: number) => new Date(now.getTime() + m * 60000).toISOString();
    return [
      { id: 'e1', title: 'Product Sync', start: addMin(47), end: addMin(107), isAllDay: false, attendees: ['alex@co.com', 'sam@co.com'], calendarId: 'primary', prepMinutes: 10 },
      { id: 'e2', title: 'Q3 Planning', start: addMin(185), end: addMin(245), isAllDay: false, attendees: ['alex@co.com'], calendarId: 'primary', prepMinutes: 15 },
      { id: 'e3', title: 'Deep Work Block', start: addMin(300), end: addMin(420), isAllDay: false, attendees: [], calendarId: 'primary', prepMinutes: 0 },
    ];
  }

  // ── Gmail ─────────────────────────────────────────────────────────────────

  async getEmailDigest(): Promise<EmailDigest | null> {
    const tokens = loadTokens();
    if (!tokens.gmail) return this._demoEmailDigest();

    try {
      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=20&q=is:unread',
        { headers: { Authorization: `Bearer ${tokens.gmail.accessToken}` } }
      );
      if (!res.ok) return this._demoEmailDigest();
      const data = await res.json();
      const threads: EmailThread[] = (data.threads || []).slice(0, 10).map((t: any) => ({
        id: t.id,
        subject: '(Loading...)',
        from: '',
        snippet: t.snippet || '',
        receivedAt: new Date().toISOString(),
        isUnread: true,
        isUrgent: /urgent|asap|critical|deadline/i.test(t.snippet || ''),
        needsResponse: /can you|could you|please|\?/i.test(t.snippet || ''),
        labels: [],
      }));
      return {
        unreadCount: threads.length,
        urgentCount: threads.filter(t => t.isUrgent).length,
        needsResponseCount: threads.filter(t => t.needsResponse).length,
        threads,
        lastFetched: new Date(),
        draftsPending: 0,
      };
    } catch {
      return this._demoEmailDigest();
    }
  }

  private _demoEmailDigest(): EmailDigest {
    return {
      unreadCount: 14,
      urgentCount: 2,
      needsResponseCount: 5,
      threads: [
        { id: 't1', subject: 'URGENT: Q3 budget sign-off', from: 'cfo@company.com', snippet: 'Need your approval by EOD today...', receivedAt: new Date(Date.now() - 3600000).toISOString(), isUnread: true, isUrgent: true, needsResponse: true, labels: ['INBOX'] },
        { id: 't2', subject: 'Re: Product roadmap review', from: 'pm@company.com', snippet: 'Can you review the updated deck before our 3pm?', receivedAt: new Date(Date.now() - 7200000).toISOString(), isUnread: true, isUrgent: false, needsResponse: true, labels: ['INBOX'] },
        { id: 't3', subject: 'Design feedback requested', from: 'design@company.com', snippet: 'Hi — could you take a look when you have a moment?', receivedAt: new Date(Date.now() - 14400000).toISOString(), isUnread: true, isUrgent: false, needsResponse: true, labels: ['INBOX'] },
      ],
      lastFetched: new Date(),
      draftsPending: 2,
    };
  }

  // ── Notion ────────────────────────────────────────────────────────────────

  async getNotionActivity(): Promise<NotionActivity | null> {
    const tokens = loadTokens();
    if (!tokens.notion) return this._demoNotionActivity();

    try {
      const res = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.notion.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sort: { direction: 'descending', timestamp: 'last_edited_time' }, page_size: 10 }),
      });
      if (!res.ok) return this._demoNotionActivity();
      const data = await res.json();
      const pages: NotionPage[] = (data.results || []).map((p: any) => ({
        id: p.id,
        title: p.properties?.title?.title?.[0]?.plain_text || p.properties?.Name?.title?.[0]?.plain_text || '(Untitled)',
        url: p.url,
        lastEdited: p.last_edited_time,
        dbName: p.parent?.database_id ? 'Database' : 'Page',
        status: p.properties?.Status?.select?.name,
        assignee: p.properties?.Assignee?.people?.[0]?.name,
      }));
      return { recentPages: pages, pendingActionItems: pages.filter(p => p.status === 'In Progress').length, stalePagesCount: 0, lastSynced: new Date() };
    } catch {
      return this._demoNotionActivity();
    }
  }

  private _demoNotionActivity(): NotionActivity {
    return {
      recentPages: [
        { id: 'n1', title: 'Q3 Product Roadmap', url: '#', lastEdited: new Date(Date.now() - 86400000 * 2).toISOString(), dbName: 'Projects', status: 'In Progress' },
        { id: 'n2', title: 'Team Meeting Notes — Aug 12', url: '#', lastEdited: new Date(Date.now() - 86400000).toISOString(), dbName: 'Meetings', status: 'Done' },
        { id: 'n3', title: 'Sprint 24 Action Items', url: '#', lastEdited: new Date(Date.now() - 3600000 * 5).toISOString(), dbName: 'Tasks', status: 'In Progress' },
      ],
      pendingActionItems: 7,
      stalePagesCount: 3,
      lastSynced: new Date(),
    };
  }
}

export const integrationHub = new IntegrationHub();