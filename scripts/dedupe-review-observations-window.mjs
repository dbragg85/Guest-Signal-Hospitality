#!/usr/bin/env node
/**
 * Delete near-duplicate rows in `review_observations` for one restaurant + date window.
 * Duplicates = same `source`, `review_date`, `rating`, and normalized `review_text` (first 600 chars).
 * Keeps the row with the smallest `created_at` (then smallest `id`).
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESTAURANT_SLUG (required),
 *      PERIOD_START, PERIOD_END (YYYY-MM-DD, required),
 *      DRY_RUN=1 to print only.
 *
 * Afterward, rerun `rebuild-rubric-scorecard-from-observations` for that period so scorecards
 * and `rubric_review_attributions` match (observation deletes cascade attributions).
 */
import { createClient } from "@supabase/supabase-js";

function getEnv(name, { required = false, fallback = undefined } = {}) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (required) throw new Error(`Missing required env var: ${name}`);
  return fallback;
}

function normalizeText(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 600);
}

function fingerprint(row) {
  return [
    String(row.source ?? ""),
    String(row.review_date ?? ""),
    String(row.rating ?? ""),
    normalizeText(row.review_text),
  ].join("\t");
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL", { required: true });
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", { required: true });
  const slug = getEnv("RESTAURANT_SLUG", { required: true });
  const periodStart = getEnv("PERIOD_START", { required: true });
  const periodEnd = getEnv("PERIOD_END", { required: true });
  const dryRun = ["1", "true", "yes"].includes((getEnv("DRY_RUN", { fallback: "0" }) || "").toLowerCase());

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: restaurant, error: rErr } = await supabase.from("restaurants").select("id, slug").eq("slug", slug).maybeSingle();
  if (rErr) throw rErr;
  if (!restaurant) throw new Error(`No restaurant slug=${slug}`);

  const { data: rows, error: oErr } = await supabase
    .from("review_observations")
    .select("id, source, review_date, rating, review_text, created_at, external_review_id")
    .eq("restaurant_id", restaurant.id)
    .gte("review_date", periodStart)
    .lte("review_date", periodEnd)
    .order("created_at", { ascending: true });
  if (oErr) throw oErr;
  const list = rows ?? [];
  console.log(`Loaded ${list.length} observation(s) for ${slug} [${periodStart}…${periodEnd}]`);

  const byFp = new Map();
  for (const row of list) {
    const fp = fingerprint(row);
    const cur = byFp.get(fp) ?? [];
    cur.push(row);
    byFp.set(fp, cur);
  }

  const toDelete = [];
  for (const [, group] of byFp) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      if (ta !== tb) return ta - tb;
      return String(a.id).localeCompare(String(b.id));
    });
    const keep = sorted[0];
    for (let i = 1; i < sorted.length; i += 1) {
      toDelete.push({ id: sorted[i].id, dupOf: keep.id, fp: fingerprint(sorted[i]) });
    }
  }

  if (!toDelete.length) {
    console.log("No duplicate groups (same source+date+rating+normalized text). Nothing to delete.");
    const bySource = new Map();
    for (const r of list) {
      const s = String(r.source ?? "");
      bySource.set(s, (bySource.get(s) ?? 0) + 1);
    }
    console.log("Counts by source:", Object.fromEntries(bySource));
    return;
  }

  console.log(`Found ${toDelete.length} duplicate row(s) to remove (keeping oldest per fingerprint).`);
  for (const d of toDelete.slice(0, 20)) {
    console.log(`  delete ${d.id} (dup of ${d.dupOf})`);
  }
  if (toDelete.length > 20) console.log(`  … and ${toDelete.length - 20} more`);

  if (dryRun) {
    console.log("DRY_RUN=1 — no deletes executed.");
    return;
  }

  const ids = toDelete.map((d) => d.id);
  const chunk = 50;
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    const { error: delErr } = await supabase.from("review_observations").delete().in("id", slice);
    if (delErr) throw delErr;
  }
  console.log(`Deleted ${ids.length} duplicate review_observations row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
