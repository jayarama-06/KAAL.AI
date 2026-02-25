/**
 * KAAL Agent Memory Service
 * Persistent, learning user model.
 * Remembers patterns across sessions and adapts the agent's behavior.
 */

export interface UserPattern {
  // Learned productivity patterns
  peakHours: number[];                        // Hours with highest recorded energy
  typicalSessionLength: number;               // Average focus session (minutes)
  averageDailyTasks: number;
  taskCompletionRate: number;                 // 0–1
  workStyle: 'sprinter' | 'marathoner' | 'cyclic' | 'unknown';

  // Energy observations: hour -> list of readings
  energyByHour: Record<number, number[]>;

  // Nudge effectiveness: nudgeType -> response rate (0–1)
  nudgeResponseRates: Record<string, number>;

  // Behavioral
  commonDistractedHours: number[];
  longestStreak: number;

  // Goals
  dailyFocusGoal: number;  // minutes
  weeklyTaskGoal: number;
}

export interface TimeBlock {
  id: string;
  startTime: string;  // "09:00"
  endTime: string;    // "10:30"
  type: 'focus' | 'break' | 'admin' | 'meeting' | 'buffer';
  title: string;
  taskId?: string;
  completed: boolean;
  aiGenerated: boolean;
  energyRequired?: number; // 1-5
}

export interface DailyPlan {
  date: string;
  timeBlocks: TimeBlock[];
  topPriorityIds: string[];
  energyForecast: number[]; // one per hour, 8am–7pm
  generatedAt: number;
  planNotes: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'kaal';
  text: string;
  timestamp: number;
}

interface AgentMemoryStore {
  userPattern: UserPattern;
  conversationHistory: ConversationMessage[];
  dailyPlans: Record<string, DailyPlan>;
  sessionCount: number;
  lastSeen: number;
}

const DEFAULT_PATTERN: UserPattern = {
  peakHours: [9, 10, 11],
  typicalSessionLength: 45,
  averageDailyTasks: 5,
  taskCompletionRate: 0.7,
  workStyle: 'unknown',
  energyByHour: {},
  nudgeResponseRates: {},
  commonDistractedHours: [13, 14],
  longestStreak: 0,
  dailyFocusGoal: 120,
  weeklyTaskGoal: 20,
};

class AgentMemoryService {
  private store: AgentMemoryStore;
  private readonly KEY = 'kaal_agent_memory_v2';

  constructor() {
    this.store = this.load();
    this.store.sessionCount += 1;
    this.store.lastSeen = Date.now();
    this.persist();
  }

  // ── Persistence ───────────────────────────────────────────────────

  private load(): AgentMemoryStore {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          userPattern: { ...DEFAULT_PATTERN, ...parsed.userPattern },
          conversationHistory: parsed.conversationHistory || [],
          dailyPlans: parsed.dailyPlans || {},
          sessionCount: parsed.sessionCount || 0,
          lastSeen: parsed.lastSeen || Date.now(),
        };
      }
    } catch {}
    return {
      userPattern: { ...DEFAULT_PATTERN },
      conversationHistory: [],
      dailyPlans: {},
      sessionCount: 0,
      lastSeen: Date.now(),
    };
  }

  private persist() {
    try {
      // Prune: keep last 30 days of plans, last 200 messages
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const prunedPlans: Record<string, DailyPlan> = {};
      Object.entries(this.store.dailyPlans).forEach(([date, plan]) => {
        if (new Date(date).getTime() > cutoff) prunedPlans[date] = plan;
      });

      localStorage.setItem(this.KEY, JSON.stringify({
        ...this.store,
        dailyPlans: prunedPlans,
        conversationHistory: this.store.conversationHistory.slice(-200),
      }));
    } catch {}
  }

  // ── User Pattern API ──────────────────────────────────────────────

  getUserPattern(): UserPattern {
    return { ...this.store.userPattern };
  }

  updateUserPattern(updates: Partial<UserPattern>) {
    this.store.userPattern = { ...this.store.userPattern, ...updates };
    this.persist();
  }

  /** Record a live energy observation and refine peak hours. */
  recordEnergyObservation(hour: number, energy: number) {
    if (!this.store.userPattern.energyByHour[hour]) {
      this.store.userPattern.energyByHour[hour] = [];
    }
    this.store.userPattern.energyByHour[hour].push(energy);
    // Keep last 30 readings per hour slot
    if (this.store.userPattern.energyByHour[hour].length > 30) {
      this.store.userPattern.energyByHour[hour].shift();
    }
    this.recalculatePeakHours();
    this.persist();
  }

  private recalculatePeakHours() {
    const hourAvgs = Object.entries(this.store.userPattern.energyByHour)
      .filter(([, readings]) => readings.length >= 3)
      .map(([hour, readings]) => ({
        hour: parseInt(hour),
        avg: readings.reduce((a, b) => a + b, 0) / readings.length,
      }));

    if (hourAvgs.length >= 3) {
      this.store.userPattern.peakHours = hourAvgs
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 4)
        .map(h => h.hour)
        .sort((a, b) => a - b);
    }
  }

  /** Update how often a nudge type leads to action (EMA). */
  recordNudgeResponse(nudgeType: string, acted: boolean) {
    const prev = this.store.userPattern.nudgeResponseRates[nudgeType] ?? 0.5;
    this.store.userPattern.nudgeResponseRates[nudgeType] = prev * 0.8 + (acted ? 1 : 0) * 0.2;
    this.persist();
  }

  getSessionCount(): number { return this.store.sessionCount; }
  getLastSeen(): number { return this.store.lastSeen; }

  // ── Conversation API ─────────────────────────────────────────────

  addMessage(msg: ConversationMessage) {
    this.store.conversationHistory.push(msg);
    this.persist();
  }

  getConversationHistory(limit = 100): ConversationMessage[] {
    return this.store.conversationHistory.slice(-limit);
  }

  clearConversation() {
    this.store.conversationHistory = [];
    this.persist();
  }

  // ── Daily Plan API ────────────────────────────────────────────────

  saveDailyPlan(plan: DailyPlan) {
    this.store.dailyPlans[plan.date] = plan;
    this.persist();
  }

  getTodayPlan(): DailyPlan | null {
    const today = new Date().toISOString().split('T')[0];
    return this.store.dailyPlans[today] || null;
  }

  markBlockComplete(date: string, blockId: string) {
    const plan = this.store.dailyPlans[date];
    if (plan) {
      plan.timeBlocks = plan.timeBlocks.map(b =>
        b.id === blockId ? { ...b, completed: true } : b
      );
      this.persist();
    }
  }
}

export const agentMemory = new AgentMemoryService();
