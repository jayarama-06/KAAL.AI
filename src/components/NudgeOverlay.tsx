/**
 * KAAL Nudge Overlay Components
 * 
 * Five nudge UI variations that appear on top of the dashboard:
 * 1. Gentle nudge (auto-dismiss)
 * 2. Active nudge (with Start button)
 * 3. Intervention (full-screen modal)
 * 4. Context switch (suggests different task)
 * 5. Break reminder (with countdown timer)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Clock, Coffee, ArrowRight, AlertCircle } from 'lucide-react';
import { NudgeDecision, NudgeType } from '../lib/nudgeEngine';
import { RankedTask } from '../lib/rankTasks';

interface NudgeOverlayProps {
  decision: NudgeDecision;
  message: string | null;
  isLoading: boolean;
  onStart: (taskId: string) => void;
  onDefer: (taskId: string) => void;
  onDismiss: () => void;
  onSwitch?: (fromTaskId: string, toTaskId: string) => void;
}

export function NudgeOverlay({
  decision,
  message,
  isLoading,
  onStart,
  onDefer,
  onDismiss,
  onSwitch,
}: NudgeOverlayProps) {
  const { type, task } = decision;

  // Gentle nudge auto-dismisses after 60 seconds
  useEffect(() => {
    if (type === 'gentle') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 60000); // 60 seconds

      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  switch (type) {
    case 'gentle':
      return <GentleNudge task={task} message={message} isLoading={isLoading} onDismiss={onDismiss} />;
    case 'active':
      return <ActiveNudge task={task} message={message} isLoading={isLoading} onStart={onStart} onDismiss={onDismiss} />;
    case 'intervention':
      return <InterventionNudge task={task} message={message} isLoading={isLoading} onStart={onStart} onDefer={onDefer} />;
    case 'context_switch':
      return <ContextSwitchNudge task={task} message={message} isLoading={isLoading} onSwitch={onSwitch} onDismiss={onDismiss} />;
    case 'break_reminder':
      return <BreakReminderNudge onDismiss={onDismiss} />;
    default:
      return null;
  }
}

// ─── Gentle Nudge (light purple, auto-dismiss) ─────────────────────────────
function GentleNudge({
  task,
  message,
  isLoading,
  onDismiss,
}: {
  task: RankedTask;
  message: string | null;
  isLoading: boolean;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 right-6 z-50 w-96 rounded-3xl border shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
        borderColor: '#DDD6FE',
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Gentle reminder
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-purple-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-purple-600" />
          </button>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
        
        <p className="text-sm text-gray-700 leading-relaxed">
          {isLoading ? (
            <span className="italic text-gray-500">Thinking...</span>
          ) : (
            message || 'Your next task is waiting. What is one small step you can take right now?'
          )}
        </p>

        {task.estimated_minutes && (
          <div className="mt-3 flex items-center gap-2 text-xs text-purple-600">
            <Clock className="w-3.5 h-3.5" />
            <span>{task.estimated_minutes} min estimated</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Active Nudge (with Start button) ──────────────────────────────────────
function ActiveNudge({
  task,
  message,
  isLoading,
  onStart,
  onDismiss,
}: {
  task: RankedTask;
  message: string | null;
  isLoading: boolean;
  onStart: (taskId: string) => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 right-6 z-50 w-96 rounded-3xl border shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        borderColor: '#FDE68A',
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Time to act
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-amber-600" />
          </button>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
        
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          {isLoading ? (
            <span className="italic text-gray-500">Thinking...</span>
          ) : (
            message || 'This task has been waiting. Starting now protects the rest of your day.'
          )}
        </p>

        <button
          onClick={() => onStart(task.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-95"
          style={{ background: '#111827', color: '#fff' }}
        >
          <Play className="w-4 h-4" />
          Start Now
        </button>
      </div>
    </motion.div>
  );
}

// ─── Intervention (full-screen modal) ──────────────────────────────────────
function InterventionNudge({
  task,
  message,
  isLoading,
  onStart,
  onDefer,
}: {
  task: RankedTask;
  message: string | null;
  isLoading: boolean;
  onStart: (taskId: string) => void;
  onDefer: (taskId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border shadow-2xl p-8"
        style={{
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
          borderColor: '#FECACA',
        }}
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Time to act.</h2>
          <p className="text-sm text-gray-600">This task needs a decision</p>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-lg text-gray-900 mb-3">{task.title}</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {isLoading ? (
              <span className="italic text-gray-500">Thinking...</span>
            ) : (
              message || 'This task needs your attention. Time to make a decision: start it or reschedule it.'
            )}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onStart(task.id)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all hover:shadow-md active:scale-95"
            style={{ background: '#111827', color: '#fff' }}
          >
            <Play className="w-4 h-4" />
            Start Now
          </button>

          <button
            onClick={() => onDefer(task.id)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold border transition-all hover:shadow-md active:scale-95"
            style={{ background: '#fff', color: '#374151', borderColor: '#E5E7EB' }}
          >
            <ArrowRight className="w-4 h-4" />
            Reschedule
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Context Switch (suggests different task) ──────────────────────────────
function ContextSwitchNudge({
  task,
  message,
  isLoading,
  onSwitch,
  onDismiss,
}: {
  task: RankedTask;
  message: string | null;
  isLoading: boolean;
  onSwitch?: (fromTaskId: string, toTaskId: string) => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 right-6 z-50 w-96 rounded-3xl border shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        borderColor: '#BFDBFE',
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Energy shift detected
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-3">
          Your energy has shifted. Here's a better task for right now:
        </p>

        <div className="p-3 rounded-xl bg-white/60 border border-blue-200 mb-4">
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          {task.estimated_minutes && (
            <p className="text-xs text-gray-500 mt-1">{task.estimated_minutes} min</p>
          )}
        </div>

        {onSwitch && (
          <button
            onClick={() => onSwitch('current', task.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-95"
            style={{ background: '#111827', color: '#fff' }}
          >
            Switch to {task.title.length > 20 ? 'this task' : task.title}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Break Reminder (with countdown timer) ─────────────────────────────────
function BreakReminderNudge({ onDismiss }: { onDismiss: () => void }) {
  const [breakStarted, setBreakStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (!breakStarted) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breakStarted]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 right-6 z-50 w-96 rounded-3xl border shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)',
        borderColor: '#BBF7D0',
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-green-700">
              Break time
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-green-600" />
          </button>
        </div>

        {!breakStarted ? (
          <>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              You've been focused for over 90 minutes. A short break improves output.
            </p>

            <button
              onClick={() => setBreakStarted(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-95"
              style={{ background: '#059669', color: '#fff' }}
            >
              <Coffee className="w-4 h-4" />
              Take a 10-min break
            </button>
          </>
        ) : timeLeft > 0 ? (
          <div className="text-center">
            <div className="text-5xl font-bold text-green-700 mb-2" style={{ fontFamily: 'monospace' }}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <p className="text-sm text-gray-600">Break in progress...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Coffee className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Break complete.</p>
            <p className="text-sm text-gray-600 mb-4">Ready to continue.</p>
            <button
              onClick={onDismiss}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-95"
              style={{ background: '#059669', color: '#fff' }}
            >
              Back to work
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
