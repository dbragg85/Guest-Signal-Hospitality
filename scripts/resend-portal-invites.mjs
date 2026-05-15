#!/usr/bin/env node
/**
 * Portal access for addresses already in Supabase Auth (or new invites).
 *
 * 1) Tries admin inviteUserByEmail (Supabase sends "You have been invited") — works for new users.
 * 2) If "already registered", generates a one-time magic link and emails it via Resend when
 *    RESEND_API_KEY + RESEND_FROM are set in .env.local; otherwise prints the link (local ops only).
 *
 * Env (.env.local): SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 * Optional: NEXT_PUBLIC_SITE_URL, RESEND_API_KEY, RESEND_FROM
 *
 * Usage:
 *   npm run resend:portal-invites -- dbragg85@gmail.com other@school.edu
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const envPath = path.join(ROOT, ".env.local");

function loadDotEnvLocal() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

async function sendMagicLinkEmail({ to, magicUrl, siteOrigin }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.RESEND_FROM || "").trim();
  if (!apiKey || !from) return { ok: false, reason: "RESEND_API_KEY or RESEND_FROM unset" };

  const portal = `${siteOrigin}/portal/`;
  const subject = "Your Guest Signal portal sign-in link";
  const text = [
    "Use the link below to open your Guest Signal client portal (one-time sign-in).",
    "",
    magicUrl,
    "",
    `After you are signed in, bookmark: ${portal}`,
    "",
    "If you still need to create your password, open Profile or use the welcome flow from your invite.",
    "",
    "— Guest Signal Hospitality",
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html: `<p>Use this one-time link to sign in to the <strong>Guest Signal</strong> client portal:</p>
<p><a href="${magicUrl.replace(/"/g, "&quot;")}">Open portal sign-in</a></p>
<p><a href="${portal.replace(/"/g, "&quot;")}">Portal home</a> (bookmark after sign-in)</p>
<p style="color:#64748b;font-size:0.875rem">If you have not set a password yet, complete the welcome step after opening the link.</p>`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, reason: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true, reason: null };
}

loadDotEnvLocal();

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://guestsignalhospitality.com")
  .trim()
  .replace(/\/+$/, "");
const inviteRedirectTo = `${siteOrigin}/portal/welcome/`;
/** After magic sign-in, land on portal (dashboard list). */
const magicRedirectTo = `${siteOrigin}/portal/dashboard/`;

const emails = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

if (!emails.length) {
  console.error("Pass one or more emails, e.g.:\n  npm run resend:portal-invites -- you@example.com");
  process.exit(2);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("invite redirectTo:", inviteRedirectTo);
console.log("magic link redirectTo:", magicRedirectTo);

for (const email of emails) {
  if (!email.includes("@")) {
    console.warn("Skip invalid:", email);
    continue;
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteRedirectTo,
  });

  if (!error) {
    console.log(`\n${email}: Supabase invite email sent (user id ${data?.user?.id ?? "n/a"}).`);
    continue;
  }

  const msg = error.message || String(error);
  console.log(`\n${email}: inviteUserByEmail — ${msg}`);

  if (!/already|registered|exists/i.test(msg)) {
    console.error("  (not treating as existing user; fix error above.)");
    continue;
  }

  // Existing users: magic link to welcome so PKCE ?code= is exchanged before password setup.
  const gen = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: inviteRedirectTo },
  });

  if (gen.error || !gen.data?.properties?.action_link) {
    console.error("  generateLink(magiclink) failed:", gen.error?.message || "no action_link");
    continue;
  }

  const magicUrl = gen.data.properties.action_link;
  const emailed = await sendMagicLinkEmail({ to: email, magicUrl, siteOrigin });
  if (emailed.ok) {
    console.log(`  Magic link emailed via Resend to ${email}.`);
  } else {
    console.warn(`  Resend skipped (${emailed.reason}). Paste this link in a private channel for the user:`);
    console.warn(`  ${magicUrl}`);
  }
}

console.log("\nDone.");
