export type ElevateGap = {
  key: string;
  title: string;
  clientAsk: string;
  intakeField?: string;
};

export type ElevateDeliverableItem = {
  key: string;
  title: string;
  summary: string;
  bullets?: string[];
};

export type ElevateDeliverablesPayload = {
  version?: number;
  generated_at?: string;
  period_label?: string;
  items?: ElevateDeliverableItem[];
  guest_signal_score?: number | null;
};

export type ElevateUnlockPreview = {
  version?: number;
  headline?: string;
  items?: { key: string; title: string; summary: string }[];
  gaps_count?: number;
};

export function parseElevateGaps(data: Record<string, unknown> | null | undefined): ElevateGap[] {
  const raw = data?.elevate_gaps;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (g): g is ElevateGap =>
      g != null &&
      typeof g === "object" &&
      typeof (g as ElevateGap).key === "string" &&
      typeof (g as ElevateGap).title === "string",
  );
}

export function parseElevateDeliverables(
  data: Record<string, unknown> | null | undefined,
): ElevateDeliverablesPayload | null {
  const raw = data?.elevate_deliverables;
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as ElevateDeliverablesPayload;
  if (!Array.isArray(payload.items) || payload.items.length === 0) return null;
  return payload;
}

export function parseElevateUnlockPreview(
  data: Record<string, unknown> | null | undefined,
): ElevateUnlockPreview | null {
  const raw = data?.elevate_unlock_preview;
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as ElevateUnlockPreview;
  if (!Array.isArray(payload.items) || payload.items.length === 0) return null;
  return payload;
}
