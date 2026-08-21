import { CalendarPlus } from '@phosphor-icons/react/CalendarPlus'
import { MapPin } from '@phosphor-icons/react/MapPin'
import { Plus } from '@phosphor-icons/react/Plus'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { BidiText } from '../components/BidiText'
import { EditorDialog } from '../components/EditorDialog'
import { TripLayout } from '../components/TripLayout'
import { UndoToast } from '../components/UndoToast'
import type { ContentItem } from '../domain/types'
import { useTravelMutations } from '../hooks/useTravelData'
import { DayEditorDialog } from '../components/DayEditorDialog'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItineraryStop } from '../components/SortableItineraryStop'
import { groupDaysByBase } from '../domain/dayGroups'

const dateAtNoon = (date: string) => new Date(`${date}T12:00:00`)

function groupDateRange(dates: string[]) {
  const first = dateAtNoon(dates[0])
  const last = dateAtNoon(dates.at(-1) ?? dates[0])
  if (dates.length === 1) return format(first, 'MMM d')
  return first.getMonth() === last.getMonth() ? `${format(first, 'MMM d')}–${format(last, 'd')}` : `${format(first, 'MMM d')}–${format(last, 'MMM d')}`
}

export function PlanPage({ readOnly = false }: { readOnly?: boolean }) {
  const { tripId, date } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const routeDate = date ?? searchParams.get('day') ?? undefined
  const searchTarget = (location.state as { itinerarySearchTarget?: string } | null)?.itinerarySearchTarget
  const mutations = useTravelMutations(readOnly ? undefined : tripId)
  const [editing, setEditing] = useState<ContentItem | undefined>()
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<{ id: string; routeDate?: string }>()
  const [deletedId, setDeletedId] = useState<string>()
  const [dayEditorOpen, setDayEditorOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  useEffect(() => {
    if (!searchTarget) return
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(searchTarget)
      if (!target) return
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
      target.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.key, routeDate, searchTarget])
  return <TripLayout readOnly={readOnly}>{({ trip, days, items, editMode }) => {
    const manualDayId = selectedDay && selectedDay.routeDate === routeDate ? selectedDay.id : undefined
    const activeDay = days.find((day) => day.id === manualDayId) ?? days.find((day) => day.date === routeDate) ?? days[0]
    const dayItems = items.filter((item) => item.dayId === activeDay?.id)
    const routes = items.filter((item) => item.kind === 'route')
    const bookings = items.filter((item) => ['booking', 'stay', 'transport'].includes(item.kind))
    const dayGroups = groupDaysByBase(days)
    return <>
      <nav className="day-strip" aria-label="Trip days grouped by overnight base">{dayGroups.map((group) => {
        const groupActive = group.days.some((day) => day.id === activeDay?.id)
        const range = groupDateRange(group.days.map((day) => day.date))
        return <section className={`day-strip-group${groupActive ? ' active-group' : ''}`} key={`${group.label}-${group.days[0].id}`} aria-label={`${group.label} stay, ${range}`}>
          <div className="day-strip-group-label"><span><MapPin aria-hidden="true" />{group.label} stay</span><small>{range}</small></div>
          <div className="day-strip-group-days">{group.days.map((day) => {
            const active = day.id === activeDay?.id
            return <button className={active ? 'active' : ''} key={day.id} aria-current={active ? 'date' : undefined} aria-label={`${group.label} — ${format(dateAtNoon(day.date), 'EEE d — EEEE, MMMM d')}${editMode && active ? ' — tap again to edit' : ''}`} onClick={() => {
              if (editMode && active) { setSelectedDay({ id: day.id, routeDate }); setDayEditorOpen(true) }
              else setSelectedDay({ id: day.id, routeDate })
            }}><span>{format(dateAtNoon(day.date), 'EEE')}</span><strong>{format(dateAtNoon(day.date), 'd')}</strong></button>
          })}</div>
        </section>
      })}{editMode ? <button className="add-day" aria-label="Add itinerary day" onClick={() => { setSelectedDay(undefined); setDayEditorOpen(true) }}><CalendarPlus /><span>Add</span></button> : null}</nav>
      <div className="trip-layout-grid">
        <section className="itinerary-section" aria-labelledby="day-heading">
          <div className="day-heading"><div><p className="eyebrow">Day {(activeDay?.position ?? 0) + 1} · {activeDay ? format(dateAtNoon(activeDay.date), 'EEEE, MMMM d') : ''}</p>{activeDay?.baseLocation ? <p className="day-base-label"><MapPin aria-hidden="true" />Overnight in {activeDay.baseLocation}</p> : null}<BidiText as="h2" id="day-heading" tabIndex={-1} value={activeDay?.title ?? ''}>{activeDay?.title ?? 'Plan your first day'}</BidiText><BidiText as="p" value={activeDay?.summary ?? ''}>{activeDay?.summary}</BidiText>{editMode && activeDay ? <button className="text-action" onClick={() => { setSelectedDay({ id: activeDay.id, routeDate }); setDayEditorOpen(true) }}>Edit day details</button> : null}</div>{editMode && activeDay ? <button className="pill dark" onClick={() => { setEditing(undefined); setEditorOpen(true) }}><Plus />Add item</button> : null}</div>
          {dayItems.length ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => { if (event.over && event.active.id !== event.over.id) mutations.reorderItems.mutate({ activeId: String(event.active.id), overId: String(event.over.id), siblings: dayItems }) }}><SortableContext items={dayItems.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="journey-ribbon">{dayItems.map((item) => <SortableItineraryStop key={item.id} item={item} editMode={editMode} onEdit={() => { setEditing(item); setEditorOpen(true) }} onDuplicate={() => mutations.duplicateItem.mutate(item)} onMove={(delta) => mutations.moveItem.mutate({ item, delta, siblings: dayItems })} onDelete={() => { mutations.deleteRecord.mutate({ entity: 'item', id: item.id }); setDeletedId(item.id) }} />)}</div></SortableContext></DndContext> : <div className="empty-state"><Plus size={28} /><h3>This day is wide open.</h3><p>Add a place, a train, or simply a note to yourself.</p>{editMode ? <button className="button primary" onClick={() => setEditorOpen(true)}>Add the first item</button> : null}</div>}
        </section>
        <aside className="trip-aside">
          <section><p className="eyebrow">Route</p><div className="route-list">{routes.length ? routes.map((route, index) => <a key={route.id} href={route.mapsUrl} target="_blank" rel="noreferrer"><span>{index + 1}</span><div><BidiText as="strong" value={route.title}>{route.title}</BidiText><small>{route.description}</small></div></a>) : <p>Add route stops to see the journey here.</p>}</div></section>
          <section><p className="eyebrow">Next booking</p>{bookings[0] ? <><BidiText as="h3" value={bookings[0].title}>{bookings[0].title}</BidiText><p>{bookings[0].description}</p><span className="booking-status">{bookings[0].status ?? 'planned'}</span></> : <p>No upcoming booking yet.</p>}</section>
          <section className="aside-quote"><p>“The best plan leaves enough room for the place itself.”</p></section>
        </aside>
      </div>
      {!readOnly && activeDay ? <EditorDialog open={editorOpen} onOpenChange={setEditorOpen} tripId={trip.id} dayId={activeDay.id} initial={editing} defaultCurrency={trip.displayCurrency} onSave={mutations.saveItem.mutateAsync} /> : null}
      {!readOnly ? <DayEditorDialog key={`${selectedDay?.id ?? 'new'}-${dayEditorOpen}`} open={dayEditorOpen} onOpenChange={setDayEditorOpen} tripId={trip.id} day={selectedDay ? activeDay : undefined} onSave={mutations.saveDay.mutateAsync} onDelete={activeDay ? () => mutations.deleteRecord.mutate({ entity: 'day', id: activeDay.id }) : undefined} onDuplicate={activeDay ? () => { mutations.duplicateDay.mutate(activeDay); setDayEditorOpen(false) } : undefined} onMove={activeDay ? (delta) => mutations.moveDay.mutate({ day: activeDay, delta, siblings: days }) : undefined} /> : null}
      {!readOnly && deletedId ? <UndoToast message="Item deleted" onUndo={() => { mutations.restoreRecord.mutate({ entity: 'item', id: deletedId }); setDeletedId(undefined) }} onDismiss={() => setDeletedId(undefined)} /> : null}
    </>
  }}</TripLayout>
}
