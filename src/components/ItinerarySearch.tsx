import { CalendarBlank } from '@phosphor-icons/react/CalendarBlank'
import { Clock } from '@phosphor-icons/react/Clock'
import { MagnifyingGlass } from '@phosphor-icons/react/MagnifyingGlass'
import { MapPin } from '@phosphor-icons/react/MapPin'
import { X } from '@phosphor-icons/react/X'
import { format } from 'date-fns'
import { useDeferredValue, useId, useMemo, useState } from 'react'
import { contentKindLabels, type ContentItem, type TripDay } from '../domain/types'
import { BidiText } from './BidiText'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

const dateAtNoon = (date: string) => new Date(`${date}T12:00:00`)

function searchable(value: string | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
}

type SearchResult =
  | { key: string; type: 'day'; day: TripDay }
  | { key: string; type: 'item'; day: TripDay; item: ContentItem }

function resultScore(result: SearchResult, query: string) {
  const title = searchable(result.type === 'item' ? result.item.title : result.day.title)
  if (title === query) return 0
  if (title.startsWith(query)) return 1
  if (title.includes(query)) return 2
  return 3
}

export function ItinerarySearch({ days, items, onSelect }: {
  days: TripDay[]
  items: ContentItem[]
  onSelect: (day: TripDay, item?: ContentItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputId = useId()
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = searchable(deferredQuery.trim())

  const results = useMemo(() => {
    if (!normalizedQuery) return []
    const dayById = new Map(days.map((day) => [day.id, day]))
    const matches: SearchResult[] = []

    for (const day of days) {
      const haystack = searchable([day.title, day.summary, day.baseLocation, day.date, format(dateAtNoon(day.date), 'EEEE MMMM d yyyy')].filter(Boolean).join(' '))
      if (haystack.includes(normalizedQuery)) matches.push({ key: `day-${day.id}`, type: 'day', day })
    }

    for (const item of items) {
      const day = item.dayId ? dayById.get(item.dayId) : undefined
      if (!day) continue
      const haystack = searchable([
        item.title,
        item.description,
        item.location,
        item.provider,
        item.status,
        contentKindLabels[item.kind]
      ].filter(Boolean).join(' '))
      if (haystack.includes(normalizedQuery)) matches.push({ key: `item-${item.id}`, type: 'item', day, item })
    }

    return matches
      .sort((left, right) => resultScore(left, normalizedQuery) - resultScore(right, normalizedQuery) || left.day.position - right.day.position)
      .slice(0, 30)
  }, [days, items, normalizedQuery])

  const selectResult = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    onSelect(result.day, result.type === 'item' ? result.item : undefined)
  }

  return <>
    <button className="pill glass search-trigger" aria-label="Search trip" onClick={() => setOpen(true)}><MagnifyingGlass size={18} /><span>Search trip</span></button>
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setQuery('') }}>
      <DialogContent className="itinerary-search-dialog" aria-label="Search trip itinerary">
        <DialogHeader>
          <DialogTitle>Find it in the trip</DialogTitle>
          <DialogDescription>Search activities, places, bookings, notes, or a day in the plan.</DialogDescription>
        </DialogHeader>
        <div className="itinerary-search-field">
          <MagnifyingGlass aria-hidden="true" />
          <label className="sr-only" htmlFor={inputId}>Search trip</label>
          <input id={inputId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “teamLab” or “activity”" autoComplete="off" autoFocus />
          {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X aria-hidden="true" /></button> : null}
        </div>
        <div className="itinerary-search-status" role="status" aria-live="polite">
          {normalizedQuery ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}` : 'Type to search the whole trip'}
        </div>
        <div className="itinerary-search-results">
          {!normalizedQuery ? <div className="itinerary-search-prompt"><MagnifyingGlass aria-hidden="true" /><p>Where was that place?</p><span>Start typing and the plan will point you to the right day.</span></div> : null}
          {normalizedQuery && !results.length ? <div className="itinerary-search-prompt"><CalendarBlank aria-hidden="true" /><p>Nothing in the plan matches “{deferredQuery.trim()}”.</p><span>Try a shorter name, location, or category like booking or food.</span></div> : null}
          {results.map((result) => {
            const dayLabel = `Day ${result.day.position + 1} · ${format(dateAtNoon(result.day.date), 'EEE, MMM d')}`
            const title = result.type === 'item' ? result.item.title : result.day.title
            return <button key={result.key} type="button" className="itinerary-search-result" onClick={() => selectResult(result)} aria-label={`Open ${title} on ${format(dateAtNoon(result.day.date), 'EEEE, MMMM d')}`}>
              <span className="search-result-date"><CalendarBlank aria-hidden="true" />{dayLabel}</span>
              <BidiText as="strong" value={title}>{title}</BidiText>
              <span className="search-result-meta">
                {result.type === 'item' ? <><span>{contentKindLabels[result.item.kind]}</span>{result.item.startTime ? <span><Clock aria-hidden="true" />{result.item.startTime}</span> : null}{result.item.location ? <span><MapPin aria-hidden="true" /><BidiText value={result.item.location}>{result.item.location}</BidiText></span> : null}</> : <span>{result.day.summary || 'Open this day in the plan'}</span>}
              </span>
            </button>
          })}
        </div>
      </DialogContent>
    </Dialog>
  </>
}
