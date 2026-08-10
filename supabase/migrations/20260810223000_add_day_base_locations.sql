alter table public.trip_days
  add column if not exists base_location text;

comment on column public.trip_days.base_location is
  'City or area where the travelers sleep after this itinerary day; used to group consecutive days.';
