// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 6: Energy-Aware Schedule Builder
// Build a focus schedule using greedy interval scheduling + priority queue
// ═══════════════════════════════════════════════════════════════════════════

import { ExtractedTask, TimeBlock, ScheduledTask, UserEnergyPattern } from './types';

/**
 * Min-Heap (Priority Queue) for O(log n) insertion
 */
class MinHeap<T> {
  private data: T[] = [];

  constructor(private compareFn: (a: T, b: T) => number) {}

  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const min = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  get size(): number {
    return this.data.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compareFn(this.data[parent], this.data[i]) <= 0) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.compareFn(this.data[l], this.data[min]) < 0) min = l;
      if (r < n && this.compareFn(this.data[r], this.data[min]) < 0) min = r;
      if (min === i) break;
      [this.data[i], this.data[min]] = [this.data[min], this.data[i]];
      i = min;
    }
  }
}

/**
 * Calculate cognitive load score for a task
 * Based on type, complexity signals, and estimated duration
 */
function calculateCognitiveLoad(task: ExtractedTask): number {
  let score = 5; // base score

  // Task type affects cognitive load
  if (task.type === 'task') {
    // Check for complexity signals in text
    const text = task.text.toLowerCase();

    if (/write|design|plan|strategy|create|research|analyze/i.test(text)) score += 3;
    if (/quick|simple|easy|brief/i.test(text)) score -= 2;
    if (/complex|difficult|hard|challenging/i.test(text)) score += 2;

    // Duration affects load
    if (task.estimated_minutes) {
      if (task.estimated_minutes > 120) score += 2;
      else if (task.estimated_minutes < 20) score -= 1;
    }

    // Urgency creates mental load
    score += Math.min(task.urgency_score || 0, 2);
  } else {
    // Non-task items have lower cognitive load
    score -= 2;
  }

  return Math.max(1, Math.min(10, score));
}

/**
 * Build time blocks from now until end of day
 * Uses user's historical energy pattern
 * NOW RESPECTS SLEEP SCHEDULE: Won't schedule past 10pm or before 6am
 */
function buildTimeBlocks(
  userEnergyPattern: UserEnergyPattern,
  startFromHour: number
): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const BLOCK_SIZE = 2; // hours per block
  const END_HOUR = 22; // end at 10pm (sleep boundary)
  const START_HOUR = Math.max(startFromHour, 6); // never schedule before 6am

  // If it's past 10pm, no blocks available
  if (startFromHour >= END_HOUR) {
    return [];
  }

  for (let h = START_HOUR; h < END_HOUR; h += BLOCK_SIZE) {
    // Calculate average energy for this block
    const energyValues: number[] = [];
    for (let i = h; i < h + BLOCK_SIZE && i < 24; i++) {
      energyValues.push(userEnergyPattern[i] ?? 2);
    }
    const avgEnergy =
      energyValues.reduce((sum, e) => sum + e, 0) / energyValues.length;

    // Map to energy level (1/2/3)
    const energy_level: 1 | 2 | 3 = avgEnergy >= 2.5 ? 3 : avgEnergy >= 1.5 ? 2 : 1;

    // Label the block with context-aware names
    const label =
      h <= 11 ? 'Morning' : h <= 14 ? 'Midday' : h <= 17 ? 'Afternoon' : 'Evening';

    blocks.push({
      start_hour: h,
      end_hour: Math.min(h + BLOCK_SIZE, 24),
      energy_level,
      label,
    });
  }

  return blocks;
}

/**
 * Build focus schedule from extracted tasks
 * Assigns tasks to energy-matched time blocks using greedy algorithm
 */
export function buildFocusSchedule(
  tasks: ExtractedTask[],
  userEnergyPattern: UserEnergyPattern = {},
  startFromHour: number = new Date().getHours()
): ScheduledTask[] {
  // Calculate cognitive load for all tasks
  tasks.forEach((task) => {
    task.cognitive_load_score = calculateCognitiveLoad(task);
  });

  // Build time blocks
  const blocks = buildTimeBlocks(userEnergyPattern, startFromHour);

  if (blocks.length === 0) {
    return []; // No time left today
  }

  // Sort tasks by urgency score descending (heap gives O(log n) ordering)
  const taskHeap = new MinHeap<ExtractedTask>(
    (a, b) => (b.urgency_score || 0) - (a.urgency_score || 0) // highest urgency first
  );

  tasks.filter((t) => t.type === 'task').forEach((t) => taskHeap.push(t));

  // Track capacity used in each block
  const blockCapacity = new Map<number, number>(); // block index → minutes used
  blocks.forEach((_, i) => blockCapacity.set(i, 0));

  const schedule: ScheduledTask[] = [];

  // Greedy assignment: for each task, find best-fit block
  while (taskHeap.size > 0) {
    const task = taskHeap.pop()!;
    const requiredEnergy =
      (task.cognitive_load_score ?? 5) >= 7 ? 3 : (task.cognitive_load_score ?? 5) >= 4 ? 2 : 1;
    const duration = task.estimated_minutes ?? 30;

    // Find best block: energy match + has capacity + meets deadline
    let bestBlock: { block: TimeBlock; index: number; score: number } | null = null;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const used = blockCapacity.get(i)!;
      const blockMinutes = (block.end_hour - block.start_hour) * 60;

      // Check fit: energy compatible + has room
      const energyMatch = block.energy_level >= requiredEnergy;
      const hasCapacity = used + duration <= blockMinutes;

      // Check deadline: must fit before deadline
      const blockStartTime = new Date();
      blockStartTime.setHours(block.start_hour, used, 0, 0);
      const deadlineOk = !task.deadline_at || blockStartTime < task.deadline_at;

      // Check time-of-day preference
      const preferenceMatch =
        !task.time_of_day_preference ||
        (task.time_of_day_preference === 'morning' && block.start_hour < 12) ||
        (task.time_of_day_preference === 'afternoon' &&
          block.start_hour >= 12 &&
          block.start_hour < 17) ||
        (task.time_of_day_preference === 'evening' && block.start_hour >= 17);

      if (energyMatch && hasCapacity && deadlineOk) {
        // Score this block (prefer exact energy match + time preference)
        let score = 0;
        score += block.energy_level === requiredEnergy ? 10 : 5; // exact match bonus
        score += preferenceMatch ? 5 : 0;
        score -= Math.abs(block.energy_level - requiredEnergy) * 2; // penalty for mismatch

        if (!bestBlock || score > bestBlock.score) {
          bestBlock = { block, index: i, score };
        }
      }
    }

    // Assign to best block if found
    if (bestBlock) {
      const starts_at = new Date();
      starts_at.setHours(bestBlock.block.start_hour, blockCapacity.get(bestBlock.index)!, 0, 0);

      blockCapacity.set(bestBlock.index, blockCapacity.get(bestBlock.index)! + duration);

      const energyLabel =
        bestBlock.block.energy_level === 3
          ? 'peak'
          : bestBlock.block.energy_level === 2
          ? 'steady'
          : 'low';

      schedule.push({
        task,
        block: bestBlock.block,
        starts_at,
        reason: `${bestBlock.block.label} — your ${energyLabel} energy window`,
      });
    }
  }

  // Sort by start time
  return schedule.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}

/**
 * Get total focus time from schedule
 */
export function getTotalFocusTime(schedule: ScheduledTask[]): number {
  return schedule.reduce((sum, s) => sum + (s.task.estimated_minutes ?? 30), 0);
}

/**
 * Format focus time for display
 */
export function formatFocusTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Get schedule summary by time block
 */
export function getScheduleSummary(schedule: ScheduledTask[]): {
  block: TimeBlock;
  tasks: ScheduledTask[];
  totalMinutes: number;
}[] {
  const blockMap = new Map<string, { block: TimeBlock; tasks: ScheduledTask[] }>();

  schedule.forEach((scheduledTask) => {
    const key = `${scheduledTask.block.start_hour}-${scheduledTask.block.end_hour}`;
    if (!blockMap.has(key)) {
      blockMap.set(key, {
        block: scheduledTask.block,
        tasks: [],
      });
    }
    blockMap.get(key)!.tasks.push(scheduledTask);
  });

  return Array.from(blockMap.values()).map(({ block, tasks }) => ({
    block,
    tasks,
    totalMinutes: tasks.reduce((sum, t) => sum + (t.task.estimated_minutes ?? 30), 0),
  }));
}