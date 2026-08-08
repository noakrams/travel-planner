---
name: update-database-plan
description: Update and verify the travel-planner itinerary in its authoritative Supabase database. Use when the user asks to add, edit, move, reschedule, confirm, or remove trip days, bookings, stays, transport, activities, places, meals, notes, warnings, route stops, or expenses in the plan; when importing confirmed reservation details from email; or when reconciling itinerary data shown by the app with Supabase. Do not use local fixtures as a substitute for a database update.
---

# Update Database Plan

Write requested itinerary mutations to Supabase, then prove that the saved database state matches the request. Treat a prepared SQL file, fixture edit, UI-only edit, or unverified command as incomplete.

## Source-of-truth rules

- Read the repository `AGENTS.md` before acting.
- Use the Supabase skill and the configured Supabase MCP connection.
- Treat Supabase as the only source of truth for personal trip data.
- Never edit `src/data/fixtures.ts` or add cache-seeding logic to simulate an itinerary update.
- Never create a migration merely to stage a data-only itinerary change. Execute the data mutation against Supabase.
- Use migrations only for actual schema changes and follow the Supabase skill's migration workflow.
- Preserve unrelated user records and existing local worktree changes.

## Database workflow

### 1. Resolve the intended change

- Read the current itinerary and relevant reservation details before writing.
- Use the applicable trip-planning skill when the requested change requires itinerary judgment.
- Separate confirmed facts, assumptions, and unresolved choices.
- Ask only when a missing choice materially changes the database result. Do not re-ask facts already provided.

### 2. Identify the authoritative project

1. List accessible Supabase projects.
2. Do not select a project by display name alone.
3. Run this read-only check against plausible projects:

```sql
select id, title
from public.trips
where id = '<trip-id>' and deleted_at is null;
```

4. Write only to the project that contains the requested trip. The current Japan plan is in project `kzxmyvuqbecztszkbhaj`, but verify trip presence before every write because connections and projects can change.

### 3. Inspect the existing rows

Read the affected day and every related item before updating. Check the specialized table that owns each card:

- `trip_days`
- `itinerary_items` for activities
- `bookings`
- `stays`
- `transports`
- `places`
- `food_nightlife`
- `notes`
- `warnings`
- `route_stops`
- `expenses`

Confirm stable IDs, `day_id`, dates, times, positions, statuses, and any records that would become duplicated or obsolete.

### 4. Apply a data-only transaction

- Use Supabase `execute_sql` for itinerary data mutations.
- Wrap multi-table changes in `begin; ... commit;` so partial plans are not saved.
- Use stable, descriptive IDs for new rows and idempotent `insert ... on conflict ... do update` when retry safety matters.
- Scope every update by both trip and record ID where possible.
- Set `updated_at = now()` and increment `version` for updated records.
- Clear `deleted_at` only when intentionally restoring or upserting a live record.
- Store confirmed bookings in `bookings`, including provider, confirmation code, local start/end instants, display status, meeting location, map URL, and operational notes when available.
- Interpret trip times in the trip timezone. For Japan, store `timestamptz` values with `+09`; expect verified read-back values to render in UTC.
- Soft-delete obsolete rows when history must be preserved; hard-delete only when the user explicitly requests irreversible deletion.

### 5. Verify from Supabase

Run a separate read-back query after the write. Verify:

- affected days have the intended dates, titles, summaries, and positions;
- every moved item has the correct `day_id`;
- booking status, confirmation code, provider, time, location, and notes match the source;
- obsolete or duplicate rows are absent or appropriately soft-deleted;
- no unrelated rows changed.

If verification fails, diagnose before retrying. Do not claim success from an empty command result alone.

### 6. Report completion accurately

State:

- the Supabase project updated;
- the records changed;
- the verification performed;
- any remaining action, such as extending a hotel reservation.

Tell the user to refresh the app if it already has the trip open. Do not describe local files as the completed plan update.
