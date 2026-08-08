import { describe, expect, it } from 'vitest'
import { buildBudgetBreakdown } from './budget'
import type { ContentItem, Trip } from './types'

const base = { id: 'x', createdAt: '', updatedAt: '', version: 1 }
const trip: Trip = {
  ...base,
  ownerId: 'owner',
  title: 'Japan',
  subtitle: '',
  startDate: '2026-09-01',
  endDate: '2026-09-10',
  timezone: 'Asia/Tokyo',
  baseCurrency: 'JPY',
  displayCurrency: 'ILS',
  budgetAmount: 100_000,
  budgetCurrency: 'JPY',
  categoryBudgets: { accommodation: 50_000, activities: 20_000 },
  coverUrl: '',
  coverAlt: '',
  status: 'upcoming',
  shareEnabled: false
}

describe('budget breakdown', () => {
  it('converts mixed item currencies and keeps explicit categories', () => {
    const items: ContentItem[] = [
      { ...base, tripId: trip.id, kind: 'stay', title: 'Hotel', description: '', position: 0, plannedAmount: 10_000, currency: 'JPY' },
      { ...base, tripId: trip.id, kind: 'activity', title: 'Museum', description: '', position: 1, plannedAmount: 10, currency: 'USD', budgetCategory: 'shopping' }
    ]
    const result = buildBudgetBreakdown(items, trip, 'ILS')
    expect(result.find((entry) => entry.category === 'accommodation')?.cost).toBeCloseTo(188.59, 2)
    expect(result.find((entry) => entry.category === 'shopping')?.cost).toBeCloseTo(30.73, 2)
    expect(result.find((entry) => entry.category === 'accommodation')?.limit).toBeCloseTo(942.95, 2)
  })
})
