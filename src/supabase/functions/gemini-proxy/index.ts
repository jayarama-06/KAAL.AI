// supabase/functions/gemini-proxy/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// KAAL — Gemini Proxy Edge Function v5
// • Updated model list: Gemini 3.x and 2.5 family
// • 429 quota-exceeded: fails fast with a clear billing/quota message
// • Full per-attempt error log for diagnosis
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Model candidates — tried in order until one succeeds ─────────────────────
// Priority: newest / fastest first so users get the best available model.
// Multiple ID variants included because Google sometimes uses -preview suffixes.
const GEMINI_CANDIDATES = [
  // ── Gemini 3.x ──────────────────────────────────────────────────────────
  { model: 'gemini-3.1-pro',                    api: 'v1beta' },
  { model: 'gemini-3.0-flash',                  api: 'v1beta' },
  { model: 'gemini-3-flash',                    api: 'v1beta' },
  // ── Gemini 2.5 family ───────────────────────────────────────────────────
  { model: 'gemini-2.5-pro',                    api: 'v1beta' },
  { model: 'gemini-2.5-pro-preview',            api: 'v1beta' },
  { model: 'gemini-2.5-flash',                  api: 'v1beta' },
  { model: 'gemini-2.5-flash-preview',          api: 'v1beta' },
  { model: 'gemini-2.5-flash-lite',             api: 'v1beta' },
  { model: 'gemini-2.5-flash-lite-preview',     api: 'v1beta' },
  { model: 'gemini-2.5-flash-live',             api: 'v1beta' },
  { model: 'gemini-2.5-flash-live-preview',     api: 'v1beta' },
  // ── Gemini 2.0 fallbacks ────────────────────────────────────────────────
  { model: 'gemini-2.0-flash',                  api: 'v1beta' },
  { model: 'gemini-2.0-flash-001',              api: 'v1beta' },
  { model: 'gemini-2.0-flash-lite',             api: 'v1beta' },
] as const

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface RequestBody {
  prompt?:            string
  messages?:          ChatMessage[]
  systemInstruction?: string
  temperature?:       number
  maxOutputTokens?:   number
}

// ── Single Gemini call ───────────────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  model: string,
  api: string,
  body: any
): Promise<{ text: string; model: string; api: string } | { error: string; status: number }> {
  const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`

  let res: Response
  try {
    res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch (e: any) {
    return { error: `fetch threw: ${e?.message ?? String(e)}`, status: 0 }
  }

  const raw = await res.text()
  if (!res.ok) return { error: raw.slice(0, 300), status: res.status }

  let data: any
  try { data = JSON.parse(raw) } catch {
    return { error: `non-JSON: ${raw.slice(0, 120)}`, status: res.status }
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason ?? 'unknown'
    return { error: `empty text (finishReason: ${finishReason})`, status: res.status }
  }

  return { text, model, api }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', detail: 'No Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', detail: 'Session invalid or expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── API key ───────────────────────────────────────────────────────────────
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured', notConfigured: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let body: RequestBody = {}
    try { body = await req.json() } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { prompt, messages, systemInstruction, temperature = 0.85, maxOutputTokens = 1400 } = body

    // ── Build Gemini request body ─────────────────────────────────────────────
    let geminiBody: any

    if (messages && messages.length > 0) {
      const contents = messages.map((m: ChatMessage) => ({
        role:  m.role,
        parts: [{ text: m.content }],
      }))
      geminiBody = {
        contents,
        generationConfig: { temperature, topK: 40, topP: 0.95, maxOutputTokens },
      }
      if (systemInstruction) {
        geminiBody.system_instruction = { parts: [{ text: systemInstruction }] }
      }
    } else if (prompt) {
      geminiBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 1200 },
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing prompt or messages field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Try each candidate in order ───────────────────────────────────────────
    const errors: string[] = []
    let quotaExhausted = false

    for (const { model, api } of GEMINI_CANDIDATES) {
      const result = await callGemini(apiKey, model, api, geminiBody)

      if ('text' in result) {
        // ✅ Success
        return new Response(
          JSON.stringify({ success: true, response: result.text, model: result.model, api: result.api }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      errors.push(`[${api}] ${model} → HTTP ${result.status}: ${result.error.slice(0, 180)}`)

      if (result.status === 429) {
        // Quota/rate limit — mark it but keep trying other models.
        // If every single model returns 429 it means the KEY's daily quota
        // is exhausted; no point retrying — return a clear billing message.
        quotaExhausted = true
        continue
      }

      if (result.status === 400) break   // malformed request — stop trying
      // 404 = model not found on this key → continue to next candidate
    }

    // ── All candidates exhausted ──────────────────────────────────────────────
    const allWere429 = errors.every(e => e.includes('HTTP 429'))

    if (allWere429 || quotaExhausted) {
      return new Response(
        JSON.stringify({
          error:  'Gemini API quota exceeded',
          detail: errors.join('\n'),
          hint:   [
            'Your API key has hit its daily or per-minute quota.',
            'Free-tier keys allow ~200 requests/day and 15 requests/minute.',
            'Fix options:',
            '  1. Wait until the quota resets (midnight Pacific time for daily limits).',
            '  2. Enable billing on your Google AI Studio project for higher limits.',
            '  3. Generate a fresh API key in Google AI Studio (aistudio.google.com).',
            '  4. Check usage at: https://ai.google.dev/gemini-api/docs/rate-limits',
          ].join('\n'),
          tried: GEMINI_CANDIDATES.map(c => `${c.api}/${c.model}`),
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        error:  'All Gemini models failed',
        detail: errors.join('\n'),
        tried:  GEMINI_CANDIDATES.map(c => `${c.api}/${c.model}`),
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
