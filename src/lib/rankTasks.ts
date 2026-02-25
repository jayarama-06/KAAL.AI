/**
 * KAAL Task Ranking Engine
 * 
 * Pure client-side logic — no API calls, no AI.
 * Scores tasks based on energy match, urgency, mode alignment, and fatigue.
 */

export interface RankedTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cognitive_load_score?: number; // 1-10
  required_mode?: 'deep_focus' | 'light_work' | 'admin';
  deadline_at?: string;
  estimated_minutes?: number;
  status: 'pending' | 'in_progress' | 'done' | 'deferred';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  match_score?: number;
  created_at?: string;
  [key: string]: any; // Allow other properties from existing tasks
}

export interface UserState {
  energy_level: number; // 1-3 (or 1-5, we'll normalize)
  cognitive_mode?: 'deep_focus' | 'light_work' | 'admin';
  time_horizon_minutes?: number;
  mood?: string;
  mental_clarity?: number;
  tasks_done_this_session?: number;
}

/**
 * Compute match score for a single task against current user state
 */
function computeMatchScore(task: RankedTask, userState: UserState): number {
  let score = 0;

  // 1. Energy compatibility (0-1 points)
  // How well does this task's difficulty match the user's energy?
  const taskDifficulty = (task.cognitive_load_score || 5) / 10; // Normalize to 0-1
  const userEnergy = Math.min(userState.energy_level / 3, 1); // Normalize 1-3 or 1-5 to 0-1
  const energyCompat = 1 - Math.abs(taskDifficulty - userEnergy);
  score += energyCompat;

  // 2. Urgency (0-2 points)
  // Tasks due soon score higher
  let hoursLeft = 48; // Default: treat as 48hrs away if no deadline
  if (task.deadline_at) {
    try {
      const deadlineMs = new Date(task.deadline_at).getTime();
      hoursLeft = Math.max(0, (deadlineMs - Date.now()) / 3600000);
    } catch {
      hoursLeft = 48;
    }
  }
  // Urgency increases as deadline approaches
  // 0 hours left = 2.0 points, 48+ hours = 0 points
  const urgency = Math.max(0, 2.0 - (hoursLeft / 24));
  score += urgency;

  // 3. Mode alignment (0-1 points)
  // Does the task mode match what the user said they can do now?
  const modeAlign = (task.required_mode && userState.cognitive_mode)
    ? (task.required_mode === userState.cognitive_mode ? 1.0 : 0.3)
    : 0.5; // Neutral if mode data missing
  score += modeAlign;

  // 4. Fatigue penalty (subtract 0-0.2 points)
  // The more tasks done this session, the lower the bonus
  const tasksDone = userState.tasks_done_this_session || 0;
  const fatigue = Math.min(0.2, 0.2 * (tasksDone / 5));
  score -= fatigue;

  // 5. Priority boost (0-0.5 points)
  // Give a small boost to manually set high-priority tasks
  const priorityBoost = task.priority === 'urgent' ? 0.5
    : task.priority === 'high' ? 0.3
    : task.priority === 'medium' ? 0.1
    : 0;
  score += priorityBoost;

  return Math.max(0, score); // Ensure non-negative
}

/**
 * Main ranking function
 * 
 * Takes existing task list and user state, returns sorted tasks with match_score
 */
export function rankTasks(
  tasks: RankedTask[],
  userState: UserState
): RankedTask[] {
  // Filter to only active tasks
  const activeTasks = tasks.filter(
    t => t.status === 'pending' || t.status === 'in_progress'
  );

  // Compute match score for each task
  const scored = activeTasks.map(task => ({
    ...task,
    match_score: computeMatchScore(task, userState),
  }));

  // Sort by match_score descending (highest first)
  return scored.sort((a, b) => {
    const scoreDiff = (b.match_score || 0) - (a.match_score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    
    // Tiebreaker: deadline (earlier first)
    if (a.deadline_at && b.deadline_at) {
      return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
    }
    if (a.deadline_at) return -1;
    if (b.deadline_at) return 1;
    
    // Final tiebreaker: created date (older first)
    if (a.created_at && b.created_at) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    
    return 0;
  });
}

/**
 * Helper: Get the top recommended task
 */
export function getTopTask(
  tasks: RankedTask[],
  userState: UserState
): RankedTask | null {
  const ranked = rankTasks(tasks, userState);
  return ranked.length > 0 ? ranked[0] : null;
}

/**
 * Helper: Check if a task is well-matched to current state
 * Returns true if match_score > 2.5 (out of ~4.5 max)
 */
export function isWellMatched(task: RankedTask, userState: UserState): boolean {
  const score = computeMatchScore(task, userState);
  return score > 2.5;
}
