/**
 * KAAL AI Context Provider - Optimized Event-Driven Architecture
 * No wasteful polling - only processes when meaningful events occur
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { aiEngine } from '../services/ai-engine';
import { geminiServiceSecure } from '../services/gemini-service-secure';
import { supabaseService } from '../services/supabase-service';
import { storageService } from '../services/storage-service';

interface AIContextValue {
  // State
  isInitialized: boolean;
  currentSession: SessionAnalytics | null;
  globalFocusState: FocusState | null;
  globalEnergyPattern: EnergyPattern | null;
  activeInsights: AIInsight[];
  geminiEnabled: boolean;
  
  // Actions
  startSession: (sessionId: string) => void;
  endSession: () => void;
  updateFocusState: (signals: {
    activeTime: number;
    appSwitches: number;
    notificationsSuppressed: boolean;
  }) => void;
  updateEnergyLevel: (level: number) => void;
  dismissInsight: (id: string) => void;
  recordContextSwitch: (from: string, to: string) => void;
  requestDeepInsights: () => Promise<void>; // Manual trigger for AI insights
  
  // Analytics
  getSessionAnalytics: () => SessionAnalytics | null;
  getRecommendations: () => string[];
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionAnalytics | null>(null);
  const [globalFocusState, setGlobalFocusState] = useState<FocusState | null>(null);
  const [globalEnergyPattern, setGlobalEnergyPattern] = useState<EnergyPattern | null>(null);
  const [activeInsights, setActiveInsights] = useState<AIInsight[]>([]);
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  
  // Refs to prevent excessive processing
  const lastFocusUpdate = useRef(0);
  const lastEnergyUpdate = useRef(0);
  const lastDeepAnalysis = useRef(0);
  const sessionStartTime = useRef(0);

  // Initialize AI Engine (once)
  useEffect(() => {
    const initializeAI = async () => {
      aiEngine.initialize({
        workStyle: 'cyclic',
        focusBaseline: 75,
        energyPattern: [60, 70, 85, 90, 85, 75, 70, 65, 55, 50, 60, 70]
      });

      // Initialize secure Gemini service (checks for API key in Supabase)
      await geminiServiceSecure.initialize();
      setGeminiEnabled(geminiServiceSecure.isAvailable());

      // Subscribe to AI engine events
      const handleFocusChange = (state: FocusState) => {
        setGlobalFocusState(state);
        
        // Generate quick nudge (heuristic-based, no API call)
        const sessionDuration = currentSession 
          ? Math.floor((Date.now() - currentSession.startTime) / 60000)
          : 0;
        
        const energyLevel = globalEnergyPattern?.current || 75;
        const nudgeText = geminiServiceSecure.generateQuickNudge(state.level, energyLevel, sessionDuration);
        
        if (nudgeText) {
          const nudge: AIInsight = {
            id: `nudge-${Date.now()}`,
            type: 'nudge',
            priority: 'medium',
            title: 'Smart Nudge',
            message: nudgeText,
            timestamp: Date.now(),
            dismissed: false
          };
          setActiveInsights(prev => [nudge, ...prev].slice(0, 5));
        }
      };

      const handleInsightGenerated = (insight: AIInsight) => {
        setActiveInsights(prev => {
          const filtered = prev.filter(i => i.id !== insight.id);
          return [insight, ...filtered].slice(0, 5);
        });
      };

      aiEngine.on('focus-state-changed', handleFocusChange);
      aiEngine.on('insight-generated', handleInsightGenerated);

      setIsInitialized(true);

      return () => {
        aiEngine.off('focus-state-changed', handleFocusChange);
        aiEngine.off('insight-generated', handleInsightGenerated);
      };
    };

    initializeAI();
  }, []);

  // Strategic deep analysis - only at key moments
  useEffect(() => {
    if (!isInitialized || !currentSession) return;

    // Deep analysis at specific intervals (15 minutes), not continuously
    const ANALYSIS_INTERVAL = 15 * 60 * 1000; // 15 minutes
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastDeepAnalysis.current >= ANALYSIS_INTERVAL) {
        performDeepAnalysis();
      }
    }, ANALYSIS_INTERVAL); // Check every 15 minutes

    return () => clearInterval(interval);
  }, [isInitialized, currentSession]);

  // Periodic session analytics update (5 minutes, not 30 seconds)
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      const analytics = aiEngine.analyzeSession(currentSession.sessionId);
      setCurrentSession(analytics);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [currentSession]);

  const performDeepAnalysis = async () => {
    if (!globalFocusState || !globalEnergyPattern || !currentSession) return;

    lastDeepAnalysis.current = Date.now();

    try {
      const context = {
        focusHistory: [globalFocusState],
        energyHistory: [globalEnergyPattern.current],
        contextSwitches: currentSession.contextSwitches.length,
        taskHistory: [],
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      };

      const insights = await geminiServiceSecure.generateDeepInsights(context);

      // Add insights to the panel
      insights.insights.forEach((text, i) => {
        const insight: AIInsight = {
          id: `deep-insight-${Date.now()}-${i}`,
          type: 'suggestion',
          priority: 'medium',
          title: '🧠 AI Insight',
          message: text,
          timestamp: Date.now(),
          dismissed: false
        };
        setActiveInsights(prev => [insight, ...prev].slice(0, 5));
      });

    } catch (error) {
      console.warn('Deep analysis failed:', error);
    }
  };

  const startSession = useCallback((sessionId: string) => {
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
    setCurrentSession(session);
    sessionStartTime.current = Date.now();
    
    // Save to storage
    const focusSession: FocusSession = {
      id: sessionId,
      title: 'Focus Session',
      startTime: session.startTime,
      duration: 0,
      taskIds: [],
      focusScore: 0,
      energyLevels: [],
      contextSwitches: 0
    };
    storageService.setCurrentSession(focusSession);
    
    console.log('🎯 Session started:', sessionId);

    // Trigger initial deep analysis after 5 minutes
    setTimeout(() => {
      performDeepAnalysis();
    }, 5 * 60 * 1000);
  }, []);

  const endSession = useCallback(() => {
    if (currentSession) {
      const finalAnalytics = aiEngine.analyzeSession(currentSession.sessionId);
      console.log('📊 Session ended:', finalAnalytics);
      
      // Save completed session to storage
      const duration = Math.floor((Date.now() - currentSession.startTime) / 60000);
      storageService.endCurrentSession({
        duration,
        endTime: Date.now(),
        focusScore: finalAnalytics.productivity,
        contextSwitches: currentSession.contextSwitches.length
      });
      
      const insight: AIInsight = {
        id: `session-end-${Date.now()}`,
        type: 'celebration',
        priority: 'high',
        title: '🎉 Session Complete!',
        message: `Great work! You achieved ${finalAnalytics.productivity}% productivity with ${finalAnalytics.flowMinutes} minutes of flow state.`,
        timestamp: Date.now(),
        dismissed: false
      };
      
      setActiveInsights(prev => [insight, ...prev]);
      setCurrentSession(null);
    }
  }, [currentSession]);

  const updateFocusState = useCallback((signals: {
    activeTime: number;
    appSwitches: number;
    notificationsSuppressed: boolean;
  }) => {
    const now = Date.now();
    
    // Rate limit: Only update every 60 seconds
    if (now - lastFocusUpdate.current < 60000) {
      return;
    }
    
    lastFocusUpdate.current = now;
    const state = aiEngine.detectFocusState(signals);
    setGlobalFocusState(state);
  }, []);

  const updateEnergyLevel = useCallback((level: number) => {
    const now = Date.now();
    
    // Rate limit: Only update every 60 seconds
    if (now - lastEnergyUpdate.current < 60000) {
      return;
    }
    
    lastEnergyUpdate.current = now;
    const hour = new Date().getHours();
    const pattern = aiEngine.analyzeEnergyPattern(level, hour);
    setGlobalEnergyPattern(pattern);
    
    // Save energy log to storage
    storageService.saveEnergyLog({
      id: `energy-${now}`,
      timestamp: now,
      level,
      activities: []
    });
  }, []);

  const dismissInsight = useCallback((id: string) => {
    aiEngine.dismissInsight(id);
    setActiveInsights(prev => prev.filter(i => i.id !== id));
  }, []);

  const recordContextSwitch = useCallback((from: string, to: string) => {
    aiEngine.recordContextSwitch(from, to, 'user');
    
    // Context switches are important events - might trigger analysis
    const now = Date.now();
    if (currentSession && now - lastDeepAnalysis.current >= 10 * 60 * 1000) {
      // If 10+ minutes since last analysis and we have a context switch, analyze
      performDeepAnalysis();
    }
  }, [currentSession]);

  const requestDeepInsights = useCallback(async () => {
    await performDeepAnalysis();
  }, [globalFocusState, globalEnergyPattern, currentSession]);

  const getSessionAnalytics = useCallback(() => {
    if (!currentSession) return null;
    return aiEngine.analyzeSession(currentSession.sessionId);
  }, [currentSession]);

  const getRecommendations = useCallback(() => {
    if (!globalEnergyPattern) return [];
    return globalEnergyPattern.recommendations;
  }, [globalEnergyPattern]);

  const value: AIContextValue = {
    isInitialized,
    currentSession,
    globalFocusState,
    globalEnergyPattern,
    activeInsights,
    geminiEnabled,
    startSession,
    endSession,
    updateFocusState,
    updateEnergyLevel,
    dismissInsight,
    recordContextSwitch,
    requestDeepInsights,
    getSessionAnalytics,
    getRecommendations
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIContext must be used within AIProvider');
  }
  return context;
}