// ═══════════════════════════════════════════════════════════════════════════
// KAAL Auto-Tagging System
// Keyword-based categorization - instant, deterministic, zero cost
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_MAP = {
  Work: [
    'email',
    'meeting',
    'report',
    'presentation',
    'client',
    'project',
    'deadline',
    'proposal',
    'review',
    'feedback',
    'standup',
    'sprint',
    'quarterly',
    'budget',
    'forecast',
    'sync',
    'kickoff',
    'retrospective',
  ],
  Learning: [
    'read',
    'study',
    'course',
    'learn',
    'practice',
    'tutorial',
    'research',
    'watch',
    'lecture',
    'book',
    'article',
    'chapter',
    'documentation',
    'explore',
    'understand',
    'review',
    'notes',
  ],
  Creative: [
    'write',
    'design',
    'draw',
    'build',
    'create',
    'draft',
    'brainstorm',
    'sketch',
    'prototype',
    'ideate',
    'compose',
    'record',
    'produce',
    'film',
    'edit',
    'render',
  ],
  Health: [
    'workout',
    'gym',
    'run',
    'walk',
    'meditate',
    'sleep',
    'doctor',
    'appointment',
    'medicine',
    'yoga',
    'stretch',
    'exercise',
    'therapy',
    'checkup',
    'prescription',
  ],
  Admin: [
    'pay',
    'invoice',
    'tax',
    'form',
    'register',
    'renew',
    'apply',
    'submit',
    'upload',
    'file',
    'book',
    'schedule',
    'cancel',
    'organize',
    'sort',
    'archive',
    'backup',
  ],
  Personal: [
    'call',
    'family',
    'friend',
    'birthday',
    'gift',
    'plan',
    'travel',
    'shop',
    'clean',
    'cook',
    'grocery',
    'home',
    'laundry',
    'dishes',
    'errand',
  ],
};

export type TaskCategory = keyof typeof CATEGORY_MAP | 'Other';

/**
 * Auto-tag task based on title keywords
 * Returns category or 'Other' if no match
 */
export function autoTag(taskTitle: string): TaskCategory {
  const lower = taskTitle.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      return category as TaskCategory;
    }
  }

  return 'Other';
}

/**
 * Get all matching categories (task might fit multiple)
 */
export function getAllMatchingCategories(taskTitle: string): TaskCategory[] {
  const lower = taskTitle.toLowerCase();
  const matches: TaskCategory[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      matches.push(category as TaskCategory);
    }
  }

  return matches.length > 0 ? matches : ['Other'];
}

/**
 * Get category emoji for UI
 */
export function getCategoryEmoji(category: TaskCategory): string {
  const emojis: Record<TaskCategory, string> = {
    Work: '💼',
    Learning: '📚',
    Creative: '🎨',
    Health: '🏃',
    Admin: '📋',
    Personal: '🏠',
    Other: '📌',
  };

  return emojis[category];
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: TaskCategory): string {
  const colors: Record<TaskCategory, string> = {
    Work: '#667EEA', // purple
    Learning: '#3B82F6', // blue
    Creative: '#EC4899', // pink
    Health: '#10B981', // green
    Admin: '#F59E0B', // amber
    Personal: '#F97316', // orange
    Other: '#6B7280', // gray
  };

  return colors[category];
}

/**
 * Boost score for category match with cognitive mode
 * Use this to improve task ranking based on user's current mode
 */
export function getCategoryBoost(
  taskCategory: TaskCategory,
  cognitiveMode: 'deep_focus' | 'admin' | 'learning' | 'mixed'
): number {
  if (cognitiveMode === 'deep_focus') {
    if (taskCategory === 'Creative' || taskCategory === 'Learning') return 2;
  }

  if (cognitiveMode === 'admin') {
    if (taskCategory === 'Admin' || taskCategory === 'Personal') return 2;
  }

  if (cognitiveMode === 'learning') {
    if (taskCategory === 'Learning') return 3;
  }

  return 0; // No boost
}

/**
 * Get recommended cognitive mode for a list of tasks
 * Helps user decide what mode to work in
 */
export function recommendCognitiveMode(
  tasks: Array<{ title: string; cognitive_load_score?: number }>
): 'deep_focus' | 'admin' | 'learning' | 'mixed' {
  if (tasks.length === 0) return 'mixed';

  const categories = tasks.map(t => autoTag(t.title));
  const avgCLS =
    tasks.reduce((sum, t) => sum + (t.cognitive_load_score || 5), 0) / tasks.length;

  // Count categories
  const counts: Record<string, number> = {};
  categories.forEach(cat => {
    counts[cat] = (counts[cat] || 0) + 1;
  });

  // If >50% admin/personal tasks
  if ((counts.Admin || 0) + (counts.Personal || 0) > tasks.length * 0.5) {
    return 'admin';
  }

  // If >50% learning tasks
  if ((counts.Learning || 0) > tasks.length * 0.5) {
    return 'learning';
  }

  // If high average CLS and creative/work tasks dominate
  if (avgCLS >= 6 && ((counts.Creative || 0) + (counts.Work || 0)) > tasks.length * 0.4) {
    return 'deep_focus';
  }

  return 'mixed';
}

/**
 * Get category distribution for analytics
 */
export function getCategoryDistribution(
  tasks: Array<{ title: string }>
): Record<TaskCategory, number> {
  const distribution: Record<string, number> = {
    Work: 0,
    Learning: 0,
    Creative: 0,
    Health: 0,
    Admin: 0,
    Personal: 0,
    Other: 0,
  };

  tasks.forEach(task => {
    const category = autoTag(task.title);
    distribution[category]++;
  });

  return distribution as Record<TaskCategory, number>;
}
