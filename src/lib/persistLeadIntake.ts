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
  message: string;
};

/** When Supabase env is configured, inserts a row for super-admin review. */
export async function persistLeadIntakeToSupabase(
  payload: LeadIntakePayload,
): Promise<{ attempted: boolean; errorMessage: string | null }> {
  const supabase = createClientIfConfigured();
  if (!supabase) {
    return { attempted: false, errorMessage: null };
  }

  const { error } = await supabase.from("lead_intake_submissions").insert({
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
    message: cleanField(payload.message),
  });

  if (error) {
    return { attempted: true, errorMessage: error.message };
  }
  return { attempted: true, errorMessage: null };
}
