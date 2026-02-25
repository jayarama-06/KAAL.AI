/**
 * Context-Aware AI Service for KAAL
 * This is your BILLION-DOLLAR MOAT - Proactive AI that knows user state
 * 
 * Integrates:
 * - User energy/mood/context from check-ins
 * - Task data and priorities
 * - Time patterns and historical performance
 * - Gemini API for intelligent recommendations
 */

import { supabase } from './supabase-client';
import { Task } from './task-service';

export interface UserContext {
  energyLevel: number; // 1-5
  mood: string;
  mentalClarity: number; // 1-5
  physicalState?: string;
  location?: string;
  environmentNoise?: string;
  timeAvailable?: number;
  timestamp: Date;
}

export interface TaskRecommendation {
  task: Task;
  score: number; // 0-100
  reasoning: string;
  confidence: number; // 0-100
  suggestedDuration: number; // minutes
  energyMatch: number; // 0-100
}

export interface ProactiveNudge {
  id: string;
  type: 'nudge' | 'warning' | 'celebration' | 'suggestion' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: string;
  actionData?: any;
  timestamp: Date;
}

export interface AIInsights {
  recommendations: TaskRecommendation[];
  nudges: ProactiveNudge[];
  optimalWorkPattern: {
    pattern: string;
    workDuration: number;
    breakDuration: number;
    reasoning: string;
  };
  energyForecast: {
    nextHours: Array<{ hour: number; predictedEnergy: number }>;
    peakWindows: Array<{ start: number; end: number; reason: string }>;
  };
  productivityInsights: {
    bestTimeForDeepWork: string;
    taskTypeRecommendation: string[];
    avoidRecommendation: string[];
  };
}

class ContextAIService {
  private cachedContext: UserContext | null = null;
  private lastContextUpdate: Date | null = null;
  private readonly CONTEXT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current user context (cached or fresh)
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    // Return cached if fresh
    if (
      this.cachedContext &&
      this.lastContextUpdate &&
      Date.now() - this.lastContextUpdate.getTime() < this.CONTEXT_CACHE_DURATION
    ) {
      return this.cachedContext;
    }

    // Fetch latest state
    const { data, error } = await supabase
      .from('user_states')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('No recent user state found');
      return null;
    }

    this.cachedContext = {
      energyLevel: data.energy_level,
      mood: data.mood,
      mentalClarity: data.mental_clarity,
      physicalState: data.physical_state,
      location: data.location,
      environmentNoise: data.environment_noise,
      timeAvailable: data.time_available,
      timestamp: new Date(data.created_at),
    };
    this.lastContextUpdate = new Date();

    return this.cachedContext;
  }

  /**
   * Analyze tasks and provide intelligent recommendations based on context
   */
  async getTaskRecommendations(
    userId: string,
    tasks: Task[],
    context?: UserContext
  ): Promise<TaskRecommendation[]> {
    // Get current context
    const userContext = context || (await this.getUserContext(userId));
    if (!userContext) {
      // Fallback to basic prioritization
      return this.basicTaskPrioritization(tasks);
    }

    // Filter available tasks
    const availableTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'archived'
    );

    // Score each task
    const recommendations = availableTasks.map((task) => {
      const scores = this.calculateTaskScore(task, userContext);
      return {
        task,
        ...scores,
      };
    });

    // Sort by score
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate comprehensive task score based on multiple factors
   */
  private calculateTaskScore(
    task: Task,
    context: UserContext
  ): Omit<TaskRecommendation, 'task'> {
    let score = 50; // Base score
    let reasoning: string[] = [];
    let confidence = 70;

    // 1. Energy Matching (30 points max)
    const energyRequired = this.estimateTaskEnergy(task);
    const energyMatch = this.calculateEnergyMatch(energyRequired, context.energyLevel);
    score += (energyMatch / 100) * 30;
    
    if (energyMatch > 80) {
      reasoning.push(`Perfect energy match - you have ${context.energyLevel}/5 energy and this task requires ${energyRequired}/5`);
      confidence += 10;
    } else if (energyMatch < 40) {
      reasoning.push(`Energy mismatch - consider this task when you have ${energyRequired > 3 ? 'more' : 'less'} energy`);
      confidence -= 10;
    }

    // 2. Priority & Urgency (25 points max)
    if (task.priority === 'urgent' || task.priority === 'high') {
      score += 25;
      reasoning.push('High priority task');
    } else if (task.priority === 'medium') {
      score += 15;
    } else {
      score += 5;
    }

    // 3. Time Feasibility (20 points max)
    const estimatedTime = task.estimatedMinutes || 30;
    if (context.timeAvailable && estimatedTime <= context.timeAvailable) {
      score += 20;
      reasoning.push(`Can complete in available time (${estimatedTime}min available)`);
    } else if (context.timeAvailable && estimatedTime > context.timeAvailable) {
      score -= 15;
      reasoning.push('Not enough time for completion');
      confidence -= 15;
    }

    // 4. Mental Clarity Match (15 points max)
    const clarityRequired = this.estimateRequiredClarity(task);
    if (context.mentalClarity >= clarityRequired) {
      score += 15;
      if (context.mentalClarity >= 4 && clarityRequired >= 4) {
        reasoning.push('Great mental clarity for this complex task');
        confidence += 10;
      }
    } else {
      score -= 10;
      reasoning.push('Requires sharper mental clarity');
    }

    // 5. Mood Matching (10 points max)
    const moodBoost = this.getMoodTaskMatch(context.mood, task);
    score += moodBoost;
    if (moodBoost > 5) {
      reasoning.push('Your current mood is ideal for this task');
    }

    // 6. Quick Win Bonus
    if (estimatedTime <= 15 && (task.priority === 'high' || task.priority === 'urgent')) {
      score += 10;
      reasoning.push('Quick win - builds momentum!');
    }

    // 7. Environment Matching
    if (context.environmentNoise && context.location) {
      const envScore = this.getEnvironmentMatch(context, task);
      score += envScore;
      if (envScore < 0) {
        reasoning.push('Environment not ideal for this task type');
      }
    }

    // Calculate suggested duration
    const suggestedDuration = this.calculateOptimalDuration(
      task,
      context.energyLevel,
      estimatedTime
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning: reasoning.join('. ') + '.',
      confidence: Math.max(0, Math.min(100, confidence)),
      suggestedDuration,
      energyMatch,
    };
  }

  /**
   * Generate proactive nudges based on user context
   */
  async generateProactiveNudges(
    userId: string,
    context: UserContext,
    tasks: Task[]
  ): Promise<ProactiveNudge[]> {
    // Nudges disabled - only show when explicitly needed
    // This prevents mock/unnecessary nudge messages across the website
    return [];
    
    /* ORIGINAL NUDGE LOGIC - DISABLED
    const nudges: ProactiveNudge[] = [];
    const now = new Date();

    // 1. Low Energy Warning
    if (context.energyLevel <= 2 && context.timeAvailable && context.timeAvailable > 30) {
      nudges.push({
        id: `nudge-${Date.now()}-1`,
        type: 'warning',
        priority: 'high',
        title: '☕ Low Energy Detected',
        message: 'Your energy is at 2/5. Consider a 10-minute break or switch to lighter tasks.',
        actionLabel: 'Show Easy Tasks',
        actionType: 'filter_easy_tasks',
        timestamp: now,
      });
    }

    // 2. Peak Performance Window
    if (context.energyLevel >= 4 && context.mentalClarity >= 4) {
      const hardTasks = tasks.filter(
        (t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed'
      );
      if (hardTasks.length > 0) {
        nudges.push({
          id: `nudge-${Date.now()}-2`,
          type: 'suggestion',
          priority: 'high',
          title: '✨ Peak Performance Window!',
          message: `You're at ${context.energyLevel}/5 energy and ${context.mentalClarity}/5 clarity. Perfect time for your most challenging work!`,
          actionLabel: 'Show Top Priority Tasks',
          actionType: 'show_hard_tasks',
          timestamp: now,
        });
      }
    }

    // 3. Overwhelmed State
    if (context.mood === 'overwhelmed' || context.mood === 'anxious') {
      const quickWins = tasks.filter(
        (t) => t.estimatedMinutes && t.estimatedMinutes <= 15 && t.status !== 'completed'
      );
      if (quickWins.length > 0) {
        nudges.push({
          id: `nudge-${Date.now()}-3`,
          type: 'nudge',
          priority: 'medium',
          title: '🎯 Start Small',
          message: `Feeling ${context.mood}? Try a quick 15-minute task to build momentum.`,
          actionLabel: 'Show Quick Wins',
          actionType: 'show_quick_wins',
          timestamp: now,
        });
      }
    }

    // 4. Celebration for High Productivity
    if (context.mood === 'motivated' || context.mood === 'energized') {
      nudges.push({
        id: `nudge-${Date.now()}-4`,
        type: 'celebration',
        priority: 'low',
        title: '🔥 You\'re on Fire!',
        message: 'Your energy and motivation are high - make the most of this productive state!',
        timestamp: now,
      });
    }

    // 5. Environment Mismatch
    if (context.environmentNoise === 'noisy' && context.location !== 'cafe') {
      const focusTasks = tasks.filter(
        (t) => t.estimatedMinutes && t.estimatedMinutes > 30 && t.status !== 'completed'
      );
      if (focusTasks.length > 0) {
        nudges.push({
          id: `nudge-${Date.now()}-5`,
          type: 'suggestion',
          priority: 'medium',
          title: '🔊 Noisy Environment',
          message: 'Current noise level may affect focus. Consider noise-canceling or switching to shorter tasks.',
          actionLabel: 'Show Short Tasks',
          actionType: 'filter_short_tasks',
          timestamp: now,
        });
      }
    }

    // Save nudges to database
    await this.saveNudges(userId, nudges);

    return nudges;
    */
  }

  /**
   * Get comprehensive AI insights
   */
  async getAIInsights(userId: string, tasks: Task[]): Promise<AIInsights> {
    const context = await this.getUserContext(userId);
    if (!context) {
      return this.getFallbackInsights(tasks);
    }

    // Get recommendations
    const recommendations = await this.getTaskRecommendations(userId, tasks, context);

    // Generate nudges
    const nudges = await this.generateProactiveNudges(userId, context, tasks);

    // Get optimal work pattern
    const optimalWorkPattern = this.recommendWorkPattern(context);

    // Get energy patterns
    const energyPatterns = await this.getEnergyPatterns(userId);
    const energyForecast = this.forecastEnergy(context, energyPatterns);

    // Generate productivity insights
    const productivityInsights = this.generateProductivityInsights(context, energyPatterns);

    return {
      recommendations,
      nudges,
      optimalWorkPattern,
      energyForecast,
      productivityInsights,
    };
  }

  // Helper Methods

  private estimateTaskEnergy(task: Task): number {
    // Estimate 1-5 energy required
    let energy = 3; // Default

    // Priority affects energy
    if (task.priority === 'urgent') energy = 4;
    else if (task.priority === 'high') energy = 4;
    else if (task.priority === 'medium') energy = 3;
    else energy = 2;

    // Duration affects energy
    if (task.estimatedMinutes && task.estimatedMinutes > 60) energy = Math.min(5, energy + 1);

    return energy;
  }

  private calculateEnergyMatch(required: number, current: number): number {
    const diff = Math.abs(required - current);
    return Math.max(0, 100 - diff * 25);
  }

  private estimateRequiredClarity(task: Task): number {
    // Estimate mental clarity needed (1-5)
    if (task.priority === 'urgent' || task.priority === 'high') return 4;
    if (task.estimatedMinutes && task.estimatedMinutes > 60) return 4;
    return 3;
  }

  private getMoodTaskMatch(mood: string, task: Task): number {
    // Mood-task matching logic
    switch (mood) {
      case 'energized':
      case 'motivated':
        return task.priority === 'urgent' || task.priority === 'high' ? 10 : 5;
      case 'focused':
        return task.estimatedMinutes && task.estimatedMinutes > 30 ? 10 : 5;
      case 'calm':
        return 5;
      case 'tired':
        return task.estimatedMinutes && task.estimatedMinutes <= 20 ? 5 : -5;
      case 'stressed':
      case 'overwhelmed':
      case 'anxious':
        return task.estimatedMinutes && task.estimatedMinutes <= 15 ? 8 : -10;
      default:
        return 0;
    }
  }

  private getEnvironmentMatch(context: UserContext, task: Task): number {
    const estimatedTime = task.estimatedMinutes || 30;

    // Noisy environment penalty for long tasks
    if (context.environmentNoise === 'noisy' && estimatedTime > 30) {
      return -5;
    }

    // Silent/quiet bonus for deep work
    if (
      (context.environmentNoise === 'silent' || context.environmentNoise === 'quiet') &&
      estimatedTime > 45
    ) {
      return 5;
    }

    return 0;
  }

  private calculateOptimalDuration(task: Task, energyLevel: number, estimatedTime: number): number {
    // Adjust duration based on energy
    if (energyLevel >= 4) {
      return Math.min(90, estimatedTime);
    } else if (energyLevel === 3) {
      return Math.min(45, estimatedTime);
    } else {
      return Math.min(25, estimatedTime);
    }
  }

  private recommendWorkPattern(context: UserContext): AIInsights['optimalWorkPattern'] {
    if (context.energyLevel >= 4 && context.mentalClarity >= 4) {
      return {
        pattern: 'Extended Deep Work',
        workDuration: 90,
        breakDuration: 15,
        reasoning: 'High energy + sharp focus = optimal for 90-minute deep work blocks',
      };
    } else if (context.energyLevel >= 3) {
      return {
        pattern: 'Classic Pomodoro',
        workDuration: 25,
        breakDuration: 5,
        reasoning: 'Good energy supports traditional 25-minute pomodoros',
      };
    } else {
      return {
        pattern: 'Micro Sessions',
        workDuration: 15,
        breakDuration: 5,
        reasoning: 'Lower energy - shorter bursts maintain quality',
      };
    }
  }

  private async getEnergyPatterns(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('energy_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('avg_energy_level', { ascending: false });

    return data || [];
  }

  private forecastEnergy(context: UserContext, patterns: any[]): AIInsights['energyForecast'] {
    const currentHour = new Date().getHours();
    const nextHours = [];
    const peakWindows = [];

    // Simple forecast based on patterns
    for (let i = 0; i < 6; i++) {
      const hour = (currentHour + i) % 24;
      const pattern = patterns.find((p) => p.hour_of_day === hour);
      const predictedEnergy = pattern ? pattern.avg_energy_level : context.energyLevel;

      nextHours.push({ hour, predictedEnergy });

      if (predictedEnergy >= 4) {
        peakWindows.push({
          start: hour,
          end: hour + 1,
          reason: 'Historically high energy at this time',
        });
      }
    }

    return { nextHours, peakWindows };
  }

  private generateProductivityInsights(
    context: UserContext,
    patterns: any[]
  ): AIInsights['productivityInsights'] {
    const topPatterns = patterns.slice(0, 3);
    const bestTime =
      topPatterns.length > 0
        ? `${topPatterns[0].hour_of_day}:00 - ${topPatterns[0].hour_of_day + 1}:00`
        : 'Morning hours';

    const taskTypeRecommendation = [];
    const avoidRecommendation = [];

    if (context.energyLevel >= 4) {
      taskTypeRecommendation.push('Creative work', 'Complex problem-solving', 'Strategic planning');
    } else if (context.energyLevel >= 3) {
      taskTypeRecommendation.push('Routine tasks', 'Email responses', 'Documentation');
    } else {
      taskTypeRecommendation.push('Light admin work', 'Planning', 'Research');
      avoidRecommendation.push('Complex analysis', 'Important decisions');
    }

    if (context.mood === 'stressed' || context.mood === 'overwhelmed') {
      avoidRecommendation.push('High-stakes tasks', 'Creative brainstorming');
    }

    return {
      bestTimeForDeepWork: bestTime,
      taskTypeRecommendation,
      avoidRecommendation,
    };
  }

  private basicTaskPrioritization(tasks: Task[]): TaskRecommendation[] {
    return tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'archived')
      .map((task) => ({
        task,
        score: task.priority === 'urgent' ? 90 : task.priority === 'high' ? 70 : 50,
        reasoning: 'Based on priority only (no context available)',
        confidence: 50,
        suggestedDuration: task.estimatedMinutes || 30,
        energyMatch: 50,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private getFallbackInsights(tasks: Task[]): AIInsights {
    return {
      recommendations: this.basicTaskPrioritization(tasks),
      nudges: [],
      optimalWorkPattern: {
        pattern: 'Classic Pomodoro',
        workDuration: 25,
        breakDuration: 5,
        reasoning: 'Default work pattern',
      },
      energyForecast: {
        nextHours: [],
        peakWindows: [],
      },
      productivityInsights: {
        bestTimeForDeepWork: 'Morning hours',
        taskTypeRecommendation: ['Start with high-priority tasks'],
        avoidRecommendation: [],
      },
    };
  }

  private async saveNudges(userId: string, nudges: ProactiveNudge[]) {
    if (nudges.length === 0) return;

    const inserts = nudges.map((nudge) => ({
      user_id: userId,
      type: nudge.type,
      priority: nudge.priority,
      title: nudge.title,
      message: nudge.message,
      action_label: nudge.actionLabel,
      action_type: nudge.actionType,
      action_data: nudge.actionData,
    }));

    await supabase.from('ai_insights').insert(inserts);
  }

  /**
   * Clear context cache (call after new check-in)
   */
  clearCache() {
    this.cachedContext = null;
    this.lastContextUpdate = null;
  }
}

export const contextAI = new ContextAIService();