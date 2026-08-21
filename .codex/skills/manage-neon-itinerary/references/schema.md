# Itinerary schema reference

Use this map to select the owning table and fields. Confirm the live schema with Neon before relying on a field not listed here.

## Database target

- Project: `billowing-leaf-94344196`
- Production branch: `br-quiet-silence-awq6pz5t`
- Database: `neondb`
- Application schema: `public`
- Authentication schema: `neon_auth`; do not modify Auth records for ordinary itinerary work.

## Core hierarchy

- `trips`: one trip. Key fields include `id`, `owner_id`, `title`, date range, `timezone`, currencies, budgets, status, sharing fields, timestamps, `deleted_at`, and `version`.
- `trip_days`: one dated day within a trip. Key fields include `id`, `trip_id`, `date`, `title`, `summary`, `base_location`, `position`, timestamps, `deleted_at`, and `version`.

## Itinerary content tables

| User concept | Table | Display fields | Schedule/link fields |
| --- | --- | --- | --- |
| Activity | `itinerary_items` | `title`, `description`, `status` | `day_id`, `start_time`, `end_time`, `location_name`, `maps_url` |
| Booking/reservation | `bookings` | `title`, `provider`, `confirmation_code`, `status`, `display_status`, `notes` | `day_id`, `start_time`, `starts_at`, `ends_at`, `location_name`, `maps_url` |
| Accommodation | `stays` | `name`, `location`, `display_status`, `notes` | `day_id`, `start_time`, `check_in`, `check_out`, `booking_id`, `maps_url` |
| Transport | `transports` | `title`, `transport_type`, `provider`, `status`, `display_status`, `notes` | `day_id`, `start_time`, `origin`, `destination`, `departs_at`, `arrives_at`, `booking_id` |
| Place | `places` | `name`, `category`, `status`, `notes` | `day_id`, `start_time`, `location`, `maps_url` |
| Food/nightlife | `food_nightlife` | `name`, `category`, `status`, `notes` | `day_id`, `start_time`, `location`, `maps_url` |
| Note | `notes` | `title`, `body`, `note_type`, `priority` | `day_id`, `start_time` |
| Warning | `warnings` | `title`, `body`, `severity` | `day_id` |
| Route stop | `route_stops` | `city`, `notes` | `arrival_date`, `departure_date`, `maps_url` |
| Expense | `expenses` | `title`, `category`, `notes`, `paid` | `occurred_on` |
| Image metadata | `media` | `external_url`, `alt_text`, `caption`, `source_type` | `itinerary_item_id`, `position` |

Most content tables also contain `id`, `trip_id`, `position`, `created_at`, `updated_at`, `deleted_at`, and `version`. Cost-aware content tables use some combination of `planned_amount`, `actual_amount`, `currency`, and `budget_category`. Several tables also carry `email_url` and JSONB `attachments`.

## Query patterns

Resolve a trip before any targeted operation:

```sql
select id, title, start_date, end_date, timezone
from public.trips
where deleted_at is null
order by start_date;
```

Search activity-like records across all likely content owners when the table is ambiguous:

```sql
select 'activity' as kind, id, trip_id, day_id, title as label, description as detail
from public.itinerary_items
where deleted_at is null and title ilike '%' || :search || '%'
union all
select 'booking', id, trip_id, day_id, title, notes
from public.bookings
where deleted_at is null and title ilike '%' || :search || '%'
union all
select 'place', id, trip_id, day_id, name, notes
from public.places
where deleted_at is null and name ilike '%' || :search || '%'
union all
select 'food', id, trip_id, day_id, name, notes
from public.food_nightlife
where deleted_at is null and name ilike '%' || :search || '%';
```

Use literal, safely quoted values with the Neon SQL tool; `:search` above is illustrative rather than Neon MCP parameter syntax.

Perform a scoped update and maintain synchronization metadata:

```sql
update public.itinerary_items
set title = '<new-title>',
    updated_at = now(),
    version = version + 1
where trip_id = '<trip-id>'
  and id = '<item-id>'
  and deleted_at is null;
```

Soft-delete by default:

```sql
update public.itinerary_items
set deleted_at = now(),
    updated_at = now(),
    version = version + 1
where trip_id = '<trip-id>'
  and id = '<item-id>'
  and deleted_at is null;
```

Always execute a separate `select` after a mutation to verify the saved state.
