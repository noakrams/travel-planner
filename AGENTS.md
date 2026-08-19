# Repository instructions

## Neon is the itinerary source of truth

- Treat Neon project `billowing-leaf-94344196` as the sole source of truth for all user itinerary, booking, stay, transport, place, food, note, warning, route, and expense data.
- Never add, change, or remove personal itinerary data in local fixtures to make it appear updated in the app.
- Never add cache-reconciliation logic that promotes fixture data over Neon records.
- For a requested itinerary data change, update the Neon production branch directly through the configured connection and verify the result with a read-back query.
- A local SQL or migration file is not a completed itinerary update. Do not present it as completed unless it has been applied to Neon and verified.
- Keep fixtures limited to development and test placeholders that cannot be mistaken for the user's current plan.
- Schema changes may still use migrations, but user data mutations must be performed against Neon unless the user explicitly requests a local-only draft.
