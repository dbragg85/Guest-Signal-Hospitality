-- Backfill canonical restaurant websites and deterministic logo URLs.
-- Intentionally leaves google_rating + price_level unchanged (null) until a vetted source is approved.

with website_map(slug, website) as (
  values
    ('boca', 'https://www.bocacincinnati.com'),
    ('bourbon-house-pizza-florence', 'https://www.bourbonhousepizza.com'),
    ('bridges-nepali-cuisine-northside', 'https://www.bridgesnepalicuisine.com'),
    ('mitas', 'https://www.mitas.co'),
    ('cozys-cafe-and-pub', 'https://cozyscafeandpub.com'),
    ('elis-bbq-riverside', 'https://www.elisbarbeque.com'),
    ('ghost-kitchen-pizza', 'https://ghostkitchenpizzas.com'),
    ('herb-and-thelmas-tavern', 'https://herbandthelmas.com'),
    ('knotty-pine-on-the-bayou', 'https://theknottypineonthebayou.com'),
    ('libbys-southern-comfort', 'https://www.libbyssoutherncomfort.com'),
    ('lisse-steakhuis', 'https://www.lisse.restaurant'),
    ('mazunte-taqueria', 'https://mazuntetaqueria.com'),
    ('the-bakers-table', 'https://www.bakerstablenewport.com'),
    ('the-park-diner', 'https://theparkdiner-northside.com')
)
update public.restaurants r
set
  website = m.website,
  logo_url = coalesce(
    nullif(trim(r.logo_url), ''),
    'https://logo.clearbit.com/' ||
      split_part(regexp_replace(lower(m.website), '^https?://', ''), '/', 1)
  )
from website_map m
where r.slug = m.slug;

