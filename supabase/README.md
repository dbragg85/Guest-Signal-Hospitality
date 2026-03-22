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
