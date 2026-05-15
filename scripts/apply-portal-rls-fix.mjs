#!/usr/bin/env node
/**
 * Apply supabase/migrations/028_portal_rls_recursion_fix.sql to the linked project.
 *
 * Requires one of:
 *   - `supabase link` + `npx supabase db push` (database password)
 *   - DATABASE_URL or SUPABASE_DB_URL (postgres connection string)
 *
 * Or paste the migration file into Supabase Dashboard → SQL Editor → Run.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const sqlPath = path.join(ROOT, "supabase/migrations/028_portal_rls_recursion_fix.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const dbUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "").trim();

if (dbUrl) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Applied 028_portal_rls_recursion_fix.sql via DATABASE_URL.");
  } finally {
    await client.end();
  }
  process.exit(0);
}

const push = spawnSync(
  "npx",
  ["--yes", "supabase@2.30.4", "db", "push", "--include-all"],
  { cwd: ROOT, stdio: "inherit", env: process.env },
);
if (push.status === 0) {
  console.log("Applied migrations via supabase db push.");
  process.exit(0);
}

console.error(
  "Could not apply automatically. Paste this file in Supabase SQL Editor and run:\n  " +
    sqlPath,
);
process.exit(1);
