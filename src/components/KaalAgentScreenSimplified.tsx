/**
 * KAAL Agent Screen — Unified Agent Interface
 * 
 * Now uses the new BrainDumpAgent component with 8-engine intelligence:
 * ✅ Zero-cost local processing (no API calls required)
 * ✅ Emotional load detection
 * ✅ Dependency detection  
 * ✅ Duplicate detection
 * ✅ Energy-aware scheduling
 * ✅ Task/worry/idea/blocker classification
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle, TrendingUp, Shield,
  ListChecks, X, ChevronRight
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { storageService } from '../services/storage-service';
import { supabase } from '../services/supabase-client';
import { BrainDumpAgent } from './BrainDumpAgent';

// ─── Font tokens ───────────────────────────────────────────────────────────────
const F = {
  display: 'var(--font-display)',
  serif:   "'Playfair Display', serif",
  mono:    'var(--font-mono)',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProactiveInsight {
  id:      string;
  type:    'warning' | 'tip';
  title:   string;
  body:    string;
  icon:    React.ElementType;
  color:   string;
  bg:      string;
  border:  string;
  action?: { label: string; href: string };
}

// ─── Context builder ──────────────────────────────────────────────────────────
function buildContext(tasks: any[]) {
  const now             = new Date();
  const hour            = now.getHours();
  const pending         = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const overdue         = pending.filter(t => t.dueDate && new Date(t.dueDate) < now);
  let energyLevel       = 3;
  let streakDays        = 0;
  let todayFocusMinutes = 0;
  
  try { 
    const s = localStorage.getItem('kaal_last_energy_level'); 
    if (s) energyLevel = Math.min(5, Math.max(1, Number(s))); 
  } catch {}
  
  try { 
    streakDays = storageService.getStreak().current || 0; 
  } catch {}
  
  try {
    const raw = localStorage.getItem('kaal_daily_stats');
    if (raw) { 
      const s = JSON.parse(raw); 
      todayFocusMinutes = s[now.toISOString().split('T')[0]]?.focusMinutes || 0; 
    }
  } catch {}
  
  return { hour, pending, overdue, energyLevel, streakDays, todayFocusMinutes };
}

// ─── Rule-based proactive insights — ZERO API calls ──────────────────────────
function buildInsights(ctx: ReturnType<typeof buildContext>): ProactiveInsight[] {
  const { overdue, pending } = ctx;
  const insights: ProactiveInsight[] = [];

  if (overdue.length > 0)
    insights.push({ 
      id: 'overdue', 
      type: 'warning',
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      body: `"${overdue[0].title}"${overdue.length > 1 ? ` +${overdue.length - 1} more` : ''} passed deadline.`,
      icon: AlertTriangle, 
      color: '#DC2626', 
      bg: '#FEF2F2', 
      border: '#FECACA',
      action: { label: 'Review tasks', href: '/tasks' } 
    });

  if (pending.length > 10)
    insights.push({ 
      id: 'overload', 
      type: 'warning',
      title: 'Task overload detected',
      body: `${pending.length} open tasks. Use brain dump to prioritize and organize.`,
      icon: Shield, 
      color: '#7C3AED', 
      bg: '#F5F3FF', 
      border: '#DDD6FE'
    });

  return insights;
}

// ─── Utility to fetch user energy pattern from Supabase ──────────────────────
async function getUserEnergyPattern(userId: string): Promise<Record<number, number>> {
  try {
    const { data } = await supabase
      .from('energy_checkins')
      .select('created_at, energy_level')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data || data.length === 0) return {};

    // Build energy pattern (hour → avg energy)
    const hourly: Record<number, number[]> = {};
    
    data.forEach((checkin) => {
      const hour = new Date(checkin.created_at).getHours();
      if (!hourly[hour]) hourly[hour] = [];
      hourly[hour].push(checkin.energy_level);
    });

    // Average by hour
    const pattern: Record<number, number> = {};
    Object.entries(hourly).forEach(([hour, values]) => {
      pattern[Number(hour)] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return pattern;
  } catch (error) {
    console.error('Failed to fetch energy pattern:', error);
    return {};
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#6B7280', fontFamily: F.display }}>
      {children}
    </p>
  );
}

function InsightCard({ i, onNav }: { i: ProactiveInsight; onNav: (h: string) => void }) {
  const Icon = i.icon;
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-2xl border" 
      style={{ background: i.bg, borderColor: i.border }}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${i.color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: i.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: i.color, fontFamily: F.display }}>{i.title}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#4B5563' }}>{i.body}</p>
          {i.action && (
            <button onClick={() => onNav(i.action!.href)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: i.color, fontFamily: F.display }}>
              {i.action.label} <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function KaalAgentScreenSimplified() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  
  const [userId, setUserId] = useState<string>('');
  const [userEnergyPattern, setUserEnergyPattern] = useState<Record<number, number>>({});
  const [view, setView] = useState<'dump' | 'history'>('dump');

  const ctx = buildContext(tasks);
  const insights = buildInsights(ctx);
  const { hour, pending, overdue, energyLevel, streakDays, todayFocusMinutes } = ctx;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Fetch user ID and energy pattern on mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const pattern = await getUserEnergyPattern(user.id);
        setUserEnergyPattern(pattern);
      }
    }
    init();
  }, []);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F8F9FA' }}>

      {/* ── Left sidebar: rule-based insights ── */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-r flex-shrink-0 overflow-y-auto"
        style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="p-5 space-y-4 pt-6">
          <div>
            <Label>Proactive Insights</Label>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.display }}>
              Rule-based · zero API calls
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Open',   value: pending.length,     unit: 'tasks', color: pending.length > 5 ? '#EF4444' : '#374151' },
              { label: 'Focus',  value: todayFocusMinutes,  unit: 'min',   color: todayFocusMinutes >= 60 ? '#10B981' : '#374151' },
              { label: 'Energy', value: `${energyLevel}/5`, unit: '',      color: energyLevel >= 4 ? '#6366F1' : energyLevel <= 2 ? '#EF4444' : '#374151' },
              { label: 'Streak', value: streakDays,         unit: 'days',  color: streakDays >= 3 ? '#F97316' : '#374151' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-2xl border text-center"
                style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.display }}>{s.label}</p>
                <p className="text-lg font-medium italic mt-0.5" style={{ fontFamily: F.serif, color: s.color }}>
                  {s.value}
                  {s.unit && <span className="text-xs not-italic ml-0.5" style={{ color: '#9CA3AF', fontFamily: F.display }}> {s.unit}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {insights.map(ins => <InsightCard key={ins.id} i={ins} onNav={navigate} />)}
            </AnimatePresence>
          </div>

          {overdue.length > 0 && (
            <div>
              <Label>Needs Decision</Label>
              <div className="mt-2 space-y-1.5">
                {overdue.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                    style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
                    <span className="text-xs flex-1 truncate" style={{ color: '#374151' }}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Sub-header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b flex-shrink-0"
          style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)' }}>
          <div>
            <h2 className="font-medium italic" style={{ fontFamily: F.serif, color: '#111827', fontSize: 22 }}>
              {greeting}.
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.display }}>
              Brain Dump → KAAL organizes everything · Zero API cost
            </p>
          </div>
        </div>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto">
            {/* NEW: Use BrainDumpAgent component */}
            <BrainDumpAgent 
              userId={userId} 
              userEnergyPattern={userEnergyPattern} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}