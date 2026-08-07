import Dexie, { type EntityTable } from 'dexie'
import type { ContentItem, MediaRecord, OutboxEntry, Trip, TripDay } from '../domain/types'

export class TravelDatabase extends Dexie {
  trips!: EntityTable<Trip, 'id'>
  days!: EntityTable<TripDay, 'id'>
  items!: EntityTable<ContentItem, 'id'>
  media!: EntityTable<MediaRecord, 'id'>
  outbox!: EntityTable<OutboxEntry, 'id'>

  constructor() {
    super('roam-travel-planner')
    this.version(1).stores({
      trips: 'id, status, startDate, updatedAt, deletedAt',
      days: 'id, tripId, [tripId+position], date, deletedAt',
      items: 'id, tripId, dayId, kind, [tripId+kind], [dayId+position], deletedAt',
      media: 'id, tripId, itemId, deletedAt',
      outbox: 'id, tripId, state, createdAt, [state+createdAt]'
    })
  }
}

export const db = new TravelDatabase()
