#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  collectGrowthMetrics,
  finishAutomationRun,
  recordAutomationRun,
  serviceClient,
} from "./lib/growth-operator.mjs";

const root = process.cwd();
const runtimeDir = path.join(root, ".operator");
const inputPath = path.join(runtimeDir, "daily-metrics.json");
const summaryPath = path.join(runtimeDir, "codex-summary.md");
const dryRun = ["1", "true", "yes"].includes(
  (process.env.CODEX_OPERATOR_DRY_RUN ?? "").toLowerCase(),
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: options.env ?? process.env,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed${result.stderr ? `: ${result.stderr.trim()}` : ""}`,
    );
  }
  return options.capture ? result.stdout.trim() : "";
}

function safeCodexEnvironment() {
  const blocked = /(TOKEN|SECRET|PASSWORD|SUPABASE|RESEND|APIFY|API_KEY|AUTH_JSON)/i;
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !blocked.test(key)),
  );
}

function operatorPrompt(today) {
  return `You are the bounded growth operator for Guest Signal Hospitality.

Read ${path.relative(root, inputPath)} and the repository. Produce an evidence-based daily analysis.

Goal:
- Improve qualified restaurant lead generation and paid conversion.
- Optimize for paid MRR and gross margin, not activity volume.

Allowed:
- Analyze the sanitized funnel, sales, prospect, and automation metrics.
- Write your final analysis to the configured output.
- If evidence is sufficient, implement at most ONE small, reversible website experiment under src/ or public/.
- Keep any implementation under 8 changed files and 500 changed lines.

Forbidden:
- Do not access secrets, .env files, credentials, customer PII, or external accounts.
- Do not send email or outreach, publish content, deploy, push, merge, spend money, change pricing, create migrations, or modify workflows/scripts.
- Do not invent customer evidence or performance claims.
- Do not bypass safety, sandbox, or platform controls.

Analysis format:
1. Executive summary
2. Funnel bottleneck with evidence
3. Recommended action for today
4. Experiment hypothesis and success metric
5. Changes made (or "No code change")
6. Owner approvals needed

If the data is sparse, prefer "collect more data" or a measurement improvement over speculative copy changes.
Date: ${today}`;
}

function localBin(name) {
  const candidate = path.join(os.homedir(), ".local", "bin", name);
  return fs.existsSync(candidate) ? candidate : name;
}

function validateChanges() {
  const changed = run("git", ["diff", "--name-only"], { capture: true })
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const forbidden = changed.filter(
    (file) => !(file.startsWith("src/") || file.startsWith("public/")),
  );
  if (forbidden.length) {
    throw new Error(`Codex changed forbidden paths: ${forbidden.join(", ")}`);
  }
  if (changed.length > 8) {
    throw new Error(`Codex changed ${changed.length} files; limit is 8.`);
  }

  const numstat = run("git", ["diff", "--numstat"], { capture: true });
  const changedLines = numstat
    .split("\n")
    .filter(Boolean)
    .reduce((sum, line) => {
      const [added, deleted] = line.split("\t");
      return sum + (Number(added) || 0) + (Number(deleted) || 0);
    }, 0);
  if (changedLines > 500) {
    throw new Error(`Codex changed ${changedLines} lines; limit is 500.`);
  }
  return { changed, changedLines };
}

const supabase = serviceClient();
let runId;

try {
  runId = await recordAutomationRun(supabase, {
    run_kind: "codex_operator",
    status: "started",
  });

  fs.mkdirSync(runtimeDir, { recursive: true });
  const metrics = await collectGrowthMetrics(supabase, 7);
  fs.writeFileSync(inputPath, `${JSON.stringify(metrics, null, 2)}\n`, "utf8");

  const today = new Date().toISOString().slice(0, 10);
  const prompt = operatorPrompt(today);
  if (dryRun) {
    console.log(prompt);
    await finishAutomationRun(supabase, runId, {
      status: "skipped",
      summary: "Codex operator prompt generated in dry-run mode.",
      metrics,
    });
    process.exit(0);
  }

  const dirtyBefore = run("git", ["status", "--porcelain"], { capture: true });
  if (dirtyBefore) {
    throw new Error("Codex operator requires a clean, dedicated Git checkout.");
  }

  const branch = `operator/${today}-${Date.now()}`;
  run("git", ["checkout", "-b", branch]);

  const codexBin = process.env.CODEX_BIN?.trim() || localBin("codex");
  run(
    codexBin,
    [
      "exec",
      "--sandbox",
      "workspace-write",
      "--config",
      'approval_policy="never"',
      "--output-last-message",
      summaryPath,
      prompt,
    ],
    { env: safeCodexEnvironment() },
  );

  const { changed, changedLines } = validateChanges();
  let pullRequestUrl = null;
  if (changed.length) {
    run("npm", ["run", "build"]);
    run("git", ["add", "--", ...changed]);
    run("git", ["commit", "-m", `experiment: bounded growth operator ${today}`]);
    run("git", ["push", "--set-upstream", "origin", branch]);
    pullRequestUrl = run(
      process.env.GH_BIN?.trim() || localBin("gh"),
      [
        "pr",
        "create",
        "--base",
        "main",
        "--head",
        branch,
        "--title",
        `Bounded growth experiment — ${today}`,
        "--body-file",
        summaryPath,
      ],
      { capture: true },
    );
  }

  const summary = fs.existsSync(summaryPath)
    ? fs.readFileSync(summaryPath, "utf8").slice(0, 12000)
    : "Codex completed without a final summary.";
  await finishAutomationRun(supabase, runId, {
    status: changed.length ? "approval_required" : "succeeded",
    summary,
    metrics: {
      changed_files: changed,
      changed_lines: changedLines,
      pull_request_url: pullRequestUrl,
    },
    artifact_path: summaryPath,
  });
  console.log(summary);
  if (pullRequestUrl) console.log(`Pull request: ${pullRequestUrl}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (runId) {
    await finishAutomationRun(supabase, runId, {
      status: "failed",
      error_message: message.slice(0, 2000),
    }).catch(() => {});
  }
  console.error(message);
  process.exit(1);
}
