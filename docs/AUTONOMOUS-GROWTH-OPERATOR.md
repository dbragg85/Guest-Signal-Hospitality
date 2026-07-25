# Autonomous growth operator

The production design intentionally separates deterministic automation from the LLM:

- GitHub Actions sends the daily report and runs weekly public-business research.
- Supabase stores pseudonymous funnel events, commercial stages, run history, and approval-required outreach drafts.
- Codex runs only on a private machine or VPS. This repository is public, so do not attach a self-hosted GitHub Actions runner containing ChatGPT-managed Codex credentials.

## AI-powered prospect outreach

The prospect research pipeline now supports AI-generated personalized outreach emails that:

1. **Scrape website metadata** — Extracts business history, founding year, ownership type, awards, food philosophy, and key people from the prospect's website (about page, story page, etc.)

2. **Reference business context** — Uses the scraped context to write emails that acknowledge specific details about the business, not generic templates

3. **Senior VP of Marketing voice** — AI assumes an executive marketing perspective that's confident, specific, and respectful of operators' time

### Configuration

Add to GitHub Secrets:

- `OPENAI_API_KEY` — Your OpenAI API key for GPT-4o (or configure `OPENAI_MODEL` for alternatives)

Optional environment variables:

- `OPENAI_MODEL` — Model to use (default: `gpt-4o`, options: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`)
- `SKIP_AI_ENHANCEMENT` — Set to `1` to disable AI and use template-based copy
- `AI_CONCURRENCY` — Max concurrent AI requests (default: 3)

### How it works

1. **Research phase** — Apify scrapes Google Places data (rating, reviews, category)
2. **Context scraping** — For each prospect with a website, scrapes up to 4 pages to extract business context
3. **AI generation** — GPT-4o generates personalized subject line and email body using the context
4. **Fallback** — If AI fails or isn't configured, falls back to the proven template-based copy

### Rewriting existing drafts

To rewrite unsent prospect drafts with AI-personalized copy:

```bash
npm run growth:rewrite-outreach
# or dry run first:
DRY_RUN=1 npm run growth:rewrite-outreach
```

## Required GitHub configuration

Encrypted secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `APIFY_TOKEN`
- `RESEND_API_KEY`

Repository variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_FROM`
- `OWNER_REPORT_EMAIL_TO`
- `PROSPECT_SEARCH_QUERY`
- `PROSPECT_MAX_RESULTS`
- `PROSPECT_MIN_FIT_SCORE`

Never store API keys in repository variables.

## Scheduled jobs

- `.github/workflows/daily-owner-report.yml`: daily funnel, revenue, operations, and approval report.
- `.github/workflows/prospect-research.yml`: weekly Cincinnati restaurant research. It creates drafts with `approval_required`; it never sends outreach.
- `.github/workflows/lead-intake-snapshot.yml`: immediate webhook/repository dispatch plus an hourly fallback.
- `.github/workflows/growth-goal-eval.yml`: every 12 hours, evaluate the active 3 paid conversions / 7 days goal. If unattainable, propose interventions and ask for Approve/Deny on ntfy.

## Stripe checkout

Paid plan buttons call Supabase Edge Function `create-checkout-session`. Stripe webhook `stripe-webhook` marks `sales_opportunities.stage = won` on `checkout.session.completed`.

Required Supabase secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- optional `STRIPE_PRICE_SIGNAL_MONITOR`, `STRIPE_PRICE_SIGNAL_GROWTH`, `STRIPE_PRICE_SIGNAL_ELEVATE`
- optional `STRIPE_INTRO_COUPON_ID`

Webhook endpoint:

`https://sqsleiwtacqiweyfacmj.supabase.co/functions/v1/stripe-webhook`

## Private Codex runner

Install Codex and GitHub CLI, authenticate each under the dedicated runner account, and keep the repository checkout private to that account.

The runner command is:

```bash
OPERATOR_ENV_FILE=/secure/path/guest-signal.env ./scripts/run-codex-operator-local.sh
```

Schedule it before the owner report. On macOS use `launchd`; on Linux use a systemd timer. The environment file needs only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Codex receives a sanitized JSON metrics file. The child process does not inherit token-, secret-, password-, Supabase-, Resend-, Apify-, API-key-, or auth-named environment variables.

## Guardrails

The operator:

- requires a clean dedicated checkout;
- can change only `src/` and `public/`;
- can change at most 8 files and 500 lines;
- must pass the production build;
- can open at most one reviewable pull request per run;
- cannot deploy, merge, send outreach, change prices, create migrations, or spend money.

Outreach remains an approval queue until a human changes prospect status. Only `sales_opportunities.stage = 'won'` is counted as revenue.

## Approved outreach delivery

An approved draft is scheduled for the next Tuesday, Wednesday, or Thursday at
9:45 AM Eastern. This avoids overnight delivery and restaurant lunch/dinner
service. Resend accepts the schedule; its signed webhook updates delivery,
bounce, complaint, open, and click status in the portal.

Required Supabase Edge Function secrets:

- `RESEND_API_KEY`
- `RESEND_FROM`
- `OUTREACH_POSTAL_ADDRESS`
- `OUTREACH_REPLY_TO`
- `RESEND_WEBHOOK_SECRET`

Create a Resend webhook for `email.sent`, `email.delivered`, `email.opened`,
`email.clicked`, `email.bounced`, and `email.complained`, targeting:

`https://sqsleiwtacqiweyfacmj.supabase.co/functions/v1/resend-engagement-webhook`

Enable open and click tracking in Resend only after the sending domain and a
branded tracking domain are verified. Open counts are approximate because
privacy proxies and image caching can create or suppress events. Email clients
do not expose reliable reading duration, so the portal reports first/latest
open and click timestamps instead.
