/**
 * Enhanced Brain Dump Component with KAAL Agent Integration
 * 
 * Features:
 * - Live feedback as user types (item count, emotional signal, dependencies)
 * - 6 intent buttons with different processing modes
 * - Full integration with 8-engine orchestrator
 * - Emotional load detection and UI adaptation
 * - Dependency visualization
 * - Duplicate warnings
 * - Energy-aware scheduling
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Sparkles, AlertCircle, Zap, Clock, Link2, 
  CheckCircle2, AlertTriangle, Lightbulb, Ban, Bell,
  ArrowRight, Play, Timer, Globe
} from 'lucide-react';
import { processBrainDump, getLiveFeedback } from '../lib/brainDumpOrchestrator';
import type { BrainDumpResult, Intent } from '../lib/brainDumpParser/types';
import { 
  getIntentLabel, 
  getIntentIcon,
  formatDeadline,
  getUrgencyColor,
  getEmotionalLoadEmoji,
  getEmotionalLoadColor,
  getLoadUITreatment,
  formatFocusTime
} from '../lib/brainDumpParser';
import { 
  loadTimezonePreference,
  getTimezoneFriendlyName,
  getCurrentHourInTimezone 
} from '../lib/timezone-service';
import { supabase } from '../services/supabase-client';
import { toast } from 'sonner@2.0.3';

const INTENT_BUTTONS: { value: Intent; emoji: string; label: string }[] = [
  { value: 'overwhelmed', emoji: '😰', label: "I'm overwhelmed" },
  { value: 'planning', emoji: '📅', label: 'Planning my day' },
  { value: 'stuck', emoji: '🚧', label: "I'm stuck" },
  { value: 'rambling', emoji: '💭', label: 'Just rambling' },
  { value: 'priorities', emoji: '🎯', label: 'What are priorities?' },
  { value: 'endofday', emoji: '🌙', label: 'End of day' },
];

interface BrainDumpAgentProps {
  userId: string;
  userEnergyPattern?: Record<number, number>;
}

export function BrainDumpAgent({ userId, userEnergyPattern = {} }: BrainDumpAgentProps) {
  const [text, setText] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<Intent>('planning');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BrainDumpResult | null>(null);
  const [liveFeedback, setLiveFeedback] = useState({ 
    itemCount: 0, 
    emotionalSignal: 'calm' as 'calm' | 'stressed' | 'overwhelmed',
    dependencyCount: 0,
    characterCount: 0 
  });
  const [creatingTasks, setCreatingTasks] = useState(false);

  // Live feedback as user types
  useEffect(() => {
    if (text.length === 0) {
      setLiveFeedback({ itemCount: 0, emotionalSignal: 'calm', dependencyCount: 0, characterCount: 0 });
      return;
    }

    const timer = setTimeout(() => {
      const feedback = getLiveFeedback(text);
      setLiveFeedback(feedback);
    }, 300);

    return () => clearTimeout(timer);
  }, [text]);

  const handleProcess = async () => {
    if (!text.trim()) return;

    setProcessing(true);
    setResult(null);

    try {
      const processedResult = await processBrainDump(
        text,
        selectedIntent,
        userId,
        userEnergyPattern
      );

      setResult(processedResult);
      toast.success('Brain dump processed!', {
        description: `Found ${processedResult.tasks.length} tasks`
      });
    } catch (error) {
      console.error('Brain dump processing error:', error);
      toast.error('Failed to process brain dump', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!result || result.tasks.length === 0) return;

    setCreatingTasks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to create tasks');
        return;
      }

      let created = 0;
      for (const task of result.tasks) {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: task.text,
            priority: task.urgency_score >= 4 ? 'urgent' : task.urgency_score >= 3 ? 'high' : 'medium',
            status: 'todo',
            estimated_minutes: task.estimated_minutes || 25,
            deadline_at: task.deadline_at?.toISOString(),
            description: `Created from Brain Dump · ${new Date().toLocaleDateString()}`,
          });

        if (!error) created++;
      }

      toast.success(`Created ${created} tasks!`);
      setText('');
      setResult(null);
    } catch (error) {
      console.error('Task creation error:', error);
      toast.error('Failed to create tasks');
    } finally {
      setCreatingTasks(false);
    }
  };

  const emotionalLoadTreatment = result ? getLoadUITreatment(result.emotional_load.load_level) : null;

  return (
    <div className="space-y-6">
      {/* Brain Dump Textarea */}
      <div className="space-y-3">
        <label className="text-sm font-bold uppercase tracking-widest text-gray-500">
          Brain Dump
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dump everything on your mind... tasks, worries, ideas, blockers..."
          maxLength={2000}
          rows={8}
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm 
            resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            text-sm leading-relaxed placeholder:text-gray-400"
        />

        {/* Live Feedback */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{text.length}/2000</span>
          
          {liveFeedback.itemCount > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              → {liveFeedback.itemCount} items detected
            </span>
          )}

          {liveFeedback.emotionalSignal !== 'calm' && (
            <span className="flex items-center gap-1">
              {getEmotionalLoadEmoji(liveFeedback.emotionalSignal)}
              {liveFeedback.emotionalSignal === 'overwhelmed' ? 'Overwhelmed' : 'Stressed'}
            </span>
          )}

          {liveFeedback.dependencyCount > 0 && (
            <span className="flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" />
              {liveFeedback.dependencyCount} {liveFeedback.dependencyCount === 1 ? 'dependency' : 'dependencies'}
            </span>
          )}
        </div>
      </div>

      {/* Intent Buttons */}
      <div className="space-y-3">
        <label className="text-sm font-bold uppercase tracking-widest text-gray-500">
          How are you feeling?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {INTENT_BUTTONS.map((intent) => (
            <button
              key={intent.value}
              onClick={() => setSelectedIntent(intent.value)}
              className={`
                px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${selectedIntent === intent.value
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:border-indigo-300'
                }
              `}
            >
              <span className="mr-2">{intent.emoji}</span>
              {intent.label}
            </button>
          ))}
        </div>
      </div>

      {/* Process Button */}
      <div className="space-y-2">
        {/* Time & Timezone Context Indicator */}
        <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span title={loadTimezonePreference()}>
              {getTimezoneFriendlyName(loadTimezonePreference()).split('(')[0].trim()}
            </span>
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={!text.trim() || processing}
          className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 
            text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl 
            disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center 
            justify-center gap-2"
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Organize + Create Tasks
            </>
          )}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Emotional Load Banner */}
            {result.emotional_load.load_level !== 'calm' && emotionalLoadTreatment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-3xl shadow-lg"
                style={{ backgroundColor: emotionalLoadTreatment.bannerColor + '15' }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: emotionalLoadTreatment.bannerColor + '20' }}
                  >
                    {getEmotionalLoadEmoji(result.emotional_load.load_level)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg" style={{ color: emotionalLoadTreatment.bannerColor }}>
                      {emotionalLoadTreatment.bannerText}
                    </p>
                    <p className="text-gray-700 mt-2">{result.response_opening}</p>
                    
                    {result.emotional_load.show_break_suggestion && (
                      <p className="text-sm text-gray-600 mt-3">
                        💡 Take 5 deep breaths before starting. You've got this.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tasks Section */}
            {result.tasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-widest text-gray-500">
                    Tasks ({result.tasks.length})
                  </label>
                  <button
                    onClick={handleCreateTasks}
                    disabled={creatingTasks}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold 
                      hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {creatingTasks ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Create All Tasks
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  {result.tasks.slice(0, emotionalLoadTreatment?.maxTasksToShow || 10).map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 
                        hover:shadow-md transition-all"
                      style={emotionalLoadTreatment?.fontSize === 'large' && i === 0 ? { 
                        fontSize: '1.125rem', 
                        padding: '1.5rem' 
                      } : {}}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: getUrgencyColor(task.urgency_score || 0) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{task.text}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                            {task.deadline_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDeadline(task.deadline_at)}
                              </span>
                            )}
                            
                            {task.estimated_minutes && (
                              <span className="flex items-center gap-1">
                                <Timer className="w-3.5 h-3.5" />
                                {task.estimated_minutes} min
                              </span>
                            )}

                            {task.urgency_score >= 4 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                                Urgent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {result.total_hidden > 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      + {result.total_hidden} more tasks (collapsed for focus)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Worries Section */}
            {result.worries.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-500">
                  Things you're carrying (not tasks)
                </label>
                <div className="space-y-2">
                  {result.worries.map((worry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-2xl bg-gray-50 border border-gray-200"
                    >
                      <p className="text-gray-600 text-sm">{worry.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        It's okay to feel this way. This isn't a task to complete.
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {result.dependency_chains.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Task Dependencies
                </label>
                <div className="space-y-2">
                  {result.dependency_chains.map((dep, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-sm text-gray-700">{dep.before}</span>
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">{dep.after}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicates */}
            {result.duplicate_clusters.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Duplicate Tasks Detected
                </label>
                <div className="space-y-2">
                  {result.duplicate_clusters.map((cluster, i) => (
                    <div key={i} className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">
                        ⚠️ These tasks look similar:
                      </p>
                      <ul className="space-y-1">
                        {cluster.map((task, j) => (
                          <li key={j} className="text-sm text-gray-700">• {task}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            {result.schedule.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Energy-Aware Schedule
                </label>
                <p className="text-sm text-gray-600">
                  Total focus time: {formatFocusTime(result.schedule.reduce((sum, s) => sum + (s.task.estimated_minutes || 25), 0))}
                </p>
                <div className="space-y-2">
                  {result.schedule.map((scheduled, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{scheduled.task.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {scheduled.starts_at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {scheduled.reason}
                          </p>
                        </div>
                        <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold 
                          hover:bg-indigo-700 transition-all flex items-center gap-1.5">
                          <Play className="w-3 h-3" />
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ideas and Blockers */}
            {(result.ideas.length > 0 || result.blockers.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {result.ideas.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Ideas
                    </label>
                    {result.ideas.map((idea, i) => (
                      <div key={i} className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-sm text-gray-700">
                        {idea.text}
                      </div>
                    ))}
                  </div>
                )}

                {result.blockers.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Blockers
                    </label>
                    {result.blockers.map((blocker, i) => (
                      <div key={i} className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-gray-700">
                        {blocker.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}