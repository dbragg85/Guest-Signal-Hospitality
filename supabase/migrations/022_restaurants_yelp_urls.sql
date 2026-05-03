-- Backfill public.restaurants.yelp_url for all portal directory tenants + West Shine.
-- Required for scripts/run-monthly-yelp-pipeline.mjs (filters .not("yelp_url", "is", null)).
--
-- Operator-verified: west-shine (customer URL), boca (Yelp listing). Other paths follow Yelp’s
-- usual /biz/{handle}-{city} pattern for the Cincinnati / NKY portfolio; if Apify returns 0 rows,
-- open the business on Yelp, copy the canonical /biz/… link (no ?query), and update this row or Table Editor.

update public.restaurants r
set yelp_url = m.url
from (
  values
    ('boca', 'https://www.yelp.com/biz/boca-cincinnati-2'),
    ('bourbon-house-pizza-florence', 'https://www.yelp.com/biz/bourbon-house-pizza-florence'),
    ('bridges-nepali-cuisine-northside', 'https://www.yelp.com/biz/bridges-nepali-cuisine-northside-cincinnati'),
    ('mitas', 'https://www.yelp.com/biz/mitas-cincinnati'),
    ('cozys-cafe-and-pub', 'https://www.yelp.com/biz/cozys-cafe-and-pub-newport'),
    ('elis-bbq-riverside', 'https://www.yelp.com/biz/elis-bbq-riverside-cincinnati'),
    ('ghost-kitchen-pizza', 'https://www.yelp.com/biz/ghost-kitchen-pizza-covington'),
    ('herb-and-thelmas-tavern', 'https://www.yelp.com/biz/herb-and-thelmas-tavern-covington'),
    ('knotty-pine-on-the-bayou', 'https://www.yelp.com/biz/knotty-pine-on-the-bayou-fort-thomas'),
    ('libbys-southern-comfort', 'https://www.yelp.com/biz/libbys-southern-comfort-fort-thomas'),
    ('lisse-steakhuis', 'https://www.yelp.com/biz/lisse-steakhuis-newport'),
    ('mazunte-taqueria', 'https://www.yelp.com/biz/mazunte-cincinnati'),
    ('the-bakers-table', 'https://www.yelp.com/biz/the-bakers-table-newport'),
    ('the-park-diner', 'https://www.yelp.com/biz/the-park-diner-northside-cincinnati'),
    ('west-shine-family-restaurant', 'https://www.yelp.com/biz/west-shine-family-restaurant-cincinnati')
) as m(slug, url)
where r.slug = m.slug;
