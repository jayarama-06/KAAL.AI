/**
 * KAAL Proactive AI Coach
 * Live, context-aware AI overlay that monitors behavior and surfaces
 * intelligent nudges using glass-morphism design.
 */

import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Zap,
  Trophy,
  AlertTriangle,
  Coffee,
  Target,
  Flame,
  ArrowRight,
  BellOff,
  History,
  Lightbulb,
  Calendar,
  TrendingDown,
  BarChart2,
  Layers,
  Activity,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { proactiveAI, ProactiveInsight, ProactiveNudgeType, BehaviorSignals, EnrichedBehaviorSignals } from '../services/proactive-ai';
import { cognitiveStateEstimator, CognitiveState } from '../services/cognitive-state-estimator';
import { storageService } from '../services/storage-service';
import { useTasks } from '../hooks/useTasks';
import { interventionIntelligence } from '../services/intervention-intelligence';
import type { NudgeOutcome } from '../services/intervention-intelligence';

// ─── Icon map ───────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  coach: Brain,
  warning: AlertTriangle,
  celebration: Trophy,
  suggestion: Lightbulb,
  info: Sparkles,
};

const TYPE_ICONS: Partial<Record<ProactiveNudgeType, React.ElementType>> = {
  morning_brief:            Sparkles,
  peak_energy:              Zap,
  task_overdue:             Clock,
  idle_warning:             Brain,
  focus_celebrate:          Flame,
  break_needed:             Coffee,
  afternoon_slump:          Coffee,
  evening_wrap:             Target,
  quick_win:                Target,
  streak_at_risk:           AlertTriangle,
  momentum_boost:           Trophy,
  reentry:                  Brain,
  gentle_start:             Sparkles,
  // ── Intelligence layer ──────────────────────────────────────────────────────
  deadline_risk:            Calendar,
  procrastination_detected: Layers,
  workload_infeasible:      BarChart2,
  velocity_warning:         TrendingDown,
  anomaly_detected:         Activity,
  cascade_warning:          AlertTriangle,
};

// ─── Color palettes per category ────────────────────────────────────────────
const CATEGORY_STYLE = {
  coach: {
    border: 'rgba(99, 102, 241, 0.4)',
    glow: 'rgba(99, 102, 241, 0.15)',
    accent: '#6366F1',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeText: '#6366F1',
  },
  warning: {
    border: 'rgba(245, 158, 11, 0.5)',
    glow: 'rgba(245, 158, 11, 0.1)',
    accent: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.1)',
    badgeText: '#D97706',
  },
  celebration: {
    border: 'rgba(16, 185, 129, 0.4)',
    glow: 'rgba(16, 185, 129, 0.12)',
    accent: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.1)',
    badgeText: '#059669',
  },
  suggestion: {
    border: 'rgba(59, 130, 246, 0.4)',
    glow: 'rgba(59, 130, 246, 0.12)',
    accent: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.1)',
    badgeText: '#2563EB',
  },
  info: {
    border: 'rgba(156, 163, 175, 0.4)',
    glow: 'rgba(156, 163, 175, 0.08)',
    accent: '#6B7280',
    badgeBg: 'rgba(156, 163, 175, 0.08)',
    badgeText: '#6B7280',
  },
};

// ─── Single Nudge Card ───────────────────────────────────────────────────────
const NudgeCard = forwardRef<HTMLDivElement, {
  insight: ProactiveInsight;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  onAction: (insight: ProactiveInsight) => void;
  isCompact?: boolean;
}>(function NudgeCard({
  insight,
  onDismiss,
  onSnooze,
  onAction,
  isCompact = false,
}, ref) {
  const style = CATEGORY_STYLE[insight.category] || CATEGORY_STYLE.info;
  const Icon = TYPE_ICONS[insight.type] || CATEGORY_ICONS[insight.category] || Brain;

  // ── Feedback state ─────────────────────────────────────────────────────────
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const handleFeedback = (rating: 'up' | 'down') => {
    if (feedbackGiven) return;
    setFeedbackGiven(rating);
    setShowThanks(true);

    const outcome: NudgeOutcome = rating === 'up' ? 'acted' : 'dismissed';
    interventionIntelligence.recordOutcome(
      insight.id,
      insight.type,
      outcome,
      insight.cognitiveState || 'unknown',
    );

    // Brief "Thanks!" pause then auto-dismiss
    setTimeout(() => onDismiss(insight.id), 900);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88 }}
      transition={{ duration: 0.4, ease: [0.21, 1.02, 0.48, 1] }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: `1px solid ${style.border}`,
        borderLeftWidth: '3px',
        borderLeftColor: style.accent,
        boxShadow: `0 8px 32px ${style.glow}, 0 2px 8px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Subtle glow layer */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${style.glow}, transparent 60%)`,
        }}
      />

      <div className={`relative flex items-start gap-3 ${isCompact ? 'p-3' : 'p-4'}`}>
        {/* Icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: style.badgeBg }}
        >
          {insight.emoji ? (
            <span className="text-base">{insight.emoji}</span>
          ) : (
            <Icon className="w-4 h-4" style={{ color: style.accent }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                className="text-xs font-bold uppercase tracking-wider leading-tight"
                style={{ color: style.accent }}
              >
                {insight.title}
              </p>
              {/* Personalized badge for intelligence-layer nudges */}
              {insight.isPersonalized && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <Activity className="w-2.5 h-2.5" style={{ color: '#6366F1' }} />
                  <span className="text-[9px] font-semibold" style={{ color: '#6366F1' }}>
                    Personalized
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {insight.secondaryAction && (
                <button
                  onClick={() => onSnooze(insight.id)}
                  className="p-1 rounded-lg transition-all hover:bg-black/5"
                  title="Snooze 1 hour"
                >
                  <BellOff className="w-3 h-3 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => onDismiss(insight.id)}
                className="p-1 rounded-lg transition-all hover:bg-black/5"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          <p
            className="text-sm mt-0.5 leading-snug"
            style={{ color: '#374151' }}
          >
            {insight.message}
          </p>

          {insight.action && (
            <button
              onClick={() => onAction(insight)}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: style.accent,
                color: 'white',
              }}
            >
              {insight.action.label}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {/* Intelligence score meter — subtle visual for high-confidence nudges */}
          {insight.intelligenceScore !== undefined && insight.intelligenceScore >= 0.75 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{
                      background: i <= Math.round(insight.intelligenceScore! * 5)
                        ? style.accent : 'rgba(0,0,0,0.1)',
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px]" style={{ color: '#9CA3AF' }}>
                {Math.round(insight.intelligenceScore * 100)}% confidence
              </span>
            </div>
          )}

          {/* ── 👍/👎 Feedback Row ──────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {showThanks ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2.5 flex items-center gap-1"
              >
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="text-sm"
                >
                  {feedbackGiven === 'up' ? '🎯' : '📝'}
                </motion.span>
                <span className="text-[10px] font-semibold" style={{ color: style.accent }}>
                  {feedbackGiven === 'up' ? "Got it — I'll surface more like this!" : "Noted — I'll adjust future nudges."}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="buttons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2.5 flex items-center gap-2"
              >
                <span className="text-[9px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                  Helpful?
                </span>
                <button
                  onClick={() => handleFeedback('up')}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-lg transition-all hover:scale-110 active:scale-95 group"
                  style={{
                    background: 'rgba(16,185,129,0.07)',
                    border: '1px solid rgba(16,185,129,0.15)',
                  }}
                  title="Yes, this was helpful"
                  aria-label="Mark nudge as helpful"
                >
                  <ThumbsUp className="w-3 h-3 transition-colors group-hover:text-emerald-500" style={{ color: '#6B7280' }} />
                </button>
                <button
                  onClick={() => handleFeedback('down')}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-lg transition-all hover:scale-110 active:scale-95 group"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.12)',
                  }}
                  title="No, this wasn't helpful"
                  aria-label="Mark nudge as not helpful"
                >
                  <ThumbsDown className="w-3 h-3 transition-colors group-hover:text-red-400" style={{ color: '#6B7280' }} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Animated priority pulse for critical/high */}
      {(insight.priority === 'critical' || insight.priority === 'high') && (
        <motion.div
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: style.accent }}
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.div>
  );
});
NudgeCard.displayName = 'NudgeCard';

// ─── AI Thinking Indicator ──────────────────────────────────────────────────
function AIThinkingDot({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-4 h-4">
      {isActive ? (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: '#6366F1', opacity: 0.3 }}
            animate={{ scale: [1, 2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6366F1' }} />
        </>
      ) : (
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
      )}
    </div>
  );
}

// ─── Cognitive state dot ─────────────────────────────────────────────────────
const STATE_COLORS: Partial<Record<CognitiveState, string>> = {
  flow:        '#10B981',
  primed:      '#6366F1',
  shallow_work:'#3B82F6',
  avoidance:   '#F59E0B',
  overwhelmed: '#EF4444',
  anxious:     '#F97316',
  fatigued:    '#8B5CF6',
  recovery:    '#06B6D4',
  idle:        '#6B7280',
  unknown:     '#D1D5DB',
};

// ─── Main ProactiveAICoach Component ────────────────────────────────────────
export function ProactiveAICoach() {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [focusSessionActive, setFocusSessionActive] = useState(false);
  const [focusSessionMinutes, setFocusSessionMinutes] = useState(0);
  const [cogState, setCogState] = useState<CognitiveState>('unknown');
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const activityRef = useRef(Date.now());

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      activityRef.current = Date.now();
      setLastActivity(Date.now());
    };
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // Load persisted data
  useEffect(() => {
    const load = async () => {
      try {
        const streak = storageService.getStreak();
        setStreakDays(streak.current || 0);

        // Check for active session (async)
        const current = await storageService.getCurrentSession().catch(() => null);
        if (current && current.startTime) {
          setFocusSessionActive(true);
          setFocusSessionMinutes(
            Math.floor((Date.now() - current.startTime) / 60000)
          );
        }

        // Today's focus minutes from localStorage stats
        try {
          const statsRaw = localStorage.getItem('kaal_daily_stats');
          if (statsRaw) {
            const stats = JSON.parse(statsRaw);
            const todayKey = new Date().toISOString().split('T')[0];
            if (stats[todayKey]) {
              setTodayFocusMinutes(stats[todayKey].focusMinutes || 0);
            }
          }
        } catch {}

        // Load saved energy
        const savedEnergy = localStorage.getItem('kaal_last_energy_level');
        if (savedEnergy) setEnergyLevel(Number(savedEnergy));
      } catch {}
    };
    load();
  }, []);

  // Build enriched signals and start proactive AI
  const buildSignals = useCallback((): EnrichedBehaviorSignals => {
    const now = new Date();
    const activeTasks    = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const overdueTasks   = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
    const highPriority   = activeTasks.filter((t) => t.priority === 'high' || t.priority === 'urgent');

    // Map tasks to TaskForRisk shape for predictive engines
    const tasksForRisk = tasks.map(t => ({
      id:                t.id,
      title:             t.title,
      priority:          (t.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      status:            t.status,
      dueDate:           t.dueDate,
      estimatedMinutes:  t.estimatedMinutes,
      createdAt:         t.createdAt,
      tags:              t.tags,
    }));

    const stateSignals = {
      hour:                now.getHours(),
      dayOfWeek:           now.getDay(),
      focusSessionActive,
      focusSessionMinutes,
      todayFocusMinutes,
      energyLevel,
      tasksTotal:          tasks.length,
      tasksCompleted:      completedTasks.length,
      tasksOverdue:        overdueTasks.length,
      lastActivityMs:      Date.now() - activityRef.current,
      recentSessionEnded:  false,
    };

    // Update cognitive state estimate
    const est = cognitiveStateEstimator.estimate(stateSignals);
    setCogState(est.state);

    return {
      ...stateSignals,
      tasksHighPriority: highPriority.length,
      streakDays,
      lastNudgeTimes:    {} as any,
      tasks:             tasksForRisk,
    };
  }, [tasks, focusSessionActive, focusSessionMinutes, energyLevel, todayFocusMinutes, streakDays]);

  // Subscribe to proactive AI
  useEffect(() => {
    const unsub = proactiveAI.onInsight((insight) => {
      setInsights(proactiveAI.getActive());
      setIsThinking(true);
      setTimeout(() => setIsThinking(false), 2000);
    });

    proactiveAI.start(buildSignals);

    // Load any existing active insights
    setInsights(proactiveAI.getActive());

    return () => {
      unsub();
      proactiveAI.stop();
    };
  }, []);

  // Re-evaluate when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      proactiveAI.triggerEvaluation(buildSignals());
    }
  }, [tasks.length]);

  const handleDismiss = (id: string) => {
    proactiveAI.dismiss(id);
    setInsights(proactiveAI.getActive());
  };

  const handleSnooze = (id: string) => {
    proactiveAI.snooze(id);
    setInsights(proactiveAI.getActive());
  };

  const handleAction = (insight: ProactiveInsight) => {
    // Record that the user acted — closes the feedback loop
    proactiveAI.recordAction(insight.id);
    if (insight.action?.handler) {
      insight.action.handler();
    } else if (insight.action?.route) {
      navigate(insight.action.route);
    }
    handleDismiss(insight.id);
  };

  const floatingInsights = insights.slice(0, 2); // Show max 2 floating nudges
  const totalCount = insights.length;

  return (
    <>
      {/* ── Floating Nudge Cards (bottom-right stack) ── */}
      <div className="fixed bottom-28 right-6 z-[55] flex flex-col gap-2 w-80 md:w-[340px]">
        <AnimatePresence mode="popLayout">
          {floatingInsights.map((insight) => (
            <NudgeCard
              key={insight.id}
              insight={insight}
              onDismiss={handleDismiss}
              onSnooze={handleSnooze}
              onAction={handleAction}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── AI Coach Panel Toggle (above GlobalOrb) ── */}
      <div className="fixed bottom-[148px] right-10 z-[54]">
        <AnimatePresence>
          {totalCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsPanelOpen((p) => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
              }}
            >
              <AIThinkingDot isActive={isThinking} />
              <span
                className="text-xs font-semibold"
                style={{ color: '#6366F1' }}
              >
                {totalCount} insight{totalCount !== 1 ? 's' : ''}
              </span>
              {isPanelOpen ? (
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-indigo-400" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Expanded AI Coach Panel ── */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.21, 1.02, 0.48, 1] }}
            className="fixed bottom-36 right-6 z-[56] w-80 md:w-96 rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(99,102,241,0.1)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.1)' }}
                >
                  <Brain className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: '#111827' }}
                  >
                    KAAL Coach
                  </p>
                  <div className="flex items-center gap-1.5">
                    <AIThinkingDot isActive={isThinking} />
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      {isThinking ? 'Analyzing...' : (
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ background: STATE_COLORS[cogState] || '#D1D5DB' }}
                          />
                          {cogState === 'unknown' ? 'Monitoring workflow' : cogState.replace('_', ' ')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    proactiveAI.clearAll();
                    setInsights([]);
                    setIsPanelOpen(false);
                  }}
                  className="p-2 rounded-xl text-xs transition-all hover:bg-black/5"
                  style={{ color: '#9CA3AF' }}
                  title="Clear all insights"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="p-2 rounded-xl transition-all hover:bg-black/5"
                  style={{ color: '#6B7280' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Insight List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {insights.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(99,102,241,0.08)' }}
                  >
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#374151' }}
                  >
                    All clear
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    No active insights. I'll notify you when something needs attention.
                  </p>
                </div>
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  <AnimatePresence>
                    {insights.map((insight) => (
                      <NudgeCard
                        key={insight.id}
                        insight={insight}
                        onDismiss={(id) => {
                          handleDismiss(id);
                          if (insights.length <= 1) setIsPanelOpen(false);
                        }}
                        onSnooze={handleSnooze}
                        onAction={(ins) => {
                          handleAction(ins);
                          setIsPanelOpen(false);
                        }}
                        isCompact
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {insights.length > 0 && (
              <div
                className="px-5 py-3 border-t flex items-center justify-between"
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
              >
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {insights.length} active insight{insights.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => {
                    insights.forEach((i) => handleDismiss(i.id));
                  }}
                  className="text-xs font-medium transition-colors hover:text-gray-700"
                  style={{ color: '#9CA3AF' }}
                >
                  Dismiss all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── AI Status Chip (for Navbar / Dashboard) ─────────────────────────────────
export function AIStatusChip() {
  const [count, setCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const unsub = proactiveAI.onInsight(() => {
      setCount(proactiveAI.getActive().length);
      setIsThinking(true);
      setTimeout(() => setIsThinking(false), 3000);
    });
    setCount(proactiveAI.getActive().length);
    return unsub;
  }, []);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      <AIThinkingDot isActive={isThinking} />
      <span className="text-xs font-semibold" style={{ color: '#6366F1' }}>
        {count}
      </span>
    </motion.div>
  );
}