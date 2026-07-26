/**
 * File-backed Reddit engagement draft store (.operator/reddit-drafts/).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

export function draftsRoot(cwd = process.cwd()) {
  return join(cwd, ".operator", "reddit-drafts");
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function newDraftId() {
  return `rd_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

/**
 * @param {object} draft
 */
export function saveDraft(draft, cwd = process.cwd()) {
  const root = draftsRoot(cwd);
  ensureDir(root);
  const id = draft.id || newDraftId();
  const record = {
    ...draft,
    id,
    updatedAt: new Date().toISOString(),
  };
  if (!record.createdAt) record.createdAt = record.updatedAt;
  writeFileSync(join(root, `${id}.json`), JSON.stringify(record, null, 2));
  return record;
}

/**
 * @param {string} id
 */
export function loadDraft(id, cwd = process.cwd()) {
  const path = join(draftsRoot(cwd), `${id}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @param {{ status?: string }} [filter]
 */
export function listDrafts(filter = {}, cwd = process.cwd()) {
  const root = draftsRoot(cwd);
  if (!existsSync(root)) return [];
  const rows = readdirSync(root)
    .filter((f) => f.endsWith(".json") && f !== "latest-batch.json")
    .map((f) => JSON.parse(readFileSync(join(root, f), "utf8")))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  if (filter.status) return rows.filter((r) => r.status === filter.status);
  return rows;
}

/**
 * @param {string} id
 * @param {string} status
 * @param {Record<string, unknown>} [extra]
 */
export function setDraftStatus(id, status, extra = {}, cwd = process.cwd()) {
  const draft = loadDraft(id, cwd);
  if (!draft) throw new Error(`Draft not found: ${id}`);
  return saveDraft({ ...draft, ...extra, status }, cwd);
}
