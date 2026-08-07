import type { ContentItem, ContentKind, MediaRecord, Trip, TripDay } from '../domain/types'
import { fixtureTrips } from './fixtures'
import { localRepository } from './repository'
import { getOwnerAccess, getSupabase, hasSupabaseConfig } from './supabase'
import { retryFailedOutbox, synchronizeOutbox } from './sync'

type Row = Record<string, unknown>

const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const optionalText = (value: unknown) => typeof value === 'string' && value ? value : undefined
const number = (value: unknown, fallback = 0) => typeof value === 'number' ? value : value == null ? fallback : Number(value)
const optionalNumber = (value: unknown) => value == null ? undefined : number(value)
const timestamp = (value: unknown) => text(value, new Date().toISOString())

function base(row: Row) {
  return {
    id: text(row.id), createdAt: timestamp(row.created_at), updatedAt: timestamp(row.updated_at),
    deletedAt: optionalText(row.deleted_at), version: number(row.version, 1)
  }
}

function remoteTrip(row: Row): Trip {
  const fixture = fixtureTrips.find((trip) => trip.id === row.id)
  return {
    ...base(row), ownerId: text(row.owner_id), title: text(row.title), subtitle: text(row.subtitle),
    startDate: text(row.start_date), endDate: text(row.end_date), timezone: text(row.timezone, 'UTC'),
    baseCurrency: text(row.base_currency, 'USD'), displayCurrency: text(row.display_currency, 'USD'),
    coverUrl: fixture?.coverUrl ?? 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1800&q=82',
    coverAlt: fixture?.coverAlt ?? 'A scenic destination landscape',
    status: text(row.status, 'upcoming') as Trip['status'], shareEnabled: Boolean(row.share_enabled)
  }
}

function remoteDay(row: Row): TripDay {
  return { ...base(row), tripId: text(row.trip_id), date: text(row.date), title: text(row.title), summary: text(row.summary), position: number(row.position) }
}

function commonItem(row: Row, kind: ContentKind): ContentItem {
  return {
    ...base(row), tripId: text(row.trip_id), dayId: optionalText(row.day_id), kind,
    title: text(row.title ?? row.name ?? row.city), description: text(row.description ?? row.notes ?? row.body),
    startTime: optionalText(row.start_time), endTime: optionalText(row.end_time),
    location: optionalText(row.location_name ?? row.location ?? row.destination), mapsUrl: optionalText(row.maps_url),
    provider: optionalText(row.provider), confirmationCode: optionalText(row.confirmation_code), status: optionalText(row.status),
    position: number(row.position), plannedAmount: optionalNumber(row.planned_amount), actualAmount: optionalNumber(row.actual_amount),
    currency: optionalText(row.currency), occurredOn: optionalText(row.occurred_on), paid: row.paid == null ? undefined : Boolean(row.paid)
  }
}

const tableKinds: Array<[string, ContentKind]> = [
  ['itinerary_items', 'activity'], ['bookings', 'booking'], ['stays', 'stay'], ['transports', 'transport'],
  ['route_stops', 'route'], ['places', 'place'], ['food_nightlife', 'food'], ['notes', 'note'],
  ['warnings', 'warning'], ['expenses', 'expense']
]

let currentBootstrap: Promise<{ state: 'local' | 'signed-out' | 'uploaded' | 'downloaded' }> | undefined

export function bootstrapCloudData() {
  if (!currentBootstrap) currentBootstrap = runCloudBootstrap().finally(() => { currentBootstrap = undefined })
  return currentBootstrap
}

async function runCloudBootstrap() {
  if (!hasSupabaseConfig() || !navigator.onLine) return { state: 'local' as const }
  const supabase = await getSupabase()
  if (!supabase) return { state: 'local' as const }
  if (await getOwnerAccess() !== 'owner') return { state: 'signed-out' as const }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { state: 'signed-out' as const }

  const { data: remoteTrips, error: tripError } = await supabase.from('trips').select('*').is('deleted_at', null)
  if (tripError) throw tripError
  if (!remoteTrips?.length) {
    await localRepository.prepareInitialCloudUpload(auth.user.id)
    await retryFailedOutbox()
    const result = await synchronizeOutbox()
    if (result.failed) throw new Error('The first cloud save needs attention. Check that this account has owner access.')
    return { state: 'uploaded' as const }
  }

  const tripIds = remoteTrips.map((trip) => text(trip.id))
  const pending = await localRepository.pendingCount()
  if (pending) {
    const result = await retryFailedOutbox()
    if (result.failed) throw new Error('Some offline changes could not be synchronized.')
  }

  const [daysResult, ...itemResults] = await Promise.all([
    supabase.from('trip_days').select('*').in('trip_id', tripIds).is('deleted_at', null),
    ...tableKinds.map(([table]) => supabase.from(table).select('*').in('trip_id', tripIds).is('deleted_at', null))
  ])
  if (daysResult.error) throw daysResult.error
  for (const result of itemResults) if (result.error) throw result.error

  const items = itemResults.flatMap((result, index) => (result.data ?? []).map((row) => commonItem(row, tableKinds[index][1])))
  const { data: mediaRows, error: mediaError } = await supabase.from('media').select('*').in('trip_id', tripIds).is('deleted_at', null)
  if (mediaError) throw mediaError
  const media: MediaRecord[] = (mediaRows ?? []).map((row) => {
    const storagePath = optionalText(row.storage_path)
    const publicUrl = storagePath ? supabase.storage.from('trip-media').getPublicUrl(storagePath).data.publicUrl : optionalText(row.external_url)
    return {
      ...base(row), tripId: text(row.trip_id), itemId: optionalText(row.itinerary_item_id),
      sourceType: text(row.source_type, 'external') as MediaRecord['sourceType'], storagePath,
      externalUrl: publicUrl, altText: text(row.alt_text, 'Trip photo'), caption: text(row.caption), position: number(row.position)
    }
  })
  await localRepository.replaceFromCloud({
    trips: remoteTrips.map(remoteTrip), days: (daysResult.data ?? []).map(remoteDay), items, media
  })
  return { state: 'downloaded' as const }
}
