-- Restore the API-level table privileges required before owner-only RLS policies can run.
-- RLS remains enabled and continues to restrict every row to the authenticated app owner.
grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.app_owners,
  public.trips,
  public.trip_days,
  public.itinerary_items,
  public.bookings,
  public.stays,
  public.transports,
  public.route_stops,
  public.places,
  public.food_nightlife,
  public.notes,
  public.warnings,
  public.expenses,
  public.media
to authenticated;
