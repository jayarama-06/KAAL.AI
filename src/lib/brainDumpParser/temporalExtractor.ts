// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 3: Temporal Signal Extractor
// Parse time from natural language using regex + rule engine
// NOW WITH FULL TIMEZONE AWARENESS
// ═══════════════════════════════════════════════════════════════════════════

import { 
  getCurrentTimeInTimezone, 
  getCurrentHourInTimezone,
  loadTimezonePreference 
} from '../timezone-service';

export interface TemporalSignals {
  deadline_at: Date | null;
  estimated_minutes: number | null;
  urgency_score: number; // 0-5
  time_of_day_preference: 'morning' | 'afternoon' | 'evening' | null;
}

/**
 * Extract temporal signals from natural language text
 * Handles deadlines, durations, urgency, and time-of-day preferences
 * NOW FULLY TIME-AWARE: considers current hour, already-passed times, and sleep boundaries
 * NOW TIMEZONE-AWARE: uses user's timezone for accurate time parsing
 */
export function extractTemporalSignals(
  text: string, 
  currentHour?: number,
  userTimezone?: string
): TemporalSignals {
  const lower = text.toLowerCase();
  
  // Load user's timezone preference
  const timezone = userTimezone || loadTimezonePreference();
  
  // Get current time in user's timezone
  const now = getCurrentTimeInTimezone(timezone);
  const hour = currentHour ?? getCurrentHourInTimezone(timezone);
  
  let deadline_at: Date | null = null;
  let estimated_minutes: number | null = null;
  let urgency_score = 0;
  let time_of_day_preference: TemporalSignals['time_of_day_preference'] = null;

  console.log(`[Temporal] Parsing in timezone: ${timezone}, current hour: ${hour}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME CONTEXT HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = hour >= 17 && hour < 22;
  const isLateNight = hour >= 22 || hour < 5;

  // Helper: get next occurrence of a time-of-day (timezone-aware)
  const getNextTimeOfDay = (targetHour: number): Date => {
    const d = new Date(now);
    d.setMinutes(0, 0, 0);
    
    if (hour < targetHour) {
      // Later today
      d.setHours(targetHour);
    } else {
      // Tomorrow
      d.setDate(d.getDate() + 1);
      d.setHours(targetHour);
    }
    
    return d;
  };

  // Helper: check if a time has passed today
  const hasPassedToday = (targetHour: number): boolean => {
    return hour >= targetHour;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DEADLINE EXTRACTION (NOW CONTEXT-AWARE)
  // ═══════════════════════════════════════════════════════════════════════════

  const deadlineRules: Array<{
    pattern: RegExp;
    resolve: (m: RegExpMatchArray) => Date | null;
  }> = [
    {
      pattern: /\btonight\b/i,
      resolve: () => {
        // Tonight = 9pm today (or skip if already past 11pm)
        if (isLateNight && hour >= 23) return null; // Too late
        const d = new Date(now);
        d.setHours(21, 0, 0, 0);
        return d;
      },
    },
    {
      pattern: /\blater today\b|\blater\b(?! this week)/i,
      resolve: () => {
        // Later today = 2 hours from now (unless that's past 9pm)
        const d = new Date(now);
        d.setHours(Math.min(hour + 2, 21), 0, 0, 0);
        return d;
      },
    },
    {
      pattern: /\bsoon\b|\bshortly\b/i,
      resolve: () => {
        // Soon = 1 hour from now
        const d = new Date(now);
        d.setHours(hour + 1, 0, 0, 0);
        return d;
      },
    },
    {
      pattern: /\bbefore bed\b|\bbefore sleep(ing)?\b/i,
      resolve: () => {
        // Before bed = 10pm today (or skip if already past)
        if (hour >= 22) return null;
        const d = new Date(now);
        d.setHours(22, 0, 0, 0);
        return d;
      },
    },
    {
      pattern: /\btoday\b|\\beod\\b|\\bend of day\\b/i,
      resolve: () => {
        // End of day = 6pm if before 6pm, otherwise 9pm
        const d = new Date(now);
        const targetHour = hour < 18 ? 18 : 21;
        d.setHours(targetHour, 0, 0, 0);
        return d;
      },
    },
    {
      pattern: /\btomorrow\b/i,
      resolve: () => {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        d.setHours(18, 0, 0, 0); // Default to 6pm tomorrow
        return d;
      },
    },
    {
      pattern: /this (morning|afternoon|evening)/i,
      resolve: (m) => {
        const period = m[1].toLowerCase();
        
        // Check if this period has already passed today
        if (period === 'morning' && !isMorning) {
          // Morning has passed, interpret as tomorrow morning
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          d.setHours(9, 0, 0, 0);
          return d;
        }
        
        if (period === 'afternoon' && (isEvening || isLateNight)) {
          // Afternoon has passed, interpret as tomorrow afternoon
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          d.setHours(14, 0, 0, 0);
          return d;
        }
        
        if (period === 'evening' && isLateNight) {
          // Evening has passed, interpret as tomorrow evening
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          d.setHours(18, 0, 0, 0);
          return d;
        }
        
        // Period hasn't passed, use today
        const d = new Date(now);
        const targetHour = period === 'morning' ? 11 
                         : period === 'afternoon' ? 15 
                         : 19;
        d.setHours(targetHour, 0, 0, 0);
        return d;
      },
    },
    {
      pattern: /in (\d+) days?/i,
      resolve: (m) => {
        const d = new Date(now);
        d.setDate(d.getDate() + parseInt(m[1]));
        d.setHours(23, 59, 0, 0);
        return d;
      },
    },
    {
      pattern: /in (\d+) hours?/i,
      resolve: (m) => {
        const d = new Date(now);
        d.setHours(d.getHours() + parseInt(m[1]));
        return d;
      },
    },
    {
      pattern: /by (next )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      resolve: (m) => {
        const dayMap: Record<string, number> = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 0,
        };
        const targetDay = dayMap[m[2].toLowerCase()];
        const d = new Date(now);
        const daysAhead = (targetDay - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + daysAhead);
        d.setHours(23, 59, 0, 0);
        return d;
      },
    },
    {
      pattern: /at (\d{1,2})(?::(\d{2}))?\s*?(am|pm)?/i,
      resolve: (m) => {
        const d = new Date(now);
        let h = parseInt(m[1]);
        if (m[3] === 'pm' && h !== 12) h += 12;
        if (m[3] === 'am' && h === 12) h = 0;
        d.setHours(h, m[2] ? parseInt(m[2]) : 0, 0, 0);
        return d;
      },
    },
    {
      pattern: /this week|by (friday|end of week)/i,
      resolve: () => {
        const d = new Date(now);
        const daysTillFriday = (5 - d.getDay() + 7) % 7 || 5;
        d.setDate(d.getDate() + daysTillFriday);
        d.setHours(23, 59, 0, 0);
        return d;
      },
    },
    {
      pattern: /next week/i,
      resolve: () => {
        const d = new Date(now);
        d.setDate(d.getDate() + 7);
        d.setHours(23, 59, 0, 0);
        return d;
      },
    },
    {
      pattern: /end of month/i,
      resolve: () => {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 1, 0); // Last day of current month
        d.setHours(23, 59, 0, 0);
        return d;
      },
    },
  ];

  for (const rule of deadlineRules) {
    const match = text.match(rule.pattern);
    if (match && !deadline_at) {
      try {
        const resolved = rule.resolve(match);
        if (resolved) {
          deadline_at = resolved;
          console.log(`[Temporal] Matched pattern "${rule.pattern.source}" at ${hour}:00 → ${deadline_at.toLocaleString()}`);
          break;
        }
      } catch (e) {
        // Invalid date, continue
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DURATION EXTRACTION
  // ═══════════════════════════════════════════════════════════════════════════

  const durationPatterns: Array<[RegExp, (m: RegExpMatchArray) => number]> = [
    [/(\d+)\s*min(ute)?s?/i, (m) => parseInt(m[1])],
    [/(\d+)\s*h(ou)?rs?/i, (m) => parseInt(m[1]) * 60],
    [/quick|fast|brief|sec/i, () => 10],
    [/30 min|half hour|half an hour/i, () => 30],
    [/an hour|1 hour|one hour/i, () => 60],
    [/couple hours?|2 hours?/i, () => 120],
    [/few hours|3 hours?/i, () => 180],
    [/all day|full day/i, () => 480],
    [/all morning/i, () => 180],
    [/all afternoon/i, () => 240],
  ];

  for (const [pattern, resolver] of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      estimated_minutes = resolver(match);
      break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // URGENCY SCORE
  // ═══════════════════════════════════════════════════════════════════════════

  if (/asap|urgent|critical|immediately|right now|can.?t wait|emergency/i.test(lower)) {
    urgency_score = 5;
  } else if (/important|must|have to|need to|required/i.test(lower)) {
    urgency_score = 3;
  } else if (/should|would be good|try to|maybe should/i.test(lower)) {
    urgency_score = 1;
  }

  // Adjust urgency based on deadline proximity
  if (deadline_at) {
    const hoursLeft = (deadline_at.getTime() - now.getTime()) / 3_600_000;
    if (hoursLeft < 2) urgency_score = Math.max(urgency_score, 5);
    else if (hoursLeft < 8) urgency_score = Math.max(urgency_score, 4);
    else if (hoursLeft < 24) urgency_score = Math.max(urgency_score, 3);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME OF DAY PREFERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  if (/morning|before lunch|early|first thing|am/i.test(lower)) {
    time_of_day_preference = 'morning';
  } else if (/afternoon|after lunch|midday|pm/i.test(lower)) {
    time_of_day_preference = 'afternoon';
  } else if (/evening|tonight|after work|late/i.test(lower)) {
    time_of_day_preference = 'evening';
  }

  return {
    deadline_at,
    estimated_minutes,
    urgency_score,
    time_of_day_preference,
  };
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: Date | null): string {
  if (!deadline) return '';

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / 3_600_000;
  const diffDays = diffMs / 86_400_000;

  if (diffHours < 2) return 'Due in < 2 hours';
  if (diffHours < 24) return `Due today at ${deadline.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffDays < 2) return 'Due tomorrow';
  if (diffDays < 7) return `Due ${deadline.toLocaleDateString('en-US', { weekday: 'long' })}`;
  return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get urgency label for display
 */
export function getUrgencyLabel(score: number): string {
  if (score >= 5) return 'Critical';
  if (score >= 4) return 'Urgent';
  if (score >= 3) return 'Important';
  if (score >= 2) return 'Medium';
  return 'Low';
}

/**
 * Get urgency color for UI
 */
export function getUrgencyColor(score: number): string {
  if (score >= 5) return '#EF4444'; // red
  if (score >= 4) return '#F59E0B'; // orange
  if (score >= 3) return '#EAB308'; // yellow
  if (score >= 2) return '#3B82F6'; // blue
  return '#6B7280'; // gray
}