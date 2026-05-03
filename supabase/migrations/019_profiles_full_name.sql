-- Optional display name set during portal invite / welcome password flow.

alter table public.profiles
  add column if not exists full_name text;

comment on column public.profiles.full_name is
  'Display name; can be set on /portal/welcome/ after invite. RLS: profiles_update_own.';
