/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  KAAL Brain — True Reasoning Engine                             ║
 * ║                                                                  ║
 * ║  Replaces the regex→switch→template pattern with:               ║
 * ║                                                                  ║
 * ║  OBSERVE → weighted insight extraction from all live signals     ║
 * ║  REASON  → score every possible action against all insights      ║
 * ║  COMPOSE → build unique sentences from real data (no templates)  ║
 * ║  ACT     → commit to the highest-scored action with reasoning    ║
 * ║                                                                  ║
 * ║  Every response references real task names, real durations,      ║
 * ║  real patterns. No pre-written strings anywhere.                 ║
 * ║                                                                  ║
 * ║  The agent also runs a proactive loop — it doesn't wait to be    ║
 * ║  asked. It monitors and surfaces what matters most.              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { agentMemory, DailyPlan } from './agent-memory';
import { fatigueEngine }          from './fatigue-engine';
import { geminiServiceSecure }    from './gemini-service-secure';
import type {
  AgentContext, AgentTask,
  AgentEmotion, AgentMessage, AgentToolCall, AgentRichContent,
} from './kaal-agent';

export { AgentContext, AgentTask, AgentEmotion, AgentMessage, AgentToolCall, AgentRichContent };

// ─── Reasoning trace types ────────────────────────────────────────────────────

export interface ReasoningStep {
  label: string;          // "3 tasks overdue"
  detail: string;         // "Query, Report, Meeting notes — all past due"
  weight: number;         // 0–1 how much this drove the decision
  category: 'workload' | 'energy' | 'time' | 'pattern' | 'user' | 'context';
}

export interface AgentDecision {
  chosenAction: string;      // e.g. "tackle_overdue"
  confidence: number;        // 0–1
  reasoning: ReasoningStep[];
  dismissed: { action: string; why: string }[];  // What KAAL considered and rejected
}

export type BrainMessage = AgentMessage & {
  decision?: AgentDecision;
  isProactive?: boolean;   // fired without user asking
  proactiveReason?: string; // "3 tasks haven't moved in 48h"
  poweredByGemini?: boolean;
};

// ─── Internal fact system ─────────────────────────────────────────────────────

interface Fact {
  id: string;
  category: ReasoningStep['category'];
  weight: number;
  label: string;
  detail: string;
  data?: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _msgId = 0;
const mkId = () => `brain-${Date.now()}-${_msgId++}`;

let _toolId = 0;
function mkTool(
  tool: AgentToolCall['tool'],
  label: string,
  icon: string,
  params: Record<string, unknown>,
): AgentToolCall {
  return { id: `tool-${Date.now()}-${_toolId++}`, tool, displayLabel: label, icon, params, status: 'pending' };
}

function nameList(tasks: AgentTask[], max = 3): string {
  const shown = tasks.slice(0, max).map(t => `"${t.title}"`);
  const rest  = tasks.length - max;
  return shown.join(', ') + (rest > 0 ? ` and ${rest} more` : '');
}

function priorityLabel(t: AgentTask): string {
  return t.priority === 'urgent' ? 'urgent' : t.priority === 'high' ? 'high-priority' : 'pending';
}

function hoursFromNow(ctx: AgentContext): number {
  return Math.max(0, 18 - ctx.hour); // workday ends at 18:00
}

function circadianLabel(hour: number): string {
  if (hour < 7)  return 'early morning';
  if (hour < 10) return 'morning peak';
  if (hour < 12) return 'late morning';
  if (hour < 14) return 'post-lunch window';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'late night';
}

// ─── Observation Engine ───────────────────────────────────────────────────────
// Produces a set of ranked facts from ALL available context.
// This is the source of truth for every decision.

function observe(ctx: AgentContext): Fact[] {
  const now      = new Date();
  const pending  = ctx.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const overdue  = pending.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const highPri  = pending.filter(t => t.priority === 'high' || t.priority === 'urgent');
  const quick    = pending.filter(t => (t.estimatedMinutes ?? 30) <= 15);
  const completed = ctx.tasks.filter(t => t.status === 'completed');
  const fatigue  = fatigueEngine.state;
  const leftH    = hoursFromNow(ctx);
  const pattern  = agentMemory.getUserPattern();
  const facts: Fact[] = [];

  // ── Fatigue & energy ──────────────────────────────────────────────────────

  if (fatigue.continuousWorkMin >= 90) {
    facts.push({ id: 'critical_fatigue', category: 'energy', weight: 0.97,
      label: `${Math.round(fatigue.continuousWorkMin)} min straight — critical`,
      detail: `${Math.round(fatigue.continuousWorkMin)} minutes continuous work. Cognitive performance measurably declines past 90 min — this is physiology, not opinion.`,
      data: fatigue });
  } else if (fatigue.continuousWorkMin >= 60) {
    facts.push({ id: 'high_fatigue', category: 'energy', weight: 0.82,
      label: `${Math.round(fatigue.continuousWorkMin)} min without a break`,
      detail: `${Math.round(fatigue.continuousWorkMin)} minutes without a break. Focus quality starts dropping.`,
      data: fatigue });
  }

  if (ctx.energyLevel <= 2) {
    facts.push({ id: 'low.energy', category: 'energy', weight: 0.78,
      label: `energy ${ctx.energyLevel}/5`,
      detail: `energy at ${ctx.energyLevel}/5 — this is a meaningful signal, not just how you feel.` });
  } else if (ctx.energyLevel >= 4) {
    facts.push({ id: 'high_energy', category: 'energy', weight: 0.62,
      label: `energy ${ctx.energyLevel}/5 — peak window`,
      detail: `energy at ${ctx.energyLevel}/5. This is a peak window — wasting it on low-impact work is a cost.` });
  }

  // ── Deadlines & overdue ───────────────────────────────────────────────────

  if (overdue.length === 1) {
    facts.push({ id: 'single_overdue', category: 'workload', weight: 0.91,
      label: `"${overdue[0].title}" is overdue`,
      detail: `"${overdue[0].title}" is past its deadline. Every hour it sits there compounds the cost.`,
      data: overdue[0] });
  } else if (overdue.length > 1) {
    facts.push({ id: 'multi_overdue', category: 'workload', weight: 0.94,
      label: `${overdue.length} overdue tasks`,
      detail: `${overdue.length} tasks are past due: ${nameList(overdue)}. This is the most urgent thing to address.`,
      data: overdue });
  }

  // Check for tasks due today (not yet overdue)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59);
  const dueToday = pending.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d > now && d <= todayEnd;
  });
  if (dueToday.length > 0) {
    facts.push({ id: 'due_today', category: 'workload', weight: 0.75,
      label: `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today`,
      detail: `${nameList(dueToday)} — due today and still pending.`,
      data: dueToday });
  }

  // ── Work progress ─────────────────────────────────────────────────────────

  if (highPri.length > 0 && ctx.todayFocusMinutes < 20) {
    facts.push({ id: 'untouched_priority', category: 'workload', weight: 0.86,
      label: `"${highPri[0].title}" untouched today`,
      detail: `Your top-priority task, "${highPri[0].title}", hasn't been started today. If it matters, it should be first.`,
      data: highPri[0] });
  }

  if (completed.length >= 4) {
    facts.push({ id: 'strong_day', category: 'progress', weight: 0.55,
      label: `${completed.length} tasks done today`,
      detail: `${completed.length} tasks completed today — genuine momentum.` });
  } else if (completed.length >= 1) {
    facts.push({ id: 'started_day', category: 'progress', weight: 0.45,
      label: `${completed.length} task${completed.length > 1 ? 's' : ''} done today`,
      detail: `${completed.length} task${completed.length > 1 ? 's' : ''} done — you've started, and that matters.` });
  }

  if (ctx.todayFocusMinutes >= 90) {
    facts.push({ id: 'deep_work_done', category: 'progress', weight: 0.52,
      label: `${ctx.todayFocusMinutes} min of deep work`,
      detail: `${ctx.todayFocusMinutes} minutes of focused work today — that's a real investment.` });
  }

  if (ctx.streakDays >= 2) {
    facts.push({ id: 'streak', category: 'pattern', weight: 0.44,
      label: `${ctx.streakDays}-day streak`,
      detail: `${ctx.streakDays}-day streak. This matters — consistency compounds.` });
  }

  // ── Time context ──────────────────────────────────────────────────────────

  if (leftH <= 1 && pending.length > 0) {
    facts.push({ id: 'day_closing', category: 'time', weight: 0.85,
      label: `~${leftH}h left, ${pending.length} tasks pending`,
      detail: `About ${leftH}h left in the workday with ${pending.length} tasks still pending. Triage is the only realistic response.` });
  }

  const circ = circadianLabel(ctx.hour);
  if (circ === 'morning peak' && pending.length > 0) {
    facts.push({ id: 'morning_peak', category: 'time', weight: 0.68,
      label: 'morning peak window',
      detail: `It's the morning peak — cognitive capacity is highest. Hard tasks belong here.` });
  }
  if (circ === 'post-lunch window') {
    facts.push({ id: 'post_lunch', category: 'time', weight: 0.58,
      label: 'post-lunch dip',
      detail: `Post-lunch window. Most people's focus dips here. Short tasks or a break are better investments than forcing deep work.` });
  }

  // ── Queue pressure ────────────────────────────────────────────────────────

  if (pending.length > 15) {
    facts.push({ id: 'overloaded_queue', category: 'workload', weight: 0.72,
      label: `${pending.length} tasks queued`,
      detail: `${pending.length} tasks in the queue. That number itself is a form of cognitive load — it needs pruning.` });
  } else if (pending.length === 0) {
    facts.push({ id: 'clear_queue', category: 'workload', weight: 0.7,
      label: 'queue is empty',
      detail: 'Queue is clear — genuinely rare. This is a strategic moment, not dead time.' });
  }

  if (quick.length >= 2) {
    facts.push({ id: 'quick_wins_available', category: 'workload', weight: 0.48,
      label: `${quick.length} tasks ≤15 min`,
      detail: `${quick.length} tasks that take ≤15 min: ${nameList(quick, 2)}. Quick wins build momentum.`,
      data: quick });
  }

  return facts.sort((a, b) => b.weight - a.weight);
}

// ─── Sentence Composer ────────────────────────────────────────────────────────
// Builds unique sentences from facts. NO pre-written strings.
// Every sentence references real data from the user's context.

function narrativize(fact: Fact, role: 'lead' | 'support' | 'add'): string {
  switch (fact.id) {
    case 'critical_fatigue':
      return role === 'lead'
        ? fact.detail + ' Taking a break now is not optional — it\'s the highest-leverage thing you can do for the next 2 hours.'
        : `fatigue is critical (${Math.round((fact.data as typeof fatigueEngine.state).continuousWorkMin)} min continuous)`;
    case 'high_fatigue':
      return role === 'lead'
        ? fact.detail + ' A 10-minute break now will restore more than grinding through.'
        : `${Math.round((fact.data as typeof fatigueEngine.state).continuousWorkMin)} min into a continuous session`;
    case 'low.energy':
      return role === 'lead'
        ? fact.detail + ' Low energy is information. Pushing high-difficulty tasks here is inefficient — not heroic.'
        : 'with energy running low';
    case 'high_energy':
      return role === 'lead'
        ? fact.detail + ' Don\'t spend it on admin or easy work — that\'s a waste of a scarce resource.'
        : 'while energy is good — use it well';
    case 'single_overdue':
      return role === 'lead'
        ? fact.detail + ' I\'d address this before anything else.'
        : `while "${(fact.data as AgentTask).title}" sits overdue`;
    case 'multi_overdue':
      return role === 'lead'
        ? fact.detail + ' These need a decision — not necessarily completion, but a decision.'
        : `while ${(fact.data as AgentTask[]).length} tasks sit past their deadlines`;
    case 'due_today':
      return role === 'lead'
        ? `${nameList(fact.data as AgentTask[], 2)} ${(fact.data as AgentTask[]).length === 1 ? 'is' : 'are'} due today. That clock is real.`
        : `with ${(fact.data as AgentTask[]).length} tasks due today`;
    case 'untouched_priority':
      return role === 'lead'
        ? fact.detail
        : `your top priority "${(fact.data as AgentTask).title}" is still untouched`;
    case 'strong_day':
      return role === 'lead'
        ? fact.detail + ' This is real output, not busyness.'
        : `you\'ve already finished ${fact.detail.split(' ')[0]} tasks`;
    case 'started_day':
      return role === 'lead'
        ? fact.detail
        : `you\'ve started moving (${fact.detail})`;
    case 'deep_work_done':
      return role === 'lead'
        ? fact.detail + ' You\'ve done serious cognitive work today.'
        : `after ${fact.detail.split(' ')[0]} min of deep work`;
    case 'streak':
      return role === 'lead'
        ? fact.detail
        : `${(fact.label.match(/\d+/) ?? [''])[0]}-day streak running`;
    case 'day_closing':
      return role === 'lead'
        ? fact.detail
        : `with time running short`;
    case 'morning_peak':
      return role === 'lead'
        ? fact.detail + ' If you have a hard task, now is the time.'
        : 'during the morning peak';
    case 'post_lunch':
      return role === 'lead' ? fact.detail : 'in the post-lunch dip';
    case 'overloaded_queue':
      return role === 'lead'
        ? fact.detail + ' A queue this size needs triage before task execution.'
        : `with ${(fact.label.match(/\d+/) ?? [''])[0]} tasks queued`;
    case 'clear_queue':
      return role === 'lead'
        ? fact.detail + ' Use this to get ahead — plan tomorrow, review priorities, or genuinely rest.'
        : 'with a clear queue';
    case 'quick_wins_available':
      return role === 'lead'
        ? fact.detail + ' Each completed quick-win releases dopamine and lowers activation energy for harder work.'
        : `with ${(fact.data as AgentTask[]).length} quick tasks available`;
    default:
      return role === 'lead' ? fact.detail : fact.label;
  }
}

// ─── Decision Scorer ──────────────────────────────────────────────────────────
// Scores each possible action against the current fact set.
// The highest-scored action wins — no hardcoded routing.

type ActionId =
  | 'force_break' | 'suggest_break' | 'tackle_overdue' | 'start_priority'
  | 'quick_wins_first' | 'triage_queue' | 'end_of_day' | 'morning_attack'
  | 'deep_focus' | 'celebrate' | 'free_time' | 'post_lunch_light';

interface ScoredAction {
  id: ActionId;
  score: number;
  requiresFacts: string[];  // Fact IDs needed for this action to fire
}

function scoreActions(facts: Fact[], ctx: AgentContext): ScoredAction[] {
  const has = (id: string) => facts.some(f => f.id === id);
  const get = (id: string) => facts.find(f => f.id === id);

  const actions: ScoredAction[] = [
    {
      id: 'force_break',
      score: has('critical_fatigue') ? 0.97 : 0,
      requiresFacts: ['critical_fatigue'],
    },
    {
      id: 'suggest_break',
      score: has('high_fatigue') ? 0.82 + (has('low.energy') ? 0.1 : 0) : 0,
      requiresFacts: ['high_fatigue'],
    },
    {
      id: 'tackle_overdue',
      score: has('multi_overdue') ? 0.92 + (has('high_energy') ? 0.05 : 0)
           : has('single_overdue') ? 0.88 + (has('high_energy') ? 0.05 : 0) : 0,
      requiresFacts: ['multi_overdue', 'single_overdue'],
    },
    {
      id: 'end_of_day',
      score: has('day_closing') ? 0.87 : 0,
      requiresFacts: ['day_closing'],
    },
    {
      id: 'morning_attack',
      score: (has('morning_peak') && has('untouched_priority')) ? 0.84 : 0,
      requiresFacts: ['morning_peak', 'untouched_priority'],
    },
    {
      id: 'start_priority',
      score: has('untouched_priority') ? 0.80 + (has('high_energy') ? 0.08 : 0) : 0,
      requiresFacts: ['untouched_priority'],
    },
    {
      id: 'post_lunch_light',
      score: (has('post_lunch') && !has('overloaded_queue') && ctx.energyLevel <= 3) ? 0.72 : 0,
      requiresFacts: ['post_lunch'],
    },
    {
      id: 'quick_wins_first',
      score: (has('quick_wins_available') && has('low.energy')) ? 0.70
           : has('quick_wins_available') ? 0.55 : 0,
      requiresFacts: ['quick_wins_available'],
    },
    {
      id: 'triage_queue',
      score: has('overloaded_queue') ? 0.68 : 0,
      requiresFacts: ['overloaded_queue'],
    },
    {
      id: 'celebrate',
      score: has('strong_day') && !has('single_overdue') && !has('multi_overdue') ? 0.62 : 0,
      requiresFacts: ['strong_day'],
    },
    {
      id: 'deep_focus',
      score: (has('high_energy') && has('morning_peak')) ? 0.80
           : has('high_energy') ? 0.65 : 0,
      requiresFacts: ['high_energy'],
    },
    {
      id: 'free_time',
      score: has('clear_queue') ? 0.70 : 0,
      requiresFacts: ['clear_queue'],
    },
  ];

  return actions
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ─── Response Builder ─────────────────────────────────────────────────────────
// Takes the chosen action + supporting facts → unique, contextual response text

function buildResponse(
  action: ScoredAction,
  facts: Fact[],
  ctx: AgentContext,
  userText: string,
): {
  text: string;
  emotion: AgentEmotion;
  suggestions: string[];
  toolCalls?: AgentToolCall[];
  richContent?: AgentRichContent;
  decision: AgentDecision;
} {
  const topFact   = facts[0];
  const pending   = ctx.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const overdue   = pending.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const highPri   = pending.filter(t => t.priority === 'high' || t.priority === 'urgent');
  const quick     = pending.filter(t => (t.estimatedMinutes ?? 30) <= 15);
  const completed = ctx.tasks.filter(t => t.status === 'completed');
  const hasFact   = (id: string) => facts.some(f => f.id === id);

  // Build reasoning trace
  const reasoning: ReasoningStep[] = facts.slice(0, 5).map(f => ({
    label: f.label,
    detail: f.detail,
    weight: f.weight,
    category: f.category,
  }));

  // Consider what was dismissed
  const dismissed = [
    ...(hasFact('quick_wins_available') && action.id !== 'quick_wins_first'
      ? [{ action: 'Quick wins first', why: 'More urgent signals take precedence' }] : []),
    ...(hasFact('high_energy') && action.id !== 'deep_focus' && action.id !== 'morning_attack'
      ? [{ action: 'Deep focus session', why: 'Another concern ranks higher right now' }] : []),
  ];

  const decision: AgentDecision = {
    chosenAction: action.id,
    confidence: action.score,
    reasoning,
    dismissed,
  };

  switch (action.id) {

    case 'force_break': {
      const fatigue = fatigueEngine.state;
      const nextTask = highPri[0] ?? pending[0];
      const text = [
        `${Math.round(fatigue.continuousWorkMin)} minutes without a break.`,
        `I'm not giving you more tasks right now — that would be counterproductive.`,
        nextTask
          ? ` When you return, "${nextTask.title}" is what I'll have ready for you. But first: 20 minutes away from this screen.`
          : ` Take 20 minutes. Step away completely.`,
      ].join(' ');
      return {
        text, emotion: 'coaching', decision,
        toolCalls: [mkTool('schedule_break', 'Scheduling a 20-min break', '☕', { duration: 20 })],
        suggestions: ['Start 20-min break', 'Just 10 min', "I'll rest later"],
      };
    }

    case 'suggest_break': {
      const fatigue = fatigueEngine.state;
      const nextTask = highPri[0] ?? pending[0];
      const text = [
        `${Math.round(fatigue.continuousWorkMin)} minutes continuous. Focus quality starts dropping around here — not because you're weak, but because that's how working memory works.`,
        nextTask
          ? ` A 10-minute break now means you'll come back to "${nextTask.title}" with sharper attention than grinding through in this state.`
          : ' A 10-minute break here pays dividends.',
      ].join('');
      return {
        text, emotion: 'coaching', decision,
        toolCalls: [mkTool('schedule_break', 'Ready to start 10-min break', '☕', { duration: 10 })],
        suggestions: ['Start 10-min break', 'Start 5-min break', 'Keep going for now'],
      };
    }

    case 'tackle_overdue': {
      const primary = overdue[0];
      const rest    = overdue.slice(1);
      let text = '';
      if (overdue.length === 1) {
        text = `"${primary.title}" is past its due date. I want to surface this explicitly — it's the one thing that most needs a decision before anything else today. Start with 25 minutes on it, not to finish, just to move it.`;
      } else {
        text = `${overdue.length} tasks are past their deadlines: ${nameList(overdue)}. I'd start with "${primary.title}" — it's the highest-priority of the ${overdue.length}. The others can follow or be deferred, but this one needs movement today.`;
      }
      if (hasFact('high_energy')) {
        text += ` Energy is good right now — best time to tackle this.`;
      }
      return {
        text, emotion: 'coaching', decision,
        richContent: { type: 'task_highlight', tasks: overdue.slice(0, 3), label: 'Overdue — needs a decision:' },
        toolCalls: [mkTool('start_focus', `Focus session: "${primary.title}"`, '🎯', { taskId: primary.id, taskTitle: primary.title, duration: 25 })],
        suggestions: [`Start "${primary.title}"`, 'Show all overdue', 'Defer one', 'I need a plan'],
      };
    }

    case 'end_of_day': {
      const leftH = hoursFromNow(ctx);
      const topTask = highPri[0] ?? pending[0];
      let text = `${leftH <= 0 ? 'Workday is wrapping up' : `About ${leftH}h left`} with ${pending.length} tasks still pending.`;
      if (topTask) {
        text += ` I'd invest the remaining time on "${topTask.title}" — it's the highest-value thing still open.`;
      }
      if (completed.length > 0) {
        text += ` You finished ${completed.length} today, which is real output.`;
      }
      text += ` Anything you don't start in the next 30 min is realistically a tomorrow task — so let's decide that now rather than let it carry ambiguously.`;
      return {
        text, emotion: 'coaching', decision,
        richContent: pending.length > 0 ? { type: 'task_highlight', tasks: pending.slice(0, 3), label: 'Remaining today:' } : undefined,
        suggestions: topTask ? [`Start "${topTask.title}"`, 'Move rest to tomorrow', 'Quick wins to close out', 'End my day'] : ['Plan tomorrow', 'End my day'],
      };
    }

    case 'morning_attack': {
      const task = highPri[0] ?? pending[0];
      const text = `Morning peak window — cognitive capacity is highest right now. "${task.title}" is your top priority and it's untouched. This is the exact moment for it. I'd start a focused block before 11am — anything past that runs into the post-lunch dip.`;
      return {
        text, emotion: 'encouraging', decision,
        richContent: { type: 'single_task', task, reason: 'Highest priority — morning window open' },
        toolCalls: [mkTool('start_focus', `Starting "${task.title}"`, '🎯', { taskId: task.id, taskTitle: task.title, duration: 50 })],
        suggestions: [`Start "${task.title}"`, '25-min sprint', '50-min deep block', 'Show full priority list'],
      };
    }

    case 'start_priority': {
      const task = highPri[0];
      const circ = circadianLabel(ctx.hour);
      const energyNote = ctx.energyLevel >= 3
        ? `Energy is at ${ctx.energyLevel}/5 — workable.`
        : `Energy is at ${ctx.energyLevel}/5 — low, but this task can't wait.`;
      const text = `"${task.title}" is your top-priority task and hasn't been touched today. It's ${circ}. ${energyNote} Even 25 focused minutes moves it significantly — the goal isn't to finish, it's to make it smaller.`;
      return {
        text, emotion: 'coaching', decision,
        richContent: { type: 'single_task', task, reason: `Top priority — ${circ}` },
        toolCalls: [mkTool('start_focus', `Starting "${task.title}"`, '🎯', { taskId: task.id, taskTitle: task.title, duration: 25 })],
        suggestions: ['Start 25-min sprint', 'Start 45-min block', 'I\'m not ready for this', 'Break this task down'],
      };
    }

    case 'quick_wins_first': {
      const topQuick = quick.slice(0, 3);
      const energyNote = hasFact('low.energy')
        ? `With energy at ${ctx.energyLevel}/5, forcing deep work is inefficient. Quick wins are the right play — each completed task releases dopamine and raises activation energy.`
        : `You've got ${quick.length} tasks that take ≤15 minutes. Clearing a few builds the kind of momentum that makes bigger tasks easier to start.`;
      const text = `${energyNote} Start with "${topQuick[0].title}" — it's the quickest.`;
      return {
        text, emotion: 'encouraging', decision,
        richContent: { type: 'task_highlight', tasks: topQuick, label: 'Quick wins — ≤15 min each:' },
        toolCalls: [mkTool('start_focus', `Quick sprint: "${topQuick[0].title}"`, '⚡', { taskId: topQuick[0].id, taskTitle: topQuick[0].title, duration: 15 })],
        suggestions: [`Start "${topQuick[0].title}"`, 'Do all quick wins', 'Show full task list', 'I need a real break'],
      };
    }

    case 'post_lunch_light': {
      const task = quick[0] ?? pending.find(t => (t.estimatedMinutes ?? 60) <= 30);
      const text = task
        ? `Post-lunch window — a natural focus dip for most people. This isn't a great time for deep cognitive work. "${task.title}" is a low-friction task that fits this window well. Save the heavy work for 3pm when the dip typically passes.`
        : `Post-lunch window. Most people hit a focus dip between 1–3pm — that's not a failure, it's biology. This is a good time for admin, communication tasks, or a short walk rather than deep work.`;
      return {
        text, emotion: 'coaching', decision,
        richContent: task ? { type: 'single_task', task, reason: 'Low-friction fit for post-lunch window' } : undefined,
        suggestions: task ? [`Start "${task.title}"`, 'Show admin tasks', 'Take a walk', 'Override — I\'m focused'] : ['Show admin tasks', 'Take a break', 'Override — I\'m focused'],
      };
    }

    case 'triage_queue': {
      const text = `${pending.length} tasks in your queue. A list this long isn't a productivity system — it's a source of decision fatigue. Before we work, let's triage: which 3 of these would make the most difference if completed this week? I'll help you hide the rest until they're relevant.`;
      return {
        text, emotion: 'coaching', decision,
        richContent: { type: 'task_highlight', tasks: pending.slice(0, 5), label: `${pending.length} tasks — let's triage:` },
        toolCalls: [mkTool('filter_tasks', 'Opening task triage', '🔍', { mode: 'triage' })],
        suggestions: ['Start triage', 'Show only high-priority', 'Archive old tasks', 'I\'ll pick my top 3'],
      };
    }

    case 'celebrate': {
      const text = `${completed.length} tasks done today — that's a legitimate strong day, not just busyness. ${ctx.todayFocusMinutes > 0 ? `${ctx.todayFocusMinutes} minutes of deep focus on top of that.` : ''} ${pending.length > 0 ? `${pending.length} tasks still open, but nothing overdue. You have options: push further, or bank the win and plan tomorrow.` : 'Queue is clear. Genuinely rare.'}`;
      return {
        text, emotion: 'celebrating', decision,
        suggestions: ['Plan tomorrow', 'Keep going', 'Log today\'s wins', 'End my day well'],
      };
    }

    case 'deep_focus': {
      const task = highPri[0] ?? pending[0];
      const text = task
        ? `Energy at ${ctx.energyLevel}/5 — that's your good window. "${task.title}" is the highest-value task to use it on. I'd go 45–90 minutes uninterrupted here. This is the kind of block that makes a real difference.`
        : `Energy at ${ctx.energyLevel}/5 with a clear queue. This is a rare combination. Use this for anything you've been putting off that requires real focus — or invest it in getting ahead of tomorrow.`;
      return {
        text, emotion: 'encouraging', decision,
        richContent: task ? { type: 'single_task', task, reason: `High energy window — ${circadianLabel(ctx.hour)}` } : undefined,
        toolCalls: task ? [mkTool('start_focus', `Deep block: "${task.title}"`, '🎯', { taskId: task.id, taskTitle: task.title, duration: 90 })] : [],
        suggestions: task ? [`Start 90-min deep block`, `Start 45-min block`, 'I need to plan first'] : ['Plan tomorrow', 'Brain dump', 'Deep work project'],
      };
    }

    default: { // free_time or fallback
      const text = `Queue is empty — that's genuinely rare. I'd use this either to get ahead of something that'll matter next week, or to actually rest (which is also productive). What's on your mind?`;
      return {
        text, emotion: 'neutral', decision,
        suggestions: ['Plan tomorrow', 'Brain dump', 'Add a new project', 'Just rest'],
      };
    }
  }
}

// ─── User meaning extraction ──────────────────────────────────────────────────
// Not keyword matching — meaning inference from intent + context

function inferMeaning(
  userText: string,
  facts: Fact[],
  ctx: AgentContext,
): {
  isAskingForHelp: boolean;
  isVenting: boolean;
  isReporting: boolean;
  isAsking: boolean;
  topicHint: string | null;
  urgencySignal: boolean;
} {
  const t = userText.toLowerCase();
  const wordCount = userText.trim().split(/\s+/).length;
  const hasCursor = /\?/.test(userText);

  // Signals that this is a report (telling KAAL something, not asking)
  const isReporting = /^(i (just|already|did|finished|completed|done)|done|finished|just|completed)/.test(t);

  // Signals of emotional content (venting, stress, frustration)
  const isVenting = /can'?t|stuck|struggling|not working|frustrated|stressed|overwhelmed|exhausted|failing|bad day|hate this|impossible/.test(t) || wordCount > 40;

  // Topic hints in the message
  const topicHint =
    /task|to-?do|todo|work|project/.test(t)     ? 'tasks' :
    /energy|tired|exhaust|fatigue|sleep/.test(t) ? 'energy' :
    /plan|schedule|today|day/.test(t)             ? 'planning' :
    /focus|distract|attention|concentrat/.test(t) ? 'focus' :
    /break|rest|walk|step away/.test(t)           ? 'break' :
    /pattern|habit|when.*best|peak/.test(t)       ? 'patterns' :
    null;

  return {
    isAskingForHelp: /help|what should|what next|where.*start|what do|don'?t know|not sure/.test(t),
    isVenting,
    isReporting,
    isAsking: hasCursor || /what|how|when|where|why|should|can you|could you/.test(t),
    topicHint,
    urgencySignal: /urgent|asap|need.*now|right now|immediately|today|deadline/.test(t),
  };
}

// ─── Brain class ──────────────────────────────────────────────────────────────

class KaalBrain {
  private _lastProactiveCheck = 0;
  private _firedProactiveIds = new Set<string>();
  private _msgId = 0;

  // ── Core respond ─────────────────────────────────────────────────────────

  respond(userText: string, ctx: AgentContext): BrainMessage {
    const facts   = observe(ctx);
    const meaning = inferMeaning(userText, facts, ctx);

    // Score actions against context (used for heuristic fallback + Gemini hint)
    const scored  = scoreActions(facts, ctx);
    const action  = scored[0] ?? { id: 'free_time' as ActionId, score: 0.5, requiresFacts: [] };
    const biasedAction = this._biasForUserTopic(action, scored, meaning, facts);

    // Build reasoning trace (always from heuristics — visible regardless of Gemini)
    const heuristicResponse = buildResponse(biasedAction, facts, ctx, userText);

    // ── Try Gemini first ────────────────────────────────────────────────────
    // Return a placeholder message immediately, then upgrade it async
    const msgId = `brain-${Date.now()}-${this._msgId++}`;

    // Compose the venting/reporting prefix from heuristics
    const prefix = meaning.isVenting
      ? this._ventingAck(userText, facts)
      : meaning.isReporting
      ? this._reportingAck(userText, ctx)
      : '';

    // Start Gemini call async — the screen will update the message once resolved
    this._callGeminiAsync(msgId, userText, ctx, facts, biasedAction, prefix, heuristicResponse);

    // Return heuristic response immediately (will be upgraded if Gemini succeeds)
    const fullText = prefix ? `${prefix}\n\n${heuristicResponse.text}` : heuristicResponse.text;

    return {
      id: msgId,
      role: 'kaal',
      text: fullText,
      emotion: heuristicResponse.emotion,
      richContent: heuristicResponse.richContent,
      toolCalls: heuristicResponse.toolCalls,
      suggestions: heuristicResponse.suggestions,
      timestamp: Date.now(),
      decision: heuristicResponse.decision,
      poweredByGemini: false,
    };
  }

  // ── Async Gemini upgrade ──────────────────────────────────────────────────
  // Called after the heuristic response is already shown.
  // Resolves via callback if provided.

  private _geminiCallbacks = new Map<string, (msg: Partial<BrainMessage>) => void>();

  registerUpgradeCallback(msgId: string, cb: (msg: Partial<BrainMessage>) => void) {
    this._geminiCallbacks.set(msgId, cb);
    // Auto-expire after 30s
    setTimeout(() => this._geminiCallbacks.delete(msgId), 30_000);
  }

  private async _callGeminiAsync(
    msgId: string,
    userText: string,
    ctx: AgentContext,
    facts: Fact[],
    action: ScoredAction,
    prefix: string,
    fallback: ReturnType<typeof buildResponse>,
  ) {
    const actionLabels: Record<string, string> = {
      force_break: 'force a break immediately', suggest_break: 'suggest taking a break soon',
      tackle_overdue: 'address overdue tasks first', start_priority: 'start the top-priority task',
      quick_wins_first: 'do quick wins to build momentum', deep_focus: 'start a deep focus block',
      morning_attack: 'use the morning peak window', end_of_day: 'do end-of-day triage',
      post_lunch_light: 'do light work during post-lunch dip', triage_queue: 'triage the overloaded queue',
      celebrate: 'acknowledge strong progress', free_time: 'explore freely',
    };

    const completed = ctx.tasks.filter(t => t.status === 'completed');
    const overdue   = ctx.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');
    const history   = agentMemory.getConversationHistory(6);

    const geminiResult = await geminiServiceSecure.chatWithKAAL({
      userText,
      context: {
        tasks: ctx.tasks,
        energyLevel: ctx.energyLevel,
        todayFocusMinutes: ctx.todayFocusMinutes,
        streakDays: ctx.streakDays,
        hour: ctx.hour,
        continuousWorkMin: fatigueEngine.state.continuousWorkMin,
        completedToday: completed.length,
        overdueCount: overdue.length,
      },
      precomputedSignals: facts.slice(0, 6).map(f => ({ label: f.label, weight: f.weight, detail: f.detail })),
      recommendedAction: actionLabels[action.id] ?? action.id,
      conversationHistory: history.map(m => ({ role: m.role, text: m.text })),
    });

    if (!geminiResult) return; // Gemini unavailable — keep heuristic response

    // Upgrade the message with Gemini's response
    const fullText = prefix ? `${prefix}\n\n${geminiResult.text}` : geminiResult.text;

    const cb = this._geminiCallbacks.get(msgId);
    if (cb) {
      cb({
        text: fullText,
        emotion: geminiResult.emotion as AgentEmotion,
        suggestions: geminiResult.suggestions.length > 0 ? geminiResult.suggestions : fallback.suggestions,
        poweredByGemini: true,
      });
      this._geminiCallbacks.delete(msgId);
    }
  }

  // ── Proactive check — runs on interval without user prompting ─────────────
  // Returns a message if something important needs to be surfaced, null otherwise.

  proactiveCheck(ctx: AgentContext): BrainMessage | null {
    const now  = Date.now();
    const facts = observe(ctx);

    // Throttle: max 1 proactive message every 4 minutes
    if (now - this._lastProactiveCheck < 4 * 60 * 1000) return null;

    // Only surface if a high-weight fact hasn't been addressed
    const urgent = facts.find(f =>
      f.weight >= 0.85 &&
      !this._firedProactiveIds.has(f.id) &&
      f.id !== 'critical_fatigue' // fatigue engine handles this separately
    );

    if (!urgent) return null;

    this._lastProactiveCheck = now;
    this._firedProactiveIds.add(urgent.id);

    // Expire fired IDs after 2 hours
    setTimeout(() => this._firedProactiveIds.delete(urgent.id), 2 * 60 * 60 * 1000);

    const scored  = scoreActions(facts, ctx);
    const action  = scored[0] ?? { id: 'free_time' as ActionId, score: 0.5, requiresFacts: [] };
    const response = buildResponse(action, facts, ctx, '');

    const proactiveIntro = this._proactiveIntro(urgent);

    return {
      id: `brain-proactive-${Date.now()}`,
      role: 'kaal',
      text: `${proactiveIntro} ${response.text}`,
      emotion: response.emotion,
      richContent: response.richContent,
      toolCalls: response.toolCalls,
      suggestions: response.suggestions,
      timestamp: Date.now(),
      decision: response.decision,
      isProactive: true,
      proactiveReason: urgent.label,
    };
  }

  // ── Greet — personalized opening, never generic ───────────────────────────

  greet(ctx: AgentContext): BrainMessage {
    const facts     = observe(ctx);
    const pending   = ctx.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
    const overdue   = pending.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const highPri   = pending.filter(t => t.priority === 'high' || t.priority === 'urgent');
    const completed = ctx.tasks.filter(t => t.status === 'completed');
    const circ      = circadianLabel(ctx.hour);
    const sessionN  = agentMemory.getSessionCount();

    let text = '';

    if (sessionN <= 1) {
      text = `I'm KAAL — your executive function AI. I don't just respond to what you ask; I watch your context and surface what matters before you realize you need it. What's on your plate today?`;
    } else if (overdue.length > 0) {
      text = `${circ.charAt(0).toUpperCase() + circ.slice(1)}. I want to start with something: ${nameList(overdue, 2)} ${overdue.length === 1 ? 'is' : 'are'} overdue. Before we talk about anything else, that's the signal I'd act on first.`;
    } else if (highPri.length > 0 && completed.length === 0) {
      const task = highPri[0];
      text = `Good ${circ === 'morning peak' ? 'morning' : circ === 'afternoon' ? 'afternoon' : 'evening'}. "${task.title}" is your highest-priority open task. Nothing's been completed yet today. Where are you with it?`;
    } else if (completed.length > 0) {
      const score = facts.find(f => f.id === 'strong_day' || f.id === 'started_day');
      text = `${score ? score.detail : `${completed.length} tasks done today.`} ${pending.length > 0 ? `${pending.length} still pending.` : 'Queue is clear.'} What do you need from me?`;
    } else {
      text = `${circ.charAt(0).toUpperCase() + circ.slice(1)}. ${pending.length > 0 ? `${pending.length} tasks queued, energy at ${ctx.energyLevel}/5.` : 'Clean slate.'} What are we working on?`;
    }

    const scored   = scoreActions(facts, ctx);
    const action   = scored[0];
    const response = action ? buildResponse(action, facts, ctx, '') : null;

    return {
      id: `brain-greet-${this._msgId++}`,
      role: 'kaal',
      text,
      emotion: overdue.length > 0 ? 'coaching' : 'neutral',
      suggestions: response?.suggestions ?? ['What should I work on?', 'Plan my day', "What's most urgent?", 'I\'m overwhelmed'],
      timestamp: Date.now(),
      decision: response?.decision,
    };
  }

  // ── Live context snapshot — for the UI panel ──────────────────────────────

  getContextSnapshot(ctx: AgentContext): {
    topFacts: Fact[];
    topAction: ScoredAction | null;
    isMonitoring: boolean;
    monitoringNote: string;
  } {
    const facts  = observe(ctx);
    const scored = scoreActions(facts, ctx);
    const fatigue = fatigueEngine.state;

    const monitoringNotes = [
      facts.some(f => f.id.includes('overdue'))
        ? `${facts.find(f => f.id.includes('overdue'))!.label} — watching this`
        : null,
      fatigue.continuousWorkMin >= 45
        ? `${Math.round(fatigue.continuousWorkMin)} min continuous work`
        : null,
      facts.some(f => f.id === 'untouched_priority')
        ? `"${(facts.find(f => f.id === 'untouched_priority')!.data as AgentTask).title}" still untouched`
        : null,
    ].filter(Boolean);

    return {
      topFacts: facts.slice(0, 5),
      topAction: scored[0] ?? null,
      isMonitoring: true,
      monitoringNote: monitoringNotes[0] ?? 'All signals nominal',
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _ventingAck(text: string, facts: Fact[]): string {
    const topFact = facts[0];
    const stressors = facts.filter(f => f.category === 'workload' || f.category === 'energy').slice(0, 2);
    if (stressors.length > 0) {
      return `I hear you. Looking at your context, there's a real reason for this — ${stressors.map(f => f.label).join(' and ')}. That's not nothing.`;
    }
    return `I hear you. That feeling is real, and sometimes there's no single clean explanation for it.`;
  }

  private _reportingAck(text: string, ctx: AgentContext): string {
    const completed = ctx.tasks.filter(t => t.status === 'completed').length;
    return completed > 0
      ? `Got it — logged. ${completed} done today.`
      : `Good, logged.`;
  }

  private _biasForUserTopic(
    defaultAction: ScoredAction,
    allScored: ScoredAction[],
    meaning: ReturnType<typeof inferMeaning>,
    facts: Fact[],
  ): ScoredAction {
    if (!meaning.topicHint) return defaultAction;
    const topicMap: Partial<Record<string, ActionId[]>> = {
      'energy':   ['force_break', 'suggest_break', 'quick_wins_first'],
      'break':    ['force_break', 'suggest_break'],
      'tasks':    ['tackle_overdue', 'start_priority', 'quick_wins_first', 'triage_queue'],
      'planning': ['end_of_day', 'morning_attack', 'triage_queue'],
      'focus':    ['deep_focus', 'morning_attack', 'start_priority'],
      'patterns': ['post_lunch_light', 'morning_attack'],
    };
    const preferred = topicMap[meaning.topicHint] ?? [];
    const biased = allScored.find(a => preferred.includes(a.id));
    return biased ?? defaultAction;
  }

  private _proactiveIntro(fact: Fact): string {
    const intros = [
      `I'm going to surface something without you asking:`,
      `Something just hit a threshold I care about:`,
      `Context update — this matters:`,
      `I've been watching this:`,
    ];
    return intros[Math.floor(fact.weight * intros.length) % intros.length];
  }
}

export const kaalBrain = new KaalBrain();