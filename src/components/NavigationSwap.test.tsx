import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Trip } from '../domain/types'
import { BottomNav } from './BottomNav'
import { TripActions } from './TripActions'
import { TripHeader } from './TripHeader'

const trip: Trip = {
  id: 'trip-test',
  ownerId: 'owner',
  title: 'Japan 2026',
  subtitle: 'Tokyo, Kyoto, and back again',
  startDate: '2026-09-01',
  endDate: '2026-09-10',
  timezone: 'Asia/Tokyo',
  baseCurrency: 'JPY',
  displayCurrency: 'ILS',
  budgetAmount: 100_000,
  budgetCurrency: 'JPY',
  categoryBudgets: {},
  coverUrl: '',
  coverAlt: '',
  status: 'upcoming',
  shareEnabled: false,
  createdAt: '',
  updatedAt: '',
  version: 1
}

const headerProps = {
  trip,
  days: [],
  items: [],
  editMode: false,
  onToggleEdit: vi.fn(),
  onSearchSelect: vi.fn()
}

describe('Trips and More navigation swap', () => {
  it('puts More in the primary tab bar for the current trip', () => {
    render(
      <MemoryRouter initialEntries={['/trip/trip-test/more']}>
        <Routes>
          <Route path="/trip/:tripId/*" element={<BottomNav />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'More' })).toHaveAttribute(
      'href',
      '/trip/trip-test/more'
    )
    expect(screen.getByRole('link', { name: 'More' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Trips' })).not.toBeInTheDocument()
  })

  it('puts Trips in the sticky trip actions', () => {
    render(<TripActions {...headerProps} />)

    expect(screen.getByRole('link', { name: 'Trips' })).toHaveAttribute('href', '#/')
    expect(screen.queryByRole('link', { name: 'More' })).not.toBeInTheDocument()
  })

  it('puts Trips in the compact map header action', () => {
    render(<TripHeader {...headerProps} compact />)

    expect(screen.getByRole('link', { name: 'Trips' })).toHaveAttribute('href', '#/')
    expect(screen.queryByRole('link', { name: 'More and trip settings' })).not.toBeInTheDocument()
  })

  it('does not offer editing from a read-only shared trip', () => {
    render(<TripHeader {...headerProps} readOnly />)

    expect(screen.queryByRole('button', { name: /edit trip/i })).not.toBeInTheDocument()
  })
})
