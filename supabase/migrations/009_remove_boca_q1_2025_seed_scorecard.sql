-- Remove erroneous demo scorecard row for Boca (requested via GUEA-5).
-- Numbered 009 so it runs after 008_restaurant_price_level_label.sql.
delete from public.scorecards s
using public.restaurants r
where s.restaurant_id = r.id
  and r.slug = 'boca'
  and trim(s.period) ilike 'q1 2025';
