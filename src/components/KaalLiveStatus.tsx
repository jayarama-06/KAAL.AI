/**
 * KaalLiveStatus — KAAL's live brain panel
 *
 * Shows what KAAL is actively monitoring right now:
 *   - Current observations (ranked by weight)
 *   - What it would recommend and why
 *   - Fatigue meter
 *   - Autonomous action history
 *
 * Appears in the chat sidebar and as a collapsed chip in the input bar.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Zap, ChevronDown, ChevronUp, Activity, Clock } from 'lucide-react';
import { kaalBrain } from '../services/kaal-brain';
import { fatigueEngine } from '../services/fatigue-engine';
import type { AgentContext } from '../services/kaal-agent';

const F = {
  display: "'Noto Sans Display', sans-serif",
  serif:   "'Playfair Display', serif",
  mono:    'ui-monospace, monospace',
};

const CATEGORY_STYLE = {
  workload: { dot: '#DC2626', label: 'Workload' },
  energy:   { dot: '#D97706', label: 'Energy'   },
  time:     { dot: '#2563EB', label: 'Time'      },
  progress: { dot: '#059669', label: 'Progress'  },
  pattern:  { dot: '#7C3AED', label: 'Pattern'   },
  user:     { dot: '#111827', label: 'User'      },
  context:  { dot: '#9CA3AF', label: 'Context'   },
};

// Weight bar
function WeightBar({ weight, color }: { weight: number; color: string }) {
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)', width: '100%' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(weight * 100)}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        style={{ background: color }} />
    </div>
  );
}

// Reasoning badge shown inline in chat messages
export function ReasoningBadge({ reasoning, confidence, chosenAction }: {
  reasoning: { label: string; weight: number; category: string; detail: string }[];
  confidence: number;
  chosenAction: string;
}) {
  const [open, setOpen] = useState(false);

  const actionLabels: Record<string, string> = {
    force_break: 'Force break', suggest_break: 'Suggest break',
    tackle_overdue: 'Address overdue', start_priority: 'Start priority task',
    quick_wins_first: 'Quick wins sequence', post_lunch_light: 'Light work for dip',
    triage_queue: 'Triage queue', celebrate: 'Celebrate progress',
    deep_focus: 'Deep focus session', end_of_day: 'End of day triage',
    morning_attack: 'Morning priority attack', free_time: 'Free exploration',
  };

  const label = actionLabels[chosenAction] ?? chosenAction;
  const pct   = Math.round(confidence * 100);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
        style={{ color: '#9CA3AF', fontFamily: F.display }}>
        <Eye className="w-3 h-3" />
        <span>How I decided — <strong style={{ color: '#6B7280' }}>{label}</strong> ({pct}% confidence)</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="mt-2 p-3 rounded-2xl space-y-2.5 border"
              style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF', fontFamily: F.display }}>
                Signals I considered
              </p>
              {reasoning.map((r, i) => {
                const cs = CATEGORY_STYLE[r.category as keyof typeof CATEGORY_STYLE] ?? CATEGORY_STYLE.context;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cs.dot }} />
                        <p className="text-xs truncate" style={{ color: '#374151', fontFamily: F.mono, maxWidth: 'none' }}>
                          {r.label}
                        </p>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
                        {Math.round(r.weight * 100)}%
                      </span>
                    </div>
                    <WeightBar weight={r.weight} color={cs.dot} />
                    <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF', fontFamily: F.serif, fontStyle: 'italic', maxWidth: 'none' }}>
                      {r.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Proactive indicator chip shown in the input area
export function ProactiveChip({ note, isMonitoring }: { note: string; isMonitoring: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(0,0,0,0.07)' }}>
      <motion.span
        className="w-1.5 h-1.5 rounded-full"
        animate={isMonitoring ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={{ duration: 1.8, repeat: Infinity }}
        style={{ background: '#10B981' }} />
      <span className="text-xs" style={{ color: '#6B7280', fontFamily: F.display }}>{note}</span>
    </motion.div>
  );
}

// Full live status panel for sidebar
export function KaalLiveStatusPanel({ ctx }: { ctx: AgentContext }) {
  const [snapshot, setSnapshot] = useState(() => kaalBrain.getContextSnapshot(ctx));
  const [fatigue, setFatigue]   = useState(fatigueEngine.state);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    // Update snapshot every 30s
    const interval = setInterval(() => {
      setSnapshot(kaalBrain.getContextSnapshot(ctx));
    }, 30_000);

    const unsub = fatigueEngine.subscribe(state => setFatigue(state));
    return () => { clearInterval(interval); unsub(); };
  }, [ctx]);

  // Re-snapshot when ctx changes
  useEffect(() => {
    setSnapshot(kaalBrain.getContextSnapshot(ctx));
  }, [ctx]);

  const FATIGUE_COLOR =
    fatigue.fatigueLevel === 'critical'  ? '#DC2626' :
    fatigue.fatigueLevel === 'exhausted' ? '#D97706' :
    fatigue.fatigueLevel === 'tired'     ? '#F59E0B' :
    fatigue.fatigueLevel === 'warming'   ? '#059669' : '#10B981';

  const FATIGUE_PCT = Math.round(fatigue.fatigueScore);

  return (
    <div className="rounded-3xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)' }}>

      {/* Header */}
      <button className="w-full flex items-center gap-3 px-5 py-4 border-b text-left"
        style={{ borderColor: 'rgba(0,0,0,0.05)' }}
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2 flex-1">
          <motion.span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#111827', fontFamily: F.display }}>
            KAAL is watching
          </p>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                  : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 py-4 space-y-4">

              {/* Current monitor note */}
              <div className="flex items-start gap-2">
                <Eye className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
                <p className="text-xs italic" style={{ color: '#6B7280', fontFamily: F.serif, maxWidth: 'none' }}>
                  {snapshot.monitoringNote}
                </p>
              </div>

              {/* Fatigue meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF', fontFamily: F.display }}>
                    Cognitive load
                  </p>
                  <span className="text-xs font-bold" style={{ color: FATIGUE_COLOR, fontFamily: F.mono }}>
                    {fatigue.fatigueLevel.toUpperCase()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                  <motion.div className="h-full rounded-full"
                    animate={{ width: `${FATIGUE_PCT}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                    style={{ background: FATIGUE_COLOR }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
                    {Math.round(fatigue.continuousWorkMin)} min continuous
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
                    {fatigue.breaksTakenToday} break{fatigue.breaksTakenToday !== 1 ? 's' : ''} today
                  </p>
                </div>
              </div>

              {/* Top signals */}
              {snapshot.topFacts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF', fontFamily: F.display }}>
                    Live signals
                  </p>
                  {snapshot.topFacts.slice(0, 4).map(fact => {
                    const cs = CATEGORY_STYLE[fact.category as keyof typeof CATEGORY_STYLE] ?? CATEGORY_STYLE.context;
                    return (
                      <div key={fact.id} className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cs.dot }} />
                          <p className="text-xs" style={{ color: '#374151', fontFamily: F.mono, maxWidth: 'none' }}>{fact.label}</p>
                          <span className="text-xs ml-auto flex-shrink-0" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
                            {Math.round(fact.weight * 100)}%
                          </span>
                        </div>
                        <div className="pl-3">
                          <WeightBar weight={fact.weight} color={cs.dot} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Next recommended action */}
              {snapshot.topAction && (
                <div className="p-3 rounded-2xl border" style={{ background: 'rgba(17,24,39,0.03)', borderColor: 'rgba(0,0,0,0.06)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#9CA3AF', fontFamily: F.display }}>
                    KAAL would recommend
                  </p>
                  <p className="text-xs font-medium" style={{ color: '#111827', fontFamily: F.display }}>
                    {({
                      force_break: '☕ Force break — critical fatigue',
                      suggest_break: '☕ Take a break soon',
                      tackle_overdue: '🔴 Address overdue tasks first',
                      start_priority: '🎯 Start your top priority',
                      quick_wins_first: '⚡ Quick wins to build momentum',
                      post_lunch_light: '🌤 Light work for the energy dip',
                      triage_queue: '🔍 Triage the overloaded queue',
                      celebrate: '🏆 Acknowledge strong progress',
                      deep_focus: '🧠 Deep focus block',
                      end_of_day: '📋 End-of-day triage',
                      morning_attack: '⚡ Morning priority attack',
                      free_time: '🌱 Free time — use it wisely',
                    } as Record<string, string>)[snapshot.topAction.id] ?? snapshot.topAction.id}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
                    {Math.round(snapshot.topAction.score * 100)}% confidence
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
