/**
 * AI Control Center - Dashboard widget showing AI status and controls
 */

import { useState } from 'react';
import { Brain, Activity, Zap, TrendingUp, Target, Clock, BarChart3, Settings } from 'lucide-react';
import { useAIContext } from '../context/AIContext';

export function AIControlCenter() {
  const { 
    isInitialized, 
    globalFocusState, 
    globalEnergyPattern, 
    currentSession,
    getRecommendations 
  } = useAIContext();
  
  const [showDetails, setShowDetails] = useState(false);
  const recommendations = getRecommendations();

  if (!isInitialized) {
    return (
      <div 
        className="rounded-3xl p-8 shadow-lg flex items-center justify-center"
        style={{
          background: "rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          minHeight: "200px"
        }}
      >
        <div className="text-center">
          <Brain className="w-8 h-8 mx-auto mb-3 animate-pulse" style={{ color: '#6B7280' }} />
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
            Initializing AI Engine...
          </p>
        </div>
      </div>
    );
  }

  const focusLevel = globalFocusState?.level || 0;
  const energyLevel = globalEnergyPattern?.current || 0;
  const focusQuality = globalFocusState?.quality || 'moderate';
  const energyTrend = globalEnergyPattern?.trend || 'stable';

  return (
    <div 
      className="rounded-3xl shadow-lg overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.4)"
      }}
    >
      {/* Header */}
      <div 
        className="px-8 py-6 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
            }}
          >
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>
              AI Command Center
            </h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Real-time intelligence & optimization
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
        >
          <Settings className="w-5 h-5" style={{ color: '#6B7280' }} />
        </button>
      </div>

      {/* Main Metrics */}
      <div className="p-8 grid grid-cols-2 gap-6">
        {/* Focus Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: '#6B7280' }} />
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                Focus
              </span>
            </div>
            <span 
              className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: focusQuality === 'deep' ? '#10B98115' : 
                                focusQuality === 'moderate' ? '#3B82F615' : '#F59E0B15',
                color: focusQuality === 'deep' ? '#10B981' : 
                       focusQuality === 'moderate' ? '#3B82F6' : '#F59E0B'
              }}
            >
              {focusQuality}
            </span>
          </div>
          <div className="relative">
            <div className="flex items-baseline gap-1">
              <span 
                className="text-4xl font-bold"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: '#111827' 
                }}
              >
                {focusLevel}
              </span>
              <span className="text-lg font-medium" style={{ color: '#6B7280' }}>
                /100
              </span>
            </div>
            {/* Progress bar */}
            <div 
              className="mt-3 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${focusLevel}%`,
                  background: "linear-gradient(90deg, #667EEA 0%, #764BA2 100%)"
                }}
              />
            </div>
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#6B7280' }} />
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                Energy
              </span>
            </div>
            <span 
              className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
              style={{
                backgroundColor: energyTrend === 'rising' ? '#10B98115' : 
                                energyTrend === 'stable' ? '#3B82F615' : '#F59E0B15',
                color: energyTrend === 'rising' ? '#10B981' : 
                       energyTrend === 'stable' ? '#3B82F6' : '#F59E0B'
              }}
            >
              <TrendingUp className="w-3 h-3" />
              {energyTrend}
            </span>
          </div>
          <div className="relative">
            <div className="flex items-baseline gap-1">
              <span 
                className="text-4xl font-bold"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: '#111827' 
                }}
              >
                {energyLevel}
              </span>
              <span className="text-lg font-medium" style={{ color: '#6B7280' }}>
                /100
              </span>
            </div>
            {/* Progress bar */}
            <div 
              className="mt-3 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${energyLevel}%`,
                  background: "linear-gradient(90deg, #F59E0B 0%, #10B981 100%)"
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      {currentSession && (
        <div 
          className="px-8 py-6 border-t"
          style={{ 
            borderColor: "rgba(0, 0, 0, 0.05)",
            backgroundColor: "rgba(255, 255, 255, 0.3)"
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3" style={{ color: '#6B7280' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Duration
                </span>
              </div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>
                {Math.floor((Date.now() - currentSession.startTime) / 60000)} min
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3" style={{ color: '#6B7280' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Flow Time
                </span>
              </div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>
                {currentSession.flowMinutes} min
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-3 h-3" style={{ color: '#6B7280' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Productivity
                </span>
              </div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>
                {currentSession.productivity}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div 
          className="px-8 py-6 border-t"
          style={{ borderColor: "rgba(0, 0, 0, 0.05)" }}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
            AI Recommendations
          </h4>
          <div className="space-y-2">
            {recommendations.slice(0, 2).map((rec, i) => (
              <div 
                key={i}
                className="flex items-start gap-2 text-xs p-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  color: '#111827'
                }}
              >
                <span className="text-lg">💡</span>
                <p className="flex-1 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Energy Forecast */}
      {globalEnergyPattern && globalEnergyPattern.forecast.length > 0 && showDetails && (
        <div 
          className="px-8 py-6 border-t"
          style={{ borderColor: "rgba(0, 0, 0, 0.05)" }}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>
            6-Hour Energy Forecast
          </h4>
          <div className="flex items-end gap-2 h-20">
            {globalEnergyPattern.forecast.map((level, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${level}%`,
                    background: "linear-gradient(180deg, #667EEA 0%, #764BA2 100%)",
                    opacity: 0.7
                  }}
                />
                <span className="text-[10px] font-medium" style={{ color: '#6B7280' }}>
                  +{i + 1}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
