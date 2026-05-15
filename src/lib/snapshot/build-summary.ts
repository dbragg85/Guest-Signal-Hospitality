import { SNAPSHOT_DELIVERABLES } from "@/lib/snapshot/constants";
import { recommendSnapshotPlan, snapshotPriorityLabel } from "@/lib/snapshot/recommend-plan";
import type { SnapshotIntakePayload, SnapshotPriority } from "@/lib/snapshot/types";

export function buildSnapshotSummaryForStorage(payload: {
  snapshotPriority: SnapshotPriority;
  recommendedPlanKey: string;
  recommendedPlanName: string;
}): string {
  const deliverables = SNAPSHOT_DELIVERABLES.map((d) => d.label).join("; ");
  return JSON.stringify({
    version: 1,
    priority: payload.snapshotPriority,
    priorityLabel: snapshotPriorityLabel(payload.snapshotPriority),
    deliverables: SNAPSHOT_DELIVERABLES.map((d) => d.key),
    recommendedPlan: payload.recommendedPlanKey,
    recommendedPlanName: payload.recommendedPlanName,
    deliverableLabels: deliverables,
  });
}

export function buildSnapshotFocusNote(
  priority: SnapshotPriority,
  message: string,
): string {
  const label = snapshotPriorityLabel(priority);
  const rec = recommendSnapshotPlan(priority);
  const parts = [
    `Snapshot priority: ${label}`,
    `Recommended plan: ${rec.planName} (${rec.planKey})`,
  ];
  if (message.trim()) parts.push(`Notes: ${message.trim()}`);
  return parts.join("\n");
}
