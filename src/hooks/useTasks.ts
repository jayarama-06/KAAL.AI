/**
 * useTasks Hook
 * React hook for managing tasks with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  subscribeToTasks,
  Task,
} from '../services/task-service';
import { toast } from 'sonner@2.0.3';

interface UseTasksOptions {
  status?: Task['status'];
  priority?: Task['priority'];
  projectId?: string;
  search?: string;
  realtime?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getTasks({
      status: options.status,
      priority: options.priority,
      projectId: options.projectId,
      search: options.search,
    });

    if (result.success && result.data) {
      setTasks(result.data);
    } else {
      // Don't show error for cancelled requests
      if (result.error !== 'Request cancelled') {
        setError(result.error || 'Failed to fetch tasks');
      }
    }

    setIsLoading(false);
  }, [options.status, options.priority, options.projectId, options.search]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time updates
  useEffect(() => {
    if (!options.realtime) return;

    const unsubscribe = subscribeToTasks((payload) => {
      console.log('Real-time task update:', payload);
      
      if (payload.eventType === 'INSERT') {
        // Prevent duplicates - only add if task doesn't already exist
        setTasks((prev) => {
          const exists = prev.some((task) => task.id === payload.new.id);
          if (exists) {
            console.log('⚠️ Task already exists in state, skipping duplicate INSERT');
            return prev;
          }
          return [payload.new, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        setTasks((prev) =>
          prev.map((task) => (task.id === payload.new.id ? payload.new : task))
        );
      } else if (payload.eventType === 'DELETE') {
        setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, [options.realtime]);

  // Create task
  const create = useCallback(async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const result = await createTask(taskData);

    if (result.success && result.data) {
      toast.success('Task created!');
      // OPTIMISTIC UPDATE: Add task immediately to UI even with realtime enabled
      // This prevents delay in task card display
      setTasks((prev) => [result.data!, ...prev]);
      return result.data;
    } else {
      toast.error(result.error || 'Failed to create task');
      return null;
    }
  }, []);

  // Update task
  const update = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // OPTIMISTIC UPDATE: Update UI immediately
    const oldTasks = tasks;
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );

    const result = await updateTask(taskId, updates);

    if (result.success && result.data) {
      toast.success('Task updated!');
      // Replace optimistic update with actual data from server
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? result.data! : task))
      );
      return result.data;
    } else {
      // ROLLBACK: Revert to old tasks if update failed
      setTasks(oldTasks);
      toast.error(result.error || 'Failed to update task');
      return null;
    }
  }, [tasks]);

  // Delete task
  const remove = useCallback(async (taskId: string) => {
    console.log('🗑️ useTasks: Starting task deletion for:', taskId);
    
    // OPTIMISTIC UPDATE - Remove from UI immediately
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    
    const result = await deleteTask(taskId);

    if (result.success) {
      console.log('✅ useTasks: Task deleted successfully');
      toast.success('Task deleted!');
      return true;
    } else {
      console.error('❌ useTasks: Delete failed:', result.error);
      
      // ROLLBACK - Add task back if delete failed
      // We need to refetch to get the correct state
      await fetchTasks();
      
      // Check if it's a missing table error (42P01)
      if (result.error?.includes('Missing database table') || result.error?.includes('EMERGENCY_DELETE_FIX.sql')) {
        toast.error('⚠️ Database Setup Required', {
          description: '📋 Run /EMERGENCY_DELETE_FIX.sql in Supabase SQL Editor. Click Help for instructions.',
          duration: 10000,
          action: {
            label: 'Help',
            onClick: () => {
              window.open('https://supabase.com/dashboard/project/_/sql', '_blank');
            },
          },
        });
      } else if (result.error?.includes('Cannot find task')) {
        toast.error('Task not found', {
          description: result.error,
          duration: 5000,
        });
      } else if (result.error?.includes('access denied')) {
        toast.error('Access denied', {
          description: result.error,
          duration: 5000,
        });
      } else {
        toast.error('Failed to delete task', {
          description: result.error || 'Unknown error occurred',
          duration: 5000,
        });
      }
      return false;
    }
  }, [fetchTasks]);

  // Toggle complete
  const toggleComplete = useCallback(async (taskId: string) => {
    // OPTIMISTIC UPDATE: Toggle completion status immediately
    const oldTasks = tasks;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              status: task.status === 'completed' ? 'todo' : 'completed',
            }
          : task
      )
    );

    const result = await toggleTaskComplete(taskId);

    if (result.success && result.data) {
      const isCompleted = result.data.status === 'completed';
      toast.success(isCompleted ? '✓ Task completed!' : 'Task reopened');
      // Replace optimistic update with actual data from server
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? result.data! : task))
      );
      return result.data;
    } else {
      // ROLLBACK: Revert to old tasks if toggle failed
      setTasks(oldTasks);
      toast.error(result.error || 'Failed to toggle task');
      return null;
    }
  }, [tasks]);

  return {
    tasks,
    isLoading,
    error,
    refresh: fetchTasks,
    create,
    update,
    remove,
    toggleComplete,
  };
}

/**
 * Hook for a single task
 */
export function useTask(taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setIsLoading(false);
      return;
    }

    const fetchTask = async () => {
      setIsLoading(true);
      const result = await getTask(taskId);

      if (result.success && result.data) {
        setTask(result.data);
      } else {
        setError(result.error || 'Failed to fetch task');
      }

      setIsLoading(false);
    };

    fetchTask();
  }, [taskId]);

  return { task, isLoading, error };
}