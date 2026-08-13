import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env and restart the dev server (env vars are inlined at bundle time).',
  );
}

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No deep-link auth callback in this app — sign-in is anonymous.
    detectSessionInUrl: false,
  },
});

/**
 * Supabase refreshes tokens on a timer, which iOS suspends in the background.
 * Tie the timer to foreground state so a session that was backgrounded for a
 * while still comes back valid.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/**
 * Returns the current user, creating an anonymous one on first launch.
 *
 * Anonymous auth gives every install its own `auth.uid()`, which is what the RLS
 * policies key off — no login screen, but the rows are still isolated per user.
 */
export async function ensureSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.user;

  const signIn = await supabase.auth.signInAnonymously();
  if (signIn.error) {
    // Anonymous sign-in is off by default on a new Supabase project. Without it
    // there is no auth.uid(), so every RLS-protected table reads as empty and
    // the app looks broken for no visible reason — name the cause instead.
    if (/anonymous/i.test(signIn.error.message)) {
      throw new Error(
        'Anonymous sign-ins are disabled for this Supabase project. Enable them under ' +
          'Authentication → Sign In / Providers → Anonymous sign-ins, then reload the app.',
      );
    }
    throw signIn.error;
  }
  if (!signIn.data.user) throw new Error('Anonymous sign-in returned no user.');
  return signIn.data.user;
}
