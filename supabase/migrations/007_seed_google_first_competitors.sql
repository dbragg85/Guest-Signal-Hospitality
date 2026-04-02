-- Seed approved Google-first competitor matrix from GUE-35.
-- Yelp fields stay deferred per GUE-39; this migration populates only Google-backed fields.

with competitor_seed(slug, competitors) as (
  values
    (
      'boca',
      jsonb_build_array(
        jsonb_build_object('name', 'Chef Jose Salazar • Mita''s Restaurant', 'cuisine_style', 'Tapas restaurant', 'price_level', 2, 'distance_miles', 0.2, 'google_rating', 4.7, 'google_review_count', 1373, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Chef%20Jose%20Salazar%20%E2%80%A2%20Mita%27s%20Restaurant&query_place_id=ChIJTzanAFGxQYgRRlDI8p3yeJo'),
        jsonb_build_object('name', 'The Baker''s Table', 'cuisine_style', 'Restaurant', 'price_level', 4, 'distance_miles', 1.6, 'google_rating', 4.6, 'google_review_count', 511, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Baker%27s%20Table&query_place_id=ChIJw9g6RXixQYgR5_b9uRgDsuQ'),
        jsonb_build_object('name', 'Lisse Steakhuis', 'cuisine_style', 'Steak house', 'price_level', 3, 'distance_miles', 1.3, 'google_rating', 4.4, 'google_review_count', 498, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Lisse%20Steakhuis&query_place_id=ChIJo3t5ITSxQYgRdYpJR7Spvgw')
      )
    ),
    (
      'mitas',
      jsonb_build_array(
        jsonb_build_object('name', 'Boca', 'cuisine_style', 'Fine dining restaurant', 'price_level', 4, 'distance_miles', 0.2, 'google_rating', 4.7, 'google_review_count', 1234, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Boca&query_place_id=ChIJn4miDlqxQYgRFPVde0kNKBU'),
        jsonb_build_object('name', 'The Baker''s Table', 'cuisine_style', 'Restaurant', 'price_level', 4, 'distance_miles', 1.7, 'google_rating', 4.6, 'google_review_count', 511, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Baker%27s%20Table&query_place_id=ChIJw9g6RXixQYgR5_b9uRgDsuQ'),
        jsonb_build_object('name', 'Lisse Steakhuis', 'cuisine_style', 'Steak house', 'price_level', 3, 'distance_miles', 1.2, 'google_rating', 4.4, 'google_review_count', 498, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Lisse%20Steakhuis&query_place_id=ChIJo3t5ITSxQYgRdYpJR7Spvgw')
      )
    ),
    (
      'the-bakers-table',
      jsonb_build_array(
        jsonb_build_object('name', 'Boca', 'cuisine_style', 'Fine dining restaurant', 'price_level', 4, 'distance_miles', 1.6, 'google_rating', 4.7, 'google_review_count', 1234, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Boca&query_place_id=ChIJn4miDlqxQYgRFPVde0kNKBU'),
        jsonb_build_object('name', 'Chef Jose Salazar • Mita''s Restaurant', 'cuisine_style', 'Tapas restaurant', 'price_level', 2, 'distance_miles', 1.7, 'google_rating', 4.7, 'google_review_count', 1373, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Chef%20Jose%20Salazar%20%E2%80%A2%20Mita%27s%20Restaurant&query_place_id=ChIJTzanAFGxQYgRRlDI8p3yeJo'),
        jsonb_build_object('name', 'Lisse Steakhuis', 'cuisine_style', 'Steak house', 'price_level', 3, 'distance_miles', 1.5, 'google_rating', 4.4, 'google_review_count', 498, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Lisse%20Steakhuis&query_place_id=ChIJo3t5ITSxQYgRdYpJR7Spvgw')
      )
    ),
    (
      'lisse-steakhuis',
      jsonb_build_array(
        jsonb_build_object('name', 'Boca', 'cuisine_style', 'Fine dining restaurant', 'price_level', 4, 'distance_miles', 1.3, 'google_rating', 4.7, 'google_review_count', 1234, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Boca&query_place_id=ChIJn4miDlqxQYgRFPVde0kNKBU'),
        jsonb_build_object('name', 'The Baker''s Table', 'cuisine_style', 'Restaurant', 'price_level', 4, 'distance_miles', 1.5, 'google_rating', 4.6, 'google_review_count', 511, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Baker%27s%20Table&query_place_id=ChIJw9g6RXixQYgR5_b9uRgDsuQ'),
        jsonb_build_object('name', 'Chef Jose Salazar • Mita''s Restaurant', 'cuisine_style', 'Tapas restaurant', 'price_level', 2, 'distance_miles', 1.2, 'google_rating', 4.7, 'google_review_count', 1373, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Chef%20Jose%20Salazar%20%E2%80%A2%20Mita%27s%20Restaurant&query_place_id=ChIJTzanAFGxQYgRRlDI8p3yeJo')
      )
    ),
    (
      'ghost-kitchen-pizza',
      jsonb_build_array(
        jsonb_build_object('name', 'Bourbon House Pizza', 'cuisine_style', 'Pizza restaurant', 'price_level', 2, 'distance_miles', 11.3, 'google_rating', 4.6, 'google_review_count', 1692, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Bourbon%20House%20Pizza&query_place_id=ChIJo6UqmizEQYgRuk2bpz9CWbk'),
        jsonb_build_object('name', 'Mazunte Taqueria', 'cuisine_style', 'Mexican restaurant', 'price_level', 2, 'distance_miles', 8.3, 'google_rating', 4.6, 'google_review_count', 3445, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Mazunte%20Taqueria&query_place_id=ChIJARcIkhmtQYgR6fx_i276pJQ'),
        jsonb_build_object('name', 'The Park Diner - Northside', 'cuisine_style', 'American restaurant', 'price_level', 2, 'distance_miles', 6.0, 'google_rating', 4.5, 'google_review_count', 150, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Park%20Diner%20-%20Northside&query_place_id=ChIJtwpJdKm1QYgRL7EoX3jDei4')
      )
    ),
    (
      'bourbon-house-pizza-florence',
      jsonb_build_array(
        jsonb_build_object('name', 'Ghost Kitchen Pizza', 'cuisine_style', 'Pizza restaurant', 'price_level', 2, 'distance_miles', 11.3, 'google_rating', 4.9, 'google_review_count', 266, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Ghost%20Kitchen%20Pizza&query_place_id=ChIJNT3RulOxQYgRTXoEAU1fqNY'),
        jsonb_build_object('name', 'The Park Diner - Northside', 'cuisine_style', 'American restaurant', 'price_level', 2, 'distance_miles', 14.5, 'google_rating', 4.5, 'google_review_count', 150, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Park%20Diner%20-%20Northside&query_place_id=ChIJtwpJdKm1QYgRL7EoX3jDei4'),
        jsonb_build_object('name', 'Mazunte Taqueria', 'cuisine_style', 'Mexican restaurant', 'price_level', 2, 'distance_miles', 19.5, 'google_rating', 4.6, 'google_review_count', 3445, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Mazunte%20Taqueria&query_place_id=ChIJARcIkhmtQYgR6fx_i276pJQ')
      )
    ),
    (
      'cozys-cafe-and-pub',
      jsonb_build_array(
        jsonb_build_object('name', 'The Park Diner - Northside', 'cuisine_style', 'American restaurant', 'price_level', 2, 'distance_miles', 18.0, 'google_rating', 4.5, 'google_review_count', 150, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Park%20Diner%20-%20Northside&query_place_id=ChIJtwpJdKm1QYgRL7EoX3jDei4'),
        jsonb_build_object('name', 'Herb & Thelma''s Tavern', 'cuisine_style', 'Hamburger restaurant', 'price_level', 2, 'distance_miles', 23.0, 'google_rating', 4.7, 'google_review_count', 581, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Herb%20%26%20Thelma%27s%20Tavern&query_place_id=ChIJS5TG59K2QYgRS_Kt4d59S8Q'),
        jsonb_build_object('name', 'Libby’s Southern Comfort', 'cuisine_style', 'Restaurant', 'price_level', 3, 'distance_miles', 22.4, 'google_rating', 4.4, 'google_review_count', 1019, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Libby%E2%80%99s%20Southern%20Comfort&query_place_id=ChIJRz1RgPyxQYgRo22QoH_1ljg')
      )
    ),
    (
      'the-park-diner',
      jsonb_build_array(
        jsonb_build_object('name', 'Cozy''s Café & Pub', 'cuisine_style', 'American restaurant', 'price_level', 3, 'distance_miles', 18.0, 'google_rating', 4.5, 'google_review_count', 1962, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Cozy%27s%20Caf%C3%A9%20%26%20Pub&query_place_id=ChIJGbVvFDRaQIgRzv17HTJ4XDc'),
        jsonb_build_object('name', 'Herb & Thelma''s Tavern', 'cuisine_style', 'Hamburger restaurant', 'price_level', 2, 'distance_miles', 6.0, 'google_rating', 4.7, 'google_review_count', 581, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Herb%20%26%20Thelma%27s%20Tavern&query_place_id=ChIJS5TG59K2QYgRS_Kt4d59S8Q'),
        jsonb_build_object('name', 'Libby’s Southern Comfort', 'cuisine_style', 'Restaurant', 'price_level', 3, 'distance_miles', 5.8, 'google_rating', 4.4, 'google_review_count', 1019, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Libby%E2%80%99s%20Southern%20Comfort&query_place_id=ChIJRz1RgPyxQYgRo22QoH_1ljg')
      )
    ),
    (
      'herb-and-thelmas-tavern',
      jsonb_build_array(
        jsonb_build_object('name', 'Cozy''s Café & Pub', 'cuisine_style', 'American restaurant', 'price_level', 3, 'distance_miles', 23.0, 'google_rating', 4.5, 'google_review_count', 1962, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Cozy%27s%20Caf%C3%A9%20%26%20Pub&query_place_id=ChIJGbVvFDRaQIgRzv17HTJ4XDc'),
        jsonb_build_object('name', 'The Park Diner - Northside', 'cuisine_style', 'American restaurant', 'price_level', 2, 'distance_miles', 6.0, 'google_rating', 4.5, 'google_review_count', 150, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Park%20Diner%20-%20Northside&query_place_id=ChIJtwpJdKm1QYgRL7EoX3jDei4'),
        jsonb_build_object('name', 'Libby’s Southern Comfort', 'cuisine_style', 'Restaurant', 'price_level', 3, 'distance_miles', 0.8, 'google_rating', 4.4, 'google_review_count', 1019, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Libby%E2%80%99s%20Southern%20Comfort&query_place_id=ChIJRz1RgPyxQYgRo22QoH_1ljg')
      )
    ),
    (
      'elis-bbq-riverside',
      jsonb_build_array(
        jsonb_build_object('name', 'Libby’s Southern Comfort', 'cuisine_style', 'Restaurant', 'price_level', 3, 'distance_miles', 4.4, 'google_rating', 4.4, 'google_review_count', 1019, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Libby%E2%80%99s%20Southern%20Comfort&query_place_id=ChIJRz1RgPyxQYgRo22QoH_1ljg'),
        jsonb_build_object('name', 'Knotty Pine On The Bayou', 'cuisine_style', 'Cajun restaurant', 'price_level', 3, 'distance_miles', 7.9, 'google_rating', 4.5, 'google_review_count', 1348, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Knotty%20Pine%20On%20The%20Bayou&query_place_id=ChIJdwiGYZC6QYgREtFYYoz10do'),
        jsonb_build_object('name', 'Herb & Thelma''s Tavern', 'cuisine_style', 'Hamburger restaurant', 'price_level', 2, 'distance_miles', 5.2, 'google_rating', 4.7, 'google_review_count', 581, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Herb%20%26%20Thelma%27s%20Tavern&query_place_id=ChIJS5TG59K2QYgRS_Kt4d59S8Q')
      )
    ),
    (
      'libbys-southern-comfort',
      jsonb_build_array(
        jsonb_build_object('name', 'Eli''s BBQ - Riverside', 'cuisine_style', 'Barbecue restaurant', 'price_level', 2, 'distance_miles', 4.4, 'google_rating', 4.6, 'google_review_count', 3870, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Eli%27s%20BBQ%20-%20Riverside&query_place_id=ChIJzfXP2wiyQYgRPWy8cLnpfNs'),
        jsonb_build_object('name', 'Knotty Pine On The Bayou', 'cuisine_style', 'Cajun restaurant', 'price_level', 3, 'distance_miles', 6.0, 'google_rating', 4.5, 'google_review_count', 1348, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Knotty%20Pine%20On%20The%20Bayou&query_place_id=ChIJdwiGYZC6QYgREtFYYoz10do'),
        jsonb_build_object('name', 'Cozy''s Café & Pub', 'cuisine_style', 'American restaurant', 'price_level', 3, 'distance_miles', 22.4, 'google_rating', 4.5, 'google_review_count', 1962, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Cozy%27s%20Caf%C3%A9%20%26%20Pub&query_place_id=ChIJGbVvFDRaQIgRzv17HTJ4XDc')
      )
    ),
    (
      'knotty-pine-on-the-bayou',
      jsonb_build_array(
        jsonb_build_object('name', 'Eli''s BBQ - Riverside', 'cuisine_style', 'Barbecue restaurant', 'price_level', 2, 'distance_miles', 7.9, 'google_rating', 4.6, 'google_review_count', 3870, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Eli%27s%20BBQ%20-%20Riverside&query_place_id=ChIJzfXP2wiyQYgRPWy8cLnpfNs'),
        jsonb_build_object('name', 'Libby’s Southern Comfort', 'cuisine_style', 'Restaurant', 'price_level', 3, 'distance_miles', 6.0, 'google_rating', 4.4, 'google_review_count', 1019, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Libby%E2%80%99s%20Southern%20Comfort&query_place_id=ChIJRz1RgPyxQYgRo22QoH_1ljg'),
        jsonb_build_object('name', 'Herb & Thelma''s Tavern', 'cuisine_style', 'Hamburger restaurant', 'price_level', 2, 'distance_miles', 5.9, 'google_rating', 4.7, 'google_review_count', 581, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Herb%20%26%20Thelma%27s%20Tavern&query_place_id=ChIJS5TG59K2QYgRS_Kt4d59S8Q')
      )
    ),
    (
      'mazunte-taqueria',
      jsonb_build_array(
        jsonb_build_object('name', 'Bridges Nepali Cuisine - Northside', 'cuisine_style', 'Nepalese restaurant', 'price_level', 2, 'distance_miles', 7.2, 'google_rating', 4.7, 'google_review_count', 989, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Bridges%20Nepali%20Cuisine%20-%20Northside&query_place_id=ChIJcyfjb5K0QYgRiorzz9Tmkww'),
        jsonb_build_object('name', 'Ghost Kitchen Pizza', 'cuisine_style', 'Pizza restaurant', 'price_level', 2, 'distance_miles', 8.3, 'google_rating', 4.9, 'google_review_count', 266, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Ghost%20Kitchen%20Pizza&query_place_id=ChIJNT3RulOxQYgRTXoEAU1fqNY'),
        jsonb_build_object('name', 'The Park Diner - Northside', 'cuisine_style', 'American restaurant', 'price_level', 2, 'distance_miles', 7.2, 'google_rating', 4.5, 'google_review_count', 150, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Park%20Diner%20-%20Northside&query_place_id=ChIJtwpJdKm1QYgRL7EoX3jDei4')
      )
    ),
    (
      'bridges-nepali-cuisine-northside',
      jsonb_build_array(
        jsonb_build_object('name', 'Mazunte Taqueria', 'cuisine_style', 'Mexican restaurant', 'price_level', 2, 'distance_miles', 7.2, 'google_rating', 4.6, 'google_review_count', 3445, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Mazunte%20Taqueria&query_place_id=ChIJARcIkhmtQYgR6fx_i276pJQ'),
        jsonb_build_object('name', 'Cozy''s Café & Pub', 'cuisine_style', 'American restaurant', 'price_level', 3, 'distance_miles', 18.0, 'google_rating', 4.5, 'google_review_count', 1962, 'google_url', 'https://www.google.com/maps/search/?api=1&query=Cozy%27s%20Caf%C3%A9%20%26%20Pub&query_place_id=ChIJGbVvFDRaQIgRzv17HTJ4XDc'),
        jsonb_build_object('name', 'The Park Diner - Northside', 'cuisine_style', 'American restaurant', 'price_level', 2, 'distance_miles', 0.0, 'google_rating', 4.5, 'google_review_count', 150, 'google_url', 'https://www.google.com/maps/search/?api=1&query=The%20Park%20Diner%20-%20Northside&query_place_id=ChIJtwpJdKm1QYgRL7EoX3jDei4')
      )
    )
)
update public.restaurants r
set competitors = c.competitors
from competitor_seed c
where r.slug = c.slug;
