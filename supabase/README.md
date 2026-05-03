# Supabase + portal — step-by-step

**I can’t log into Supabase or Vercel for you** (those are your accounts). Follow the checklist below. Locally, run `npm run setup:env` once (creates `.env.local`), then paste your keys.

---

## A. Supabase project (5 min)

1. Go to [supabase.com](https://supabase.com) → **New project** → wait until healthy.
2. **Project Settings → API**, copy:
   - **Project URL**
   - **`anon` `public`** key (not the service role key)
3. In the repo root (this machine):

   ```bash
   npm run setup:env
   ```

   Open `.env.local` and replace the placeholders with the URL and anon key.

4. Verify:

   ```bash
   npm run check:env
   ```

   Should print: `Environment looks configured for local dev.`

---

## B. Database tables (SQL)

1. Supabase → **SQL Editor** → **New query**.
2. Open `migrations/001_portal_multitenant.sql` from this repo, copy **all** SQL, paste, **Run**.
3. If the **trigger on `auth.users`** errors, delete only the `trigger` / `handle_new_user` block and run the rest. You can add profiles manually later (Table Editor → `profiles`).
4. **Optional — full restaurant list + per-location notes:** open `migrations/002_restaurants_portal_pages.sql`, copy **all** SQL, paste, **Run**. This adds a `portal_intro` column (editable per restaurant) and inserts the remaining venues. After it runs, you can set **Notes for this location** in **Table Editor → restaurants → portal_intro** for each row.
5. **Portal profile + competitors:** open `migrations/003_restaurant_directory.sql`, copy **all** SQL, paste, **Run**. This adds address, phone, website, logo URL, ratings, price tier, and a `competitors` JSON array. Fill rows in **Table Editor** (or SQL). Competitors are **curated** in the database; automated Google Places search requires a separate API-backed service.
6. **Vetted ratings source + null-safe backfill:** run `migrations/004_profile_sources_backfill.sql`, then seed `public.restaurant_profile_sources` from one of:
   - `supabase/seeds/004_restaurant_profile_sources.template.sql` (manual curation path), or
   - `npm run build:profile-seed > supabase/seeds/004_restaurant_profile_sources.generated.sql` (Google Places API path; requires `GOOGLE_PLACES_API_KEY`).
   After seeding, re-run the `UPDATE` block from `004_profile_sources_backfill.sql` to apply values into `public.restaurants`.
7. **Yelp source pipeline support:** open `migrations/006_yelp_source_pipeline_support.sql`, copy **all** SQL, paste, **Run**. This adds:
   - `restaurants.yelp_url` for per-location Yelp source URLs
   - source counters (`google_reviews_analyzed`, `yelp_reviews_analyzed`) on `snapshots`
   - mention counts on `snapshot_category_scores`
   - `review_observations` table for raw review records  
   Then run **`migrations/015_review_observations_rls.sql`** so Security Advisor stops flagging RLS on that table (does **not** affect lead intake; service_role jobs still bypass RLS).
8. **Website lead intake (`lead_intake_submissions`):** the contact / plan forms **insert into this table**; Supabase does **not** create it automatically. In **SQL Editor**, run these **in order** (copy each file entirely from the repo):
   - `migrations/010_lead_intake_submissions.sql` — table + RLS (anon insert)
   - `migrations/011_lead_intake_submission_client_key.sql`
   - `migrations/012_restaurants_intake_inquiry_plan.sql`
   - `migrations/013_lead_intake_social_presence.sql`
   - `migrations/014_lead_intake_snapshot_context.sql` — optional venue phone, website, and hours for faster snapshot matching  
   - `migrations/016_lead_intake_policies_idempotent.sql` — **only if** SQL Editor errors with **`42710` policy already exists** on `lead_intake_*` (usually from running `010`’s policy block twice or pasting `010` into `011`). Run `016`, then run **`011`** (and onward) using the **unmerged** files from GitHub.
   - `migrations/025_lead_intake_submission_duplicate_check.sql` — blocks duplicate form submits while the same email or the same name+business+city+state+ZIP is still **pending** or **processing** (`check_lead_intake_submission_blocked` RPC for anon).
   - `migrations/026_lead_intake_active_email_guard.sql` — partial unique index on normalized email for in-flight rows + extends the RPC to block the same email within **72 hours** of a **converted** intake (stops silent second rows after Ivory-style runs).

   **`010` vs `011`:** keep **both**. `010` creates the table and RLS; **`011` adds `submission_client_key` plus the RPC `fetch_lead_intake_id_by_client_key`** so the browser can learn the new row’s `id` after an anon **INSERT** (anon still cannot `SELECT` the table). The website **`persistLeadIntakeToSupabase`** calls that RPC — **do not delete `011` from the repo or omit it in SQL Editor**. Replacing `010` with one giant script is only a greenfield convenience; on an existing project, run **`011` after `010`** and never drop the column or function.

   After that, **Table Editor** should list **`lead_intake_submissions`**. If you use the Supabase CLI against this repo, `supabase db push` applies the same migration set.

#### Lead intake → snapshot (step-by-step, plain English)

1. **Finish the database setup above** (migrations through `014` in this Supabase project).
2. **Point the public website at this same project.** In hosting (e.g. Vercel), set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Project Settings → API** for this project.
3. **Submit a test using a plan link** — not the short contact page. Example: `https://your-domain.com/services/inquiry/?plan=free_snapshot` (or a paid plan key from the Plans page). Plain `/contact` saves `inquiry_plan=general` and the snapshot **GitHub Action will skip it**.
4. **Check Supabase.** Open **Table Editor → `lead_intake_submissions`**. You should see a new row: `inquiry_plan` = `free_snapshot` (or your plan key), `processing_status` = `pending`. An empty table or `general` means the form is not hitting this project or the wrong URL was used.
5. **Point GitHub Actions at the same project.** Repo **Settings → Secrets and variables → Actions**: set **`SUPABASE_SERVICE_ROLE_KEY`** (the **service_role** JWT — never put this in the website). Set **`SUPABASE_URL`** *or* reuse the repository **Variable** `NEXT_PUBLIC_SUPABASE_URL` — it must be the **same** Supabase URL as in step 2. Optional: **`RESEND_API_KEY`** (Secret) and **`RESEND_FROM`** (Variable, e.g. `Guest Signal <hello@yourdomain.com>`) so each converted lead with portal access gets a **Resend** email with sign-in and dashboard links (see `DEPLOYMENT.md`).
6. **Run the workflow.** **Actions → Process lead intake snapshots → Run workflow.** If the log says nothing to process, scroll to **Diagnostics** (counts + last few rows) and fix whatever it shows (wrong plan, already converted, or wrong GitHub project).

#### Run the snapshot workflow right after a test (easiest — no Supabase webhook)

The GitHub job also runs on a **5-minute schedule** (GitHub’s maximum frequency for `schedule`). For **~1 minute or faster** after insert, fix the **Database Webhook → Edge Function** path (see below); do not rely on cron alone. To start it **immediately** from your computer:

1. In GitHub: **[Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)** → create a token that can call **`repository_dispatch`** on this repo  
   - **Classic:** enable **`repo`**  
   - **Fine-grained:** grant **Contents: Read and write** on **`dbragg85/Guest-Signal-Hospitality`**
2. In **`.env.local`** (never commit), add one line:

   `GITHUB_DISPATCH_TOKEN=`_paste the token here_

   (Optional: `GITHUB_DISPATCH_REPOSITORY=your-username/your-fork` if you are not using the default repo.)

3. In the repo folder on your machine:

   ```bash
   npm run dispatch:lead-intake
   ```

   That tells GitHub to run **Process lead intake snapshots** once; it will pick up **all** pending service-tier rows. To target only the **newest** pending row (same as typing its UUID in “Run workflow”):

   ```bash
   npm run dispatch:lead-intake -- --latest
   ```

   `--latest` needs **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** already in `.env.local` (same values you use for the pipeline).

4. Open **GitHub → Actions → Process lead intake snapshots** and confirm a new run appears.

If you do not set `GITHUB_DISPATCH_TOKEN`, the script tries **`gh auth token`** after **`gh auth login`** — that only works if your GitHub CLI token has access to dispatch on this repository.

#### Fully automatic (advanced — insert → run within seconds)

Use the Edge Function **`github-dispatch-lead-intake`** plus a **Database Webhook** on `INSERT` into `lead_intake_submissions`, as documented in the repo under `supabase/functions/github-dispatch-lead-intake/index.ts` and **`DEPLOYMENT.md`**. That path keeps the PAT in **Supabase Edge secrets**, not in your laptop `.env.local`.

**If the row appears in Table Editor but GitHub never runs `lead_intake_process`:**

1. **Supabase → Edge Functions → `github-dispatch-lead-intake` → Logs** — look for `[github-dispatch-lead-intake]` lines (unauthorized = wrong `x-lead-intake-dispatch-secret`; `function_not_configured` = missing `GITHUB_DISPATCH_TOKEN` or `LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET` in Edge secrets).
2. **Database → Webhooks** — open your `lead_intake_submissions` INSERT webhook → **Recent deliveries** (4xx/5xx = URL, headers, or function crash). Webhook URL must be `https://<project-ref>.supabase.co/functions/v1/github-dispatch-lead-intake` with header **`x-lead-intake-dispatch-secret`** exactly matching Edge secret **`LEAD_INTAKE_DISPATCH_WEBHOOK_SECRET`**.
3. From the repo (same `.env.local` as the pipeline), run **`npm run test:lead-intake-webhook`** — POSTs a synthetic webhook body to the function; on success you should see a new **Process lead intake snapshots** run with `lead_intake_process`.
4. Redeploy the function after code changes: **`supabase functions deploy github-dispatch-lead-intake`** (CLI linked to the project).

---

## C. Auth URLs

**Authentication → URL configuration**

| Setting | Value |
|--------|--------|
| **Site URL** | `http://localhost:3000` for dev; your production URL when live |
| **Redirect URLs** | Add `http://localhost:3000/portal/welcome/`, `http://localhost:3000/portal/dashboard/`, and production `https://YOUR_DOMAIN/portal/welcome/` plus `https://YOUR_DOMAIN/portal/dashboard/` (invite links land on **welcome** first) |

---

## D. Users & permissions

### 1) Boca (or any restaurant-only user)

**Authentication → Users → Add user** → e.g. `admin@bocacincinnati.com` + password (or invite email).

Then **SQL Editor**:

```sql
insert into public.memberships (user_id, restaurant_id, role)
select u.id, r.id, 'admin'
from auth.users u
cross join public.restaurants r
where u.email = 'admin@bocacincinnati.com'
  and r.slug = 'boca'
on conflict do nothing;
```

### 2) Your main account (see **every** restaurant scorecard)

After that user exists and has signed in once (so `profiles` has a row), run:

```sql
update public.profiles
set is_super_admin = true
where email = 'YOUR_EMAIL@example.com';
```

Super admins do **not** need a membership row for each restaurant.

---

## E. Run the app locally

```bash
npm install
npm run check:env
npm run dev
```

Open [http://localhost:3000/portal/](http://localhost:3000/portal/) → sign in → [http://localhost:3000/portal/dashboard/](http://localhost:3000/portal/dashboard/).

---

## F. GitHub Pages (this repo)

The marketing site deploys as a **static export**. Server **middleware is not used** on Pages; Supabase **RLS** still protects data. Sign-in and redirects run in the browser.

Optional: set **Actions variables** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the repo so the exported JS includes your project (see `DEPLOYMENT.md`).

## G. Production (Vercel — optional)

1. [vercel.com](https://vercel.com) → **Add New** → Import this GitHub repo.
2. **Environment Variables** → add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as `.env.local`).
3. Supabase **URL configuration** → add your Vercel URL to **Site URL** and **Redirect URLs** (`https://…/portal/dashboard/`).
4. Deploy if you prefer Vercel over GitHub Pages for the main site (either host is fine for Next + Supabase client).

---

## H. Monthly Yelp ingestion pipeline

The repo now includes a monthly runner:

```bash
npm run pipeline:yelp:monthly
```

Required env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APIFY_TOKEN`
- `APIFY_YELP_ACTOR_ID`

Optional env vars:

- `PERIOD_START` and `PERIOD_END` (`YYYY-MM-DD`) and/or `PERIOD_LABEL` (`Mar 2026`)
- `RESTAURANT_SLUGS` (comma-separated subset)
- `YELP_MAX_ITEMS` (default `10`) — `maxItems` for [agents/yelp-reviews](https://apify.com/agents/yelp-reviews), `maxReviewsPerUrl` for [tri_angle/yelp-review-scraper](https://apify.com/tri_angle/yelp-review-scraper); Apify run query `maxItems` when `APIFY_YELP_RUN_MAX_ITEMS_QUERY` is on (default)
- `YELP_SORT_BY` (default `newest`) — agents actor only; tri_angle uses its own sort when using custom template
- `YELP_INPUT_STYLE` — `auto` (default), `agents`, or `tri_angle` to force input shape (`auto` maps actor `c7MfRDqfYvZWOtMrJ` / `agents~yelp-reviews` to agents format)
- `APIFY_YELP_INPUT_TEMPLATE_JSON` (JSON template with `{{YELP_URL}}`, `{{PERIOD_START}}`, `{{PERIOD_END}}`, `{{MAX_ITEMS}}`, `{{SORT_BY}}`)
- `DRY_RUN=1` for a no-write preview
- `APIFY_MOCK_DATASET_FILE` (path to local JSON fixture) or `APIFY_MOCK_DATASET_JSON` (inline JSON string) to bypass live Apify calls for non-live validation

Behavior:

- pulls Yelp reviews from Apify per restaurant `yelp_url`
- filters reviews to the target month window
- stores raw reviews in `review_observations`
- recomputes category scores using mention-weighting (prevents missing-category zeros from diluting scores)
- updates `snapshots`, `snapshot_category_scores`, and `scorecards.data` with:
  - overall Guest Signal score
  - 5 pillar scores
  - source coverage (`google_reviews_analyzed`, `yelp_reviews_analyzed`, `total_reviews_analyzed`)

Mock validation examples (no live actor/quota needed):

```bash
# Dry-run using local mock Yelp payload
DRY_RUN=1 \
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
PERIOD_LABEL="Mar 2026" \
PERIOD_START="2026-03-01" \
PERIOD_END="2026-03-31" \
APIFY_MOCK_DATASET_FILE="scripts/fixtures/yelp-mock-reviews.json" \
npm run pipeline:yelp:monthly

# Write-run using the same mock payload
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
PERIOD_LABEL="Mar 2026" \
PERIOD_START="2026-03-01" \
PERIOD_END="2026-03-31" \
APIFY_MOCK_DATASET_FILE="scripts/fixtures/yelp-mock-reviews.json" \
npm run pipeline:yelp:monthly
```

---

## Guest Signal Score™ — Google (`review_observations`)

Runs the **Google-only** monthly methodology from the board prompt (sentiment scale, category ratios, ÷0.9 normalization, trend modifier vs prior month).

```bash
npm run pipeline:google:gss
```

**Prerequisite:** rows in `public.review_observations` with `source = 'google'` for each restaurant in the window (your own Google review ingest).

**Required env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Optional:** `PERIOD_START`, `PERIOD_END` (`YYYY-MM-DD`), `PERIOD_LABEL` (e.g. `Mar 2026`), `RESTAURANT_SLUGS`, `DRY_RUN=1`

Writes `snapshots`, `snapshot_category_scores` (food/service/cleanliness/speed/atmosphere), and `scorecards` with `gss_google_base`, trend fields, and final published score.

## I. Ratings Source-Of-Truth + QA checklist

### Approved source-of-truth

- Table: `public.restaurant_profile_sources`
- Primary key for mapping: `restaurant_slug` (must match `public.restaurants.slug`)
- Required provenance fields: `source_kind`, `source_ref`, `captured_at`
- Optional audit note: `notes`

### Retrieval methods

1. **Google Places API (preferred, reproducible):**
   - Set `GOOGLE_PLACES_API_KEY`.
   - Run:
     ```bash
     npm run build:profile-seed > supabase/seeds/004_restaurant_profile_sources.generated.sql
     ```
   - Run the generated SQL in Supabase SQL Editor.
2. **Manual curation fallback:**
   - Edit `supabase/seeds/004_restaurant_profile_sources.template.sql`.
   - Replace `pending_*` fields with vetted values and source links.
   - Run the file in SQL Editor.

### QA validation checklist (after backfill)

1. Row count check:
   ```sql
   select count(*) from public.restaurant_profile_sources;
   ```
2. Coverage check for mapped slugs:
   ```sql
   select restaurant_slug, google_rating, price_level
   from public.restaurant_profile_sources
   order by restaurant_slug;
   ```
3. Null-safe behavior check (existing restaurant values not overwritten):
   ```sql
   select slug, google_rating, price_level, profile_source_kind, profile_source_ref, profile_source_captured_at
   from public.restaurants
   order by slug;
   ```
4. Constraint check:
   - `google_rating` values are `0.0` to `5.0`.
   - `price_level` values are `0` to `4`.
5. Portal UI spot-check:
   - Open `/portal/dashboard/[slug]` for at least 3 restaurants.
   - Verify `Google rating` and `Price tier` render.
   - Verify blank/unmapped values still render as `—` and do not break layout.
