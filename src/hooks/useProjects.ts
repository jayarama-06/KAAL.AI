/**
 * useProjects Hook
 * React hook for managing projects with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  subscribeToProjects,
  Project,
} from '../services/task-service';
import { toast } from 'sonner@2.0.3';

interface UseProjectsOptions {
  realtime?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getProjects();

    if (result.success && result.data) {
      setProjects(result.data);
    } else {
      setError(result.error || 'Failed to fetch projects');
    }

    setIsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Real-time updates
  useEffect(() => {
    if (!options.realtime) return;

    const unsubscribe = subscribeToProjects((payload) => {
      console.log('Real-time project update:', payload);
      
      if (payload.eventType === 'INSERT') {
        setProjects((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setProjects((prev) =>
          prev.map((project) => (project.id === payload.new.id ? payload.new : project))
        );
      } else if (payload.eventType === 'DELETE') {
        setProjects((prev) => prev.filter((project) => project.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, [options.realtime]);

  // Create project
  const create = useCallback(async (projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const result = await createProject(projectData);

    if (result.success && result.data) {
      toast.success('Project created!');
      if (!options.realtime) {
        setProjects((prev) => [result.data!, ...prev]);
      }
      return result.data;
    } else {
      toast.error(result.error || 'Failed to create project');
      return null;
    }
  }, [options.realtime]);

  // Update project
  const update = useCallback(async (projectId: string, updates: Partial<Project>) => {
    const result = await updateProject(projectId, updates);

    if (result.success && result.data) {
      toast.success('Project updated!');
      if (!options.realtime) {
        setProjects((prev) =>
          prev.map((project) => (project.id === projectId ? result.data! : project))
        );
      }
      return result.data;
    } else {
      toast.error(result.error || 'Failed to update project');
      return null;
    }
  }, [options.realtime]);

  // Delete project
  const remove = useCallback(async (projectId: string) => {
    const result = await deleteProject(projectId);

    if (result.success) {
      toast.success('Project deleted!');
      if (!options.realtime) {
        setProjects((prev) => prev.filter((project) => project.id !== projectId));
      }
      return true;
    } else {
      toast.error(result.error || 'Failed to delete project');
      return false;
    }
  }, [options.realtime]);

  return {
    projects,
    isLoading,
    error,
    refresh: fetchProjects,
    create,
    update,
    remove,
  };
}
