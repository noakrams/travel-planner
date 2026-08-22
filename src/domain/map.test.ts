import { describe, expect, it } from 'vitest'
import { buildTripMapPoints, buildTripMapRoutes } from './map'
import type { ContentItem, TripDay } from './types'

const base = { createdAt: '', updatedAt: '', version: 1 }
const days: TripDay[] = [
  { ...base, id: 'd1', tripId: 'trip', date: '2026-01-01', title: 'Day one', summary: '', position: 0 },
  { ...base, id: 'd2', tripId: 'trip', date: '2026-01-02', title: 'Day two', summary: '', position: 1 }
]
const item = (input: Partial<ContentItem> & Pick<ContentItem, 'id' | 'kind' | 'title'>): ContentItem => ({
  ...base, tripId: 'trip', description: '', position: 0, ...input
})

describe('trip map model', () => {
  it('restarts stop numbering for each day and excludes non-map content', () => {
    const points = buildTripMapPoints([
      item({ id: 'a', dayId: 'd1', kind: 'place', title: 'A', location: 'A', latitude: 1, longitude: 2 }),
      item({ id: 'b', dayId: 'd1', kind: 'food', title: 'B', location: 'B', latitude: 2, longitude: 3 }),
      item({ id: 'c', dayId: 'd2', kind: 'booking', title: 'C', location: 'C', latitude: 3, longitude: 4 }),
      item({ id: 'n', dayId: 'd2', kind: 'note', title: 'Hidden note' })
    ], days)
    expect(points.map((point) => point.stopNumber)).toEqual([1, 2, 1])
  })

  it('creates two points for transport endpoints', () => {
    const points = buildTripMapPoints([
      item({ id: 'train', dayId: 'd1', kind: 'transport', title: 'Train', origin: 'Lisbon', location: 'Porto' })
    ], days)
    expect(points.map((point) => point.role)).toEqual(['origin', 'destination'])
  })

  it('orders same-day pins by their scheduled time across content types', () => {
    const points = buildTripMapPoints([
      item({ id: 'later-place', dayId: 'd1', kind: 'place', title: 'Later', location: 'Later', startTime: '16:45:00' }),
      item({ id: 'first-booking', dayId: 'd1', kind: 'booking', title: 'First', location: 'First', startTime: '10:30:00' }),
      item({ id: 'middle-activity', dayId: 'd1', kind: 'activity', title: 'Middle', location: 'Middle', startTime: '12:00:00' })
    ], days)
    expect(points.map((point) => point.label)).toEqual(['First', 'Middle', 'Later'])
  })

  it('draws solid daily routes and a dashed semantic transition', () => {
    const points = buildTripMapPoints([
      item({ id: 'a', dayId: 'd1', kind: 'place', title: 'A', location: 'A', latitude: 1, longitude: 2, position: 0 }),
      item({ id: 'b', dayId: 'd1', kind: 'place', title: 'B', location: 'B', latitude: 2, longitude: 3, position: 1 }),
      item({ id: 'c', dayId: 'd2', kind: 'place', title: 'C', location: 'C', latitude: 3, longitude: 4, position: 0 })
    ], days)
    const routes = buildTripMapRoutes(points, new Set(), true)
    expect(routes.map((route) => route.kind)).toEqual(['day', 'transition'])
  })

  it('does not invent transitions across filtered-out days', () => {
    const threeDays = [days[0], { ...days[0], id: 'middle', date: '2026-01-02', position: 1 }, { ...days[1], id: 'd3', date: '2026-01-03', position: 2 }]
    const points = buildTripMapPoints([
      item({ id: 'a', dayId: 'd1', kind: 'place', title: 'A', location: 'A', latitude: 1, longitude: 2 }),
      item({ id: 'c', dayId: 'd3', kind: 'place', title: 'C', location: 'C', latitude: 3, longitude: 4 })
    ], threeDays)
    expect(buildTripMapRoutes(points, new Set(), true).some((route) => route.kind === 'transition')).toBe(false)
  })
})
