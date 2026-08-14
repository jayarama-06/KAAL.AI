/**
 * KAAL Agent Screen — Enhanced Brain Dump with 8-Engine Intelligence
 *
 * NEW: Integrated with zero-cost KAAL Agent orchestrator
 *  ✅ 8 processing engines (segmenter, classifier, temporal, dependencies, etc.)
 *  ✅ Emotional load detection and UI adaptation
 *  ✅ Energy-aware scheduling
 *  ✅ Dependency detection
 *  ✅ Duplicate detection
 *  ✅ All processing runs locally (zero API cost)
 *  ✅ Fallback to Gemini for enhanced intelligence (optional)
 *
 * Flow:
 *  1. User writes brain dump → 8 engines process locally
 *  2. Tasks/worries/ideas/blockers automatically categorized
 *  3. Schedule built based on user energy patterns
 *  4. Tasks created in Supabase with one click
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  Brain, Sparkles, Zap, Clock, Target,
  ChevronRight, RotateCcw, Flame, AlertTriangle, Lightbulb,
  Coffee, ListChecks,
  TrendingUp, Shield, Wind, Play, Timer,
  Check, X, Inbox, Star, TrendingDown
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { storageService } from '../services/storage-service';
import { supabase } from '../services/supabase-client';
import { BrainDumpAgent } from './BrainDumpAgent';
import { toast } from 'sonner';

// ─── Font tokens ───────────────────────────────────────────────────────────────
const F = {
  display: 'var(--font-display)',
  serif:   "'Playfair Display', serif",
  mono:    'var(--font-mono)',
} as const;

// ─── Glass card style ─────────────────────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background:           'rgba(255,255,255,0.75)',
  backdropFilter:       'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border:               '1px solid rgba(255,255,255,0.5)',
  boxShadow:            '0 8px 32px -8px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.5)',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExtractedTask {
  id:               string;
  title:            string;
  priority:         'urgent' | 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  status:           'pending' | 'created' | 'failed';
  failReason?:      string;
  supabaseId?:      string;
}

interface FocusBlock {
  taskTitle:       string;
  durationMinutes: number;
  rationale:       string;
  type:            'focus' | 'break';
}

interface DumpResult {
  tasks:           ExtractedTask[];
  focusSessions:   FocusBlock[];
  emotionalState:  string;
  blockers:        string[];
  focusSuggestion: string;
  energyRead:      string;
  summary:         string;
  source?:         'gemini' | 'local';
}

interface DumpEntry {
  id:        string;
  timestamp: number;
  rawText:   string;
  tags:      string[];
  result:    DumpResult;
}

interface ProactiveInsight {
  id:      string;
  type:    'warning' | 'tip' | 'celebrate' | 'nudge';
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
  const highPri         = pending.filter(t => t.priority === 'high' || t.priority === 'urgent');
  let energyLevel       = 3;
  let streakDays        = 0;
  let todayFocusMinutes = 0;
  try { const s = localStorage.getItem('kaal_last_energy_level'); if (s) energyLevel = Math.min(5, Math.max(1, Number(s))); } catch {}
  try { streakDays = storageService.getStreak().current || 0; } catch {}
  try {
    const raw = localStorage.getItem('kaal_daily_stats');
    if (raw) { const s = JSON.parse(raw); todayFocusMinutes = s[now.toISOString().split('T')[0]]?.focusMinutes || 0; }
  } catch {}
  return { hour, pending, overdue, highPri, energyLevel, streakDays, todayFocusMinutes };
}

// ─── Rule-based proactive insights — ZERO API calls ──────────────────────────
function buildInsights(ctx: ReturnType<typeof buildContext>): ProactiveInsight[] {
  const { hour, pending, overdue, highPri, energyLevel, streakDays, todayFocusMinutes } = ctx;
  const insights: ProactiveInsight[] = [];

  // Only show critical insights - no mockup nudges
  if (overdue.length > 0)
    insights.push({ id: 'overdue', type: 'warning',
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      body: `"${overdue[0].title}"${overdue.length > 1 ? ` +${overdue.length - 1} more` : ''} passed deadline.`,
      icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
      action: { label: 'Review tasks', href: '/tasks' } });

  if (highPri.length > 5)
    insights.push({ id: 'overload', type: 'warning',
      title: 'Priority overload',
      body: `${highPri.length} high-priority tasks active. Focus on one at a time.`,
      icon: Shield, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
      action: { label: 'View tasks', href: '/tasks' } });

  return insights;
}

// ─── Local fallback parser (no Gemini needed) ─────────────────────────────────
function localParseDump(rawText: string, tags: string[]): DumpResult {
  // Pre-process: Normalize messy text with spelling mistakes, missing spaces, etc.
  let processed = rawText
    // Fix common spacing issues around times
    .replace(/(\d{1,2})(?::|)(\d{2})?(?:am|pm|AM|PM)/gi, ' $1:$2$3 ')
    // Add space before times without space: "8pm" → " 8pm "
    .replace(/([a-z])(\d{1,2}(?::\d{2})?(?:am|pm|AM|PM))/gi, '$1 $2')
    // Add space after times: "8pmmeet" → "8pm meet"
    .replace(/(\d{1,2}(?::\d{2})?(?:am|pm|AM|PM))([a-z])/gi, '$1 $2')
    // Add space before day names: "mondaymeeting" → "monday meeting"
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)([a-z])/gi, '$1 $2')
    // Add space after day names: "meetingmonday" → "meeting monday"
    .replace(/([a-z])(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '$1 $2')
    // Add space before common action words when they run together
    .replace(/([a-z])(meeting|call|email|quiz|test|exam|drink|sleep|exercise|buy|get|read|study|practice|clean|write|review|prepare|finish|complete|submit|send|check|update|fix|debug|deploy|plan|schedule|book)/gi, '$1 $2')
    // Add newline before times for better splitting
    .replace(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/g, '\n$1')
    // Add newline before day names
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '\n$1')
    // Add newline before common task verbs if they appear mid-text
    .replace(/([a-z])(meeting|call|email|quiz|test|exam|drink|water|sleep|exercise|buy|get|read|study|practice|clean)/gi, '$1\n$2')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ');
  
  // Split by multiple separators: newlines, commas, semicolons, "and", "then"
  const separators = /[\n,;]|\band\b|\bthen\b/i;
  const items = processed
    .split(separators)
    .map(l => l.trim())
    .filter(l => l.length > 2);
  
  const tasks: ExtractedTask[] = [];
  const blockers: string[] = [];

  for (const item of items.slice(0, 15)) {
    if (/\b(stuck|blocker|blocked|can't|cannot|cant|problem|issue|waiting|worry|anxious|scared)\b/i.test(item)) {
      blockers.push(item);
    } else {
      // Clean up the task text
      let title = item
        .replace(/^[•\-*]\s*/, '')
        .replace(/^(I |i )(need to|should|must|have to|want to|will)\s*/i, '')
        .replace(/^(to |TO )/, '') // Remove leading "to"
        .trim();
      
      // Fix common spelling mistakes
      title = fixCommonSpellingMistakes(title);
      
      // Capitalize first letter
      if (title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
      
      // Only add valid tasks
      if (title.length > 2 && title.length < 200) {
        tasks.push({
          id: `task-local-${Date.now()}-${tasks.length}`,
          title,
          priority: /\b(urgent|asap|now|critical|important|deadline|emergency)\b/i.test(item) ? 'urgent' : 'medium',
          estimatedMinutes: estimateDuration(item),
          status: 'pending',
        });
      }
    }
    if (tasks.length >= 10) break;
  }

  // If no tasks found, try to extract from raw text using more aggressive parsing
  if (tasks.length === 0 && rawText.length > 3) {
    const aggressiveItems = extractTasksAggressively(rawText);
    tasks.push(...aggressiveItems.slice(0, 5));
  }

  const focusSessions: FocusBlock[] = tasks.slice(0, 2).map(t => ({
    taskTitle: t.title,
    durationMinutes: t.estimatedMinutes,
    rationale: 'Extracted from your brain dump',
    type: 'focus' as const,
  }));
  if (focusSessions.length > 0) {
    focusSessions.splice(1, 0, { taskTitle: 'Break', durationMinutes: 10, rationale: 'Recovery between sessions', type: 'break' });
  }

  const isOverwhelmed = tags.includes("I'm overwhelmed") || /\b(overwhelm|too much|stress|anxious)\b/i.test(rawText);

  return {
    tasks,
    focusSessions,
    emotionalState: isOverwhelmed ? 'overwhelmed' : 'neutral',
    energyRead: 'Extracted from your text without AI — add a Gemini API key for deeper analysis.',
    blockers,
    focusSuggestion: tasks.length > 0 ? `Start with: ${tasks[0].title}` : 'Pick one thing and begin.',
    summary: `Found ${tasks.length} action item${tasks.length !== 1 ? 's' : ''} from your dump.${blockers.length > 0 ? ` ${blockers.length} blocker${blockers.length > 1 ? 's' : ''} noted.` : ''}`,
    source: 'local',
  };
}

/**
 * Fix common spelling mistakes in task titles
 */
function fixCommonSpellingMistakes(text: string): string {
  const fixes: Record<string, string> = {
    'meting': 'meeting',
    'meetting': 'meeting',
    'meetng': 'meeting',
    'wriet': 'write',
    'wirte': 'write',
    'reveiw': 'review',
    'reviw': 'review',
    'finsh': 'finish',
    'finnish': 'finish',
    'complte': 'complete',
    'cmoplete': 'complete',
    'emlai': 'email',
    'emal': 'email',
    'teh': 'the',
    'adn': 'and',
    'dont': "don't",
    'cant': "can't",
    'wont': "won't",
    'didnt': "didn't",
    'shouldnt': "shouldn't",
    'wouldnt': "wouldn't",
    'couldnt': "couldn't",
  };

  let fixed = text;
  for (const [wrong, right] of Object.entries(fixes)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    fixed = fixed.replace(regex, right);
  }
  
  return fixed;
}

/**
 * Estimate duration based on keywords in the item
 */
function estimateDuration(text: string): number {
  if (/\b(quick|short|brief|5 min|10 min)\b/i.test(text)) return 15;
  if (/\b(long|deep|1 hour|2 hour|extended)\b/i.test(text)) return 90;
  if (/\b(45 min|hour)\b/i.test(text)) return 45;
  if (/\b(30 min|half hour)\b/i.test(text)) return 30;
  return 25; // default pomodoro
}

/**
 * Aggressive extraction when normal parsing fails
 * Looks for action verbs and time patterns
 */
function extractTasksAggressively(rawText: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  
  // Look for action verbs followed by objects
  const actionPatterns = [
    /\b(meet|meeting|call|email|write|read|study|review|prepare|finish|complete|submit|send|check|update|fix|debug|deploy|plan|schedule|book|buy|get|clean|exercise|drink|sleep)\b[^.!?\n]{3,80}/gi,
  ];
  
  for (const pattern of actionPatterns) {
    const matches = rawText.matchAll(pattern);
    for (const match of matches) {
      let title = match[0].trim();
      title = fixCommonSpellingMistakes(title);
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      if (title.length > 3 && title.length < 150) {
        tasks.push({
          id: `task-aggressive-${Date.now()}-${tasks.length}`,
          title,
          priority: 'medium',
          estimatedMinutes: estimateDuration(title),
          status: 'pending',
        });
      }
      
      if (tasks.length >= 5) break;
    }
    if (tasks.length >= 5) break;
  }
  
  // If still no tasks, create one from the entire text
  if (tasks.length === 0) {
    let title = rawText.trim();
    title = fixCommonSpellingMistakes(title);
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    if (title.length > 3) {
      tasks.push({
        id: `task-fallback-${Date.now()}`,
        title: title.slice(0, 150),
        priority: 'medium',
        estimatedMinutes: 25,
        status: 'pending',
      });
    }
  }
  
  return tasks;
}

// ─── Gemini call (Edge Function → localStorage key → local fallback) ──────────
async function processBrainDump(
  rawText:     string,
  tags:        string[],
  taskList:    string[],
  hour:        number,
  energy:      number,
): Promise<DumpResult> {
  const tagCtx  = tags.length ? `User's mode: ${tags.join(', ')}. ` : '';
  const taskCtx = taskList.length ? `Existing open tasks: ${taskList.join('; ')}.` : 'No existing open tasks.';
  const timeCtx = `Current time: ${hour}:00. Energy level: ${energy}/5.`;

  const prompt = `You are KAAL, an executive function assistant for people with ADHD or executive dysfunction.

${tagCtx}${timeCtx}
${taskCtx}

The user just did a Brain Dump. Extract structure and build an action plan.
Respond ONLY with valid JSON — no markdown, no code fences, no extra text.

Brain dump:
"${rawText}"

IMPORTANT PARSING RULES:
- Handle messy input gracefully: spelling errors, grammar mistakes, missing punctuation are EXPECTED
- Handle text with NO spaces (e.g., "meetingat8pmonmondaydrinkwaterquizonthursday")
- Handle text with NO commas (e.g., "meeting monday drink water quiz thursday")
- If the dump contains comma-separated or semicolon-separated items, treat each as a SEPARATE task
- If the dump contains line-separated items, treat each line as a SEPARATE task
- If text has no separators, infer task boundaries from context clues: times, days, action verbs
- Auto-correct obvious spelling mistakes in task titles (e.g., "meting" → "meeting", "wriet" → "write")
- Example 1: "Meeting at 8pm on monday, drink water regularly, quiz on thursday" = 3 separate tasks
- Example 2: "meetingat8pmonmondaydrinkwaterquizonthursday" = still 3 tasks (extract: "Meeting at 8pm on monday", "Drink water regularly", "Quiz on thursday")
- Example 3: "meting 8pm monday drink wter quiz thursday" = still 3 tasks (fix spelling: "Meeting 8pm monday", "Drink water", "Quiz thursday")
- Each meaningful action/event should become its own task in the tasks array
- Look for time patterns (8pm, 2:30pm, 9am), day names (monday, tue, friday), action verbs (meeting, call, study, review)

Return EXACTLY this JSON shape:
{
  "summary": "2-sentence compassionate summary of what they shared",
  "emotionalState": "one of: overwhelmed | anxious | focused | scattered | tired | motivated | neutral",
  "energyRead": "1-sentence read on their apparent cognitive load",
  "tasks": [
    { "title": "concrete actionable task title", "priority": "urgent|high|medium|low", "estimatedMinutes": 25 }
  ],
  "blockers": ["specific obstacle actually mentioned in the dump"],
  "focusSuggestion": "one concrete action to do RIGHT NOW (max 12 words)",
  "focusSessions": [
    { "taskTitle": "exact task title from tasks array", "durationMinutes": 45, "rationale": "1-sentence why this task first" }
  ]
}

Rules:
- tasks: up to 8 tasks, concrete, actionable. Parse ALL comma/semicolon-separated items as separate tasks. estimatedMinutes must be 15/25/45/60/90.
- Clean up task titles: fix spelling, add proper capitalization, make them clear and actionable
- focusSessions: 2-3 entries. Only include tasks from the tasks array above.
  Insert { "taskTitle": "Break", "durationMinutes": 10, "rationale": "recovery between sessions" } as needed.
- blockers: only real obstacles mentioned in the dump, not inferred ones.
- focusSuggestion: ultra-specific, not generic.
- Be warm, not clinical.`;

  // Try Gemini (Edge Function → localStorage API key)
  try {
    const responseText = await geminiServiceSecure.callGemini(prompt);
    
    // More robust JSON extraction - handle various response formats
    let rawJson = responseText.trim();
    
    // Remove markdown code fences if present
    rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    
    // Remove any leading/trailing whitespace and newlines
    rawJson = rawJson.trim();
    
    // Try to find JSON object if wrapped in text
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawJson = jsonMatch[0];
    }
    
    const parsed = JSON.parse(rawJson);

    const tasks: ExtractedTask[] = (Array.isArray(parsed.tasks) ? parsed.tasks : []).map((t: any, i: number) => ({
      id:               `task-${Date.now()}-${i}`,
      title:            String(t.title ?? '').trim(),
      priority:         (['urgent','high','medium','low'].includes(t.priority) ? t.priority : 'medium') as ExtractedTask['priority'],
      estimatedMinutes: Number(t.estimatedMinutes) || 25,
      status:           'pending' as const,
    }));

    const focusSessions: FocusBlock[] = (Array.isArray(parsed.focusSessions) ? parsed.focusSessions : []).map((s: any) => ({
      taskTitle:       String(s.taskTitle ?? ''),
      durationMinutes: Number(s.durationMinutes) || 25,
      rationale:       String(s.rationale ?? ''),
      type:            (String(s.taskTitle ?? '').toLowerCase() === 'break' ? 'break' : 'focus') as FocusBlock['type'],
    }));

    return {
      summary:         String(parsed.summary ?? ''),
      emotionalState:  String(parsed.emotionalState ?? 'neutral'),
      energyRead:      String(parsed.energyRead ?? ''),
      blockers:        Array.isArray(parsed.blockers) ? parsed.blockers.map(String) : [],
      focusSuggestion: String(parsed.focusSuggestion ?? ''),
      focusSessions,
      tasks,
      source: 'gemini',
    };
  } catch (geminiErr: any) {
    // If Gemini is genuinely unavailable (notConfigured), fall back to local parser
    const msg = geminiErr?.message ?? '';
    if (msg === 'notConfigured' || msg.includes('notConfigured')) {
      return localParseDump(rawText, tags);
    }
    // Rate limit / quota — re-throw so user sees the specific message
    throw geminiErr;
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
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-2xl border" style={{ background: i.bg, borderColor: i.border }}>
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

function FocusBlockCard({ block, index, onStart }: {
  block:   FocusBlock;
  index:   number;
  onStart: (task: string, duration: number) => void;
}) {
  const isBreak = block.type === 'break';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-center gap-4 p-4 rounded-2xl border"
      style={{ background: isBreak ? '#F0FDF4' : 'rgba(255,255,255,0.9)', borderColor: isBreak ? '#BBF7D0' : 'rgba(0,0,0,0.07)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isBreak ? '#D1FAE5' : '#111827' }}>
        {isBreak
          ? <Coffee className="w-3.5 h-3.5" style={{ color: '#059669' }} />
          : <span className="text-xs font-bold text-white" style={{ fontFamily: F.display }}>{index + 1}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: isBreak ? '#059669' : '#111827' }}>{block.taskTitle}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
          {block.durationMinutes} min{block.rationale ? ` · ${block.rationale}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl flex-shrink-0"
        style={{ background: isBreak ? '#D1FAE5' : 'rgba(99,102,241,0.08)', color: isBreak ? '#059669' : '#6366F1' }}>
        <Timer className="w-3 h-3" />
        <span className="text-xs font-bold" style={{ fontFamily: F.display }}>{block.durationMinutes}m</span>
      </div>
      {!isBreak && (
        <button onClick={() => onStart(block.taskTitle, block.durationMinutes)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:shadow-md active:scale-95 flex-shrink-0"
          style={{ background: '#111827', color: '#fff', fontFamily: F.display }}>
          <Play className="w-3 h-3" /> Start
        </button>
      )}
    </motion.div>
  );
}

function HistoryEntry({ entry, onReopen }: { entry: DumpEntry; onReopen: (e: DumpEntry) => void }) {
  const d = new Date(entry.timestamp);
  return (
    <button onClick={() => onReopen(entry)}
      className="w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md group"
      style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.5)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
            {d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm mt-1 truncate" style={{ color: '#374151' }}>{entry.rawText}</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontFamily: F.display }}>
            {entry.result.tasks.filter(t => t.status === 'created').length} tasks created · {entry.result.emotionalState}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: '#9CA3AF' }} />
      </div>
    </button>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DUMP_TAGS = [
  { label: "I'm overwhelmed", emoji: '😤' },
  { label: 'Planning my day', emoji: '📋' },
  { label: "I'm stuck",       emoji: '🧱' },
  { label: 'Just rambling',   emoji: '🌀' },
  { label: 'Need priorities', emoji: '🎯' },
  { label: 'End of day',      emoji: '🌙' },
];

const PRIORITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  urgent: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  high:   { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  medium: { color: '#374151', bg: '#F3F4F6', border: '#E5E7EB' },
  low:    { color: '#9CA3AF', bg: '#F9FAFB', border: '#F3F4F6' },
};

const EMOTION_COLOR: Record<string, string> = {
  overwhelmed: '#EF4444', anxious: '#F59E0B', focused: '#10B981',
  scattered: '#8B5CF6', tired: '#6B7280', motivated: '#6366F1', neutral: '#9CA3AF',
};

// ─── Main component ───────────────────────────────────────────────────────────
export function KaalAgentScreen() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const textRef  = useRef<HTMLTextAreaElement>(null);

  const [input,      setInput]      = useState('');
  const [tags,       setTags]       = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [result,     setResult]     = useState<DumpResult | null>(null);
  const [history,    setHistory]    = useState<DumpEntry[]>([]);
  const [view,       setView]       = useState<'dump' | 'history'>('dump');
  const [charCount,  setCharCount]  = useState(0);
  const [dbError,    setDbError]    = useState<string | null>(null);

  const ctx      = buildContext(tasks);
  const insights = buildInsights(ctx);
  const { hour, pending, overdue, energyLevel, streakDays, todayFocusMinutes } = ctx;
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    try { const raw = localStorage.getItem('kaal_dump_history'); if (raw) setHistory(JSON.parse(raw)); } catch {}
  }, []);

  const saveHistory = (entries: DumpEntry[]) => {
    setHistory(entries);
    try { localStorage.setItem('kaal_dump_history', JSON.stringify(entries.slice(0, 20))); } catch {}
  };

  // ── Auto-create tasks directly in Supabase ─────────────────────────────────
  const autoCreateTasks = async (dumpResult: DumpResult): Promise<DumpResult> => {
    if (!dumpResult.tasks.length) return dumpResult;
    setCreating(true);
    setDbError(null);

    const updated = { ...dumpResult, tasks: dumpResult.tasks.map(t => ({ ...t })) };
    let created = 0;
    let failed  = 0;
    let firstError = '';

    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!user) {
      setCreating(false);
      const msg = 'Not signed in — please log in and try again';
      setDbError(msg);
      toast.error('Cannot create tasks', { description: msg });
      return { ...updated, tasks: updated.tasks.map(t => ({ ...t, status: 'failed' as const, failReason: msg })) };
    }

    for (let i = 0; i < updated.tasks.length; i++) {
      const t = updated.tasks[i];
      try {
        const insertPayload: Record<string, any> = {
          user_id:     user.id,
          title:       t.title,
          priority:    t.priority,
          status:      'todo',
          description: `Created from Brain Dump · ${new Date().toLocaleDateString()}`,
        };
        // Only add estimated_minutes if the column exists — caught silently if not
        if (t.estimatedMinutes) insertPayload['estimated_minutes'] = t.estimatedMinutes;

        const { data, error } = await supabase
          .from('tasks')
          .insert(insertPayload)
          .select('id')
          .single();

        if (error) {
          // If column doesn't exist, retry without estimated_minutes
          if (error.message?.includes('estimated_minutes') || error.code === '42703') {
            delete insertPayload['estimated_minutes'];
            const retry = await supabase.from('tasks').insert(insertPayload).select('id').single();
            if (retry.error) {
              const reason = retry.error.message || retry.error.code || 'Insert error';
              updated.tasks[i] = { ...t, status: 'failed', failReason: reason };
              if (!firstError) firstError = reason;
              failed++;
            } else {
              updated.tasks[i] = { ...t, status: 'created', supabaseId: retry.data?.id };
              created++;
            }
          } else {
            const reason = error.message || error.code || 'Supabase insert error';
            updated.tasks[i] = { ...t, status: 'failed', failReason: reason };
            if (!firstError) firstError = reason;
            failed++;
          }
        } else {
          updated.tasks[i] = { ...t, status: 'created', supabaseId: data?.id };
          created++;
        }
      } catch (err: any) {
        const reason = err?.message ?? 'Unknown error';
        updated.tasks[i] = { ...t, status: 'failed', failReason: reason };
        if (!firstError) firstError = reason;
        failed++;
      }
    }

    setCreating(false);
    if (firstError) setDbError(firstError);

    if (created > 0 && failed === 0) {
      toast.success(`${created} task${created > 1 ? 's' : ''} added to your queue`, { description: 'Synced to Tasks ✓' });
    } else if (created > 0) {
      toast.success(`${created} task${created > 1 ? 's' : ''} added`, { description: `${failed} failed — see below` });
    } else {
      toast.error('Could not create tasks', { description: firstError || 'Check the error below', duration: 8000 });
    }

    return updated;
  };

  // ── Process brain dump ─────────────────────────────────────────────────────
  const handleProcess = async () => {
    const text = input.trim();
    if (!text || processing) return;

    setProcessing(true);
    setResult(null);
    setDbError(null);

    try {
      const taskList   = tasks.filter(t => t.status !== 'completed').map(t => t.title).slice(0, 8);
      const dumpResult = await processBrainDump(text, tags, taskList, hour, energyLevel);

      setProcessing(false);

      if (dumpResult.source === 'local') {
        toast.info('Organised without AI', { description: 'Using local pattern matching' });
      }

      const withStatus = await autoCreateTasks(dumpResult);
      setResult(withStatus);

      const entry: DumpEntry = {
        id:        `dump-${Date.now()}`,
        timestamp: Date.now(),
        rawText:   text,
        tags,
        result:    withStatus,
      };
      saveHistory([entry, ...history]);

    } catch (err: any) {
      setProcessing(false);
      const msg = err?.message ?? '';
      if (msg.includes('quota') || msg.includes('429') || msg.includes('rate limit'))
        toast.error('Gemini quota reached', { description: 'Wait ~60 seconds and try again' });
      else
        toast.error('Processing failed', { description: msg || 'Check your connection' });
    }
  };

  const handleStartFocus = (taskTitle: string, durationMinutes: number) => {
    try {
      localStorage.setItem('kaal_focus_intent', JSON.stringify({ taskTitle, durationMinutes, startedAt: Date.now() }));
    } catch {}
    toast.success(`Starting ${durationMinutes}-min session`, { description: taskTitle });
    navigate('/focus');
  };

  const toggleTag = (label: string) =>
    setTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]);

  const reopenEntry = (entry: DumpEntry) => {
    setInput(entry.rawText); setTags(entry.tags); setResult(entry.result); setView('dump');
  };

  const handleReset = () => {
    setInput(''); setTags([]); setResult(null); setCharCount(0); setDbError(null);
    setTimeout(() => textRef.current?.focus(), 50);
  };

  const createdCount = result?.tasks.filter(t => t.status === 'created').length ?? 0;
  const failedCount  = result?.tasks.filter(t => t.status === 'failed').length ?? 0;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F8F9FA' }}>

      {/* ── Left sidebar: rule-based insights ── */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-r flex-shrink-0 overflow-y-auto"
        style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="p-5 space-y-4 pt-6">
          <div>
            <Label>Proactive Insights</Label>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: F.display }}>Rule-based · zero API calls</p>
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
              Dump → KAAL extracts tasks + builds your focus schedule
            </p>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                style={{ fontFamily: F.display, background: 'rgba(255,255,255,0.8)', color: '#374151', border: '1px solid rgba(0,0,0,0.07)' }}>
                <RotateCcw className="w-3 h-3" /> New dump
              </button>
            )}
            <button
              onClick={() => setView(view === 'history' ? 'dump' : 'history')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
              style={{
                fontFamily:  F.display,
                background:  view === 'history' ? '#111827' : 'rgba(255,255,255,0.8)',
                color:       view === 'history' ? '#fff' : '#374151',
                border:      '1px solid rgba(0,0,0,0.07)',
              }}>
              {view === 'history' ? <><X className="w-3 h-3" /> Close</> : <><ListChecks className="w-3 h-3" /> History ({history.length})</>}
            </button>
          </div>
        </div>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto">

          {/* ── History view ── */}
          {view === 'history' ? (
            <div className="p-6 space-y-3 max-w-2xl mx-auto">
              <Label>Past Dumps</Label>
              {history.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No history yet — do your first brain dump!</p>
              )}
              {history.map(e => <HistoryEntry key={e.id} entry={e} onReopen={reopenEntry} />)}
            </div>

          ) : result ? (
            /* ── Results view ── */
            <div className="p-6 space-y-6 max-w-3xl mx-auto">

              {/* DB error banner */}
              {dbError && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#DC2626' }}>Task creation error</p>
                    <p className="text-xs mt-0.5" style={{ color: '#7F1D1D' }}>{dbError}</p>
                    {dbError.toLowerCase().includes('rls') || dbError.toLowerCase().includes('policy') ? (
                      <p className="text-xs mt-1" style={{ color: '#991B1B' }}>
                        Fix: Go to Supabase → Table Editor → tasks → RLS → add INSERT policy for authenticated users.
                      </p>
                    ) : dbError.toLowerCase().includes('column') ? (
                      <p className="text-xs mt-1" style={{ color: '#991B1B' }}>
                        Fix: The tasks table may be missing columns. Check your schema matches the migration SQL.
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* AI source badge */}
              {result.source === 'local' && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
                  <Lightbulb className="w-3.5 h-3.5" />
                  Using local pattern matching (AI temporarily unavailable)
                </div>
              )}

              {/* Summary */}
              <div className="p-5 rounded-3xl" style={GLASS}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: EMOTION_COLOR[result.emotionalState] || '#9CA3AF' }} />
                  <Label>KAAL read · {result.emotionalState}</Label>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{result.summary}</p>
                {result.energyRead && (
                  <p className="text-xs mt-2" style={{ color: '#9CA3AF', fontFamily: F.display }}>{result.energyRead}</p>
                )}
                {result.focusSuggestion && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)' }}>
                    <Target className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6366F1' }} />
                    <p className="text-xs font-semibold" style={{ color: '#6366F1', fontFamily: F.display }}>{result.focusSuggestion}</p>
                  </div>
                )}
              </div>

              {/* Task list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Extracted Tasks</Label>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                    {creating && <span className="animate-pulse" style={{ fontFamily: F.display }}>Syncing…</span>}
                    {!creating && createdCount > 0 && <span className="flex items-center gap-1 text-green-600"><Check className="w-3 h-3" /> {createdCount} synced</span>}
                    {!creating && failedCount > 0 && <span className="flex items-center gap-1" style={{ color: '#EF4444' }}><X className="w-3 h-3" /> {failedCount} failed</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  {result.tasks.map(t => {
                    const ps = PRIORITY_STYLE[t.priority];
                    return (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl border"
                        style={{ background: 'rgba(255,255,255,0.9)', borderColor: 'rgba(0,0,0,0.07)' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ps.color }} />
                        <span className="flex-1 text-sm" style={{ color: '#111827' }}>{t.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: ps.color, background: ps.bg, borderColor: ps.border, fontFamily: F.display }}>
                          {t.priority}
                        </span>
                        <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.mono }}>{t.estimatedMinutes}m</span>
                        {t.status === 'created' && <Check className="w-3.5 h-3.5 text-green-500" />}
                        {t.status === 'failed'  && <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#EF4444' }} title={t.failReason} />}
                        {t.status === 'pending' && creating && <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Blockers */}
              {result.blockers.length > 0 && (
                <div>
                  <Label>Blockers</Label>
                  <div className="mt-2 space-y-1.5">
                    {result.blockers.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border"
                        style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                        <span className="text-xs" style={{ color: '#374151' }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus schedule */}
              {result.focusSessions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label>Focus Schedule</Label>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                  </div>
                  <div className="space-y-2">
                    {result.focusSessions.map((b, i) => (
                      <FocusBlockCard key={i} block={b} index={i} onStart={handleStartFocus} />
                    ))}
                  </div>
                </div>
              )}

              {/* Go to tasks CTA */}
              {createdCount > 0 && (
                <div className="flex justify-center pb-4">
                  <button onClick={() => navigate('/tasks')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
                    style={{ background: '#111827', color: '#fff', fontFamily: F.display }}>
                    <Inbox className="w-4 h-4" /> View Tasks
                  </button>
                </div>
              )}
            </div>

          ) : (
            /* ── Input view ── */
            <div className="p-6 space-y-5 max-w-3xl mx-auto">

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {DUMP_TAGS.map(tag => (
                  <button key={tag.label} onClick={() => toggleTag(tag.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                    style={{
                      background:   tags.includes(tag.label) ? '#111827' : 'rgba(255,255,255,0.8)',
                      color:        tags.includes(tag.label) ? '#fff' : '#374151',
                      borderColor:  tags.includes(tag.label) ? '#111827' : 'rgba(0,0,0,0.07)',
                      fontFamily:   F.display,
                    }}>
                    {tag.emoji} {tag.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative rounded-3xl overflow-hidden" style={GLASS}>
                <textarea
                  ref={textRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); setCharCount(e.target.value.length); }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleProcess(); }}
                  placeholder="Everything that's in your head — tasks, worries, ideas, blockers. Don't filter. KAAL will organise it.&#10;&#10;✨ AI-powered extraction • Spelling mistakes OK • Comma-separated or messy text works fine"
                  className="w-full resize-none bg-transparent p-6 outline-none text-sm leading-relaxed"
                  style={{ color: '#111827', minHeight: 220, fontFamily: 'Inter, sans-serif' }}
                  autoFocus
                />
                <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <span className="text-xs" style={{ color: charCount > 1000 ? '#EF4444' : '#9CA3AF', fontFamily: F.mono }}>
                    {charCount}/2000
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.display }}>⌘↵ to process</span>
                </div>
              </div>

              {/* Process button */}
              <button
                onClick={handleProcess}
                disabled={!input.trim() || processing}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#111827', color: '#fff', fontFamily: F.display }}>
                {processing ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Organising…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Organise + Create Tasks</>
                )}
              </button>

              {/* Pending tasks quick view */}
              {pending.length > 0 && (
                <div>
                  <Label>Open Tasks ({pending.length})</Label>
                  <div className="mt-2 space-y-1.5">
                    {pending.slice(0, 4).map(t => (
                      <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                        style={{ background: 'rgba(255,255,255,0.75)', borderColor: 'rgba(0,0,0,0.06)' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: t.priority === 'urgent' ? '#EF4444' : t.priority === 'high' ? '#D97706' : '#9CA3AF' }} />
                        <span className="text-xs flex-1 truncate" style={{ color: '#374151' }}>{t.title}</span>
                        <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.display }}>{t.priority}</span>
                      </div>
                    ))}
                    {pending.length > 4 && (
                      <button onClick={() => navigate('/tasks')} className="text-xs hover:opacity-70 transition-opacity"
                        style={{ color: '#6366F1', fontFamily: F.display }}>
                        +{pending.length - 4} more → Tasks
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}