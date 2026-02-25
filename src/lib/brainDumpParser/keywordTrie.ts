// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 1B: Keyword Trie
// O(m) lookup for any text length - much faster than multiple regex patterns
// ═══════════════════════════════════════════════════════════════════════════

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd = false;
  category: string | null = null;
  weight: number = 1;
}

/**
 * Trie data structure for fast keyword matching
 * Scans text once and matches ALL keywords simultaneously
 */
export class KeywordTrie {
  private root = new TrieNode();

  /**
   * Insert a keyword phrase into the trie
   * @param phrase - Multi-word keyword (e.g., "waiting for")
   * @param category - Category tag (e.g., "blocker")
   * @param weight - Importance weight (default 1)
   */
  insert(phrase: string, category: string, weight = 1): void {
    let node = this.root;
    for (const word of phrase.toLowerCase().split(' ')) {
      if (!node.children.has(word)) {
        node.children.set(word, new TrieNode());
      }
      node = node.children.get(word)!;
    }
    node.isEnd = true;
    node.category = category;
    node.weight = weight;
  }

  /**
   * Scan text and return all matched keywords with their categories
   * Time complexity: O(m) where m = text length
   */
  scan(text: string): Array<{ phrase: string; category: string; weight: number }> {
    const words = text.toLowerCase().split(/\s+/);
    const matches: Array<{ phrase: string; category: string; weight: number }> = [];

    for (let i = 0; i < words.length; i++) {
      let node = this.root;
      let j = i;
      let lastMatch: { phrase: string; category: string; weight: number } | null = null;

      while (j < words.length && node.children.has(words[j])) {
        node = node.children.get(words[j])!;
        if (node.isEnd) {
          lastMatch = {
            phrase: words.slice(i, j + 1).join(' '),
            category: node.category!,
            weight: node.weight,
          };
        }
        j++;
      }

      if (lastMatch) {
        matches.push(lastMatch);
      }
    }

    return matches;
  }

  /**
   * Get all categories present in the trie
   */
  getCategories(): Set<string> {
    const categories = new Set<string>();
    const traverse = (node: TrieNode) => {
      if (node.category) categories.add(node.category);
      node.children.forEach((child) => traverse(child));
    };
    traverse(this.root);
    return categories;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Populate KAAL Trie with keyword dictionaries
// ═══════════════════════════════════════════════════════════════════════════

export const KAAL_TRIE = new KeywordTrie();

// ── URGENCY signals ──
[
  'asap',
  'urgent',
  'critical',
  'immediately',
  'right now',
  'cant wait',
  'overdue',
  'emergency',
  'super urgent',
  'time sensitive',
].forEach((k) => KAAL_TRIE.insert(k, 'urgency', 3));

// ── DEADLINE signals ──
[
  'today',
  'tomorrow',
  'by friday',
  'this week',
  'end of day',
  'eod',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'by tomorrow',
  'due',
  'deadline',
  'before',
  'in 2 days',
  'tonight',
  'this morning',
  'this afternoon',
  'this evening',
  'next week',
  'end of week',
  'by monday',
  'by tuesday',
  'by wednesday',
  'by thursday',
].forEach((k) => KAAL_TRIE.insert(k, 'deadline', 2));

// ── WORRY / ANXIETY signals (not tasks — need different handling) ──
[
  'stressed',
  'worried',
  'anxious',
  'overwhelmed',
  'not sure',
  'dont know',
  'don\'t know',
  'confused',
  'scared',
  'nervous',
  'dreading',
  'behind',
  'failing',
  'stuck',
  'blocked',
  'cant',
  'can\'t',
  'struggling',
  'lost',
  'help',
  'disaster',
  'mess',
  'panic',
  'drowning',
  'falling apart',
  'breaking down',
  'too much',
  'losing it',
  'cant cope',
  'cant breathe',
  'crisis',
].forEach((k) => KAAL_TRIE.insert(k, 'worry', 2));

// ── ACTION verbs — indicates a TASK ──
[
  'finish',
  'complete',
  'write',
  'build',
  'fix',
  'call',
  'email',
  'message',
  'send',
  'review',
  'check',
  'update',
  'prepare',
  'create',
  'schedule',
  'book',
  'pay',
  'buy',
  'read',
  'watch',
  'research',
  'plan',
  'design',
  'test',
  'deploy',
  'submit',
  'upload',
  'download',
  'install',
  'contact',
  'reply',
  'respond',
  'draft',
  'edit',
  'clean',
  'organize',
  'setup',
  'start',
  'begin',
  'make',
  'do',
  'get',
  'take',
].forEach((k) => KAAL_TRIE.insert(k, 'action', 2));

// ── BLOCKER signals ──
[
  'waiting for',
  'blocked by',
  'need approval',
  'cant proceed',
  'can\'t proceed',
  'depends on',
  'waiting on',
  'before i can',
  'need to first',
  'prerequisite',
  'blocked',
  'stuck on',
].forEach((k) => KAAL_TRIE.insert(k, 'blocker', 3));

// ── DURATION signals ──
[
  'quick',
  '5 min',
  '10 min',
  '30 min',
  'an hour',
  'half hour',
  'few minutes',
  'takes long',
  'all day',
  'all afternoon',
  'fast',
  'brief',
  'quick call',
  '15 min',
  '20 min',
  '45 min',
  '1 hour',
  '2 hours',
].forEach((k) => KAAL_TRIE.insert(k, 'duration', 1));

// ── IDEA signals ──
[
  'what if',
  'maybe',
  'could',
  'might',
  'consider',
  'idea',
  'would be cool',
  'thinking about',
  'should i',
  'wondering if',
].forEach((k) => KAAL_TRIE.insert(k, 'idea', 2));

// ── REMINDER signals ──
[
  'dont forget',
  'don\'t forget',
  'remember to',
  'remind me',
  'make sure',
  'need to remember',
].forEach((k) => KAAL_TRIE.insert(k, 'reminder', 2));
