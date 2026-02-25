import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Zap, Clock, Brain, ChevronRight, X } from "lucide-react";
import { contextAI, type TaskRecommendation, type ProactiveNudge } from "../services/context-ai-service";
import { Task } from "../services/task-service";
import { useNavigate } from "react-router";

interface AIRecommendationsWidgetProps {
  userId: string;
  tasks: Task[];
  onTaskSelect?: (taskId: string) => void;
}

export function AIRecommendationsWidget({ userId, tasks, onTaskSelect }: AIRecommendationsWidgetProps) {
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [nudges, setNudges] = useState<ProactiveNudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [optimalPattern, setOptimalPattern] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendations();
  }, [userId, tasks]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const insights = await contextAI.getAIInsights(userId, tasks);
      setRecommendations(insights.recommendations.slice(0, 3)); // Top 3
      setNudges(insights.nudges);
      setOptimalPattern(insights.optimalWorkPattern);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissNudge = (nudgeId: string) => {
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'high': return { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' };
      case 'medium': return { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' };
      default: return { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' };
    }
  };

  const getNudgeIcon = (type: string) => {
    switch (type) {
      case 'celebration': return '🎉';
      case 'warning': return '⚠️';
      case 'suggestion': return '💡';
      case 'nudge': return '👋';
      default: return '✨';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-white/60 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#111827]">AI Analyzing...</h3>
            <p className="text-xs text-[#6B7280]">Understanding your current state</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Nudges */}
      {nudges.length > 0 && (
        <div className="space-y-3">
          {nudges.map((nudge) => {
            const colors = getPriorityColor(nudge.priority);
            return (
              <div
                key={nudge.id}
                className="relative rounded-2xl p-4 border-2 shadow-sm hover:shadow-md transition-all duration-200"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <button
                  onClick={() => dismissNudge(nudge.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/50 transition-colors"
                  style={{ color: colors.text }}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex gap-3 pr-8">
                  <div className="text-2xl">{getNudgeIcon(nudge.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1" style={{ color: colors.text }}>
                      {nudge.title}
                    </h4>
                    <p className="text-sm mb-3" style={{ color: colors.text }}>
                      {nudge.message}
                    </p>
                    {nudge.actionLabel && (
                      <button
                        className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:shadow-sm transition-all"
                        style={{
                          backgroundColor: 'white',
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {nudge.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Recommendations Card */}
      <div
        className="rounded-2xl p-6 border border-white/60 shadow-sm relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
        }}
      >
        {/* Decorative gradient orb */}
        <div
          className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#111827]">AI Recommendations</h3>
                <p className="text-xs text-[#6B7280]">Optimized for your current state</p>
              </div>
            </div>
            
            {optimalPattern && (
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6] mb-0.5">
                  Suggested Pattern
                </div>
                <div className="text-sm font-medium text-[#111827]">
                  {optimalPattern.workDuration}min work / {optimalPattern.breakDuration}min break
                </div>
              </div>
            )}
          </div>

          {/* Recommended Tasks */}
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.task.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => onTaskSelect?.(rec.task.id)}
                >
                  {/* Rank Badge */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        background: index === 0
                          ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                          : index === 1
                          ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                          : 'linear-gradient(135deg, #10B981, #3B82F6)',
                        color: 'white',
                      }}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Task Title */}
                      <h4 className="font-semibold text-[#111827] mb-1 group-hover:text-purple-600 transition-colors">
                        {rec.task.title}
                      </h4>

                      {/* AI Reasoning */}
                      <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">
                        {rec.reasoning}
                      </p>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-xs">
                        {/* Match Score */}
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                          <span className="font-medium text-[#111827]">{rec.score}% match</span>
                        </div>

                        {/* Energy Match */}
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="font-medium text-[#111827]">{rec.energyMatch}% energy</span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium text-[#111827]">{rec.suggestedDuration}min</span>
                        </div>

                        {/* Confidence */}
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-purple-500" />
                          <span className="font-medium text-[#111827]">{rec.confidence}% confident</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#6B7280]">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tasks to recommend right now</p>
              <p className="text-xs mt-1">Add some tasks to get AI suggestions</p>
            </div>
          )}

          {/* View All Link */}
          {recommendations.length > 0 && (
            <button
              onClick={() => navigate('/tasks')}
              className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-purple-200 text-purple-600 font-medium text-sm hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              View All Tasks & Analysis →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
