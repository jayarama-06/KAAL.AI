import { useState, useEffect } from 'react';
import { remindersService, Reminder } from '../services/supabase-service';
import { toast } from 'sonner@2.0.3';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reminders from Supabase
  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await remindersService.getAll();
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'userId'>) => {
    try {
      const newReminder = await remindersService.create(reminder);
      setReminders(prev => [...prev, newReminder]);
      toast.success('Reminder created');
      return newReminder;
    } catch (error) {
      console.error('Failed to add reminder:', error);
      toast.error('Failed to create reminder');
      throw error;
    }
  };

  const updateReminder = async (reminderId: string, updates: Partial<Reminder>) => {
    try {
      await remindersService.update(reminderId, updates);
      setReminders(prev => prev.map(r => 
        r.reminderId === reminderId ? { ...r, ...updates } : r
      ));
      toast.success('Reminder updated');
    } catch (error) {
      console.error('Failed to update reminder:', error);
      toast.error('Failed to update reminder');
      throw error;
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      await remindersService.delete(reminderId);
      setReminders(prev => prev.filter(r => r.reminderId !== reminderId));
      toast.success('Reminder deleted');
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      toast.error('Failed to delete reminder');
      throw error;
    }
  };

  const toggleComplete = async (reminderId: string) => {
    const reminder = reminders.find(r => r.reminderId === reminderId);
    if (!reminder) return;

    await updateReminder(reminderId, { completed: !reminder.completed });
  };

  const getUpcoming = () => {
    const now = Date.now();
    return reminders
      .filter(r => !r.completed && r.dueDate >= now)
      .sort((a, b) => a.dueDate - b.dueDate);
  };

  const getOverdue = () => {
    const now = Date.now();
    return reminders
      .filter(r => !r.completed && r.dueDate < now)
      .sort((a, b) => b.dueDate - a.dueDate);
  };

  const getCompleted = () => {
    return reminders
      .filter(r => r.completed)
      .sort((a, b) => b.dueDate - a.dueDate);
  };

  const getTodayReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reminders.filter(r => 
      !r.completed && 
      r.dueDate >= today.getTime() && 
      r.dueDate < tomorrow.getTime()
    );
  };

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleComplete,
    getUpcoming,
    getOverdue,
    getCompleted,
    getTodayReminders
  };
}
