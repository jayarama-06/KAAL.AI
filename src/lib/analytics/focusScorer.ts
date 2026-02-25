// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Engine 3: Focus Score
// The single number that summarizes a session
// 5-signal weighted composite scorer
// ═══════════════════════════════════════════════════════════════════════════

import type { FocusSessionData } from './types';

/**
 * Computes the Focus Score shown on every session card (0-100)
 * Composite of 5 signals, each measuring a different dimension of focus quality
 */
export function computeFocusScore(s: FocusSessionData): number {
  let score = 0;

  // ── SIGNAL 1: Session Duration (25 pts max) ──
  // Deep work requires sustained attention — longer is better up to 120 min
  const durationScore = Math.min(25, (s.duration_minutes / 120) * 25);
  score += durationScore;

  // ── SIGNAL 2: Task Completion Rate (25 pts max) ──
  // Reward completing high-CLS tasks more than low-CLS tasks
  const completionBase = Math.min(3, s.tasks_completed) / 3; // normalize to 0-1 (cap at 3)
  const clsMultiplier = s.avg_cls_of_tasks / 10; // 0.1 to 1.0
  score += completionBase * clsMultiplier * 25;

  // ── SIGNAL 3: Interruption Penalty (20 pts max) ──
  // Zero interruptions = full 20 pts. Each interruption costs 5 pts.
  const interruptionScore = Math.max(0, 20 - s.interruptions * 5);
  score += interruptionScore;

  // ── SIGNAL 4: Cognitive Load Alignment (15 pts max) ──
  // Reward doing high-CLS tasks in the session (quality work)
  score += (s.avg_cls_of_tasks / 10) * 15;

  // ── SIGNAL 5: Energy Sustainability (15 pts max) ──
  // Penalize energy crashes — ending lower than starting is a sign of overextension
  const energyDrop = s.energy_at_start - s.energy_at_end; // 0 = stable, -1 = improved, 1+ = crashed
  if (energyDrop <= 0) score += 15; // maintained or improved energy
  else if (energyDrop === 1) score += 8; // small drop — acceptable
  else score += 0; // large crash — no bonus

  // ── SESSION TYPE MODIFIER ──
  // Deep work gets a small boost; admin gets a small penalty
  if (s.session_type === 'deep_work') score = Math.min(100, score * 1.1);
  if (s.session_type === 'admin') score *= 0.85;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Compute daily productivity score from all sessions
 * Weighted average — longer sessions count more
 */
export function computeDailyProductivityScore(
  sessions: Array<FocusSessionData & { focus_score: number }>
): number {
  if (sessions.length === 0) return 0;

  // Weight longer sessions more heavily
  let totalWeight = 0;
  let weightedSum = 0;

  for (const s of sessions) {
    const weight = Math.max(1, s.duration_minutes / 30); // 30-min session = weight 1
    weightedSum += s.focus_score * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

/**
 * Get display label and color for a focus/productivity score
 */
export function getScoreLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 90) return { label: 'Exceptional', color: '#145A32', emoji: '🏆' };
  if (score >= 75) return { label: 'Strong', color: '#1A5276', emoji: '💪' };
  if (score >= 60) return { label: 'Solid', color: '#2E86C1', emoji: '✅' };
  if (score >= 45) return { label: 'Moderate', color: '#D4690A', emoji: '📊' };
  return { label: 'Light day', color: '#888888', emoji: '📝' };
}

/**
 * Break down a focus score into its components for debugging/explanation
 */
export function explainFocusScore(s: FocusSessionData): {
  total: number;
  breakdown: {
    duration: number;
    completion: number;
    interruptions: number;
    cognitiveLoad: number;
    energySustainability: number;
  };
} {
  const durationScore = Math.min(25, (s.duration_minutes / 120) * 25);
  const completionBase = Math.min(3, s.tasks_completed) / 3;
  const clsMultiplier = s.avg_cls_of_tasks / 10;
  const completionScore = completionBase * clsMultiplier * 25;
  const interruptionScore = Math.max(0, 20 - s.interruptions * 5);
  const cognitiveLoadScore = (s.avg_cls_of_tasks / 10) * 15;
  const energyDrop = s.energy_at_start - s.energy_at_end;
  const energyScore = energyDrop <= 0 ? 15 : energyDrop === 1 ? 8 : 0;

  let total = durationScore + completionScore + interruptionScore + cognitiveLoadScore + energyScore;
  if (s.session_type === 'deep_work') total = Math.min(100, total * 1.1);
  if (s.session_type === 'admin') total *= 0.85;

  return {
    total: Math.round(total),
    breakdown: {
      duration: Math.round(durationScore),
      completion: Math.round(completionScore),
      interruptions: Math.round(interruptionScore),
      cognitiveLoad: Math.round(cognitiveLoadScore),
      energySustainability: Math.round(energyScore),
    },
  };
}
