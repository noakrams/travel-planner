import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { TripLayout } from './TripLayout'

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ isLoading: false, data: { trip: { id: 'trip-test' } } })
}))
vi.mock('../hooks/useOwnerAccess', () => ({ useOwnerAccess: () => 'signed-out' }))
vi.mock('../hooks/useSync', () => ({
  useSync: () => ({ state: 'attention', error: 'Sign in to save changes to the cloud.', retry: vi.fn() })
}))
vi.mock('../hooks/useTravelData', () => ({ useTrip: vi.fn() }))
vi.mock('./TripHeader', () => ({ TripHeader: () => <header>Trip header</header> }))
vi.mock('./BottomNav', () => ({ BottomNav: () => <nav>Trip navigation</nav> }))

it('opens Google owner sign-in directly from the sync warning', async () => {
  render(
    <MemoryRouter initialEntries={['/trip/trip-test']}>
      <Routes>
        <Route path="/trip/:tripId" element={<TripLayout>{() => <p>Trip plan</p>}</TripLayout>} />
      </Routes>
    </MemoryRouter>
  )

  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(screen.getByRole('dialog', { name: 'Edit as Noa' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
})
