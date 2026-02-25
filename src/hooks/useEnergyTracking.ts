import { useState, useEffect, useMemo } from 'react';

export interface EnergyLog {
  id: string;
  timestamp: number;
  level: number;
  mood: string;
  notes: string;
  activities: string[];
}

export interface EnergyDataPoint {
  time: string;
  hour: number;
  energy: number;
  productivity: number;
}

const STORAGE_KEY = 'kaal_energy_logs';

export function useEnergyTracking() {
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  const [currentEnergy, setCurrentEnergy] = useState(65);

  // Load energy logs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const logs = JSON.parse(stored);
        setEnergyLogs(logs);
        
        // Set current energy to the most recent log if available
        if (logs.length > 0) {
          const mostRecent = logs[logs.length - 1];
          setCurrentEnergy(mostRecent.level);
        }
      } catch (error) {
        console.error('Failed to parse energy logs:', error);
      }
    }
  }, []);

  // Save energy logs to localStorage
  const saveLogs = (logs: EnergyLog[]) => {
    setEnergyLogs(logs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  };

  // Log new energy level
  const logEnergy = (level: number, mood?: string, notes?: string, activities?: string[]) => {
    const newLog: EnergyLog = {
      id: `energy-${Date.now()}`,
      timestamp: Date.now(),
      level,
      mood: mood || getMoodFromLevel(level),
      notes: notes || '',
      activities: activities || []
    };

    const updatedLogs = [...energyLogs, newLog];
    saveLogs(updatedLogs);
    setCurrentEnergy(level);
    
    return newLog;
  };

  // Get mood label from energy level
  const getMoodFromLevel = (level: number): string => {
    if (level < 30) return 'low';
    if (level < 50) return 'zen';
    if (level < 70) return 'good';
    return 'high';
  };

  // Get energy label
  const getEnergyLabel = (level: number = currentEnergy): string => {
    if (level < 30) return 'Low';
    if (level < 50) return 'Zen';
    if (level < 70) return 'Good';
    return 'High';
  };

  // Get energy color
  const getEnergyColor = (level: number = currentEnergy): string => {
    if (level < 30) return '#6B7280';
    if (level < 50) return '#3B82F6';
    if (level < 70) return '#F59E0B';
    return '#F59E0B';
  };

  // Get today's energy logs
  const getTodayLogs = (): EnergyLog[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return energyLogs.filter(log => log.timestamp >= todayTimestamp);
  };

  // Get this week's energy logs
  const getWeekLogs = (): EnergyLog[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    
    return energyLogs.filter(log => log.timestamp >= monday.getTime());
  };

  // Calculate average energy for a period
  const calculateAverageEnergy = (logs: EnergyLog[]): number => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, log) => acc + log.level, 0);
    return Math.round(sum / logs.length);
  };

  // Generate chart data for today
  const getTodayChartData = (): EnergyDataPoint[] => {
    const todayLogs = getTodayLogs();
    const dataPoints: EnergyDataPoint[] = [];
    
    // If no logs today, generate mock data based on current energy
    if (todayLogs.length === 0) {
      const now = new Date();
      const currentHour = now.getHours();
      
      for (let hour = Math.max(6, currentHour - 7); hour <= currentHour; hour++) {
        const variation = Math.random() * 20 - 10;
        const energy = Math.max(20, Math.min(100, currentEnergy + variation));
        const productivity = Math.max(20, Math.min(100, energy + (Math.random() * 15 - 7.5)));
        
        dataPoints.push({
          time: `${hour}:00`,
          hour,
          energy: Math.round(energy),
          productivity: Math.round(productivity)
        });
      }
      
      return dataPoints;
    }
    
    // Group logs by hour
    const logsByHour = new Map<number, EnergyLog[]>();
    todayLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (!logsByHour.has(hour)) {
        logsByHour.set(hour, []);
      }
      logsByHour.get(hour)!.push(log);
    });
    
    // Create data points from actual logs
    logsByHour.forEach((logs, hour) => {
      const avgEnergy = calculateAverageEnergy(logs);
      const productivity = Math.max(20, Math.min(100, avgEnergy + (Math.random() * 15 - 7.5)));
      
      dataPoints.push({
        time: `${hour}:00`,
        hour,
        energy: avgEnergy,
        productivity: Math.round(productivity)
      });
    });
    
    // Sort by hour
    dataPoints.sort((a, b) => a.hour - b.hour);
    
    return dataPoints;
  };

  // Generate chart data for the week
  const getWeekChartData = (): EnergyDataPoint[] => {
    const weekLogs = getWeekLogs();
    const dataPoints: EnergyDataPoint[] = [];

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      currentDay.setHours(0, 0, 0, 0);

      const nextDay = new Date(currentDay);
      nextDay.setDate(currentDay.getDate() + 1);

      const dayLogs = weekLogs.filter(log =>
        log.timestamp >= currentDay.getTime() && log.timestamp < nextDay.getTime()
      );

      const avgEnergy = dayLogs.length > 0
        ? calculateAverageEnergy(dayLogs)
        : 0; // 0 = no data (don't show random values)

      // Productivity correlates with energy but with a small lag factor
      const productivity = avgEnergy > 0
        ? Math.min(100, Math.max(0, avgEnergy - 5 + (i % 2 === 0 ? 5 : -3)))
        : 0;

      dataPoints.push({
        time: days[i],
        hour: i,
        energy: avgEnergy,
        productivity: Math.round(productivity),
      });
    }

    return dataPoints;
  };

  // Generate SVG path from data points
  const generateSVGPath = (dataPoints: EnergyDataPoint[], key: 'energy' | 'productivity'): string => {
    if (dataPoints.length === 0) return '';
    
    const width = 400;
    const height = 200;
    const padding = 0;
    
    const xStep = (width - padding * 2) / (dataPoints.length - 1 || 1);
    
    const points = dataPoints.map((point, index) => {
      const x = padding + (index * xStep);
      const y = height - (point[key] / 100) * height;
      return { x, y };
    });
    
    // Create smooth curve using cubic bezier
    let path = `M${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      
      path += ` C${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }
    
    return path;
  };

  // Get AI suggestions based on current energy
  const getAISuggestions = () => {
    const suggestions = [];
    
    if (currentEnergy >= 70) {
      suggestions.push({
        type: 'deep-work',
        title: 'Deep Focus Block',
        description: 'Your energy is peaking. Perfect time for complex problem solving.',
        priority: 'high'
      });
    } else if (currentEnergy >= 50) {
      suggestions.push({
        type: 'collaboration',
        title: 'Team Sync',
        description: 'Social energy is stable. Good for collaborative tasks.',
        priority: 'medium'
      });
    } else {
      suggestions.push({
        type: 'recovery',
        title: 'Short Break',
        description: 'Energy is low. Take a 10-minute recharge break.',
        priority: 'high'
      });
    }
    
    return suggestions;
  };

  // Calculate next check-in time
  const getNextCheckIn = (): string => {
    const todayLogs = getTodayLogs();
    if (todayLogs.length === 0) return '2h';
    
    const lastLog = todayLogs[todayLogs.length - 1];
    const timeSinceLastLog = Date.now() - lastLog.timestamp;
    const hoursElapsed = Math.floor(timeSinceLastLog / (1000 * 60 * 60));
    
    if (hoursElapsed < 1) return '1h';
    if (hoursElapsed < 2) return '30m';
    return 'Now';
  };

  // Calculate weekly insight
  const getWeeklyInsight = (): string => {
    const weekLogs = getWeekLogs();
    if (weekLogs.length < 3) {
      return 'Not enough data yet. Keep logging your energy to see insights!';
    }
    
    const morningLogs = weekLogs.filter(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= 8 && hour < 12;
    });
    
    const afternoonLogs = weekLogs.filter(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= 12 && hour < 17;
    });
    
    const morningAvg = calculateAverageEnergy(morningLogs);
    const afternoonAvg = calculateAverageEnergy(afternoonLogs);
    
    if (morningAvg > afternoonAvg + 10) {
      return 'Your peak energy hours are in the morning (8am-12pm). Schedule deep work then!';
    } else if (afternoonAvg > morningAvg + 10) {
      return 'Your most productive hours shifted to afternoon (12pm-5pm) this week.';
    } else {
      return 'Your energy remains consistent throughout the day. Great stability!';
    }
  };

  const stats = useMemo(() => ({
    todayAverage: calculateAverageEnergy(getTodayLogs()),
    weekAverage: calculateAverageEnergy(getWeekLogs()),
    todayLogCount: getTodayLogs().length,
    weekLogCount: getWeekLogs().length,
    nextCheckIn: getNextCheckIn(),
    weeklyInsight: getWeeklyInsight()
  }), [energyLogs]);

  return {
    currentEnergy,
    setCurrentEnergy,
    energyLogs,
    logEnergy,
    getEnergyLabel,
    getEnergyColor,
    getTodayChartData,
    getWeekChartData,
    generateSVGPath,
    getAISuggestions,
    stats
  };
}