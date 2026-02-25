/**
 * Gemini AI Integration Service
 * Optional AI enhancement for deep insights and personalized recommendations
 * Falls back to heuristics if no API key is provided
 */

export interface GeminiConfig {
  apiKey?: string;
  enabled: boolean;
  model?: string;
}

interface SessionContext {
  focusHistory: Array<{ level: number; quality: string; duration: number }>;
  energyHistory: number[];
  contextSwitches: number;
  taskHistory: Array<{ title: string; completed: boolean; duration: number }>;
  timeOfDay: number;
  dayOfWeek: number;
}

interface AIResponse {
  insights: string[];
  recommendations: string[];
  focusPrediction: number;
  energyForecast: number[];
  suggestedBreakTime?: number;
  taskPrioritization?: Array<{ taskId: string; reason: string }>;
}

class GeminiService {
  private config: GeminiConfig = {
    enabled: false,
    model: 'gemini-2.0-flash-exp'
  };
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastAPICall = 0;
  private MIN_API_INTERVAL = 15 * 60 * 1000; // 15 minutes minimum between API calls

  /**
   * Initialize Gemini service with API key
   */
  initialize(apiKey?: string) {
    this.config.apiKey = apiKey;
    this.config.enabled = !!apiKey;
    
    if (this.config.enabled) {
      console.log('🤖 Gemini AI service enabled');
    } else {
      console.log('💡 Running in heuristic mode (no API key provided)');
    }
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * Generate deep insights using Gemini AI
   * Only called at strategic moments, not continuously
   */
  async generateDeepInsights(context: SessionContext): Promise<AIResponse> {
    // Rate limiting - prevent excessive API calls
    const now = Date.now();
    if (now - this.lastAPICall < this.MIN_API_INTERVAL) {
      console.log('⏳ API rate limit - using cached insights');
      return this.generateHeuristicInsights(context);
    }

    if (!this.isAvailable()) {
      return this.generateHeuristicInsights(context);
    }

    try {
      this.lastAPICall = now;
      
      // Construct prompt for Gemini
      const prompt = this.buildContextPrompt(context);
      
      // Call Gemini API
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseGeminiResponse(response);
    } catch (error) {
      console.warn('Gemini API error, falling back to heuristics:', error);
      return this.generateHeuristicInsights(context);
    }
  }

  /**
   * Quick AI nudge for immediate feedback
   * Uses lightweight heuristics, not API
   */
  generateQuickNudge(focusLevel: number, energyLevel: number, sessionDuration: number): string | null {
    // Pure heuristic - no API call needed
    if (sessionDuration >= 90 && energyLevel < 50) {
      return '☕ You\'ve been working for 90+ minutes with declining energy. Time for a break!';
    }

    if (focusLevel < 40 && sessionDuration >= 15) {
      return '🎯 Focus is slipping. Try enabling Do Not Disturb or switching tasks.';
    }

    if (focusLevel >= 85 && sessionDuration >= 45) {
      return '🔥 You\'re in deep flow! This is peak productivity time.';
    }

    return null;
  }

  /**
   * Analyze patterns and suggest optimal work schedule
   * Called once per day or on-demand, not continuously
   */
  async analyzeWorkPatterns(historicalData: {
    sessions: Array<{
      date: string;
      duration: number;
      productivity: number;
      energyLevels: number[];
      focusQuality: number;
    }>;
  }): Promise<{
    peakHours: number[];
    optimalSessionLength: number;
    recommendedBreakPattern: string;
    insights: string[];
  }> {
    if (!this.isAvailable()) {
      // Heuristic analysis
      return this.analyzeWorkPatternsHeuristic(historicalData);
    }

    try {
      const prompt = `Analyze this user's work patterns over the past week and provide personalized productivity insights:

Sessions: ${JSON.stringify(historicalData.sessions, null, 2)}

Please provide:
1. Peak productivity hours (array of hours 0-23)
2. Optimal session length in minutes
3. Recommended break pattern (e.g., "25/5 Pomodoro" or "90/15 Ultradian")
4. 3-5 actionable insights based on patterns

Format as JSON.`;

      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.warn('Pattern analysis failed, using heuristics:', error);
      return this.analyzeWorkPatternsHeuristic(historicalData);
    }
  }

  /**
   * Private: Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('No API key configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Private: Build context-aware prompt
   */
  private buildContextPrompt(context: SessionContext): string {
    return `You are KAAL, an AI executive function assistant. Analyze this work session and provide insights:

Current Context:
- Time: ${new Date().toLocaleTimeString()}
- Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.dayOfWeek]}
- Recent Focus Levels: ${context.focusHistory.map(f => f.level).join(', ')}
- Recent Energy Levels: ${context.energyHistory.join(', ')}
- Context Switches: ${context.contextSwitches}

Based on this data, provide:
1. 2-3 actionable insights about their current work patterns
2. 2-3 specific recommendations for improving focus/energy
3. Predicted focus level for next hour (0-100)
4. 6-hour energy forecast (array of 6 numbers, 0-100)
5. Suggested break time in minutes (if applicable)

Format as JSON with keys: insights (array), recommendations (array), focusPrediction (number), energyForecast (array), suggestedBreakTime (number or null).`;
  }

  /**
   * Private: Parse Gemini response
   */
  private parseGeminiResponse(response: string): AIResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse Gemini response:', error);
    }

    // Fallback
    return {
      insights: ['AI analysis in progress...'],
      recommendations: ['Continue your current work pattern'],
      focusPrediction: 75,
      energyForecast: [75, 70, 65, 70, 75, 80]
    };
  }

  /**
   * Private: Heuristic-based insights (no API needed)
   */
  private generateHeuristicInsights(context: SessionContext): AIResponse {
    const avgFocus = context.focusHistory.length > 0
      ? context.focusHistory.reduce((sum, f) => sum + f.level, 0) / context.focusHistory.length
      : 75;

    const avgEnergy = context.energyHistory.length > 0
      ? context.energyHistory.reduce((sum, e) => sum + e, 0) / context.energyHistory.length
      : 75;

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Pattern detection
    if (avgFocus < 60) {
      insights.push('Your focus has been below optimal levels this session');
      recommendations.push('Try enabling Do Not Disturb mode and closing unnecessary apps');
    }

    if (avgEnergy < 50) {
      insights.push('Energy levels are declining - this is normal for extended sessions');
      recommendations.push('Take a 10-15 minute break to recharge');
    }

    if (context.contextSwitches > 10) {
      insights.push('High number of context switches detected - this fragments focus');
      recommendations.push('Block specific time for single-task deep work');
    }

    // Time-based recommendations
    const hour = context.timeOfDay;
    if (hour >= 14 && hour <= 16 && avgEnergy < 60) {
      recommendations.push('Afternoon energy dip detected - perfect time for routine tasks, not creative work');
    }

    if (insights.length === 0) {
      insights.push('You\'re maintaining good focus and energy levels');
      recommendations.push('Keep up the current work pattern');
    }

    // Simple forecasting
    const energyForecast = this.forecastEnergy(avgEnergy, hour);

    return {
      insights,
      recommendations,
      focusPrediction: Math.max(50, avgFocus - 5), // Slight decline prediction
      energyForecast,
      suggestedBreakTime: avgEnergy < 50 ? 15 : null
    };
  }

  /**
   * Private: Heuristic work pattern analysis
   */
  private analyzeWorkPatternsHeuristic(data: any): any {
    // Simple statistical analysis
    const sessions = data.sessions || [];
    
    // Find peak hours by averaging productivity by hour
    const hourlyProductivity: { [hour: number]: number[] } = {};
    sessions.forEach((session: any) => {
      const hour = new Date(session.date).getHours();
      if (!hourlyProductivity[hour]) hourlyProductivity[hour] = [];
      hourlyProductivity[hour].push(session.productivity);
    });

    const peakHours = Object.entries(hourlyProductivity)
      .map(([hour, prods]) => ({
        hour: parseInt(hour),
        avg: prods.reduce((a, b) => a + b, 0) / prods.length
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4)
      .map(h => h.hour)
      .sort();

    // Calculate average session duration
    const avgDuration = sessions.length > 0
      ? sessions.reduce((sum: number, s: any) => sum + s.duration, 0) / sessions.length
      : 90;

    return {
      peakHours: peakHours.length > 0 ? peakHours : [9, 10, 14, 15],
      optimalSessionLength: Math.round(avgDuration),
      recommendedBreakPattern: avgDuration > 60 ? '90/15 Ultradian' : '25/5 Pomodoro',
      insights: [
        `Your most productive hours are typically ${peakHours.join(', ')}:00`,
        `Average session length is ${Math.round(avgDuration)} minutes`,
        'Consider scheduling demanding tasks during your peak hours'
      ]
    };
  }

  /**
   * Private: Simple energy forecasting
   */
  private forecastEnergy(current: number, hour: number): number[] {
    const forecast: number[] = [];
    
    for (let i = 0; i < 6; i++) {
      const futureHour = (hour + i) % 24;
      let energy = current;
      
      // Morning peak (9-11)
      if (futureHour >= 9 && futureHour <= 11) {
        energy = Math.min(100, current + 15);
      }
      // Afternoon dip (14-16)
      else if (futureHour >= 14 && futureHour <= 16) {
        energy = Math.max(40, current - 20);
      }
      // Evening decline (18+)
      else if (futureHour >= 18) {
        energy = Math.max(30, current - 30);
      }
      
      forecast.push(Math.round(energy));
    }
    
    return forecast;
  }
}

// Singleton instance
export const geminiService = new GeminiService();
