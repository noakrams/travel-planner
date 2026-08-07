import type { ContentItem, TripBundle, TripDay } from '../domain/types'
import { getSupabase } from './supabase'

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.map(record) : []
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const number = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback
const optionalNumber = (value: unknown) => typeof value === 'number' ? value : undefined

export async function getRemoteSharedTrip(rawToken: string): Promise<TripBundle | undefined> {
  const supabase = await getSupabase()
  if (!supabase) return undefined
  const { data, error } = await supabase.rpc('get_shared_trip', { raw_token: rawToken })
  if (error || !data) return undefined
  const payload = record(data)
  const tripRow = record(payload.trip)
  const tripId = text(tripRow.id)
  if (!tripId) return undefined
  const timestamp = new Date().toISOString()
  const base = (row: Record<string, unknown>) => ({ id: text(row.id), tripId, createdAt: timestamp, updatedAt: timestamp, version: 1, position: number(row.position) })
  const days: TripDay[] = rows(payload.days).map((row) => ({ ...base(row), date: text(row.date), title: text(row.title), summary: text(row.summary) }))
  const items: ContentItem[] = []
  for (const row of rows(payload.itinerary_items)) items.push({ ...base(row), dayId: text(row.day_id) || undefined, kind: 'activity', title: text(row.title), description: text(row.description), startTime: text(row.start_time) || undefined, endTime: text(row.end_time) || undefined, location: text(row.location_name) || undefined, mapsUrl: text(row.maps_url) || undefined, status: text(row.status) || undefined, plannedAmount: optionalNumber(row.planned_amount), actualAmount: optionalNumber(row.actual_amount), currency: text(row.currency) || undefined })
  for (const row of rows(payload.bookings)) items.push({ ...base(row), kind: 'booking', title: text(row.title), description: text(row.notes), provider: text(row.provider) || undefined, status: text(row.status) || undefined })
  for (const row of rows(payload.stays)) items.push({ ...base(row), kind: 'stay', title: text(row.name), description: text(row.notes), location: text(row.location) || undefined, mapsUrl: text(row.maps_url) || undefined })
  for (const row of rows(payload.transports)) items.push({ ...base(row), kind: 'transport', title: text(row.title), description: text(row.notes), provider: text(row.provider) || undefined, location: text(row.destination) || undefined, status: text(row.status) || undefined })
  for (const row of rows(payload.route_stops)) items.push({ ...base(row), kind: 'route', title: text(row.city), description: text(row.notes), mapsUrl: text(row.maps_url) || undefined })
  for (const row of rows(payload.places)) items.push({ ...base(row), kind: 'place', title: text(row.name), description: text(row.notes), location: text(row.location) || undefined, mapsUrl: text(row.maps_url) || undefined, status: text(row.status) || undefined })
  for (const row of rows(payload.food_nightlife)) items.push({ ...base(row), kind: 'food', title: text(row.name), description: text(row.notes), location: text(row.location) || undefined, mapsUrl: text(row.maps_url) || undefined, status: text(row.status) || undefined })
  for (const row of rows(payload.notes)) items.push({ ...base(row), dayId: text(row.day_id) || undefined, kind: 'note', title: text(row.title), description: text(row.body) })
  for (const row of rows(payload.warnings)) items.push({ ...base(row), dayId: text(row.day_id) || undefined, kind: 'warning', title: text(row.title), description: text(row.body), status: text(row.severity) })
  for (const row of rows(payload.expenses)) items.push({ ...base(row), kind: 'expense', title: text(row.title), description: text(row.notes), plannedAmount: number(row.planned_amount), actualAmount: number(row.actual_amount), currency: text(row.currency), paid: Boolean(row.paid), occurredOn: text(row.occurred_on) || undefined })
  const mediaRows = rows(payload.media)
  const projectUrl = import.meta.env.VITE_SUPABASE_URL as string
  for (const media of mediaRows) {
    const item = items.find((entry) => entry.id === text(media.itinerary_item_id))
    if (!item) continue
    const path = text(media.storage_path)
    item.imageUrl = text(media.external_url) || (path ? `${projectUrl}/storage/v1/object/public/trip-media/${path}` : undefined)
    item.imageAlt = text(media.alt_text)
  }
  const coverMedia = mediaRows.find((media) => text(media.id) === text(tripRow.cover_photo_id))
  const coverPath = text(coverMedia?.storage_path)
  const coverUrl = text(coverMedia?.external_url) || (coverPath ? `${projectUrl}/storage/v1/object/public/trip-media/${coverPath}` : '')
  return {
    trip: {
      id: tripId, ownerId: '', title: text(tripRow.title), subtitle: text(tripRow.subtitle), startDate: text(tripRow.start_date),
      endDate: text(tripRow.end_date), timezone: text(tripRow.timezone, 'UTC'), baseCurrency: text(tripRow.display_currency, 'USD'),
      displayCurrency: text(tripRow.display_currency, 'USD'), coverUrl, coverAlt: text(coverMedia?.alt_text), status: 'upcoming', shareEnabled: true,
      createdAt: timestamp, updatedAt: timestamp, version: 1
    },
    days: days.sort((a, b) => a.position - b.position), items: items.sort((a, b) => a.position - b.position), media: []
  }
}
