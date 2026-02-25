/**
 * KaalContextPanel
 * The "KAAL Knows" tab — makes the AI's live understanding of the user fully visible.
 * Shows vitals, integration signals, proactive queue, and win reel.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Brain, TrendingUp, Clock, Target, CheckCircle2,
  AlertCircle, RefreshCw, ChevronRight, Flame,
  Music, Calendar, Mail, FileText, Sparkles, X, Trophy, RotateCcw,
} from 'lucide-react';
import { contextEngine, UserContext, UserVitals, ProactiveAction, WinEvent } from '../services/context-engine';
import { winDetector } from '../services/win-detector';
import { agentActions } from '../services/agent-actions';
import { toast } from 'sonner@2.0.3';

const F = {
  display: 'var(--font-display)',
  serif:   "'Playfair Display', serif",
  mono:    'var(--font-mono)',
};
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.4)',
  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)',
};
const GLASS_HOVER: React.CSSProperties = {
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
};

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#6B7280', fontFamily: F.display }}>{children}</p>;
}

// ─── Animated arc gauge ───────────────────────────────────────────────────────

function ArcGauge({ value, label, color, size = 100 }: { value: number; label: string; color: string; size?: number }) {
  const r = (size / 2) - 10;
  const circumference = Math.PI * r; // half circle
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* Track */}
        <path
          d={`M ${size * 0.1} ${size / 2} A ${r} ${r} 0 0 1 ${size * 0.9} ${size / 2}`}
          fill="none" stroke="#F3F4F6" strokeWidth="8" strokeLinecap="round"
        />
        {/* Fill */}
        <motion.path
          d={`M ${size * 0.1} ${size / 2} A ${r} ${r} 0 0 1 ${size * 0.9} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        />
        {/* Value */}
        <text x={size / 2} y={size / 2 + 2} textAnchor="middle" fontSize="18" fontWeight="700"
          fill="#111827" fontFamily="'Playfair Display', serif">{Math.round(value)}</text>
      </svg>
      <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: '#9CA3AF', fontFamily: F.display }}>{label}</p>
    </div>
  );
}

// ─── Vitals card ──────────────────────────────────────────────────────────────

const MOOD_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  energised:   { emoji: '⚡', color: '#D97706', bg: '#FFFBEB' },
  focused:     { emoji: '🎯', color: '#059669', bg: '#ECFDF5' },
  neutral:     { emoji: '😌', color: '#6B7280', bg: '#F9FAFB' },
  tired:       { emoji: '😴', color: '#9CA3AF', bg: '#F9FAFB' },
  stressed:    { emoji: '😰', color: '#DC2626', bg: '#FEF2F2' },
  anxious:     { emoji: '😟', color: '#EA580C', bg: '#FFF7ED' },
  overwhelmed: { emoji: '🌊', color: '#7C3AED', bg: '#F5F3FF' },
};

const STATE_CONFIG: Record<string, { label: string; color: string }> = {
  deep_work_ready: { label: 'Deep Work Ready', color: '#059669' },
  shallow_ok:      { label: 'Shallow Work OK',  color: '#2563EB' },
  recovery:        { label: 'Recovery Mode',    color: '#D97706' },
  rest_needed:     { label: 'Rest Needed',      color: '#DC2626' },
};

function VitalsCard({ vitals }: { vitals: UserVitals }) {
  const mood = MOOD_CONFIG[vitals.mood] || MOOD_CONFIG.neutral;
  const state = STATE_CONFIG[vitals.cognitiveState];

  return (
    <div className="p-6 rounded-3xl border" style={{ ...GLASS }}>
      <div className="flex items-center justify-between mb-6">
        <Label>Live Vitals</Label>
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
          style={{ background: mood.bg, color: mood.color, borderColor: mood.color + '33', fontFamily: F.display }}>
          {mood.emoji} {vitals.mood.replace('_', ' ')}
        </span>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <ArcGauge value={vitals.energyScore}   label="Energy"   color={vitals.energyScore > 60 ? '#059669' : vitals.energyScore > 35 ? '#D97706' : '#DC2626'} />
        <ArcGauge value={vitals.cognitiveLoad} label="Cog Load" color={vitals.cognitiveLoad < 50 ? '#059669' : vitals.cognitiveLoad < 75 ? '#D97706' : '#DC2626'} />
        <ArcGauge value={vitals.stressScore}   label="Stress"   color={vitals.stressScore < 30 ? '#059669' : vitals.stressScore < 60 ? '#D97706' : '#DC2626'} />
      </div>

      {/* State badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF', fontFamily: F.display }}>Cognitive State</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: state?.color || '#111827' }}>{state?.label || vitals.cognitiveState}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF', fontFamily: F.display }}>Sustainable</p>
          <p className="text-sm font-medium mt-0.5 italic" style={{ fontFamily: F.serif, color: '#111827' }}>{vitals.sustainableMinutesLeft}<span className="text-xs not-italic" style={{ fontFamily: F.display }}> min</span></p>
        </div>
      </div>

      {/* Energy trend */}
      <div className="mt-3 flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${vitals.energyTrend === 'rising' ? 'bg-green-500' : vitals.energyTrend === 'falling' ? 'bg-red-400' : 'bg-gray-400'}`} />
        <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.display }}>
          Energy {vitals.energyTrend} · {vitals.energyTrend === 'rising' ? 'Building momentum' : vitals.energyTrend === 'falling' ? 'Consider a break soon' : 'Holding steady'}
        </p>
      </div>
    </div>
  );
}

// ─── Integration signal row ───────────────────────────────────────────────────

function IntegrationSignalRow({ icon, label, color, signal, status, detail }: {
  icon: React.ReactNode; label: string; color: string; signal: string; status: 'live' | 'demo' | 'off'; detail: string;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
      <div className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm border border-gray-100 bg-white"
        style={{ color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none' }}>{label}</p>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${status === 'live' ? 'bg-green-50 text-green-600' : status === 'demo' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'}`}
            style={{ fontFamily: F.display }}>{status}</span>
        </div>
        <p className="text-xs font-medium italic" style={{ color, fontFamily: F.serif }}>{signal}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', maxWidth: 'none' }}>{detail}</p>
      </div>
    </div>
  );
}

// ─── Proactive action card ────────────────────────────────────────────────────

const ACTION_TYPE_CONFIG: Record<ProactiveAction['type'], { icon: string; color: string; bg: string }> = {
  remind:     { icon: '🔔', color: '#2563EB', bg: '#EFF6FF' },
  draft:      { icon: '✍️', color: '#059669', bg: '#ECFDF5' },
  schedule:   { icon: '📅', color: '#4285F4', bg: '#EFF6FF' },
  block_time: { icon: '🎯', color: '#111827', bg: '#F9FAFB' },
  summarise:  { icon: '📋', color: '#7C3AED', bg: '#F5F3FF' },
  nudge:      { icon: '💡', color: '#D97706', bg: '#FFFBEB' },
  celebrate:  { icon: '🎉', color: '#EA580C', bg: '#FFF7ED' },
  reroute:    { icon: '🧭', color: '#DC2626', bg: '#FEF2F2' },
};

function ProactiveActionCard({ action, onApprove, onDismiss }: {
  action: ProactiveAction;
  onApprove: (a: ProactiveAction) => void;
  onDismiss: (a: ProactiveAction) => void;
}) {
  const cfg = ACTION_TYPE_CONFIG[action.type];
  const priorityColor = action.priority === 'critical' ? '#DC2626' : action.priority === 'high' ? '#D97706' : action.priority === 'medium' ? '#2563EB' : '#9CA3AF';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="p-4 rounded-2xl border transition-all hover:shadow-sm"
      style={{ background: cfg.bg, borderColor: cfg.color + '25' }}
      onMouseEnter={e => Object.assign(e.currentTarget.style, GLASS_HOVER)}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none' }}>{action.title}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: priorityColor, background: priorityColor + '12', fontFamily: F.display }}>
              {action.priority}
            </span>
          </div>
          <p className="text-xs" style={{ color: '#6B7280', maxWidth: 'none' }}>{action.description}</p>
          <p className="text-xs mt-1 italic" style={{ color: '#9CA3AF', fontFamily: F.serif }}>Because: {action.rationale}</p>
        </div>
        <button onClick={() => onDismiss(action)} className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors">
          <X className="w-3 h-3" style={{ color: '#9CA3AF' }} />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onApprove(action)}
          className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: cfg.color, color: 'white', fontFamily: F.display }}>
          Let KAAL do this
        </button>
        <button onClick={() => onDismiss(action)}
          className="px-4 py-1.5 rounded-xl text-xs font-medium border transition-all hover:bg-white/60"
          style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.08)', color: '#6B7280', fontFamily: F.display }}>
          Not now
        </button>
      </div>
    </motion.div>
  );
}

// ─── Win card ─────────────────────────────────────────────────────────────────

const WIN_MAGNITUDE_CONFIG = {
  small:     { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', stars: 1 },
  medium:    { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', stars: 2 },
  large:     { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', stars: 3 },
  legendary: { bg: '#F5F3FF', border: '#DDD6FE', color: '#7C3AED', stars: 5 },
};

function WinCard({ win, onCelebrate }: { win: WinEvent; onCelebrate: (id: string) => void }) {
  const cfg = WIN_MAGNITUDE_CONFIG[win.magnitude];
  const stars = '⭐'.repeat(cfg.stars);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-2xl border relative overflow-hidden"
      style={{ background: cfg.bg, borderColor: cfg.border }}>
      {/* Glow for legendary */}
      {win.magnitude === 'legendary' && (
        <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(ellipse at top, rgba(167,139,250,0.15), transparent 70%)' }} />
      )}
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none' }}>{win.title}</p>
          <span className="text-sm">{stars}</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#6B7280', maxWidth: 'none' }}>{win.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-medium" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
            {new Date(win.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          {!win.celebrated && (
            <button onClick={() => onCelebrate(win.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
              style={{ background: cfg.color, color: 'white', fontFamily: F.display }}>
              <Trophy className="w-3 h-3" /> Celebrate
            </button>
          )}
          {win.celebrated && (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color, fontFamily: F.display }}>
              <CheckCircle2 className="w-3 h-3" /> +{win.xpAwarded} XP
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Situation summary strip ──────────────────────────────────────────────────

function SituationSummary({ ctx }: { ctx: UserContext }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-3xl border" style={{ ...GLASS }}>
      <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
        <Brain className="w-5 h-5" style={{ color: '#111827' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <Label>KAAL's Current Assessment</Label>
          <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.display }}>{ctx.confidenceScore}% confidence · {ctx.dataSourceCount} sources</span>
        </div>
        <p className="text-sm leading-relaxed italic" style={{ fontFamily: F.serif, color: '#111827' }}>
          "{ctx.situationSummary}"
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
          {ctx.refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.display }}>Updated</p>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function KaalContextPanel() {
  const [ctx, setCtx]             = useState<UserContext | null>(null);
  const [loading, setLoading]     = useState(true);
  const [queue, setQueue]         = useState<ProactiveAction[]>([]);
  const [wins, setWins]           = useState<WinEvent[]>([]);
  const [executing, setExec]      = useState<string | null>(null);

  useEffect(() => {
    const unsub = contextEngine.subscribe(c => {
      setCtx(c);
      setQueue(c.proactiveQueue);
      setWins(c.recentWins);
      setLoading(false);
    });
    contextEngine.start();
    return () => { unsub(); contextEngine.stop(); };
  }, []);

  useEffect(() => {
    const unsub = winDetector.onWin(w => {
      setWins(prev => [w, ...prev.filter(x => x.id !== w.id)].slice(0, 10));
    });
    return unsub;
  }, []);

  const handleApprove = async (action: ProactiveAction) => {
    setExec(action.id);
    setQueue(q => q.map(a => a.id === action.id ? { ...a, status: 'executing' } : a));
    try {
      let result;
      if (action.tool === 'start_focus') result = await agentActions.blockFocusTime({ taskTitle: action.params.taskTitle || 'Focus Block', durationMinutes: action.params.duration || 45 });
      else if (action.tool === 'schedule_break') result = agentActions.scheduleBreak(action.params.duration || 10);
      else if (action.tool === 'navigate') { /* navigate handled by parent */ result = { success: true, title: 'Navigating…', detail: '', undoable: false }; }
      else result = { success: true, title: 'Done', detail: 'Action completed.', undoable: false };

      if (result.success) toast.success(result.title, { description: result.detail });
      else toast.error(result.title, { description: result.detail });
      setQueue(q => q.filter(a => a.id !== action.id));
    } catch (e) {
      toast.error('Action failed', { description: String(e) });
      setQueue(q => q.map(a => a.id === action.id ? { ...a, status: 'queued' } : a));
    } finally {
      setExec(null);
    }
  };

  const handleDismiss = (action: ProactiveAction) => {
    setQueue(q => q.filter(a => a.id !== action.id));
  };

  const handleCelebrate = (winId: string) => {
    winDetector.markCelebrated(winId);
    setWins(prev => prev.map(w => w.id === winId ? { ...w, celebrated: true } : w));
    toast.success('Win celebrated! 🎉', { description: `+${wins.find(w => w.id === winId)?.xpAwarded || 10} XP added` });
  };

  const handleRefresh = () => { setLoading(true); contextEngine.refresh().then(() => setLoading(false)); };

  if (loading) return (
    <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="p-5 rounded-3xl bg-white shadow-sm border border-gray-100">
          <Brain className="w-8 h-8" style={{ color: '#111827' }} />
        </div>
        <p className="text-sm italic" style={{ color: '#9CA3AF', fontFamily: F.serif }}>Building your context…</p>
        <div className="flex gap-1">
          {[0, 0.18, 0.36].map((d, i) => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
              animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!ctx) return null;

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="p-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Title */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-medium tracking-tight italic" style={{ fontFamily: F.serif, color: '#111827' }}>
                KAAL Knows
              </h2>
              <p className="mt-1 text-sm font-light" style={{ color: '#6B7280', maxWidth: 'none' }}>
                Your live executive function model — {ctx.dataSourceCount} active data sources.
              </p>
            </div>
            <button onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all hover:shadow-sm active:scale-95"
              style={{ background: 'rgba(255,255,255,0.8)', borderColor: 'rgba(0,0,0,0.08)', color: '#374151', fontFamily: F.display }}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Situation summary */}
          <SituationSummary ctx={ctx} />

          {/* Vitals + Time context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VitalsCard vitals={ctx.vitals} />

            {/* Time context card */}
            <div className="p-6 rounded-3xl border" style={{ ...GLASS }}>
              <Label>Right Now</Label>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Recommended', value: ctx.time.recommendedAction.replace(/_/g, ' '), icon: <Target className="w-4 h-4" /> },
                  { label: 'Free Window', value: `${ctx.time.availableWindowMinutes} min`, icon: <Clock className="w-4 h-4" /> },
                  { label: 'Tasks Active', value: `${ctx.tasks.totalActive}`, icon: <CheckCircle2 className="w-4 h-4" /> },
                  { label: 'Done Today', value: `${ctx.tasks.completedTodayCount}`, icon: <TrendingUp className="w-4 h-4" /> },
                  { label: 'Overdue', value: `${ctx.tasks.overdueCount}`, icon: <AlertCircle className="w-4 h-4" /> },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <div className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-100" style={{ color: '#111827' }}>{row.icon}</div>
                    <p className="flex-1 text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280', fontFamily: F.display }}>{row.label}</p>
                    <p className="text-sm font-medium italic capitalize" style={{ fontFamily: F.serif, color: '#111827' }}>{row.value}</p>
                  </div>
                ))}

                {ctx.time.nextEvent && (
                  <div className="p-3 rounded-2xl mt-2" style={{ background: 'rgba(17,24,39,0.04)', border: '1px solid rgba(17,24,39,0.06)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6B7280', fontFamily: F.display }}>Next Meeting</p>
                    <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none' }}>{ctx.time.nextEvent.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.mono }}>in {ctx.time.minutesToNextEvent} min</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Integration signals */}
          <div>
            <Label>Live Integration Signals</Label>
            <p className="text-sm font-light mt-1 mb-4" style={{ color: '#6B7280', maxWidth: 'none' }}>
              What KAAL is reading from your connected apps right now.
            </p>
            <div className="rounded-3xl border overflow-hidden" style={{ ...GLASS }}>
              {/* Spotify */}
              <IntegrationSignalRow
                icon={<Music className="w-4 h-4" />}
                label="Spotify"
                color="#1DB954"
                status={ctx.integrations.spotify ? 'demo' : 'off'}
                signal={ctx.integrations.spotify?.isPlaying
                  ? `"${ctx.integrations.spotify.trackName}" — ${ctx.integrations.spotify.focusSignal.replace('_', ' ')}`
                  : 'Not playing'}
                detail={ctx.integrations.impliedDND
                  ? '🟢 Focus playlist detected — notifications suppressed'
                  : ctx.integrations.spotify?.isPlaying
                    ? `BPM: ${Math.round(ctx.integrations.spotify.trackTempo)} · Energy: ${Math.round(ctx.integrations.spotify.trackEnergy * 100)}%`
                    : 'Connect to use listening habits as focus signals'}
              />
              {/* Calendar */}
              <IntegrationSignalRow
                icon={<Calendar className="w-4 h-4" />}
                label="Google Calendar"
                color="#4285F4"
                status={ctx.integrations.calendar.events.length > 0 ? 'demo' : 'off'}
                signal={ctx.integrations.calendar.summary}
                detail={ctx.time.nextEvent
                  ? `Next: "${ctx.time.nextEvent.title}" in ${ctx.time.minutesToNextEvent} min · ${ctx.time.nextEvent.attendees.length} attendees`
                  : 'No upcoming events found'}
              />
              {/* Gmail */}
              <IntegrationSignalRow
                icon={<Mail className="w-4 h-4" />}
                label="Gmail"
                color="#EA4335"
                status={ctx.integrations.email ? 'demo' : 'off'}
                signal={ctx.integrations.email
                  ? `${ctx.integrations.email.unreadCount} unread · ${ctx.integrations.email.urgentCount} urgent · ${ctx.integrations.email.needsResponseCount} need reply`
                  : 'Not connected'}
                detail={ctx.integrations.emailUrgency !== 'none'
                  ? `⚠️ Email urgency: ${ctx.integrations.emailUrgency} — KAAL has ${ctx.integrations.email?.draftsPending || 0} draft replies ready`
                  : 'Inbox looks manageable right now'}
              />
              {/* Notion */}
              <IntegrationSignalRow
                icon={<FileText className="w-4 h-4" />}
                label="Notion"
                color="#000000"
                status={ctx.integrations.notion ? 'demo' : 'off'}
                signal={ctx.integrations.notion
                  ? `${ctx.integrations.notion.pendingActionItems} action items · ${ctx.integrations.notion.recentPages.length} recent pages`
                  : 'Not connected'}
                detail={ctx.integrations.notion
                  ? `Last active page: "${ctx.integrations.notion.recentPages[0]?.title ?? '—'}" · ${ctx.integrations.notion.stalePagesCount} stale pages`
                  : 'Connect to sync projects and action items'}
              />
            </div>
          </div>

          {/* Proactive queue */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>KAAL's Proactive Queue</Label>
                <p className="text-sm font-light mt-1" style={{ color: '#6B7280', maxWidth: 'none' }}>
                  What KAAL wants to do for you right now — approve or dismiss.
                </p>
              </div>
              {queue.length > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280', fontFamily: F.display }}>
                  {queue.length} pending
                </span>
              )}
            </div>
            {queue.length === 0 ? (
              <div className="p-8 rounded-3xl border text-center" style={{ ...GLASS }}>
                <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-sm font-medium" style={{ color: '#374151', maxWidth: 'none' }}>Queue is clear</p>
                <p className="text-sm font-light mt-1" style={{ color: '#9CA3AF', maxWidth: 'none' }}>KAAL is monitoring and will act when needed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {queue.map(action => (
                    <ProactiveActionCard key={action.id} action={action} onApprove={handleApprove} onDismiss={handleDismiss} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Win reel */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Recent Wins</Label>
                <p className="text-sm font-light mt-1" style={{ color: '#6B7280', maxWidth: 'none' }}>
                  Last 7 days · {winDetector.getTotalXP()} total XP earned
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.08)' }}>
                <Flame className="w-3.5 h-3.5 fill-orange-500" style={{ color: '#EA580C' }} />
                <span className="text-xs font-bold" style={{ color: '#111827', fontFamily: F.display }}>{winDetector.getStreak()} DAY STREAK</span>
              </div>
            </div>
            {wins.length === 0 ? (
              <div className="p-8 rounded-3xl border text-center" style={{ ...GLASS }}>
                <Trophy className="w-8 h-8 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-sm font-medium" style={{ color: '#374151', maxWidth: 'none' }}>No wins logged yet</p>
                <p className="text-sm font-light mt-1" style={{ color: '#9CA3AF', maxWidth: 'none' }}>Complete tasks, hit streaks, or finish a focus session to earn your first win.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {wins.slice(0, 6).map(win => (
                    <WinCard key={win.id} win={win} onCelebrate={handleCelebrate} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
