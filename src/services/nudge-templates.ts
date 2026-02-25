// ═══════════════════════════════════════════════════════════════════════════
// KAAL Nudge Template System
// Local, template-based notification engine with personality
// ═══════════════════════════════════════════════════════════════════════════

export interface NudgeTemplate {
  id: string;
  category: 'proactive' | 're-engagement' | 'milestone' | 'timing';
  text: string;
  conditions?: {
    energyLevel?: ('low' | 'medium' | 'high')[];
    tasksPending?: { min?: number; max?: number };
    completedYesterday?: { min?: number; max?: number };
    daysSinceVisit?: { min?: number; max?: number };
    hoursSinceVisit?: { min?: number; max?: number };
    timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[];
    dayOfWeek?: number[]; // 0-6
    consecutiveDays?: { min?: number; max?: number };
    taskType?: string[]; // e.g., 'admin', 'creative', 'urgent'
  };
  variables?: string[]; // e.g., ['taskCount', 'taskName', 'energyLevel']
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROACTIVE NUDGES (should be working but aren't)
// ─────────────────────────────────────────────────────────────────────────────

export const PROACTIVE_NUDGES: NudgeTemplate[] = [
  {
    id: 'p1',
    category: 'proactive',
    text: "That {taskName} isn't going to write itself. Your energy is {energyLevel} right now — this is actually the best possible moment.",
    conditions: { energyLevel: ['high', 'medium'] },
    variables: ['taskName', 'energyLevel']
  },
  {
    id: 'p2',
    category: 'proactive',
    text: "You've got {taskCount} tasks queued and your focus window is open. Now's the time.",
    conditions: { tasksPending: { min: 3 } },
    variables: ['taskCount']
  },
  {
    id: 'p3',
    category: 'proactive',
    text: "Your brain is at peak capacity right now. Open KAAL and channel it into {taskName}.",
    conditions: { energyLevel: ['high'] },
    variables: ['taskName']
  },
  {
    id: 'p4',
    category: 'proactive',
    text: "Energy level: {energyLevel}. That's enough to make progress. Just 15 minutes.",
    conditions: { energyLevel: ['medium'] },
    variables: ['energyLevel']
  },
  {
    id: 'p5',
    category: 'proactive',
    text: "You're most productive right now based on your patterns. Don't let this window close.",
    conditions: { timeOfDay: ['morning', 'afternoon'] }
  },
  {
    id: 'p6',
    category: 'proactive',
    text: "Deep work mode is waiting. Your calendar is clear for the next hour. Let's use it.",
    conditions: { energyLevel: ['high', 'medium'] }
  },
  {
    id: 'p7',
    category: 'proactive',
    text: "Task: {taskName}. Energy: {energyLevel}. Time: now. Let's go.",
    variables: ['taskName', 'energyLevel']
  },
  {
    id: 'p8',
    category: 'proactive',
    text: "You've been thinking about {taskName} for days. Today's the day to actually start.",
    variables: ['taskName']
  },
  {
    id: 'p9',
    category: 'proactive',
    text: "Low energy doesn't mean no energy. That admin task has your name on it.",
    conditions: { energyLevel: ['low'], taskType: ['admin'] }
  },
  {
    id: 'p10',
    category: 'proactive',
    text: "You scheduled this block for deep work. KAAL is ready when you are.",
    conditions: { timeOfDay: ['morning', 'afternoon'] }
  },
  {
    id: 'p11',
    category: 'proactive',
    text: "Momentum builds in the first 5 minutes. Open KAAL and test it.",
    conditions: { energyLevel: ['medium', 'high'] }
  },
  {
    id: 'p12',
    category: 'proactive',
    text: "Your {timeOfDay} energy is historically your best. Clock's ticking.",
    conditions: { energyLevel: ['high'] },
    variables: ['timeOfDay']
  },
  {
    id: 'p13',
    category: 'proactive',
    text: "That urgent task is due soon. But you already knew that. Let's finish it.",
    conditions: { taskType: ['urgent'] }
  },
  {
    id: 'p14',
    category: 'proactive',
    text: "You're procrastinating. KAAL knows. The solution is opening the app and doing literally anything.",
    conditions: { tasksPending: { min: 5 } }
  },
  {
    id: 'p15',
    category: 'proactive',
    text: "Small wins compound. You have {taskCount} tasks. Start with the easiest.",
    conditions: { tasksPending: { min: 3 } },
    variables: ['taskCount']
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. RE-ENGAGEMENT NUDGES (haven't visited in X hours/days)
// ─────────────────────────────────────────────────────────────────────────────

export const REENGAGEMENT_NUDGES: NudgeTemplate[] = [
  {
    id: 'r1',
    category: 're-engagement',
    text: "Your tasks haven't moved. Your deadlines have. KAAL misses you — and so does that {taskName}.",
    conditions: { hoursSinceVisit: { min: 6, max: 12 } },
    variables: ['taskName']
  },
  {
    id: 'r2',
    category: 're-engagement',
    text: "Yesterday you were running on fumes. Today might be different. Come check in — 10 seconds.",
    conditions: { daysSinceVisit: { min: 1, max: 1 }, energyLevel: ['low'] }
  },
  {
    id: 'r3',
    category: 're-engagement',
    text: "KAAL has been rearranging your tasks in your absence. Some of them are getting impatient.",
    conditions: { daysSinceVisit: { min: 3 } }
  },
  {
    id: 'r4',
    category: 're-engagement',
    text: "Those emails are still there. They've started forming a union.",
    conditions: { daysSinceVisit: { min: 2 }, taskType: ['admin'] }
  },
  {
    id: 'r5',
    category: 're-engagement',
    text: "It's been {hoursSinceVisit} hours. Quick check-in? Your energy report is ready.",
    conditions: { hoursSinceVisit: { min: 8, max: 24 } },
    variables: ['hoursSinceVisit']
  },
  {
    id: 'r6',
    category: 're-engagement',
    text: "KAAL doesn't judge. But your to-do list is starting to look concerned.",
    conditions: { daysSinceVisit: { min: 2 }, tasksPending: { min: 5 } }
  },
  {
    id: 'r7',
    category: 're-engagement',
    text: "You've been gone {daysSinceVisit} days. The app still works. Promise.",
    conditions: { daysSinceVisit: { min: 3 } },
    variables: ['daysSinceVisit']
  },
  {
    id: 'r8',
    category: 're-engagement',
    text: "Remember that thing you said you'd do? It's still waiting. 2-minute check-in?",
    conditions: { hoursSinceVisit: { min: 12, max: 48 } }
  },
  {
    id: 'r9',
    category: 're-engagement',
    text: "Your task list is collecting dust. But it's never too late to restart.",
    conditions: { daysSinceVisit: { min: 5 } }
  },
  {
    id: 'r10',
    category: 're-engagement',
    text: "Life happens. KAAL gets it. But your {taskName} is still there when you're ready.",
    conditions: { daysSinceVisit: { min: 2, max: 7 } },
    variables: ['taskName']
  },
  {
    id: 'r11',
    category: 're-engagement',
    text: "Quick pulse check: Are you avoiding KAAL, or just busy? Either way, 30-second login.",
    conditions: { hoursSinceVisit: { min: 24, max: 72 } }
  },
  {
    id: 'r12',
    category: 're-engagement',
    text: "You had {taskCount} tasks pending. They're still pending. But so is your potential.",
    conditions: { daysSinceVisit: { min: 1, max: 3 } },
    variables: ['taskCount']
  },
  {
    id: 'r13',
    category: 're-engagement',
    text: "KAAL noticed you've been away. No lecture. Just a reminder: you're capable of more.",
    conditions: { daysSinceVisit: { min: 2 } }
  },
  {
    id: 'r14',
    category: 're-engagement',
    text: "The longer you wait, the scarier the to-do list gets. Break the cycle. Open KAAL.",
    conditions: { daysSinceVisit: { min: 4 } }
  },
  {
    id: 'r15',
    category: 're-engagement',
    text: "It's been a minute. Your energy dashboard might surprise you. Check it?",
    conditions: { hoursSinceVisit: { min: 18, max: 48 } }
  },
  {
    id: 'r16',
    category: 're-engagement',
    text: "You're getting this because KAAL thinks you're worth re-engaging. Prove it right.",
    conditions: { daysSinceVisit: { min: 3, max: 7 } }
  },
  {
    id: 'r17',
    category: 're-engagement',
    text: "That project didn't finish itself while you were gone. Shocking, right?",
    conditions: { daysSinceVisit: { min: 1 } }
  },
  {
    id: 'r18',
    category: 're-engagement',
    text: "KAAL hasn't seen you in {daysSinceVisit} days. No guilt trip — just checking if you're okay.",
    conditions: { daysSinceVisit: { min: 7 } },
    variables: ['daysSinceVisit']
  },
  {
    id: 'r19',
    category: 're-engagement',
    text: "You used to show up every day. Something changed? KAAL's here when you need it.",
    conditions: { daysSinceVisit: { min: 5 }, consecutiveDays: { min: 7 } }
  },
  {
    id: 'r20',
    category: 're-engagement',
    text: "The admin tasks are multiplying. They're like gremlins. Come deal with them.",
    conditions: { daysSinceVisit: { min: 2 }, taskType: ['admin'] }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. MILESTONE / CELEBRATION NUDGES (positive reinforcement)
// ─────────────────────────────────────────────────────────────────────────────

export const MILESTONE_NUDGES: NudgeTemplate[] = [
  {
    id: 'm1',
    category: 'milestone',
    text: "You cleared {completedCount} tasks yesterday. That's a top 10% day. Today's lineup is ready.",
    conditions: { completedYesterday: { min: 4 } },
    variables: ['completedCount']
  },
  {
    id: 'm2',
    category: 'milestone',
    text: "You've checked in {consecutiveDays} days straight. KAAL is starting to really know you.",
    conditions: { consecutiveDays: { min: 7 } },
    variables: ['consecutiveDays']
  },
  {
    id: 'm3',
    category: 'milestone',
    text: "Yesterday: {completedCount} tasks done. Today: unlimited potential. Let's go.",
    conditions: { completedYesterday: { min: 3 } },
    variables: ['completedCount']
  },
  {
    id: 'm4',
    category: 'milestone',
    text: "That's {consecutiveDays} days in a row. You're not just using KAAL — you're building a system.",
    conditions: { consecutiveDays: { min: 5 } },
    variables: ['consecutiveDays']
  },
  {
    id: 'm5',
    category: 'milestone',
    text: "You knocked out {completedCount} tasks yesterday like it was nothing. Bring that energy today.",
    conditions: { completedYesterday: { min: 5 } },
    variables: ['completedCount']
  },
  {
    id: 'm6',
    category: 'milestone',
    text: "Week {consecutiveDays} of showing up. You're not the same person who started KAAL.",
    conditions: { consecutiveDays: { min: 14 } },
    variables: ['consecutiveDays']
  },
  {
    id: 'm7',
    category: 'milestone',
    text: "Yesterday you were unstoppable. Today is a blank canvas. Let's not waste it.",
    conditions: { completedYesterday: { min: 4 }, energyLevel: ['high', 'medium'] }
  },
  {
    id: 'm8',
    category: 'milestone',
    text: "{completedCount} tasks completed yesterday. Your baseline is rising.",
    conditions: { completedYesterday: { min: 3 } },
    variables: ['completedCount']
  },
  {
    id: 'm9',
    category: 'milestone',
    text: "You've been consistent for {consecutiveDays} days. That's the difference between trying and succeeding.",
    conditions: { consecutiveDays: { min: 10 } },
    variables: ['consecutiveDays']
  },
  {
    id: 'm10',
    category: 'milestone',
    text: "You finished everything yesterday. Rare air. Can you do it again?",
    conditions: { completedYesterday: { min: 5 }, tasksPending: { max: 2 } }
  },
  {
    id: 'm11',
    category: 'milestone',
    text: "Three weeks straight. You've officially built a habit. KAAL is proud.",
    conditions: { consecutiveDays: { min: 21 } }
  },
  {
    id: 'm12',
    category: 'milestone',
    text: "Yesterday's output: exceptional. Today's potential: even better. Ready?",
    conditions: { completedYesterday: { min: 6 } }
  },
  {
    id: 'm13',
    category: 'milestone',
    text: "You've shown up {consecutiveDays} days running. Most people quit by day 3. You're different.",
    conditions: { consecutiveDays: { min: 7 } },
    variables: ['consecutiveDays']
  },
  {
    id: 'm14',
    category: 'milestone',
    text: "That task you dreaded? You crushed it yesterday. Today's challenges don't stand a chance.",
    conditions: { completedYesterday: { min: 2 } }
  },
  {
    id: 'm15',
    category: 'milestone',
    text: "Month one: complete. You're not experimenting with KAAL anymore. You're living it.",
    conditions: { consecutiveDays: { min: 30 } }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. INTELLIGENT TIMING NUDGES (based on historical patterns)
// ─────────────────────────────────────────────────────────────────────────────

export const TIMING_NUDGES: NudgeTemplate[] = [
  {
    id: 't1',
    category: 'timing',
    text: "Your {dayName} mornings are historically your best. It's {currentTime}. KAAL's ready when you are.",
    conditions: { timeOfDay: ['morning'] },
    variables: ['dayName', 'currentTime']
  },
  {
    id: 't2',
    category: 'timing',
    text: "You always crush it on {dayName} afternoons. Today won't be different.",
    conditions: { timeOfDay: ['afternoon'] },
    variables: ['dayName']
  },
  {
    id: 't3',
    category: 'timing',
    text: "It's {currentTime}. Your data says this is prime time. Let's not waste it.",
    conditions: { energyLevel: ['high'] },
    variables: ['currentTime']
  },
  {
    id: 't4',
    category: 'timing',
    text: "You've completed your biggest wins at this exact hour. History's repeating — open KAAL.",
    conditions: { timeOfDay: ['morning', 'afternoon'] }
  },
  {
    id: 't5',
    category: 'timing',
    text: "{dayName}s are your power day. Statistically. Let's add to the streak.",
    conditions: { dayOfWeek: [1, 2, 3] }, // Mon-Wed
    variables: ['dayName']
  },
  {
    id: 't6',
    category: 'timing',
    text: "Your {timeOfDay} productivity is 40% above average. Don't squander it.",
    conditions: { timeOfDay: ['morning'] },
    variables: ['timeOfDay']
  },
  {
    id: 't7',
    category: 'timing',
    text: "It's {currentTime} on {dayName}. Your historical win rate at this time? 85%. Let's go.",
    variables: ['currentTime', 'dayName']
  },
  {
    id: 't8',
    category: 'timing',
    text: "You always start strong on {dayName}. Keep the pattern alive.",
    variables: ['dayName']
  },
  {
    id: 't9',
    category: 'timing',
    text: "This hour is your golden hour according to KAAL's data. Use it wisely.",
    conditions: { energyLevel: ['high'] }
  },
  {
    id: 't10',
    category: 'timing',
    text: "{timeOfDay} energy is spiking. This is when you do your best work. Clock's running.",
    conditions: { energyLevel: ['high'] },
    variables: ['timeOfDay']
  },
  {
    id: 't11',
    category: 'timing',
    text: "Every {dayName} at {currentTime}, you show up. It's become a pattern. Honor it.",
    variables: ['dayName', 'currentTime']
  },
  {
    id: 't12',
    category: 'timing',
    text: "Your brain peaks between now and the next 90 minutes. KAAL tracked it. Use it.",
    conditions: { energyLevel: ['high', 'medium'] }
  },
  {
    id: 't13',
    category: 'timing',
    text: "Late {timeOfDay} is when you finish what you start. Finish something today.",
    conditions: { timeOfDay: ['afternoon', 'evening'] },
    variables: ['timeOfDay']
  },
  {
    id: 't14',
    category: 'timing',
    text: "You've logged 12 high-energy sessions at this time. Lucky 13 starts now.",
    conditions: { energyLevel: ['high'] }
  },
  {
    id: 't15',
    category: 'timing',
    text: "{dayName} at {currentTime}: your most consistent performance window. Don't break the streak.",
    variables: ['dayName', 'currentTime']
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL FALLBACK NUDGES (when no conditions match)
// ─────────────────────────────────────────────────────────────────────────────

export const FALLBACK_NUDGES: NudgeTemplate[] = [
  {
    id: 'f1',
    category: 'proactive',
    text: "KAAL is open. Your tasks are waiting. Let's make progress."
  },
  {
    id: 'f2',
    category: 'proactive',
    text: "You have {taskCount} tasks. Start with one. Just one.",
    variables: ['taskCount']
  },
  {
    id: 'f3',
    category: 're-engagement',
    text: "It's been a while. KAAL is still here. So are your goals."
  },
  {
    id: 'f4',
    category: 'proactive',
    text: "Small steps compound. Open KAAL and take the first one."
  },
  {
    id: 'f5',
    category: 'proactive',
    text: "Your future self will thank you for opening this notification."
  },
  {
    id: 'f6',
    category: 're-engagement',
    text: "You're capable of more than you think. KAAL can help. Give it 5 minutes."
  },
  {
    id: 'f7',
    category: 'proactive',
    text: "Momentum starts with showing up. You just did. Now open KAAL."
  },
  {
    id: 'f8',
    category: 'proactive',
    text: "That thing you're avoiding? It's smaller than you think. Let's tackle it."
  },
  {
    id: 'f9',
    category: 're-engagement',
    text: "KAAL doesn't nag. It reminds. And right now, it's reminding you of your potential."
  },
  {
    id: 'f10',
    category: 'proactive',
    text: "One task. One win. One step closer. Start now."
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ALL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_NUDGE_TEMPLATES = [
  ...PROACTIVE_NUDGES,
  ...REENGAGEMENT_NUDGES,
  ...MILESTONE_NUDGES,
  ...TIMING_NUDGES,
  ...FALLBACK_NUDGES
];

export const TEMPLATES_BY_CATEGORY = {
  proactive: PROACTIVE_NUDGES,
  're-engagement': REENGAGEMENT_NUDGES,
  milestone: MILESTONE_NUDGES,
  timing: TIMING_NUDGES,
  fallback: FALLBACK_NUDGES
};

// Total: 75 unique templates (can easily expand to 100+)
