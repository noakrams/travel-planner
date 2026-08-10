import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ItineraryCard } from './ItineraryCard'

describe('ItineraryCard', () => {
  it('separates Google Maps from reservation confirmations and tickets', () => {
    render(<ItineraryCard
      item={{
        id: 'tour', tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind: 'booking',
        title: 'Tokyo Highlights Tour', description: 'Meet at Hachikō.', startTime: '10:30',
        location: 'Hachikō Square', mapsUrl: 'https://maps.google.com/example',
        attachments: [{ id: 'confirmation', kind: 'email', label: 'Confirmation email', url: 'https://mail.google.com/mail/u/0/#inbox/example' }], position: 0,
        createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z', version: 1
      }}
      editMode={false}
      onEdit={vi.fn()}
      onDuplicate={vi.fn()}
      onMove={vi.fn()}
      onDelete={vi.fn()}
    />)

    expect(screen.getByRole('link', { name: 'Open Confirmation email for Tokyo Highlights Tour' })).toHaveAttribute(
      'href',
      'https://mail.google.com/mail/u/0/#inbox/example'
    )
    expect(screen.getByText('Confirmations & tickets')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Hachikō Square in Google Maps' })).toHaveTextContent('Google Maps')
    expect(screen.getByRole('link', { name: 'Open Hachikō Square in Google Maps' })).toHaveAttribute('href', 'https://maps.google.com/example')
  })
})
