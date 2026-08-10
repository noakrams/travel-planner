import type { TripDay } from './types'

export interface DayGroup {
  label: string
  days: TripDay[]
}

export function groupDaysByBase(days: TripDay[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const day of days) {
    const label = day.baseLocation?.trim() || 'Base not set'
    const previous = groups.at(-1)
    if (previous?.label === label) previous.days.push(day)
    else groups.push({ label, days: [day] })
  }
  return groups
}
