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
8. **Website lead intake (`lead_intake_submissions`):** the contact / plan forms **insert into this table**; Supabase does **not** create it automatically. In **SQL Editor**, run these **in order** (copy each file entirely from the repo):
   - `migrations/010_lead_intake_submissions.sql` — table + RLS (anon insert)
   - `migrations/011_lead_intake_submission_client_key.sql`
   - `migrations/012_restaurants_intake_inquiry_plan.sql`
   - `migrations/013_lead_intake_social_presence.sql`  
   After that, **Table Editor** should list **`lead_intake_submissions`**. If you use the Supabase CLI against this repo, `supabase db push` applies the same migration set.

---

## C. Auth URLs

**Authentication → URL configuration**

| Setting | Value |
|--------|--------|
| **Site URL** | `http://localhost:3000` for dev; your production URL when live |
| **Redirect URLs** | Add `http://localhost:3000/portal/dashboard/` and your production `https://YOUR_DOMAIN/portal/dashboard/` |

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
- `MAX_REVIEWS_PER_LOCATION` (default `250`)
- `APIFY_YELP_INPUT_TEMPLATE_JSON` (JSON template with `{{YELP_URL}}` placeholder)
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
