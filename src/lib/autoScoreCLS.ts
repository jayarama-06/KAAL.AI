// ═══════════════════════════════════════════════════════════════════════════
// KAAL Auto-Score CLS (Cognitive Load Score)
// Keyword-based scoring - instant, free, deterministic
// ═══════════════════════════════════════════════════════════════════════════

const HIGH_LOAD_KEYWORDS = [
  'write', 'build', 'design', 'create', 'develop', 'code', 'architect',
  'research', 'analyze', 'strategy', 'plan', 'solve', 'debug', 'implement',
  'pitch', 'present', 'draft', 'thesis', 'report', 'proposal', 'learn',
  'study', 'understand', 'figure out', 'fix', 'refactor', 'review deeply'
];

const LOW_LOAD_KEYWORDS = [
  'email', 'reply', 'respond', 'check', 'update', 'fill', 'form', 'submit',
  'book', 'schedule', 'call', 'message', 'send', 'forward', 'log', 'record',
  'remind', 'read quickly', 'skim', 'pay', 'invoice', 'admin', 'upload'
];

const INTENSITY_MULTIPLIERS = [
  { words: ['urgent', 'critical', 'asap', 'immediately', 'deadline'], boost: +2 },
  { words: ['quick', 'simple', 'easy', 'just', '5 min', '10 min'], boost: -2 },
  { words: ['complex', 'deep', 'thorough', 'complete', 'full'], boost: +2 },
];

/**
 * Auto-score cognitive load from task title
 * Returns: 1-10 (1=trivial, 10=maximum cognitive demand)
 * Call this on every keystroke in task input for live preview
 */
export function autoScoreCLS(taskTitle: string): number {
  const lower = taskTitle.toLowerCase();
  let score = 5; // default: moderate

  // Check high-load keywords
  if (HIGH_LOAD_KEYWORDS.some(k => lower.includes(k))) score += 2;

  // Check low-load keywords
  if (LOW_LOAD_KEYWORDS.some(k => lower.includes(k))) score -= 2;

  // Apply intensity multipliers
  for (const m of INTENSITY_MULTIPLIERS) {
    if (m.words.some(w => lower.includes(w))) score += m.boost;
  }

  // Clamp to 1–10
  return Math.min(10, Math.max(1, score));
}

/**
 * Get human-readable label for CLS score
 */
export function getCLSLabel(score: number): string {
  if (score <= 2) return 'Trivial';
  if (score <= 4) return 'Light';
  if (score <= 6) return 'Moderate';
  if (score <= 8) return 'Demanding';
  return 'Intense';
}

/**
 * Get color for CLS score (for UI badges)
 */
export function getCLSColor(score: number): string {
  if (score <= 2) return '#10B981'; // green
  if (score <= 4) return '#3B82F6'; // blue
  if (score <= 6) return '#F59E0B'; // amber
  if (score <= 8) return '#F97316'; // orange
  return '#EF4444'; // red
}

/**
 * Get emoji indicator for CLS
 */
export function getCLSEmoji(score: number): string {
  if (score <= 2) return '🟢';
  if (score <= 4) return '🔵';
  if (score <= 6) return '🟡';
  if (score <= 8) return '🟠';
  return '🔴';
}
