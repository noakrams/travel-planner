-- Add a verified editor role without exposing approved email addresses in the client.
-- Approved addresses are stored as normalized SHA-256 hashes in a non-API schema.
-- Owners remain the only users who can create, duplicate, or delete whole trips.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table private.app_editors (
  email_hash bytea primary key,
  created_at timestamptz not null default now()
);

alter table private.app_editors enable row level security;
revoke all on private.app_editors from public, anon, authenticated;

-- Pre-approve the verified Google account supplied for Noa's husband.
insert into private.app_editors (email_hash)
values (decode('74e738fc1ac9a383acfeb816d86a8e3c95f9a241c70263746bea4c9aff6fa4b5', 'hex'))
on conflict do nothing;

create or replace function private.is_app_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and exists(select 1 from public.app_owners where user_id = auth.uid())
$$;
revoke all on function private.is_app_owner() from public, anon;
grant execute on function private.is_app_owner() to authenticated;

create or replace function private.is_app_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1
    from auth.users u
    join private.app_editors e
      on e.email_hash = extensions.digest(lower(trim(u.email)), 'sha256')
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  )
$$;
revoke all on function private.is_app_editor() from public, anon;
grant execute on function private.is_app_editor() to authenticated;

create or replace function public.is_app_owner() returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.is_app_owner()
$$;
revoke all on function public.is_app_owner() from public, anon;
grant execute on function public.is_app_owner() to authenticated;

create or replace function public.get_app_access_role() returns text
language sql stable security invoker set search_path = '' as $$
  select case
    when private.is_app_owner() then 'owner'
    when private.is_app_editor() then 'editor'
    else 'denied'
  end
$$;
revoke all on function public.get_app_access_role() from public, anon;
grant execute on function public.get_app_access_role() to authenticated;

create or replace function private.can_edit_trip(target_trip_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1
    from public.trips t
    where t.id = target_trip_id
      and t.deleted_at is null
      and (t.owner_id = auth.uid() or private.is_app_editor())
  )
$$;
revoke all on function private.can_edit_trip(text) from public, anon;
grant execute on function private.can_edit_trip(text) to authenticated;

create or replace function public.owns_trip(target_trip_id text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.can_edit_trip(target_trip_id)
$$;
revoke all on function public.owns_trip(text) from public, anon;
grant execute on function public.owns_trip(text) to authenticated;

drop policy if exists trips_owner_select on public.trips;
drop policy if exists trips_owner_insert on public.trips;
drop policy if exists trips_owner_update on public.trips;
drop policy if exists trips_owner_delete on public.trips;

create policy trips_owner_select on public.trips for select to authenticated
using (public.owns_trip(id));

create policy trips_owner_insert on public.trips for insert to authenticated
with check (owner_id = auth.uid() and public.is_app_owner());

create policy trips_owner_update on public.trips for update to authenticated
using (public.owns_trip(id))
with check (public.owns_trip(id));

create policy trips_owner_delete on public.trips for delete to authenticated
using (owner_id = auth.uid() and public.is_app_owner());

create or replace function private.keep_trip_owner() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Trip ownership cannot be changed';
  end if;
  return new;
end;
$$;
revoke all on function private.keep_trip_owner() from public, anon, authenticated;

drop trigger if exists keep_trip_owner on public.trips;
create trigger keep_trip_owner before update on public.trips
for each row execute function private.keep_trip_owner();

create or replace function public.set_trip_share_token(target_trip_id text, raw_token text, enabled boolean default true)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if length(raw_token) < 32 then raise exception 'Share token must contain at least 128 bits of entropy'; end if;
  update public.trips set share_token_hash = extensions.digest(raw_token, 'sha256'), share_enabled = enabled
  where id = target_trip_id and public.owns_trip(target_trip_id);
  if not found then raise exception 'Trip not found or not editable by current user'; end if;
end;
$$;
revoke all on function public.set_trip_share_token(text,text,boolean) from public, anon;
grant execute on function public.set_trip_share_token(text,text,boolean) to authenticated;
