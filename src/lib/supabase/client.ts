import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  return createBrowserClient(env.url, env.key, {
    auth: {
      flowType: "pkce",
      // Welcome page calls exchangeCodeForSession explicitly (static export).
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
}

/** For client UI when env may be unset (local preview without .env). */
export function createClientIfConfigured(): SupabaseClient | null {
  const env = browserSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key, {
    auth: {
      flowType: "pkce",
      // Welcome page calls exchangeCodeForSession explicitly (static export).
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
}

/**
 * Public website inserts (`lead_intake_submissions`) must use the anon JWT only.
 * `createBrowserClient` merges portal sessions via `auth.getSession()` for REST;
 * that sends `authenticated` and hits RLS 42501 (policies are `TO anon`).
 * `accessToken` forces PostgREST to always use the anon key (see SupabaseClient._getAccessToken).
 */
export function createAnonClientForLeadIntake(): SupabaseClient | null {
  const env = browserSupabaseEnv();
  if (!env) return null;
  return createSupabaseJsClient(env.url, env.key, {
    accessToken: async () => env.key,
  });
}
