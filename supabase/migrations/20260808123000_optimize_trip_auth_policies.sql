-- Cache stable auth lookups once per statement instead of once per trip row.

drop policy if exists trips_owner_insert on public.trips;
drop policy if exists trips_owner_delete on public.trips;

create policy trips_owner_insert on public.trips for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_app_owner()));

create policy trips_owner_delete on public.trips for delete to authenticated
using (owner_id = (select auth.uid()) and (select public.is_app_owner()));
