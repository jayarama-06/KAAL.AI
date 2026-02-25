import { useMemo } from 'react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface FocusSession {
  id: number;
  duration: number; // in minutes
  date: string;
  completed: boolean;
}

export interface DailyData {
  day: string;
  hours: number;
  percentage: number;
  isHighlight?: boolean;
  date: string;
}

export interface InsightData {
  icon: any;
  color: string;
  bgColor: string;
  title: string;
  statusColor: string;
  content: JSX.Element;
  actionIcon: any;
}

export function useWeeklyInsights() {
  // Get current week range
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
  };

  const { monday, sunday } = getWeekRange();

  // Calculate daily deep work hours from localStorage
  const calculateDailyData = (): DailyData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyData: DailyData[] = [];
    
    // Get focus sessions from localStorage
    const focusSessionsData = localStorage.getItem('focusSessions');
    const focusSessions: FocusSession[] = focusSessionsData ? JSON.parse(focusSessionsData) : [];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      const dateString = currentDay.toISOString().split('T')[0];
      
      // Calculate total focus hours for this day
      const daysSessions = focusSessions.filter(session => {
        const sessionDate = new Date(session.date).toISOString().split('T')[0];
        return sessionDate === dateString && session.completed;
      });
      
      const totalMinutes = daysSessions.reduce((sum, session) => sum + session.duration, 0);
      const hours = parseFloat((totalMinutes / 60).toFixed(1));
      const maxHours = 8; // Maximum expected hours per day
      const percentage = Math.min(100, Math.round((hours / maxHours) * 100));
      
      dailyData.push({
        day: days[i],
        hours,
        percentage,
        date: dateString,
        isHighlight: hours > 0 && hours === Math.max(...dailyData.map(d => d.hours || 0), hours)
      });
    }
    
    // Mark the day with most hours as highlight
    const maxHours = Math.max(...dailyData.map(d => d.hours));
    if (maxHours > 0) {
      const maxIndex = dailyData.findIndex(d => d.hours === maxHours);
      if (maxIndex !== -1) {
        dailyData[maxIndex].isHighlight = true;
      }
    }
    
    return dailyData;
  };

  // Calculate weekly statistics
  const calculateWeeklyStats = () => {
    const dailyData = calculateDailyData();
    const totalHours = dailyData.reduce((sum, day) => sum + day.hours, 0);
    const averageHours = parseFloat((totalHours / 7).toFixed(1));
    const daysWithWork = dailyData.filter(day => day.hours > 0).length;
    
    // Calculate consistency (% of days with work)
    const consistency = Math.round((daysWithWork / 7) * 100);
    
    // Calculate intensity (average hours on working days)
    const workingDaysAvg = daysWithWork > 0 
      ? parseFloat((totalHours / daysWithWork).toFixed(1))
      : 0;
    const intensity = Math.min(100, Math.round((workingDaysAvg / 8) * 100));
    
    // Overall score (weighted average)
    const focusEquilibrium = Math.round((consistency * 0.6) + (intensity * 0.4));
    
    return {
      totalHours,
      averageHours,
      daysWithWork,
      consistency,
      intensity,
      focusEquilibrium,
      dailyData
    };
  };

  // Calculate tasks completed this week
  const getWeeklyTaskStats = () => {
    const tasksData = localStorage.getItem('tasks');
    const tasks: Task[] = tasksData ? JSON.parse(tasksData) : [];
    
    const completedThisWeek = tasks.filter(task => {
      if (!task.completed || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= monday && completedDate <= sunday;
    });
    
    const totalThisWeek = tasks.filter(task => {
      if (!task.createdAt) return false;
      const createdDate = new Date(task.createdAt);
      return createdDate >= monday && createdDate <= sunday;
    });
    
    return {
      completed: completedThisWeek.length,
      total: totalThisWeek.length,
      completionRate: totalThisWeek.length > 0 
        ? Math.round((completedThisWeek.length / totalThisWeek.length) * 100)
        : 0
    };
  };

  // Get best performing day
  const getBestDay = (dailyData: DailyData[]) => {
    const maxHours = Math.max(...dailyData.map(d => d.hours));
    const bestDay = dailyData.find(d => d.hours === maxHours);
    return bestDay || dailyData[0];
  };

  // Get weakest day
  const getWeakestDay = (dailyData: DailyData[]) => {
    const workingDays = dailyData.filter(d => d.hours > 0);
    if (workingDays.length === 0) return dailyData[2]; // Default to Wednesday
    
    const minHours = Math.min(...workingDays.map(d => d.hours));
    const weakestDay = workingDays.find(d => d.hours === minHours);
    return weakestDay || dailyData[2];
  };

  // Format date range
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const mondayStr = monday.toLocaleDateString('en-US', options);
    const sundayStr = sunday.toLocaleDateString('en-US', options);
    const year = sunday.getFullYear();
    return `${mondayStr} — ${sundayStr}, ${year}`;
  };

  const stats = useMemo(() => calculateWeeklyStats(), []);
  const taskStats = useMemo(() => getWeeklyTaskStats(), []);
  const bestDay = useMemo(() => getBestDay(stats.dailyData), [stats.dailyData]);
  const weakestDay = useMemo(() => getWeakestDay(stats.dailyData), [stats.dailyData]);
  const dateRange = useMemo(() => formatDateRange(), []);

  return {
    stats,
    taskStats,
    bestDay,
    weakestDay,
    dateRange
  };
}
