/**
 * Supabase Client — Figma Make safe version
 * Uses ONLY the hardcoded credentials from /utils/supabase/info.tsx.
 * No import.meta.env access whatsoever.
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

const SUPABASE_URL      = `https://${projectId}.supabase.co`;
const SUPABASE_ANON_KEY = publicAnonKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: { params: { eventsPerSecond: 10 } },
  global:   { headers: { 'x-client-info': 'kaal-productivity-app' } },
});

export type { SupabaseClient } from '@supabase/supabase-js';
