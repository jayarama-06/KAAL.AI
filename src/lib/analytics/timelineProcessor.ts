// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 7: Timeline Processor
// Turn a raw event stream into a meaningful story
// Event Stream Processor + Auto-Classifier
// ═══════════════════════════════════════════════════════════════════════════

import type { TimelineEvent, EventSignificance, UserModel, DailyStats } from './types';
import { mannKendallTrend } from './trendDetector';

interface RawEvent {
  type: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * Classify event significance — replaces flat 'MEDIUM' badge with intelligent levels
 */
export function classifyEventSignificance(
  event: RawEvent,
  userModel: UserModel
): EventSignificance {
  // Task completions — scored by CLS and speed
  if (event.type === 'task_completed') {
    const cls = event.metadata.cognitive_load_score ?? 5;
    const estimateAccuracy =
      event.metadata.actual_minutes && event.metadata.estimated_minutes
        ? event.metadata.actual_minutes / event.metadata.estimated_minutes
        : 1;

    if (cls >= 8 && estimateAccuracy < 1.2) return 'HIGH'; // hard task, done on time
    if (cls >= 8) return 'MEDIUM';
    if (cls <= 3) return 'LOW'; // admin task
    return 'MEDIUM';
  }

  // Deep work sessions — HIGH if above personal best
  if (event.type === 'deep_work_session') {
    const duration = event.metadata.duration_minutes;
    if (duration > userModel.avg_session_duration_mins * 1.5) return 'HIGH';
    return 'MEDIUM';
  }

  // Streaks and goals are always HIGH+
  if (event.type === 'streak_hit') return 'HIGH';
  if (event.type === 'goal_completed') return 'MILESTONE';

  return 'MEDIUM';
}

/**
 * Generate day summary narrative
 * Auto-generates the narrative card visible on History Log
 */
export function generateDaySummary(dayStats: DailyStats): string {
  const { tasks_completed, deep_work_hours, productivity_score, anomaly_type } = dayStats;

  // Use anomaly if detected
  if (anomaly_type === 'breakout_day') return 'Exceptional Day';
  if (anomaly_type === 'burnout_risk') return 'Low Output Day';

  // Describe the day by what dominated it
  if (deep_work_hours >= 5) return 'Deep Work Day';
  if (tasks_completed >= 8) return 'High Volume Day';
  if (productivity_score && productivity_score >= 85) return 'Peak Performance Day';
  if (tasks_completed <= 2 && deep_work_hours < 1) return 'Light Day';

  // Fall back to generic description
  return productivity_score && productivity_score >= 70 ? 'Productive Day' : 'Work Day';
}

/**
 * Find patterns across the timeline and surface them as insights
 */
export function findTimelinePatterns(dailyStats: DailyStats[]): string[] {
  const insights: string[] = [];
  if (dailyStats.length < 7) return insights;

  // Pattern 1: Best day of week
  const byDay = Array(7)
    .fill(0)
    .map(() => ({ sum: 0, count: 0 }));
  dailyStats.forEach((d) => {
    const dow = new Date(d.date).getDay();
    byDay[dow].sum += d.productivity_score || 0;
    byDay[dow].count++;
  });
  const dayAvgs = byDay.map((b, i) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
    avg: b.count > 0 ? b.sum / b.count : 0,
  }));
  const bestDay = dayAvgs.sort((a, b) => b.avg - a.avg)[0];
  if (bestDay.avg > 0)
    insights.push(`You're most productive on ${bestDay.day}s — avg score ${Math.round(bestDay.avg)}`);

  // Pattern 2: Streak detection
  let currentStreak = 0;
  for (let i = dailyStats.length - 1; i >= 0; i--) {
    if ((dailyStats[i].productivity_score || 0) >= 60) currentStreak++;
    else break;
  }
  if (currentStreak >= 3)
    insights.push(`${currentStreak}-day productive streak — keep the momentum`);

  // Pattern 3: Deep work trend
  const deepWorkValues = dailyStats.slice(-7).map((d) => d.deep_work_hours);
  const trend = mannKendallTrend(deepWorkValues);
  if (trend.direction === 'increasing' && trend.strength !== 'weak')
    insights.push('Your deep work hours are trending up this week');

  return insights;
}

/**
 * Get badge styling for event significance
 */
export function getSignificanceBadge(significance: EventSignificance): {
  color: string;
  label: string;
  bgColor: string;
} {
  switch (significance) {
    case 'MILESTONE':
      return {
        color: '#7C3AED',
        label: 'MILESTONE',
        bgColor: 'rgba(124, 58, 237, 0.1)',
      };
    case 'HIGH':
      return {
        color: '#10B981',
        label: 'HIGH',
        bgColor: 'rgba(16, 185, 129, 0.1)',
      };
    case 'MEDIUM':
      return {
        color: '#3B82F6',
        label: 'MEDIUM',
        bgColor: 'rgba(59, 130, 246, 0.1)',
      };
    case 'LOW':
      return {
        color: '#9CA3AF',
        label: 'LOW',
        bgColor: 'rgba(156, 163, 175, 0.1)',
      };
  }
}

/**
 * Group timeline events by day with smart summaries
 */
export function groupEventsByDay(events: TimelineEvent[]): Array<{
  date: string;
  dateLabel: string;
  events: TimelineEvent[];
  summary: string;
  totalEvents: number;
  highPriorityCount: number;
}> {
  const grouped = new Map<string, TimelineEvent[]>();

  events.forEach((event) => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(event);
  });

  const result = Array.from(grouped.entries()).map(([date, dayEvents]) => {
    const highPriorityCount = dayEvents.filter(
      (e) => e.significance === 'HIGH' || e.significance === 'MILESTONE'
    ).length;

    const dateObj = new Date(date);
    const dateLabel = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    let summary = '';
    if (highPriorityCount >= 3) {
      summary = 'High-impact day';
    } else if (dayEvents.length >= 10) {
      summary = 'High volume';
    } else if (highPriorityCount > 0) {
      summary = 'Productive';
    } else {
      summary = 'Active';
    }

    return {
      date,
      dateLabel,
      events: dayEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      summary,
      totalEvents: dayEvents.length,
      highPriorityCount,
    };
  });

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
