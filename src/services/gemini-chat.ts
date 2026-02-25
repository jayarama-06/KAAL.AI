/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  KAAL Gemini Chat Service                                 ║
 * ║                                                           ║
 * ║  Powers the real conversational AI in the chat screen.   ║
 * ║                                                           ║
 * ║  Architecture:                                            ║
 * ║  1. Build a rich system prompt with the user's full       ║
 * ║     real-time context (tasks, energy, time, patterns)     ║
 * ║  2. Pass the last N conversation turns as history         ║
 * ║  3. Send to Gemini via the secure edge function           ║
 * ║  4. Return clean text — no templates, no pre-writing      ║
 * ║                                                           ║
 * ║  Gemini IS the response. Heuristics are the fallback.     ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

import { supabase } from './supabase-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
}

export interface TaskContext {
  id:                string;
  title:             string;
  priority:          string;
  status:            string;
  dueDate?:          string | null;
  estimatedMinutes?: number;
  tags?:             string[];
}

export interface UserContext {
  hour:                number;
  dayOfWeek:           number;
  energyLevel:         number;   // 1–5
  todayFocusMinutes:   number;
  streakDays:          number;
  focusSessionActive:  boolean;
  focusSessionMinutes: number;
  tasks:               TaskContext[];
}

export interface GeminiChatResponse {
  success:      boolean;
  text:         string;
  model?:       string;
  fromFallback: boolean;
  error?:       string;
}

// ─── System prompt builder ────────────────────────────────────────────────────

export function buildKaalSystemPrompt(ctx: UserContext): string {
  const now     = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayStr  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const pending  = ctx.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived' && t.status !== 'cancelled');
  const overdue  = pending.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const highPri  = pending.filter(t => t.priority === 'high' || t.priority === 'urgent');
  const done     = ctx.tasks.filter(t => t.status === 'completed');
  const quick    = pending.filter(t => (t.estimatedMinutes ?? 60) <= 20);

  const circadian =
    ctx.hour < 7  ? 'early morning' :
    ctx.hour < 10 ? 'morning peak window' :
    ctx.hour < 12 ? 'late morning' :
    ctx.hour < 14 ? 'post-lunch window' :
    ctx.hour < 17 ? 'afternoon' :
    ctx.hour < 20 ? 'evening' : 'night';

  const energyDesc =
    ctx.energyLevel >= 5 ? 'very high — peak cognitive window' :
    ctx.energyLevel >= 4 ? 'high — good for deep work' :
    ctx.energyLevel === 3 ? 'moderate' :
    ctx.energyLevel === 2 ? 'low — shallow work or quick tasks only' :
    'very low — rest or minimal tasks';

  // Build task list section
  const taskLines = pending.slice(0, 10).map(t => {
    const due  = t.dueDate ? ` · due ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
    const est  = t.estimatedMinutes ? ` · ~${t.estimatedMinutes}m` : '';
    const tags = t.tags?.length ? ` · [${t.tags.join(', ')}]` : '';
    return `  - "${t.title}" (${t.priority}${due}${est}${tags})`;
  }).join('\n');

  const overdueLines = overdue.slice(0, 5).map(t => `  - "${t.title}"`).join('\n');

  return `You are KAAL — an executive function AI assistant built specifically to support people with ADHD and anyone doing deep, demanding work.

━━━ YOUR IDENTITY ━━━
You are not a generic assistant. You are the user's personal cognitive support system. You know their tasks, their energy, their patterns, and their history. Every response must be grounded in their actual situation — not generic productivity advice.

Personality:
• Direct and specific — you name actual tasks, not categories
• Evidence-based — you explain WHY briefly (one sentence of reasoning max)
• Low shame — you never judge, criticize, or pile on; you analyze and move forward
• Concise — 2–4 sentences for most responses; longer only when explicitly building a plan
• You give ONE specific next action, not a menu
• You respond in natural prose — no bullet points, no headers, no markdown unless building a structured plan that the user asked for
• You never say "Great question!" or "I understand how you feel" — you just help
• You remember what was said earlier in this conversation and refer back to it naturally

━━━ CURRENT USER CONTEXT ━━━
Time: ${timeStr} · ${dayStr} (${circadian})
Energy: ${ctx.energyLevel}/5 (${energyDesc})
Focus today: ${ctx.todayFocusMinutes} minutes logged
Active focus session: ${ctx.focusSessionActive ? `yes, ${ctx.focusSessionMinutes} minutes in` : 'no'}
Streak: ${ctx.streakDays} days
Tasks done today: ${done.length}

Task queue:
${pending.length} pending total · ${overdue.length} overdue · ${highPri.length} high/urgent priority
${taskLines || '  (no tasks)'}
${overdue.length > 0 ? `\nOverdue specifically:\n${overdueLines}` : ''}
${quick.length > 0 ? `\nQuick tasks (≤20 min): ${quick.slice(0, 3).map(t => `"${t.title}"`).join(', ')}` : ''}
${highPri.length > 0 ? `\nTop priorities: ${highPri.slice(0, 3).map(t => `"${t.title}"`).join(', ')}` : ''}

━━━ ADHD COACHING PRINCIPLES ━━━
• Activation energy is the biggest barrier — lower the first step, always
• Task clarity prevents avoidance — if something seems vague, name its first concrete action
• Timeboxing beats open-ended effort — give a specific duration (25 min, 45 min)
• Energy alignment matters — don't recommend deep cognitive work during an energy trough
• Progress > perfection — partial movement is always better than paralysis
• Shame spirals kill momentum — never pile on; de-escalate and redirect

━━━ RESPONSE RULES ━━━
• When the user asks what to do next → name a specific task from their list, with a duration
• When the user is overwhelmed → acknowledge in one sentence, then give ONE small action
• When the user vents → validate briefly (one clause), then redirect concretely
• When the user reports completing something → celebrate briefly, suggest the next task
• When the user asks a question → answer it directly, with their actual context woven in
• When uncertain → ask one clarifying question, not multiple
• Do NOT repeat the user's words back to them ("So you're saying...") — just respond`;
}

// ─── API caller ───────────────────────────────────────────────────────────────

export async function callGeminiChat(
  systemInstruction: string,
  history: ChatTurn[],
  temperature = 0.85,
): Promise<GeminiChatResponse> {
  try {
    // Ensure at least one user turn
    if (history.length === 0 || history[history.length - 1].role !== 'user') {
      return { success: false, text: '', fromFallback: true, error: 'No user message to send' };
    }

    // Validate alternating turns — Gemini requires user/model alternation
    const cleaned = cleanHistory(history);

    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        messages:          cleaned,
        systemInstruction,
        temperature,
        maxOutputTokens:   1400,
      },
    });

    if (error) {
      const msg = error.message ?? '';
      const isNotDeployed =
        msg.includes('Failed to send a request to the Edge Function') ||
        msg.includes('FunctionsFetchError') ||
        msg.includes('relay error') ||
        msg.includes('Failed to fetch');
      return {
        success:      false,
        text:         '',
        fromFallback: true,
        error:        isNotDeployed ? 'notDeployed' : msg,
      };
    }

    if (!data?.success || !data?.response) {
      return { success: false, text: '', fromFallback: true, error: data?.error ?? 'Empty response' };
    }

    return {
      success:      true,
      text:         data.response.trim(),
      model:        data.model,
      fromFallback: false,
    };

  } catch (e: any) {
    return { success: false, text: '', fromFallback: true, error: e?.message ?? 'Network error' };
  }
}

// ─── Direct key fallback (dev / when edge function is not configured) ─────────

export async function callGeminiDirect(
  systemInstruction: string,
  history: ChatTurn[],
): Promise<GeminiChatResponse> {
  const key =
    (typeof localStorage !== 'undefined' ? localStorage.getItem('kaal_gemini_key') : null);
  if (!key) return { success: false, text: '', fromFallback: true, error: 'No direct key' };

  try {
    const cleaned  = cleanHistory(history);
    const contents = cleaned.map(m => ({ role: m.role, parts: [{ text: m.content }] }));

    const body: any = { contents, generationConfig: { temperature: 0.85, maxOutputTokens: 1400 } };
    if (systemInstruction) {
      body.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );

    if (!res.ok) return { success: false, text: '', fromFallback: true, error: `HTTP ${res.status}` };

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) return { success: false, text: '', fromFallback: true, error: 'Empty response' };

    return { success: true, text: text.trim(), model: 'gemini-2.0-flash (direct)', fromFallback: false };
  } catch (e: any) {
    return { success: false, text: '', fromFallback: true, error: e?.message };
  }
}

// ─── Unified send function ─────────────────────────────────────────────────────
// Tries edge function first, then direct key, returns error info for fallback decision.

// Module-level latch: once we confirm the function isn't deployed, skip
// the edge-function path for the rest of the session to avoid spamming errors.
let _edgeFunctionNotDeployed = false;

export async function sendToKaal(
  systemInstruction: string,
  history: ChatTurn[],
): Promise<GeminiChatResponse> {
  // Try edge function (skip if we already know it's not deployed)
  if (!_edgeFunctionNotDeployed) {
    const edgeResult = await callGeminiChat(systemInstruction, history);
    if (edgeResult.success) return edgeResult;
    if (edgeResult.error === 'notDeployed') {
      _edgeFunctionNotDeployed = true;
      // still fall through to direct key below
    }
  }

  // Try direct key (works if VITE_GEMINI_API_KEY is set in .env)
  const directResult = await callGeminiDirect(systemInstruction, history);
  if (directResult.success) return directResult;

  return { success: false, text: '', fromFallback: true, error: directResult.error ?? 'notDeployed' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Gemini requires strictly alternating user/model turns.
 * Merge consecutive same-role messages and ensure it ends with a user turn.
 */
function cleanHistory(history: ChatTurn[]): ChatTurn[] {
  const result: ChatTurn[] = [];

  for (const turn of history) {
    if (result.length > 0 && result[result.length - 1].role === turn.role) {
      // Merge with previous same-role turn
      result[result.length - 1].content += '\n' + turn.content;
    } else {
      result.push({ ...turn });
    }
  }

  // Gemini needs conversation to end with a user turn
  while (result.length > 0 && result[result.length - 1].role === 'model') {
    result.pop();
  }

  return result;
}

// ─── Context-aware suggestion generator ──────────────────────────────────────
// Generates smart quick reply suggestions based on the current context.
// These are client-side and instant — no API call.

export function generateContextualSuggestions(ctx: UserContext): string[] {
  const now     = new Date();
  const pending = ctx.tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const overdue = pending.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const highPri = pending.filter(t => t.priority === 'high' || t.priority === 'urgent');
  const quick   = pending.filter(t => (t.estimatedMinutes ?? 60) <= 20);

  const suggestions: string[] = [];

  // Most urgent suggestion first
  if (overdue.length > 0) {
    suggestions.push(`Help me with "${overdue[0].title}"`);
  } else if (highPri.length > 0) {
    suggestions.push(`Let's work on "${highPri[0].title}"`);
  }

  // State-based suggestions
  if (ctx.focusSessionActive && ctx.focusSessionMinutes > 60) {
    suggestions.push("Should I take a break?");
  } else if (ctx.energyLevel <= 2) {
    suggestions.push("I'm low on energy, what should I do?");
  } else if (ctx.energyLevel >= 4 && !ctx.focusSessionActive) {
    suggestions.push("I'm feeling focused — what's my best move?");
  }

  // Time-based
  if (ctx.hour >= 7 && ctx.hour <= 9 && ctx.todayFocusMinutes === 0) {
    suggestions.push("Help me plan my day");
  }
  if (ctx.hour >= 17) {
    suggestions.push("Help me wrap up for today");
  }

  // General fallbacks
  if (quick.length > 0 && suggestions.length < 3) {
    suggestions.push(`What's a quick win I can do now?`);
  }
  if (suggestions.length < 3) {
    suggestions.push("I'm feeling overwhelmed");
  }
  if (suggestions.length < 4) {
    suggestions.push("What should I focus on?");
  }

  return suggestions.slice(0, 4);
}