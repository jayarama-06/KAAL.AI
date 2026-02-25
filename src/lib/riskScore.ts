// ═══════════════════════════════════════════════════════════════════════════
// KAAL Deadline Risk Scoring
// Pure math - no API, instant calculation
// ═══════════════════════════════════════════════════════════════════════════

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface UserState {
  energy_level: number; // 1-3
  calibration_factor: number; // from taskCalibration.ts
}

export interface Task {
  deadline_at?: string | null;
  estimated_minutes?: number;
  cognitive_load_score?: number;
}

export interface RiskAssessment {
  risk_level: RiskLevel;
  hours_left: number;
  hours_needed: number;
  buffer_hours: number;
  message: string;
  color: string;
  emoji: string;
}

/**
 * Compute deadline risk for a task
 * Uses time remaining, estimated duration, current energy, and calibration
 */
export function computeDeadlineRisk(
  task: Task,
  userState: UserState
): RiskLevel {
  if (!task.deadline_at) return 'low';

  const hoursLeft = (new Date(task.deadline_at).getTime() - Date.now()) / 3600000;
  const hoursNeeded = ((task.estimated_minutes || 30) * userState.calibration_factor) / 60;

  // Energy multiplier: low energy = tasks take longer
  const energyMultiplier =
    userState.energy_level === 1 ? 1.5 : userState.energy_level === 2 ? 1.0 : 0.8;

  const adjustedHoursNeeded = hoursNeeded * energyMultiplier;
  const buffer = hoursLeft - adjustedHoursNeeded;

  if (buffer < 0) return 'critical'; // already impossible at current pace
  if (buffer < 1) return 'high'; // less than 1 hour buffer
  if (buffer < 3) return 'medium'; // less than 3 hour buffer
  return 'low';
}

/**
 * Get detailed risk assessment with messaging
 */
export function getRiskAssessment(
  task: Task,
  userState: UserState
): RiskAssessment | null {
  if (!task.deadline_at) return null;

  const hoursLeft = (new Date(task.deadline_at).getTime() - Date.now()) / 3600000;

  // If deadline already passed
  if (hoursLeft < 0) {
    return {
      risk_level: 'critical',
      hours_left: hoursLeft,
      hours_needed: 0,
      buffer_hours: hoursLeft,
      message: 'Deadline passed',
      color: '#EF4444',
      emoji: '🚨',
    };
  }

  const hoursNeeded = ((task.estimated_minutes || 30) * userState.calibration_factor) / 60;
  const energyMultiplier =
    userState.energy_level === 1 ? 1.5 : userState.energy_level === 2 ? 1.0 : 0.8;
  const adjustedHoursNeeded = hoursNeeded * energyMultiplier;
  const buffer = hoursLeft - adjustedHoursNeeded;
  const risk = computeDeadlineRisk(task, userState);

  const messages = {
    critical: 'Deadline at risk',
    high: 'Tight deadline',
    medium: 'Watch this one',
    low: '',
  };

  const colors = {
    critical: '#EF4444', // red
    high: '#F97316', // orange
    medium: '#F59E0B', // amber
    low: '#6B7280', // gray
  };

  const emojis = {
    critical: '⚠️',
    high: '⚡',
    medium: '⏳',
    low: '✓',
  };

  return {
    risk_level: risk,
    hours_left: Math.round(hoursLeft * 10) / 10,
    hours_needed: Math.round(adjustedHoursNeeded * 10) / 10,
    buffer_hours: Math.round(buffer * 10) / 10,
    message: messages[risk],
    color: colors[risk],
    emoji: emojis[risk],
  };
}

/**
 * Get risk badge for UI display
 * Returns null for low-risk tasks (no noise)
 */
export function getRiskBadge(
  task: Task,
  userState: UserState
): { text: string; color: string; emoji: string } | null {
  const assessment = getRiskAssessment(task, userState);
  if (!assessment || assessment.risk_level === 'low') return null;

  return {
    text: assessment.message,
    color: assessment.color,
    emoji: assessment.emoji,
  };
}

/**
 * Get risk level for multiple tasks
 * Returns sorted by risk (critical first)
 */
export function sortTasksByRisk<T extends Task>(
  tasks: T[],
  userState: UserState
): T[] {
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return [...tasks].sort((a, b) => {
    const riskA = computeDeadlineRisk(a, userState);
    const riskB = computeDeadlineRisk(b, userState);
    return riskOrder[riskA] - riskOrder[riskB];
  });
}

/**
 * Get count of tasks at each risk level
 */
export function getRiskCounts(
  tasks: Task[],
  userState: UserState
): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  tasks.forEach(task => {
    const risk = computeDeadlineRisk(task, userState);
    counts[risk]++;
  });

  return counts;
}

/**
 * Check if any task is at critical risk
 */
export function hasEmergency(tasks: Task[], userState: UserState): boolean {
  return tasks.some(task => computeDeadlineRisk(task, userState) === 'critical');
}
