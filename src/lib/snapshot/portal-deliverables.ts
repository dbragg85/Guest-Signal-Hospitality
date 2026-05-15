export type SnapshotDeliverableItem = {
  key: string;
  title: string;
  summary: string;
  bullets?: string[];
};

export type SnapshotDeliverablesPayload = {
  version?: number;
  generated_at?: string;
  period_label?: string;
  items?: SnapshotDeliverableItem[];
  recommended_plan?: {
    key: string;
    name: string;
    price: string;
    rationale: string;
    ctaPath?: string;
  };
  guest_signal_score?: number | null;
};

export function parseSnapshotDeliverables(data: Record<string, unknown> | null | undefined): SnapshotDeliverablesPayload | null {
  const raw = data?.snapshot_deliverables;
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as SnapshotDeliverablesPayload;
  if (!Array.isArray(payload.items) || payload.items.length === 0) return null;
  return payload;
}
