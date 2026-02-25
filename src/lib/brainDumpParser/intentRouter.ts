// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 2B: Intent Router
// Each button triggers a completely different processing pipeline
// ═══════════════════════════════════════════════════════════════════════════

export type Intent =
  | 'overwhelmed'
  | 'planning'
  | 'stuck'
  | 'rambling'
  | 'priorities'
  | 'endofday';

export interface IntentConfig {
  sortBy:
    | 'urgency'
    | 'energy_match'
    | 'dependency_order'
    | 'completion_ease'
    | 'deadline';
  maxTasksToShow: number;
  showWorries: boolean; // surface worries to acknowledge or suppress
  suggestBreak: boolean;
  responseTemplate: string; // opening line of agent response
  filterOutTypes: string[]; // hide these item types from output
}

/**
 * Configuration for each intent button
 * Completely changes how brain dump is processed
 */
export const INTENT_CONFIGS: Record<Intent, IntentConfig> = {
  overwhelmed: {
    sortBy: 'completion_ease', // show EASIEST tasks first to build momentum
    maxTasksToShow: 3, // fewer tasks → less overwhelm
    showWorries: true, // acknowledge worries, don't suppress them
    suggestBreak: true,
    responseTemplate: "You have a lot going on. Let's start with just 3 things.",
    filterOutTypes: [],
  },

  planning: {
    sortBy: 'deadline', // deadline order for a planning session
    maxTasksToShow: 10,
    showWorries: false, // planning mode → suppress worries, show actions
    suggestBreak: false,
    responseTemplate: "Here's how your day looks. Ordered by deadline.",
    filterOutTypes: ['worry'],
  },

  stuck: {
    sortBy: 'dependency_order', // find what's blocking what
    maxTasksToShow: 5,
    showWorries: true,
    suggestBreak: false,
    responseTemplate: "Let's find the blocker. One thing at a time.",
    filterOutTypes: [],
  },

  rambling: {
    sortBy: 'urgency', // extract signal from noise
    maxTasksToShow: 7,
    showWorries: false,
    suggestBreak: false,
    responseTemplate: 'I extracted the actionable items from your thoughts.',
    filterOutTypes: ['worry', 'idea'], // keep only tasks and reminders
  },

  priorities: {
    sortBy: 'urgency',
    maxTasksToShow: 5,
    showWorries: false,
    suggestBreak: false,
    responseTemplate: 'Your top 5 priorities right now, ranked.',
    filterOutTypes: ['worry', 'idea'],
  },

  endofday: {
    sortBy: 'completion_ease', // what can still be finished today?
    maxTasksToShow: 4,
    showWorries: false,
    suggestBreak: false,
    responseTemplate: 'What can still get done before you close the laptop?',
    filterOutTypes: ['idea'],
  },
};

/**
 * Get config for an intent
 */
export function getIntentConfig(intent: Intent): IntentConfig {
  return INTENT_CONFIGS[intent];
}

/**
 * Get all available intents
 */
export function getAvailableIntents(): Intent[] {
  return Object.keys(INTENT_CONFIGS) as Intent[];
}

/**
 * Get intent label for UI
 */
export function getIntentLabel(intent: Intent): string {
  const labels: Record<Intent, string> = {
    overwhelmed: "I'm overwhelmed",
    planning: 'Planning my day',
    stuck: "I'm stuck",
    rambling: 'Just rambling',
    priorities: 'What are my priorities?',
    endofday: 'End of day review',
  };
  return labels[intent];
}

/**
 * Get intent icon
 */
export function getIntentIcon(intent: Intent): string {
  const icons: Record<Intent, string> = {
    overwhelmed: '😰',
    planning: '📅',
    stuck: '🚧',
    rambling: '💭',
    priorities: '🎯',
    endofday: '🌙',
  };
  return icons[intent];
}
