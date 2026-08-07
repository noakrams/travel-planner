import { db } from './db'
import { fixtureDays, fixtureItems, fixtureTrips } from './fixtures'
import type { ContentItem, MediaRecord, OutboxEntry, Trip, TripBundle, TripDay } from '../domain/types'
import { requestSync } from './syncEvents'

const now = () => new Date().toISOString()

async function ensureSeeded() {
  if ((await db.trips.count()) > 0) {
    await db.transaction('rw', db.days, db.items, async () => {
      const existingDays = new Set((await db.days.bulkGet(fixtureDays.map((day) => day.id))).filter(Boolean).map((day) => day!.id))
      const existingItems = new Set((await db.items.bulkGet(fixtureItems.map((item) => item.id))).filter(Boolean).map((item) => item!.id))
      const missingDays = fixtureDays.filter((day) => !existingDays.has(day.id))
      const missingItems = fixtureItems.filter((item) => !existingItems.has(item.id))
      if (missingDays.length) await db.days.bulkAdd(missingDays)
      if (missingItems.length) await db.items.bulkAdd(missingItems)
    })
    return
  }
  await db.transaction('rw', db.trips, db.days, db.items, async () => {
    await db.trips.bulkAdd(fixtureTrips)
    await db.days.bulkAdd(fixtureDays)
    await db.items.bulkAdd(fixtureItems)
  })
}

async function enqueue(
  tripId: string,
  entity: OutboxEntry['entity'],
  entityId: string,
  operation: OutboxEntry['operation'],
  payload: unknown,
  baseVersion: number
) {
  const timestamp = now()
  const entry: OutboxEntry = {
    id: crypto.randomUUID(), tripId, entity, entityId, operation, payload, baseVersion,
    retryCount: 0, state: 'pending', createdAt: timestamp, updatedAt: timestamp, version: 1
  }
  await db.outbox.add(entry)
  if (navigator.onLine && !import.meta.env.VITE_SUPABASE_URL) await db.outbox.delete(entry.id)
  requestSync(tripId)
}

export const localRepository = {
  async listTrips(): Promise<Trip[]> {
    await ensureSeeded()
    return (await db.trips.toArray()).filter((trip) => !trip.deletedAt).sort((a, b) => a.startDate.localeCompare(b.startDate))
  },
  async getTrip(tripId: string): Promise<TripBundle | undefined> {
    await ensureSeeded()
    const [trip, days, items, media] = await Promise.all([
      db.trips.get(tripId), db.days.where('tripId').equals(tripId).toArray(),
      db.items.where('tripId').equals(tripId).toArray(), db.media.where('tripId').equals(tripId).toArray()
    ])
    if (!trip || trip.deletedAt) return undefined
    return {
      trip,
      days: days.filter((day) => !day.deletedAt).sort((a, b) => a.position - b.position),
      items: items.filter((item) => !item.deletedAt).sort((a, b) => a.position - b.position),
      media: media.filter((entry) => !entry.deletedAt).sort((a, b) => a.position - b.position)
    }
  },
  async getSharedTrip(rawToken: string): Promise<TripBundle | undefined> {
    await ensureSeeded()
    const trip = (await db.trips.toArray()).find((entry) => entry.shareEnabled && (entry.shareToken === rawToken || entry.id === rawToken))
    if (trip) return this.getTrip(trip.id)
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const { getRemoteSharedTrip } = await import('./remoteShared')
      return getRemoteSharedTrip(rawToken)
    }
    return undefined
  },
  async saveTrip(input: Partial<Trip> & Pick<Trip, 'title' | 'startDate' | 'endDate'>): Promise<Trip> {
    const existing = input.id ? await db.trips.get(input.id) : undefined
    const timestamp = now()
    const trip: Trip = {
      id: input.id ?? crypto.randomUUID(), ownerId: input.ownerId ?? existing?.ownerId ?? 'local-owner', title: input.title,
      subtitle: input.subtitle ?? existing?.subtitle ?? '', startDate: input.startDate, endDate: input.endDate,
      timezone: input.timezone ?? existing?.timezone ?? 'UTC', baseCurrency: input.baseCurrency ?? existing?.baseCurrency ?? 'USD',
      displayCurrency: input.displayCurrency ?? existing?.displayCurrency ?? input.baseCurrency ?? 'USD',
      coverUrl: input.coverUrl ?? existing?.coverUrl ?? 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1800&q=82', coverAlt: input.coverAlt ?? existing?.coverAlt ?? 'Mountain landscape seen from a train window',
      status: input.status ?? existing?.status ?? 'upcoming', shareEnabled: input.shareEnabled ?? existing?.shareEnabled ?? false,
      shareToken: input.shareToken ?? existing?.shareToken, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
      version: (existing?.version ?? 0) + 1, deletedAt: existing?.deletedAt
    }
    await db.trips.put(trip)
    await enqueue(trip.id, 'trip', trip.id, existing ? 'update' : 'create', trip, existing?.version ?? 0)
    return trip
  },
  async duplicateTrip(tripId: string): Promise<Trip> {
    const bundle = await this.getTrip(tripId)
    if (!bundle) throw new Error('Trip not found')
    const trip = await this.saveTrip({ ...bundle.trip, id: undefined, title: `${bundle.trip.title} copy`, shareEnabled: false, shareToken: undefined })
    const dayMap = new Map<string, string>()
    for (const day of bundle.days) {
      const duplicate = await this.saveDay({ ...day, id: undefined, tripId: trip.id })
      dayMap.set(day.id, duplicate.id)
    }
    for (const item of bundle.items) {
      await this.saveItem({ ...item, id: undefined, tripId: trip.id, dayId: item.dayId ? dayMap.get(item.dayId) : undefined })
    }
    return trip
  },
  async saveDay(input: Partial<TripDay> & Pick<TripDay, 'tripId' | 'date' | 'title'>): Promise<TripDay> {
    const existing = input.id ? await db.days.get(input.id) : undefined
    const timestamp = now()
    const day: TripDay = {
      id: input.id ?? crypto.randomUUID(), tripId: input.tripId, date: input.date, title: input.title,
      summary: input.summary ?? existing?.summary ?? '', position: input.position ?? existing?.position ?? await db.days.where('tripId').equals(input.tripId).count(),
      createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp, version: (existing?.version ?? 0) + 1, deletedAt: existing?.deletedAt
    }
    await db.days.put(day)
    await enqueue(day.tripId, 'day', day.id, existing ? 'update' : 'create', day, existing?.version ?? 0)
    return day
  },
  async duplicateDay(day: TripDay): Promise<TripDay> {
    const duplicate = await this.saveDay({ ...day, id: undefined, title: `${day.title} copy`, position: day.position + 0.5 })
    const items = (await db.items.where('dayId').equals(day.id).toArray()).filter((item) => !item.deletedAt)
    for (const item of items) await this.saveItem({ ...item, id: undefined, dayId: duplicate.id })
    return duplicate
  },
  async moveDay(day: TripDay, delta: -1 | 1, siblings: TripDay[]) {
    const ordered = siblings.toSorted((a, b) => a.position - b.position)
    const index = ordered.findIndex((entry) => entry.id === day.id)
    const swap = ordered[index + delta]
    if (!swap) return
    await Promise.all([this.saveDay({ ...day, position: swap.position }), this.saveDay({ ...swap, position: day.position })])
  },
  async saveItem(input: Partial<ContentItem> & Pick<ContentItem, 'tripId' | 'kind' | 'title'>): Promise<ContentItem> {
    const existing = input.id ? await db.items.get(input.id) : undefined
    const timestamp = now()
    const item: ContentItem = {
      id: input.id ?? crypto.randomUUID(), tripId: input.tripId, dayId: input.dayId,
      kind: input.kind, title: input.title, description: input.description ?? '', startTime: input.startTime,
      endTime: input.endTime, location: input.location, mapsUrl: input.mapsUrl, provider: input.provider,
      confirmationCode: input.confirmationCode, status: input.status, position: input.position ?? existing?.position ?? await db.items.where('tripId').equals(input.tripId).count(),
      imageUrl: input.imageUrl, imageAlt: input.imageAlt, plannedAmount: input.plannedAmount, actualAmount: input.actualAmount,
      currency: input.currency, occurredOn: input.occurredOn, paid: input.paid,
      createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp, version: (existing?.version ?? 0) + 1, deletedAt: existing?.deletedAt
    }
    await db.items.put(item)
    await enqueue(item.tripId, 'item', item.id, existing ? 'update' : 'create', item, existing?.version ?? 0)
    return item
  },
  async softDelete(entity: 'trip' | 'day' | 'item', id: string): Promise<void> {
    const table = entity === 'trip' ? db.trips : entity === 'day' ? db.days : db.items
    const record = await table.get(id) as Trip | TripDay | ContentItem | undefined
    if (!record) return
    const deleted = { ...record, deletedAt: now(), updatedAt: now(), version: record.version + 1 }
    await table.put(deleted as never)
    const tripId = entity === 'trip' ? id : 'tripId' in record ? record.tripId : id
    await enqueue(tripId, entity, id, 'delete', deleted, record.version)
  },
  async restore(entity: 'trip' | 'day' | 'item', id: string): Promise<void> {
    const table = entity === 'trip' ? db.trips : entity === 'day' ? db.days : db.items
    const record = await table.get(id) as Trip | TripDay | ContentItem | undefined
    if (!record) return
    const restored = { ...record, deletedAt: undefined, updatedAt: now(), version: record.version + 1 }
    await table.put(restored as never)
    const tripId = entity === 'trip' ? id : 'tripId' in record ? record.tripId : id
    await enqueue(tripId, entity, id, 'update', restored, record.version)
  },
  async moveItem(item: ContentItem, delta: -1 | 1, siblings: ContentItem[]) {
    const ordered = siblings.toSorted((a, b) => a.position - b.position)
    const index = ordered.findIndex((entry) => entry.id === item.id)
    const swap = ordered[index + delta]
    if (!swap) return
    await Promise.all([this.saveItem({ ...item, position: swap.position }), this.saveItem({ ...swap, position: item.position })])
  },
  async reorderItems(activeId: string, overId: string, siblings: ContentItem[]) {
    const ordered = siblings.toSorted((a, b) => a.position - b.position)
    const from = ordered.findIndex((entry) => entry.id === activeId)
    const to = ordered.findIndex((entry) => entry.id === overId)
    if (from < 0 || to < 0 || from === to) return
    const [moved] = ordered.splice(from, 1)
    ordered.splice(to, 0, moved)
    for (let position = 0; position < ordered.length; position += 1) {
      if (ordered[position].position !== position) await this.saveItem({ ...ordered[position], position })
    }
  },
  async duplicateItem(item: ContentItem) {
    return this.saveItem({ ...item, id: undefined, title: `${item.title} copy`, position: item.position + 0.5 })
  },
  async queuePhoto(tripId: string, blob: Blob, altText: string): Promise<MediaRecord> {
    const timestamp = now()
    const media: MediaRecord = {
      id: crypto.randomUUID(), tripId, sourceType: 'upload', storagePath: undefined, altText,
      caption: '', position: 0, blob, createdAt: timestamp, updatedAt: timestamp, version: 1
    }
    await db.media.add(media)
    await enqueue(tripId, 'media', media.id, 'upload', { ...media, blob: undefined, size: blob.size, type: blob.type }, 0)
    return media
  },
  async exportTrip(tripId: string): Promise<string> {
    const bundle = await this.getTrip(tripId)
    if (!bundle) throw new Error('Trip not found')
    return JSON.stringify({ format: 'roam-trip', version: 1, exportedAt: now(), data: bundle }, null, 2)
  },
  async importTrip(raw: string): Promise<Trip> {
    const parsed = JSON.parse(raw) as { format: string; data: TripBundle }
    if (parsed.format !== 'roam-trip' || !parsed.data?.trip) throw new Error('Choose a valid Roam JSON export.')
    const newId = crypto.randomUUID()
    const trip = await this.saveTrip({ ...parsed.data.trip, id: newId, title: `${parsed.data.trip.title} imported`, shareEnabled: false })
    const dayMap = new Map<string, string>()
    for (const source of parsed.data.days ?? []) {
      const day = await this.saveDay({ ...source, id: undefined, tripId: newId })
      dayMap.set(source.id, day.id)
    }
    for (const source of parsed.data.items ?? []) {
      await this.saveItem({ ...source, id: undefined, tripId: newId, dayId: source.dayId ? dayMap.get(source.dayId) : undefined })
    }
    return trip
  },
  async pendingCount(tripId?: string) {
    const entries = tripId ? await db.outbox.where('tripId').equals(tripId).toArray() : await db.outbox.toArray()
    return entries.filter((entry) => entry.state !== 'processing').length
  },
  async prepareInitialCloudUpload(ownerId: string) {
    await ensureSeeded()
    const [trips, days, items, media] = await Promise.all([
      db.trips.toArray(), db.days.toArray(), db.items.toArray(), db.media.toArray()
    ])
    const liveTrips = trips.filter((trip) => !trip.deletedAt).map((trip) => ({ ...trip, ownerId }))
    const liveTripIds = new Set(liveTrips.map((trip) => trip.id))
    const liveDays = days.filter((day) => liveTripIds.has(day.tripId) && !day.deletedAt)
    const liveItems = items.filter((item) => liveTripIds.has(item.tripId) && !item.deletedAt)
    const liveMedia = media.filter((entry) => liveTripIds.has(entry.tripId) && !entry.deletedAt)

    await db.transaction('rw', db.trips, db.outbox, async () => {
      await db.trips.bulkPut(liveTrips)
      await db.outbox.clear()
    })
    for (const trip of liveTrips) await enqueue(trip.id, 'trip', trip.id, 'create', trip, 0)
    for (const day of liveDays) await enqueue(day.tripId, 'day', day.id, 'create', day, 0)
    for (const item of liveItems) await enqueue(item.tripId, 'item', item.id, 'create', item, 0)
    for (const entry of liveMedia) await enqueue(entry.tripId, 'media', entry.id, 'upload', { ...entry, blob: undefined }, 0)
  },
  async replaceFromCloud(bundle: { trips: Trip[]; days: TripDay[]; items: ContentItem[]; media: MediaRecord[] }) {
    await db.transaction('rw', db.trips, db.days, db.items, db.media, db.outbox, async () => {
      await Promise.all([db.trips.clear(), db.days.clear(), db.items.clear(), db.media.clear(), db.outbox.clear()])
      if (bundle.trips.length) await db.trips.bulkPut(bundle.trips)
      if (bundle.days.length) await db.days.bulkPut(bundle.days)
      if (bundle.items.length) await db.items.bulkPut(bundle.items)
      if (bundle.media.length) await db.media.bulkPut(bundle.media)
    })
  }
}
