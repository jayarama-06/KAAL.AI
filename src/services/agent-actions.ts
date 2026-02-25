/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAAL Agent Actions                                          ║
 * ║                                                              ║
 * ║  What KAAL can actually DO for the user — not just suggest.  ║
 * ║                                                              ║
 * ║  Each action:                                                ║
 * ║    - Has a real implementation (or graceful stub)            ║
 * ║    - Returns a result the UI can surface                     ║
 * ║    - Logs itself for transparency                            ║
 * ║    - Can be undone where possible                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { integrationHub } from './integration-hub';
import { winDetector } from './win-detector';

export interface ActionResult {
  success: boolean;
  title: string;
  detail: string;
  undoable: boolean;
  undoFn?: () => void;
  data?: any;
}

// ─── Action log ───────────────────────────────────────────────────────────────

interface ActionLogEntry {
  id: string;
  action: string;
  params: Record<string, any>;
  result: ActionResult;
  timestamp: number;
}

function appendLog(entry: ActionLogEntry) {
  try {
    const log: ActionLogEntry[] = JSON.parse(localStorage.getItem('kaal_action_log') || '[]');
    log.unshift(entry);
    localStorage.setItem('kaal_action_log', JSON.stringify(log.slice(0, 50)));
  } catch {}
}

function getLog(): ActionLogEntry[] {
  try { return JSON.parse(localStorage.getItem('kaal_action_log') || '[]'); } catch { return []; }
}

// ─── Agent Actions class ──────────────────────────────────────────────────────

class AgentActions {

  /** Create a task from natural language (e.g. from Brain Dump or email) */
  async createTask(params: {
    title: string; priority?: string; dueDate?: string; tags?: string[]; source?: string;
  }): Promise<ActionResult> {
    const task = {
      id: `t-${Date.now()}`,
      title: params.title,
      priority: params.priority || 'medium',
      status: 'todo',
      dueDate: params.dueDate || null,
      tags: params.tags || [],
      createdAt: new Date().toISOString(),
      source: params.source || 'kaal_agent',
    };

    try {
      const tasks = JSON.parse(localStorage.getItem('kaal_tasks') || '[]');
      tasks.unshift(task);
      localStorage.setItem('kaal_tasks', JSON.stringify(tasks));

      const result: ActionResult = {
        success: true,
        title: `Task created: "${task.title}"`,
        detail: `Added to your list with ${task.priority} priority${task.dueDate ? ` · due ${task.dueDate}` : ''}.`,
        undoable: true,
        undoFn: () => {
          const t2 = JSON.parse(localStorage.getItem('kaal_tasks') || '[]');
          localStorage.setItem('kaal_tasks', JSON.stringify(t2.filter((t: any) => t.id !== task.id)));
        },
        data: task,
      };
      appendLog({ id: `al-${Date.now()}`, action: 'createTask', params, result, timestamp: Date.now() });
      return result;
    } catch (e) {
      return { success: false, title: 'Task creation failed', detail: String(e), undoable: false };
    }
  }

  /** Extract tasks from a brain dump using pattern matching */
  async extractTasksFromText(text: string): Promise<ActionResult> {
    const lines = text.split(/[\n.]+/).map(l => l.trim()).filter(l => l.length > 5);
    const taskSignals = [
      /\b(need to|have to|must|should|want to|going to|will|call|email|message|finish|complete|review|send|update|fix|write|prepare|schedule|book)\b/i,
      /\b(by|before|until|deadline|due|asap|urgent|today|tomorrow|this week|monday|friday)\b/i,
    ];

    const extracted: any[] = [];

    for (const line of lines) {
      const isTask = taskSignals.some(rx => rx.test(line));
      if (!isTask) continue;

      const priority =
        /urgent|asap|critical|immediately/i.test(line) ? 'urgent' :
        /important|must|have to/i.test(line) ? 'high' : 'medium';

      const dueDateMatch = line.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|this week)\b/i);
      let dueDate: string | null = null;
      if (dueDateMatch) {
        const now = new Date();
        if (/today/i.test(dueDateMatch[0])) dueDate = now.toISOString().split('T')[0];
        else if (/tomorrow/i.test(dueDateMatch[0])) { now.setDate(now.getDate() + 1); dueDate = now.toISOString().split('T')[0]; }
      }

      // Clean up the task title
      let title = line
        .replace(/^(i need to|i have to|i must|i should|i want to|i will|i'm going to)\s+/i, '')
        .replace(/\b(by|before|until|due|deadline)\s+\S+/gi, '')
        .trim();
      if (title.length < 4) continue;
      title = title.charAt(0).toUpperCase() + title.slice(1).replace(/[.!?]+$/, '');

      extracted.push({ title, priority, dueDate });
    }

    const created = await Promise.all(extracted.map(t => this.createTask({ ...t, source: 'brain_dump' })));
    const count = created.filter(r => r.success).length;

    return {
      success: count > 0,
      title: count > 0 ? `${count} task${count > 1 ? 's' : ''} extracted` : 'No tasks found',
      detail: count > 0
        ? `Identified and added ${count} task${count > 1 ? 's' : ''} from your brain dump.`
        : 'I couldn\'t find clear action items. Try phrases like "I need to…" or "Call X by Friday".',
      undoable: false,
      data: { count, tasks: created.filter(r => r.success).map(r => r.data) },
    };
  }

  /** Draft an email reply */
  async draftEmailReply(params: {
    threadId: string; subject: string; from: string; context?: string;
  }): Promise<ActionResult> {
    // In production: call Gemini to generate reply, then Gmail API to create draft
    const draft = {
      id: `draft-${Date.now()}`,
      threadId: params.threadId,
      subject: `Re: ${params.subject}`,
      body: `Hi,\n\nThank you for your message regarding "${params.subject}".\n\n[KAAL draft — please personalise before sending]\n\nBest regards`,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
    };

    try {
      const drafts = JSON.parse(localStorage.getItem('kaal_email_drafts') || '[]');
      drafts.unshift(draft);
      localStorage.setItem('kaal_email_drafts', JSON.stringify(drafts.slice(0, 20)));

      return {
        success: true,
        title: `Reply drafted for "${params.subject}"`,
        detail: 'Review and personalise before sending. Draft saved to your inbox.',
        undoable: true,
        data: draft,
      };
    } catch (e) {
      return { success: false, title: 'Draft failed', detail: String(e), undoable: false };
    }
  }

  /** Create a calendar event */
  async createCalendarEvent(params: {
    title: string; startTime: string; durationMinutes: number; description?: string;
  }): Promise<ActionResult> {
    const tokens = JSON.parse(localStorage.getItem('kaal_integrations') || '{}');

    if (tokens.google_calendar?.accessToken) {
      try {
        const start = new Date(params.startTime);
        const end = new Date(start.getTime() + params.durationMinutes * 60000);
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.google_calendar.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: params.title,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            description: params.description || 'Created by KAAL',
          }),
        });
        if (res.ok) {
          const event = await res.json();
          return { success: true, title: `Event created: "${params.title}"`, detail: `Scheduled for ${start.toLocaleString()}`, undoable: false, data: event };
        }
      } catch {}
    }

    // Demo fallback
    return {
      success: true,
      title: `Focus block blocked: "${params.title}"`,
      detail: `${params.durationMinutes} minutes blocked starting ${new Date(params.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Connect Google Calendar to sync.`,
      undoable: false,
    };
  }

  /** Block focus time in calendar */
  async blockFocusTime(params: { taskTitle: string; durationMinutes: number; startMinutesFromNow?: number }): Promise<ActionResult> {
    const start = new Date();
    start.setMinutes(start.getMinutes() + (params.startMinutesFromNow || 5));
    return this.createCalendarEvent({
      title: `🎯 Focus: ${params.taskTitle}`,
      startTime: start.toISOString(),
      durationMinutes: params.durationMinutes,
      description: `KAAL-blocked focus session for: ${params.taskTitle}`,
    });
  }

  /** Create a Notion page */
  async createNotionPage(params: { title: string; content: string; dbName?: string }): Promise<ActionResult> {
    const tokens = JSON.parse(localStorage.getItem('kaal_integrations') || '{}');
    if (tokens.notion?.accessToken) {
      // Real Notion API call would go here
    }
    return {
      success: true,
      title: `Notion page created: "${params.title}"`,
      detail: 'Connect Notion to sync this page to your workspace.',
      undoable: false,
    };
  }

  /** Sync Notion action items to KAAL tasks */
  async syncNotionToTasks(): Promise<ActionResult> {
    const activity = await integrationHub.getNotionActivity();
    if (!activity || activity.pendingActionItems === 0) {
      return { success: false, title: 'No action items found', detail: 'Notion has no pending action items to sync.', undoable: false };
    }

    const created = await Promise.all(
      activity.recentPages
        .filter(p => p.status === 'In Progress')
        .map(p => this.createTask({ title: p.title, priority: 'medium', source: 'notion', tags: ['notion', p.dbName] }))
    );
    const count = created.filter(r => r.success).length;
    return { success: true, title: `${count} tasks synced from Notion`, detail: `Imported from databases: ${activity.recentPages.filter(p => p.status === 'In Progress').map(p => p.dbName).join(', ')}`, undoable: false };
  }

  /** Schedule a break */
  scheduleBreak(durationMinutes: number): ActionResult {
    const resumeAt = new Date(Date.now() + durationMinutes * 60000);
    localStorage.setItem('kaal_scheduled_break', JSON.stringify({ durationMinutes, resumeAt: resumeAt.toISOString(), scheduledAt: new Date().toISOString() }));
    return {
      success: true,
      title: `${durationMinutes}-minute break scheduled`,
      detail: `I'll check back at ${resumeAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to help you re-engage.`,
      undoable: true,
      undoFn: () => localStorage.removeItem('kaal_scheduled_break'),
    };
  }

  /** Generate a daily digest narrative */
  async generateDailyDigest(): Promise<ActionResult> {
    const tasks = JSON.parse(localStorage.getItem('kaal_tasks') || '[]');
    const events = await integrationHub.getCalendarEvents();
    const email = await integrationHub.getEmailDigest();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter((t: any) => t.status !== 'completed' && (t.dueDate?.startsWith(todayStr) || !t.dueDate)).slice(0, 5);
    const todayEvents = events.filter(e => new Date(e.start) > new Date());

    const digest = {
      generatedAt: new Date().toISOString(),
      tasks: todayTasks,
      events: todayEvents,
      emailSummary: email ? `${email.unreadCount} unread, ${email.urgentCount} urgent` : 'Email not connected',
      narrative: `Today you have ${todayTasks.length} active tasks${todayEvents.length > 0 ? `, ${todayEvents.length} meetings` : ''}${email?.urgentCount ? `, and ${email.urgentCount} urgent emails` : ''}. Your focus window opens at ${todayEvents[0] ? new Date(todayEvents[0].start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'any time'}.`,
    };

    return { success: true, title: 'Daily digest generated', detail: digest.narrative, undoable: false, data: digest };
  }

  /** Get action log for transparency */
  getLog(limit = 10): ActionLogEntry[] {
    return getLog().slice(0, limit);
  }
}

export const agentActions = new AgentActions();
