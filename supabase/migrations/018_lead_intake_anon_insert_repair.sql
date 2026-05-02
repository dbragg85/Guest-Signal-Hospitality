-- Repair drift where `lead_intake_anon_insert` is missing, targets the wrong role, or anon lacks INSERT.
-- Symptom: POST /rest/v1/lead_intake_submissions with the anon JWT returns 401 + 42501 RLS violation.

drop policy if exists "lead_intake_anon_insert" on public.lead_intake_submissions;

create policy "lead_intake_anon_insert"
  on public.lead_intake_submissions for insert
  to anon
  with check (
    length(trim(name)) >= 1
    and length(trim(email)) >= 3
    and position('@' in trim(email)) > 1
    and length(trim(business)) >= 1
    and length(trim(inquiry_plan)) >= 1
  );

grant insert on table public.lead_intake_submissions to anon;
