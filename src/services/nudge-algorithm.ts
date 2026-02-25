// ═══════════════════════════════════════════════════════════════════════════
// KAAL Smart Nudge Algorithm
// Selects the perfect notification based on user context
// ═══════════════════════════════════════════════════════════════════════════

import {
  NudgeTemplate,
  ALL_NUDGE_TEMPLATES,
  TEMPLATES_BY_CATEGORY,
  FALLBACK_NUDGES
} from './nudge-templates';

export interface UserContext {
  // Energy & State
  currentEnergy?: 'low' | 'medium' | 'high';
  
  // Tasks
  tasksPending: number;
  completedYesterday: number;
  completedToday: number;
  urgentTasksPending: number;
  nextTaskName?: string;
  nextTaskType?: string; // 'admin', 'creative', 'urgent', etc.
  
  // Engagement
  lastVisitDate?: Date;
  hoursSinceVisit: number;
  daysSinceVisit: number;
  consecutiveDays: number;
  
  // Timing
  currentHour: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday = 0)
  
  // Historical patterns (optional)
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  bestDayOfWeek?: number;
  averageTasksPerDay?: number;
}

export interface NudgeResult {
  text: string;
  category: string;
  templateId: string;
  confidence: number; // 0-1, how well the template matches
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

function formatTime(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Matching Logic
// ─────────────────────────────────────────────────────────────────────────────

function matchesConditions(template: NudgeTemplate, context: UserContext): boolean {
  const conditions = template.conditions;
  if (!conditions) return true; // No conditions = always matches
  
  // Check energy level
  if (conditions.energyLevel && context.currentEnergy) {
    if (!conditions.energyLevel.includes(context.currentEnergy)) {
      return false;
    }
  }
  
  // Check tasks pending
  if (conditions.tasksPending) {
    if (conditions.tasksPending.min && context.tasksPending < conditions.tasksPending.min) {
      return false;
    }
    if (conditions.tasksPending.max && context.tasksPending > conditions.tasksPending.max) {
      return false;
    }
  }
  
  // Check completed yesterday
  if (conditions.completedYesterday) {
    if (conditions.completedYesterday.min && context.completedYesterday < conditions.completedYesterday.min) {
      return false;
    }
    if (conditions.completedYesterday.max && context.completedYesterday > conditions.completedYesterday.max) {
      return false;
    }
  }
  
  // Check hours since visit
  if (conditions.hoursSinceVisit) {
    if (conditions.hoursSinceVisit.min && context.hoursSinceVisit < conditions.hoursSinceVisit.min) {
      return false;
    }
    if (conditions.hoursSinceVisit.max && context.hoursSinceVisit > conditions.hoursSinceVisit.max) {
      return false;
    }
  }
  
  // Check days since visit
  if (conditions.daysSinceVisit) {
    if (conditions.daysSinceVisit.min && context.daysSinceVisit < conditions.daysSinceVisit.min) {
      return false;
    }
    if (conditions.daysSinceVisit.max && context.daysSinceVisit > conditions.daysSinceVisit.max) {
      return false;
    }
  }
  
  // Check time of day
  if (conditions.timeOfDay) {
    const currentTimeOfDay = getTimeOfDay(context.currentHour);
    if (!conditions.timeOfDay.includes(currentTimeOfDay)) {
      return false;
    }
  }
  
  // Check day of week
  if (conditions.dayOfWeek) {
    if (!conditions.dayOfWeek.includes(context.dayOfWeek)) {
      return false;
    }
  }
  
  // Check consecutive days
  if (conditions.consecutiveDays) {
    if (conditions.consecutiveDays.min && context.consecutiveDays < conditions.consecutiveDays.min) {
      return false;
    }
    if (conditions.consecutiveDays.max && context.consecutiveDays > conditions.consecutiveDays.max) {
      return false;
    }
  }
  
  // Check task type
  if (conditions.taskType && context.nextTaskType) {
    if (!conditions.taskType.includes(context.nextTaskType)) {
      return false;
    }
  }
  
  return true;
}

function calculateConfidence(template: NudgeTemplate, context: UserContext): number {
  let score = 0.5; // Base score
  
  // Boost score for more specific conditions
  const conditions = template.conditions;
  if (!conditions) return score;
  
  if (conditions.energyLevel && context.currentEnergy) {
    if (conditions.energyLevel.includes(context.currentEnergy)) {
      score += 0.15;
    }
  }
  
  if (conditions.tasksPending) {
    score += 0.1;
  }
  
  if (conditions.completedYesterday) {
    score += 0.1;
  }
  
  if (conditions.consecutiveDays) {
    score += 0.15; // High value for streak-based nudges
  }
  
  if (conditions.timeOfDay) {
    score += 0.1;
  }
  
  if (conditions.taskType && context.nextTaskType) {
    score += 0.15; // High value for task-specific nudges
  }
  
  return Math.min(score, 1.0);
}

function fillVariables(text: string, context: UserContext): string {
  let result = text;
  
  // Replace all variables
  result = result.replace(/{taskName}/g, context.nextTaskName || 'your next task');
  result = result.replace(/{taskCount}/g, String(context.tasksPending));
  result = result.replace(/{completedCount}/g, String(context.completedYesterday));
  result = result.replace(/{energyLevel}/g, context.currentEnergy || 'good');
  result = result.replace(/{hoursSinceVisit}/g, String(Math.round(context.hoursSinceVisit)));
  result = result.replace(/{daysSinceVisit}/g, String(context.daysSinceVisit));
  result = result.replace(/{consecutiveDays}/g, String(context.consecutiveDays));
  result = result.replace(/{timeOfDay}/g, getTimeOfDay(context.currentHour));
  result = result.replace(/{dayName}/g, getDayName(context.dayOfWeek));
  result = result.replace(/{currentTime}/g, formatTime(context.currentHour));
  
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Algorithm
// ─────────────────────────────────────────────────────────────────────────────

export function selectNudge(
  category: 'proactive' | 're-engagement' | 'milestone' | 'timing' | 'auto',
  context: UserContext
): NudgeResult {
  let candidateTemplates: NudgeTemplate[] = [];
  
  // Auto-detect category if needed
  if (category === 'auto') {
    if (context.consecutiveDays >= 7 || context.completedYesterday >= 4) {
      category = 'milestone';
    } else if (context.daysSinceVisit >= 1 || context.hoursSinceVisit >= 6) {
      category = 're-engagement';
    } else if (context.currentEnergy === 'high' || context.bestTimeOfDay === getTimeOfDay(context.currentHour)) {
      category = 'timing';
    } else {
      category = 'proactive';
    }
  }
  
  // Get templates for category
  if (category === 'proactive') {
    candidateTemplates = [...TEMPLATES_BY_CATEGORY.proactive];
  } else if (category === 're-engagement') {
    candidateTemplates = [...TEMPLATES_BY_CATEGORY['re-engagement']];
  } else if (category === 'milestone') {
    candidateTemplates = [...TEMPLATES_BY_CATEGORY.milestone];
  } else if (category === 'timing') {
    candidateTemplates = [...TEMPLATES_BY_CATEGORY.timing];
  }
  
  // Filter templates that match conditions
  const matchingTemplates = candidateTemplates.filter(template => 
    matchesConditions(template, context)
  );
  
  // If no matches, use fallback
  if (matchingTemplates.length === 0) {
    const fallback = FALLBACK_NUDGES[Math.floor(Math.random() * FALLBACK_NUDGES.length)];
    return {
      text: fillVariables(fallback.text, context),
      category: fallback.category,
      templateId: fallback.id,
      confidence: 0.3
    };
  }
  
  // Score all matching templates
  const scoredTemplates = matchingTemplates.map(template => ({
    template,
    confidence: calculateConfidence(template, context)
  }));
  
  // Sort by confidence (highest first)
  scoredTemplates.sort((a, b) => b.confidence - a.confidence);
  
  // Pick from top 3 randomly (adds variety while maintaining quality)
  const topCandidates = scoredTemplates.slice(0, 3);
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  
  return {
    text: fillVariables(selected.template.text, context),
    category: selected.template.category,
    templateId: selected.template.id,
    confidence: selected.confidence
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Functions
// ─────────────────────────────────────────────────────────────────────────────

export function generateProactiveNudge(context: UserContext): NudgeResult {
  return selectNudge('proactive', context);
}

export function generateReengagementNudge(context: UserContext): NudgeResult {
  return selectNudge('re-engagement', context);
}

export function generateMilestoneNudge(context: UserContext): NudgeResult {
  return selectNudge('milestone', context);
}

export function generateTimingNudge(context: UserContext): NudgeResult {
  return selectNudge('timing', context);
}

export function generateAutoNudge(context: UserContext): NudgeResult {
  return selectNudge('auto', context);
}
