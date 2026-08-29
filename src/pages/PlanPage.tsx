import { MapPin } from '@phosphor-icons/react/MapPin'
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft'
import { ArrowRight } from '@phosphor-icons/react/ArrowRight'
import { Plus } from '@phosphor-icons/react/Plus'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { TripDatePicker } from '../components/TripDatePicker'

const dateAtNoon = (date: string) => new Date(`${date}T12:00:00`)

export function PlanPage({ readOnly = false }: { readOnly?: boolean }) {
  const { tripId, shareToken, date } = useParams()
  const navigate = useNavigate()
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
    const activeDayIndex = activeDay ? days.findIndex((day) => day.id === activeDay.id) : -1
    const previousDay = activeDayIndex > 0 ? days[activeDayIndex - 1] : undefined
    const nextDay = activeDayIndex >= 0 ? days[activeDayIndex + 1] : undefined
    const selectDay = (day: typeof activeDay) => {
      if (!day) return
      setSelectedDay({ id: day.id, routeDate: day.date })
      if (readOnly && shareToken) navigate(`/share/${shareToken}?day=${day.date}`)
      else if (tripId) navigate(`/trip/${tripId}/day/${day.date}`)
    }
    const dayItems = items.filter((item) => item.dayId === activeDay?.id)
    return <>
      <div className="trip-date-picker-bar">
        <div className="trip-day-navigation">
          <button type="button" className="day-navigation-button" disabled={!previousDay} aria-label={previousDay ? `Go to Day ${(previousDay.position ?? activeDayIndex - 1) + 1}, ${format(dateAtNoon(previousDay.date), 'EEEE, MMMM d')}` : 'Already on the first day'} onClick={() => { if (previousDay) selectDay(previousDay) }}>
            <ArrowLeft aria-hidden="true" /><span>Previous day</span>
          </button>
          <TripDatePicker days={days} activeDay={activeDay} onSelect={selectDay} />
          <button type="button" className="day-navigation-button" disabled={!nextDay} aria-label={nextDay ? `Go to Day ${(nextDay.position ?? activeDayIndex + 1) + 1}, ${format(dateAtNoon(nextDay.date), 'EEEE, MMMM d')}` : 'Already on the final day'} onClick={() => { if (nextDay) selectDay(nextDay) }}>
            <span>Next day</span><ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="trip-layout-grid">
        <section className="itinerary-section" aria-labelledby="day-heading">
          <div className="day-heading"><div><p className="eyebrow">Day {(activeDay?.position ?? 0) + 1} · {activeDay ? format(dateAtNoon(activeDay.date), 'EEEE, MMMM d') : ''}</p>{activeDay?.baseLocation ? <p className="day-base-label"><MapPin aria-hidden="true" />Overnight in {activeDay.baseLocation}</p> : null}<BidiText as="h2" id="day-heading" tabIndex={-1} value={activeDay?.title ?? ''}>{activeDay?.title ?? 'Plan your first day'}</BidiText><BidiText as="p" value={activeDay?.summary ?? ''}>{activeDay?.summary}</BidiText>{editMode && activeDay ? <button className="text-action" onClick={() => { setSelectedDay({ id: activeDay.id, routeDate }); setDayEditorOpen(true) }}>Edit day details</button> : null}</div>{editMode && activeDay ? <button className="pill dark" onClick={() => { setEditing(undefined); setEditorOpen(true) }}><Plus />Add item</button> : null}</div>
          {dayItems.length ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => { if (event.over && event.active.id !== event.over.id) mutations.reorderItems.mutate({ activeId: String(event.active.id), overId: String(event.over.id), siblings: dayItems }) }}><SortableContext items={dayItems.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="journey-ribbon">{dayItems.map((item) => <SortableItineraryStop key={item.id} item={item} editMode={editMode} onEdit={() => { setEditing(item); setEditorOpen(true) }} onDuplicate={() => mutations.duplicateItem.mutate(item)} onMove={(delta) => mutations.moveItem.mutate({ item, delta, siblings: dayItems })} onDelete={() => { mutations.deleteRecord.mutate({ entity: 'item', id: item.id }); setDeletedId(item.id) }} />)}</div></SortableContext></DndContext> : <div className="empty-state"><Plus size={28} /><h3>This day is wide open.</h3><p>Add a place, a train, or simply a note to yourself.</p>{editMode ? <button className="button primary" onClick={() => setEditorOpen(true)}>Add the first item</button> : null}</div>}
        </section>
      </div>
      {!readOnly && activeDay ? <EditorDialog open={editorOpen} onOpenChange={setEditorOpen} tripId={trip.id} dayId={activeDay.id} initial={editing} defaultCurrency={trip.displayCurrency} onSave={mutations.saveItem.mutateAsync} /> : null}
      {!readOnly ? <DayEditorDialog key={`${selectedDay?.id ?? 'new'}-${dayEditorOpen}`} open={dayEditorOpen} onOpenChange={setDayEditorOpen} tripId={trip.id} day={selectedDay ? activeDay : undefined} onSave={mutations.saveDay.mutateAsync} onDelete={activeDay ? () => mutations.deleteRecord.mutate({ entity: 'day', id: activeDay.id }) : undefined} onDuplicate={activeDay ? () => { mutations.duplicateDay.mutate(activeDay); setDayEditorOpen(false) } : undefined} onMove={activeDay ? (delta) => mutations.moveDay.mutate({ day: activeDay, delta, siblings: days }) : undefined} /> : null}
      {!readOnly && deletedId ? <UndoToast message="Item deleted" onUndo={() => { mutations.restoreRecord.mutate({ entity: 'item', id: deletedId }); setDeletedId(undefined) }} onDismiss={() => setDeletedId(undefined)} /> : null}
    </>
  }}</TripLayout>
}
