-- Roam travel planner: complete v1 schema, owner-only RLS, unlisted sharing, and storage.
-- Apply with the Supabase CLI or paste into the SQL editor after reviewing the owner profile setup.

create extension if not exists pgcrypto with schema extensions;

create type public.trip_status as enum ('upcoming', 'active', 'archived');
create type public.sync_item_status as enum ('planned', 'confirmed', 'completed', 'cancelled');
create type public.media_source_type as enum ('upload', 'external');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_app_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.app_owners where user_id = auth.uid())
$$;
revoke all on function public.is_app_owner() from public, anon;
grant execute on function public.is_app_owner() to authenticated;

create table public.trips (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  subtitle text not null default '',
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  timezone text not null default 'UTC',
  base_currency text not null check (char_length(base_currency) = 3),
  display_currency text not null check (char_length(display_currency) = 3),
  cover_photo_id text,
  status public.trip_status not null default 'upcoming',
  share_token_hash bytea unique,
  share_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1
);

create table public.trip_days (
  id text primary key,
  trip_id text not null references public.trips(id) on delete cascade,
  date date not null,
  title text not null,
  summary text not null default '',
  position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.itinerary_items (
  id text primary key,
  trip_id text not null references public.trips(id) on delete cascade,
  day_id text references public.trip_days(id) on delete set null,
  item_type text not null check (item_type in ('activity','meal','sight','experience','free_time','other')),
  title text not null, start_time time, end_time time, location_name text, maps_url text,
  description text not null default '', status public.sync_item_status not null default 'planned',
  planned_amount numeric(14,2), actual_amount numeric(14,2), currency text check (currency is null or char_length(currency) = 3),
  position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.bookings (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  itinerary_item_id text references public.itinerary_items(id) on delete set null,
  booking_type text not null, title text not null, provider text, confirmation_code text,
  starts_at timestamptz, ends_at timestamptz, status public.sync_item_status not null default 'planned', notes text not null default '',
  planned_amount numeric(14,2), actual_amount numeric(14,2), currency text check (currency is null or char_length(currency) = 3), position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.stays (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  name text not null, location text, check_in timestamptz, check_out timestamptz, maps_url text,
  booking_id text references public.bookings(id) on delete set null, notes text not null default '',
  planned_amount numeric(14,2), actual_amount numeric(14,2), currency text check (currency is null or char_length(currency) = 3), position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.transports (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  transport_type text not null, title text not null, provider text, origin text, destination text,
  departs_at timestamptz, arrives_at timestamptz, booking_id text references public.bookings(id) on delete set null,
  status public.sync_item_status not null default 'planned', notes text not null default '',
  planned_amount numeric(14,2), actual_amount numeric(14,2), currency text check (currency is null or char_length(currency) = 3), position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.route_stops (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  city text not null, arrival_date date, departure_date date, maps_url text, notes text not null default '', position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.places (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  category text not null, name text not null, location text, maps_url text, notes text not null default '', status text not null default 'saved', position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.food_nightlife (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  category text not null check (category in ('restaurant','cafe','bar','nightlife','market','other')),
  name text not null, location text, maps_url text, notes text not null default '', status text not null default 'saved', position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.notes (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  day_id text references public.trip_days(id) on delete set null, note_type text not null default 'note', title text not null,
  body text not null default '', priority integer not null default 0, position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.warnings (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  day_id text references public.trip_days(id) on delete set null, title text not null, body text not null default '',
  severity text not null default 'notice' check (severity in ('notice','important','critical')), position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.expenses (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  itinerary_item_id text references public.itinerary_items(id) on delete set null,
  category text not null, title text not null, planned_amount numeric(14,2) not null default 0,
  actual_amount numeric(14,2) not null default 0, currency text not null check (char_length(currency) = 3),
  paid boolean not null default false, occurred_on date, notes text not null default '', position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1
);

create table public.media (
  id text primary key, trip_id text not null references public.trips(id) on delete cascade,
  itinerary_item_id text references public.itinerary_items(id) on delete set null,
  source_type public.media_source_type not null, storage_path text, external_url text,
  alt_text text not null check (char_length(alt_text) > 0), caption text not null default '', position numeric(12,4) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, version bigint not null default 1,
  constraint media_source_check check (
    (source_type = 'upload' and storage_path is not null and external_url is null) or
    (source_type = 'external' and external_url is not null and storage_path is null)
  )
);

alter table public.trips add constraint trips_cover_photo_fk foreign key (cover_photo_id) references public.media(id) on delete set null;

create index trip_days_trip_position_idx on public.trip_days(trip_id, position) where deleted_at is null;
create index itinerary_items_day_position_idx on public.itinerary_items(day_id, position) where deleted_at is null;
create index bookings_trip_idx on public.bookings(trip_id) where deleted_at is null;
create index stays_trip_idx on public.stays(trip_id) where deleted_at is null;
create index transports_trip_idx on public.transports(trip_id) where deleted_at is null;
create index places_trip_idx on public.places(trip_id) where deleted_at is null;
create index expenses_trip_idx on public.expenses(trip_id) where deleted_at is null;
create index media_trip_idx on public.media(trip_id) where deleted_at is null;

create or replace function public.touch_record() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.version <= old.version then new.version = old.version + 1; end if;
  return new;
end;
$$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','trips','trip_days','itinerary_items','bookings','stays','transports','route_stops','places','food_nightlife','notes','warnings','expenses','media']
  loop execute format('create trigger touch_%I before update on public.%I for each row execute function public.touch_record()', table_name, table_name); end loop;
end $$;

create or replace function public.owns_trip(target_trip_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.trips where id = target_trip_id and owner_id = auth.uid() and deleted_at is null)
$$;
revoke all on function public.owns_trip(text) from public, anon;
grant execute on function public.owns_trip(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.app_owners enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.bookings enable row level security;
alter table public.stays enable row level security;
alter table public.transports enable row level security;
alter table public.route_stops enable row level security;
alter table public.places enable row level security;
alter table public.food_nightlife enable row level security;
alter table public.notes enable row level security;
alter table public.warnings enable row level security;
alter table public.expenses enable row level security;
alter table public.media enable row level security;

create policy profiles_owner_all on public.profiles for all to authenticated using (id = auth.uid() and public.is_app_owner()) with check (id = auth.uid() and public.is_app_owner());
create policy trips_owner_select on public.trips for select to authenticated using (owner_id = auth.uid());
create policy trips_owner_insert on public.trips for insert to authenticated with check (owner_id = auth.uid() and public.is_app_owner());
create policy trips_owner_update on public.trips for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy trips_owner_delete on public.trips for delete to authenticated using (owner_id = auth.uid());

do $$ declare table_name text; begin
  foreach table_name in array array['trip_days','itinerary_items','bookings','stays','transports','route_stops','places','food_nightlife','notes','warnings','expenses','media']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.owns_trip(trip_id))', table_name || '_owner_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.owns_trip(trip_id))', table_name || '_owner_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.owns_trip(trip_id)) with check (public.owns_trip(trip_id))', table_name || '_owner_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.owns_trip(trip_id))', table_name || '_owner_delete', table_name);
  end loop;
end $$;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

create or replace function public.set_trip_share_token(target_trip_id text, raw_token text, enabled boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if length(raw_token) < 32 then raise exception 'Share token must contain at least 128 bits of entropy'; end if;
  update public.trips set share_token_hash = extensions.digest(raw_token, 'sha256'), share_enabled = enabled
  where id = target_trip_id and owner_id = auth.uid();
  if not found then raise exception 'Trip not found or not owned by current user'; end if;
end;
$$;
revoke all on function public.set_trip_share_token(text,text,boolean) from public, anon;
grant execute on function public.set_trip_share_token(text,text,boolean) to authenticated;

create or replace function public.get_shared_trip(raw_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'trip', jsonb_build_object('id', t.id, 'title', t.title, 'subtitle', t.subtitle, 'start_date', t.start_date, 'end_date', t.end_date, 'timezone', t.timezone, 'display_currency', t.display_currency, 'cover_photo_id', t.cover_photo_id),
    'days', coalesce((select jsonb_agg(to_jsonb(d) - array['created_at','updated_at','deleted_at','version'] order by d.position) from public.trip_days d where d.trip_id = t.id and d.deleted_at is null), '[]'::jsonb),
    'itinerary_items', coalesce((select jsonb_agg(to_jsonb(i) - array['created_at','updated_at','deleted_at','version'] order by i.position) from public.itinerary_items i where i.trip_id = t.id and i.deleted_at is null), '[]'::jsonb),
    'bookings', coalesce((select jsonb_agg((to_jsonb(b) - array['confirmation_code','created_at','updated_at','deleted_at','version'])) from public.bookings b where b.trip_id = t.id and b.deleted_at is null), '[]'::jsonb),
    'stays', coalesce((select jsonb_agg(to_jsonb(s) - array['created_at','updated_at','deleted_at','version']) from public.stays s where s.trip_id = t.id and s.deleted_at is null), '[]'::jsonb),
    'transports', coalesce((select jsonb_agg(to_jsonb(x) - array['created_at','updated_at','deleted_at','version']) from public.transports x where x.trip_id = t.id and x.deleted_at is null), '[]'::jsonb),
    'route_stops', coalesce((select jsonb_agg(to_jsonb(r) - array['created_at','updated_at','deleted_at','version'] order by r.position) from public.route_stops r where r.trip_id = t.id and r.deleted_at is null), '[]'::jsonb),
    'places', coalesce((select jsonb_agg(to_jsonb(p) - array['created_at','updated_at','deleted_at','version']) from public.places p where p.trip_id = t.id and p.deleted_at is null), '[]'::jsonb),
    'food_nightlife', coalesce((select jsonb_agg(to_jsonb(f) - array['created_at','updated_at','deleted_at','version']) from public.food_nightlife f where f.trip_id = t.id and f.deleted_at is null), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) - array['created_at','updated_at','deleted_at','version']) from public.notes n where n.trip_id = t.id and n.deleted_at is null), '[]'::jsonb),
    'warnings', coalesce((select jsonb_agg(to_jsonb(w) - array['created_at','updated_at','deleted_at','version']) from public.warnings w where w.trip_id = t.id and w.deleted_at is null), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(to_jsonb(e) - array['created_at','updated_at','deleted_at','version']) from public.expenses e where e.trip_id = t.id and e.deleted_at is null), '[]'::jsonb),
    'media', coalesce((select jsonb_agg(to_jsonb(m) - array['created_at','updated_at','deleted_at','version']) from public.media m where m.trip_id = t.id and m.deleted_at is null), '[]'::jsonb)
  )
  from public.trips t
  where t.share_enabled and t.deleted_at is null and t.share_token_hash = extensions.digest(raw_token, 'sha256')
$$;
revoke all on function public.get_shared_trip(text) from public, authenticated;
grant execute on function public.get_shared_trip(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-media', 'trip-media', true, 12582912, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy trip_media_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'trip-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy trip_media_owner_select on storage.objects for select to authenticated
using (bucket_id = 'trip-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy trip_media_owner_update on storage.objects for update to authenticated
using (bucket_id = 'trip-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'trip-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy trip_media_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'trip-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- The bucket is public only for non-sensitive destination imagery. The object path is unguessable.
-- Move to a private bucket plus signed URLs before storing sensitive personal photos.
