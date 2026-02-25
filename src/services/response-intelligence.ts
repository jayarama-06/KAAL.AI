/**
 * KAAL Response Intelligence
 *
 * Analyses AI response text to:
 * 1. Extract actionable intents → render as action buttons
 * 2. Generate contextual follow-up chips based on what was said
 *
 * No API call — all local signal matching.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedAction {
  id:      string;
  label:   string;
  emoji:   string;
  route?:  string;
  tool?:   'start_focus' | 'create_task' | 'start_break' | 'navigate';
  params?: Record<string, any>;
  style:   'primary' | 'secondary';
}

export interface FollowUpSuggestion {
  text: string;
}

// ─── Action extraction ────────────────────────────────────────────────────────

const ACTION_PATTERNS: Array<{
  pattern:    RegExp;
  build:      (match: RegExpMatchArray, full: string) => ExtractedAction | null;
}> = [
  // Focus session mentions
  {
    pattern: /\b(25|45|60|90|20|30|15)[- ]?(?:min(?:ute)?s?)?\s*(?:focus|deep work|session|sprint|block)\b/i,
    build:   (m) => ({
      id:     'focus',
      label:  `Start ${m[1]}-min Session`,
      emoji:  '🎯',
      route:  '/focus',
      tool:   'start_focus',
      params: { duration: parseInt(m[1]) },
      style:  'primary',
    }),
  },
  // Generic focus/deep work without duration
  {
    pattern: /\b(?:start|begin|open)\s+(?:a\s+)?(?:focus|deep work|pomodoro)\b/i,
    build:   () => ({
      id:     'focus',
      label:  'Start Focus Session',
      emoji:  '🎯',
      route:  '/focus',
      tool:   'start_focus',
      params: { duration: 25 },
      style:  'primary',
    }),
  },
  // Break suggestions
  {
    pattern: /\b(?:take|start|have)\s+a?\s*(?:short\s+)?(?:break|pause|rest|walk)\b/i,
    build:   (m, full) => {
      const dur = /(\d+)[- ]?min/i.exec(full)?.[1];
      return {
        id:     'break',
        label:  dur ? `Take ${dur}-min Break` : 'Take a Break',
        emoji:  '☕',
        tool:   'start_break',
        params: { duration: parseInt(dur ?? '10') },
        style:  'secondary',
      };
    },
  },
  // Task creation
  {
    pattern: /\b(?:add|create|make)\s+(?:that|this|a|it)\s+(?:as\s+a?\s+)?task\b/i,
    build:   () => ({
      id:    'create_task',
      label: 'Add to Tasks',
      emoji: '✅',
      route: '/tasks',
      tool:  'create_task',
      style: 'secondary',
    }),
  },
  // Navigate to tasks
  {
    pattern: /\b(?:review|look at|open|check|see)\s+(?:your\s+)?(?:task(?:s)?|to-?do(?:s)?|queue)\b/i,
    build:   () => ({
      id:    'tasks',
      label: 'Open Tasks',
      emoji: '📋',
      route: '/tasks',
      tool:  'navigate',
      style: 'secondary',
    }),
  },
  // Navigate to energy/analytics
  {
    pattern: /\b(?:log|track|check|update)\s+(?:your\s+)?(?:energy|mood|feeling)\b/i,
    build:   () => ({
      id:    'energy',
      label: 'Log Energy',
      emoji: '⚡',
      route: '/energy',
      tool:  'navigate',
      style: 'secondary',
    }),
  },
];

export function extractActions(responseText: string): ExtractedAction[] {
  const seen    = new Set<string>();
  const actions: ExtractedAction[] = [];
  const lower   = responseText.toLowerCase();

  for (const { pattern, build } of ACTION_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      const action = build(match, lower);
      if (action && !seen.has(action.id)) {
        seen.add(action.id);
        actions.push(action);
      }
    }
  }

  // Limit to 2 actions max to avoid clutter
  return actions.slice(0, 2);
}

// ─── Follow-up suggestion generator ──────────────────────────────────────────

interface FollowUpContext {
  responseText:     string;
  userMessageText:  string;
  pendingTaskCount: number;
  overdueCount:     number;
  energyLevel:      number;
  focusActive:      boolean;
}

const TOPIC_SUGGESTIONS: Array<{
  detect:      (t: string) => boolean;
  suggestions: string[];
}> = [
  {
    detect: t => /overdue|past.*due|missed.*deadline/.test(t),
    suggestions: [
      "Help me tackle the overdue ones",
      "Which overdue task should go first?",
      "Can I defer some of them?",
    ],
  },
  {
    detect: t => /focus session|deep work|pomodoro|sprint/.test(t),
    suggestions: [
      "Start a 25-min session",
      "Start a 45-min session",
      "I need music or conditions first",
    ],
  },
  {
    detect: t => /break|rest|step away|pause/.test(t),
    suggestions: [
      "Start a 10-min break",
      "Just 5 minutes",
      "Keep working for now",
    ],
  },
  {
    detect: t => /overwhelm|too much|can't handle|too many/.test(t),
    suggestions: [
      "What's the ONE thing I should do?",
      "Help me defer tasks",
      "I just need to vent",
    ],
  },
  {
    detect: t => /plan|schedule|today|time block/.test(t),
    suggestions: [
      "Generate my full plan",
      "What's my most important block?",
      "Show me the plan tab",
    ],
  },
  {
    detect: t => /priority|important|urgent|first/.test(t),
    suggestions: [
      "Let's start that now",
      "Break it into steps",
      "What if I'm not ready?",
    ],
  },
  {
    detect: t => /energy|tired|exhaust|low|drained/.test(t),
    suggestions: [
      "What can I do with low energy?",
      "Should I call it a day?",
      "Help me recharge",
    ],
  },
  {
    detect: t => /procrastinat|avoidance|avoiding|haven't started/.test(t),
    suggestions: [
      "Help me just start",
      "What's the 2-minute version?",
      "Why do I keep avoiding it?",
    ],
  },
  {
    detect: t => /complet|done|finished|accomplished/.test(t),
    suggestions: [
      "What's next?",
      "Keep the momentum going",
      "Log a win",
    ],
  },
];

export function generateFollowUps(ctx: FollowUpContext): string[] {
  const lower = ctx.responseText.toLowerCase();

  for (const { detect, suggestions } of TOPIC_SUGGESTIONS) {
    if (detect(lower)) {
      // Return 2–3 suggestions, shuffled slightly
      return suggestions.slice(0, 3);
    }
  }

  // Context-based defaults when no topic matches
  if (ctx.overdueCount > 0) {
    return ["Help me with overdue tasks", "What's the fastest win?", "I'm stressed about these"];
  }
  if (ctx.focusActive) {
    return ["Should I keep going?", "How am I doing?", "I need a break"];
  }
  if (ctx.energyLevel <= 2) {
    return ["What can I do with low energy?", "Should I rest?", "Quick win suggestion"];
  }

  return ["What should I tackle next?", "I have a question", "Help me plan"];
}
