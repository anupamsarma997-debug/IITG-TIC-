import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl) return false;
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export const isSupabaseConfigured = isValidHttpUrl(rawUrl) && Boolean(rawKey && !rawKey.includes('YOUR_SUPABASE'));

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(rawUrl, rawKey);
  } catch (err) {
    console.warn('Supabase client initialization skipped or failed:', err);
    supabaseClient = null;
  }
}

export const supabase = supabaseClient;
