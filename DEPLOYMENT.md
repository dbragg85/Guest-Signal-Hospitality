# Deployment notes

## Guest Signal Hospitality — GitHub Pages (this repo)

The live site **guestsignalhospitality.com** uses **GitHub Pages** with **Next.js static export** (`npm run build` → `out/`).

1. **Repository → Settings → Pages**  
   - **Build and deployment → Source:** choose **GitHub Actions** (not “Deploy from a branch”).  
   - If Pages was set to publish the **root** or `/docs` folder, the old `index.html` was being served. This repo now deploys only the **`out`** artifact from the workflow.

2. **Workflow:** `.github/workflows/pages.yml` runs on every push to `main` and runs `actions/deploy-pages` with the `out` directory.

3. **Custom domain:** `CNAME` in the repo root should match your domain (e.g. `guestsignalhospitality.com`).

4. **Legacy files:** Old static marketing files were moved to `legacy-static/` so they are not published from the branch root.

5. **Supabase (portal):** Add repository **Variables** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if you want those values baked into the static build; otherwise the portal shows the configuration hint until you add them.

6. **Lead intake → Apify → portal (automation):** After a row is inserted into `lead_intake_submissions` (`processing_status = pending`), GitHub Actions workflow **Process lead intake snapshots** (`.github/workflows/lead-intake-snapshot.yml`) runs on a **schedule** (every **5 minutes** — GitHub’s minimum interval for `schedule`), manually, via **`repository_dispatch`** type `lead_intake_process` with optional `client_payload.lead_id`, from your laptop with **`npm run dispatch:lead-intake`** (see `.env.local.example` → `GITHUB_DISPATCH_TOKEN`), or **within seconds of insert** if you deploy the Edge Function `github-dispatch-lead-intake` and add a **Database Webhook** (see `supabase/README.md` and `npm run test:lead-intake-webhook`). Apply migration `017_lead_intake_pipeline_status.sql` so rows can move through `processing` / `failed`. Configure **Secrets**: `SUPABASE_SERVICE_ROLE_KEY`, `APIFY_TOKEN` (and optionally `LEAD_INTAKE_SUCCESS_WEBHOOK_URL`). **Variables**: `APIFY_GOOGLE_ACTOR_ID` (and optionally `APIFY_YELP_ACTOR_ID` if `LEAD_INTAKE_ENABLE_YELP=1`). **Other variables**: `LEAD_INTAKE_MAX_REVIEWS` (default 50), `SCORING_TIMEZONE` (default `America/New_York`), optional `APIFY_GOOGLE_START_URL` for testing a fixed Maps URL. Supabase Auth invite email is controlled by `LEAD_INTAKE_INVITE_PORTAL_USERS`. After conversion, when portal membership is created, the pipeline waits **`LEAD_INTAKE_WELCOME_EMAIL_DELAY_MS`** (default **5 minutes** in Actions, overridable via repo Variable) then sends a **Resend** welcome email to the submitter (portal URL, dashboard link, optional magic link) using **Secret** `RESEND_API_KEY` and **Variable** `RESEND_FROM` (e.g. `Guest Signal <hello@yourdomain.com>`). Optional **Secret** `LEAD_INTAKE_SUCCESS_WEBHOOK_URL` receives a JSON POST when a lead reaches `converted`.

7. **Sync credentials from your machine (recommended):** Put real values in **`.env.local`** (never commit). Install [GitHub CLI](https://cli.github.com/) and run `gh auth login`. Then from the repo root:
   - `npm run sync:github-vars` — uploads **Variables** (`NEXT_PUBLIC_SUPABASE_*` plus optional `APIFY_GOOGLE_ACTOR_ID`, `LEAD_INTAKE_MAX_REVIEWS`, `SCORING_TIMEZONE`, etc.) using a PAT in `GITHUB_TOKEN` or `GH_TOKEN` with Variables write access.
   - `npm run sync:github-secrets` — uploads **Secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `APIFY_TOKEN`, optional `LEAD_INTAKE_SUCCESS_WEBHOOK_URL`) using `gh secret set` (no PAT needed in env for this command if `gh` is logged in).
   - Push `main` so [Pages](https://github.com/dbragg85/Guest-Signal-Hospitality/actions) and lead-intake workflows use the new configuration.

---

# Deploying Project CARE to projectcare.life

## Option 1: Netlify (Recommended - Easiest)

### Method A: Drag and Drop (Quick Start)
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Drag and drop your entire project folder onto Netlify's dashboard
3. Your site will be live immediately with a temporary URL (e.g., `random-name.netlify.app`)
4. Go to **Site settings** → **Domain management** → **Add custom domain**
5. Enter `projectcare.life`
6. Netlify will give you DNS instructions - add the CNAME or A record to your domain provider
7. Wait for DNS propagation (usually 5-30 minutes)

### Method B: Git Integration (Better for updates)
1. Create a GitHub repository and push your code
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
3. Connect your GitHub account and select the repository
4. Build settings:
   - Build command: (leave empty)
   - Publish directory: `.` (root)
5. Click **Deploy site**
6. Add custom domain `projectcare.life` in domain settings
7. Update DNS records as instructed

## Option 2: Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New Project**
3. Import from Git or drag and drop the folder
4. Configure:
   - Framework Preset: **Other**
   - Root Directory: `.`
5. Click **Deploy**
6. Go to **Settings** → **Domains** → Add `projectcare.life`
7. Update DNS records as instructed

## Option 3: GitHub Pages

1. Create a GitHub repository
2. Push your code to the `main` branch
3. Go to repository **Settings** → **Pages**
4. Source: **Deploy from a branch** → select `main` → `/` (root)
5. Your site will be at `username.github.io/repo-name`
6. To use custom domain:
   - In Pages settings, add `projectcare.life` under Custom domain
   - Create a file named `CNAME` (no extension) with just `projectcare.life` inside
   - Update DNS: Add a CNAME record pointing to `username.github.io`

## DNS Configuration

Once you choose a hosting provider, you'll need to update your DNS at your domain registrar (where you bought `projectcare.life`):

**For Netlify:**
- Add a CNAME record: `@` → `your-site-name.netlify.app`
- OR add A records for root domain (Netlify will provide IP addresses)

**For Vercel:**
- Add a CNAME record: `@` → `cname.vercel-dns.com`

**For GitHub Pages:**
- Add a CNAME record: `@` → `username.github.io`

## SSL/HTTPS

All three services provide free SSL certificates automatically once DNS is configured. It may take a few minutes to activate.

## Notes

- The `netlify.toml` file is already configured for Netlify
- Make sure `Project CARE.png` is in the same directory as `index.html`
- Test the site after deployment to ensure all images load correctly

