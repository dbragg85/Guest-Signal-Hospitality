# Supabase setup (client portal)

## 1. Create a project

Create a project at [supabase.com](https://supabase.com). In **Project Settings → API**, copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add them to `.env.local` in the Next.js app root (see `.env.local.example`).

## 2. Run the SQL migration

Open **SQL Editor** in Supabase, paste the contents of `migrations/001_portal_multitenant.sql`, and run it.

If the `auth.users` trigger fails (permissions vary), skip that block and create profile rows manually when users first sign up, or add profiles from the Table Editor.

## 3. Auth settings

In **Authentication → URL configuration**:

- **Site URL**: your production site (e.g. `https://your-domain.com`)
- **Redirect URLs**: add `https://your-domain.com/portal/dashboard/` and `http://localhost:3000/portal/dashboard/` for local dev

Enable **Email** provider. Optionally disable public sign-ups and invite users from the dashboard.

## 4. Create users and access

1. **Authentication → Users → Add user**  
   - e.g. `admin@bocacincinnati.com` with a password, or send a magic link.

2. **Super admin (your main account — can see every restaurant’s scorecard)**  
   In SQL Editor:

   ```sql
   update public.profiles
   set is_super_admin = true
   where email = 'you@yourcompany.com';
   ```

3. **Restaurant-only users (Boca example)**  
   After the user exists in `auth.users`, link them to Boca:

   ```sql
   insert into public.memberships (user_id, restaurant_id, role)
   select u.id, r.id, 'admin'
   from auth.users u
   cross join public.restaurants r
   where u.email = 'admin@bocacincinnati.com'
     and r.slug = 'boca'
   on conflict do nothing;
   ```

Super admins do not need a membership row to read all restaurants and scorecards (RLS allows it). Restaurant users only see rows for restaurants they belong to.

## 5. Deploy the Next.js app

This app is **not** a static GitHub Pages export anymore: deploy to **Vercel** (or another Node host), set the same env vars, and connect your Git repo.
