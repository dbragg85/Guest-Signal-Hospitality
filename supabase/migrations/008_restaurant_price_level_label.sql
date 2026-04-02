-- Optional human-readable price tier for portal (e.g. "Moderate", "$$", "Upscale").
-- When set, the app shows this instead of mapping the numeric price_level alone.
alter table public.restaurants
  add column if not exists price_level_label text;
