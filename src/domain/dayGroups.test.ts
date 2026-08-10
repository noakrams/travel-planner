import { describe, expect, it } from 'vitest'
import { groupDaysByBase } from './dayGroups'
import type { TripDay } from './types'

const day = (id: string, baseLocation?: string): TripDay => ({
  id, tripId: 'trip-japan-2026', date: `2026-09-${id.padStart(2, '0')}`, title: id,
  summary: '', baseLocation, position: Number(id), createdAt: '', updatedAt: '', version: 1
})

describe('groupDaysByBase', () => {
  it('groups consecutive days by where the travelers sleep', () => {
    const groups = groupDaysByBase([day('18', 'Tokyo'), day('19', 'Tokyo'), day('20', 'Kyoto')])
    expect(groups.map((group) => [group.label, group.days.map((entry) => entry.id)])).toEqual([
      ['Tokyo', ['18', '19']], ['Kyoto', ['20']]
    ])
  })

  it('keeps separate travel blocks when a city appears again later', () => {
    const groups = groupDaysByBase([day('18', 'Tokyo'), day('19', 'Kyoto'), day('20', 'Tokyo')])
    expect(groups.map((group) => group.label)).toEqual(['Tokyo', 'Kyoto', 'Tokyo'])
  })
})
