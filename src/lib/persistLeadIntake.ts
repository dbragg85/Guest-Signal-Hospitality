import { createAnonClientForLeadIntake } from "@/lib/supabase/client";

function cleanField(v: string): string | null {
  const t = v?.trim();
  if (!t || t === "—") return null;
  return t;
}

export type LeadIntakePayload = {
  inquiryPlan: string;
  name: string;
  email: string;
  business: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  conceptType: string;
  locationCount: string;
  snapshotFocus: string;
  goals: string;
  competitorsNote: string;
  socialPresenceNote: string;
  venuePhone: string;
  websiteUrl: string;
  gbpUrl?: string;
  operatingHoursNote: string;
  menuText?: string;
  menuSourceUrl?: string;
  message: string;
  snapshotPriority?: string;
  recommendedPlan?: string;
  snapshotSummary?: string;
};

export type LeadIntakeDuplicateCode =
  | "active_email"
  | "active_venue_profile"
  | "recent_converted_email";

export type PersistLeadIntakeResult = {
  attempted: boolean;
  /** True when a row was inserted into lead_intake_submissions. */
  rowInserted: boolean;
  /** Set when INSERT fails. */
  insertErrorMessage: string | null;
  /** Set when INSERT succeeded but RPC id lookup failed (e.g. migration 011 not applied). */
  lookupErrorMessage: string | null;
  /** Another row is already in the automation queue with the same email or venue profile (migration 025). */
  blockedDuplicate?: boolean;
  blockedDuplicateCode?: LeadIntakeDuplicateCode | null;
  /** Primary key — copy into FormSubmit email for SQL join. */
  leadIntakeId?: string;
  /** Stored on row; inbox can match this column if id is missing. */
  submissionClientKey?: string;
};

/** When Supabase env is configured, inserts a row for super-admin review. */
export async function persistLeadIntakeToSupabase(
  payload: LeadIntakePayload,
): Promise<PersistLeadIntakeResult> {
  const supabase = createAnonClientForLeadIntake();
  if (!supabase) {
    return {
      attempted: false,
      rowInserted: false,
      insertErrorMessage: null,
      lookupErrorMessage: null,
    };
  }

  const submissionClientKey = crypto.randomUUID();

  const { data: blockData, error: blockErr } = await supabase.rpc(
    "check_lead_intake_submission_blocked",
    {
      p_email: payload.email.trim(),
      p_business: payload.business.trim(),
      p_name: payload.name.trim(),
      p_city: payload.city?.trim() ?? "",
      p_state: payload.state?.trim() ?? "",
      p_zip: payload.zip?.trim() ?? "",
    },
  );

  let blockPayload: unknown = blockData;
  if (!blockErr && typeof blockData === "string") {
    try {
      blockPayload = JSON.parse(blockData) as unknown;
    } catch {
      blockPayload = null;
    }
  }

  if (blockErr) {
    console.warn(
      "[lead-intake] check_lead_intake_submission_blocked failed (duplicate guard skipped):",
      blockErr.message,
    );
  }

  if (!blockErr && blockPayload && typeof blockPayload === "object" && "blocked" in blockPayload) {
    const o = blockPayload as { blocked?: boolean; code?: string };
    if (o.blocked === true) {
      let code: LeadIntakeDuplicateCode = "active_email";
      if (o.code === "active_venue_profile") code = "active_venue_profile";
      else if (o.code === "recent_converted_email") code = "recent_converted_email";
      return {
        attempted: true,
        rowInserted: false,
        insertErrorMessage: null,
        lookupErrorMessage: null,
        blockedDuplicate: true,
        blockedDuplicateCode: code,
        submissionClientKey,
      };
    }
  }

  function isActiveEmailUniqueViolation(err: { message?: string; details?: string }): boolean {
    const text = `${err.message ?? ""} ${(err as { details?: string }).details ?? ""}`;
    return /lead_intake_active_email_pending_uidx/i.test(text);
  }

  const insertRow: Record<string, unknown> = {
    inquiry_plan: payload.inquiryPlan.trim(),
    name: payload.name.trim(),
    email: payload.email.trim(),
    business: payload.business.trim(),
    street_address: cleanField(payload.streetAddress),
    city: cleanField(payload.city),
    state: cleanField(payload.state),
    zip: cleanField(payload.zip),
    concept_type: cleanField(payload.conceptType),
    location_count: cleanField(payload.locationCount),
    snapshot_focus: cleanField(payload.snapshotFocus),
    goals: cleanField(payload.goals),
    competitors_note: cleanField(payload.competitorsNote),
    social_presence_note: cleanField(payload.socialPresenceNote),
    venue_phone: cleanField(payload.venuePhone),
    website_url: cleanField(payload.websiteUrl),
    operating_hours_note: cleanField(payload.operatingHoursNote),
    menu_text: cleanField(payload.menuText ?? ""),
    menu_source_url: cleanField(payload.menuSourceUrl ?? ""),
    message: cleanField(payload.message),
    submission_client_key: submissionClientKey,
  };

  if (payload.gbpUrl) insertRow.gbp_url = cleanField(payload.gbpUrl);
  if (payload.snapshotPriority) insertRow.snapshot_priority = cleanField(payload.snapshotPriority);
  if (payload.recommendedPlan) insertRow.recommended_plan = cleanField(payload.recommendedPlan);
  if (payload.snapshotSummary) {
    try {
      insertRow.snapshot_summary = JSON.parse(payload.snapshotSummary);
    } catch {
      insertRow.snapshot_summary = { raw: payload.snapshotSummary };
    }
  }

  const { error: insertError } = await supabase.from("lead_intake_submissions").insert(insertRow);

  if (insertError) {
    const msg = insertError.message ?? "";
    if (insertError.code === "23505" && isActiveEmailUniqueViolation(insertError)) {
      return {
        attempted: true,
        rowInserted: false,
        insertErrorMessage: null,
        lookupErrorMessage: null,
        blockedDuplicate: true,
        blockedDuplicateCode: "active_email",
        submissionClientKey,
      };
    }
    return {
      attempted: true,
      rowInserted: false,
      insertErrorMessage: msg,
      lookupErrorMessage: null,
      submissionClientKey,
    };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "fetch_lead_intake_id_by_client_key",
    { p_key: submissionClientKey },
  );

  if (rpcError) {
    return {
      attempted: true,
      rowInserted: true,
      insertErrorMessage: null,
      lookupErrorMessage: rpcError.message,
      submissionClientKey,
    };
  }

  const leadIntakeId =
    typeof rpcData === "string" && rpcData.length > 0 ? rpcData : undefined;

  return {
    attempted: true,
    rowInserted: true,
    insertErrorMessage: null,
    lookupErrorMessage: null,
    leadIntakeId,
    submissionClientKey,
  };
}
