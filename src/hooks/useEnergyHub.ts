import { useState, useEffect } from 'react';
import { energyLogsService } from '../services/supabase-service';
import { toast } from 'sonner@2.0.3';

export interface EnergyLog {
  id: string;
  timestamp: number;
  level: number;
  notes?: string;
  mood?: string;
  activity?: string;
}

export function useEnergyHub() {
  const [logs, setLogs] = useState<EnergyLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load logs from Supabase
  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await energyLogsService.getAll();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load energy logs:', error);
      toast.error('Failed to load energy logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const addLog = async (log: Omit<EnergyLog, 'id'>) => {
    try {
      const newLog = await energyLogsService.create(log);
      setLogs(prev => [newLog, ...prev]);
      toast.success('Energy level logged');
    } catch (error) {
      console.error('Failed to add energy log:', error);
      toast.error('Failed to save energy log');
    }
  };

  const updateLog = async (id: string, updates: Partial<EnergyLog>) => {
    try {
      await energyLogsService.update(id, updates);
      setLogs(prev => prev.map(log => 
        log.id === id ? { ...log, ...updates } : log
      ));
      toast.success('Energy log updated');
    } catch (error) {
      console.error('Failed to update energy log:', error);
      toast.error('Failed to update energy log');
    }
  };

  const deleteLog = async (id: string) => {
    try {
      await energyLogsService.delete(id);
      setLogs(prev => prev.filter(log => log.id !== id));
      toast.success('Energy log deleted');
    } catch (error) {
      console.error('Failed to delete energy log:', error);
      toast.error('Failed to delete energy log');
    }
  };

  const getTodayLogs = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return logs.filter(log => log.timestamp >= todayTimestamp);
  };

  const getAverageEnergyToday = () => {
    const todayLogs = getTodayLogs();
    if (todayLogs.length === 0) return 0;
    
    const sum = todayLogs.reduce((acc, log) => acc + log.level, 0);
    return Math.round(sum / todayLogs.length);
  };

  const getEnergyTrend = () => {
    if (logs.length < 2) return 'stable';
    
    const recent = logs.slice(0, 3);
    const older = logs.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((acc, log) => acc + log.level, 0) / recent.length;
    const olderAvg = older.reduce((acc, log) => acc + log.level, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return 'increasing';
    if (recentAvg < olderAvg - 0.5) return 'decreasing';
    return 'stable';
  };

  const getLastWeekData = () => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weekLogs = logs.filter(log => log.timestamp >= weekAgo);
    
    // Group by day
    const dayGroups: { [key: string]: EnergyLog[] } = {};
    weekLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const dayKey = date.toISOString().split('T')[0];
      if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
      dayGroups[dayKey].push(log);
    });
    
    return Object.entries(dayGroups).map(([date, logs]) => ({
      date,
      average: logs.reduce((acc, log) => acc + log.level, 0) / logs.length,
      count: logs.length
    }));
  };

  return {
    logs,
    loading,
    addLog,
    updateLog,
    deleteLog,
    getTodayLogs,
    getAverageEnergyToday,
    getEnergyTrend,
    getLastWeekData
  };
}
