alter table public.itinerary_items add column if not exists email_url text;
alter table public.bookings add column if not exists email_url text;
alter table public.stays add column if not exists email_url text;
alter table public.transports add column if not exists email_url text;
alter table public.route_stops add column if not exists email_url text;
alter table public.places add column if not exists email_url text;
alter table public.food_nightlife add column if not exists email_url text;
alter table public.notes add column if not exists email_url text;
alter table public.warnings add column if not exists email_url text;
alter table public.expenses add column if not exists email_url text;

comment on column public.itinerary_items.email_url is 'Private link to a source email for the itinerary item.';
comment on column public.bookings.email_url is 'Private link to a source email for the booking.';
comment on column public.stays.email_url is 'Private link to a source email for the stay.';
comment on column public.transports.email_url is 'Private link to a source email for the transport.';
comment on column public.route_stops.email_url is 'Private link to a source email for the route stop.';
comment on column public.places.email_url is 'Private link to a source email for the place.';
comment on column public.food_nightlife.email_url is 'Private link to a source email for the food or nightlife item.';
comment on column public.notes.email_url is 'Private link to a source email for the note.';
comment on column public.warnings.email_url is 'Private link to a source email for the warning.';
comment on column public.expenses.email_url is 'Private link to a source email for the expense.';

-- Mailbox URLs are private owner/editor data and must never be included in public shared-trip payloads.
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
    'itinerary_items', coalesce((select jsonb_agg(to_jsonb(i) - array['email_url','created_at','updated_at','deleted_at','version'] order by i.position) from public.itinerary_items i where i.trip_id = t.id and i.deleted_at is null), '[]'::jsonb),
    'bookings', coalesce((select jsonb_agg(to_jsonb(b) - array['email_url','confirmation_code','created_at','updated_at','deleted_at','version']) from public.bookings b where b.trip_id = t.id and b.deleted_at is null), '[]'::jsonb),
    'stays', coalesce((select jsonb_agg(to_jsonb(s) - array['email_url','created_at','updated_at','deleted_at','version']) from public.stays s where s.trip_id = t.id and s.deleted_at is null), '[]'::jsonb),
    'transports', coalesce((select jsonb_agg(to_jsonb(x) - array['email_url','created_at','updated_at','deleted_at','version']) from public.transports x where x.trip_id = t.id and x.deleted_at is null), '[]'::jsonb),
    'route_stops', coalesce((select jsonb_agg(to_jsonb(r) - array['email_url','created_at','updated_at','deleted_at','version'] order by r.position) from public.route_stops r where r.trip_id = t.id and r.deleted_at is null), '[]'::jsonb),
    'places', coalesce((select jsonb_agg(to_jsonb(p) - array['email_url','created_at','updated_at','deleted_at','version']) from public.places p where p.trip_id = t.id and p.deleted_at is null), '[]'::jsonb),
    'food_nightlife', coalesce((select jsonb_agg(to_jsonb(f) - array['email_url','created_at','updated_at','deleted_at','version']) from public.food_nightlife f where f.trip_id = t.id and f.deleted_at is null), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) - array['email_url','created_at','updated_at','deleted_at','version']) from public.notes n where n.trip_id = t.id and n.deleted_at is null), '[]'::jsonb),
    'warnings', coalesce((select jsonb_agg(to_jsonb(w) - array['email_url','created_at','updated_at','deleted_at','version']) from public.warnings w where w.trip_id = t.id and w.deleted_at is null), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(to_jsonb(e) - array['email_url','created_at','updated_at','deleted_at','version']) from public.expenses e where e.trip_id = t.id and e.deleted_at is null), '[]'::jsonb),
    'media', coalesce((select jsonb_agg(to_jsonb(m) - array['created_at','updated_at','deleted_at','version']) from public.media m where m.trip_id = t.id and m.deleted_at is null), '[]'::jsonb)
  )
  from public.trips t
  where t.share_enabled and t.deleted_at is null and t.share_token_hash = extensions.digest(raw_token, 'sha256')
$$;
