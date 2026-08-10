alter table public.itinerary_items add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.bookings add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.stays add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.transports add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.route_stops add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.places add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.food_nightlife add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.notes add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.warnings add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');
alter table public.expenses add column if not exists attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array');

do $$
declare table_name text;
begin
  foreach table_name in array array['itinerary_items','bookings','stays','transports','route_stops','places','food_nightlife','notes','warnings','expenses']
  loop
    execute format(
      'update public.%I set attachments = jsonb_build_array(jsonb_build_object(''id'', ''legacy-email'', ''kind'', ''email'', ''label'', ''Confirmation email'', ''url'', email_url)) where email_url is not null and email_url <> '''' and attachments = ''[]''::jsonb',
      table_name
    );
  end loop;
end $$;

comment on column public.itinerary_items.attachments is 'Private labeled email, web, and file links for this itinerary item.';
comment on column public.bookings.attachments is 'Private labeled email, web, and file links for this booking.';
comment on column public.stays.attachments is 'Private labeled email, web, and file links for this stay.';
comment on column public.transports.attachments is 'Private labeled email, web, and file links for this transport.';

-- Reservation resources are owner/editor-only and are deliberately removed from public shares.
create or replace function public.get_shared_trip(raw_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'trip', jsonb_build_object(
      'id', t.id, 'title', t.title, 'subtitle', t.subtitle, 'start_date', t.start_date,
      'end_date', t.end_date, 'timezone', t.timezone, 'display_currency', t.display_currency,
      'budget_amount', t.budget_amount, 'budget_currency', t.budget_currency,
      'category_budgets', t.category_budgets, 'cover_photo_id', t.cover_photo_id
    ),
    'days', coalesce((select jsonb_agg(to_jsonb(d) - array['created_at','updated_at','deleted_at','version'] order by d.position) from public.trip_days d where d.trip_id = t.id and d.deleted_at is null), '[]'::jsonb),
    'itinerary_items', coalesce((select jsonb_agg(to_jsonb(i) - array['attachments','email_url','created_at','updated_at','deleted_at','version'] order by i.position) from public.itinerary_items i where i.trip_id = t.id and i.deleted_at is null), '[]'::jsonb),
    'bookings', coalesce((select jsonb_agg(to_jsonb(b) - array['attachments','email_url','confirmation_code','created_at','updated_at','deleted_at','version']) from public.bookings b where b.trip_id = t.id and b.deleted_at is null), '[]'::jsonb),
    'stays', coalesce((select jsonb_agg(to_jsonb(s) - array['attachments','email_url','created_at','updated_at','deleted_at','version']) from public.stays s where s.trip_id = t.id and s.deleted_at is null), '[]'::jsonb),
    'transports', coalesce((select jsonb_agg(to_jsonb(x) - array['attachments','email_url','created_at','updated_at','deleted_at','version']) from public.transports x where x.trip_id = t.id and x.deleted_at is null), '[]'::jsonb),
    'route_stops', coalesce((select jsonb_agg(to_jsonb(r) - array['attachments','email_url','created_at','updated_at','deleted_at','version'] order by r.position) from public.route_stops r where r.trip_id = t.id and r.deleted_at is null), '[]'::jsonb),
    'places', coalesce((select jsonb_agg(to_jsonb(p) - array['attachments','email_url','created_at','updated_at','deleted_at','version']) from public.places p where p.trip_id = t.id and p.deleted_at is null), '[]'::jsonb),
    'food_nightlife', coalesce((select jsonb_agg(to_jsonb(f) - array['attachments','email_url','created_at','updated_at','deleted_at','version']) from public.food_nightlife f where f.trip_id = t.id and f.deleted_at is null), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) - array['attachments','email_url','created_at','updated_at','deleted_at','version']) from public.notes n where n.trip_id = t.id and n.deleted_at is null), '[]'::jsonb),
    'warnings', coalesce((select jsonb_agg(to_jsonb(w) - array['attachments','email_url','created_at','updated_at','deleted_at','version']) from public.warnings w where w.trip_id = t.id and w.deleted_at is null), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(to_jsonb(e) - array['attachments','email_url','created_at','updated_at','deleted_at','version']) from public.expenses e where e.trip_id = t.id and e.deleted_at is null), '[]'::jsonb),
    'media', coalesce((select jsonb_agg(to_jsonb(m) - array['created_at','updated_at','deleted_at','version']) from public.media m where m.trip_id = t.id and m.deleted_at is null), '[]'::jsonb)
  )
  from public.trips t
  where t.share_enabled and t.deleted_at is null and t.share_token_hash = extensions.digest(raw_token, 'sha256')
$$;

revoke all on function public.get_shared_trip(text) from public, anon;
grant execute on function public.get_shared_trip(text) to anon, authenticated;
