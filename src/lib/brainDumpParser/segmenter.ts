// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 1: Smart Brain Dump Parser
// Segments messy, unpunctuated text into individual items
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Split patterns for segmenting brain dump text
 * Works with commas, natural connectors, newlines, and "I need" restarts
 */
const SPLIT_PATTERNS = [
  /\n+/, // newlines
  /,\s*/, // commas
  /;\s*/, // semicolons
  /\s+(?:and|also|plus|then|but)\s+/i, // natural connectors
  /(?<=\w)\s+(?=I\s+(?:need|have|must|should|want|forgot))/i, // 'I need' restart
  /(?<=\.)\s+/, // after period
];

/**
 * Segment a brain dump into individual items
 * Handles messy, stream-of-consciousness text without punctuation
 *
 * @param rawText - Raw brain dump text from user
 * @returns Array of individual segments (potential tasks/worries/ideas)
 *
 * @example
 * Input: 'finish report, call john also forgot dentist tomorrow stressed about deadline'
 * Output: ['finish report', 'call john', 'forgot dentist tomorrow', 'stressed about deadline']
 */
export function segmentDump(rawText: string): string[] {
  let segments = [rawText.trim()];

  // Apply each split pattern progressively
  for (const pattern of SPLIT_PATTERNS) {
    segments = segments.flatMap((s) => s.split(pattern));
  }

  return (
    segments
      .map((s) => s.trim())
      .filter((s) => s.length > 3) // remove empty/trivial
      .filter((s) => s.split(' ').length >= 2) // need at least 2 words
      // Remove obvious fragments
      .filter((s) => !/^(the|a|an|and|or|but)$/i.test(s))
  );
}

/**
 * Clean individual segment
 * Removes leading/trailing articles, normalizes whitespace
 */
export function cleanSegment(segment: string): string {
  return segment
    .trim()
    .replace(/^(the|a|an)\s+/i, '') // remove leading articles
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/^(i need to|i have to|i must|i should|i want to)\s+/i, ''); // remove modal phrases
}

/**
 * Get segment statistics
 */
export function getSegmentStats(segments: string[]): {
  total: number;
  avgLength: number;
  shortCount: number;
  longCount: number;
} {
  return {
    total: segments.length,
    avgLength: Math.round(
      segments.reduce((sum, s) => sum + s.length, 0) / segments.length
    ),
    shortCount: segments.filter((s) => s.split(' ').length <= 3).length,
    longCount: segments.filter((s) => s.split(' ').length > 8).length,
  };
}
