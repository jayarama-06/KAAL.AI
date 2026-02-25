/**
 * Task Service
 * Handles all task-related operations with Supabase backend
 * 
 * LOCK TIMEOUT FIX:
 * - Uses auth service for cached user state
 * - Prevents concurrent Supabase auth calls
 */

import { supabase } from './supabase-client';
import { authService } from './auth-service';
import { createTaskCreatedEvent, createTaskCompletedEvent, createTaskDeletedEvent } from './timeline-service';
import { ClarityTracking } from './clarity-service';
import { GoogleAnalytics } from './google-analytics-service';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// CamelCase to snake_case converter
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

// snake_case to camelCase converter
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

// =====================================================
// TYPES
// =====================================================

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  projectId?: string;
  tags?: string[];
  estimatedMinutes?: number;
  actualMinutes?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  endDate?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'completed' | 'reopened';
  changes: any;
  createdAt: string;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================================
// TASK OPERATIONS
// =====================================================

/**
 * Get all tasks for the current user
 */
export async function getTasks(filters?: {
  status?: Task['status'];
  priority?: Task['priority'];
  projectId?: string;
  search?: string;
}): Promise<ServiceResult<Task[]>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data.map(toCamelCase) };
  } catch (error: any) {
    // Silently handle AbortError - this is expected when requests are cancelled
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request cancelled' };
    }
    console.error('Error in getTasks:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<ServiceResult<Task>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: toCamelCase(data) };
  } catch (error: any) {
    console.error('Error in getTask:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Task>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const taskData = toSnakeCase({
      ...task,
      userId: user.id,
    });

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    }

    const camelTask = toCamelCase(data);
    
    // Log task creation event to timeline
    try {
      createTaskCreatedEvent(
        camelTask.id,
        user.id,
        camelTask.title,
        camelTask.priority,
        undefined // projectName - we can add project lookup later
      );
    } catch (timelineError) {
      console.error('Error creating timeline event:', timelineError);
      // Don't fail the task creation if timeline logging fails
    }

    // Track in Clarity
    ClarityTracking.taskCreated();

    // Track in Google Analytics
    GoogleAnalytics.tasks.created(camelTask.id, {
      priority: camelTask.priority,
      has_due_date: !!camelTask.dueDate,
      energy_level: camelTask.energyLevel,
    });

    return { success: true, data: camelTask };
  } catch (error: any) {
    console.error('Error in createTask:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<ServiceResult<Task>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Remove fields that shouldn't be updated
    const { id, userId, createdAt, updatedAt, ...updateData } = updates as any;

    const taskData = toSnakeCase(updateData);

    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: toCamelCase(data) };
  } catch (error: any) {
    console.error('Error in updateTask:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<ServiceResult<void>> {
  try {
    console.log('🗑️ Attempting to delete task:', taskId);
    
    const user = authService.getUser();
    if (!user) {
      console.error('❌ Delete failed: Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }

    console.log('✅ User authenticated:', user.id);

    // First, verify the task exists and belongs to the user
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, user_id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching task before delete:', fetchError);
      return { success: false, error: `Cannot find task: ${fetchError.message}` };
    }

    if (!existingTask) {
      console.error('❌ Task not found or does not belong to user');
      return { success: false, error: 'Task not found or access denied' };
    }

    console.log('✅ Task found:', existingTask.title);

    // Attempt to delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error deleting task:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // WORKAROUND: If error is about missing task_history table (from trigger)
      // The task might still be deleted despite the trigger error
      if (error.code === '42P01' && error.message?.includes('task_history')) {
        console.log('⚠️ Trigger error detected - task_history issue');
        console.log('⚠️ Note: Task history logging is disabled. Run /DROP_TRIGGERS_NOW.sql to fix.');
        
        // Return error - user needs to fix triggers in Supabase
        return { 
          success: false, 
          error: `Database trigger error. Please run /DROP_TRIGGERS_NOW.sql in Supabase SQL Editor to disable broken triggers.` 
        };
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ Task deleted successfully');
    // Log task deletion event to timeline
    try {
      createTaskDeletedEvent(taskId, user.id, existingTask.title);
    } catch (timelineError) {
      console.error('Error creating timeline event:', timelineError);
    }

    // Track in Clarity
    ClarityTracking.taskDeleted();

    // Track in Google Analytics
    GoogleAnalytics.tasks.deleted(taskId);

    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in deleteTask:', error);
    console.error('Exception details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle missing table error
    if (error.code === '42P01' && error.message?.includes('task_history')) {
      return { 
        success: false, 
        error: 'Database setup required. Please run /SUPABASE_MASTER_SETUP.sql in your Supabase SQL Editor.' 
      };
    }
    
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTaskComplete(taskId: string): Promise<ServiceResult<Task>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // First, get the current task with all details
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const isCompleted = currentTask.status === 'completed';
    const newStatus = isCompleted ? 'todo' : 'completed';
    const completedAt = isCompleted ? null : new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: completedAt,
      })
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling task:', error);
      return { success: false, error: error.message };
    }

    const camelTask = toCamelCase(data);

    // Log task completion event to timeline
    if (newStatus === 'completed') {
      try {
        createTaskCompletedEvent(
          camelTask.id,
          user.id,
          camelTask.title,
          camelTask.priority
        );
      } catch (timelineError) {
        console.error('Error creating timeline event:', timelineError);
      }
      
      // Track in Clarity
      ClarityTracking.taskCompleted();

      // Track in Google Analytics
      GoogleAnalytics.tasks.completed(camelTask.id);
    }

    return { success: true, data: camelTask };
  } catch (error: any) {
    console.error('Error in toggleTaskComplete:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// PROJECT OPERATIONS
// =====================================================

/**
 * Get all projects for the current user
 */
export async function getProjects(): Promise<ServiceResult<Project[]>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data.map(toCamelCase) };
  } catch (error: any) {
    console.error('Error in getProjects:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new project
 */
export async function createProject(project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Project>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const projectData = toSnakeCase({
      ...project,
      userId: user.id,
    });

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: toCamelCase(data) };
  } catch (error: any) {
    console.error('Error in createProject:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a project
 */
export async function updateProject(projectId: string, updates: Partial<Project>): Promise<ServiceResult<Project>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { id, userId, createdAt, updatedAt, ...updateData } = updates as any;
    const projectData = toSnakeCase(updateData);

    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: toCamelCase(data) };
  } catch (error: any) {
    console.error('Error in updateProject:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<ServiceResult<void>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteProject:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// TASK HISTORY & COMMENTS
// =====================================================

/**
 * Get task history
 */
export async function getTaskHistory(taskId: string): Promise<ServiceResult<TaskHistory[]>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data.map(toCamelCase) };
  } catch (error: any) {
    console.error('Error in getTaskHistory:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get task comments
 */
export async function getTaskComments(taskId: string): Promise<ServiceResult<TaskComment[]>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data.map(toCamelCase) };
  } catch (error: any) {
    console.error('Error in getTaskComments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a comment to a task
 */
export async function addTaskComment(taskId: string, content: string): Promise<ServiceResult<TaskComment>> {
  try {
    const user = authService.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: toCamelCase(data) };
  } catch (error: any) {
    console.error('Error in addTaskComment:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to task changes
 */
export function subscribeToTasks(callback: (payload: any) => void) {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        callback(toCamelCase(payload));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to project changes
 */
export function subscribeToProjects(callback: (payload: any) => void) {
  const channel = supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
      },
      (payload) => {
        callback(toCamelCase(payload));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}