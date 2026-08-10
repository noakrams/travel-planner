import type { ContentItem, ContentKind, ItemAttachment, MediaRecord, Trip, TripDay } from '../domain/types'
import { localRepository } from './repository'
import { getOwnerAccess, getSupabase, hasSupabaseConfig } from './supabase'
import { normalizeCurrency } from '../domain/currency'
import type { BudgetCategory } from '../domain/types'

type Row = Record<string, unknown>

const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const optionalText = (value: unknown) => typeof value === 'string' && value ? value : undefined
const number = (value: unknown, fallback = 0) => typeof value === 'number' ? value : value == null ? fallback : Number(value)
const optionalNumber = (value: unknown) => value == null ? undefined : number(value)
const timestamp = (value: unknown) => text(value, new Date().toISOString())

function attachments(value: unknown, legacyEmailUrl?: string): ItemAttachment[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const row = entry as Record<string, unknown>
      const kind = text(row.kind)
      const url = text(row.url)
      if (!['email', 'link', 'file'].includes(kind) || !url) return []
      return [{
        id: text(row.id, crypto.randomUUID()),
        kind: kind as ItemAttachment['kind'],
        label: text(row.label, kind === 'email' ? 'Confirmation email' : kind === 'file' ? 'File' : 'Link'),
        url
      }]
    })
  }
  return legacyEmailUrl ? [{ id: 'legacy-email', kind: 'email', label: 'Confirmation email', url: legacyEmailUrl }] : []
}

function base(row: Row) {
  return {
    id: text(row.id), createdAt: timestamp(row.created_at), updatedAt: timestamp(row.updated_at),
    deletedAt: optionalText(row.deleted_at), version: number(row.version, 1)
  }
}

function remoteTrip(row: Row): Trip {
  return {
    ...base(row), ownerId: text(row.owner_id), title: text(row.title), subtitle: text(row.subtitle),
    startDate: text(row.start_date), endDate: text(row.end_date), timezone: text(row.timezone, 'UTC'),
    baseCurrency: text(row.base_currency, 'USD'), displayCurrency: normalizeCurrency(row.display_currency),
    budgetAmount: number(row.budget_amount), budgetCurrency: normalizeCurrency(row.budget_currency ?? row.display_currency),
    categoryBudgets: recordOfNumbers(row.category_budgets) as Partial<Record<BudgetCategory, number>>,
    coverUrl: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1800&q=82',
    coverAlt: 'A scenic destination landscape',
    status: text(row.status, 'upcoming') as Trip['status'], shareEnabled: Boolean(row.share_enabled)
  }
}

export function remoteDay(row: Row): TripDay {
  return { ...base(row), tripId: text(row.trip_id), date: text(row.date), title: text(row.title), summary: text(row.summary), baseLocation: optionalText(row.base_location), position: number(row.position) }
}

export function commonItem(row: Row, kind: ContentKind): ContentItem {
  const emailUrl = optionalText(row.email_url)
  return {
    ...base(row), tripId: text(row.trip_id), dayId: optionalText(row.day_id), kind,
    title: text(row.title ?? row.name ?? row.city), description: text(row.description ?? row.notes ?? row.body),
    startTime: optionalText(row.start_time), endTime: optionalText(row.end_time),
    location: optionalText(row.location_name ?? row.location ?? row.destination), mapsUrl: optionalText(row.maps_url),
    emailUrl,
    attachments: attachments(row.attachments, emailUrl),
    provider: optionalText(row.provider), confirmationCode: optionalText(row.confirmation_code), status: optionalText(row.display_status ?? row.status),
    position: number(row.position), plannedAmount: optionalNumber(row.planned_amount), actualAmount: optionalNumber(row.actual_amount),
    currency: row.currency ? normalizeCurrency(row.currency) : undefined,
    budgetCategory: optionalText(row.budget_category ?? (kind === 'expense' ? row.category : undefined)) as ContentItem['budgetCategory'],
    occurredOn: optionalText(row.occurred_on), paid: row.paid == null ? undefined : Boolean(row.paid)
  }
}

function recordOfNumbers(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => Number.isFinite(Number(entry)) ? [[key, Number(entry)]] : []))
}

const tableKinds: Array<[string, ContentKind]> = [
  ['itinerary_items', 'activity'], ['bookings', 'booking'], ['stays', 'stay'], ['transports', 'transport'],
  ['route_stops', 'route'], ['places', 'place'], ['food_nightlife', 'food'], ['notes', 'note'],
  ['warnings', 'warning'], ['expenses', 'expense']
]

export type CloudBootstrapResult = {
  state: 'downloaded' | 'signed-out' | 'denied' | 'offline' | 'unavailable'
}

let currentBootstrap: Promise<CloudBootstrapResult> | undefined

export function bootstrapCloudData() {
  if (!currentBootstrap) currentBootstrap = runCloudBootstrap().finally(() => { currentBootstrap = undefined })
  return currentBootstrap
}

async function runCloudBootstrap() {
  if (!hasSupabaseConfig()) return { state: 'unavailable' as const }
  if (!navigator.onLine) return { state: 'offline' as const }
  const supabase = await getSupabase()
  if (!supabase) return { state: 'unavailable' as const }
  const access = await getOwnerAccess()
  if (access !== 'owner' && access !== 'editor') return { state: access as 'signed-out' | 'denied' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { state: 'signed-out' as const }

  const { data: remoteTrips, error: tripError } = await supabase.from('trips').select('*').is('deleted_at', null)
  if (tripError) throw tripError
  if (!remoteTrips?.length) {
    await localRepository.replaceFromCloud({ trips: [], days: [], items: [], media: [] })
    return { state: 'downloaded' as const }
  }

  const tripIds = remoteTrips.map((trip) => text(trip.id))
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
