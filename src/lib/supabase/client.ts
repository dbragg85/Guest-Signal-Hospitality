import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Prevents sharing auth storage with the portal session (see createAnonClientForLeadIntake). */
const noopAuthStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

function browserSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) return null;
  return { url, key };
}

export function createClient(): SupabaseClient {
  const env = browserSupabaseEnv();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(env.url, env.key);
}

/** For client UI when env may be unset (local preview without .env). */
export function createClientIfConfigured(): SupabaseClient | null {
  const env = browserSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}

/**
 * Public website inserts (`lead_intake_submissions`) must use the anon JWT only.
 * `createBrowserClient` shares cookie storage with the portal; logged-in users
 * would otherwise send `authenticated` and hit RLS 42501 (policies are `TO anon`).
 */
export function createAnonClientForLeadIntake(): SupabaseClient | null {
  const env = browserSupabaseEnv();
  if (!env) return null;
  return createSupabaseJsClient(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: noopAuthStorage,
    },
  });
}
