#!/usr/bin/env node
/**
 * Creates .env.local from .env.local.example if missing.
 * You must edit .env.local and paste real values from Supabase (Project Settings → API).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const target = path.join(root, ".env.local");
const example = path.join(root, ".env.local.example");

if (fs.existsSync(target)) {
  console.log(".env.local already exists — edit it with your Supabase URL and anon key.");
  process.exit(0);
}

if (!fs.existsSync(example)) {
  console.error("Missing .env.local.example");
  process.exit(1);
}

fs.copyFileSync(example, target);
console.log("Created .env.local from .env.local.example");
console.log("Next: open Supabase → Project Settings → API → copy URL + anon key into .env.local");
process.exit(0);
