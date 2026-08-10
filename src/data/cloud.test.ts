import { describe, expect, it } from 'vitest'
import { commonItem, remoteDay } from './cloud'

describe('commonItem', () => {
  it('restores a specialized item with its editable day fields', () => {
    expect(commonItem({
      id: 'japan-shibuya-sky', trip_id: 'trip-japan-2026', day_id: 'day-japan-2',
      title: 'Shibuya Sky at sunset', notes: 'Open-air views', start_time: '16:45:00',
      location_name: 'Shibuya Scramble Square', display_status: 'booked',
      email_url: 'https://mail.google.com/mail/u/0/#inbox/example', position: 3,
      attachments: [{ id: 'voucher', kind: 'file', label: 'Hotel voucher', url: 'https://example.com/voucher.pdf' }],
      created_at: '2026-08-07T00:00:00.000Z', updated_at: '2026-08-07T00:00:00.000Z', version: 2
    }, 'booking')).toMatchObject({
      dayId: 'day-japan-2', startTime: '16:45:00', location: 'Shibuya Scramble Square', status: 'booked',
      emailUrl: 'https://mail.google.com/mail/u/0/#inbox/example',
      attachments: [{ id: 'voucher', kind: 'file', label: 'Hotel voucher', url: 'https://example.com/voucher.pdf' }]
    })
  })
})

describe('remoteDay', () => {
  it('restores the overnight base used for itinerary grouping', () => {
    expect(remoteDay({
      id: 'day-japan-7', trip_id: 'trip-japan-2026', date: '2026-09-24', title: 'Tokyo to Kyoto',
      summary: '', base_location: 'Kyoto', position: 6, created_at: '2026-08-07T00:00:00.000Z',
      updated_at: '2026-08-07T00:00:00.000Z', version: 2
    })).toMatchObject({ baseLocation: 'Kyoto' })
  })
})
