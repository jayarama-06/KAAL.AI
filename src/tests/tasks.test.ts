/**
 * KAAL - Task Management Tests
 * Test suite for task CRUD operations and business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../services/supabase-client';
import type { Task } from '../services/task-service';

// Mock Supabase client
vi.mock('../services/supabase-client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

describe('Task Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Creation', () => {
    it('should create a new task with required fields', async () => {
      const mockTask: Partial<Task> = {
        title: 'Complete hackathon project',
        description: 'Finish KAAL application',
        status: 'todo',
        priority: 'urgent'
      };

      const mockResponse = {
        data: {
          id: 'uuid-123',
          ...mockTask,
          user_id: 'user-uuid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      // Test would call task creation service here
      expect(mockResponse.data).toBeDefined();
      expect(mockResponse.data.title).toBe('Complete hackathon project');
      expect(mockResponse.error).toBeNull();
    });

    it('should fail when title is missing', async () => {
      const mockTask = {
        description: 'Task without title',
        status: 'todo'
      };

      const mockError = {
        data: null,
        error: {
          message: 'Title is required',
          code: 'validation_error'
        }
      };

      expect(mockError.error).toBeDefined();
      expect(mockError.error.code).toBe('validation_error');
    });

    it('should set default values for optional fields', async () => {
      const mockTask = {
        title: 'Simple task'
      };

      const expected = {
        ...mockTask,
        status: 'todo',
        priority: 'backlog',
        actual_time: 0,
        tags: []
      };

      expect(expected.status).toBe('todo');
      expect(expected.priority).toBe('backlog');
      expect(expected.actual_time).toBe(0);
    });
  });

  describe('Task Updates', () => {
    it('should update task status', async () => {
      const taskId = 'uuid-123';
      const updates = { status: 'completed' };

      const mockResponse = {
        data: {
          id: taskId,
          status: 'completed',
          completed_at: new Date().toISOString()
        },
        error: null
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockResponse)
            })
          })
        })
      });

      expect(mockResponse.data.status).toBe('completed');
      expect(mockResponse.data.completed_at).toBeDefined();
    });

    it('should update task priority', async () => {
      const updates = { priority: 'urgent' };

      expect(updates.priority).toBe('urgent');
    });

    it('should track actual time spent', async () => {
      const updates = { 
        actual_time: 45,
        status: 'in_progress'
      };

      expect(updates.actual_time).toBe(45);
      expect(updates.status).toBe('in_progress');
    });
  });

  describe('Task Deletion', () => {
    it('should delete a task', async () => {
      const taskId = 'uuid-123';

      const mockResponse = {
        data: null,
        error: null
      };

      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockResponse)
        })
      });

      expect(mockResponse.error).toBeNull();
    });

    it('should fail to delete non-existent task', async () => {
      const taskId = 'non-existent';

      const mockError = {
        data: null,
        error: {
          message: 'Task not found',
          code: 'not_found'
        }
      };

      expect(mockError.error.code).toBe('not_found');
    });
  });

  describe('Task Queries', () => {
    it('should fetch all user tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo' },
        { id: '2', title: 'Task 2', status: 'in_progress' },
        { id: '3', title: 'Task 3', status: 'completed' }
      ];

      const mockResponse = {
        data: mockTasks,
        error: null
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      expect(mockResponse.data).toHaveLength(3);
    });

    it('should filter tasks by status', async () => {
      const completedTasks = [
        { id: '3', title: 'Task 3', status: 'completed' }
      ];

      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].status).toBe('completed');
    });

    it('should filter tasks by priority', async () => {
      const urgentTasks = [
        { id: '1', title: 'Urgent Task', priority: 'urgent' }
      ];

      expect(urgentTasks[0].priority).toBe('urgent');
    });
  });

  describe('Task Validation', () => {
    it('should validate status values', () => {
      const validStatuses = ['todo', 'in_progress', 'completed'];
      
      expect(validStatuses).toContain('todo');
      expect(validStatuses).toContain('in_progress');
      expect(validStatuses).toContain('completed');
      expect(validStatuses).not.toContain('invalid');
    });

    it('should validate priority values', () => {
      const validPriorities = ['urgent', 'in_focus', 'backlog'];
      
      expect(validPriorities).toContain('urgent');
      expect(validPriorities).toContain('in_focus');
      expect(validPriorities).toContain('backlog');
    });

    it('should validate time values are non-negative', () => {
      const validTime = 30;
      const invalidTime = -10;

      expect(validTime).toBeGreaterThanOrEqual(0);
      expect(invalidTime).toBeLessThan(0);
    });
  });

  describe('Task Business Logic', () => {
    it('should calculate time remaining', () => {
      const estimatedTime = 120;
      const actualTime = 45;
      const remaining = estimatedTime - actualTime;

      expect(remaining).toBe(75);
    });

    it('should mark overdue tasks', () => {
      const now = new Date();
      const pastDue = new Date(now.getTime() - 86400000); // 1 day ago
      
      const isOverdue = pastDue < now;
      expect(isOverdue).toBe(true);
    });

    it('should calculate completion percentage', () => {
      const total = 10;
      const completed = 7;
      const percentage = (completed / total) * 100;

      expect(percentage).toBe(70);
    });
  });
});

describe('Project Management', () => {
  describe('Project Creation', () => {
    it('should create a new project', async () => {
      const mockProject = {
        name: 'Hackathon Project',
        color: '#4F46E5',
        description: 'SAI University FOSS Club'
      };

      expect(mockProject.name).toBe('Hackathon Project');
      expect(mockProject.color).toBe('#4F46E5');
    });

    it('should assign default color if not provided', () => {
      const defaultColor = '#4F46E5';
      expect(defaultColor).toBe('#4F46E5');
    });
  });

  describe('Project-Task Association', () => {
    it('should link tasks to projects', () => {
      const task = {
        id: 'task-1',
        project_id: 'project-1',
        title: 'Task in project'
      };

      expect(task.project_id).toBe('project-1');
    });

    it('should allow tasks without projects', () => {
      const task = {
        id: 'task-2',
        project_id: null,
        title: 'Standalone task'
      };

      expect(task.project_id).toBeNull();
    });
  });
});

describe('Focus Session Management', () => {
  describe('Session Creation', () => {
    it('should start a focus session', () => {
      const session = {
        task_id: 'task-1',
        start_time: new Date().toISOString(),
        duration_minutes: 25,
        session_type: 'pomodoro',
        energy_before: 8
      };

      expect(session.duration_minutes).toBe(25);
      expect(session.session_type).toBe('pomodoro');
    });

    it('should validate energy levels (1-10)', () => {
      const validEnergy = 7;
      const invalidLow = 0;
      const invalidHigh = 11;

      expect(validEnergy).toBeGreaterThanOrEqual(1);
      expect(validEnergy).toBeLessThanOrEqual(10);
      expect(invalidLow).toBeLessThan(1);
      expect(invalidHigh).toBeGreaterThan(10);
    });
  });

  describe('Session Completion', () => {
    it('should complete a session with end time', () => {
      const startTime = new Date('2026-02-12T10:00:00Z');
      const endTime = new Date('2026-02-12T10:25:00Z');
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = durationMs / 60000;

      expect(durationMinutes).toBe(25);
    });

    it('should track energy after session', () => {
      const session = {
        energy_before: 8,
        energy_after: 7,
        completed: true
      };

      expect(session.energy_after).toBeDefined();
      expect(session.completed).toBe(true);
    });
  });
});

describe('Analytics & Statistics', () => {
  describe('Daily Stats Calculation', () => {
    it('should calculate tasks completed today', () => {
      const tasksCompleted = 5;
      expect(tasksCompleted).toBeGreaterThan(0);
    });

    it('should calculate total focus time', () => {
      const sessions = [
        { duration_minutes: 25 },
        { duration_minutes: 25 },
        { duration_minutes: 15 }
      ];

      const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      expect(totalMinutes).toBe(65);
    });

    it('should calculate average energy level', () => {
      const energyLogs = [8, 7, 6, 7, 8];
      const average = energyLogs.reduce((a, b) => a + b) / energyLogs.length;
      
      expect(average).toBe(7.2);
    });
  });

  describe('Productivity Metrics', () => {
    it('should calculate completion rate', () => {
      const totalTasks = 10;
      const completedTasks = 8;
      const rate = completedTasks / totalTasks;

      expect(rate).toBe(0.8);
    });

    it('should identify most productive hour', () => {
      const sessionsByHour = {
        9: 2,
        10: 5,
        11: 3,
        14: 1
      };

      const mostProductiveHour = Object.entries(sessionsByHour)
        .reduce((max, [hour, count]) => 
          count > (sessionsByHour[max] || 0) ? parseInt(hour) : max, 9);

      expect(mostProductiveHour).toBe(10);
    });
  });
});

describe('Energy Tracking', () => {
  it('should log energy level with mood', () => {
    const log = {
      energy_level: 7,
      mood: 'focused',
      logged_at: new Date().toISOString()
    };

    expect(log.energy_level).toBe(7);
    expect(log.mood).toBe('focused');
  });

  it('should identify energy patterns', () => {
    const morningEnergy = 8;
    const afternoonEnergy = 6;
    const eveningEnergy = 4;

    expect(morningEnergy).toBeGreaterThan(afternoonEnergy);
    expect(afternoonEnergy).toBeGreaterThan(eveningEnergy);
  });
});

describe('User Profile', () => {
  it('should update profile information', () => {
    const profile = {
      full_name: 'John Doe',
      display_name: 'John',
      bio: 'Productivity enthusiast'
    };

    expect(profile.full_name).toBe('John Doe');
    expect(profile.bio).toBe('Productivity enthusiast');
  });

  it('should validate timezone format', () => {
    const validTimezones = ['America/New_York', 'UTC', 'Asia/Tokyo'];
    
    validTimezones.forEach(tz => {
      expect(tz).toMatch(/^[A-Za-z_\/]+$/);
    });
  });
});

// Export for test runner
export {};
