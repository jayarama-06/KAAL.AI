// ═══════════════════════════════════════════════════════════════════════════
// KAAL Analytics - Type Definitions
// Shared types for all analytics engines
// ═══════════════════════════════════════════════════════════════════════════

export interface FocusSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  session_type: 'deep_work' | 'shallow_work' | 'admin' | 'break' | null;
  tasks_completed: number;
  avg_cls_this_session: number | null;
  interruptions: number;
  focus_score: number | null;
  energy_at_start: 1 | 2 | 3 | null;
  energy_at_end: 1 | 2 | 3 | null;
  created_at: string;
}

export interface DailyStats {
  id: string;
  user_id: string;
  date: string;
  productivity_score: number | null;
  deep_work_hours: number;
  shallow_work_hours: number;
  tasks_completed: number;
  tasks_deferred: number;
  avg_session_length_mins: number;
  deep_work_ratio: number;
  focus_consistency_score: number | null;
  best_focus_hour: number | null;
  cognitive_load_avg: number | null;
  milestone_id: string | null;
  anomaly_type: 'breakout_day' | 'burnout_risk' | null;
}

export interface Milestone {
  id: string;
  user_id: string;
  title: string;
  description: string;
  milestone_type: 'streak' | 'deep_work' | 'completion' | 'custom' | 'major';
  detected_at: string;
}

export interface HourlyHeatmap {
  user_id: string;
  hour_slot: number; // 0-23
  day_of_week: number; // 0-6
  avg_focus_score: number;
  session_count: number;
  avg_tasks_completed: number;
  avg_deep_work_ratio: number;
}

export interface UserModel {
  avg_session_duration_mins: number;
  peak_energy_hour: number;
  avg_daily_tasks: number;
  avg_productivity_score: number;
}

export interface SessionClassificationInput {
  duration_minutes: number;
  avg_cls_of_tasks: number;
  interruptions: number;
  tasks_completed: number;
}

export interface FocusSessionData {
  duration_minutes: number;
  tasks_completed: number;
  avg_cls_of_tasks: number;
  interruptions: number;
  energy_at_start: 1 | 2 | 3;
  energy_at_end: 1 | 2 | 3;
  session_type: 'deep_work' | 'shallow_work' | 'admin';
}

export type TrendDirection = 'increasing' | 'decreasing' | 'no_trend';
export type TrendStrength = 'strong' | 'moderate' | 'weak';

export interface TrendResult {
  direction: TrendDirection;
  strength: TrendStrength;
  display: string;
  sparkData: number[];
}

export type EventSignificance = 'MILESTONE' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TimelineEvent {
  type: 'task_completed' | 'streak_hit' | 'goal_completed' | 'deep_work_session' | 'milestone';
  title: string;
  subtitle: string;
  significance: EventSignificance;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface DetectedMilestone {
  title: string;
  description: string;
  type: 'streak' | 'deep_work' | 'completion' | 'score' | 'personal_best';
  significance: 'major' | 'regular';
}

export type AnomalyType = 'breakout_day' | 'burnout_risk' | 'high' | 'moderate' | 'normal';

export interface AnomalyResult {
  type: AnomalyType;
  zScore: number;
}

export interface BurnoutRisk {
  risk_level: 'none' | 'low' | 'medium' | 'high';
  signals: string[];
}
