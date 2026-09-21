# Guest Signal device API v0.4

A standalone, read-only Render service for the internal ESP32 dashboard. It does not change the public website, database schema, existing workflows or emails. No third-party Node dependencies. Use Node 22.

## Deploy

Create a Render **Web Service** linked to this repository and the branch containing these files:

- Name: `guest-signal-device-api` (Render assigns the final unique URL)
- Root directory: `services/device-api`
- Runtime: Node
- Build: `npm ci && npm test`
- Start: `npm start`
- Health check: `/healthz`
- Plan: Free for initial validation (may sleep after inactivity; not an always-on guarantee)
- Auto deploy: Off initially

Alternatively create a Blueprint using `render-device.yaml` at repository root. The explicit free plan avoids implicitly selecting paid compute. A paid always-on plan can be selected separately after reviewing its price.

Set these environment variables directly in Render:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Existing project's `https://PROJECT.supabase.co` URL |
| `SUPABASE_SECRET_KEY` | Server secret key from that Supabase project; existing legacy service-role key also supported |
| `DEVICE_TOKEN_SHA256` | SHA-256 hash generated below |
| `NODE_VERSION` | `22.16.0` |

Generate a device token locally with `node create-device-token.mjs`. It saves `.device-credentials.json` with owner-only permissions and refuses to overwrite an existing file. Put **only the hash** in Render. Enter the original `device_token` into the ESP32 setup page. Never put the Supabase secret on the device. Each service currently supports one token; replacing its hash revokes the previous token and requires reprovisioning the board.

The Supabase key stays in Render environment variables; never commit it. Its elevated database privileges are restricted by this service's fixed read-only queries, authentication and small response projection. The code has no write route and accepts no user-controlled query/table parameters.

Once deployment succeeds, `/healthz` returns `{"status":"ok"}`. This proves process availability, **not database connectivity**. Authenticated `/v1/device/dashboard` returns 200 only if at least one source is readable; total source failure returns 503. Partial data is explicitly marked.

## Data definitions and limits

- Tracked restaurants: exact count of `restaurants` records, not total restaurants in Cincinnati or paying customers. This table may contain curated directory entries.
- Reviews / 30 days: stored observations with `review_date >= UTC date 30 days ago`; source dates are shown on recent reviews. No claim of exhaustive review coverage.
- New leads / 7 days and open opportunities: `sales_opportunities`, excluding `is_test=true`. Open stages: new, qualified, meeting, proposal, nurture.
- Recent reviews: latest three stored observations, name, rating, publication date and short excerpt. No reviewer identity or raw JSON returned.
- Pipeline: latest three `automation_runs`, kind/status/start timestamp. No logs, error bodies, or secrets returned.
- Recorded active/churn MRR, failures, refunds: existing `retained_revenue_metrics` view. These reflect values recorded by existing pipelines, **not a fresh Stripe reconciliation**. Confirm the view is populated accurately before treating it as accounting truth.
- Inspections/citywide coverage: explicitly unavailable. No synthetic measurements.
- The previous competitor-activity demo is replaced by actual pipeline status. Motivation becomes recorded growth metrics. Artwork remains on home, city, and system pages.
- `generated_at` is the API's database-check time, not proof that upstream collectors have run recently. Dates on individual records reveal their age.

Schema is based on repository commit `a3a69dac06b4ee08a68a3449e9e7f424e7f789a7`, including migrations 001, 006, 031 and 038. Live migration state and data have not yet been verified. Missing tables, columns or denied reads produce `--`/unavailable, never fake zero. This service does not apply migrations automatically.

Responses are cached for 30 seconds. Authenticated requests are limited to 12 per minute per process/token; firmware polls every 60 seconds with backoff. This is one instance/device initially, not a distributed rate limiter. No tokens or sensitive upstream error bodies are logged. Tokens travel only in Authorization headers over HTTPS. CORS is not enabled.

## Tests

`npm test` checks auth, HTTP method restrictions, cache, throttling, total source outage, exact-count handling, exclusion of test opportunities, text/response bounds, and configuration rejection. Tests use fixtures, not production Supabase. Run locally before deployment; the Render build also runs them.

After deployment, run `node verify-service.mjs https://YOUR-SERVICE.onrender.com` from the folder containing your private credential file. It checks the authenticated API without printing tokens or business records. A partial response needs source-by-source review before calling every metric connected.
