// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 2: Item Classifier + Intent Router
// Separate tasks from worries from ideas · Uses weighted scoring
// ═══════════════════════════════════════════════════════════════════════════

import { KeywordTrie } from './keywordTrie';

export type ItemType = 'task' | 'worry' | 'idea' | 'blocker' | 'reminder';

export interface ClassifiedItem {
  text: string;
  type: ItemType;
  confidence: number; // 0-1
  signals: string[]; // which keywords triggered this classification
}

/**
 * Classify a text segment as task/worry/idea/blocker/reminder
 * Uses Trie-based keyword matching + structural analysis
 */
export function classifyItem(segment: string, trie: KeywordTrie): ClassifiedItem {
  const matches = trie.scan(segment);
  const scores: Record<ItemType, number> = {
    task: 0,
    worry: 0,
    idea: 0,
    blocker: 0,
    reminder: 0,
  };

  // Score based on trie matches
  for (const match of matches) {
    if (match.category === 'action') scores.task += match.weight;
    if (match.category === 'worry') scores.worry += match.weight;
    if (match.category === 'blocker') scores.blocker += match.weight;
    if (match.category === 'urgency') scores.task += match.weight * 0.5;
    if (match.category === 'idea') scores.idea += match.weight;
    if (match.category === 'reminder') scores.reminder += match.weight;
  }

  // Structural signals
  const lower = segment.toLowerCase();

  // Starts with action verb → strong task signal
  if (
    /^(finish|write|call|email|fix|build|create|send|review|check|update|prepare|schedule|book|pay|buy|contact|reply|draft|edit|clean|organize|setup|start|make|do|get|take)/i.test(
      segment
    )
  ) {
    scores.task += 3;
  }

  // 'what if' / 'maybe' / 'should I' → idea signal
  if (/what if|maybe|could|should i|might|consider|idea|would be cool/i.test(lower)) {
    scores.idea += 2;
  }

  // 'don't forget' / 'remember to' → reminder
  if (/don.t forget|remember to|remind me|make sure/i.test(lower)) {
    scores.reminder += 3;
  }

  // 'I feel' / 'I'm' + emotion word → worry
  if (/i feel|i.m (stressed|worried|overwhelmed|anxious|scared|lost)/i.test(lower)) {
    scores.worry += 3;
  }

  // Contains 'I can't' or 'unable to' → worry or blocker
  if (/i can.t|unable to|impossible to/i.test(lower)) {
    scores.worry += 2;
  }

  // Question format often indicates uncertainty/idea
  if (segment.includes('?')) {
    scores.idea += 1;
  }

  // Very short segments with action verbs are likely tasks
  const wordCount = segment.split(' ').length;
  if (wordCount <= 3 && scores.task > 0) {
    scores.task += 1;
  }

  // Find winner
  const entries = Object.entries(scores) as [ItemType, number][];
  const winner = entries.sort((a, b) => b[1] - a[1])[0];

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? winner[1] / total : 0.33;

  return {
    text: segment,
    type: winner[1] > 0 ? winner[0] : 'task', // default to task
    confidence: Math.min(0.97, confidence),
    signals: matches.map((m) => m.phrase),
  };
}

/**
 * Batch classify multiple segments
 */
export function classifyItems(
  segments: string[],
  trie: KeywordTrie
): ClassifiedItem[] {
  return segments.map((seg) => classifyItem(seg, trie));
}

/**
 * Get statistics about classified items
 */
export function getClassificationStats(items: ClassifiedItem[]): {
  total: number;
  byType: Record<ItemType, number>;
  avgConfidence: number;
  highConfidenceCount: number;
} {
  const byType: Record<ItemType, number> = {
    task: 0,
    worry: 0,
    idea: 0,
    blocker: 0,
    reminder: 0,
  };

  let totalConfidence = 0;
  let highConfidenceCount = 0;

  items.forEach((item) => {
    byType[item.type]++;
    totalConfidence += item.confidence;
    if (item.confidence >= 0.7) highConfidenceCount++;
  });

  return {
    total: items.length,
    byType,
    avgConfidence: items.length > 0 ? totalConfidence / items.length : 0,
    highConfidenceCount,
  };
}
