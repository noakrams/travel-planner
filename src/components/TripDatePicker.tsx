import { DayPicker } from '@daypicker/react'
import { CalendarBlank } from '@phosphor-icons/react/CalendarBlank'
import { CaretDown } from '@phosphor-icons/react/CaretDown'
import { X } from '@phosphor-icons/react/X'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import type { TripDay } from '../domain/types'

const dateAtNoon = (date: string) => new Date(`${date}T12:00:00`)

export function TripDatePicker({ days, activeDay, onSelect }: { days: TripDay[]; activeDay?: TripDay; onSelect: (day: TripDay) => void }) {
  const [open, setOpen] = useState(false)
  const tripDates = useMemo(() => days.map((day) => dateAtNoon(day.date)), [days])
  const selected = activeDay ? dateAtNoon(activeDay.date) : tripDates[0]
  const start = tripDates[0]
  const end = tripDates.at(-1)
  const label = activeDay ? `Day ${(activeDay.position ?? 0) + 1} · ${format(selected, 'EEE, MMM d')}` : 'Choose a day'

  return <div className="trip-date-picker">
    <button type="button" className="trip-date-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <CalendarBlank aria-hidden="true" /><span>{label}</span><CaretDown aria-hidden="true" />
    </button>
    {open ? <>
      <button type="button" className="trip-date-scrim" aria-label="Close date picker" onClick={() => setOpen(false)} />
      <section className="trip-date-panel" role="dialog" aria-label="Choose itinerary day" aria-modal="true">
        <div className="trip-date-panel-header"><div><strong>{start && end ? `${format(start, 'MMM d')} — ${format(end, 'MMM d, yyyy')}` : 'Trip dates'}</strong><span>{days.length} days in this trip</span></div><button type="button" aria-label="Close date picker" onClick={() => setOpen(false)}><X /></button></div>
        <DayPicker
          mode="single"
          selected={selected}
          defaultMonth={selected}
          modifiers={{ trip: tripDates }}
          modifiersClassNames={{ trip: 'trip-date-in-range' }}
          onSelect={(date) => {
            if (!date) return
            const day = days.find((entry) => entry.date === format(date, 'yyyy-MM-dd'))
            if (!day) return
            onSelect(day)
            setOpen(false)
          }}
        />
      </section>
    </> : null}
  </div>
}
