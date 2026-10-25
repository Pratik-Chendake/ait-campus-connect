import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const SUPABASE_PROJECT_ID = 'igekrdkefsrpzxwncwce';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_JWKS_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/.well-known/jwks.json`;

const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    ((SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) ||
     (SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('placeholder')))
  );
}

const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

// Resilient fetch wrapper with retry and explicit Connection: close
// to protect against Node.js/Windows Undici TLS keep-alive resets
export const resilientFetch = async (url, options = {}) => {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Connection': 'close'
        }
      });
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
};

// Service-role client for backend synchronization & admin mutations (bypasses RLS safely)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || dummyKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      fetch: resilientFetch
    }
  }
);

// Public client for browser / read queries respecting Row Level Security
export const supabasePublic = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || dummyKey,
  {
    auth: {
      persistSession: true
    },
    global: {
      fetch: resilientFetch
    }
  }
);

export { SUPABASE_URL };
