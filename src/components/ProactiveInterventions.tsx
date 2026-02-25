/**
 * ProactiveInterventions
 * Rich UI cards that appear as KAAL messages in the chat thread.
 * These are NOT modals or separate pages — they live in the conversation flow.
 *
 *  FatigueCard         — "You've been working 90 min. Take a break."
 *  BreakTimerCard      — Countdown with motivational copy
 *  ReEngageCard        — Post-break: here's where to start
 *  TaskDeconstructorCard — Visual breakdown of a big task
 *  StudyPlanCard       — Day-by-day exam prep calendar
 *  ResourceSuggestionCard — Curated resources
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee, Zap, ChevronDown, ChevronUp, Clock, Target,
  BookOpen, Play, CheckCircle2, Star, ExternalLink,
  AlertTriangle, ArrowRight, RotateCcw, Trophy, Layers,
  Calendar, Brain,
} from 'lucide-react';
import { FatigueIntervention, fatigueEngine } from '../services/fatigue-engine';
import { TaskAnalysis, SubTask, StudyPlan, StudySession, Resource } from '../services/task-intelligence';

const F = {
  display: 'var(--font-display)',
  serif:   "'Playfair Display', serif",
  mono:    'var(--font-mono)',
};

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 8px 32px -8px rgba(0,0,0,0.08)',
};

// ─── FatigueCard ──────────────────────────────────────────────────────────────

export function FatigueCard({ intervention, onTakeBreak, onKeepGoing }: {
  intervention: FatigueIntervention;
  onTakeBreak: (min: number) => void;
  onKeepGoing: () => void;
}) {
  const isSerious = intervention.level === 'exhausted' || intervention.level === 'critical';
  const borderColor = intervention.level === 'critical' ? '#FCA5A5' : intervention.level === 'exhausted' ? '#FDE68A' : '#BBF7D0';
  const bgColor    = intervention.level === 'critical' ? '#FEF2F2' : intervention.level === 'exhausted' ? '#FFFBEB' : '#F0FDF4';
  const accentColor = intervention.level === 'critical' ? '#DC2626' : intervention.level === 'exhausted' ? '#D97706' : '#15803D';
  const icon = intervention.level === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <Coffee className="w-4 h-4" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="rounded-3xl overflow-hidden"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: borderColor + '88', background: 'rgba(255,255,255,0.4)' }}>
        <div className="p-2 rounded-xl bg-white shadow-sm" style={{ color: accentColor }}>{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: '#111827', fontFamily: F.display }}>{intervention.title}</p>
          <p className="text-xs mt-0.5" style={{ color: accentColor, fontFamily: F.display }}>
            {intervention.level === 'critical' ? 'CRITICAL — KAAL is pausing suggestions' :
             intervention.level === 'exhausted' ? 'STRONG RECOMMENDATION' : 'HEADS UP'}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-sm leading-relaxed" style={{ color: '#374151', maxWidth: 'none' }}>
          {intervention.message}
        </p>

        {/* Break options */}
        <div className="flex flex-wrap gap-3 mt-5">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onTakeBreak(intervention.breakMinutes)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium text-white shadow-sm"
            style={{ background: accentColor, fontFamily: F.display }}>
            <Coffee className="w-4 h-4" />
            Take {intervention.breakMinutes}-min break
          </motion.button>

          {intervention.breakMinutes >= 10 && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onTakeBreak(5)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border"
              style={{ background: 'rgba(255,255,255,0.7)', borderColor: borderColor, color: '#374151', fontFamily: F.display }}>
              Just 5 min
            </motion.button>
          )}

          {!isSerious && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={onKeepGoing}
              className="px-4 py-2.5 rounded-2xl text-sm border"
              style={{ background: 'transparent', borderColor: 'rgba(0,0,0,0.08)', color: '#9CA3AF', fontFamily: F.display }}>
              Keep going for now
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── BreakTimerCard ───────────────────────────────────────────────────────────

export function BreakTimerCard({ durationMin, onBreakEnd }: {
  durationMin: number;
  onBreakEnd: () => void;
}) {
  const totalSec = durationMin * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          onBreakEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, []);

  const pct = ((totalSec - remaining) / totalSec) * 100;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const done = remaining === 0;

  const BREAK_TIPS = [
    "Step away from the screen entirely.",
    "Drink a full glass of water.",
    "Look at something 20 feet away for 20 seconds.",
    "Take 5 slow, deep breaths.",
    "Stand up and move your body.",
    "Stretch your hands and wrists.",
  ];
  const tip = BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl overflow-hidden border"
      style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>

      <div className="px-6 py-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 relative">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#BBF7D0" strokeWidth="8" />
            <motion.circle cx="48" cy="48" r="40" fill="none" stroke="#15803D" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              transition={{ duration: 1, ease: 'linear' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {done ? (
              <CheckCircle2 className="w-8 h-8" style={{ color: '#15803D' }} />
            ) : (
              <span className="text-xl font-medium" style={{ fontFamily: F.mono, color: '#15803D' }}>
                {min}:{sec.toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none' }}>
          {done ? 'Break complete! Ready to re-engage.' : 'Break in progress — away from screen'}
        </p>
        <p className="text-xs mt-2 italic" style={{ color: '#6B7280', fontFamily: F.serif, maxWidth: 'none' }}>
          {tip}
        </p>

        {!done && (
          <button onClick={() => { if (timerRef.current) window.clearInterval(timerRef.current); onBreakEnd(); }}
            className="mt-4 px-4 py-2 rounded-xl text-xs border transition-all hover:shadow-sm"
            style={{ background: 'rgba(255,255,255,0.7)', borderColor: '#BBF7D0', color: '#374151', fontFamily: F.display }}>
            End break early
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── ReEngageCard ─────────────────────────────────────────────────────────────

export function ReEngageCard({ reengageMessage, nextTask, onStart }: {
  reengageMessage: string;
  nextTask?: { title: string; startStep: string };
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="rounded-3xl overflow-hidden border"
      style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>

      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: '#2563EB' }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2563EB', fontFamily: F.display }}>Re-entry</p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#374151', maxWidth: 'none' }}>{reengageMessage}</p>

        {nextTask && (
          <div className="mt-4 p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: '#BFDBFE' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7280', fontFamily: F.display }}>Your first step</p>
            <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none' }}>{nextTask.title}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280', maxWidth: 'none' }}>{nextTask.startStep}</p>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl text-sm font-medium text-white"
          style={{ background: '#2563EB', fontFamily: F.display, boxShadow: '0 4px 14px -4px rgba(37,99,235,0.4)' }}>
          <Play className="w-3.5 h-3.5" /> I'm ready — let's go
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── TaskDeconstructorCard ────────────────────────────────────────────────────

const DIFFICULTY_CONFIG = {
  easy:   { color: '#15803D', bg: '#F0FDF4', label: 'Easy' },
  medium: { color: '#D97706', bg: '#FFFBEB', label: 'Medium' },
  hard:   { color: '#DC2626', bg: '#FEF2F2', label: 'Hard' },
};

const TYPE_EMOJI: Record<string, string> = {
  exam_prep: '📚', learning: '🎓', writing: '✍️', code: '💻', project: '🚀',
  meeting_prep: '📋', administrative: '📁', creative: '🎨', research: '🔍',
  health: '💪', communication: '📧', generic: '🎯',
};

function SubTaskRow({ subtask, index, isActive, onStart }: {
  subtask: SubTask; index: number; isActive: boolean; onStart: () => void;
}) {
  const [done, setDone] = useState(false);
  const dc = DIFFICULTY_CONFIG[subtask.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 py-3 border-b last:border-0"
      style={{ borderColor: 'rgba(0,0,0,0.05)', opacity: done ? 0.5 : 1 }}>

      {/* Step number / check */}
      <button
        onClick={() => setDone(d => !d)}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all"
        style={{
          borderColor: done ? '#15803D' : subtask.isStartHere ? '#111827' : '#D1D5DB',
          background: done ? '#15803D' : subtask.isStartHere ? '#111827' : 'white',
          color: done || subtask.isStartHere ? 'white' : '#9CA3AF',
        }}>
        {done ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-xs">{subtask.order}</span>}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm" style={{ color: done ? '#9CA3AF' : '#111827', maxWidth: 'none', textDecoration: done ? 'line-through' : 'none' }}>
            {subtask.title}
          </p>
          {subtask.isStartHere && !done && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#111827', color: 'white', fontFamily: F.display }}>
              START HERE
            </span>
          )}
          {subtask.phaseLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#F3F4F6', color: '#6B7280', fontFamily: F.display }}>
              {subtask.phaseLabel}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280', maxWidth: 'none' }}>{subtask.description}</p>
        {subtask.tip && (
          <p className="text-xs mt-1 italic" style={{ color: '#9CA3AF', fontFamily: F.serif, maxWidth: 'none' }}>
            💡 {subtask.tip}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.mono }}>{subtask.estimatedMinutes} min</span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: dc.bg, color: dc.color, fontFamily: F.display }}>{dc.label}</span>
        </div>
      </div>

      {subtask.isStartHere && !done && (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
          style={{ background: '#111827', fontFamily: F.display }}>
          <Play className="w-3 h-3" /> Start
        </motion.button>
      )}
    </motion.div>
  );
}

export function TaskDeconstructorCard({ analysis, onStartTask, onStartFocus }: {
  analysis: TaskAnalysis;
  onStartTask: (subtask: SubTask) => void;
  onStartFocus: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const emoji = TYPE_EMOJI[analysis.type] || '🎯';
  const totalHours = (analysis.estimatedTotalMinutes / 60).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="rounded-3xl overflow-hidden"
      style={{ ...CARD }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}>
        <div className="text-2xl">{emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#111827', maxWidth: 'none' }}>{analysis.originalTitle}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.mono }}>{totalHours}h total</span>
            <span className="text-xs font-bold uppercase" style={{ color: '#6B7280', fontFamily: F.display }}>{analysis.complexity}</span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>{analysis.subtasks.length} steps</span>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-xl hover:bg-black/5 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-6 py-4">
              {/* Why hard */}
              <div className="p-4 rounded-2xl mb-5" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#6B7280', fontFamily: F.display }}>Why this feels hard</p>
                <p className="text-sm" style={{ color: '#374151', maxWidth: 'none' }}>{analysis.whyHard}</p>
              </div>

              {/* Start here callout */}
              <div className="flex items-start gap-3 p-4 rounded-2xl mb-5" style={{ background: '#111827', color: 'white' }}>
                <Target className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'white' }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: F.display }}>Start exactly here</p>
                  <p className="text-sm font-medium" style={{ maxWidth: 'none' }}>{analysis.startHereTask.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 'none' }}>{analysis.startHereContext}</p>
                  <p className="text-xs mt-1 italic" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: F.serif, maxWidth: 'none' }}>
                    {analysis.timeboxSuggestion}
                  </p>
                </div>
              </div>

              {/* Subtask list */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280', fontFamily: F.display }}>
                  Full breakdown
                </p>
                {analysis.subtasks.map((st, i) => (
                  <SubTaskRow key={st.id} subtask={st} index={i} isActive={st.isStartHere} onStart={() => onStartTask(st)} />
                ))}
              </div>

              {/* ADHD tip */}
              <div className="mt-5 p-4 rounded-2xl border" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#D97706', fontFamily: F.display }}>KAAL's ADHD tip</p>
                <p className="text-xs" style={{ color: '#92400E', maxWidth: 'none' }}>{analysis.adhdTip}</p>
              </div>

              {/* Start focus button */}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={onStartFocus}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-white"
                style={{ background: '#111827', fontFamily: F.display, boxShadow: '0 8px 20px -6px rgba(0,0,0,0.25)' }}>
                <Play className="w-4 h-4" /> Start focus session on Step 1
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── StudyPlanCard ────────────────────────────────────────────────────────────

const FOCUS_TYPE_CONFIG = {
  introduction:  { label: 'Intro',      color: '#2563EB', bg: '#EFF6FF' },
  deep_practice: { label: 'Practice',   color: '#059669', bg: '#ECFDF5' },
  review:        { label: 'Review',     color: '#D97706', bg: '#FFFBEB' },
  mock_test:     { label: 'Mock Test',  color: '#7C3AED', bg: '#F5F3FF' },
};
const DIFF_DOT = { easy: '#15803D', medium: '#D97706', hard: '#DC2626' };

export function StudyPlanCard({ plan, subject, onAddAllToTasks }: {
  plan: StudyPlan;
  subject: string;
  onAddAllToTasks: () => void;
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="rounded-3xl overflow-hidden"
      style={{ ...CARD }}>

      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280', fontFamily: F.display }}>Study Plan</p>
            <h3 className="text-xl font-medium italic mt-1" style={{ fontFamily: F.serif, color: '#111827' }}>
              {subject.charAt(0).toUpperCase() + subject.slice(1)}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium italic" style={{ fontFamily: F.serif, color: '#111827' }}>
              {plan.daysUntilExam}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF', fontFamily: F.display }}>days left</p>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          {[
            { label: 'Daily', value: `${plan.hoursPerDay}h` },
            { label: 'Sessions', value: `${plan.sessions.length}` },
            { label: 'Readiness', value: `${plan.estimatedReadiness}%` },
          ].map(s => (
            <div key={s.label} className="flex-1 p-3 rounded-2xl text-center border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF', fontFamily: F.display }}>{s.label}</p>
              <p className="text-lg font-medium italic mt-0.5" style={{ fontFamily: F.serif, color: '#111827' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div className="px-6 py-4 max-h-80 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280', fontFamily: F.display }}>Day-by-day plan</p>
        <div className="space-y-2">
          {plan.sessions.map(session => {
            const fc = FOCUS_TYPE_CONFIG[session.focusType];
            const isExpanded = expandedDay === session.day;
            return (
              <div key={session.day} className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setExpandedDay(isExpanded ? null : session.day)}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: '#111827', color: 'white', fontFamily: F.mono }}>
                    {session.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: '#111827', maxWidth: 'none' }}>{session.topic}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: fc.bg, color: fc.color, fontFamily: F.display }}>{fc.label}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
                      {session.date} · {session.estimatedHours}h
                      <span className="ml-2 inline-block w-2 h-2 rounded-full" style={{ background: DIFF_DOT[session.difficulty], verticalAlign: 'middle' }} />
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-3 space-y-1.5 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                        {session.subtopics.length > 0 && session.subtopics.map((st, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0 mt-1.5" />
                            <p className="text-xs" style={{ color: '#6B7280', maxWidth: 'none' }}>{st}</p>
                          </div>
                        ))}
                        {session.resources.slice(0, 1).map(r => (
                          <div key={r.title} className="flex items-center gap-2 mt-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <BookOpen className="w-3 h-3 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                            <p className="text-xs" style={{ color: '#6B7280', maxWidth: 'none' }}>{r.title} — {r.source}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam day tips */}
      <div className="px-6 pb-4">
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6B7280', fontFamily: F.display }}>Exam day tips</p>
          {plan.examDayTips.slice(0, 3).map((tip, i) => (
            <div key={i} className="flex items-start gap-2 mb-1">
              <Star className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
              <p className="text-xs" style={{ color: '#374151', maxWidth: 'none' }}>{tip}</p>
            </div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onAddAllToTasks}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border"
          style={{ background: '#111827', color: 'white', fontFamily: F.display, boxShadow: '0 8px 20px -6px rgba(0,0,0,0.25)' }}>
          <Calendar className="w-4 h-4" /> Add all sessions to my tasks
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── ResourceCard ─────────────────────────────────────────────────────────────

const RESOURCE_TYPE_CONFIG = {
  video:    { icon: '▶', color: '#EA4335', bg: '#FEF2F2' },
  article:  { icon: '📄', color: '#2563EB', bg: '#EFF6FF' },
  book:     { icon: '📚', color: '#7C3AED', bg: '#F5F3FF' },
  practice: { icon: '✏️', color: '#059669', bg: '#ECFDF5' },
  tool:     { icon: '🔧', color: '#D97706', bg: '#FFFBEB' },
  course:   { icon: '🎓', color: '#111827', bg: '#F9FAFB' },
};

const PRIORITY_LABEL = {
  essential:    { label: 'Essential', color: '#DC2626' },
  recommended:  { label: 'Recommended', color: '#D97706' },
  optional:     { label: 'Optional', color: '#9CA3AF' },
};

export function ResourceSuggestionCard({ resources, subject, onOpenResource }: {
  resources: Resource[];
  subject: string;
  onOpenResource: (r: Resource) => void;
}) {
  const essential = resources.filter(r => r.priority === 'essential');
  const rest      = resources.filter(r => r.priority !== 'essential');
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? resources : essential.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="rounded-3xl overflow-hidden"
      style={{ ...CARD }}>

      <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280', fontFamily: F.display }}>Resources</p>
        <p className="text-sm font-medium mt-0.5 italic" style={{ fontFamily: F.serif, color: '#111827' }}>
          Best resources for {subject}
        </p>
      </div>

      <div className="px-6 py-4 space-y-3">
        <AnimatePresence>
          {displayed.map((r, i) => {
            const tc = RESOURCE_TYPE_CONFIG[r.type];
            const pl = PRIORITY_LABEL[r.priority];
            return (
              <motion.div key={r.title} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-4 rounded-2xl border group cursor-pointer transition-all hover:shadow-sm"
                style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(0,0,0,0.06)' }}
                onClick={() => onOpenResource(r)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: tc.bg }}>{tc.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none' }}>{r.title}</p>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: pl.color, fontFamily: F.display }}>{pl.label}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.display }}>{r.source}{r.timeMinutes ? ` · ${r.timeMinutes} min` : ''}</p>
                  <p className="text-xs mt-1 italic" style={{ color: '#6B7280', fontFamily: F.serif, maxWidth: 'none' }}>{r.why}</p>
                </div>
                {r.url && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#9CA3AF' }} />}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {rest.length > 0 && !showAll && (
          <button onClick={() => setShowAll(true)} className="w-full text-xs font-medium py-2 transition-opacity hover:opacity-70"
            style={{ color: '#9CA3AF', fontFamily: F.display }}>
            + {rest.length} more resources
          </button>
        )}
      </div>
    </motion.div>
  );
}
