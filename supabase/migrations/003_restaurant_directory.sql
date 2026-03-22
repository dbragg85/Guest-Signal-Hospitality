-- Business profile + curated competitor set (maintained in Table Editor or reporting pipeline).
-- Automated Google Places discovery requires a backend + API; this stores vetted rows for the portal.

alter table public.restaurants
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists logo_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists google_rating numeric(2,1),
  add column if not exists price_level int;

-- price_level uses Google’s 0–4 scale when present (optional; validated in app).

-- Curated peers (typically top 5 within ~20 mi, similar price + ratings). JSON array:
-- [{"name":"","address":"","google_rating":4.3,"price_level":2,"distance_miles":4.1}, ...]
alter table public.restaurants
  add column if not exists competitors jsonb not null default '[]'::jsonb;
