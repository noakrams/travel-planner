import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CollectionPage } from './CollectionPage'
import { ToastProvider } from './ui/toast'

vi.mock('../hooks/useTravelData', () => ({
  useTravelMutations: () => ({
    duplicateItem: { mutate: vi.fn() }, moveItem: { mutate: vi.fn() }, deleteRecord: { mutate: vi.fn() },
    restoreRecord: { mutate: vi.fn() }, saveItem: { mutateAsync: vi.fn() }
  })
}))

describe('CollectionPage', () => {
  it('shows booking links in the Bookings collection', () => {
    render(<ToastProvider><CollectionPage
      trip={{ id: 'trip-japan-2026', ownerId: 'owner', title: 'Japan 2026', subtitle: '', startDate: '2026-09-18', endDate: '2026-09-30', timezone: 'Asia/Tokyo', baseCurrency: 'JPY', displayCurrency: 'JPY', budgetAmount: 0, budgetCurrency: 'JPY', categoryBudgets: {}, coverUrl: '', coverAlt: '', status: 'upcoming', shareEnabled: false, createdAt: '', updatedAt: '', version: 1 }}
      items={[{ id: 'shinkansen', tripId: 'trip-japan-2026', kind: 'transport', title: 'Tokyo → Kyoto by Shinkansen', description: 'Book on 24 Aug.', attachments: [{ id: 'klook', kind: 'link', label: 'Order via Klook Japan Rail', url: 'https://www.klook.com/japan-rail/' }], position: 0, createdAt: '', updatedAt: '', version: 1 }]}
      kinds={['booking', 'stay', 'transport']}
      title="Bookings"
      intro="Fixed plans"
      editMode={false}
    /></ToastProvider>)

    expect(screen.getByText('Tickets & booking links')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Order via Klook Japan Rail for Tokyo → Kyoto by Shinkansen' })).toHaveAttribute('href', 'https://www.klook.com/japan-rail/')
  })
})
