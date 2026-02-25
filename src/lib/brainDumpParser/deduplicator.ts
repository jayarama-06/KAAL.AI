// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 5: Duplicate Detector + Task Merger
// Stop the same task appearing 3 times using Levenshtein + Jaccard
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Levenshtein Distance — O(nm) where n,m = string lengths
 * Best for: short strings, typos, minor rewording
 */
export function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[a.length][b.length];
}

/**
 * Jaccard Similarity — best for paraphrases with same meaning
 * 'finish the report' vs 'complete the report' → high Jaccard
 */
export function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  // Remove stopwords for better signal
  const STOPWORDS = new Set([
    'the',
    'a',
    'an',
    'i',
    'to',
    'for',
    'and',
    'or',
    'my',
    'your',
    'this',
    'that',
    'it',
    'of',
    'in',
    'on',
    'at',
    'by',
    'with',
    'from',
    'as',
    'is',
    'was',
    'are',
    'be',
    'have',
    'has',
  ]);

  wordsA.forEach((w) => STOPWORDS.has(w) && wordsA.delete(w));
  wordsB.forEach((w) => STOPWORDS.has(w) && wordsB.delete(w));

  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Combined similarity score
 * Balances exact matching (Levenshtein) with semantic matching (Jaccard)
 */
export function taskSimilarity(a: string, b: string): number {
  const lev = levenshtein(a.toLowerCase(), b.toLowerCase());
  const levSim = 1 - lev / Math.max(a.length, b.length);
  const jaccard = jaccardSimilarity(a, b);

  // Jaccard weighted higher for paraphrases
  return levSim * 0.4 + jaccard * 0.6;
}

const SIMILARITY_THRESHOLD = 0.65; // above this → consider duplicate

/**
 * Find all duplicate clusters using Union-Find
 * Groups similar tasks together
 */
export function findDuplicates(tasks: string[]): string[][] {
  if (tasks.length === 0) return [];

  const parent = tasks.map((_, i) => i);

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]; // path compression
      i = parent[i];
    }
    return i;
  }

  function union(i: number, j: number): void {
    parent[find(i)] = find(j);
  }

  // Find all similar pairs and union them
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      if (taskSimilarity(tasks[i], tasks[j]) >= SIMILARITY_THRESHOLD) {
        union(i, j);
      }
    }
  }

  // Group by root
  const groups = new Map<number, string[]>();
  tasks.forEach((task, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(task);
  });

  // Return only groups with 2+ items (actual duplicates)
  return [...groups.values()].filter((g) => g.length > 1);
}

/**
 * Find duplicates against existing tasks in database
 * Returns matches with similarity scores
 */
export function findExistingDuplicates(
  newTask: string,
  existingTasks: string[]
): Array<{ task: string; similarity: number }> {
  return existingTasks
    .map((existing) => ({
      task: existing,
      similarity: taskSimilarity(newTask, existing),
    }))
    .filter((match) => match.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Merge duplicate tasks by picking the best representative
 * Prefers: longer text, action verb at start, more specific
 */
export function pickBestRepresentative(duplicates: string[]): string {
  if (duplicates.length === 0) return '';
  if (duplicates.length === 1) return duplicates[0];

  // Score each task
  const scored = duplicates.map((task) => {
    let score = 0;

    // Longer is usually more specific
    score += task.length * 0.5;

    // Starts with action verb
    if (
      /^(finish|complete|write|build|fix|call|email|send|review|check|update|create)/i.test(
        task
      )
    ) {
      score += 20;
    }

    // Has deadline info
    if (/today|tomorrow|by|due|deadline/i.test(task)) {
      score += 15;
    }

    // Has duration info
    if (/min|hour|quick|brief/i.test(task)) {
      score += 10;
    }

    return { task, score };
  });

  // Return highest scored
  scored.sort((a, b) => b.score - a.score);
  return scored[0].task;
}

/**
 * Get similarity statistics for a set of tasks
 */
export function getSimilarityStats(tasks: string[]): {
  totalPairs: number;
  similarPairs: number;
  avgSimilarity: number;
  duplicateClusters: number;
} {
  const pairs: number[] = [];

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const sim = taskSimilarity(tasks[i], tasks[j]);
      pairs.push(sim);
    }
  }

  const duplicates = findDuplicates(tasks);

  return {
    totalPairs: pairs.length,
    similarPairs: pairs.filter((s) => s >= SIMILARITY_THRESHOLD).length,
    avgSimilarity: pairs.length > 0 ? pairs.reduce((a, b) => a + b, 0) / pairs.length : 0,
    duplicateClusters: duplicates.length,
  };
}
