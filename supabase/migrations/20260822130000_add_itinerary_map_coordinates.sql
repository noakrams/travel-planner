-- Persistent, destination-agnostic map coordinates for itinerary content.

alter table public.itinerary_items
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocoded_location text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists map_hidden boolean not null default false;

alter table public.bookings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocoded_location text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists map_hidden boolean not null default false;

alter table public.stays
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocoded_location text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists map_hidden boolean not null default false;

alter table public.places
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocoded_location text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists map_hidden boolean not null default false;

alter table public.food_nightlife
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocoded_location text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists map_hidden boolean not null default false;

alter table public.route_stops
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocoded_location text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists map_hidden boolean not null default false;

alter table public.transports
  add column if not exists origin_latitude double precision,
  add column if not exists origin_longitude double precision,
  add column if not exists origin_geocoded_location text,
  add column if not exists origin_geocoded_at timestamptz,
  add column if not exists destination_latitude double precision,
  add column if not exists destination_longitude double precision,
  add column if not exists destination_geocoded_location text,
  add column if not exists destination_geocoded_at timestamptz,
  add column if not exists map_hidden boolean not null default false;

alter table public.itinerary_items add constraint itinerary_items_latitude_range check (latitude is null or latitude between -90 and 90);
alter table public.itinerary_items add constraint itinerary_items_longitude_range check (longitude is null or longitude between -180 and 180);
alter table public.bookings add constraint bookings_latitude_range check (latitude is null or latitude between -90 and 90);
alter table public.bookings add constraint bookings_longitude_range check (longitude is null or longitude between -180 and 180);
alter table public.stays add constraint stays_latitude_range check (latitude is null or latitude between -90 and 90);
alter table public.stays add constraint stays_longitude_range check (longitude is null or longitude between -180 and 180);
alter table public.places add constraint places_latitude_range check (latitude is null or latitude between -90 and 90);
alter table public.places add constraint places_longitude_range check (longitude is null or longitude between -180 and 180);
alter table public.food_nightlife add constraint food_nightlife_latitude_range check (latitude is null or latitude between -90 and 90);
alter table public.food_nightlife add constraint food_nightlife_longitude_range check (longitude is null or longitude between -180 and 180);
alter table public.route_stops add constraint route_stops_latitude_range check (latitude is null or latitude between -90 and 90);
alter table public.route_stops add constraint route_stops_longitude_range check (longitude is null or longitude between -180 and 180);
alter table public.transports add constraint transports_origin_latitude_range check (origin_latitude is null or origin_latitude between -90 and 90);
alter table public.transports add constraint transports_origin_longitude_range check (origin_longitude is null or origin_longitude between -180 and 180);
alter table public.transports add constraint transports_destination_latitude_range check (destination_latitude is null or destination_latitude between -90 and 90);
alter table public.transports add constraint transports_destination_longitude_range check (destination_longitude is null or destination_longitude between -180 and 180);
