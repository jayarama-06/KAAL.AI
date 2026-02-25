// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 9: Milestone Detector
// Automatically surface achievements using Rule Engine + patterns
// ═══════════════════════════════════════════════════════════════════════════

import type { DetectedMilestone, DailyStats, UserModel } from './types';
import { computeCurrentStreak } from './focusConsistency';
import { computeDeepWorkRatio } from './deepWorkDetector';

/**
 * Detect milestones from behavioral patterns
 * Runs after every session and daily rollup
 */
export function detectMilestones(
  today: DailyStats,
  history: DailyStats[],
  userModel: UserModel
): DetectedMilestone[] {
  const milestones: DetectedMilestone[] = [];

  // ── STREAK MILESTONES ──
  const streak = computeCurrentStreak([...history, today]);
  const STREAK_CHECKPOINTS = [3, 7, 14, 21, 30, 60, 90];
  if (STREAK_CHECKPOINTS.includes(streak)) {
    milestones.push({
      title: `${streak}-Day Productivity Streak`,
      description: `${streak} consecutive days of focused work.`,
      type: 'streak',
      significance: streak >= 21 ? 'major' : 'regular',
    });
  }

  // ── PERSONAL BEST: Focus Score ──
  const allScores = history.map((d) => d.productivity_score || 0);
  const prevBest = Math.max(...allScores.slice(0, -1), 0);
  if ((today.productivity_score || 0) > prevBest && allScores.length >= 7) {
    milestones.push({
      title: `New Personal Best: ${today.productivity_score}%`,
      description: `Highest productivity score recorded — beat previous best of ${prevBest}%.`,
      type: 'personal_best',
      significance: 'major',
    });
  }

  // ── PERSONAL BEST: Deep Work ──
  const allDW = history.map((d) => d.deep_work_hours);
  const prevDWBest = Math.max(...allDW.slice(0, -1), 0);
  if (today.deep_work_hours > prevDWBest && today.deep_work_hours >= 5) {
    milestones.push({
      title: `Deep Work Record: ${today.deep_work_hours.toFixed(1)}h`,
      description: `Your longest single-day deep work session ever.`,
      type: 'deep_work',
      significance: 'major',
    });
  }

  // ── TASK COMPLETION MILESTONES ──
  const totalTasksEver = history.reduce((s, d) => s + d.tasks_completed, 0) + today.tasks_completed;
  const TASK_CHECKPOINTS = [10, 25, 50, 100, 250, 500, 1000];
  const prevTotal = totalTasksEver - today.tasks_completed;
  const crossed = TASK_CHECKPOINTS.find((cp) => prevTotal < cp && totalTasksEver >= cp);
  if (crossed) {
    milestones.push({
      title: `${crossed} Tasks Completed`,
      description: `You've now completed ${crossed} tasks with KAAL.`,
      type: 'completion',
      significance: crossed >= 100 ? 'major' : 'regular',
    });
  }

  // ── CONSISTENCY MILESTONE: First full target week ──
  const last7DW = [...history.slice(-6), today].map((d) => d.deep_work_hours);
  if (last7DW.length === 7 && last7DW.every((h) => h >= 2.0)) {
    milestones.push({
      title: 'Perfect Deep Work Week',
      description: '2+ hours of deep work every day for 7 consecutive days.',
      type: 'streak',
      significance: 'major',
    });
  }

  // ── DEEP WORK RATIO MILESTONE ──
  const ratio = computeDeepWorkRatio([...history.slice(-6), today]).ratio;
  const prevRatio = history.length >= 7 ? computeDeepWorkRatio(history.slice(-14, -7)).ratio : 0;
  if (ratio >= 65 && prevRatio < 65) {
    milestones.push({
      title: 'Hit the 65% Deep Work Target',
      description: 'Your deep work ratio crossed the 65% goal this week.',
      type: 'deep_work',
      significance: 'major',
    });
  }

  // ── FIRST EXCEPTIONAL DAY ──
  const isFirstExceptional =
    (today.productivity_score || 0) >= 90 &&
    history.every((d) => (d.productivity_score || 0) < 90);
  if (isFirstExceptional) {
    milestones.push({
      title: 'First Exceptional Day',
      description: 'Your first 90+ productivity score — this is the standard to maintain.',
      type: 'score',
      significance: 'major',
    });
  }

  return milestones;
}

/**
 * Get milestone display styling
 */
export function getMilestoneDisplay(milestone: DetectedMilestone): {
  icon: string;
  color: string;
  gradient: string;
} {
  if (milestone.significance === 'major') {
    return {
      icon: '🏆',
      color: '#7C3AED',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    };
  }

  switch (milestone.type) {
    case 'streak':
      return {
        icon: '🔥',
        color: '#F97316',
        gradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
      };
    case 'deep_work':
      return {
        icon: '⚡',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
      };
    case 'completion':
      return {
        icon: '✅',
        color: '#10B981',
        gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      };
    case 'score':
      return {
        icon: '⭐',
        color: '#FBBF24',
        gradient: 'linear-gradient(135deg, #FBBF24 0%, #FCD34D 100%)',
      };
    case 'personal_best':
      return {
        icon: '🎯',
        color: '#EC4899',
        gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
      };
  }
}

/**
 * Check if a milestone should trigger a notification
 */
export function shouldNotifyMilestone(milestone: DetectedMilestone): boolean {
  // Always notify major milestones
  if (milestone.significance === 'major') return true;

  // Notify streaks of 7+ days
  if (milestone.type === 'streak' && milestone.title.includes('7-Day')) return true;

  // Notify task completion checkpoints of 50+
  if (
    milestone.type === 'completion' &&
    (milestone.title.includes('50') ||
      milestone.title.includes('100') ||
      milestone.title.includes('250'))
  ) {
    return true;
  }

  return false;
}
