"use client";

import { usePortalSession } from "@/contexts/PortalSessionContext";
import { createClientIfConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/portal/dashboard/";
  const { supabase, configured } = usePortalSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const client = supabase ?? createClientIfConfigured();
    if (!client) {
      setError("Supabase is not configured. Add environment variables.");
      return;
    }
    setPending(true);
    const { error: err } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    router.refresh();
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const client = supabase ?? createClientIfConfigured();
    if (!client) {
      setError("Supabase is not configured. Add environment variables.");
      return;
    }
    setPending(true);
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error: err } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}${nextPath.startsWith("/") ? nextPath : `/${nextPath}`}`,
      },
    });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("Check your email for the sign-in link.");
  }

  if (!configured) {
    return (
      <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        <p className="font-semibold">Supabase not configured</p>
        <p className="mt-2 text-amber-900/90">
          Copy{" "}
          <code className="rounded bg-white/80 px-1">.env.local.example</code>{" "}
          to <code className="rounded bg-white/80 px-1">.env.local</code> and add
          your project URL and anon key.
        </p>
        <p className="mt-3">
          <Link href="/portal/demo/" className="font-semibold underline">
            View the public demo dashboard
          </Link>{" "}
          meanwhile.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="portal-email"
            className="block text-sm font-semibold text-slate-900"
          >
            Email
          </label>
          <input
            id="portal-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@bocacincinnati.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25"
            required
          />
        </div>
        <div>
          <label
            htmlFor="portal-password"
            className="block text-sm font-semibold text-slate-900"
          >
            Password
          </label>
          <input
            id="portal-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25"
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-800" role="status">
            {message}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-gradient-to-b from-stone-100 via-stone-50 to-stone-100 px-2 text-slate-500">
            Or
          </span>
        </div>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-3" noValidate>
        <p className="text-sm text-slate-600">
          Prefer a magic link? We&apos;ll email you a one-time sign-in link (same
          email field above).
        </p>
        <button
          type="submit"
          className="btn-secondary w-full"
          disabled={pending || !email.trim()}
        >
          {pending ? "Sending…" : "Email me a magic link"}
        </button>
      </form>
    </div>
  );
}
