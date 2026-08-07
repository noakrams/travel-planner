-- The editor stores every itinerary card as a ContentItem with a day and time.
-- Preserve those generic fields even when the item lives in a specialized table.
alter table public.bookings
  add column if not exists day_id text references public.trip_days(id) on delete set null,
  add column if not exists start_time time,
  add column if not exists display_status text,
  add column if not exists location_name text,
  add column if not exists maps_url text;

alter table public.stays
  add column if not exists day_id text references public.trip_days(id) on delete set null,
  add column if not exists start_time time,
  add column if not exists display_status text;

alter table public.transports
  add column if not exists day_id text references public.trip_days(id) on delete set null,
  add column if not exists start_time time,
  add column if not exists display_status text;

alter table public.places
  add column if not exists day_id text references public.trip_days(id) on delete set null,
  add column if not exists start_time time;

alter table public.food_nightlife
  add column if not exists day_id text references public.trip_days(id) on delete set null,
  add column if not exists start_time time;

alter table public.notes
  add column if not exists start_time time;

create index if not exists bookings_day_position_idx on public.bookings(day_id, position) where deleted_at is null;
create index if not exists stays_day_position_idx on public.stays(day_id, position) where deleted_at is null;
create index if not exists transports_day_position_idx on public.transports(day_id, position) where deleted_at is null;
create index if not exists places_day_position_idx on public.places(day_id, position) where deleted_at is null;
create index if not exists food_nightlife_day_position_idx on public.food_nightlife(day_id, position) where deleted_at is null;

-- Restore the published Tokyo itinerary for 18–22 September 2026.
update public.trip_days set
  title = case id
    when 'day-japan-1' then 'Arrive — and nothing else'
    when 'day-japan-2' then 'Shibuya on foot — the jet-lag day'
    when 'day-japan-3' then 'Harajuku by day, Shinjuku by night'
    when 'day-japan-4' then 'teamLab, Tokyo Tower, and the Ginza splurge'
    when 'day-japan-5' then 'The east loop — Asakusa, Akihabara, and an easy last night'
  end,
  summary = case id
    when 'day-japan-1' then 'Narita 18:25 → Shibuya ≈ 21:00. By your own call: no plans.'
    when 'day-japan-2' then 'Everything today is walkable from the hotel. Sleep in, then a gentle loop of your own neighbourhood, ending on the roof at sunset.'
    when 'day-japan-3' then 'A short walk north into the shrine, the youth-fashion streets and the boulevard — then the trip''s big night out in Shinjuku''s bar alleys.'
    when 'day-japan-4' then 'A relaxed morning, then the immersive-art centrepiece into a dressed-up Ginza evening.'
    when 'day-japan-5' then 'Start early for the two crowd-sensitive walk-ins, done in one tidy eastward line, then keep the evening light before the Nikko move.'
  end,
  updated_at = now(),
  version = version + 1
where id in ('day-japan-1', 'day-japan-2', 'day-japan-3', 'day-japan-4', 'day-japan-5');

update public.transports as item set
  day_id = source.day_id,
  start_time = source.start_time::time,
  display_status = source.display_status,
  updated_at = now(),
  version = item.version + 1
from (values
  ('japan-arrival', 'day-japan-1', '18:25', 'confirmed')
) as source(id, day_id, start_time, display_status)
where item.id = source.id;

update public.stays as item set
  day_id = source.day_id,
  start_time = source.start_time::time,
  display_status = source.display_status,
  updated_at = now(),
  version = item.version + 1
from (values
  ('japan-checkin-shibuya', 'day-japan-1', '21:00', 'recommended')
) as source(id, day_id, start_time, display_status)
where item.id = source.id;

update public.bookings as item set
  day_id = source.day_id,
  start_time = source.start_time::time,
  display_status = source.display_status,
  location_name = source.location_name,
  updated_at = now(),
  version = item.version + 1
from (values
  ('japan-shibuya-sky', 'day-japan-2', '16:45', 'booked', 'Shibuya Scramble Square'),
  ('japan-teamlab', 'day-japan-4', '14:00', 'booked', 'Azabudai Hills'),
  ('japan-bird-land', 'day-japan-4', '19:00', 'booked', 'Ginza'),
  ('japan-centifolia', 'day-japan-4', '21:15', 'reserve', 'Azabu-Jūban')
) as source(id, day_id, start_time, display_status, location_name)
where item.id = source.id;

update public.places as item set
  day_id = source.day_id,
  start_time = source.start_time::time,
  status = source.status,
  updated_at = now(),
  version = item.version + 1
from (values
  ('japan-parco', 'day-japan-2', '13:00', 'recommended'),
  ('japan-miyashita', 'day-japan-2', '15:00', 'recommended'),
  ('japan-meiji-jingu', 'day-japan-3', '09:30', 'must-do'),
  ('japan-tokyo-tower', 'day-japan-4', '17:15', 'recommended'),
  ('japan-sensoji', 'day-japan-5', '07:45', 'must-do'),
  ('japan-skytree', 'day-japan-5', '09:30', 'optional')
) as source(id, day_id, start_time, status)
where item.id = source.id;

update public.food_nightlife as item set
  day_id = source.day_id,
  start_time = source.start_time::time,
  status = source.status,
  updated_at = now(),
  version = item.version + 1
from (values
  ('japan-hikiniku-crossing', 'day-japan-2', '11:00', 'register'),
  ('japan-shibuya-yokocho', 'day-japan-2', '19:00', 'recommended'),
  ('japan-mensho', 'day-japan-3', '13:30', 'recommended'),
  ('japan-omoide', 'day-japan-3', '18:30', 'recommended'),
  ('japan-shinjuku-night', 'day-japan-3', '20:00', 'recommended'),
  ('japan-casual-dinner', 'day-japan-5', '18:30', 'recommended'),
  ('japan-last-drink', 'day-japan-5', '21:00', 'optional')
) as source(id, day_id, start_time, status)
where item.id = source.id;

update public.notes set
  start_time = '11:00'::time,
  updated_at = now(),
  version = version + 1
where id = 'japan-slow-morning';
