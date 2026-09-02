import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client stub.
 *
 * Reads EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY.
 * When either is missing, `getSupabaseClient()` is null and the app stays
 * on the Zustand local store (see src/data).
 *
 * A live Supabase project is optional — local demo does not need keys.
 */

function readConfig(): { url: string; anonKey: string } {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readConfig();
  return url.startsWith('http') && anonKey.length > 0;
}

export type DataBackend = 'local' | 'supabase';

/** Feature flag: supabase only when both public env keys are present. */
export function getDataBackend(): DataBackend {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}

let cached: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!isSupabaseConfigured()) {
    cached = null;
    return null;
  }
  const { url, anonKey } = readConfig();
  cached = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

/** Null when env keys are missing (default local demo). */
export const supabase: SupabaseClient | null = getSupabaseClient();
