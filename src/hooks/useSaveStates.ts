import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { saveStatesService, SaveState, StateUsageLog } from '../services/supabase-service';

const DEFAULT_STATES: Omit<SaveState, 'id' | 'userId'>[] = [
  {
    stateId: 'deep-work',
    title: 'Deep Work',
    description: 'Maximum focus for complex problem solving',
    color: 'purple',
    icon: '🧘',
    createdAtTs: Date.now(),
    usageCount: 0,
    settings: {
      blockedApps: ['Slack', 'Email', 'Twitter', 'Instagram', 'Facebook', 'YouTube', 'Reddit', 'Discord', 'WhatsApp', 'Telegram', 'TikTok', 'LinkedIn'],
      allowedApps: ['VS Code', 'Figma', 'Notion'],
      focusMode: true,
      notifications: 'off',
      audioPreset: 'Brown Noise',
      theme: 'Dark Focus',
    }
  },
  {
    stateId: 'collaborative',
    title: 'Collaborative',
    description: 'Team communication and collaboration',
    color: 'blue',
    icon: '👥',
    createdAtTs: Date.now(),
    usageCount: 0,
    settings: {
      blockedApps: ['Twitter', 'Instagram', 'Facebook', 'TikTok'],
      allowedApps: ['Slack', 'Zoom', 'Miro', 'Google Meet', 'Teams'],
      focusMode: false,
      notifications: 'priority',
      audioPreset: 'None',
      theme: 'Arctic Blue',
    }
  },
  {
    stateId: 'creative',
    title: 'Creative Flow',
    description: 'Inspiration and creative work',
    color: 'orange',
    icon: '🎨',
    createdAtTs: Date.now(),
    usageCount: 0,
    settings: {
      blockedApps: ['Email', 'Slack'],
      allowedApps: ['Figma', 'Adobe Creative Suite', 'Pinterest', 'Dribbble'],
      focusMode: false,
      notifications: 'off',
      audioPreset: 'Lo-fi Hip Hop',
      theme: 'Warm Creative',
    }
  },
  {
    stateId: 'admin',
    title: 'Admin & Planning',
    description: 'Emails, scheduling, and administrative tasks',
    color: 'green',
    icon: '📦',
    createdAtTs: Date.now(),
    usageCount: 0,
    settings: {
      blockedApps: ['Social Media'],
      allowedApps: ['Gmail', 'Google Calendar', 'Todoist', 'Notion', 'Asana'],
      focusMode: false,
      notifications: 'all',
      audioPreset: 'Ambient',
      theme: 'High Contrast',
    }
  }
];

export function useSaveStates() {
  const [states, setStates] = useState<SaveState[]>([]);
  const [usageLogs, setUsageLogs] = useState<StateUsageLog[]>([]);
  const [activeState, setActiveStateInternal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load states and logs from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const [statesData, logsData] = await Promise.all([
        saveStatesService.getAll(),
        saveStatesService.getAllUsageLogs()
      ]);
      
      // If no states exist, create defaults
      if (statesData.length === 0 && !initialized) {
        const createdStates = await Promise.all(
          DEFAULT_STATES.map(state => saveStatesService.create(state))
        );
        setStates(createdStates);
        setInitialized(true);
      } else {
        setStates(statesData);
      }
      
      setUsageLogs(logsData);
      
      // Check for active log
      const activeLog = logsData.find(log => log.isActive);
      if (activeLog) {
        setActiveStateInternal(activeLog.stateId);
      }
    } catch (error) {
      console.error('Failed to load save states:', error);
      toast.error('Failed to load save states');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create a new save state
  const createState = async (
    title: string,
    description: string,
    settings: any,
    icon?: string,
    color?: string
  ): Promise<SaveState> => {
    try {
      const newState: Omit<SaveState, 'id' | 'userId'> = {
        stateId: `state-${Date.now()}`,
        title,
        description,
        color: color || 'purple',
        icon: icon || '⚡',
        createdAtTs: Date.now(),
        usageCount: 0,
        settings
      };

      const created = await saveStatesService.create(newState);
      setStates(prev => [...prev, created]);
      
      toast.success(`"${title}" state created!`, {
        description: 'Your custom flow state is ready to use.'
      });

      return created;
    } catch (error) {
      console.error('Failed to create state:', error);
      toast.error('Failed to create state');
      throw error;
    }
  };

  // Update an existing state
  const updateState = async (stateId: string, updates: Partial<SaveState>) => {
    try {
      await saveStatesService.update(stateId, updates);
      setStates(prev => prev.map(state =>
        state.stateId === stateId ? { ...state, ...updates } : state
      ));
      toast.success('State updated successfully');
    } catch (error) {
      console.error('Failed to update state:', error);
      toast.error('Failed to update state');
      throw error;
    }
  };

  // Delete a state
  const deleteState = async (stateId: string) => {
    try {
      const state = states.find(s => s.stateId === stateId);
      await saveStatesService.delete(stateId);
      setStates(prev => prev.filter(s => s.stateId !== stateId));
      
      // End active session if deleting active state
      if (activeState === stateId) {
        await endActiveState();
      }
      
      toast.success(`"${state?.title}" deleted`);
    } catch (error) {
      console.error('Failed to delete state:', error);
      toast.error('Failed to delete state');
      throw error;
    }
  };

  // Activate a state
  const activateState = async (stateId: string) => {
    try {
      const state = states.find(s => s.stateId === stateId);
      if (!state) {
        toast.error('State not found');
        return;
      }

      // End previous active state if exists
      if (activeState) {
        await endActiveState();
      }

      // Create new usage log
      const newLog: Omit<StateUsageLog, 'id' | 'userId'> = {
        logId: `log-${Date.now()}`,
        stateId: state.stateId,
        stateName: state.title,
        startTime: Date.now(),
        duration: 0,
        isActive: true
      };

      const createdLog = await saveStatesService.createUsageLog(newLog);
      setUsageLogs(prev => [...prev, createdLog]);

      // Update state usage count and last used time
      await saveStatesService.update(stateId, {
        usageCount: state.usageCount + 1,
        lastUsedAt: Date.now()
      });
      
      setStates(prev => prev.map(s =>
        s.stateId === stateId
          ? { ...s, usageCount: s.usageCount + 1, lastUsedAt: Date.now() }
          : s
      ));

      // Set as active
      setActiveStateInternal(stateId);

      toast.success(`"${state.title}" environment activated`, {
        description: 'Your workspace is being configured to match this preset.'
      });
    } catch (error) {
      console.error('Failed to activate state:', error);
      toast.error('Failed to activate state');
      throw error;
    }
  };

  // End active state
  const endActiveState = async () => {
    try {
      if (!activeState) return;

      const activeLogs = usageLogs.filter(log => log.isActive);
      if (activeLogs.length === 0) return;

      const activeLog = activeLogs[activeLogs.length - 1];
      const duration = Date.now() - activeLog.startTime;

      await saveStatesService.updateUsageLog(activeLog.logId, {
        endTime: Date.now(),
        duration,
        isActive: false
      });

      setUsageLogs(prev => prev.map(log =>
        log.logId === activeLog.logId
          ? { ...log, endTime: Date.now(), duration, isActive: false }
          : log
      ));

      setActiveStateInternal(null);
    } catch (error) {
      console.error('Failed to end active state:', error);
      toast.error('Failed to end active state');
      throw error;
    }
  };

  // Refresh/reapply current state
  const refreshActiveState = () => {
    if (!activeState) {
      toast.error('No active state to refresh');
      return;
    }

    const state = states.find(s => s.stateId === activeState);
    if (!state) return;

    toast.success('Environment refreshed', {
      description: `"${state.title}" preset has been re-applied with updated settings.`
    });
  };

  // Get active state object
  const getActiveState = (): SaveState | null => {
    if (!activeState) return null;
    return states.find(s => s.stateId === activeState) || null;
  };

  // Get usage logs for a specific state
  const getStateLogs = (stateId: string): StateUsageLog[] => {
    return usageLogs.filter(log => log.stateId === stateId);
  };

  // Get today's usage logs
  const getTodayLogs = (): StateUsageLog[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return usageLogs.filter(log => log.startTime >= todayTimestamp);
  };

  // Get last 24 hours logs
  const getLast24HoursLogs = (): StateUsageLog[] => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    return usageLogs.filter(log => log.startTime >= cutoff);
  };

  // Calculate state statistics
  const getStateStats = (stateId: string) => {
    const stateLogs = getStateLogs(stateId);
    const completedLogs = stateLogs.filter(log => !log.isActive);

    const totalDuration = completedLogs.reduce((sum, log) => sum + log.duration, 0);
    const avgDuration = completedLogs.length > 0 ? totalDuration / completedLogs.length : 0;
    
    const logsWithScore = completedLogs.filter(log => log.focusScore !== undefined);
    const avgFocusScore = logsWithScore.length > 0
      ? logsWithScore.reduce((sum, log) => sum + (log.focusScore || 0), 0) / logsWithScore.length
      : 0;

    return {
      totalUses: stateLogs.length,
      totalDuration: Math.round(totalDuration / (1000 * 60)), // minutes
      avgDuration: Math.round(avgDuration / (1000 * 60)), // minutes
      avgFocusScore: Math.round(avgFocusScore),
      lastUsed: completedLogs.length > 0 ? Math.max(...completedLogs.map(l => l.startTime)) : 0
    };
  };

  // Get optimization data (which state performs best)
  const getOptimizationData = () => {
    const stateScores = states.map(state => {
      const stats = getStateStats(state.stateId);
      return {
        stateId: state.stateId,
        stateName: state.title,
        score: stats.avgFocusScore,
        totalDuration: stats.totalDuration,
        totalUses: stats.totalUses
      };
    });

    // Sort by focus score
    stateScores.sort((a, b) => b.score - a.score);

    const topState = stateScores[0];
    const optimizationPercent = topState && topState.totalUses > 0 
      ? Math.min(100, Math.round((topState.score / 100) * 100))
      : 75; // Default

    return {
      topState: topState || null,
      optimizationPercent,
      stateScores
    };
  };

  // Get current active log
  const getActiveLog = (): StateUsageLog | null => {
    const activeLogs = usageLogs.filter(log => log.isActive);
    return activeLogs.length > 0 ? activeLogs[activeLogs.length - 1] : null;
  };

  // Calculate active duration
  const getActiveDuration = (): number => {
    const log = getActiveLog();
    if (!log) return 0;
    return Date.now() - log.startTime;
  };

  // Format duration for display
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return {
    states,
    usageLogs,
    activeState,
    loading,
    createState,
    updateState,
    deleteState,
    activateState,
    endActiveState,
    refreshActiveState,
    getActiveState,
    getStateLogs,
    getTodayLogs,
    getLast24HoursLogs,
    getStateStats,
    getOptimizationData,
    getActiveLog,
    getActiveDuration,
    formatDuration
  };
}
