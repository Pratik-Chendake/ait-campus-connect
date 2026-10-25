import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'igekrdkefsrpzxwncwce';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_JWKS_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/.well-known/jwks.json`;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('placeholder'));

// Create a real client if keys are provided, or a safe fallback client if pending key setup
function getSupabaseClient() {
  if (supabaseAnonKey) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('[Supabase Client Initialization Warning]:', err.message);
    }
  }

  // Safe fallback client to prevent React application crashes when key is not loaded
  const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';
  return createClient(supabaseUrl, dummyKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = getSupabaseClient();
export { supabaseUrl };
