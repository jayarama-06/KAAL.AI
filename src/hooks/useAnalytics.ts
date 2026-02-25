import { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storage-service';
import type { FocusSession } from '../services/supabase-service';

export interface AnalyticsMetrics {
  // Focus session metrics
  deepWorkRatio: number;
  cognitiveLoad: number;
  focusScore: number;
  totalDeepWorkHours: number;
  totalShallowWorkHours: number;
  totalSessions: number;
  averageSessionDuration: number;
  contextSwitches: number;
  peakPerformanceTime: string;
  interruptions: {
    email: number;
    slack: number;
    meetings: number;
  };
  trends: {
    deepWorkChange: number;
    focusScoreChange: number;
  };
  
  // Task completion metrics
  tasksCompleted: number;
  tasksCompletedToday: number;
  completionRate: number; // % of tasks completed vs created
  averageTaskDuration: number; // minutes
  currentStreak: number; // days with at least 1 task completed
  longestStreak: number;
  
  // Energy metrics
  averageEnergy: number; // 0-10
  energyTrend: number; // % change
  totalCheckIns: number;
  predictiveAccuracy?: number; // TinyML model accuracy if available
  
  // KAAL Agent metrics
  brainDumpsProcessed: number;
  itemsGenerated: number; // tasks, ideas, worries extracted
  agentUsageCount: number;
  
  // Time patterns
  mostProductiveHour: string;
  mostProductiveDay: string;
  
  // Overall activity
  activeDays: number; // days with any activity
  totalActivityScore: number; // composite score
}

export interface ChartDataPoint {
  day: string;
  deepWork: number;
  shallowWork: number;
  date: Date;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

export function useAnalytics(timeRange: TimeRange = 'weekly') {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [energyLogs, setEnergyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load all data sources
  useEffect(() => {
    let mounted = true;

    const loadAllData = async () => {
      try {
        setLoading(true);
        
        // getSessions is async, but getEnergyLogs is synchronous
        const sessionsData = await storageService.getSessions().catch(() => []);
        const energyData = storageService.getEnergyLogs(); // Synchronous call
        
        // For tasks, we need to use Supabase directly since useTasks is a hook
        // and we can't call hooks inside useEffect
        const { getTasks } = await import('../services/task-service');
        const tasksResult = await getTasks({});
        const tasksData = tasksResult.success ? tasksResult.data || [] : [];
        
        if (mounted) {
          setSessions(sessionsData || []);
          setTasks(tasksData);
          setEnergyLogs(energyData || []);
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);
        if (mounted) {
          setSessions([]);
          setTasks([]);
          setEnergyLogs([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      mounted = false;
    };
  }, [lastUpdated]);

  // Calculate comprehensive metrics from all data sources
  const calculateMetrics = (
    sessions: FocusSession[], 
    tasks: any[], 
    energyLogs: any[]
  ): AnalyticsMetrics => {
    // Set up date ranges
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    let startDate = new Date();
    
    switch (timeRange) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(now.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    // ===== TASK METRICS =====
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completedInRange = completedTasks.filter(t => {
      const completedAt = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime();
      return completedAt >= startDate.getTime();
    });
    const completedToday = completedTasks.filter(t => {
      const completedAt = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime();
      return completedAt >= todayStart.getTime();
    });
    
    const createdInRange = tasks.filter(t => new Date(t.createdAt).getTime() >= startDate.getTime());
    const completionRate = createdInRange.length > 0 
      ? (completedInRange.length / createdInRange.length) * 100 
      : completedTasks.length > 0 ? 100 : 0;
    
    // Calculate average task duration
    const tasksWithDuration = completedInRange.filter(t => t.actualMinutes || t.estimatedMinutes);
    const averageTaskDuration = tasksWithDuration.length > 0
      ? tasksWithDuration.reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 0), 0) / tasksWithDuration.length
      : 0;
    
    // Calculate streaks
    const completedDates = new Set(completedTasks.map(t => {
      const date = new Date(t.completedAt || t.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const checkDate = new Date(now);
    
    // Calculate current streak (working backwards from today)
    for (let i = 0; i < 365; i++) {
      const dateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (completedDates.has(dateStr)) {
        if (i === 0 || currentStreak > 0) currentStreak++;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        if (i > 0) break; // Stop counting current streak if we hit a gap after today
        tempStreak = 0;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // ===== ENERGY METRICS =====
    const energyInRange = energyLogs.filter(log => log.timestamp >= startDate.getTime());
    const averageEnergy = energyInRange.length > 0
      ? energyInRange.reduce((acc, log) => acc + log.level, 0) / energyInRange.length
      : 0;
    
    // Previous period for trend
    const previousStartDate = new Date(startDate);
    switch (timeRange) {
      case 'daily':
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;
      case 'weekly':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'monthly':
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
    }
    
    const previousEnergyLogs = energyLogs.filter(log => 
      log.timestamp >= previousStartDate.getTime() && log.timestamp < startDate.getTime()
    );
    const previousAverageEnergy = previousEnergyLogs.length > 0
      ? previousEnergyLogs.reduce((acc, log) => acc + log.level, 0) / previousEnergyLogs.length
      : 0;
    const energyTrend = previousAverageEnergy > 0
      ? ((averageEnergy - previousAverageEnergy) / previousAverageEnergy) * 100
      : averageEnergy > 0 ? 100 : 0;
    
    // ===== KAAL AGENT METRICS (from localStorage for now) =====
    let brainDumpsProcessed = 0;
    let itemsGenerated = 0;
    let agentUsageCount = 0;
    
    try {
      const agentHistory = localStorage.getItem('kaal_agent_history');
      if (agentHistory) {
        const history = JSON.parse(agentHistory);
        const historyInRange = history.filter((entry: any) => 
          new Date(entry.timestamp).getTime() >= startDate.getTime()
        );
        brainDumpsProcessed = historyInRange.length;
        itemsGenerated = historyInRange.reduce((acc: number, entry: any) => 
          acc + (entry.results?.tasks?.length || 0) + 
               (entry.results?.ideas?.length || 0) + 
               (entry.results?.worries?.length || 0), 0
        );
        agentUsageCount = historyInRange.length;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // ===== TIME PATTERN ANALYSIS =====
    // Most productive hour (from task completions + sessions)
    const hourActivity = new Map<number, number>();
    
    completedTasks.forEach(task => {
      const hour = new Date(task.completedAt || task.createdAt).getHours();
      hourActivity.set(hour, (hourActivity.get(hour) || 0) + 1);
    });
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const duration = session.actualDuration ? session.actualDuration / (1000 * 60) : session.plannedDuration || 0;
      hourActivity.set(hour, (hourActivity.get(hour) || 0) + duration / 30); // Weight by duration
    });
    
    let mostProductiveHour = 9;
    let maxHourActivity = 0;
    hourActivity.forEach((activity, hour) => {
      if (activity > maxHourActivity) {
        maxHourActivity = activity;
        mostProductiveHour = hour;
      }
    });
    
    // Most productive day (from task completions)
    const dayActivity = new Map<number, number>();
    completedTasks.forEach(task => {
      const day = new Date(task.completedAt || task.createdAt).getDay();
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
    });
    
    let mostProductiveDay = 'Monday';
    let maxDayActivity = 0;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayActivity.forEach((activity, day) => {
      if (activity > maxDayActivity) {
        maxDayActivity = activity;
        mostProductiveDay = dayNames[day];
      }
    });
    
    // ===== ACTIVE DAYS =====
    const activeDatesSet = new Set<string>();
    
    completedTasks.forEach(task => {
      const date = new Date(task.completedAt || task.createdAt);
      if (date >= startDate) {
        activeDatesSet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      }
    });
    
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      if (date >= startDate) {
        activeDatesSet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      }
    });
    
    energyInRange.forEach(log => {
      const date = new Date(log.timestamp);
      activeDatesSet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    
    const activeDays = activeDatesSet.size;
    
    // ===== TOTAL ACTIVITY SCORE (composite metric) =====
    const totalActivityScore = Math.round(
      (completedInRange.length * 10) + // Each task = 10 points
      (sessions.length * 25) + // Each session = 25 points
      (energyInRange.length * 5) + // Each check-in = 5 points
      (brainDumpsProcessed * 15) + // Each brain dump = 15 points
      (currentStreak * 20) // Each streak day = 20 points
    );
    
    // ===== FOCUS SESSION METRICS (existing code) =====
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate;
    });

    const totalMinutes = filteredSessions.reduce((acc, session) => {
      const duration = session.actualDuration 
        ? session.actualDuration / (1000 * 60)
        : session.plannedDuration || 0;
      return acc + duration;
    }, 0);
    const totalHours = totalMinutes / 60;
    
    const deepWorkSessions = filteredSessions.filter(s => (s.focusScore || 0) >= 70);
    const deepWorkMinutes = deepWorkSessions.reduce((acc, s) => {
      const duration = s.actualDuration 
        ? s.actualDuration / (1000 * 60)
        : s.plannedDuration || 0;
      return acc + duration;
    }, 0);
    const deepWorkHours = deepWorkMinutes / 60;
    
    const shallowWorkHours = totalHours - deepWorkHours;
    const deepWorkRatio = totalHours > 0 ? (deepWorkHours / totalHours) * 100 : 0;
    
    const avgFocusScore = filteredSessions.length > 0
      ? filteredSessions.reduce((acc, s) => acc + (s.focusScore || 0), 0) / filteredSessions.length
      : 0;
    const cognitiveLoad = (avgFocusScore / 100) * 10;
    
    const focusScore = Math.round(deepWorkHours * 100 + avgFocusScore * 5);
    
    const averageSessionDuration = filteredSessions.length > 0
      ? totalMinutes / filteredSessions.length
      : 0;
    
    const contextSwitches = filteredSessions.reduce((acc, s) => acc + (s.contextSwitches || 0), 0);
    
    const hourCounts = new Map<number, number>();
    filteredSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const duration = session.actualDuration 
        ? session.actualDuration / (1000 * 60)
        : session.plannedDuration || 0;
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + duration);
    });
    
    let peakHour = mostProductiveHour;
    let maxMinutes = 0;
    hourCounts.forEach((minutes, hour) => {
      if (minutes > maxMinutes) {
        maxMinutes = minutes;
        peakHour = hour;
      }
    });
    
    const peakPerformanceTime = `${String(peakHour).padStart(2, '0')}:00`;
    
    const interruptions = {
      email: Math.round(contextSwitches * 0.45),
      slack: Math.round(contextSwitches * 0.25),
      meetings: Math.round(contextSwitches * 0.30)
    };
    
    const previousSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= previousStartDate && sessionDate < startDate;
    });
    
    const previousDeepWorkSessions = previousSessions.filter(s => (s.focusScore || 0) >= 70);
    const previousDeepWorkMinutes = previousDeepWorkSessions.reduce((acc, s) => {
      const duration = s.actualDuration 
        ? s.actualDuration / (1000 * 60)
        : s.plannedDuration || 0;
      return acc + duration;
    }, 0);
    const previousTotalMinutes = previousSessions.reduce((acc, s) => {
      const duration = s.actualDuration 
        ? s.actualDuration / (1000 * 60)
        : s.plannedDuration || 0;
      return acc + duration;
    }, 0);
    const previousDeepWorkRatio = previousTotalMinutes > 0 ? (previousDeepWorkMinutes / previousTotalMinutes) * 100 : 0;
    
    const previousFocusScore = Math.round((previousDeepWorkMinutes / 60) * 100 + 
      (previousSessions.length > 0 ? previousSessions.reduce((acc, s) => acc + (s.focusScore || 0), 0) / previousSessions.length : 0) * 5);
    
    const deepWorkChange = previousDeepWorkRatio > 0 
      ? ((deepWorkRatio - previousDeepWorkRatio) / previousDeepWorkRatio) * 100 
      : deepWorkRatio > 0 ? 100 : 0;
    
    const focusScoreChange = previousFocusScore > 0
      ? ((focusScore - previousFocusScore) / previousFocusScore) * 100
      : focusScore > 0 ? 100 : 0;

    return {
      // Focus session metrics
      deepWorkRatio: Math.round(deepWorkRatio),
      cognitiveLoad: Math.round(cognitiveLoad * 10) / 10,
      focusScore,
      totalDeepWorkHours: Math.round(deepWorkHours * 10) / 10,
      totalShallowWorkHours: Math.round(shallowWorkHours * 10) / 10,
      totalSessions: filteredSessions.length,
      averageSessionDuration: Math.round(averageSessionDuration),
      contextSwitches,
      peakPerformanceTime,
      interruptions,
      trends: {
        deepWorkChange: Math.round(deepWorkChange),
        focusScoreChange: Math.round(focusScoreChange)
      },
      
      // Task completion metrics
      tasksCompleted: completedInRange.length,
      tasksCompletedToday: completedToday.length,
      completionRate: Math.round(completionRate),
      averageTaskDuration: Math.round(averageTaskDuration),
      currentStreak,
      longestStreak,
      
      // Energy metrics
      averageEnergy: Math.round(averageEnergy * 10) / 10,
      energyTrend: Math.round(energyTrend),
      totalCheckIns: energyInRange.length,
      
      // KAAL Agent metrics
      brainDumpsProcessed,
      itemsGenerated,
      agentUsageCount,
      
      // Time patterns
      mostProductiveHour: `${String(mostProductiveHour).padStart(2, '0')}:00`,
      mostProductiveDay,
      
      // Overall activity
      activeDays,
      totalActivityScore
    };
  };

  // Generate chart data for the week
  const getChartData = (sessions: FocusSession[]): ChartDataPoint[] => {
    if (!sessions || sessions.length === 0) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      return days.map((day, i) => {
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
        return {
          day,
          deepWork: 0,
          shallowWork: 0,
          date: currentDay
        };
      });
    }

    const dataPoints: ChartDataPoint[] = [];
    
    const now = new Date();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Get Monday of current week
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      currentDay.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(currentDay);
      nextDay.setDate(currentDay.getDate() + 1);
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= currentDay && sessionDate < nextDay;
      });
      
      // Calculate deep work vs shallow work hours
      const deepWorkMinutes = daySessions
        .filter(s => (s.focusScore || 0) >= 70)
        .reduce((acc, s) => {
          const duration = s.actualDuration 
            ? s.actualDuration / (1000 * 60)
            : s.plannedDuration || 0;
          return acc + duration;
        }, 0);
      
      const totalMinutes = daySessions.reduce((acc, s) => {
        const duration = s.actualDuration 
          ? s.actualDuration / (1000 * 60)
          : s.plannedDuration || 0;
        return acc + duration;
      }, 0);
      const shallowWorkMinutes = totalMinutes - deepWorkMinutes;
      
      dataPoints.push({
        day: days[i],
        deepWork: Math.round((deepWorkMinutes / 60) * 10) / 10,
        shallowWork: Math.round((shallowWorkMinutes / 60) * 10) / 10,
        date: currentDay
      });
    }
    
    return dataPoints;
  };

  // Generate SVG path for chart
  const generateChartPath = (dataPoints: ChartDataPoint[], type: 'deepWork' | 'shallowWork'): string => {
    if (dataPoints.length === 0) return '';
    
    const width = 800;
    const height = 300;
    const maxValue = Math.max(...dataPoints.map(d => Math.max(d.deepWork, d.shallowWork)), 5);
    
    const xStep = width / (dataPoints.length - 1 || 1);
    
    const points = dataPoints.map((point, index) => {
      const x = index * xStep;
      const value = type === 'deepWork' ? point.deepWork : point.shallowWork;
      const y = height - (value / maxValue) * (height - 50); // Leave 50px padding
      return { x, y };
    });
    
    // Create smooth curve
    let path = `M${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      
      path += ` C${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }
    
    return path;
  };

  // Get cognitive load bars (7 days)
  const getCognitiveLoadBars = (chartData: ChartDataPoint[]): number[] => {
    return chartData.map(day => {
      const totalHours = day.deepWork + day.shallowWork;
      // Normalize to 0-100 range, assuming 8 hours is 100%
      return Math.min(100, (totalHours / 8) * 100);
    });
  };

  // Refresh analytics
  const refresh = () => {
    setLastUpdated(new Date());
  };

  const metrics = useMemo(() => calculateMetrics(sessions, tasks, energyLogs), [sessions, tasks, energyLogs, timeRange]);
  const chartData = useMemo(() => getChartData(sessions), [sessions]);
  const cognitiveLoadBars = useMemo(() => getCognitiveLoadBars(chartData), [chartData]);

  return {
    metrics,
    chartData,
    cognitiveLoadBars,
    generateChartPath,
    lastUpdated,
    refresh,
    loading
  };
}