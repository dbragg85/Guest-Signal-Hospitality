-- Yelp Apify + monthly pipeline require public.restaurants.yelp_url (not just a bookmarked URL).
-- Canonical biz URL (no query string) for West Shine Family Restaurant.

update public.restaurants
set yelp_url = 'https://www.yelp.com/biz/west-shine-family-restaurant-cincinnati'
where slug = 'west-shine-family-restaurant';
