/**
 * Timeline Service
 * Tracks user activity and creates timeline entries for significant events
 */

export interface TimelineEvent {
  id: string;
  userId: string;
  type: 'task_created' | 'task_completed' | 'task_deleted' | 'milestone' | 'deep_work' | 'note';
  title: string;
  description?: string;
  metadata?: {
    taskId?: string;
    taskTitle?: string;
    priority?: string;
    projectName?: string;
    score?: number;
    deepWorkHours?: number;
    tasksCompleted?: number;
  };
  timestamp: string;
  day: string;
  date: string;
  icon?: string;
  color?: string;
}

const STORAGE_KEY = 'kaal_timeline_events';

/**
 * Get all timeline events for the current user
 */
export function getTimelineEvents(userId: string): TimelineEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allEvents = JSON.parse(stored);
    return allEvents.filter((event: TimelineEvent) => event.userId === userId)
      .sort((a: TimelineEvent, b: TimelineEvent) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  } catch (error) {
    console.error('Error loading timeline events:', error);
    return [];
  }
}

/**
 * Add a new timeline event
 */
export function addTimelineEvent(event: Omit<TimelineEvent, 'id' | 'day' | 'date' | 'timestamp'>): TimelineEvent {
  try {
    const now = new Date();
    const newEvent: TimelineEvent = {
      ...event,
      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      day: now.toLocaleDateString('en-US', { weekday: 'short' }),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const allEvents = stored ? JSON.parse(stored) : [];
    
    allEvents.push(newEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));
    
    return newEvent;
  } catch (error) {
    console.error('Error adding timeline event:', error);
    throw error;
  }
}

/**
 * Delete a timeline event
 */
export function deleteTimelineEvent(eventId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const allEvents = JSON.parse(stored);
    const filtered = allEvents.filter((event: TimelineEvent) => event.id !== eventId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting timeline event:', error);
  }
}

/**
 * Create event when task is created
 */
export function createTaskCreatedEvent(
  taskId: string,
  userId: string,
  taskTitle: string,
  priority: string,
  projectName?: string
): TimelineEvent {
  return addTimelineEvent({
    userId,
    type: 'task_created',
    title: 'Task Created',
    description: taskTitle,
    metadata: {
      taskId,
      taskTitle,
      priority,
      projectName,
    },
    icon: '✓',
    color: '#3B82F6',
  });
}

/**
 * Create event when task is completed
 */
export function createTaskCompletedEvent(
  taskId: string,
  userId: string,
  taskTitle: string,
  priority: string
): TimelineEvent {
  return addTimelineEvent({
    userId,
    type: 'task_completed',
    title: 'Task Completed',
    description: taskTitle,
    metadata: {
      taskId,
      taskTitle,
      priority,
    },
    icon: '✓',
    color: '#10B981',
  });
}

/**
 * Create event when task is deleted
 */
export function createTaskDeletedEvent(
  taskId: string,
  userId: string,
  taskTitle: string
): TimelineEvent {
  return addTimelineEvent({
    userId,
    type: 'task_deleted',
    title: 'Task Deleted',
    description: taskTitle,
    metadata: {
      taskId,
      taskTitle,
    },
    icon: '🗑',
    color: '#EF4444',
  });
}

/**
 * Create milestone event
 */
export function createMilestoneEvent(
  userId: string,
  title: string,
  description: string
): TimelineEvent {
  return addTimelineEvent({
    userId,
    type: 'milestone',
    title,
    description,
    icon: '🏆',
    color: '#8B5CF6',
  });
}

/**
 * Create daily summary event
 */
export function createDailySummaryEvent(
  userId: string,
  score: number,
  tasksCompleted: number,
  deepWorkHours: number
): TimelineEvent {
  return addTimelineEvent({
    userId,
    type: 'deep_work',
    title: 'Daily Summary',
    description: `Completed ${tasksCompleted} tasks with ${deepWorkHours}h deep work`,
    metadata: {
      score,
      tasksCompleted,
      deepWorkHours,
    },
    icon: '📊',
    color: '#6366F1',
  });
}

/**
 * Clear all events for a user (for testing)
 */
export function clearTimelineEvents(userId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const allEvents = JSON.parse(stored);
    const filtered = allEvents.filter((event: TimelineEvent) => event.userId !== userId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing timeline events:', error);
  }
}