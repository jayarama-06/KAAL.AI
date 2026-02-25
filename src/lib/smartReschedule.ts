// ═══════════════════════════════════════════════════════════════════════════
// KAAL Smart Re-scheduling
// Constraint-based scheduling algorithm - deterministic, no API
// ═══════════════════════════════════════════════════════════════════════════

import type { EnergyByHour } from './energyPatterns';

export interface Task {
  id: string;
  title: string;
  cognitive_load_score?: number;
  estimated_minutes?: number;
  deadline_at?: string | null;
}

export interface RescheduleOption {
  suggested_time: Date;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  predicted_energy: number;
}

/**
 * Suggest optimal reschedule time for a task
 * Uses user's energy pattern data to find best slot
 */
export function suggestRescheduleTime(
  task: Task,
  energyPattern: EnergyByHour[]
): RescheduleOption {
  const now = new Date();
  const taskCLS = task.cognitive_load_score || 5;

  // Determine required energy based on CLS
  // High CLS tasks (7-10): need energy >= 2.5
  // Medium CLS tasks (4-6): need energy >= 1.5
  // Low CLS tasks (1-3): any energy works
  const required_energy = taskCLS >= 7 ? 2.5 : taskCLS >= 4 ? 1.5 : 1.0;

  // Find next hour today (or tomorrow) where predicted energy meets threshold
  for (let hoursAhead = 1; hoursAhead <= 48; hoursAhead++) {
    const candidate = new Date(now.getTime() + hoursAhead * 3600000);
    const candidateHour = candidate.getHours();

    // Check if deadline allows this time
    if (task.deadline_at) {
      const deadline = new Date(task.deadline_at);
      const taskDuration = (task.estimated_minutes || 30) * 60 * 1000;
      if (candidate.getTime() + taskDuration > deadline.getTime()) {
        continue; // Would miss deadline
      }
    }

    const predicted =
      energyPattern.find(p => p.hour_of_day === candidateHour)?.avg_energy ?? 2;

    if (predicted >= required_energy) {
      const confidence = getConfidence(predicted, required_energy, energyPattern);
      return {
        suggested_time: candidate,
        reason: getReason(taskCLS, candidateHour, predicted),
        confidence,
        predicted_energy: predicted,
      };
    }
  }

  // Default: same time tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 3600000);
  return {
    suggested_time: tomorrow,
    reason: 'No optimal slot found in next 48 hours',
    confidence: 'low',
    predicted_energy: 2,
  };
}

/**
 * Get multiple reschedule options
 * Returns top 3 suggestions
 */
export function getMultipleRescheduleOptions(
  task: Task,
  energyPattern: EnergyByHour[]
): RescheduleOption[] {
  const now = new Date();
  const taskCLS = task.cognitive_load_score || 5;
  const required_energy = taskCLS >= 7 ? 2.5 : taskCLS >= 4 ? 1.5 : 1.0;
  const options: RescheduleOption[] = [];

  // Scan next 48 hours
  for (let hoursAhead = 1; hoursAhead <= 48; hoursAhead++) {
    const candidate = new Date(now.getTime() + hoursAhead * 3600000);
    const candidateHour = candidate.getHours();

    // Check deadline constraint
    if (task.deadline_at) {
      const deadline = new Date(task.deadline_at);
      const taskDuration = (task.estimated_minutes || 30) * 60 * 1000;
      if (candidate.getTime() + taskDuration > deadline.getTime()) {
        continue;
      }
    }

    const predicted =
      energyPattern.find(p => p.hour_of_day === candidateHour)?.avg_energy ?? 2;

    if (predicted >= required_energy) {
      const confidence = getConfidence(predicted, required_energy, energyPattern);
      options.push({
        suggested_time: candidate,
        reason: getReason(taskCLS, candidateHour, predicted),
        confidence,
        predicted_energy: predicted,
      });

      if (options.length >= 3) break; // Got enough options
    }
  }

  return options.length > 0 ? options : [suggestRescheduleTime(task, energyPattern)];
}

/**
 * Calculate confidence in the suggestion
 */
function getConfidence(
  predicted: number,
  required: number,
  pattern: EnergyByHour[]
): 'high' | 'medium' | 'low' {
  const buffer = predicted - required;
  const sampleSize = pattern.reduce((sum, p) => sum + p.sample_size, 0);

  if (buffer >= 0.5 && sampleSize >= 10) return 'high';
  if (buffer >= 0.3 || sampleSize >= 5) return 'medium';
  return 'low';
}

/**
 * Generate human-readable reason
 */
function getReason(cls: number, hour: number, energy: number): string {
  const timeLabel = formatHour(hour);
  const dayLabel = getDayLabel(hour);

  if (cls >= 7) {
    return `${timeLabel} ${dayLabel} — your peak hour for deep work (predicted energy: ${energy.toFixed(
      1
    )})`;
  }

  if (cls >= 4) {
    return `${timeLabel} ${dayLabel} — good energy match for moderate tasks`;
  }

  return `${timeLabel} ${dayLabel} — suitable for light work`;
}

/**
 * Format hour for display
 */
function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Get day label (today, tomorrow, day name)
 */
function getDayLabel(targetHour: number): string {
  const now = new Date();
  const currentHour = now.getHours();

  if (targetHour > currentHour) {
    return 'today';
  } else if (targetHour <= currentHour && targetHour + 24 > currentHour) {
    return 'tomorrow';
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDate = new Date(now);
  const hoursDiff = targetHour - currentHour;
  targetDate.setHours(targetDate.getHours() + hoursDiff);

  return days[targetDate.getDay()];
}

/**
 * Batch reschedule multiple tasks
 * Distributes tasks across optimal time slots without overlap
 */
export function batchReschedule(
  tasks: Task[],
  energyPattern: EnergyByHour[]
): Map<string, RescheduleOption> {
  const schedule = new Map<string, RescheduleOption>();
  const bookedSlots = new Set<number>(); // Track hours already booked

  // Sort tasks by CLS (highest first - schedule demanding tasks first)
  const sortedTasks = [...tasks].sort(
    (a, b) => (b.cognitive_load_score || 5) - (a.cognitive_load_score || 5)
  );

  for (const task of sortedTasks) {
    const now = new Date();
    const taskCLS = task.cognitive_load_score || 5;
    const required_energy = taskCLS >= 7 ? 2.5 : taskCLS >= 4 ? 1.5 : 1.0;

    // Find next available slot
    for (let hoursAhead = 1; hoursAhead <= 48; hoursAhead++) {
      const candidate = new Date(now.getTime() + hoursAhead * 3600000);
      const candidateHour = candidate.getHours();
      const slotKey = Math.floor(candidate.getTime() / 3600000); // Unique hour slot

      if (bookedSlots.has(slotKey)) continue; // Slot already taken

      // Check deadline
      if (task.deadline_at) {
        const deadline = new Date(task.deadline_at);
        const taskDuration = (task.estimated_minutes || 30) * 60 * 1000;
        if (candidate.getTime() + taskDuration > deadline.getTime()) {
          continue;
        }
      }

      const predicted =
        energyPattern.find(p => p.hour_of_day === candidateHour)?.avg_energy ?? 2;

      if (predicted >= required_energy) {
        const confidence = getConfidence(predicted, required_energy, energyPattern);
        schedule.set(task.id, {
          suggested_time: candidate,
          reason: getReason(taskCLS, candidateHour, predicted),
          confidence,
          predicted_energy: predicted,
        });

        // Book this slot (and next hour if task is >60 min)
        const hoursNeeded = Math.ceil((task.estimated_minutes || 30) / 60);
        for (let h = 0; h < hoursNeeded; h++) {
          bookedSlots.add(slotKey + h);
        }

        break; // Found slot for this task
      }
    }
  }

  return schedule;
}

/**
 * Check if reschedule is needed based on current context
 */
export function shouldReschedule(
  task: Task,
  currentEnergy: number,
  energyPattern: EnergyByHour[]
): boolean {
  const taskCLS = task.cognitive_load_score || 5;
  const required_energy = taskCLS >= 7 ? 2.5 : taskCLS >= 4 ? 1.5 : 1.0;

  // If current energy is too low for this task
  if (currentEnergy < required_energy - 0.5) {
    // Check if there's a better time coming up
    const now = new Date();
    for (let hoursAhead = 1; hoursAhead <= 6; hoursAhead++) {
      const candidate = new Date(now.getTime() + hoursAhead * 3600000);
      const candidateHour = candidate.getHours();
      const predicted =
        energyPattern.find(p => p.hour_of_day === candidateHour)?.avg_energy ?? 2;

      if (predicted >= required_energy) {
        return true; // Better time exists soon
      }
    }
  }

  return false;
}
