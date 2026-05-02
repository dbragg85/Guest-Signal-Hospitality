import { createBrowserClient } from "@supabase/ssr";
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
  return createBrowserClient(env.url, env.key);
}

/** For client UI when env may be unset (local preview without .env). */
export function createClientIfConfigured(): SupabaseClient | null {
  const env = browserSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}
