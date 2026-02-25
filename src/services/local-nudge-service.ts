// ═══════════════════════════════════════════════════════════════════════════
// KAAL Local Nudge Service
// Browser notification system using local template-based algorithm
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import {
  UserContext,
  generateAutoNudge,
  generateProactiveNudge,
  generateReengagementNudge,
  generateMilestoneNudge,
  generateTimingNudge
} from './nudge-algorithm';

export interface NudgeSchedule {
  id: string;
  userId: string;
  scheduledFor: Date;
  category: 'proactive' | 're-engagement' | 'milestone' | 'timing';
  delivered: boolean;
  nudgeText?: string;
  templateId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Building
// ─────────────────────────────────────────────────────────────────────────────

async function buildUserContext(userId: string): Promise<UserContext> {
  const now = new Date();
  
  // Fetch user's tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'archived');
  
  const tasksPending = tasks?.filter(t => t.status !== 'completed').length || 0;
  const urgentTasksPending = tasks?.filter(t => t.priority === 'urgent' && t.status !== 'completed').length || 0;
  
  // Get next pending task
  const nextTask = tasks?.find(t => t.status !== 'completed');
  const nextTaskName = nextTask?.title;
  const nextTaskType = nextTask?.tags?.[0] || 'general';
  
  // Fetch yesterday's completed tasks
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);
  
  const { data: completedYesterday } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('updated_at', yesterday.toISOString())
    .lte('updated_at', endOfYesterday.toISOString());
  
  // Fetch today's completed tasks
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  const { data: completedToday } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('updated_at', startOfToday.toISOString());
  
  // Fetch latest energy check-in
  const { data: energyCheckins } = await supabase
    .from('energy_checkins')
    .select('energy_level, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  
  const currentEnergy = energyCheckins?.[0]?.energy_level as 'low' | 'medium' | 'high' | undefined;
  
  // Calculate last visit
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_active_at')
    .eq('id', userId)
    .single();
  
  const lastVisit = profile?.last_active_at ? new Date(profile.last_active_at) : new Date();
  const hoursSinceVisit = Math.max(0, (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60));
  const daysSinceVisit = Math.floor(hoursSinceVisit / 24);
  
  // Calculate consecutive days (check energy_checkins or task completions)
  const { data: recentCheckins } = await supabase
    .from('energy_checkins')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  
  let consecutiveDays = 0;
  if (recentCheckins && recentCheckins.length > 0) {
    const dates = recentCheckins.map(c => {
      const d = new Date(c.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
    
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    for (const dateTime of uniqueDates) {
      if (dateTime === checkDate.getTime()) {
        consecutiveDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  // Determine best time of day based on historical energy
  const { data: energyHistory } = await supabase
    .from('energy_checkins')
    .select('energy_level, created_at')
    .eq('user_id', userId)
    .eq('energy_level', 'high')
    .order('created_at', { ascending: false })
    .limit(20);
  
  let bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | undefined;
  if (energyHistory && energyHistory.length >= 5) {
    const timeOfDayCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    energyHistory.forEach(e => {
      const hour = new Date(e.created_at).getHours();
      if (hour >= 5 && hour < 12) timeOfDayCounts.morning++;
      else if (hour >= 12 && hour < 17) timeOfDayCounts.afternoon++;
      else if (hour >= 17 && hour < 21) timeOfDayCounts.evening++;
      else timeOfDayCounts.night++;
    });
    bestTimeOfDay = Object.entries(timeOfDayCounts).sort((a, b) => b[1] - a[1])[0][0] as any;
  }
  
  return {
    currentEnergy,
    tasksPending,
    completedYesterday: completedYesterday?.length || 0,
    completedToday: completedToday?.length || 0,
    urgentTasksPending,
    nextTaskName,
    nextTaskType,
    lastVisitDate: lastVisit,
    hoursSinceVisit,
    daysSinceVisit,
    consecutiveDays,
    currentHour: now.getHours(),
    dayOfWeek: now.getDay(),
    bestTimeOfDay,
    averageTasksPerDay: undefined // Can calculate from historical data
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Sending
// ─────────────────────────────────────────────────────────────────────────────

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

function sendBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/kaal-logo.png', // Make sure to add your logo
      badge: '/kaal-badge.png',
      tag: 'kaal-nudge',
      requireInteraction: false,
      silent: false
    });
    
    if (onClick) {
      notification.onclick = onClick;
    } else {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Nudge Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function sendProactiveNudge(userId: string): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  
  const context = await buildUserContext(userId);
  const nudge = generateProactiveNudge(context);
  
  sendBrowserNotification('KAAL • Focus Time', nudge.text);
  
  // Log the nudge
  await supabase.from('nudge_events').insert({
    user_id: userId,
    nudge_type: 'proactive',
    nudge_text: nudge.text,
    template_id: nudge.templateId,
    confidence_score: nudge.confidence,
    delivered_at: new Date().toISOString()
  });
}

export async function sendReengagementNudge(userId: string): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  
  const context = await buildUserContext(userId);
  const nudge = generateReengagementNudge(context);
  
  sendBrowserNotification('KAAL • Come Back', nudge.text);
  
  // Log the nudge
  await supabase.from('nudge_events').insert({
    user_id: userId,
    nudge_type: 're-engagement',
    nudge_text: nudge.text,
    template_id: nudge.templateId,
    confidence_score: nudge.confidence,
    delivered_at: new Date().toISOString()
  });
}

export async function sendMilestoneNudge(userId: string): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  
  const context = await buildUserContext(userId);
  const nudge = generateMilestoneNudge(context);
  
  sendBrowserNotification('KAAL • You\'re Crushing It', nudge.text);
  
  // Log the nudge
  await supabase.from('nudge_events').insert({
    user_id: userId,
    nudge_type: 'milestone',
    nudge_text: nudge.text,
    template_id: nudge.templateId,
    confidence_score: nudge.confidence,
    delivered_at: new Date().toISOString()
  });
}

export async function sendTimingNudge(userId: string): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  
  const context = await buildUserContext(userId);
  const nudge = generateTimingNudge(context);
  
  sendBrowserNotification('KAAL • Prime Time', nudge.text);
  
  // Log the nudge
  await supabase.from('nudge_events').insert({
    user_id: userId,
    nudge_type: 'timing',
    nudge_text: nudge.text,
    template_id: nudge.templateId,
    confidence_score: nudge.confidence,
    delivered_at: new Date().toISOString()
  });
}

export async function sendAutoNudge(userId: string): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  
  const context = await buildUserContext(userId);
  const nudge = generateAutoNudge(context);
  
  const titles = {
    proactive: 'KAAL • Focus Time',
    're-engagement': 'KAAL • Come Back',
    milestone: 'KAAL • You\'re Crushing It',
    timing: 'KAAL • Prime Time'
  };
  
  sendBrowserNotification(
    titles[nudge.category as keyof typeof titles] || 'KAAL',
    nudge.text
  );
  
  // Log the nudge
  await supabase.from('nudge_events').insert({
    user_id: userId,
    nudge_type: nudge.category,
    nudge_text: nudge.text,
    template_id: nudge.templateId,
    confidence_score: nudge.confidence,
    delivered_at: new Date().toISOString()
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Nudge Scheduler (for background workers/service workers)
// ─────────────────────────────────────────────────────────────────────────────

export async function scheduleNudges(userId: string): Promise<void> {
  // This would typically run on a server or service worker
  // For now, we can schedule browser-based nudges
  
  const context = await buildUserContext(userId);
  
  // Schedule re-engagement if user hasn't visited in 6+ hours
  if (context.hoursSinceVisit >= 6) {
    setTimeout(() => sendReengagementNudge(userId), 1000 * 60 * 5); // 5 min from now
  }
  
  // Schedule milestone nudge if they had a great day yesterday
  if (context.completedYesterday >= 4 && context.currentHour >= 8 && context.currentHour <= 10) {
    setTimeout(() => sendMilestoneNudge(userId), 1000 * 60 * 2); // 2 min from now
  }
  
  // Schedule timing nudge if in their peak hour
  if (context.bestTimeOfDay && context.bestTimeOfDay === getTimeOfDayFromHour(context.currentHour)) {
    setTimeout(() => sendTimingNudge(userId), 1000 * 60); // 1 min from now
  }
}

function getTimeOfDayFromHour(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission Helper
// ─────────────────────────────────────────────────────────────────────────────

export async function setupNudgePermissions(): Promise<boolean> {
  return await requestNotificationPermission();
}

export function getNudgePermissionStatus(): 'granted' | 'denied' | 'default' {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
