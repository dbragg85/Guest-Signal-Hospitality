-- Allow review_observations / review_scores from tri_angle Restaurant Review Aggregator
-- (Yelp, Google Maps, TripAdvisor, Facebook, DoorDash, Uber Eats) and future multi-source ingests.

alter table public.review_observations
  drop constraint if exists review_observations_source_check;

alter table public.review_observations
  add constraint review_observations_source_check
  check (
    source in (
      'google',
      'yelp',
      'tripadvisor',
      'facebook',
      'doordash',
      'ubereats'
    )
  );

alter table public.review_scores
  drop constraint if exists review_scores_source_check;

alter table public.review_scores
  add constraint review_scores_source_check
  check (
    source in (
      'google',
      'yelp',
      'tripadvisor',
      'facebook',
      'doordash',
      'ubereats'
    )
  );

comment on table public.review_observations is
  'Raw ingested reviews (google, yelp, tripadvisor, facebook, doordash, ubereats). RLS on; service_role jobs bypass. Anon has no access.';
