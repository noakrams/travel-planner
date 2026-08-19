import type { ContentItem, TripBundle, TripDay } from '../domain/types'
import { getNeon } from './neon'
import { normalizeCurrency } from '../domain/currency'
import type { BudgetCategory } from '../domain/types'

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.map(record) : []
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const number = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback
const optionalNumber = (value: unknown) => typeof value === 'number' ? value : undefined
const categoryBudgets = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value) ? value as Partial<Record<BudgetCategory, number>> : {}
const costFields = (row: Record<string, unknown>) => ({
  plannedAmount: optionalNumber(row.planned_amount),
  actualAmount: optionalNumber(row.actual_amount),
  currency: text(row.currency) ? normalizeCurrency(row.currency) : undefined,
  budgetCategory: (text(row.budget_category) || undefined) as BudgetCategory | undefined
})

export async function getRemoteSharedTrip(rawToken: string): Promise<TripBundle | undefined> {
  const neon = await getNeon()
  if (!neon) return undefined
  const { data, error } = await neon.rpc('get_shared_trip', { raw_token: rawToken })
  if (error || !data) return undefined
  const payload = record(data)
  const tripRow = record(payload.trip)
  const tripId = text(tripRow.id)
  if (!tripId) return undefined
  const timestamp = new Date().toISOString()
  const base = (row: Record<string, unknown>) => ({ id: text(row.id), tripId, createdAt: timestamp, updatedAt: timestamp, version: 1, position: number(row.position) })
  const days: TripDay[] = rows(payload.days).map((row) => ({ ...base(row), date: text(row.date), title: text(row.title), summary: text(row.summary), baseLocation: text(row.base_location) || undefined }))
  const items: ContentItem[] = []
  for (const row of rows(payload.itinerary_items)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'activity', title: text(row.title), description: text(row.description), startTime: text(row.start_time) || undefined, endTime: text(row.end_time) || undefined, location: text(row.location_name) || undefined, mapsUrl: text(row.maps_url) || undefined, status: text(row.status) || undefined })
  for (const row of rows(payload.bookings)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'booking', title: text(row.title), description: text(row.notes), startTime: text(row.start_time) || undefined, location: text(row.location_name) || undefined, mapsUrl: text(row.maps_url) || undefined, provider: text(row.provider) || undefined, status: text(row.display_status ?? row.status) || undefined })
  for (const row of rows(payload.stays)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'stay', title: text(row.name), description: text(row.notes), startTime: text(row.start_time) || undefined, location: text(row.location) || undefined, mapsUrl: text(row.maps_url) || undefined, status: text(row.display_status) || undefined })
  for (const row of rows(payload.transports)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'transport', title: text(row.title), description: text(row.notes), startTime: text(row.start_time) || undefined, provider: text(row.provider) || undefined, location: text(row.destination) || undefined, status: text(row.display_status ?? row.status) || undefined })
  for (const row of rows(payload.route_stops)) items.push({ ...base(row), ...costFields(row), kind: 'route', title: text(row.city), description: text(row.notes), mapsUrl: text(row.maps_url) || undefined })
  for (const row of rows(payload.places)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'place', title: text(row.name), description: text(row.notes), startTime: text(row.start_time) || undefined, location: text(row.location) || undefined, mapsUrl: text(row.maps_url) || undefined, status: text(row.status) || undefined })
  for (const row of rows(payload.food_nightlife)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'food', title: text(row.name), description: text(row.notes), startTime: text(row.start_time) || undefined, location: text(row.location) || undefined, mapsUrl: text(row.maps_url) || undefined, status: text(row.status) || undefined })
  for (const row of rows(payload.notes)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'note', title: text(row.title), description: text(row.body), startTime: text(row.start_time) || undefined })
  for (const row of rows(payload.warnings)) items.push({ ...base(row), ...costFields(row), dayId: text(row.day_id) || undefined, kind: 'warning', title: text(row.title), description: text(row.body), status: text(row.severity) })
  for (const row of rows(payload.expenses)) items.push({ ...base(row), ...costFields(row), kind: 'expense', title: text(row.title), description: text(row.notes), paid: Boolean(row.paid), occurredOn: text(row.occurred_on) || undefined })
  const mediaRows = rows(payload.media)
  for (const media of mediaRows) {
    const item = items.find((entry) => entry.id === text(media.itinerary_item_id))
    if (!item) continue
    item.imageUrl = text(media.external_url) || undefined
    item.imageAlt = text(media.alt_text)
  }
  const coverMedia = mediaRows.find((media) => text(media.id) === text(tripRow.cover_photo_id))
  const coverUrl = text(coverMedia?.external_url)
  return {
    trip: {
      id: tripId, ownerId: '', title: text(tripRow.title), subtitle: text(tripRow.subtitle), startDate: text(tripRow.start_date),
      endDate: text(tripRow.end_date), timezone: text(tripRow.timezone, 'UTC'), baseCurrency: text(tripRow.display_currency, 'USD'),
      displayCurrency: normalizeCurrency(tripRow.display_currency), budgetAmount: number(tripRow.budget_amount),
      budgetCurrency: normalizeCurrency(tripRow.budget_currency ?? tripRow.display_currency), categoryBudgets: categoryBudgets(tripRow.category_budgets),
      coverUrl, coverAlt: text(coverMedia?.alt_text), status: 'upcoming', shareEnabled: true,
      createdAt: timestamp, updatedAt: timestamp, version: 1
    },
    days: days.sort((a, b) => a.position - b.position), items: items.sort((a, b) => a.position - b.position), media: []
  }
}
