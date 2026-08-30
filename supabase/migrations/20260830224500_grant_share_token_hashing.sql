-- Keep extensions.digest private. This RPC runs with its owner's privileges,
-- while public.owns_trip still enforces the caller's editor/owner access.
create or replace function public.set_trip_share_token(target_trip_id text, raw_token text, enabled boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if length(raw_token) < 32 then raise exception 'Share token must contain at least 128 bits of entropy'; end if;
  update public.trips set share_token_hash = extensions.digest(raw_token, 'sha256'), share_enabled = enabled
  where id = target_trip_id and public.owns_trip(target_trip_id);
  if not found then raise exception 'Trip not found or not editable by current user'; end if;
end;
$$;

revoke all on function public.set_trip_share_token(text,text,boolean) from public, anonymous;
grant execute on function public.set_trip_share_token(text,text,boolean) to authenticated;
