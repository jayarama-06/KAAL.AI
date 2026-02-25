// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Type Definitions
// Shared types across all engines
// ═══════════════════════════════════════════════════════════════════════════

import { ItemType, ClassifiedItem } from './itemClassifier';
import { TemporalSignals } from './temporalExtractor';
import { Intent } from './intentRouter';
import { EmotionalLoadReport } from './emotionalLoadDetector';
import { TaskNode, Dependency } from './dependencyGraph';

// Re-export Intent for convenience
export type { Intent };

/**
 * Extracted task with all signals combined
 */
export interface ExtractedTask extends ClassifiedItem, TemporalSignals {
  cognitive_load_score?: number; // 1-10, will be calculated
}

/**
 * Time block for scheduling
 */
export interface TimeBlock {
  start_hour: number; // e.g. 9
  end_hour: number; // e.g. 11
  energy_level: 1 | 2 | 3; // what energy does this window have?
  label: string; // 'Morning deep work', 'After lunch', etc.
}

/**
 * Scheduled task assigned to time block
 */
export interface ScheduledTask {
  task: ExtractedTask;
  block: TimeBlock;
  starts_at: Date;
  reason: string; // why KAAL put it here
}

/**
 * Complete result from brain dump processing
 */
export interface BrainDumpResult {
  // Opening message from KAAL
  response_opening: string;

  // Categorized items
  tasks: ExtractedTask[];
  worries: ExtractedTask[];
  ideas: ExtractedTask[];
  blockers: ExtractedTask[];
  reminders: ExtractedTask[];

  // Schedule
  schedule: ScheduledTask[];

  // Dependencies
  dependency_chains: Dependency[];
  dependency_graph?: TaskNode[];

  // Duplicates
  duplicate_clusters: string[][];

  // Emotional state
  emotional_load: EmotionalLoadReport;

  // Stats
  total_extracted: number;
  total_hidden: number; // filtered by intent config
}

/**
 * User's historical energy pattern
 * Maps hour (0-23) to average energy level (1-3)
 */
export type UserEnergyPattern = Record<number, number>;

/**
 * Brain dump processing context
 */
export interface BrainDumpContext {
  rawText: string;
  intent: Intent;
  userId: string;
  userEnergyPattern?: UserEnergyPattern;
}