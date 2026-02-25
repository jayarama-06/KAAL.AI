// ═══════════════════════════════════════════════════════════════════════════
// KAAL Agent - Engine 7: Emotional Load Detector
// Detect overwhelm and respond differently using weighted signal scoring
// ═══════════════════════════════════════════════════════════════════════════

import { Intent } from './intentRouter';

export type EmotionalLoadLevel = 'calm' | 'stressed' | 'overwhelmed' | 'crisis';

export interface EmotionalLoadReport {
  load_level: EmotionalLoadLevel;
  score: number; // 0-100
  dominant_signal: string; // what triggered it
  kaal_response_tone: 'supportive' | 'structured' | 'calm';
  suggested_action: string;
  show_break_suggestion: boolean;
}

/**
 * Overwhelm signal categories with weights
 */
const OVERWHELM_SIGNALS = {
  emotional_high: {
    words: [
      'overwhelmed',
      'drowning',
      'cant cope',
      'can\'t cope',
      'falling apart',
      'breaking down',
      'panic',
      'disaster',
      'too much',
      'losing it',
      'cant breathe',
      'can\'t breathe',
      'crisis',
      'meltdown',
      'freaking out',
    ],
    weight: 15,
  },
  emotional_medium: {
    words: [
      'stressed',
      'anxious',
      'worried',
      'scared',
      'nervous',
      'dread',
      'dreading',
      'behind',
      'failing',
      'stuck',
      'confused',
      'lost',
      'struggling',
      'dont know',
      'don\'t know',
      'where to start',
      'help',
    ],
    weight: 8,
  },
  cognitive: {
    words: [
      'so many things',
      'everything at once',
      'all at the same time',
      'not enough time',
      'never finish',
      'impossible',
      'too much to do',
      'running out of time',
      'cant think',
      'can\'t think',
      'brain fog',
    ],
    weight: 6,
  },
};

/**
 * Detect emotional load from text signals + behavioral signals
 */
export function detectEmotionalLoad(
  rawText: string,
  itemCount: number,
  worryCount: number,
  intentButton: Intent | null
): EmotionalLoadReport {
  const lower = rawText.toLowerCase();
  let score = 0;
  let dominantSignal = 'task volume';

  // ═══════════════════════════════════════════════════════════════════════════
  // Score emotional vocabulary
  // ═══════════════════════════════════════════════════════════════════════════

  for (const [group, config] of Object.entries(OVERWHELM_SIGNALS)) {
    for (const word of config.words) {
      if (lower.includes(word)) {
        score += config.weight;
        dominantSignal = word;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Volume signals
  // ═══════════════════════════════════════════════════════════════════════════

  if (itemCount > 15) score += 20;
  else if (itemCount > 10) score += 15;
  else if (itemCount > 6) score += 8;

  // Each worry item adds weight
  score += worryCount * 5;

  // ═══════════════════════════════════════════════════════════════════════════
  // Intent button is a hard override
  // ═══════════════════════════════════════════════════════════════════════════

  if (intentButton === 'overwhelmed') {
    score = Math.max(score, 60);
    dominantSignal = 'user selected "I\'m overwhelmed"';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Text length as proxy for mental clutter
  // ═══════════════════════════════════════════════════════════════════════════

  if (rawText.length > 1200) score += 12;
  else if (rawText.length > 800) score += 10;
  else if (rawText.length > 400) score += 5;

  // ═══════════════════════════════════════════════════════════════════════════
  // Exclamation points and caps (emotional intensity)
  // ═══════════════════════════════════════════════════════════════════════════

  const exclamationCount = (rawText.match(/!/g) || []).length;
  if (exclamationCount > 3) score += 8;
  else if (exclamationCount > 1) score += 4;

  const capsWords = rawText.match(/\b[A-Z]{2,}\b/g);
  if (capsWords && capsWords.length > 2) score += 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // Classify level
  // ═══════════════════════════════════════════════════════════════════════════

  const load_level: EmotionalLoadLevel =
    score >= 70
      ? 'crisis'
      : score >= 45
      ? 'overwhelmed'
      : score >= 20
      ? 'stressed'
      : 'calm';

  // ═══════════════════════════════════════════════════════════════════════════
  // Choose response tone
  // ═══════════════════════════════════════════════════════════════════════════

  const kaal_response_tone =
    load_level === 'crisis' || load_level === 'overwhelmed'
      ? 'supportive'
      : score >= 20
      ? 'structured'
      : 'calm';

  // ═══════════════════════════════════════════════════════════════════════════
  // Suggested action
  // ═══════════════════════════════════════════════════════════════════════════

  const suggested_action =
    load_level === 'crisis'
      ? 'KAAL is going to give you exactly ONE thing to do. Just one. Here it is:'
      : load_level === 'overwhelmed'
      ? 'A lot going on. Let\'s start with just the 3 most important. The rest will wait.'
      : load_level === 'stressed'
      ? 'You have tasks and you have worries. Let\'s separate them.'
      : 'Here\'s everything organized and scheduled.';

  // ═══════════════════════════════════════════════════════════════════════════
  // Break suggestion
  // ═══════════════════════════════════════════════════════════════════════════

  const show_break_suggestion = load_level === 'crisis' || load_level === 'overwhelmed';

  return {
    load_level,
    score,
    dominant_signal: dominantSignal,
    kaal_response_tone,
    suggested_action,
    show_break_suggestion,
  };
}

/**
 * Get color for emotional load level
 */
export function getEmotionalLoadColor(level: EmotionalLoadLevel): string {
  const colors: Record<EmotionalLoadLevel, string> = {
    calm: '#10B981', // green
    stressed: '#F59E0B', // orange
    overwhelmed: '#EF4444', // red
    crisis: '#7C3AED', // purple
  };
  return colors[level];
}

/**
 * Get emoji for emotional load level
 */
export function getEmotionalLoadEmoji(level: EmotionalLoadLevel): string {
  const emojis: Record<EmotionalLoadLevel, string> = {
    calm: '🟢',
    stressed: '🟡',
    overwhelmed: '🔴',
    crisis: '🟣',
  };
  return emojis[level];
}

/**
 * Get label for emotional load level
 */
export function getEmotionalLoadLabel(level: EmotionalLoadLevel): string {
  const labels: Record<EmotionalLoadLevel, string> = {
    calm: 'Calm',
    stressed: 'Stressed',
    overwhelmed: 'Overwhelmed',
    crisis: 'Crisis mode',
  };
  return labels[level];
}

/**
 * Get UI treatment instructions for load level
 */
export function getLoadUITreatment(level: EmotionalLoadLevel): {
  maxTasksToShow: number;
  fontSize: 'large' | 'normal';
  showWorries: boolean;
  bannerColor: string;
  bannerText: string;
} {
  switch (level) {
    case 'crisis':
      return {
        maxTasksToShow: 1,
        fontSize: 'large',
        showWorries: true,
        bannerColor: '#7C3AED',
        bannerText: 'Deep breath. One thing at a time.',
      };
    case 'overwhelmed':
      return {
        maxTasksToShow: 3,
        fontSize: 'normal',
        showWorries: true,
        bannerColor: '#EF4444',
        bannerText: 'Let\'s break this down together.',
      };
    case 'stressed':
      return {
        maxTasksToShow: 6,
        fontSize: 'normal',
        showWorries: true,
        bannerColor: '#F59E0B',
        bannerText: 'You\'ve got this. Let\'s organize.',
      };
    case 'calm':
      return {
        maxTasksToShow: 10,
        fontSize: 'normal',
        showWorries: false,
        bannerColor: '#10B981',
        bannerText: '',
      };
  }
}
