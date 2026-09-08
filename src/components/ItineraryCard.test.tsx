import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ItineraryCard } from './ItineraryCard'

describe('ItineraryCard', () => {
  it('separates Google Maps from reservation confirmations and tickets', () => {
    render(
      <ItineraryCard
        item={{
          id: 'tour',
          tripId: 'trip-japan-2026',
          dayId: 'day-japan-2',
          kind: 'booking',
          title: 'Tokyo Highlights Tour',
          description: 'Meet at Hachikō.',
          startTime: '10:30',
          location: 'Hachikō Square',
          mapsUrl: 'https://maps.google.com/example',
          attachments: [
            {
              id: 'confirmation',
              kind: 'email',
              label: 'Confirmation email',
              url: 'https://mail.google.com/mail/u/0/#inbox/example'
            }
          ],
          position: 0,
          createdAt: '2026-08-10T00:00:00.000Z',
          updatedAt: '2026-08-10T00:00:00.000Z',
          version: 1
        }}
        editMode={false}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(
      screen.getByRole('link', { name: 'Open Confirmation email for Tokyo Highlights Tour' })
    ).toHaveAttribute('href', 'https://mail.google.com/mail/u/0/#inbox/example')
    expect(screen.getByText('Confirmations & tickets')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Open Hachikō Square in Google Maps' })
    ).toHaveTextContent('Google Maps')
    expect(
      screen.getByRole('link', { name: 'Open Hachikō Square in Google Maps' })
    ).toHaveAttribute('href', 'https://maps.google.com/example')
  })

  it('shows the mobile fallback for every Gmail message link', async () => {
    const user = userEvent.setup()
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'
    })

    render(
      <ItineraryCard
        item={{
          id: 'flight',
          tripId: 'trip-japan-2026',
          dayId: 'day-japan-1',
          kind: 'transport',
          title: 'Land at Narita Airport',
          description: 'Arrive.',
          attachments: [
            {
              id: 'ticket',
              kind: 'email',
              label: 'Electronic ticket email',
              url: 'https://mail.google.com/mail/u/0/#inbox/example'
            }
          ],
          position: 0,
          createdAt: '2026-08-10T00:00:00.000Z',
          updatedAt: '2026-08-10T00:00:00.000Z',
          version: 1
        }}
        editMode={false}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Open Electronic ticket email for Land at Narita Airport'
      })
    )
    expect(screen.getByRole('dialog', { name: 'Open this email' })).toHaveTextContent(
      'Gmail’s mobile app cannot open a saved link to one specific message'
    )
    expect(screen.getByRole('link', { name: 'Open in browser' })).toHaveAttribute(
      'href',
      'https://mail.google.com/mail/u/0/#inbox/example'
    )
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent })
  })

  it('shows the fallback on Android instead of opening Gmail’s general inbox', () => {
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile'
    })

    render(
      <ItineraryCard
        item={{
          id: 'flight',
          tripId: 'trip-japan-2026',
          dayId: 'day-japan-1',
          kind: 'transport',
          title: 'Land at Narita Airport',
          description: 'Arrive.',
          attachments: [
            {
              id: 'ticket',
              kind: 'email',
              label: 'Electronic ticket email',
              url: 'https://mail.google.com/mail/u/0/#inbox/example'
            }
          ],
          position: 0,
          createdAt: '2026-08-10T00:00:00.000Z',
          updatedAt: '2026-08-10T00:00:00.000Z',
          version: 1
        }}
        editMode={false}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', {
        name: 'Open Electronic ticket email for Land at Narita Airport'
      })
    ).toBeInTheDocument()
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent })
  })
})
