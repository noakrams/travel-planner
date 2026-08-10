import { describe, expect, it } from 'vitest'
import { attachRemoteMedia, commonItem, remoteDay, remoteTrip } from './cloud'
import type { ContentItem, MediaRecord } from '../domain/types'

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

describe('remote media', () => {
  const timestamp = '2026-08-10T00:00:00.000Z'
  const media: MediaRecord[] = [{
    id: 'japan-cover', tripId: 'trip-japan-2026', sourceType: 'external',
    externalUrl: 'https://images.example/fuji.jpg', altText: 'Mount Fuji above a lake', caption: '',
    position: 0, createdAt: timestamp, updatedAt: timestamp, version: 1
  }, {
    id: 'akihabara-photo', tripId: 'trip-japan-2026', itemId: 'japan-akihabara', sourceType: 'external',
    externalUrl: 'https://images.example/akihabara.jpg', altText: 'Akihabara at night', caption: '',
    position: 0, createdAt: timestamp, updatedAt: timestamp, version: 1
  }]

  it('uses the trip cover selected in Supabase', () => {
    expect(remoteTrip({
      id: 'trip-japan-2026', owner_id: 'owner', title: 'Japan 2026', start_date: '2026-09-18',
      end_date: '2026-10-02', display_currency: 'JPY', cover_photo_id: 'japan-cover',
      created_at: timestamp, updated_at: timestamp, version: 1
    }, media)).toMatchObject({
      coverUrl: 'https://images.example/fuji.jpg', coverAlt: 'Mount Fuji above a lake'
    })
  })

  it('attaches the first media record to its activity card', () => {
    const item = commonItem({
      id: 'japan-akihabara', trip_id: 'trip-japan-2026', title: 'Akihabara Electric Town',
      position: 2, created_at: timestamp, updated_at: timestamp, version: 1
    }, 'activity') as ContentItem
    expect(attachRemoteMedia([item], media)[0]).toMatchObject({
      imageUrl: 'https://images.example/akihabara.jpg', imageAlt: 'Akihabara at night'
    })
  })
})
