---
name: manage-neon-itinerary
description: Read, search, reconcile, create, update, move, confirm, or remove itinerary data in the travel-planner's authoritative Neon database. Use for any database-related request, including checking whether an activity, booking, stay, transport, place, meal, note, warning, route stop, expense, trip, or trip day exists; inspecting itinerary details or database state; importing reservation data; changing plan records; or verifying that the app matches Neon. Do not use local fixtures as a substitute for Neon reads or writes.
---

# Manage Neon Itinerary

Operate directly on the travel planner's Neon production database and verify every mutation with a separate read-back query. Treat local files and the app cache as consumers, never as the source of truth.

## Required context

- Read the repository `AGENTS.md` before acting.
- Use the Neon Postgres skill and the configured Neon MCP tools.
- Target project `billowing-leaf-94344196`, production branch `br-quiet-silence-awq6pz5t`, database `neondb`.
- Read [references/schema.md](references/schema.md) before composing a query that touches itinerary tables.
- Never expose connection strings, passwords, tokens, Auth secrets, or personally sensitive confirmation details in logs or the final response.
- Preserve unrelated database rows and local worktree changes.

## Choose the operation

- For checks, searches, counts, comparisons, and itinerary questions: run read-only SQL and report the actual Neon result. Do not mutate anything.
- For user-requested data changes: inspect, mutate, read back, and report only after verification succeeds.
- For schema changes: use Neon's temporary-branch migration workflow. Do not apply ad hoc DDL to production.
- For itinerary planning judgment, also use the applicable trip-planning skill before writing.
- For facts from email, read the complete relevant email thread before writing and distinguish confirmed facts from assumptions.

## Read workflow

1. Resolve the trip from `public.trips`; do not rely on a display title alone when IDs are available.
2. Query the specialized table that owns the requested record. Search multiple content tables when the user says only “activity,” “place,” or another ambiguous label.
3. Exclude soft-deleted rows with `deleted_at is null` unless the user asks about history or missing data.
4. Join `trip_days` when a human-readable date or day title matters.
5. Return concise evidence: table, stable record ID, date/day, title, status, and the requested details. Say clearly when no matching row exists.

## Mutation workflow

1. Read the current trip, affected day, target record, and closely related rows before writing. Check for duplicates and dependent records.
2. Ask a question only when an unresolved choice would materially change the saved result. Do not re-ask facts already supplied.
3. Use a transaction for changes spanning multiple statements or tables.
4. Scope updates and deletes by both `trip_id` and stable record ID whenever the table supports both.
5. On updates, set `updated_at = now()` and increment `version`.
6. For new records, use stable descriptive IDs, required fields, correct `position`, timestamps, live `deleted_at`, and an initial version. Prefer idempotent `insert ... on conflict ... do update` only when retry safety is required and overwriting is intentional.
7. Preserve history with a soft delete (`deleted_at = now()`) by default. Hard-delete only when the user explicitly requests irreversible deletion and the exact target has been read first.
8. Interpret local times in the trip's `timezone`. Store absolute booking, stay, and transport timestamps with the correct offset; use `start_time` for day-card display time.
9. Never edit `src/data/fixtures.ts`, seed the client cache, or create a local-only SQL file to make a production itinerary change appear complete.
10. Run a separate read-back query after commit. Verify the intended fields, relationships, ordering, version, and absence of unintended duplicates. If verification fails, diagnose before retrying.

## Verification standards

- Confirm moved items have the correct `trip_id` and `day_id`.
- Confirm booking and transport provider, confirmation code, status, local times, locations, URLs, costs, and notes when relevant.
- Confirm trip/day date ranges and positions remain coherent after rescheduling.
- Confirm soft-deleted rows are excluded from normal reads.
- Confirm no unrelated rows changed, using stable IDs and targeted before/after reads.
- Treat an empty command result, a prepared query, or a local file as unverified.

## Completion report

- For reads, state what Neon contains and identify the matching records.
- For writes, state which records changed and what the read-back proved.
- Mention unresolved or follow-up action without presenting it as complete.
- Suggest refreshing the app if it was already open during a mutation.
