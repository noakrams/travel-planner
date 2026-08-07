import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { fixtureDays, fixtureItems, fixtureTrips } from './fixtures'
import { localRepository } from './repository'

describe('localRepository', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  afterEach(async () => { await db.delete() })

  it('seeds multiple trips and performs offline-safe CRUD', async () => {
    const trips = await localRepository.listTrips()
    expect(trips).toHaveLength(2)
    const item = await localRepository.saveItem({ tripId: trips[0].id, kind: 'note', title: 'ערב in Lisbon', description: 'Mixed תוכן at 20:30' })
    expect((await localRepository.getTrip(trips[0].id))?.items.some((entry) => entry.id === item.id)).toBe(true)
    await localRepository.softDelete('item', item.id)
    expect((await localRepository.getTrip(trips[0].id))?.items.some((entry) => entry.id === item.id)).toBe(false)
    await localRepository.restore('item', item.id)
    expect((await localRepository.getTrip(trips[0].id))?.items.some((entry) => entry.id === item.id)).toBe(true)
  })

  it('round-trips JSON into a separate trip', async () => {
    const trip = (await localRepository.listTrips())[0]
    const exported = await localRepository.exportTrip(trip.id)
    const imported = await localRepository.importTrip(exported)
    expect(imported.id).not.toBe(trip.id)
    expect(imported.title).toContain('imported')
    expect((await localRepository.getTrip(imported.id))?.days.length).toBeGreaterThan(0)
  })

  it('adds new fixture days to an already-seeded local database', async () => {
    await db.trips.bulkAdd(fixtureTrips)
    await db.days.add(fixtureDays.find((day) => day.id === 'day-japan-1')!)
    await db.items.add(fixtureItems.find((item) => item.id === 'japan-arrival')!)

    const japan = await localRepository.getTrip('trip-japan-2026')
    expect(japan?.days.map((day) => day.date)).toEqual([
      '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22'
    ])
    expect(japan?.items.some((item) => item.id === 'japan-shibuya-sky')).toBe(true)
    expect(japan?.items.some((item) => item.id === 'japan-sensoji')).toBe(true)
  })
})
