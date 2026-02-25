/**
 * Secure Gemini Service - Centralized API Key
 * All users share one backend API key configured in Supabase
 * Zero configuration needed from users
 */

import { supabase } from './supabase-client';

export interface GeminiConfig {
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

class GeminiServiceSecure {
  private config: GeminiConfig = {
    enabled: true, // Always enabled - backend handles the key
    model: 'gemini-2.0-flash-exp'
  };
  private lastAPICall = 0;
  private MIN_API_INTERVAL = 15 * 60 * 1000; // 15 minutes minimum between API calls

  /**
   * Initialize Gemini service - AI is always ready!
   */
  async initialize() {
    console.log('🤖 Gemini AI service enabled (centralized backend key)');
    this.config.enabled = true;
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable(): boolean {
    return this.config.enabled;
  }

  /**
   * Generate deep insights using Gemini AI via secure Edge Function
   * Only called at strategic moments, not continuously
   */
  async generateDeepInsights(context: SessionContext): Promise<AIResponse> {
    // Rate limiting - prevent excessive API calls
    const now = Date.now();
    if (now - this.lastAPICall < this.MIN_API_INTERVAL) {
      console.log('⏳ API rate limit - using cached insights');
      return this.generateHeuristicInsights(context);
    }

    try {
      this.lastAPICall = now;
      
      // Construct prompt for Gemini
      const prompt = this.buildContextPrompt(context);
      
      // Call Gemini API via secure Edge Function
      const response = await this.callGeminiSecure(prompt);
      
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
    try {
      const prompt = `Analyze this user's work patterns over the past week and provide personalized productivity insights:

Sessions: ${JSON.stringify(historicalData.sessions, null, 2)}

Please provide:
1. Peak productivity hours (array of hours 0-23)
2. Optimal session length in minutes
3. Recommended break pattern (e.g., "25/5 Pomodoro" or "90/15 Ultradian")
4. 3-5 actionable insights based on patterns

Format as JSON.`;

      const response = await this.callGeminiSecure(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.warn('Pattern analysis failed, using heuristics:', error);
      return this.analyzeWorkPatternsHeuristic(historicalData);
    }
  }

  /**
   * Chat with KAAL — the primary method for powering agent chat responses.
   * Sends the full user context + conversation history to Gemini and gets
   * a KAAL-style response back.
   *
   * Falls back gracefully if Supabase not connected or rate-limited.
   */
  async chatWithKAAL(params: {
    userText: string;
    context: {
      tasks: Array<{ title: string; priority: string; status: string; dueDate?: string | null; estimatedMinutes?: number }>;
      energyLevel: number;
      todayFocusMinutes: number;
      streakDays: number;
      hour: number;
      continuousWorkMin: number;
      completedToday: number;
      overdueCount: number;
    };
    precomputedSignals: Array<{ label: string; weight: number; detail: string }>;
    recommendedAction: string;
    conversationHistory: Array<{ role: 'user' | 'kaal'; text: string }>;
  }): Promise<{
    text: string;
    emotion: 'encouraging' | 'coaching' | 'celebrating' | 'warning' | 'neutral';
    suggestions: string[];
    poweredByGemini: boolean;
  } | null> {
    try {
      const prompt = this.buildChatPrompt(params);
      const raw = await this.callGeminiAny(prompt);
      return this.parseChatResponse(raw);
    } catch (err) {
      // Silently return null so the brain falls back to heuristics
      return null;
    }
  }

  /**
   * Private: Call Gemini via Edge Function first, then VITE_GEMINI_API_KEY fallback.
   *
   * Edge function architecture (centralized key — no user setup needed):
   *   POST { prompt }  →  uses GEMINI_API_KEY Supabase secret server-side
   *   Requires the user to be signed in (JWT auto-attached by supabase.functions.invoke).
   */
  lastCallDiagnostic: { path: 'edge' | 'direct' | 'none'; error?: string } = { path: 'none' };

  private async callGeminiAny(prompt: string): Promise<string> {
    // ─────────────────────────────────────────────────────────────────
    // PATH 1 — Supabase Edge Function (centralized GEMINI_API_KEY secret)
    // JWT is auto-attached when the user is signed in.
    // ─────────────────────────────────────────────────────────────────
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { prompt }
      });

      if (false) { // debug mode removed — no import.meta.env in Figma Make
        console.log('[KAAL/edge] data=', data, 'error=', error);
      }

      if (!error && data?.success && typeof data.response === 'string' && data.response.length > 0) {
        this.lastCallDiagnostic = { path: 'edge' };
        return data.response;
      }

      // Server secret not configured yet (admin needs to set GEMINI_API_KEY)
      if (data?.notConfigured) {
        this.lastCallDiagnostic = { path: 'none', error: 'notConfigured' };
        throw new Error('notConfigured');
      }

      // Auth error — user is not signed in
      const isAuthErr =
        error?.message?.includes('401') ||
        String(data?.error ?? '').toLowerCase().includes('unauthorized');
      if (isAuthErr) {
        this.lastCallDiagnostic = { path: 'none', error: 'notAuthenticated' };
        throw new Error('notAuthenticated');
      }

      const edgeErrorMsg = error?.message ?? data?.error ?? 'Edge function returned no usable response';
      if (false) { // debug mode removed
        console.warn('[KAAL/edge] non-fatal:', edgeErrorMsg);
      }
      // Fall through to PATH 2
    } catch (edgeErr: any) {
      if (edgeErr?.message === 'notConfigured' || edgeErr?.message === 'notAuthenticated') throw edgeErr;
      if (false) { // debug mode removed
        console.warn('[KAAL/edge] invoke threw:', edgeErr?.message ?? edgeErr);
      }
      // Fall through to PATH 2
    }

    // ─────────────────────────────────────────────────────────────────
    // PATH 2 — Direct call via localStorage key fallback
    // ─────────────────────────────────────────────────────────────────
    const directKey =
      (typeof localStorage !== 'undefined' ? localStorage.getItem('kaal_gemini_key') : null);

    if (directKey && directKey.length > 10) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${directKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 1200 }
          })
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          this.lastCallDiagnostic = { path: 'none', error: `Direct API ${res.status}: ${errText.slice(0, 120)}` };
          throw new Error(`Gemini direct ${res.status}`);
        }

        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from direct Gemini call');

        this.lastCallDiagnostic = { path: 'direct' };
        return text;
      } catch (directErr: any) {
        if (false) { // debug mode removed
          console.warn('[KAAL/direct] failed:', directErr?.message);
        }
      }
    }

    this.lastCallDiagnostic = { path: 'none', error: 'notConfigured' };
    throw new Error('notConfigured');
  }

  /**
   * Store the user's Gemini API key via the edge function (set-api-key action).
   * Returns null on success, or an error string on failure.
   */
  async storeUserApiKey(apiKey: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { action: 'set-api-key', apiKey }
      });
      if (error) return error.message ?? 'Failed to store API key';
      if (!data?.success) return data?.error ?? 'Unknown error storing key';
      return null; // success
    } catch (e: any) {
      return e?.message ?? 'Network error';
    }
  }

  /**
   * Public method to call Gemini with a raw prompt (for Brain Dump task extraction, etc.)
   * Uses Edge Function first, then falls back to localStorage API key
   */
  async callGemini(prompt: string): Promise<string> {
    return this.callGeminiAny(prompt);
  }

  /**
   * Private: Build the full KAAL chat system prompt with all context
   */
  private buildChatPrompt(params: {
    userText: string;
    context: {
      tasks: Array<{ title: string; priority: string; status: string; dueDate?: string | null; estimatedMinutes?: number }>;
      energyLevel: number;
      todayFocusMinutes: number;
      streakDays: number;
      hour: number;
      continuousWorkMin: number;
      completedToday: number;
      overdueCount: number;
    };
    precomputedSignals: Array<{ label: string; weight: number; detail: string }>;
    recommendedAction: string;
    conversationHistory: Array<{ role: 'user' | 'kaal'; text: string }>;
  }): string {
    const { userText, context, precomputedSignals, recommendedAction, conversationHistory } = params;
    const { tasks, energyLevel, todayFocusMinutes, streakDays, hour, continuousWorkMin, completedToday, overdueCount } = context;

    const now      = new Date();
    const timeStr  = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dayStr   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
    const pending  = tasks.filter(t => t.status !== 'completed');
    const overdue  = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed');

    const taskSummary = pending.slice(0, 8).map((t, i) =>
      `  ${i + 1}. "${t.title}" [${t.priority}] ${t.dueDate ? `due ${new Date(t.dueDate).toLocaleDateString()}` : ''} ${overdue.some(o => o.title === t.title) ? '⚠️ OVERDUE' : ''}`
    ).join('\n');

    const recentHistory = conversationHistory.slice(-4).map(m =>
      `${m.role === 'kaal' ? 'KAAL' : 'User'}: ${m.text.slice(0, 200)}`
    ).join('\n');

    const signalSummary = precomputedSignals.slice(0, 5).map(s =>
      `  • ${s.label} (${Math.round(s.weight * 100)}%) — ${s.detail}`
    ).join('\n');

    return `You are KAAL — an executive function AI assistant for people with ADHD and executive dysfunction. You are an agentic system that monitors context and reasons about what matters most RIGHT NOW. You are NOT a chatbot.

KAAL's rules:
- Decisive: say what you're recommending, not what they "could" try.
- Specific: always use actual task names, real numbers, real times from the context below.
- Direct: no filler phrases. Every sentence earns its place.
- ADHD-aware: starting is harder than continuing; decision fatigue is real; vague advice is useless.
- Concise: 2–3 short paragraphs max.

═══ LIVE CONTEXT — ${timeStr}, ${dayStr} ═══
Energy: ${energyLevel}/5 | Focus today: ${todayFocusMinutes} min | Continuous work: ${Math.round(continuousWorkMin)} min
Completed today: ${completedToday} | Overdue: ${overdueCount} | Streak: ${streakDays} days

TASK QUEUE (${pending.length} pending):
${taskSummary || '  (empty)'}

═══ PRE-ANALYZED SIGNALS ═══
${signalSummary || '  No strong signals right now'}
My recommended action: ${recommendedAction}

═══ RECENT CONVERSATION ═══
${recentHistory || '  (start of conversation)'}

═══ USER SAID ═══
"${userText}"

Respond as KAAL — reference the actual tasks above by name. Return ONLY valid JSON (no markdown):
{"text":"your response — use \\n for line breaks","emotion":"coaching|encouraging|celebrating|warning|neutral","suggestions":["action 1","action 2","action 3"]}`;
  }

  /**
   * Private: Parse the chat JSON response from Gemini.
   * Lenient — handles markdown wrappers, partial JSON, and plain text fallback.
   */
  private parseChatResponse(raw: string): {
    text: string;
    emotion: 'encouraging' | 'coaching' | 'celebrating' | 'warning' | 'neutral';
    suggestions: string[];
    poweredByGemini: boolean;
  } | null {
    if (!raw || typeof raw !== 'string' || raw.trim().length < 5) return null;

    const validEmotions = ['encouraging', 'coaching', 'celebrating', 'warning', 'neutral'] as const;

    // ── Attempt 1: strip markdown fences and parse JSON ─────────────────────
    try {
      const cleaned = raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.text && typeof parsed.text === 'string' && parsed.text.length > 5) {
          return {
            text: parsed.text,
            emotion: validEmotions.includes(parsed.emotion) ? parsed.emotion : 'neutral',
            suggestions: Array.isArray(parsed.suggestions)
              ? parsed.suggestions.filter((s: unknown) => typeof s === 'string').slice(0, 4)
              : [],
            poweredByGemini: true,
          };
        }
      }
    } catch { /* try next strategy */ }

    // ── Attempt 2: JSON has unescaped newlines — try to fix it ───────────────
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const fixed = cleaned.replace(/:\s*"((?:[^"\\]|\\[\s\S])*?)"/g, (match, p1) => {
        const escaped = p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        return `: "${escaped}"`;
      });
      const jsonMatch = fixed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.text && typeof parsed.text === 'string' && parsed.text.length > 5) {
          return {
            text: parsed.text,
            emotion: validEmotions.includes(parsed.emotion) ? parsed.emotion : 'neutral',
            suggestions: Array.isArray(parsed.suggestions)
              ? parsed.suggestions.filter((s: unknown) => typeof s === 'string').slice(0, 4)
              : [],
            poweredByGemini: true,
          };
        }
      }
    } catch { /* try next strategy */ }

    // ── Attempt 3: Gemini returned plain text (not JSON) — use it directly ───
    // This happens when the model ignores the JSON instruction.
    const plainText = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .replace(/^\s*\{[\s\S]*"text"\s*:\s*"/, '')  // strip partial JSON prefix
      .trim();

    if (plainText.length > 20) {
      // Guess emotion from content
      const lower = plainText.toLowerCase();
      const emotion: typeof validEmotions[number] =
        /great|excellent|amazing|congrat|well done|crushing|momentum/.test(lower) ? 'celebrating' :
        /warn|urgent|overdue|deadline|behind|critical/.test(lower)               ? 'warning'     :
        /can do|you got|believe|capable|progress/.test(lower)                     ? 'encouraging' :
        /suggest|recommend|try|consider|let's|focus|start/.test(lower)           ? 'coaching'    :
        'neutral';

      return {
        text: plainText.slice(0, 800),
        emotion,
        suggestions: [],
        poweredByGemini: true,
      };
    }

    return null;
  }

  /**
   * Private: Call Gemini API securely via Supabase Edge Function
   */
  private async callGeminiSecure(prompt: string): Promise<string> {
    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function with authentication
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { prompt }
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      return data.response;
    } catch (error) {
      console.error('Secure Gemini call failed:', error);
      throw error;
    }
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
export const geminiServiceSecure = new GeminiServiceSecure();