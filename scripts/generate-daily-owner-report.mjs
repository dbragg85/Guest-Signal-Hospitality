#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  buildOwnerReport,
  collectGrowthMetrics,
  finishAutomationRun,
  recordAutomationRun,
  sendOwnerEmail,
  serviceClient,
} from "./lib/growth-operator.mjs";

const dryRun = ["1", "true", "yes"].includes((process.env.DRY_RUN ?? "").toLowerCase());
const outputPath = path.resolve(
  process.env.OWNER_REPORT_OUTPUT?.trim() || ".operator/daily-metrics.json",
);

const supabase = serviceClient();
let runId;

try {
  runId = await recordAutomationRun(supabase, {
    run_kind: "daily_report",
    status: "started",
  });

  const metrics = await collectGrowthMetrics(supabase, 7);
  const report = buildOwnerReport(metrics);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({ metrics, report_markdown: report.markdown }, null, 2)}\n`,
    "utf8",
  );

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report.markdown, "utf8");
  }

  if (dryRun) {
    console.log(report.markdown);
  } else {
    await sendOwnerEmail(report);
  }

  await finishAutomationRun(supabase, runId, {
    status: "succeeded",
    summary: dryRun ? "Daily owner report generated (dry run)." : "Daily owner report emailed.",
    metrics,
    artifact_path: outputPath,
  });
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
