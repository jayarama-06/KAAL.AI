// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Master Orchestrator
// Wires all 8 engines together into one processing pipeline
// ═══════════════════════════════════════════════════════════════════════════

import { segmentDump } from './brainDumpParser/segmenter';
import { KAAL_TRIE } from './brainDumpParser/keywordTrie';
import { classifyItem, type ItemType } from './brainDumpParser/itemClassifier';
import { getIntentConfig, type Intent } from './brainDumpParser/intentRouter';
import { extractTemporalSignals } from './brainDumpParser/temporalExtractor';
import { TaskGraph } from './brainDumpParser/dependencyGraph';
import { findDuplicates } from './brainDumpParser/deduplicator';
import { buildFocusSchedule } from './brainDumpParser/scheduleBuilder';
import { detectEmotionalLoad } from './brainDumpParser/emotionalLoadDetector';
import { getCurrentHourInTimezone, loadTimezonePreference } from './timezone-service';
import type {
  BrainDumpResult,
  ExtractedTask,
  UserEnergyPattern,
} from './brainDumpParser/types';

/**
 * Master function that orchestrates all 8 engines
 * Called when user clicks "Organize + Create Tasks"
 */
export async function processBrainDump(
  rawText: string,
  intent: Intent,
  userId: string,
  userEnergyPattern: UserEnergyPattern = {}
): Promise<BrainDumpResult> {
  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 1: Parse and segment
  // ═══════════════════════════════════════════════════════════════════════════

  const segments = segmentDump(rawText);
  console.log('KAAL Agent: Segmented into', segments.length, 'items');

  if (segments.length === 0) {
    // Empty brain dump
    return {
      response_opening: 'No items detected. Try describing what you need to do.',
      tasks: [],
      worries: [],
      ideas: [],
      blockers: [],
      reminders: [],
      schedule: [],
      dependency_chains: [],
      duplicate_clusters: [],
      emotional_load: {
        load_level: 'calm',
        score: 0,
        dominant_signal: '',
        kaal_response_tone: 'calm',
        suggested_action: '',
        show_break_suggestion: false,
      },
      total_extracted: 0,
      total_hidden: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 2A: Classify each item
  // (Engine 8: TinyML would override here if trained model exists)
  // ═══════════════════════════════════════════════════════════════════════════

  const classified = segments.map((seg) => classifyItem(seg, KAAL_TRIE));
  console.log('KAAL Agent: Classified', classified.length, 'items');

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 3: Extract temporal signals (TIMEZONE-AWARE)
  // ═══════════════════════════════════════════════════════════════════════════

  const userTimezone = loadTimezonePreference();
  const currentHour = getCurrentHourInTimezone(userTimezone);
  const withTemporal: ExtractedTask[] = classified.map((item) => ({
    ...item,
    ...extractTemporalSignals(item.text, currentHour, userTimezone), // Pass timezone for full awareness
  }));

  console.log(
    'KAAL Agent: Extracted temporal signals (timezone:',
    userTimezone,
    ')',
    withTemporal.filter((t) => t.deadline_at).length,
    'deadlines found'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 4: Build dependency graph
  // ═══════════════════════════════════════════════════════════════════════════

  const deps = TaskGraph.detectDependencies(segments);
  const graph = new TaskGraph();

  // Add all tasks to graph
  withTemporal
    .filter((item) => item.type === 'task')
    .forEach((item, index) => {
      graph.addTask(`task_${index}`, item.text);
    });

  // Add detected dependencies
  deps.forEach((d) => {
    const fromNode = graph.findClosestTask(d.before);
    const toNode = graph.findClosestTask(d.after);
    if (fromNode && toNode) {
      graph.addDependency(fromNode.id, toNode.id);
    }
  });

  const orderedTasks = graph.topologicalSort();
  console.log('KAAL Agent: Found', deps.length, 'dependencies');

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 5: Deduplicate
  // ═══════════════════════════════════════════════════════════════════════════

  const taskTexts = withTemporal.filter((i) => i.type === 'task').map((i) => i.text);
  const duplicateClusters = findDuplicates(taskTexts);
  console.log('KAAL Agent: Found', duplicateClusters.length, 'duplicate clusters');

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 6: Build schedule
  // ═══════════════════════════════════════════════════════════════════════════

  const tasks = withTemporal.filter((i) => i.type === 'task');
  const schedule = buildFocusSchedule(tasks, userEnergyPattern, new Date().getHours());
  console.log('KAAL Agent: Built schedule with', schedule.length, 'tasks');

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 7: Detect emotional load
  // ═══════════════════════════════════════════════════════════════════════════

  const worries = withTemporal.filter((i) => i.type === 'worry');
  const emotionalLoad = detectEmotionalLoad(rawText, segments.length, worries.length, intent);
  console.log('KAAL Agent: Emotional load:', emotionalLoad.load_level, '(score:', emotionalLoad.score, ')');

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE 2B: Apply intent config
  // ═══════════════════════════════════════════════════════════════════════════

  const config = getIntentConfig(intent);
  console.log('KAAL Agent: Applying intent config for', intent);

  // Filter by type
  let filteredTasks = withTemporal.filter((t) => !config.filterOutTypes.includes(t.type));

  // Sort tasks based on intent
  if (config.sortBy === 'urgency') {
    filteredTasks.sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));
  } else if (config.sortBy === 'deadline') {
    filteredTasks.sort((a, b) => {
      if (!a.deadline_at) return 1;
      if (!b.deadline_at) return -1;
      return a.deadline_at.getTime() - b.deadline_at.getTime();
    });
  } else if (config.sortBy === 'completion_ease') {
    filteredTasks.sort((a, b) => {
      // Prefer shorter tasks
      const aTime = a.estimated_minutes ?? 30;
      const bTime = b.estimated_minutes ?? 30;
      return aTime - bTime;
    });
  } else if (config.sortBy === 'dependency_order') {
    // Use topological sort order
    const orderedIds = new Set(orderedTasks.map((n) => n.id));
    filteredTasks.sort((a, b) => {
      const aInGraph = orderedTasks.findIndex((n) => n.text === a.text);
      const bInGraph = orderedTasks.findIndex((n) => n.text === b.text);
      if (aInGraph === -1) return 1;
      if (bInGraph === -1) return -1;
      return aInGraph - bInGraph;
    });
  }

  // Limit number of tasks shown
  const tasksToShow = filteredTasks.filter((t) => t.type === 'task').slice(0, config.maxTasksToShow);
  const totalHidden = Math.max(0, tasks.length - tasksToShow.length);

  // Override with emotional load limits if stricter
  const loadTreatment = emotionalLoad.load_level === 'crisis' ? 1
    : emotionalLoad.load_level === 'overwhelmed' ? 3
    : emotionalLoad.load_level === 'stressed' ? 6
    : config.maxTasksToShow;

  const finalTasks = tasksToShow.slice(0, Math.min(tasksToShow.length, loadTreatment));

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD RESPONSE
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    response_opening: emotionalLoad.suggested_action || config.responseTemplate,
    tasks: finalTasks,
    worries: config.showWorries ? worries : [],
    ideas: withTemporal.filter((i) => i.type === 'idea'),
    blockers: withTemporal.filter((i) => i.type === 'blocker'),
    reminders: withTemporal.filter((i) => i.type === 'reminder'),
    schedule,
    dependency_chains: deps,
    dependency_graph: orderedTasks,
    duplicate_clusters: duplicateClusters,
    emotional_load: emotionalLoad,
    total_extracted: segments.length,
    total_hidden: totalHidden,
  };
}

/**
 * Get live feedback as user types (for real-time UI updates)
 */
export function getLiveFeedback(rawText: string): {
  itemCount: number;
  emotionalSignal: 'calm' | 'stressed' | 'overwhelmed';
  dependencyCount: number;
  characterCount: number;
} {
  const segments = segmentDump(rawText);
  const deps = TaskGraph.detectDependencies(segments);

  // Quick emotional check
  const lower = rawText.toLowerCase();
  let emotionalSignal: 'calm' | 'stressed' | 'overwhelmed' = 'calm';

  if (
    /overwhelmed|drowning|panic|crisis|too much|cant cope/i.test(lower) ||
    segments.length > 10
  ) {
    emotionalSignal = 'overwhelmed';
  } else if (
    /stressed|anxious|worried|struggling|behind/i.test(lower) ||
    segments.length > 6
  ) {
    emotionalSignal = 'stressed';
  }

  return {
    itemCount: segments.length,
    emotionalSignal,
    dependencyCount: deps.length,
    characterCount: rawText.length,
  };
}