import { useState, useEffect, useCallback, useRef } from "react";
import {
  Flame, Zap, Brain, Sparkles, CheckSquare,
  Timer, ArrowRight, Circle, CheckCircle2,
  AlertCircle, Clock, TrendingUp
} from "lucide-react";
import { FocusFlowModal } from "./FocusFlowModal";
import { useNavigate } from "react-router";
import { useProfile } from "../context/ProfileContext";
import { storageService } from "../services/storage-service";
import { toast } from "sonner@2.0.3";
import { useTasks } from "../hooks/useTasks";
import { AIStatusChip } from "./ProactiveAICoach";
import { proactiveAI } from "../services/proactive-ai";
import { Task } from "../services/task-service";
import { toggleTaskComplete } from "../services/task-service";
import { ScreenHeader, SCREEN_ANIMATIONS } from "./ui/ScreenHeader";
import { AnimatePresence } from "motion/react";

// ─── Intelligence Layer Imports ───────────────────────────────────────────────
import { rankTasks, RankedTask, UserState } from "../lib/rankTasks";
import {
  createNudgeEngineState,
  shouldShowNudge,
  markNudgeSent,
  markNudgeDismissed,
  markNudgeActedOn,
  updateEnergyLevel,
  NudgeEngineState,
} from "../lib/nudgeEngine";
import { NudgeOverlay } from "./NudgeOverlay";
import { generateNudgeMessage, logNudgeEvent, getNudgeHistoryHint } from "../services/nudge-service";
import { supabase } from "../services/supabase-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayStats {
  focusMinutes: number;
  tasksCompleted: number;
  sessionsCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  urgent: 0, high: 1, medium: 2, low: 3,
};
const PRIORITY_COLOR: Record<Task["priority"], string> = {
  urgent: "#DC2626", high: "#D97706", medium: "#2563EB", low: "#6B7280",
};
const PRIORITY_BG: Record<Task["priority"], string> = {
  urgent: "rgba(220,38,38,0.08)", high: "rgba(217,119,6,0.08)",
  medium: "rgba(37,99,235,0.08)", low: "rgba(107,114,128,0.08)",
};

function formatDue(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff}d`;
}

function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}

// Derive a contextual KAAL insight from real data
function deriveKaalInsight(
  hour: number,
  pending: number,
  overdue: number,
  focusMinutes: number,
  streak: number
): { headline: string; body: string; accent: string } {
  if (overdue > 0) return {
    headline: `${overdue} task${overdue > 1 ? "s are" : " is"} overdue`,
    body: "Clearing overdue work first protects your mental bandwidth. Pick the smallest one and knock it out — momentum compounds.",
    accent: "#DC2626",
  };
  if (focusMinutes === 0 && hour >= 9 && hour < 14) return {
    headline: "No focus time logged yet",
    body: "Your peak cognitive window is likely right now. Start a 25-minute session — even a short block builds the habit.",
    accent: "#D97706",
  };
  if (focusMinutes >= 240) return {
    headline: "4+ hours of deep work today",
    body: "You're operating at elite level today. Protect your remaining energy — guard against context-switching and shallow requests.",
    accent: "#059669",
  };
  if (pending === 0) return {
    headline: "Task board is clear",
    body: "Nothing pending — use this window for strategic thinking, learning, or getting ahead on tomorrow's priorities.",
    accent: "#7C3AED",
  };
  if (streak >= 7) return {
    headline: `${streak}-day streak — keep the momentum`,
    body: "Consistency beats intensity. Your streak signals a real system is forming. Today's session is the bridge to tomorrow.",
    accent: "#D97706",
  };
  if (hour >= 14 && hour < 17) return {
    headline: "Post-lunch dip window",
    body: "Cognitive energy typically dips 2–4pm. Use this for reviews, admin, or low-stakes tasks. Save creative work for later.",
    accent: "#6B7280",
  };
  if (hour >= 17) return {
    headline: "Evening — protect the transition",
    body: `You have ${pending} task${pending > 1 ? "s" : ""} open. Close loops, write tomorrow's top 3, then fully disconnect.`,
    accent: "#111827",
  };
  return {
    headline: `${pending} task${pending > 1 ? "s" : ""} ready to tackle`,
    body: "KAAL is monitoring your patterns. Start with your highest-priority task while your focus is fresh.",
    accent: "#111827",
  };
}

// ─── Glass style constants ────────────────────────────────────────────────────

const GLASS = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
} as React.CSSProperties;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaskRow({ task, onComplete, isTopRanked }: { task: Task; onComplete: (id: string) => void; isTopRanked?: boolean }) {
  const [completing, setCompleting] = useState(false);
  const due = formatDue(task.dueDate);
  const overdue = isOverdue(task.dueDate);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(task.id);
    setCompleting(false);
  };

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border group transition-all duration-200 hover:shadow-sm relative"
      style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.7)" }}
    >
      {/* Intelligence Layer: KAAL Pick Badge */}
      {isTopRanked && (
        <div
          className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-10"
          style={{ background: '#6366F1', color: '#fff' }}
        >
          KAAL Pick
        </div>
      )}
      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={completing}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          borderColor: completing ? "#059669" : "rgba(0,0,0,0.15)",
          backgroundColor: completing ? "rgba(5,150,105,0.1)" : "transparent",
        }}
        title="Mark complete"
      >
        {completing
          ? <CheckCircle2 className="w-4 h-4" style={{ color: "#059669" }} />
          : <Circle className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#9CA3AF" }} />
        }
      </button>

      {/* Priority dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
      />

      {/* Title */}
      <p
        className="flex-1 text-sm truncate"
        style={{ color: "#111827", fontFamily: "'Inter', sans-serif" }}
      >
        {task.title}
      </p>

      {/* Priority badge */}
      <span
        className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
        style={{
          color: PRIORITY_COLOR[task.priority],
          backgroundColor: PRIORITY_BG[task.priority],
        }}
      >
        {task.priority}
      </span>

      {/* Due date */}
      {due && (
        <span
          className="flex-shrink-0 text-[11px] font-medium flex items-center gap-1"
          style={{ color: overdue ? "#DC2626" : "#9CA3AF" }}
        >
          {overdue && <AlertCircle className="w-3 h-3" />}
          {due}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PremiumHomeDashboard() {
  const [currentTime] = useState(new Date());
  const [showFocusFlowModal, setShowFocusFlowModal] = useState(false);
  const [streak, setStreak] = useState({ current: 0, longest: 0, lastActive: "" });
  const [todayStats, setTodayStats] = useState<TodayStats>({ focusMinutes: 0, tasksCompleted: 0, sessionsCount: 0 });
  const [completingId, setCompletingId] = useState<string | null>(null);

  // ─── Intelligence Layer State ───────────────────────────────────────────────
  const [rankedTasks, setRankedTasks] = useState<RankedTask[]>([]);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [tasksDoneThisSession, setTasksDoneThisSession] = useState(0);
  const [nudgeEngine, setNudgeEngine] = useState<NudgeEngineState>(createNudgeEngineState());
  const [currentNudgeMessage, setCurrentNudgeMessage] = useState<string | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const nudgeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();
  const { profile } = useProfile();
  const { tasks } = useTasks();

  const hour = currentTime.getHours();
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = currentTime.toLocaleDateString("en-US", { month: "long" });
  const day = currentTime.getDate();

  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  // Load streak + daily stats
  useEffect(() => {
    const load = () => {
      setStreak(storageService.getStreak());
      const today = new Date().toISOString().split("T")[0];
      const stats = storageService.getDailyStats(today);
      setTodayStats({ focusMinutes: stats.focusMinutes, tasksCompleted: stats.tasksCompleted, sessionsCount: stats.sessionsCount });
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);

  // ─── Proactive AI: welcome insight (once per day) ──────────────────────────────
  useEffect(() => {
    // Removed mockup welcome nudge - only show real insights based on data
  }, []);

  // ─── Intelligence Layer: Fetch User State ──────────────────────────────────────
  useEffect(() => {
    async function fetchUserState() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const state: UserState = {
          energy_level: data.energy_level || 3,
          cognitive_mode: data.mood as any,
          time_horizon_minutes: data.time_available,
          tasks_done_this_session: tasksDoneThisSession,
        };
        setUserState(state);
        setNudgeEngine(prev => updateEnergyLevel(prev, data.energy_level || 3));
      }
    }

    fetchUserState();
  }, [tasksDoneThisSession]);

  // ─── Intelligence Layer: Rank Tasks ────────────────────────────────────────────
  useEffect(() => {
    if (!tasks || !userState) return;

    const tasksWithStatus = tasks.map(t => ({
      ...t,
      status: (t.status || 'pending') as 'pending' | 'in_progress' | 'done' | 'deferred',
    }));

    const ranked = rankTasks(tasksWithStatus, {
      ...userState,
      tasks_done_this_session: tasksDoneThisSession,
    });

    setRankedTasks(ranked);
  }, [tasks, userState, tasksDoneThisSession]);

  // ─── Intelligence Layer: Nudge Engine ──────────────────────────────────────────
  useEffect(() => {
    async function checkNudge() {
      if (!userState || rankedTasks.length === 0) return;

      const decision = shouldShowNudge(
        rankedTasks,
        nudgeEngine,
        userState.energy_level
      );

      if (decision) {
        console.log('[KAAL Nudge] Triggered:', decision.type, decision.reason);

        setNudgeEngine(prev => markNudgeSent(prev, decision));

        setNudgeLoading(true);
        const historyHint = await getNudgeHistoryHint();
        const { message } = await generateNudgeMessage({
          task_title: decision.task.title || 'Untitled task',
          estimated_minutes: decision.task.estimated_minutes || 25,
          nudge_type: decision.type,
          energy_level: userState.energy_level,
          cognitive_mode: userState.cognitive_mode || 'unknown',
          tasks_done_today: tasksDoneThisSession,
          minutes_overdue: decision.minutes_overdue,
          history_hint: historyHint,
        });
        setCurrentNudgeMessage(message);
        setNudgeLoading(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await logNudgeEvent({
            user_id: user.id,
            task_id: decision.task.id || null,
            nudge_type: decision.type,
            nudge_message: message,
            sent_at: new Date().toISOString(),
            outcome: null,
            response_delay_seconds: null,
          });
        }
      }
    }

    checkNudge();
    // NOTE: Change 600000 to 10000 (10 seconds) for testing, then back to 600000 (10 min) for production
    nudgeIntervalRef.current = setInterval(checkNudge, 600000);

    return () => {
      if (nudgeIntervalRef.current) {
        clearInterval(nudgeIntervalRef.current);
      }
    };
  }, [rankedTasks, userState, nudgeEngine, tasksDoneThisSession]);

  // Derived task state
  const allTasks = tasks || [];
  const completedTasks = allTasks.filter(t => t.status === "completed");
  // Intelligence Layer: Use ranked tasks if available, otherwise fall back to priority-sorted
  const pendingTasks = rankedTasks.length > 0
    ? rankedTasks.filter(t => t.status !== "completed" && t.status !== "archived")
    : allTasks
        .filter(t => t.status !== "completed" && t.status !== "archived")
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const overdueTasks = pendingTasks.filter(t => isOverdue(t.dueDate));
  const top3 = pendingTasks.slice(0, 4);
  const totalTasks = allTasks.length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const progressDashoffset = 628 - (628 * completionPercent / 100);
  const progressAngle = (completionPercent / 100) * 360;

  const focusGoalHours = 6;
  const focusMinutes = todayStats.focusMinutes;
  const focusHours = Math.floor(focusMinutes / 60);
  const focusMins = focusMinutes % 60;
  const focusPercent = Math.min(100, Math.round((focusMinutes / (focusGoalHours * 60)) * 100));

  // KAAL insight derived from real data
  const insight = deriveKaalInsight(hour, pendingTasks.length, overdueTasks.length, focusMinutes, streak.current);

  // Complete a task
  const handleCompleteTask = useCallback(async (taskId: string) => {
    setCompletingId(taskId);
    try {
      const result = await toggleTaskComplete(taskId);
      if (result.success) {
        toast.success("Task completed!", { description: "Nice work. Keep it up." });
        // Intelligence Layer: Increment session counter
        setTasksDoneThisSession(prev => prev + 1);
      } else {
        toast.error("Failed to complete task", { description: result.error });
      }
    } catch {
      toast.error("Failed to complete task");
    } finally {
      setCompletingId(null);
    }
  }, []);

  // ─── Intelligence Layer: Nudge Action Handlers ─────────────────────────────────
  const handleNudgeStart = async (taskId: string) => {
    console.log('[KAAL Nudge] User started task:', taskId);

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'in_progress' })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user && nudgeEngine.current_nudge) {
      await logNudgeEvent({
        user_id: user.id,
        task_id: taskId,
        nudge_type: nudgeEngine.current_nudge.type,
        nudge_message: currentNudgeMessage || '',
        sent_at: new Date(nudgeEngine.last_nudge_sent_at || Date.now()).toISOString(),
        outcome: 'started',
        response_delay_seconds: Math.round(
          (Date.now() - (nudgeEngine.last_nudge_sent_at || Date.now())) / 1000
        ),
      });
    }

    setNudgeEngine(prev => markNudgeActedOn(prev));
    setCurrentNudgeMessage(null);
  };

  const handleNudgeDefer = async (taskId: string) => {
    console.log('[KAAL Nudge] User deferred task:', taskId);

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'deferred' })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user && nudgeEngine.current_nudge) {
      await logNudgeEvent({
        user_id: user.id,
        task_id: taskId,
        nudge_type: nudgeEngine.current_nudge.type,
        nudge_message: currentNudgeMessage || '',
        sent_at: new Date(nudgeEngine.last_nudge_sent_at || Date.now()).toISOString(),
        outcome: 'deferred',
        response_delay_seconds: Math.round(
          (Date.now() - (nudgeEngine.last_nudge_sent_at || Date.now())) / 1000
        ),
      });
    }

    setNudgeEngine(prev => markNudgeActedOn(prev));
    setCurrentNudgeMessage(null);
  };

  const handleNudgeDismiss = async () => {
    console.log('[KAAL Nudge] User dismissed nudge');

    const { data: { user } } = await supabase.auth.getUser();
    if (user && nudgeEngine.current_nudge) {
      await logNudgeEvent({
        user_id: user.id,
        task_id: nudgeEngine.current_nudge.task.id || null,
        nudge_type: nudgeEngine.current_nudge.type,
        nudge_message: currentNudgeMessage || '',
        sent_at: new Date(nudgeEngine.last_nudge_sent_at || Date.now()).toISOString(),
        outcome: 'dismissed',
        response_delay_seconds: Math.round(
          (Date.now() - (nudgeEngine.last_nudge_sent_at || Date.now())) / 1000
        ),
      });
    }

    setNudgeEngine(prev => markNudgeDismissed(prev));
    setCurrentNudgeMessage(null);
  };

  const handleNudgeSwitch = async (fromTaskId: string, toTaskId: string) => {
    console.log('[KAAL Nudge] User switched tasks:', fromTaskId, '->', toTaskId);

    await supabase.from('tasks').update({ status: 'deferred' }).eq('id', fromTaskId);
    await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', toTaskId);

    const { data: { user } } = await supabase.auth.getUser();
    if (user && nudgeEngine.current_nudge) {
      await logNudgeEvent({
        user_id: user.id,
        task_id: toTaskId,
        nudge_type: nudgeEngine.current_nudge.type,
        nudge_message: currentNudgeMessage || '',
        sent_at: new Date(nudgeEngine.last_nudge_sent_at || Date.now()).toISOString(),
        outcome: 'started',
        response_delay_seconds: Math.round(
          (Date.now() - (nudgeEngine.last_nudge_sent_at || Date.now())) / 1000
        ),
      });
    }

    setNudgeEngine(prev => markNudgeActedOn(prev));
    setCurrentNudgeMessage(null);
  };

  // Quick actions
  const quickActions = [
    { icon: CheckSquare, label: "My Tasks", sub: `${pendingTasks.length} pending`, onClick: () => navigate("/tasks"), primary: false },
    { icon: Brain, label: "Ask KAAL", sub: "AI executive coach", onClick: () => navigate("/agent"), primary: true },
    { icon: TrendingUp, label: "Energy Check-in", sub: "Log how you feel", onClick: () => navigate("/energy"), primary: false },
  ];

  const isEvening = hour >= 17;

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth" style={{ backgroundColor: "#F8F9FA" }}>

      {/* Header */}
      <ScreenHeader
        label="Dashboard"
        title={`${dayName}, ${monthName} ${day}`}
        extras={
          <>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
              style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.8)" }}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" style={{ filter: "drop-shadow(0 0 6px rgba(234,88,12,0.3))" }} />
              <span className="text-xs font-bold tracking-wide" style={{ color: "#111827" }}>
                {streak.current} DAY STREAK
              </span>
            </div>
            <AIStatusChip />
          </>
        }
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="p-10">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Greeting */}
          <div
            style={{ animation: "fadeInUp 0.7s cubic-bezier(0.2,0.8,0.2,1) forwards", opacity: 0 }}
          >
            <h2
              className="text-5xl font-medium tracking-tight leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
            >
              {getGreeting()},{" "}
              <span className="italic">{(profile.fullName || "there").split(" ")[0]}.</span>
            </h2>
            <p className="mt-2 text-base font-light" style={{ color: "#6B7280" }}>
              {overdueTasks.length > 0
                ? `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""} — let's clear the backlog.`
                : pendingTasks.length === 0
                ? "Nothing pending. Use this space to get ahead."
                : `${pendingTasks.length} task${pendingTasks.length > 1 ? "s" : ""} on deck. Make today count.`}
            </p>
          </div>

          {/* ── Row 1: Progress + Quick Actions ────────────────────────── */}
          <div className="grid grid-cols-12 gap-7">

            {/* Today's Progress */}
            <div
              className="col-span-12 lg:col-span-8 rounded-3xl p-8 relative transition-all duration-500 hover:shadow-lg"
              style={{ ...GLASS, animation: "fadeInUp 0.8s ease-out 0.1s forwards", opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-7">
                <h3 className="text-xl font-medium italic" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  Today's Progress
                </h3>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                  {completionPercent}% complete
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-10 items-center">
                {/* Circular ring */}
                <div className="relative w-52 h-52 flex-shrink-0">
                  <div className="absolute inset-0 bg-gray-200 rounded-full blur-2xl opacity-20 transform scale-90" />
                  <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 224 224">
                    <defs>
                      <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#374151" stopOpacity="1" />
                        <stop offset="100%" stopColor="#111827" stopOpacity="1" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <circle cx="112" cy="112" r="100" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
                    <circle
                      cx="112" cy="112" r="100"
                      fill="none" stroke="url(#gradientStroke)" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray="628"
                      strokeDashoffset={progressDashoffset}
                      filter="url(#glow)"
                      className="transition-all duration-1000 ease-out"
                    />
                    {completionPercent > 0 && (
                      <circle
                        cx="112" cy="112" r="4" fill="#111827"
                        style={{
                          transformOrigin: "112px 112px",
                          transform: `rotate(${progressAngle}deg) translate(100px)`,
                          filter: "drop-shadow(0 0 8px rgba(17,24,39,0.8))",
                        }}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                      {completionPercent}<span className="text-2xl align-top">%</span>
                    </span>
                    <span className="text-[10px] font-bold tracking-widest uppercase mt-2" style={{ color: "#6B7280" }}>
                      Completed
                    </span>
                  </div>
                </div>

                {/* Stats side */}
                <div className="flex-1 w-full space-y-6">
                  {/* Focus bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>Focus Goal</span>
                      <span className="text-sm font-medium" style={{ color: "#111827" }}>
                        {focusHours}h {focusMins}m <span className="text-gray-300 mx-1">/</span> 6h
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${focusPercent}%`, backgroundColor: "#111827", boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}
                      />
                    </div>
                  </div>

                  {/* 3 stat chips */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: completedTasks.length, label: "Done" },
                      { value: todayStats.sessionsCount || 0, label: "Sessions" },
                      { value: pendingTasks.length, label: "To Do" },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 shadow-sm hover:-translate-y-0.5 transition-transform duration-300"
                        style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "white" }}
                      >
                        <span className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                          {s.value}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#6B7280" }}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={action.onClick}
                    className="group flex-1 px-6 py-4 rounded-2xl border text-left flex items-center gap-4 relative overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                    style={{
                      ...GLASS,
                      animation: `fadeInUp 0.8s ease-out ${0.15 + i * 0.07}s forwards`,
                      opacity: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.82)"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.55)"; }}
                  >
                    {/* Right accent bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: "#111827" }}
                    />
                    <div
                      className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                      style={{ backgroundColor: action.primary ? "#111827" : "white", borderColor: action.primary ? "#111827" : "rgba(0,0,0,0.07)", color: action.primary ? "white" : "#374151" }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>{action.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{action.sub}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" style={{ color: "#9CA3AF" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Row 2: Today's Priorities ───────────────────────────────── */}
          <div
            className="rounded-3xl p-8 border transition-all duration-300 hover:shadow-lg"
            style={{ ...GLASS, animation: "fadeInUp 0.8s ease-out 0.45s forwards", opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-medium italic" style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}>
                  Today's Priorities
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  {pendingTasks.length > 0 ? `${pendingTasks.length} task${pendingTasks.length > 1 ? "s" : ""} pending — sorted by priority` : "All clear for now"}
                </p>
              </div>
              <button
                onClick={() => navigate("/tasks")}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border transition-all hover:shadow-sm active:scale-95"
                style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(0,0,0,0.07)", color: "#374151" }}
              >
                All tasks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {top3.length > 0 ? (
              <div className="space-y-2.5">
                {top3.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    isTopRanked={index === 0 && rankedTasks.length > 0}
                  />
                ))}
                {pendingTasks.length > 4 && (
                  <button
                    onClick={() => navigate("/tasks")}
                    className="w-full py-3 text-xs font-medium text-center rounded-2xl border border-dashed transition-all hover:bg-white/40"
                    style={{ borderColor: "rgba(0,0,0,0.1)", color: "#9CA3AF" }}
                  >
                    +{pendingTasks.length - 4} more tasks — view all
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="w-6 h-6" style={{ color: "#059669" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#111827" }}>All caught up</p>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>No pending tasks — add something or enjoy the space.</p>
                <button
                  onClick={() => navigate("/tasks")}
                  className="mt-4 px-5 py-2 rounded-xl text-xs font-medium border transition-all hover:shadow-sm"
                  style={{ background: "rgba(255,255,255,0.8)", borderColor: "rgba(0,0,0,0.08)", color: "#374151" }}
                >
                  Add a task
                </button>
              </div>
            )}
          </div>

          {/* ── Row 3: Removed Daily Checkout ── */}

          <div className="h-16" />
        </div>
      </div>

      {/* Animations */}
      <style>{SCREEN_ANIMATIONS}</style>

      <FocusFlowModal isOpen={showFocusFlowModal} onClose={() => setShowFocusFlowModal(false)} />

      {/* Intelligence Layer: Nudge Overlay */}
      <AnimatePresence>
        {nudgeEngine.current_nudge && (
          <NudgeOverlay
            decision={nudgeEngine.current_nudge}
            message={currentNudgeMessage}
            isLoading={nudgeLoading}
            onStart={handleNudgeStart}
            onDefer={handleNudgeDefer}
            onDismiss={handleNudgeDismiss}
            onSwitch={handleNudgeSwitch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}