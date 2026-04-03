import { createClientIfConfigured } from "@/lib/supabase/client";

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
  operatingHoursNote: string;
  message: string;
};

export type PersistLeadIntakeResult = {
  attempted: boolean;
  /** True when a row was inserted into lead_intake_submissions. */
  rowInserted: boolean;
  /** Set when INSERT fails. */
  insertErrorMessage: string | null;
  /** Set when INSERT succeeded but RPC id lookup failed (e.g. migration 011 not applied). */
  lookupErrorMessage: string | null;
  /** Primary key — copy into FormSubmit email for SQL join. */
  leadIntakeId?: string;
  /** Stored on row; inbox can match this column if id is missing. */
  submissionClientKey?: string;
};

/** When Supabase env is configured, inserts a row for super-admin review. */
export async function persistLeadIntakeToSupabase(
  payload: LeadIntakePayload,
): Promise<PersistLeadIntakeResult> {
  const supabase = createClientIfConfigured();
  if (!supabase) {
    return {
      attempted: false,
      rowInserted: false,
      insertErrorMessage: null,
      lookupErrorMessage: null,
    };
  }

  const submissionClientKey = crypto.randomUUID();

  const { error: insertError } = await supabase.from("lead_intake_submissions").insert({
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
    message: cleanField(payload.message),
    submission_client_key: submissionClientKey,
  });

  if (insertError) {
    return {
      attempted: true,
      rowInserted: false,
      insertErrorMessage: insertError.message,
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
