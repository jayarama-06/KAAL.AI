/**
 * KAAL AI Engine - Core Intelligence System
 * Hybrid architecture combining real-time client-side processing
 * with simulated background analysis
 */

export interface FocusState {
  level: number; // 0-100
  quality: 'deep' | 'moderate' | 'shallow' | 'distracted';
  duration: number; // minutes
  interruptions: number;
  flowScore: number; // 0-100
}

export interface EnergyPattern {
  current: number; // 0-100
  trend: 'rising' | 'stable' | 'declining';
  optimalHours: number[];
  forecast: number[];
  recommendations: string[];
}

export interface ContextSwitch {
  timestamp: number;
  from: string;
  to: string;
  cost: number; // cognitive load in minutes
  reason: 'user' | 'notification' | 'scheduled';
}

export interface AIInsight {
  id: string;
  type: 'nudge' | 'warning' | 'celebration' | 'suggestion';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  timestamp: number;
  dismissed: boolean;
}

export interface SessionAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  focusStates: FocusState[];
  contextSwitches: ContextSwitch[];
  energyLevels: number[];
  productivity: number; // 0-100
  flowMinutes: number;
  deepWorkMinutes: number;
}

class AIEngine {
  private focusHistory: FocusState[] = [];
  private energyHistory: number[] = [];
  private contextSwitchHistory: ContextSwitch[] = [];
  private currentSession: SessionAnalytics | null = null;
  private insights: AIInsight[] = [];
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Initialize AI Engine with user baseline data
   */
  initialize(userData?: {
    energyPattern?: number[];
    focusBaseline?: number;
    workStyle?: 'sprinter' | 'marathoner' | 'cyclic';
  }) {
    console.log('🧠 KAAL AI Engine initialized', userData);
    this.startBackgroundProcessing();
  }

  /**
   * Real-time focus state detection
   * Uses multiple signals to determine current focus quality
   */
  detectFocusState(signals: {
    activeTime: number;
    keystrokes?: number;
    mouseMovement?: number;
    appSwitches: number;
    notificationsSuppressed: boolean;
  }): FocusState {
    const { activeTime, appSwitches, notificationsSuppressed } = signals;

    // Calculate focus level using weighted factors
    let focusLevel = 100;
    
    // Penalize for app switches
    focusLevel -= appSwitches * 5;
    
    // Bonus for notifications suppressed
    if (notificationsSuppressed) focusLevel += 10;
    
    // Time-based adjustment (optimal focus is 45-90 min blocks)
    if (activeTime > 90) {
      focusLevel -= (activeTime - 90) * 0.5; // Fatigue penalty
    }
    
    focusLevel = Math.max(0, Math.min(100, focusLevel));

    // Determine quality tier
    let quality: FocusState['quality'];
    if (focusLevel >= 85) quality = 'deep';
    else if (focusLevel >= 60) quality = 'moderate';
    else if (focusLevel >= 35) quality = 'shallow';
    else quality = 'distracted';

    // Calculate flow score (sustained deep focus)
    const flowScore = this.calculateFlowScore(focusLevel, activeTime);

    const state: FocusState = {
      level: focusLevel,
      quality,
      duration: activeTime,
      interruptions: appSwitches,
      flowScore
    };

    this.focusHistory.push(state);
    this.emit('focus-state-changed', state);

    return state;
  }

  /**
   * Energy pattern analysis and forecasting
   */
  analyzeEnergyPattern(currentEnergy: number, timeOfDay: number): EnergyPattern {
    this.energyHistory.push(currentEnergy);
    
    // Keep last 30 days of data
    if (this.energyHistory.length > 30 * 24) {
      this.energyHistory.shift();
    }

    // Detect trend
    const recentLevels = this.energyHistory.slice(-5);
    const avgRecent = recentLevels.reduce((a, b) => a + b, 0) / recentLevels.length;
    const avgPrevious = this.energyHistory
      .slice(-10, -5)
      .reduce((a, b) => a + b, 0) / 5;

    let trend: EnergyPattern['trend'];
    if (avgRecent > avgPrevious + 5) trend = 'rising';
    else if (avgRecent < avgPrevious - 5) trend = 'declining';
    else trend = 'stable';

    // Identify optimal hours (when energy is typically high)
    const optimalHours = this.identifyOptimalHours();

    // Generate 6-hour forecast
    const forecast = this.forecastEnergy(currentEnergy, timeOfDay, 6);

    // Generate recommendations
    const recommendations = this.generateEnergyRecommendations(
      currentEnergy,
      trend,
      timeOfDay
    );

    return {
      current: currentEnergy,
      trend,
      optimalHours,
      forecast,
      recommendations
    };
  }

  /**
   * Intelligent nudge generation
   * Proactively suggests actions based on current state
   */
  generateNudge(context: {
    focusState: FocusState;
    sessionDuration: number;
    energyLevel: number;
    timeOfDay: number;
  }): AIInsight | null {
    const { focusState, sessionDuration, energyLevel, timeOfDay } = context;

    // Deep work celebration
    if (focusState.quality === 'deep' && sessionDuration >= 45) {
      return this.createInsight({
        type: 'celebration',
        priority: 'medium',
        title: '🔥 Deep Work Streak!',
        message: `You've maintained deep focus for ${sessionDuration} minutes. Keep going!`,
      });
    }

    // Break suggestion
    if (sessionDuration >= 90 && energyLevel < 50) {
      return this.createInsight({
        type: 'nudge',
        priority: 'high',
        title: '☕ Time for a Break',
        message: 'You\'ve been working for 90+ minutes. A 10-minute break will boost your next session.',
        action: {
          label: 'Start Break Timer',
          handler: () => console.log('Break timer started')
        }
      });
    }

    // Focus degradation warning
    if (focusState.quality === 'distracted' && sessionDuration >= 15) {
      return this.createInsight({
        type: 'warning',
        priority: 'high',
        title: '⚠️ Focus Slipping',
        message: 'Multiple context switches detected. Consider enabling Do Not Disturb mode.',
        action: {
          label: 'Enable Focus Mode',
          handler: () => console.log('Focus mode enabled')
        }
      });
    }

    // Optimal energy window
    const isOptimalHour = this.isOptimalEnergyHour(timeOfDay);
    if (isOptimalHour && energyLevel >= 80 && !this.currentSession) {
      return this.createInsight({
        type: 'suggestion',
        priority: 'medium',
        title: '✨ Peak Performance Window',
        message: 'Your energy is high right now. Perfect time to tackle your most challenging task.',
      });
    }

    return null;
  }

  /**
   * Context switch cost analysis
   */
  recordContextSwitch(from: string, to: string, reason: ContextSwitch['reason']): number {
    // Calculate cognitive cost based on switch type
    let cost = 5; // Base cost in minutes
    
    if (from.includes('deep-work') && reason === 'notification') {
      cost = 15; // High cost for interrupting deep work
    } else if (reason === 'scheduled') {
      cost = 3; // Lower cost for planned switches
    }

    const contextSwitch: ContextSwitch = {
      timestamp: Date.now(),
      from,
      to,
      cost,
      reason
    };

    this.contextSwitchHistory.push(contextSwitch);
    this.emit('context-switch', contextSwitch);

    return cost;
  }

  /**
   * Session analytics and insights
   */
  analyzeSession(sessionId: string): SessionAnalytics {
    const session = this.currentSession || this.createNewSession(sessionId);
    
    // Calculate metrics
    const totalFocusTime = session.focusStates
      .reduce((sum, state) => sum + state.duration, 0);
    
    const flowMinutes = session.focusStates
      .filter(state => state.quality === 'deep')
      .reduce((sum, state) => sum + state.duration, 0);
    
    const deepWorkMinutes = session.focusStates
      .filter(state => state.flowScore >= 80)
      .reduce((sum, state) => sum + state.duration, 0);

    // Calculate overall productivity score
    const productivity = this.calculateProductivityScore(session);

    return {
      ...session,
      flowMinutes,
      deepWorkMinutes,
      productivity
    };
  }

  /**
   * AI-powered task prioritization
   */
  prioritizeTasks(tasks: Array<{
    id: string;
    title: string;
    estimatedDuration: number;
    importance: number; // 1-5
    urgency: number; // 1-5
    energyRequired: number; // 1-5
  }>, currentEnergy: number, availableTime: number): Array<typeof tasks[0] & { score: number; reason: string }> {
    return tasks
      .map(task => {
        let score = 0;
        let reason = '';

        // Eisenhower matrix scoring
        score += task.importance * 20;
        score += task.urgency * 15;

        // Energy matching
        const energyMatch = this.calculateEnergyMatch(task.energyRequired, currentEnergy);
        score += energyMatch * 25;
        
        if (energyMatch > 80) {
          reason = 'Perfect energy match for this task right now';
        } else if (energyMatch < 40) {
          reason = 'Consider saving this for when you have more energy';
        }

        // Time feasibility
        if (task.estimatedDuration <= availableTime) {
          score += 20;
        } else {
          score -= 30;
          reason = 'Not enough time available in current session';
        }

        // Quick wins boost
        if (task.estimatedDuration <= 15 && task.importance >= 3) {
          score += 15;
          reason = 'Quick win opportunity - builds momentum';
        }

        return { ...task, score, reason };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Smart work/break recommendations using Pomodoro variants
   */
  recommendWorkPattern(energyLevel: number, focusHistory: FocusState[]): {
    pattern: string;
    workDuration: number;
    breakDuration: number;
    reasoning: string;
  } {
    const avgFocusQuality = focusHistory.length > 0
      ? focusHistory.reduce((sum, s) => sum + s.level, 0) / focusHistory.length
      : 75;

    if (energyLevel >= 80 && avgFocusQuality >= 75) {
      return {
        pattern: 'Extended Deep Work',
        workDuration: 90,
        breakDuration: 15,
        reasoning: 'High energy + strong focus history = optimal for deep work blocks'
      };
    } else if (energyLevel >= 60) {
      return {
        pattern: 'Classic Pomodoro',
        workDuration: 25,
        breakDuration: 5,
        reasoning: 'Good energy levels support traditional pomodoro rhythm'
      };
    } else {
      return {
        pattern: 'Micro Sessions',
        workDuration: 15,
        breakDuration: 5,
        reasoning: 'Lower energy - shorter bursts maintain quality over quantity'
      };
    }
  }

  /**
   * Event system for reactive updates
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  // Private helper methods
  private calculateFlowScore(focusLevel: number, duration: number): number {
    let score = focusLevel;
    
    // Flow state typically emerges after 15+ minutes of sustained focus
    if (duration >= 15 && focusLevel >= 80) {
      score += 10;
    }
    if (duration >= 45 && focusLevel >= 85) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  private identifyOptimalHours(): number[] {
    // Simulate ML pattern recognition
    // In production, this would analyze historical energy data
    return [9, 10, 11, 14, 15, 16]; // Default to common peak hours
  }

  private forecastEnergy(current: number, hour: number, hoursAhead: number): number[] {
    const forecast: number[] = [];
    
    // Simplified energy curve (peaks mid-morning and mid-afternoon)
    for (let i = 0; i < hoursAhead; i++) {
      const futureHour = (hour + i) % 24;
      let energy = current;
      
      // Morning peak
      if (futureHour >= 9 && futureHour <= 11) {
        energy = Math.min(100, current + 15);
      }
      // Afternoon dip
      else if (futureHour >= 13 && futureHour <= 15) {
        energy = Math.max(40, current - 20);
      }
      // Evening decline
      else if (futureHour >= 18) {
        energy = Math.max(30, current - 30);
      }
      
      forecast.push(Math.round(energy));
    }
    
    return forecast;
  }

  private generateEnergyRecommendations(
    energy: number,
    trend: EnergyPattern['trend'],
    hour: number
  ): string[] {
    const recommendations: string[] = [];

    if (energy < 40) {
      recommendations.push('Take a 10-minute walk to boost energy');
      recommendations.push('Consider a power nap (15-20 min)');
    } else if (energy > 80) {
      recommendations.push('Tackle your most challenging task now');
      recommendations.push('This is prime time for creative work');
    }

    if (trend === 'declining' && hour < 20) {
      recommendations.push('Schedule a break before energy drops further');
    }

    return recommendations;
  }

  private createInsight(params: Omit<AIInsight, 'id' | 'timestamp' | 'dismissed'>): AIInsight {
    const insight: AIInsight = {
      ...params,
      id: `insight-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      dismissed: false
    };

    this.insights.push(insight);
    this.emit('insight-generated', insight);

    return insight;
  }

  private isOptimalEnergyHour(hour: number): boolean {
    const optimalHours = this.identifyOptimalHours();
    return optimalHours.includes(hour);
  }

  private createNewSession(sessionId: string): SessionAnalytics {
    const session: SessionAnalytics = {
      sessionId,
      startTime: Date.now(),
      focusStates: [],
      contextSwitches: [],
      energyLevels: [],
      productivity: 0,
      flowMinutes: 0,
      deepWorkMinutes: 0
    };

    this.currentSession = session;
    return session;
  }

  private calculateProductivityScore(session: SessionAnalytics): number {
    if (session.focusStates.length === 0) return 0;

    const avgFocus = session.focusStates
      .reduce((sum, state) => sum + state.level, 0) / session.focusStates.length;
    
    const contextSwitchPenalty = Math.min(30, session.contextSwitches.length * 5);
    
    const flowBonus = Math.min(20, session.flowMinutes * 0.5);

    return Math.round(avgFocus - contextSwitchPenalty + flowBonus);
  }

  private calculateEnergyMatch(required: number, current: number): number {
    // Convert 1-5 scale to percentage
    const requiredEnergy = (required / 5) * 100;
    const diff = Math.abs(requiredEnergy - current);
    
    return Math.max(0, 100 - diff);
  }

  private startBackgroundProcessing() {
    // Simulates background AI analysis
    console.log('🤖 Background AI processing started');
    // In production, this would handle:
    // - Pattern recognition
    // - Predictive modeling
    // - Long-term trend analysis
  }

  /**
   * Get current insights
   */
  getInsights(filter?: { type?: AIInsight['type']; dismissed?: boolean }): AIInsight[] {
    let filtered = this.insights;

    if (filter?.type) {
      filtered = filtered.filter(i => i.type === filter.type);
    }

    if (filter?.dismissed !== undefined) {
      filtered = filtered.filter(i => i.dismissed === filter.dismissed);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Dismiss an insight
   */
  dismissInsight(id: string) {
    const insight = this.insights.find(i => i.id === id);
    if (insight) {
      insight.dismissed = true;
      this.emit('insight-dismissed', insight);
    }
  }
}

// Singleton instance
export const aiEngine = new AIEngine();
