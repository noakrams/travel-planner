-- Add fixed-rate, categorized budgeting while preserving existing cost records.

alter table public.trips
  add column if not exists budget_amount numeric(14,2) not null default 0,
  add column if not exists budget_currency text,
  add column if not exists category_budgets jsonb not null default '{}'::jsonb;

update public.trips set budget_currency = display_currency where budget_currency is null;
alter table public.trips alter column budget_currency set not null;
alter table public.trips add constraint trips_budget_currency_length check (char_length(budget_currency) = 3);
alter table public.trips add constraint trips_category_budgets_object check (jsonb_typeof(category_budgets) = 'object');

alter table public.itinerary_items add column if not exists budget_category text;
alter table public.bookings add column if not exists budget_category text;
alter table public.stays add column if not exists budget_category text;
alter table public.transports add column if not exists budget_category text;
alter table public.expenses add column if not exists budget_category text;

alter table public.places
  add column if not exists planned_amount numeric(14,2),
  add column if not exists currency text,
  add column if not exists budget_category text;
alter table public.food_nightlife
  add column if not exists planned_amount numeric(14,2),
  add column if not exists currency text,
  add column if not exists budget_category text;
alter table public.notes
  add column if not exists planned_amount numeric(14,2),
  add column if not exists currency text,
  add column if not exists budget_category text;
alter table public.warnings
  add column if not exists planned_amount numeric(14,2),
  add column if not exists currency text,
  add column if not exists budget_category text;
alter table public.route_stops
  add column if not exists planned_amount numeric(14,2),
  add column if not exists currency text,
  add column if not exists budget_category text;

update public.itinerary_items set budget_category = 'activities' where budget_category is null and planned_amount is not null;
update public.bookings set budget_category = 'activities' where budget_category is null and planned_amount is not null;
update public.stays set budget_category = 'accommodation' where budget_category is null and planned_amount is not null;
update public.transports set budget_category = 'transportation' where budget_category is null and planned_amount is not null;
update public.expenses set budget_category = case when category in ('accommodation','transportation','food','activities','shopping','other') then category else 'other' end where budget_category is null;

do $$
declare table_name text;
begin
  foreach table_name in array array['itinerary_items','bookings','stays','transports','places','food_nightlife','notes','warnings','route_stops','expenses']
  loop
    execute format(
      'alter table public.%I add constraint %I check (budget_category is null or budget_category in (''accommodation'',''transportation'',''food'',''activities'',''shopping'',''other''))',
      table_name,
      table_name || '_budget_category_check'
    );
  end loop;
end $$;

alter table public.places add constraint places_currency_length check (currency is null or char_length(currency) = 3);
alter table public.food_nightlife add constraint food_nightlife_currency_length check (currency is null or char_length(currency) = 3);
alter table public.notes add constraint notes_currency_length check (currency is null or char_length(currency) = 3);
alter table public.warnings add constraint warnings_currency_length check (currency is null or char_length(currency) = 3);
alter table public.route_stops add constraint route_stops_currency_length check (currency is null or char_length(currency) = 3);

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
