/**
 * KAAL Agentic AI Service
 * ═══════════════════════════════════════════════════════════════
 * Core autonomous agent with:
 *   • Intent recognition (12 categories, regex-based)
 *   • Context-aware response generation (uses real task/energy data)
 *   • Multi-step tool planning (navigate, create_task, start_focus, etc.)
 *   • Daily plan generation (energy-optimized time blocks)
 *   • ADHD-specific behavioral patterns built in
 *   • Persistent memory via agentMemory
 * ═══════════════════════════════════════════════════════════════
 */

import { agentMemory, DailyPlan, TimeBlock } from './agent-memory';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AgentTask {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  dueDate?: string | null;
  estimatedMinutes?: number;
  tags?: string[];
}

export interface AgentContext {
  tasks: AgentTask[];
  energyLevel: number;       // 1–5
  focusSessionActive: boolean;
  focusSessionMinutes: number;
  todayFocusMinutes: number;
  streakDays: number;
  hour: number;
  dayOfWeek: number;
}

export type AgentEmotion =
  | 'thinking'
  | 'encouraging'
  | 'warning'
  | 'celebrating'
  | 'coaching'
  | 'neutral';

export interface AgentToolCall {
  id: string;
  tool: 'navigate' | 'create_task' | 'start_focus' | 'send_nudge' | 'show_plan' | 'filter_tasks' | 'log_energy' | 'schedule_break';
  displayLabel: string;
  icon: string;
  params: Record<string, any>;
  status: 'pending' | 'executing' | 'done' | 'failed';
}

export type AgentRichContent =
  | { type: 'plan'; plan: DailyPlan }
  | { type: 'task_highlight'; tasks: AgentTask[]; label: string }
  | { type: 'single_task'; task: AgentTask; reason: string }
  | { type: 'stats'; data: Record<string, string | number>; highlight?: string }
  | { type: 'insight_list'; items: string[] }
  | { type: 'energy_tip'; tips: string[] };

export interface AgentMessage {
  id: string;
  role: 'user' | 'kaal';
  text: string;
  emotion?: AgentEmotion;
  richContent?: AgentRichContent;
  toolCalls?: AgentToolCall[];
  suggestions?: string[];
  timestamp: number;
  isTyping?: boolean;
}

// ── Intent Engine ─────────────────────────────────────────────────────────

type Intent =
  | 'overwhelmed'
  | 'what_next'
  | 'plan_day'
  | 'focus_help'
  | 'task_add'
  | 'progress_check'
  | 'energy_low'
  | 'break_request'
  | 'motivation'
  | 'time_check'
  | 'patterns'
  | 'hello'
  | 'brain_dump'
  | 'unknown';

function recognizeIntent(msg: string): Intent {
  const t = msg.toLowerCase().trim();
  if (/^(hi|hello|hey|sup|good\s*(morning|afternoon|evening)|morning|yo)\b/.test(t)) return 'hello';
  if (/overwhelm|too many task|can'?t handle|stressed|too much|pile.*up|drown/.test(t)) return 'overwhelmed';
  if (/what should|what next|what do|where.*start|help me start|what to do|what now|next step/.test(t)) return 'what_next';
  if (/plan|schedule|organize.*today|structure.*day|time.*block|block.*time|today.*schedule/.test(t)) return 'plan_day';
  if (/can'?t focus|distract|mind.*wander|hard.*concentrat|keep.*losing focus|attention/.test(t)) return 'focus_help';
  if (/add task|remind me to|new task|create task|put.*on.*list|add.*to|need to.*do/.test(t)) return 'task_add';
  if (/how am i|my progress|doing.*today|productivity|how.*productive|stats|score/.test(t)) return 'progress_check';
  if (/tired|exhaust|no energy|drained|sleepy|low energy|running.*low|fatigue/.test(t)) return 'energy_low';
  if (/need.*break|take.*break|rest|step away|pause|short break/.test(t)) return 'break_request';
  if (/motivat|inspire|push me|encourage|don'?t (want|feel)|can'?t bring myself|struggling/.test(t)) return 'motivation';
  if (/how long|what time|clock|duration|time check|time is it/.test(t)) return 'time_check';
  if (/pattern|habit|peak.*hour|work style|when.*most|best time|analysis/.test(t)) return 'patterns';
  // Long freeform text (brain dump) — no clear command, just a wall of thoughts
  if (msg.length > 120 && !msg.startsWith('/')) return 'brain_dump';
  return 'unknown';
}

// ── Derived Context ───────────────────────────────────────────────────────

interface DerivedContext extends AgentContext {
  pending: AgentTask[];
  overdue: AgentTask[];
  highPri: AgentTask[];
  quickWins: AgentTask[];
  completedCount: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  energyLabel: string;
  hoursLeft: number; // working hours remaining in the day
}

function deriveContext(ctx: AgentContext): DerivedContext {
  const pending = ctx.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const overdue = pending.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const highPri = pending.filter(t => t.priority === 'high' || t.priority === 'urgent');
  const quickWins = pending.filter(t => (t.estimatedMinutes || 30) <= 15);
  const completedCount = ctx.tasks.filter(t => t.status === 'completed').length;

  const timeOfDay: DerivedContext['timeOfDay'] =
    ctx.hour < 12 ? 'morning' :
    ctx.hour < 17 ? 'afternoon' :
    ctx.hour < 21 ? 'evening' : 'night';

  const energyLabel =
    ctx.energyLevel === 1 ? 'very low' :
    ctx.energyLevel === 2 ? 'low' :
    ctx.energyLevel === 3 ? 'moderate' :
    ctx.energyLevel === 4 ? 'good' : 'high';

  const endOfWork = 18;
  const hoursLeft = Math.max(0, endOfWork - ctx.hour);

  return { ...ctx, pending, overdue, highPri, quickWins, completedCount, timeOfDay, energyLabel, hoursLeft };
}

// ── Response Builders ─────────────────────────────────────────────────────

type PartialMsg = Omit<AgentMessage, 'id' | 'timestamp' | 'role'>;

let _toolCounter = 0;
const mkTool = (
  tool: AgentToolCall['tool'],
  label: string,
  icon: string,
  params: Record<string, any>
): AgentToolCall => ({
  id: `tool-${Date.now()}-${_toolCounter++}`,
  tool, displayLabel: label, icon, params,
  status: 'pending',
});

// ─────────────────────────────────────────────────────────────────────────
class KaalAgentService {
  private msgCounter = 0;
  private mkId = () => `kaal-${Date.now()}-${this.msgCounter++}`;

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Respond to a user chat message.
   * Returns a full AgentMessage with rich content & tool calls.
   */
  respond(userText: string, ctx: AgentContext): AgentMessage {
    const intent = recognizeIntent(userText);
    const dc = deriveContext(ctx);
    const body = this.buildResponse(intent, userText, dc);
    return { ...body, id: this.mkId(), role: 'kaal', timestamp: Date.now() };
  }

  /**
   * Generate the automatic greeting when the agent screen opens.
   */
  greet(ctx: AgentContext): AgentMessage {
    const dc = deriveContext(ctx);
    return { ...this.buildGreeting(dc), id: this.mkId(), role: 'kaal', timestamp: Date.now() };
  }

  /**
   * Generate (or re-generate) a full daily plan.
   */
  buildDailyPlan(ctx: AgentContext): DailyPlan {
    const dc = deriveContext(ctx);
    return this.generatePlan(dc);
  }

  // ── Intent Router ───────────────────────────────────────────────

  private buildResponse(intent: Intent, raw: string, dc: DerivedContext): PartialMsg {
    switch (intent) {
      case 'hello':          return this.rHello(dc);
      case 'overwhelmed':    return this.rOverwhelmed(dc);
      case 'what_next':      return this.rWhatNext(dc);
      case 'plan_day':       return this.rPlanDay(dc);
      case 'focus_help':     return this.rFocusHelp(dc);
      case 'task_add':       return this.rTaskAdd(raw, dc);
      case 'progress_check': return this.rProgress(dc);
      case 'energy_low':     return this.rEnergyLow(dc);
      case 'break_request':  return this.rBreak(dc);
      case 'motivation':     return this.rMotivation(dc);
      case 'time_check':     return this.rTimeCheck(dc);
      case 'patterns':       return this.rPatterns(dc);
      case 'brain_dump':     return this.rBrainDump(raw, dc);
      default:               return this.rUnknown(raw, dc);
    }
  }

  // ── Greeting ────────────────────────────────────────────────────

  private buildGreeting(dc: DerivedContext): PartialMsg {
    const sessionCount = agentMemory.getSessionCount();
    const isFirstTime = sessionCount <= 1;

    if (isFirstTime) {
      return {
        text: `Hey — I'm KAAL, your executive function AI. I'm here to help you work *with* your brain, not against it. I can plan your day, help you start when you're stuck, manage overwhelm, and keep you on track. What's going on today?`,
        emotion: 'neutral',
        suggestions: ['Plan my day', 'What should I work on?', 'I\'m overwhelmed', 'Show my progress'],
      };
    }

    const greetings: Record<DerivedContext['timeOfDay'], string> = {
      morning: `Good morning! ${dc.pending.length > 0 ? `You've got ${dc.pending.length} tasks queued${dc.highPri.length > 0 ? `, including ${dc.highPri.length} high-priority items` : ''}. ` : 'Your slate is clean. '}${dc.energyLevel >= 4 ? 'Energy looks good — let\'s use it.' : 'Let\'s find your starting point.'}`,
      afternoon: `Afternoon check-in. ${dc.completedCount > 0 ? `You've already completed ${dc.completedCount} tasks — solid start. ` : ''}${dc.pending.length > 0 ? `${dc.pending.length} tasks still pending. ` : ''}What do you need?`,
      evening: `Evening. ${dc.completedCount > 0 ? `${dc.completedCount} tasks done today` : 'It\'s been a tough day'}${dc.todayFocusMinutes > 0 ? ` with ${dc.todayFocusMinutes} min of deep focus` : ''}. You've earned some wind-down. Want to prep for tomorrow?`,
      night: `Working late? ${dc.todayFocusMinutes > 0 ? `You've already put in ${dc.todayFocusMinutes} minutes today. ` : ''}Make sure you're not running on fumes. What do you need from me?`,
    };

    return {
      text: greetings[dc.timeOfDay],
      emotion: dc.timeOfDay === 'morning' ? 'encouraging' : 'coaching',
      suggestions: ['Plan my day', 'What\'s next?', 'Show my progress', 'I\'m overwhelmed'],
    };
  }

  // ── Response Handlers ───────────────────────────────────────────

  private rHello(dc: DerivedContext): PartialMsg {
    return this.buildGreeting(dc);
  }

  private rOverwhelmed(dc: DerivedContext): PartialMsg {
    const { pending, overdue, highPri, quickWins } = dc;

    if (pending.length === 0) {
      return {
        text: `Your task list is actually empty — nothing pending right now. The overwhelm is real, but it's not coming from your workload. Take a breath. What's on your mind?`,
        emotion: 'coaching',
        suggestions: ['I need to brain dump', 'Add tasks', 'Just talk'],
      };
    }

    const topTasks = highPri.length > 0 ? highPri.slice(0, 3) : pending.slice(0, 3);
    const overdueNote = overdue.length > 0 ? ` (${overdue.length} are overdue)` : '';

    return {
      text: `Overwhelm is valid — you've got ${pending.length} tasks${overdueNote}. But here's the secret: you only need to think about 3 of them right now. The rest don't exist until you finish these.`,
      emotion: 'coaching',
      richContent: {
        type: 'task_highlight',
        tasks: topTasks,
        label: `Focus on only these ${topTasks.length}:`,
      },
      toolCalls: [mkTool('filter_tasks', 'Hiding low-priority noise', '🔍', { priority: 'high' })],
      suggestions: ['Start on the first one', 'Show me quick wins first', 'I need a break', 'Help me plan today'],
    };
  }

  private rWhatNext(dc: DerivedContext): PartialMsg {
    const { energyLevel, highPri, quickWins, pending } = dc;

    if (pending.length === 0) {
      return {
        text: `All clear — nothing pending. This is a rare window. You could: get ahead on tomorrow, do a brain dump, or just properly rest (that's productive too).`,
        emotion: 'celebrating',
        suggestions: ['Plan tomorrow', 'Brain dump', 'Take a break', 'Add tasks'],
      };
    }

    let bestTask: AgentTask;
    let reason: string;

    if (energyLevel >= 4 && highPri.length > 0) {
      bestTask = highPri[0];
      reason = `Energy is ${dc.energyLabel} — this is your window for hard things. Tackle your highest-priority task now, before the afternoon dip.`;
    } else if (energyLevel <= 2 && quickWins.length > 0) {
      bestTask = quickWins[0];
      reason = `Energy is ${dc.energyLabel}, so let's build momentum with something small. Quick wins release dopamine and make harder tasks feel more accessible.`;
    } else if (highPri.length > 0) {
      bestTask = highPri[0];
      reason = `This is your top priority. Even a focused 25-minute block moves it forward significantly.`;
    } else {
      bestTask = pending[0];
      reason = `This is next on your list. Just start — the activation energy disappears once you're in it.`;
    }

    return {
      text: reason,
      emotion: energyLevel >= 4 ? 'encouraging' : 'coaching',
      richContent: { type: 'single_task', task: bestTask, reason },
      toolCalls: [mkTool('start_focus', `Setting up focus session`, '🎯', { taskId: bestTask.id, taskTitle: bestTask.title, duration: 25 })],
      suggestions: ['Start 25-min sprint', 'Start 45-min session', 'Show all tasks', 'Not feeling it'],
    };
  }

  private rPlanDay(dc: DerivedContext): PartialMsg {
    const plan = this.generatePlan(dc);
    agentMemory.saveDailyPlan(plan);

    const blocksCount = plan.timeBlocks.filter(b => b.type === 'focus').length;
    const totalFocus = plan.timeBlocks
      .filter(b => b.type === 'focus')
      .reduce((sum, b) => {
        const [sh, sm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        return sum + (eh * 60 + em) - (sh * 60 + sm);
      }, 0);

    return {
      text: `Done. I've blocked ${blocksCount} focus sessions (${totalFocus} min total) optimized for your energy pattern. Hard tasks are front-loaded during your peak window. You can tap any block to adjust.`,
      emotion: 'coaching',
      richContent: { type: 'plan', plan },
      toolCalls: [mkTool('show_plan', 'Saving today\'s plan', '📅', { plan })],
      suggestions: ['Looks good!', 'Regenerate plan', 'Adjust priorities', 'Start first block'],
    };
  }

  private rFocusHelp(dc: DerivedContext): PartialMsg {
    const { focusSessionActive, focusSessionMinutes, highPri, pending } = dc;

    if (focusSessionActive) {
      return {
        text: `You've been in a session for ${focusSessionMinutes} minutes. Distraction in focus sessions is totally normal — especially for ADHD brains. Here's what works: quickly write down the distracting thought (so your brain releases it), take one breath, then return. Don't restart the clock — just continue.`,
        emotion: 'coaching',
        suggestions: ['Got it, back to work', 'End session', 'I need a real break'],
      };
    }

    const tasks = highPri.length > 0 ? highPri : pending;

    return {
      text: `The hardest part of focus isn't maintaining it — it's *starting*. Your brain resists because it anticipates effort. The trick: make the start impossibly small. Open the document. Write one sentence. That's it. Once you've started, the brain adjusts.\n\nPick one task and let's do a 25-minute sprint:`,
      emotion: 'coaching',
      richContent: tasks.length > 0 ? {
        type: 'task_highlight',
        tasks: tasks.slice(0, 3),
        label: 'Pick one:',
      } : undefined,
      toolCalls: [mkTool('navigate', 'Opening Focus Mode', '🧘', { route: '/focus' })],
      suggestions: ['Start 25-min sprint', 'Start 15-min sprint', 'I need body doubling', 'Try Pomodoro'],
    };
  }

  private rTaskAdd(raw: string, dc: DerivedContext): PartialMsg {
    // Extract task name from natural language
    const extractPatterns = [
      /(?:add|remind me to|create|put|note)\s+["']?(.+?)["']?(?:\s+to|\s+on|\s+for|\s+by|$)/i,
      /(?:need to|have to|want to|should)\s+(.+?)(?:\s+today|\s+tomorrow|$)/i,
      /task[:\s]+(.+)/i,
    ];

    let taskTitle: string | null = null;
    for (const pattern of extractPatterns) {
      const match = raw.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        taskTitle = match[1].trim();
        break;
      }
    }

    if (taskTitle) {
      return {
        text: `On it — adding "${taskTitle}" to your task list. I'll set it as medium priority. You can bump it up in Tasks if needed.`,
        emotion: 'neutral',
        toolCalls: [mkTool('create_task', `Creating "${taskTitle}"`, '✅', { title: taskTitle, priority: 'medium' })],
        suggestions: ['Make it high priority', 'Add another', 'Show my tasks', 'Start working on it'],
      };
    }

    return {
      text: `I couldn't quite extract the task name. What would you like to add to your list?`,
      emotion: 'neutral',
      toolCalls: [mkTool('navigate', 'Opening task creator', '✅', { route: '/tasks' })],
      suggestions: ['Go to Tasks screen'],
    };
  }

  private rProgress(dc: DerivedContext): PartialMsg {
    const { completedCount, pending, todayFocusMinutes, streakDays, energyLevel } = dc;
    const total = completedCount + pending.length;
    const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    let headline = '';
    if (completedCount >= 5 || todayFocusMinutes >= 150) headline = 'You\'re having a strong day.';
    else if (completedCount >= 2 || todayFocusMinutes >= 60) headline = 'Solid progress today.';
    else if (completedCount === 1) headline = 'You\'ve made a start — momentum is building.';
    else headline = 'The day is still open. Let\'s make something of it.';

    const pattern = agentMemory.getUserPattern();

    return {
      text: headline,
      emotion: completedCount >= 3 ? 'celebrating' : 'coaching',
      richContent: {
        type: 'stats',
        data: {
          'Tasks Completed': completedCount,
          'Pending Tasks': pending.length,
          'Focus Time Today': `${todayFocusMinutes} min`,
          'Daily Goal': `${pattern.dailyFocusGoal} min`,
          'Current Streak': `${streakDays} days 🔥`,
          'Completion Rate': `${rate}%`,
          'Energy Right Now': `${energyLevel}/5`,
        },
        highlight: rate >= 60 ? 'Great completion rate!' : undefined,
      },
      suggestions: ['What\'s next?', 'Plan rest of day', 'See Analytics', 'I\'m done for today'],
    };
  }

  private rEnergyLow(dc: DerivedContext): PartialMsg {
    const { completedCount, todayFocusMinutes, quickWins } = dc;
    const hasEarned = todayFocusMinutes >= 60 || completedCount >= 3;

    if (hasEarned) {
      return {
        text: `You've put in ${todayFocusMinutes} min of focus and completed ${completedCount} tasks. That's real output — your brain has earned low energy. This isn't laziness, it's depletion. Step away fully for 15–20 minutes.`,
        emotion: 'encouraging',
        toolCalls: [mkTool('schedule_break', 'Scheduling 20-min break', '☕', { duration: 20 })],
        suggestions: ['20-min break', 'Easy tasks only', 'Log energy level', 'Done for today'],
      };
    }

    const tips = [
      'Step outside for 5 minutes — daylight and movement reset energy fast.',
      'Drink water. Dehydration is sneaky and tanks focus.',
      'Do one tiny task. Completion releases dopamine which generates energy.',
      'Low energy ≠ no ability. Routine tasks (email, admin) are perfect for this state.',
    ];

    return {
      text: `Low energy early in the day usually isn't a battery problem — it's a startup problem. Your brain needs a signal to shift gears. A few things that actually work:`,
      emotion: 'coaching',
      richContent: quickWins.length > 0 ? {
        type: 'task_highlight',
        tasks: quickWins.slice(0, 3),
        label: 'Quick wins to spark momentum:',
      } : {
        type: 'energy_tip',
        tips,
      },
      suggestions: ['Log energy level', 'Show easy tasks', '5-min task', 'Take a break'],
    };
  }

  private rBreak(dc: DerivedContext): PartialMsg {
    const { focusSessionMinutes, focusSessionActive, todayFocusMinutes } = dc;

    if (focusSessionActive && focusSessionMinutes >= 25) {
      return {
        text: `You've earned it — ${focusSessionMinutes} min of deep work. A proper break means away from the screen. Walk, stretch, make a drink. 10 minutes minimum. Your brain will be sharper for it.`,
        emotion: 'encouraging',
        toolCalls: [mkTool('schedule_break', 'Logging break time', '🌿', { duration: 10 })],
        suggestions: ['Back in 10 min', 'Back in 15 min', 'I\'m back — what\'s next?'],
      };
    }

    return {
      text: `Take it. ${todayFocusMinutes > 0 ? `You've done ${todayFocusMinutes} min today — ` : ''}Breaks are part of the work, not an escape from it. Guilt-free. When you're back, I'll have a clear starting point ready.`,
      emotion: 'encouraging',
      toolCalls: [mkTool('schedule_break', 'Marking break time', '🌿', { duration: 15 })],
      suggestions: ['I\'m back', 'What to focus on when back?', 'Log this break'],
    };
  }

  private rMotivation(dc: DerivedContext): PartialMsg {
    const { completedCount, streakDays, pending } = dc;
    const pattern = agentMemory.getUserPattern();

    const options = [
      `Motivation follows action — not the other way around. Waiting to feel motivated is a trap. The feeling comes *after* you start. Pick the smallest possible next step and just begin. That's it.`,
      `You've shown up ${agentMemory.getSessionCount()} times to this app, which means you're trying. ${streakDays > 0 ? `You've kept a ${streakDays}-day streak — that's evidence of consistency.` : `Every productive person has days like this. The secret is lowering the bar.`} One task. Just one.`,
      `Your brain isn't broken. Executive dysfunction is real. On hard days, structure is everything — that's exactly what I'm here for. Let me make the decision for you: here's what you're doing next.`,
    ];

    const msg = options[completedCount % options.length];

    return {
      text: msg,
      emotion: 'encouraging',
      richContent: pending.length > 0 ? {
        type: 'single_task',
        task: pending[0],
        reason: 'Just this one. Nothing else exists right now.',
      } : undefined,
      suggestions: ['10-min sprint', 'I\'m going', 'Give me something tiny', 'I\'m done today'],
    };
  }

  private rTimeCheck(dc: DerivedContext): PartialMsg {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { focusSessionActive, focusSessionMinutes, todayFocusMinutes, hoursLeft } = dc;

    const timeContext =
      dc.hour < 10 ? 'Still morning — the best hours are ahead.' :
      dc.hour < 12 ? 'Late morning — prime focus time for most people.' :
      dc.hour < 14 ? 'Just past noon. How\'s energy?' :
      dc.hour < 16 ? 'Afternoon — watch the energy dip.' :
      dc.hour < 18 ? `${hoursLeft} working hours left. Use them intentionally.` :
      'Evening. If you\'re still working, make it count or wind down.';

    return {
      text: `It's ${timeStr}. ${timeContext} ${focusSessionActive ? `You've been in your current session for ${focusSessionMinutes} min. ` : ''}Focus time today: ${todayFocusMinutes} min.`,
      emotion: 'neutral',
      suggestions: ['What should I do now?', 'Plan rest of day', 'Check progress', 'Take a break'],
    };
  }

  private rPatterns(dc: DerivedContext): PartialMsg {
    const pattern = agentMemory.getUserPattern();
    const peakStr = pattern.peakHours.length > 0
      ? pattern.peakHours.map(h => `${h}:00`).join(', ')
      : 'Still learning (need more data)';

    const items = [
      `Peak energy hours: ${peakStr}`,
      `Work style: ${pattern.workStyle === 'unknown' ? 'Still learning' : pattern.workStyle}`,
      `Average daily tasks: ${pattern.averageDailyTasks}`,
      `Task completion rate: ${Math.round(pattern.taskCompletionRate * 100)}%`,
      `Daily focus goal: ${pattern.dailyFocusGoal} min`,
      `Longest streak: ${pattern.longestStreak} days`,
      `Sessions tracked: ${agentMemory.getSessionCount()}`,
    ];

    return {
      text: `Here's what I've learned about how you work. This model improves every session — I'm adjusting it based on when you're most productive and what nudges you respond to.`,
      emotion: 'coaching',
      richContent: { type: 'insight_list', items },
      suggestions: ['Update my focus goal', 'Show today\'s plan', 'What should I work on?'],
    };
  }

  private rBrainDump(rawText: string, dc: DerivedContext): PartialMsg {
    const extracted = this.parseDump(rawText);
    const taskCount = extracted.length;

    if (taskCount === 0) {
      return {
        text: `I processed your brain dump — no clear action items detected, but your thoughts are captured. Try phrases like "I need to..." or "finish X by Friday" to extract tasks automatically. Want me to turn this into a free-form note instead?`,
        emotion: 'coaching',
        suggestions: ['Add tasks manually', 'Plan my day', 'What should I work on?'],
      };
    }

    const agentTasks: AgentTask[] = extracted.map((t, i) => ({
      id: `dump-extracted-${Date.now()}-${i}`,
      title: t.title,
      priority: t.priority,
      status: 'todo',
      estimatedMinutes: 30,
    }));

    return {
      text: `Got it — I processed your brain dump and extracted ${taskCount} action item${taskCount > 1 ? 's' : ''}. Here's what I found. Tap "Create all" to add them to your task list, or dismiss any you don't need.`,
      emotion: 'coaching',
      richContent: {
        type: 'task_highlight',
        tasks: agentTasks,
        label: `${taskCount} extracted task${taskCount > 1 ? 's' : ''}:`,
      },
      toolCalls: [
        mkTool('create_task', `Creating ${taskCount} extracted tasks`, '✅', {
          tasks: agentTasks.map(t => ({ title: t.title, priority: t.priority })),
          bulk: true,
        }),
      ],
      suggestions: ['Create all tasks', 'Add to today\'s plan', 'Edit before creating', 'Dismiss all'],
    };
  }

  /** Extract action items from freeform brain dump text */
  private parseDump(text: string): Array<{ title: string; priority: AgentTask['priority'] }> {
    const results: Array<{ title: string; priority: AgentTask['priority'] }> = [];
    const seen = new Set<string>();

    const patterns: Array<{ re: RegExp; priority: AgentTask['priority'] }> = [
      { re: /(?:urgently?|asap|immediately|critical)[:\s]+(.+?)(?:[.;!\n]|$)/gi, priority: 'urgent' },
      { re: /(?:need to|needs to|have to|must|need)\s+(.+?)(?:[.;!\n,]|$)/gi, priority: 'high' },
      { re: /(?:todo|to-do|action)[:\s]+(.+?)(?:[.;!\n]|$)/gi, priority: 'medium' },
      { re: /(?:don't forget|remember)(?: to)?\s+(.+?)(?:[.;!\n,]|$)/gi, priority: 'high' },
      { re: /(?:finish|complete|fix|update|write|send|review|call|email|prepare|schedule|book|follow up)\s+(.+?)(?:[.;!\n,]|$)/gi, priority: 'medium' },
      { re: /(?:should|could|want to)\s+(.+?)(?:[.;!\n,]|$)/gi, priority: 'low' },
    ];

    for (const { re, priority } of patterns) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text)) !== null) {
        const raw = match[1].trim().replace(/\s+/g, ' ');
        if (raw.length < 3 || raw.length > 150) continue;
        const title = raw.charAt(0).toUpperCase() + raw.slice(1);
        const key = title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        // Override priority if urgency words appear in full text
        const finalPriority: AgentTask['priority'] =
          /urgent|asap|critical|immediately/i.test(raw) ? 'urgent' :
          /important|high priority/i.test(raw) ? 'high' :
          /eventually|someday|maybe/i.test(raw) ? 'low' :
          priority;

        results.push({ title, priority: finalPriority });
        if (results.length >= 10) break;
      }
      if (results.length >= 10) break;
    }

    return results;
  }

  private rUnknown(raw: string, dc: DerivedContext): PartialMsg {
    // Try to give a contextual default
    if (dc.pending.length > 5) {
      return {
        text: `I can help with that, but first — you've got ${dc.pending.length} tasks pending. Want me to help prioritize before we dig in?`,
        emotion: 'neutral',
        suggestions: ['What\'s next?', 'Plan my day', 'I\'m overwhelmed', 'Go ahead, keep talking'],
      };
    }

    return {
      text: `I'm KAAL, your executive function AI. I'm tuned for: task prioritization, focus session planning, overwhelm triage, and daily scheduling. What would help most right now?`,
      emotion: 'neutral',
      suggestions: ['Plan my day', 'What\'s next?', 'I\'m overwhelmed', 'Check my progress', 'I can\'t focus'],
    };
  }

  // ── Plan Generator ─────────────────────────────────────��────────────────

  generatePlan(ctx: DerivedContext | AgentContext): DailyPlan {
    const dc = 'pending' in ctx ? ctx as DerivedContext : deriveContext(ctx);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const pattern = agentMemory.getUserPattern();
    const peakStart = pattern.peakHours[0] ?? 9;

    const blocks: TimeBlock[] = [];
    let bid = 0;
    const mkBlock = (
      sh: number, sm: number,
      durationMin: number,
      type: TimeBlock['type'],
      title: string,
      taskId?: string,
    ): TimeBlock => {
      const start = new Date(); start.setHours(sh, sm, 0, 0);
      const end = new Date(start.getTime() + durationMin * 60000);
      return {
        id: `blk-${bid++}`,
        startTime: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
        endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
        type, title, taskId,
        completed: start < now,
        aiGenerated: true,
        energyRequired: type === 'focus' ? 4 : 2,
      };
    };

    // Sort tasks by priority
    const sorted = [...dc.pending].sort((a, b) => {
      const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });

    let cursor = Math.max(dc.hour, 8);
    const END_HOUR = 19;
    let taskIdx = 0;

    while (cursor < END_HOUR - 1 && taskIdx < sorted.length) {
      const isPeak = cursor >= peakStart && cursor < peakStart + 3;
      const sessionMin = isPeak ? 90 : dc.energyLevel >= 4 ? 60 : 45;
      const breakMin = isPeak ? 15 : 10;

      if (cursor + Math.ceil(sessionMin / 60) <= END_HOUR) {
        const task = sorted[taskIdx++];
        blocks.push(mkBlock(cursor, 0, sessionMin, 'focus', task.title, task.id));
        cursor += Math.ceil(sessionMin / 60);
        if (cursor + Math.ceil(breakMin / 60) <= END_HOUR) {
          blocks.push(mkBlock(cursor, 0, breakMin, 'break', 'Recovery Break'));
          cursor += Math.ceil(breakMin / 60);
        }
      } else break;
    }

    // Admin tail
    if (cursor < END_HOUR - 1) {
      blocks.push(mkBlock(cursor, 0, 30, 'admin', 'Email & Admin Tasks'));
    }

    const topPriorityIds = sorted.slice(0, 3).map(t => t.id);

    // Energy forecast 8am–7pm
    const energyForecast = Array.from({ length: 12 }, (_, i) => {
      const h = i + 8;
      let e = dc.energyLevel * 20;
      if (h >= peakStart && h < peakStart + 3) e = Math.min(100, e + 20);
      if (h >= 13 && h <= 15) e = Math.max(30, e - 20);
      if (h >= 17) e = Math.max(20, e - 30);
      return Math.round(e);
    });

    return {
      date: today,
      timeBlocks: blocks,
      topPriorityIds,
      energyForecast,
      generatedAt: Date.now(),
      planNotes: `Optimized for energy ${dc.energyLevel}/5. ${dc.pending.length} tasks scheduled. Peak focus at ${peakStart}:00.`,
    };
  }
}

export const kaalAgent = new KaalAgentService();