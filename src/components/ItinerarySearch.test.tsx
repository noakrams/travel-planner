import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ContentItem, TripDay } from '../domain/types'
import { ItinerarySearch } from './ItinerarySearch'

const base = {
  createdAt: '2026-08-21T00:00:00.000Z',
  updatedAt: '2026-08-21T00:00:00.000Z',
  version: 1
}

const days: TripDay[] = [
  { ...base, id: 'day-1', tripId: 'trip-japan', date: '2026-09-20', title: 'Harajuku by day', summary: 'A neighborhood walk.', position: 0 },
  { ...base, id: 'day-2', tripId: 'trip-japan', date: '2026-09-21', title: 'Art and Ginza', summary: 'The immersive-art centrepiece.', position: 1 }
]

const items: ContentItem[] = [
  { ...base, id: 'teamlab', tripId: 'trip-japan', dayId: 'day-2', kind: 'booking', title: 'teamLab Borderless', description: 'Mapless immersive galleries.', startTime: '14:00', location: 'Azabudai Hills', status: 'booked', position: 0 },
  { ...base, id: 'walk', tripId: 'trip-japan', dayId: 'day-1', kind: 'activity', title: 'Takeshita Street walk', description: 'Explore Harajuku.', startTime: '11:00', position: 0 }
]

describe('ItinerarySearch', () => {
  it('finds an itinerary item and returns its day', async () => {
    const onSelect = vi.fn()
    render(<ItinerarySearch days={days} items={items} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: 'Search trip' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search trip' }), 'teamlab')
    await userEvent.click(screen.getByRole('button', { name: 'Open teamLab Borderless on Monday, September 21' }))

    expect(onSelect).toHaveBeenCalledWith(days[1], items[0])
  })

  it('matches item categories and gives a useful empty state', async () => {
    render(<ItinerarySearch days={days} items={items} onSelect={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Search trip' }))
    const search = screen.getByRole('searchbox', { name: 'Search trip' })

    await userEvent.type(search, 'activity')
    expect(screen.getByRole('button', { name: 'Open Takeshita Street walk on Sunday, September 20' })).toBeVisible()

    await userEvent.clear(search)
    await userEvent.type(search, 'aquarium')
    expect(screen.getByText(/Nothing in the plan matches/)).toHaveTextContent('aquarium')
    expect(screen.getByText(/Try a shorter name/)).toBeVisible()
  })
})
