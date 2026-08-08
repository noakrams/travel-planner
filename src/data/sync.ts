import { db } from './db'
import { getSupabase, hasSupabaseConfig } from './supabase'
import type { ContentItem, OutboxEntry } from '../domain/types'

const tableForKind = (kind: ContentItem['kind']) => ({
  activity: 'itinerary_items', booking: 'bookings', stay: 'stays', transport: 'transports',
  place: 'places', food: 'food_nightlife', note: 'notes', warning: 'warnings', route: 'route_stops', expense: 'expenses'
})[kind]

export function syncErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  if (typeof error === 'string' && error.trim()) return error
  return 'Synchronization failed.'
}

export function normalizeRemoteStatus(status: unknown): 'planned' | 'confirmed' | 'completed' | 'cancelled' {
  if (status === 'confirmed' || status === 'booked') return 'confirmed'
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return 'planned'
}

const basePayload = (payload: Record<string, unknown>) => ({
  id: payload.id, trip_id: payload.tripId, created_at: payload.createdAt,
  updated_at: payload.updatedAt, deleted_at: payload.deletedAt ?? null, version: payload.version
})

export function remotePayload(entry: OutboxEntry) {
  const payload = entry.payload as Record<string, unknown>
  if (entry.entity === 'trip') return {
    id: payload.id, owner_id: payload.ownerId, title: payload.title, subtitle: payload.subtitle,
    start_date: payload.startDate, end_date: payload.endDate, timezone: payload.timezone,
    base_currency: payload.baseCurrency, display_currency: payload.displayCurrency,
    budget_amount: payload.budgetAmount ?? 0, budget_currency: payload.budgetCurrency ?? payload.displayCurrency,
    category_budgets: payload.categoryBudgets ?? {},
    status: payload.status, share_enabled: payload.shareEnabled, created_at: payload.createdAt,
    updated_at: payload.updatedAt, deleted_at: payload.deletedAt ?? null, version: payload.version
  }
  if (entry.entity === 'day') return { ...basePayload(payload), date: payload.date, title: payload.title, summary: payload.summary, position: payload.position }
  if (entry.entity === 'item') {
    const base = basePayload(payload)
    switch (payload.kind) {
      case 'activity': return { ...base, day_id: payload.dayId, item_type: 'activity', title: payload.title, start_time: payload.startTime || null, end_time: payload.endTime || null, location_name: payload.location || null, maps_url: payload.mapsUrl || null, description: payload.description, status: normalizeRemoteStatus(payload.status), planned_amount: payload.plannedAmount ?? null, actual_amount: payload.actualAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'booking': return { ...base, day_id: payload.dayId || null, start_time: payload.startTime || null, display_status: payload.status || null, itinerary_item_id: null, booking_type: 'reservation', title: payload.title, provider: payload.provider || null, location_name: payload.location || null, maps_url: payload.mapsUrl || null, confirmation_code: payload.confirmationCode || null, starts_at: null, ends_at: null, status: normalizeRemoteStatus(payload.status), notes: payload.description, planned_amount: payload.plannedAmount ?? null, actual_amount: payload.actualAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'stay': return { ...base, day_id: payload.dayId || null, start_time: payload.startTime || null, display_status: payload.status || null, name: payload.title, location: payload.location || null, check_in: null, check_out: null, maps_url: payload.mapsUrl || null, booking_id: null, notes: payload.description, planned_amount: payload.plannedAmount ?? null, actual_amount: payload.actualAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'transport': return { ...base, day_id: payload.dayId || null, start_time: payload.startTime || null, display_status: payload.status || null, transport_type: 'other', title: payload.title, provider: payload.provider || null, origin: null, destination: payload.location || null, departs_at: null, arrives_at: null, booking_id: null, status: normalizeRemoteStatus(payload.status), notes: payload.description, planned_amount: payload.plannedAmount ?? null, actual_amount: payload.actualAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'place': return { ...base, day_id: payload.dayId || null, start_time: payload.startTime || null, category: 'place', name: payload.title, location: payload.location || null, maps_url: payload.mapsUrl || null, notes: payload.description, status: payload.status || 'saved', planned_amount: payload.plannedAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'food': return { ...base, day_id: payload.dayId || null, start_time: payload.startTime || null, category: 'restaurant', name: payload.title, location: payload.location || null, maps_url: payload.mapsUrl || null, notes: payload.description, status: payload.status || 'saved', planned_amount: payload.plannedAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'note': return { ...base, day_id: payload.dayId || null, start_time: payload.startTime || null, note_type: 'note', title: payload.title, body: payload.description, priority: 0, planned_amount: payload.plannedAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'warning': return { ...base, day_id: payload.dayId || null, title: payload.title, body: payload.description, severity: 'notice', planned_amount: payload.plannedAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'route': return { ...base, city: payload.title, arrival_date: null, departure_date: null, maps_url: payload.mapsUrl || null, notes: payload.description, planned_amount: payload.plannedAmount ?? null, currency: payload.currency ?? null, budget_category: payload.budgetCategory ?? null, position: payload.position }
      case 'expense': return { ...base, itinerary_item_id: null, category: payload.budgetCategory ?? 'other', title: payload.title, planned_amount: payload.plannedAmount ?? 0, actual_amount: payload.actualAmount ?? 0, currency: payload.currency ?? 'USD', paid: payload.paid ?? false, occurred_on: payload.occurredOn ?? null, notes: payload.description, budget_category: payload.budgetCategory ?? 'other', position: payload.position }
      default: return base
    }
  }
  return payload
}

export async function synchronizeOutbox() {
  if (!navigator.onLine) return { synced: 0, failed: 0 }
  const entries = (await db.outbox.where('state').equals('pending').sortBy('createdAt')).sort((a, b) => {
    const rank = { trip: 0, day: 1, item: 2, media: 3 }
    return rank[a.entity] - rank[b.entity]
  })
  if (!hasSupabaseConfig()) { await db.outbox.bulkDelete(entries.map((entry) => entry.id)); return { synced: entries.length, failed: 0 } }
  const supabase = (await getSupabase())!
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    const timestamp = new Date().toISOString()
    await Promise.all(entries.map((entry) => db.outbox.update(entry.id, {
      state: 'failed', retryCount: entry.retryCount + 1,
      error: 'Sign in to save changes to the cloud.', updatedAt: timestamp
    })))
    return { synced: 0, failed: entries.length }
  }
  let synced = 0; let failed = 0
  for (const entry of entries) {
    await db.outbox.update(entry.id, { state: 'processing', updatedAt: new Date().toISOString() })
    try {
      if (entry.entity === 'media') {
        const media = await db.media.get(entry.entityId)
        if (!media?.blob) throw new Error('The queued photo is no longer available on this device.')
        const path = `${auth.user.id}/${entry.tripId}/${media.id}.webp`
        const { error } = await supabase.storage.from('trip-media').upload(path, media.blob, { contentType: media.blob.type, upsert: true })
        if (error) throw error
        await db.media.update(media.id, { storagePath: path, updatedAt: new Date().toISOString() })
        const { error: metadataError } = await supabase.from('media').upsert({
          id: media.id, trip_id: media.tripId, itinerary_item_id: media.itemId ?? null,
          source_type: 'upload', storage_path: path, external_url: null, alt_text: media.altText,
          caption: media.caption, position: media.position, created_at: media.createdAt,
          updated_at: new Date().toISOString(), deleted_at: media.deletedAt ?? null, version: media.version
        }, { onConflict: 'id' })
        if (metadataError) throw metadataError
      } else {
        const table = entry.entity === 'trip' ? 'trips' : entry.entity === 'day' ? 'trip_days' : tableForKind((entry.payload as ContentItem).kind)
        const outgoing = remotePayload(entry) as Record<string, unknown>
        if (entry.entity === 'trip' && (!outgoing.owner_id || outgoing.owner_id === 'local-owner')) {
          outgoing.owner_id = auth.user.id
        }
        const { error } = await supabase.from(table).upsert(outgoing, { onConflict: 'id' })
        if (error) throw error
        const shareToken = (entry.payload as { shareToken?: string }).shareToken
        if (entry.entity === 'trip' && shareToken) {
          const { error: shareError } = await supabase.rpc('set_trip_share_token', { target_trip_id: entry.entityId, raw_token: shareToken, enabled: true })
          if (shareError) throw shareError
        }
      }
      await db.outbox.delete(entry.id); synced += 1
    } catch (error) {
      await db.outbox.update(entry.id, { state: 'failed', retryCount: entry.retryCount + 1, error: syncErrorMessage(error), updatedAt: new Date().toISOString() })
      failed += 1
    }
  }
  return { synced, failed }
}

export async function retryFailedOutbox() {
  const retryable = (await db.outbox.toArray()).filter((entry) => entry.state === 'failed' || entry.state === 'processing')
  await Promise.all(retryable.map((entry) => db.outbox.update(entry.id, { state: 'pending', error: undefined })))
  return synchronizeOutbox()
}
