import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ItineraryCard } from './ItineraryCard'

describe('ItineraryCard', () => {
  it('opens a linked source email from the plan item', () => {
    render(<ItineraryCard
      item={{
        id: 'tour', tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind: 'booking',
        title: 'Tokyo Highlights Tour', description: 'Meet at Hachikō.', startTime: '10:30',
        emailUrl: 'https://mail.google.com/mail/u/0/#inbox/example', position: 0,
        createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z', version: 1
      }}
      editMode={false}
      onEdit={vi.fn()}
      onDuplicate={vi.fn()}
      onMove={vi.fn()}
      onDelete={vi.fn()}
    />)

    expect(screen.getByRole('link', { name: 'Open linked email for Tokyo Highlights Tour' })).toHaveAttribute(
      'href',
      'https://mail.google.com/mail/u/0/#inbox/example'
    )
  })
})
