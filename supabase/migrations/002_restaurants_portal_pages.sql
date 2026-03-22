-- Optional intro copy shown on /portal/dashboard/[slug]/ (edit per restaurant in Table Editor or SQL).
alter table public.restaurants
  add column if not exists portal_intro text;

insert into public.restaurants (slug, name)
values
  ('bourbon-house-pizza-florence', 'Bourbon House Pizza (Florence)'),
  ('bridges-nepali-cuisine-northside', 'Bridges Nepali Cuisine (Northside)'),
  ('mitas', 'Mita''s'),
  ('cozys-cafe-and-pub', 'Cozy''s Cafe and Pub'),
  ('elis-bbq-riverside', 'Eli''s BBQ (Riverside)'),
  ('ghost-kitchen-pizza', 'Ghost Kitchen Pizza'),
  ('herb-and-thelmas-tavern', 'Herb & Thelma''s Tavern'),
  ('knotty-pine-on-the-bayou', 'Knotty Pine on the Bayou'),
  ('libbys-southern-comfort', 'Libby''s Southern Comfort'),
  ('lisse-steakhuis', 'Lisse Steakhuis'),
  ('mazunte-taqueria', 'Mazunte Taqueria'),
  ('the-bakers-table', 'The Baker''s Table'),
  ('the-park-diner', 'The Park Diner')
on conflict (slug) do update
  set name = excluded.name;

-- Boca was seeded in 001; ensure display name is current if you edit here.
insert into public.restaurants (slug, name)
values ('boca', 'Boca')
on conflict (slug) do update
  set name = excluded.name;
