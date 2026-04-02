-- Optional extra label column (not required by the portal).
-- The portal reads `restaurants.price_level` as int 0–4 or as text (e.g. $$); use this only if you want a separate display string.
alter table public.restaurants
  add column if not exists price_level_label text;
