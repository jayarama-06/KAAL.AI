/**
 * Quick compilation test for KAAL Agent
 * This file verifies all imports work correctly
 */

// Test orchestrator imports
import { processBrainDump, getLiveFeedback } from './lib/brainDumpOrchestrator';

// Test parser imports
import {
  segmentDump,
  classifyItem,
  extractTemporalSignals,
  TaskGraph,
  findDuplicates,
  buildFocusSchedule,
  detectEmotionalLoad,
  getEmotionalLoadEmoji,
  getEmotionalLoadColor,
  getLoadUITreatment,
  formatDeadline,
  getUrgencyColor,
  formatFocusTime,
} from './lib/brainDumpParser';

// Test type imports
import type {
  Intent,
  BrainDumpResult,
  ExtractedTask,
  ScheduledTask,
  EmotionalLoadReport,
} from './lib/brainDumpParser/types';

// Test component imports
import { BrainDumpAgent } from './components/BrainDumpAgent';
import { KaalAgentScreenSimplified } from './components/KaalAgentScreenSimplified';

console.log('✅ All imports compile successfully!');

export const testCompilation = true;
