/**
 * React hooks for KAAL AI Engine integration
 * Provides reactive AI features throughout the application
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { aiEngine, FocusState, EnergyPattern, AIInsight, SessionAnalytics } from '../services/ai-engine';

/**
 * Main AI hook - provides access to all AI features
 */
export function useAI() {
  const [focusState, setFocusState] = useState<FocusState | null>(null);
  const [energyPattern, setEnergyPattern] = useState<EnergyPattern | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const sessionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Initialize AI engine
    aiEngine.initialize({
      workStyle: 'cyclic',
      focusBaseline: 75
    });

    // Subscribe to AI events
    const handleFocusChange = (state: FocusState) => setFocusState(state);
    const handleInsightGenerated = (insight: AIInsight) => {
      setInsights(prev => [insight, ...prev]);
    };

    aiEngine.on('focus-state-changed', handleFocusChange);
    aiEngine.on('insight-generated', handleInsightGenerated);

    return () => {
      aiEngine.off('focus-state-changed', handleFocusChange);
      aiEngine.off('insight-generated', handleInsightGenerated);
    };
  }, []);

  const detectFocus = useCallback((signals: {
    activeTime: number;
    appSwitches: number;
    notificationsSuppressed: boolean;
  }) => {
    return aiEngine.detectFocusState(signals);
  }, []);

  const analyzeEnergy = useCallback((currentEnergy: number) => {
    const hour = new Date().getHours();
    const pattern = aiEngine.analyzeEnergyPattern(currentEnergy, hour);
    setEnergyPattern(pattern);
    return pattern;
  }, []);

  const generateNudge = useCallback((context: {
    sessionDuration: number;
    energyLevel: number;
  }) => {
    const hour = new Date().getHours();
    return aiEngine.generateNudge({
      focusState: focusState || {
        level: 75,
        quality: 'moderate',
        duration: context.sessionDuration,
        interruptions: 0,
        flowScore: 70
      },
      sessionDuration: context.sessionDuration,
      energyLevel: context.energyLevel,
      timeOfDay: hour
    });
  }, [focusState]);

  const dismissInsight = useCallback((id: string) => {
    aiEngine.dismissInsight(id);
    setInsights(prev => prev.filter(i => i.id !== id));
  }, []);

  return {
    focusState,
    energyPattern,
    insights,
    detectFocus,
    analyzeEnergy,
    generateNudge,
    dismissInsight
  };
}

/**
 * Focus tracking hook - monitors and reports focus state
 */
export function useFocusTracking(isActive: boolean = true) {
  const [currentFocus, setCurrentFocus] = useState<FocusState | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const appSwitchCount = useRef(0);
  const lastUpdateTime = useRef(Date.now());

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdateTime.current) / 60000); // minutes
      
      setSessionDuration(prev => prev + 1);

      // Detect focus state every minute
      const state = aiEngine.detectFocusState({
        activeTime: sessionDuration,
        appSwitches: appSwitchCount.current,
        notificationsSuppressed: true
      });

      setCurrentFocus(state);
      lastUpdateTime.current = now;
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [isActive, sessionDuration]);

  const recordAppSwitch = useCallback((from: string, to: string) => {
    appSwitchCount.current += 1;
    aiEngine.recordContextSwitch(from, to, 'user');
  }, []);

  return {
    currentFocus,
    sessionDuration,
    recordAppSwitch
  };
}

/**
 * Energy pattern hook - tracks and predicts energy levels
 */
export function useEnergyTracking() {
  const [energyLevel, setEnergyLevel] = useState(75);
  const [pattern, setPattern] = useState<EnergyPattern | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const updateEnergy = useCallback((level: number) => {
    setEnergyLevel(level);
    
    const hour = new Date().getHours();
    const analysisResult = aiEngine.analyzeEnergyPattern(level, hour);
    
    setPattern(analysisResult);
    setRecommendations(analysisResult.recommendations);
  }, []);

  const getOptimalTaskTime = useCallback(() => {
    if (!pattern) return null;
    
    const currentHour = new Date().getHours();
    const isOptimal = pattern.optimalHours.includes(currentHour);
    
    return {
      isOptimal,
      nextOptimalHour: pattern.optimalHours.find(h => h > currentHour) || pattern.optimalHours[0]
    };
  }, [pattern]);

  return {
    energyLevel,
    pattern,
    recommendations,
    updateEnergy,
    getOptimalTaskTime
  };
}

/**
 * Smart nudging hook - generates contextual nudges
 */
export function useSmartNudges(sessionDuration: number, energyLevel: number) {
  const [activeNudge, setActiveNudge] = useState<AIInsight | null>(null);
  const [nudgeHistory, setNudgeHistory] = useState<AIInsight[]>([]);
  const lastNudgeTime = useRef(0);

  useEffect(() => {
    // Generate nudges every 5 minutes, but not more frequently than every 3 minutes
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastNudge = now - lastNudgeTime.current;
      
      if (timeSinceLastNudge < 180000) return; // 3 minutes minimum

      const hour = new Date().getHours();
      const nudge = aiEngine.generateNudge({
        focusState: {
          level: 75,
          quality: 'moderate',
          duration: sessionDuration,
          interruptions: 0,
          flowScore: 70
        },
        sessionDuration,
        energyLevel,
        timeOfDay: hour
      });

      if (nudge) {
        setActiveNudge(nudge);
        setNudgeHistory(prev => [nudge, ...prev].slice(0, 10)); // Keep last 10
        lastNudgeTime.current = now;
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [sessionDuration, energyLevel]);

  const dismissNudge = useCallback(() => {
    if (activeNudge) {
      aiEngine.dismissInsight(activeNudge.id);
      setActiveNudge(null);
    }
  }, [activeNudge]);

  return {
    activeNudge,
    nudgeHistory,
    dismissNudge
  };
}

/**
 * Task prioritization hook
 */
export function useTaskPrioritization() {
  const { energyLevel } = useEnergyTracking();

  const prioritize = useCallback((tasks: Array<{
    id: string;
    title: string;
    estimatedDuration: number;
    importance: number;
    urgency: number;
    energyRequired: number;
  }>, availableTime: number = 240) => {
    return aiEngine.prioritizeTasks(tasks, energyLevel, availableTime);
  }, [energyLevel]);

  return { prioritize };
}

/**
 * Session analytics hook
 */
export function useSessionAnalytics(sessionId: string) {
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);

  const analyze = useCallback(() => {
    const result = aiEngine.analyzeSession(sessionId);
    setAnalytics(result);
    return result;
  }, [sessionId]);

  useEffect(() => {
    // Auto-analyze every 5 minutes during active session
    const interval = setInterval(() => {
      analyze();
    }, 300000);

    return () => clearInterval(interval);
  }, [analyze]);

  return {
    analytics,
    analyze
  };
}

/**
 * Work pattern recommendation hook
 */
export function useWorkPattern() {
  const { energyLevel } = useEnergyTracking();
  const { currentFocus } = useFocusTracking();
  const [pattern, setPattern] = useState<{
    pattern: string;
    workDuration: number;
    breakDuration: number;
    reasoning: string;
  } | null>(null);

  useEffect(() => {
    const focusHistory = currentFocus ? [currentFocus] : [];
    const recommendation = aiEngine.recommendWorkPattern(energyLevel, focusHistory);
    setPattern(recommendation);
  }, [energyLevel, currentFocus]);

  return pattern;
}
