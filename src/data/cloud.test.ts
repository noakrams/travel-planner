import { describe, expect, it } from 'vitest'
import { commonItem } from './cloud'

describe('commonItem', () => {
  it('restores a specialized item with its editable day fields', () => {
    expect(commonItem({
      id: 'japan-shibuya-sky', trip_id: 'trip-japan-2026', day_id: 'day-japan-2',
      title: 'Shibuya Sky at sunset', notes: 'Open-air views', start_time: '16:45:00',
      location_name: 'Shibuya Scramble Square', display_status: 'booked', position: 3,
      created_at: '2026-08-07T00:00:00.000Z', updated_at: '2026-08-07T00:00:00.000Z', version: 2
    }, 'booking')).toMatchObject({
      dayId: 'day-japan-2', startTime: '16:45:00', location: 'Shibuya Scramble Square', status: 'booked'
    })
  })
})
