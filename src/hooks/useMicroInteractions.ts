/**
 * Hook to manage micro-interactions (scheduled + state-triggered)
 * Runs in background, triggers toasts at the right time
 */

import { useEffect, useState } from 'react';
import { microInteractions } from '../services/micro-interaction-service';
import { supabase } from '../services/supabase-client';

export function useMicroInteractions(userId: string | null) {
  const [shouldCheckInteractions, setShouldCheckInteractions] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Generate scheduled interactions every hour
    const scheduleInterval = setInterval(async () => {
      await microInteractions.generateScheduledInteractions(userId);
      setShouldCheckInteractions(prev => !prev); // Trigger re-check
    }, 60 * 60 * 1000); // Every hour

    // Initial check
    microInteractions.generateScheduledInteractions(userId);

    return () => clearInterval(scheduleInterval);
  }, [userId]);

  // Listen for task completions (state-triggered interactions)
  useEffect(() => {
    if (!userId) return;

    const taskCompletionChannel = supabase
      .channel('task_completions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const oldTask = payload.old as any;
          const newTask = payload.new as any;

          // Task just completed
          if (!oldTask.completed && newTask.completed) {
            await microInteractions.generateStateTriggeredInteraction(
              userId,
              'task_completed',
              {
                taskId: newTask.id,
                taskTitle: newTask.title,
                estimatedMinutes: newTask.estimated_minutes,
              }
            );
            setShouldCheckInteractions(prev => !prev);
          }
        }
      )
      .subscribe();

    return () => {
      taskCompletionChannel.unsubscribe();
    };
  }, [userId]);

  // Detect rapid completions (state-triggered celebration)
  useEffect(() => {
    if (!userId) return;

    let completionCount = 0;
    let completionWindow = Date.now();

    const rapidCompletionChannel = supabase
      .channel('rapid_completions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newTask = payload.new as any;
          
          if (newTask.completed) {
            const now = Date.now();
            
            // Reset window if more than 2 hours passed
            if (now - completionWindow > 2 * 60 * 60 * 1000) {
              completionCount = 0;
              completionWindow = now;
            }

            completionCount++;

            // 5+ tasks in 2 hours = rapid completion!
            if (completionCount >= 5) {
              await microInteractions.generateStateTriggeredInteraction(
                userId,
                'rapid_completions',
                {
                  count: completionCount,
                  timeWindow: '2 hours',
                }
              );
              setShouldCheckInteractions(prev => !prev);
              completionCount = 0; // Reset to avoid spam
            }
          }
        }
      )
      .subscribe();

    return () => {
      rapidCompletionChannel.unsubscribe();
    };
  }, [userId]);

  // Detect inactivity (state-triggered check-in)
  useEffect(() => {
    if (!userId) return;

    let lastActivityTime = Date.now();
    let inactivityCheckInterval: NodeJS.Timeout;

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check for inactivity every 15 minutes
    inactivityCheckInterval = setInterval(async () => {
      const now = Date.now();
      const inactiveMinutes = (now - lastActivityTime) / (1000 * 60);

      // 2+ hours of inactivity
      if (inactiveMinutes >= 120) {
        await microInteractions.generateStateTriggeredInteraction(
          userId,
          'long_inactivity',
          {
            inactiveMinutes: Math.round(inactiveMinutes),
          }
        );
        setShouldCheckInteractions(prev => !prev);
        lastActivityTime = now; // Reset to avoid spam
      }
    }, 15 * 60 * 1000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheckInterval);
    };
  }, [userId]);

  // Monitor streaks (state-triggered celebration)
  useEffect(() => {
    if (!userId) return;

    const checkStreaks = async () => {
      try {
        const { data, error } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', userId)
          .eq('streak_type', 'daily_checkin')
          .single();

        if (error) {
          // Silent mode: Only log in debug mode for optional proactive intelligence features
          if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
            if (false) { // debug logging removed — no import.meta.env in Figma Make
              console.info('ℹ️ User streaks: Database table not found (optional proactive intelligence feature)');
            }
            return;
          }
          return;
        }

        if (data && data.current_count > 0) {
          // Celebrate milestones
          const milestones = [3, 7, 14, 30, 50, 100];
          if (milestones.includes(data.current_count)) {
            await microInteractions.generateStateTriggeredInteraction(
              userId,
              'streak_milestone',
              {
                milestone: data.current_count,
                streakType: 'daily_checkin',
              }
            );
            setShouldCheckInteractions(prev => !prev);
          }
        }
      } catch (error: any) {
        // Silent mode for table not found errors
        if (error?.code === 'PGRST204' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
          if (false) { // debug logging removed — no import.meta.env in Figma Make
            console.info('ℹ️ User streaks: Database table not found (optional proactive intelligence feature)');
          }
          return;
        }
      }
    };

    // Check streaks once per day
    const streakInterval = setInterval(checkStreaks, 24 * 60 * 60 * 1000);
    checkStreaks(); // Initial check

    return () => clearInterval(streakInterval);
  }, [userId]);

  return { shouldCheckInteractions };
}