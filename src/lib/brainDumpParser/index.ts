// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Main Exports
// All engines and utilities
// ═══════════════════════════════════════════════════════════════════════════

// Master orchestrator
export { processBrainDump, getLiveFeedback } from '../brainDumpOrchestrator';

// Engine 1: Segmenter
export { segmentDump, cleanSegment, getSegmentStats } from './segmenter';

// Engine 1B: Keyword Trie
export { KeywordTrie, KAAL_TRIE } from './keywordTrie';

// Engine 2: Classifier
export { classifyItem, classifyItems, getClassificationStats } from './itemClassifier';
export type { ItemType, ClassifiedItem } from './itemClassifier';

// Engine 2B: Intent Router
export {
  getIntentConfig,
  getAvailableIntents,
  getIntentLabel,
  getIntentIcon,
  INTENT_CONFIGS,
} from './intentRouter';
export type { Intent, IntentConfig } from './intentRouter';

// Engine 3: Temporal Extractor
export {
  extractTemporalSignals,
  formatDeadline,
  getUrgencyLabel,
  getUrgencyColor,
} from './temporalExtractor';
export type { TemporalSignals } from './temporalExtractor';

// Engine 4: Dependency Graph
export { TaskGraph } from './dependencyGraph';
export type { TaskNode, Dependency } from './dependencyGraph';

// Engine 5: Deduplicator
export {
  levenshtein,
  jaccardSimilarity,
  taskSimilarity,
  findDuplicates,
  findExistingDuplicates,
  pickBestRepresentative,
  getSimilarityStats,
} from './deduplicator';

// Engine 6: Schedule Builder
export {
  buildFocusSchedule,
  getTotalFocusTime,
  formatFocusTime,
  getScheduleSummary,
} from './scheduleBuilder';

// Engine 7: Emotional Load Detector
export {
  detectEmotionalLoad,
  getEmotionalLoadColor,
  getEmotionalLoadEmoji,
  getEmotionalLoadLabel,
  getLoadUITreatment,
} from './emotionalLoadDetector';
export type { EmotionalLoadLevel, EmotionalLoadReport } from './emotionalLoadDetector';

// Types
export type {
  ExtractedTask,
  TimeBlock,
  ScheduledTask,
  BrainDumpResult,
  UserEnergyPattern,
  BrainDumpContext,
} from './types';
