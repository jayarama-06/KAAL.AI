/**
 * Smart Insights Panel - AI-generated recommendations and nudges
 * Displays contextual AI insights in a non-intrusive way
 */

import { useState, useEffect } from 'react';
import { Brain, X, Lightbulb, AlertTriangle, PartyPopper, Sparkles, TrendingUp, Zap, Settings } from 'lucide-react';
import { useAIContext } from '../context/AIContext';
import { AISettingsModal } from './AISettingsModal';
import type { AIInsight } from '../services/ai-engine';

export function SmartInsightsPanel() {
  const { activeInsights, dismissInsight, globalFocusState, globalEnergyPattern, geminiEnabled } = useAIContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleInsights, setVisibleInsights] = useState<AIInsight[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Show only non-dismissed, high-priority insights
    setVisibleInsights(
      activeInsights
        .filter(i => !i.dismissed)
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 3) // Show max 3 at a time
    );
  }, [activeInsights]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'nudge':
        return <Lightbulb className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'celebration':
        return <PartyPopper className="w-5 h-5" />;
      case 'suggestion':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'nudge':
        return '#3B82F6'; // blue
      case 'warning':
        return '#F59E0B'; // amber
      case 'celebration':
        return '#10B981'; // green
      case 'suggestion':
        return '#8B5CF6'; // purple
      default:
        return '#6B7280'; // gray
    }
  };

  if (!isExpanded && visibleInsights.length > 0) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center group transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
          boxShadow: '0 10px 40px -5px rgba(102, 126, 234, 0.5)'
        }}
      >
        <Brain className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        <span 
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
          style={{ boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)' }}
        >
          {visibleInsights.length}
        </span>
      </button>
    );
  }

  if (!isExpanded || visibleInsights.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      {/* Header */}
      <div 
        className="rounded-t-2xl px-5 py-4 flex items-center justify-between border-b"
        style={{
          background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Insights
              {geminiEnabled && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/20 text-white/90">
                  GEMINI
                </span>
              )}
            </h3>
            <p className="text-xs text-white/80">Smart recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="AI Settings"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {(globalFocusState || globalEnergyPattern) && (
        <div 
          className="px-5 py-3 flex items-center gap-4 border-b"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(0, 0, 0, 0.05)'
          }}
        >
          {globalFocusState && (
            <div className="flex items-center gap-2 flex-1">
              <TrendingUp className="w-4 h-4" style={{ color: '#6B7280' }} />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Focus
                </div>
                <div className="text-sm font-bold" style={{ color: '#111827' }}>
                  {globalFocusState.level}%
                </div>
              </div>
            </div>
          )}
          {globalEnergyPattern && (
            <div className="flex items-center gap-2 flex-1">
              <Zap className="w-4 h-4" style={{ color: '#6B7280' }} />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Energy
                </div>
                <div className="text-sm font-bold" style={{ color: '#111827' }}>
                  {globalEnergyPattern.current}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights List */}
      <div 
        className="rounded-b-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="max-h-96 overflow-y-auto">
          {visibleInsights.map((insight, index) => (
            <div
              key={insight.id}
              className="p-5 border-b last:border-b-0 hover:bg-white/50 transition-colors group relative"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.05)',
                animation: `slideIn 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Priority indicator */}
              {insight.priority === 'high' || insight.priority === 'critical' ? (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: getInsightColor(insight.type) }}
                />
              ) : null}

              <div className="flex gap-4">
                {/* Icon */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${getInsightColor(insight.type)}15`,
                    color: getInsightColor(insight.type)
                  }}
                >
                  {getInsightIcon(insight.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 
                    className="font-bold text-sm mb-1"
                    style={{ color: '#111827' }}
                  >
                    {insight.title}
                  </h4>
                  <p 
                    className="text-xs leading-relaxed"
                    style={{ color: '#6B7280' }}
                  >
                    {insight.message}
                  </p>

                  {/* Action button */}
                  {insight.action && (
                    <button
                      onClick={insight.action.handler}
                      className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: getInsightColor(insight.type),
                        color: 'white'
                      }}
                    >
                      {insight.action.label}
                    </button>
                  )}

                  {/* Timestamp */}
                  <div 
                    className="mt-2 text-[10px] font-medium"
                    style={{ color: '#9CA3AF' }}
                  >
                    {new Date(insight.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: '#6B7280' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {visibleInsights.length > 0 && (
          <div 
            className="px-5 py-3 text-center border-t"
            style={{
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderColor: 'rgba(0, 0, 0, 0.05)'
            }}
          >
            <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>
              AI is monitoring your session for optimization opportunities
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Settings Modal */}
      {showSettings && (
        <AISettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}