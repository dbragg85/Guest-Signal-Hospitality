"use client";

import { createClientIfConfigured } from "@/lib/supabase/client";
import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function cleanAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  for (const key of [
    "code",
    "token_hash",
    "token",
    "type",
    "error",
    "error_code",
    "error_description",
  ]) {
    url.searchParams.delete(key);
  }
  const nextSearch = url.searchParams.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`,
  );
}

/**
 * Supabase invite links may arrive as:
 * - `?code=` (PKCE — default for inviteUserByEmail + @supabase/ssr)
 * - `?token_hash=&type=invite` (email OTP / server-style)
 * - `#access_token=&refresh_token=` (implicit / older templates)
 */
async function consumeInviteFromUrl(supabase: SupabaseClient) {
  if (typeof window === "undefined") return;

  const { search, hash } = window.location;
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  const authError = query.get("error_description") || query.get("error");
  if (authError) {
    throw new Error(decodeURIComponent(authError.replace(/\+/g, " ")));
  }

  const code = query.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw new Error(error.message || "Could not complete invite sign-in (PKCE code).");
    }
    cleanAuthParamsFromUrl();
    return;
  }

  const typeRaw = query.get("type");
  const tokenHash = query.get("token_hash");

  if (tokenHash && typeRaw && EMAIL_OTP_TYPES.has(typeRaw)) {
    const { error: vErr } = await supabase.auth.verifyOtp({
      type: typeRaw as EmailOtpType,
      token_hash: tokenHash,
    });
    if (vErr) {
      throw new Error(vErr.message || "Could not verify invite link.");
    }
    cleanAuthParamsFromUrl();
    return;
  }

  const hp = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const access_token = hp.get("access_token");
  const refresh_token = hp.get("refresh_token");
  if (access_token && refresh_token) {
    const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sErr) {
      throw new Error(sErr.message || "Could not activate session from invite link.");
    }
    const url = new URL(window.location.href);
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }
}

/**
 * First-time portal access after Supabase inviteUserByEmail: consume session from
 * redirect URL, set password (auth.users), sync display name to public.profiles, then go to dashboard.
 */
export function PortalWelcomePasswordForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClientIfConfigured());
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const sync = (user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
      if (cancelled || !user) return;
      setEmail(user.email ?? null);
      const metaName = user.user_metadata?.full_name;
      setFullName(
        typeof metaName === "string" && metaName.trim()
          ? metaName.trim()
          : "",
      );
    };

    void (async () => {
      try {
        await consumeInviteFromUrl(supabase);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
      if (cancelled) return;
      let session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) {
        await new Promise((r) => setTimeout(r, 400));
        session = (await supabase.auth.getSession()).data.session;
      }
      if (cancelled) return;
      if (session?.user) setError(null);
      sync(session?.user ?? null);
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || loading || !email) return;
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", uid)
        .maybeSingle();
      if (data?.full_name && typeof data.full_name === "string" && data.full_name.trim()) {
        setFullName((prev) => (prev.trim() ? prev : data.full_name!.trim()));
      }
    })();
  }, [supabase, loading, email]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setPending(false);
      setError(
        userErr?.message ||
          "No active invite session. Open the link from your invite email again.",
      );
      return;
    }

    const uid = userData.user.id;
    const trimmedName = fullName.trim();

    const { error: pwErr } = await supabase.auth.updateUser({
      password,
      data: trimmedName ? { full_name: trimmedName } : undefined,
    });
    if (pwErr) {
      setPending(false);
      setError(pwErr.message);
      return;
    }

    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        full_name: trimmedName || null,
        email: userData.user.email ?? email,
      })
      .eq("id", uid);

    if (profErr) {
      setPending(false);
      setError(
        `Password saved; profile update failed: ${profErr.message}. You can still sign in at the portal.`,
      );
      return;
    }

    setPending(false);
    router.push("/portal/dashboard/");
    router.refresh();
  }

  if (!supabase) {
    return (
      <p className="mt-6 text-sm text-amber-900">
        Supabase is not configured. Copy <code className="rounded bg-white/80 px-1">.env.local.example</code> to{" "}
        <code className="rounded bg-white/80 px-1">.env.local</code>.
      </p>
    );
  }

  if (loading) {
    return <p className="mt-8 text-sm text-slate-600">Checking your invite link…</p>;
  }

  if (!email) {
    return (
      <div className="mt-8 space-y-4">
        {error ? (
          <p
            className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-950">
          <p className="font-semibold">We could not activate your invite on this page.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-amber-950/95">
            <li>
              Open the <strong>Accept invitation</strong> link from the email Supabase sent to the address you used on
              the intake form (check spam). Use one tap — do not open the site first in another tab without the link.
            </li>
            <li>
              The link should include a long <strong>query string</strong> or <strong>URL fragment</strong> — do not
              strip it before the page finishes loading.
            </li>
            <li>
              Already finished setup?{" "}
              <Link href="/portal/" className="font-semibold underline">
                Sign in at the portal
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
        <p>
          Signed in as <strong className="break-all">{email}</strong>. Use the <strong>same email</strong> when you
          open the portal later.
        </p>
      </div>

      <div>
        <label htmlFor="welcome-name" className="block text-sm font-semibold text-slate-900">
          Display name <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="welcome-name"
          name="fullName"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25"
          placeholder="e.g. Jamie Chen"
        />
      </div>

      <div>
        <label htmlFor="welcome-password" className="block text-sm font-semibold text-slate-900">
          Create password
        </label>
        <input
          id="welcome-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25"
        />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="welcome-confirm" className="block text-sm font-semibold text-slate-900">
          Confirm password
        </label>
        <input
          id="welcome-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Save and open my dashboard"}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link href="/portal/" className="font-semibold text-amber-800 underline-offset-2 hover:underline">
          Back to portal sign-in
        </Link>
      </p>
    </form>
  );
}
