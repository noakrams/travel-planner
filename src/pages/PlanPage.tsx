import { CalendarPlus } from '@phosphor-icons/react/CalendarPlus'
import { Plus } from '@phosphor-icons/react/Plus'
import { format } from 'date-fns'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
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

export function PlanPage({ readOnly = false }: { readOnly?: boolean }) {
  const { tripId } = useParams()
  const mutations = useTravelMutations(readOnly ? undefined : tripId)
  const [editing, setEditing] = useState<ContentItem | undefined>()
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string>()
  const [deletedId, setDeletedId] = useState<string>()
  const [dayEditorOpen, setDayEditorOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  return <TripLayout readOnly={readOnly}>{({ trip, days, items, editMode }) => {
    const activeDay = days.find((day) => day.id === selectedDay) ?? days[0]
    const dayItems = items.filter((item) => item.dayId === activeDay?.id)
    const routes = items.filter((item) => item.kind === 'route')
    const bookings = items.filter((item) => ['booking', 'stay', 'transport'].includes(item.kind))
    return <>
      <div className="day-strip" aria-label="Trip days">{days.map((day) => {
        const active = day.id === activeDay?.id
        return <button className={active ? 'active' : ''} key={day.id} aria-label={`${format(new Date(`${day.date}T12:00:00`), 'EEE d — EEEE, MMMM d')}${editMode && active ? ' — tap again to edit' : ''}`} onClick={() => {
          if (editMode && active) { setSelectedDay(day.id); setDayEditorOpen(true) }
          else setSelectedDay(day.id)
        }}><span>{format(new Date(`${day.date}T12:00:00`), 'EEE')}</span><strong>{format(new Date(`${day.date}T12:00:00`), 'd')}</strong></button>
      })}{editMode ? <button className="add-day" onClick={() => { setSelectedDay(undefined); setDayEditorOpen(true) }}><CalendarPlus /><span>Add</span></button> : null}</div>
      <div className="trip-layout-grid">
        <section className="itinerary-section" aria-labelledby="day-heading">
          <div className="day-heading"><div><p className="eyebrow">Day {(activeDay?.position ?? 0) + 1} · {activeDay ? format(new Date(`${activeDay.date}T12:00:00`), 'EEEE, MMMM d') : ''}</p><BidiText as="h2" id="day-heading" value={activeDay?.title ?? ''}>{activeDay?.title ?? 'Plan your first day'}</BidiText><BidiText as="p" value={activeDay?.summary ?? ''}>{activeDay?.summary}</BidiText>{editMode && activeDay ? <button className="text-action" onClick={() => { setSelectedDay(activeDay.id); setDayEditorOpen(true) }}>Edit day details</button> : null}</div>{editMode && activeDay ? <button className="pill dark" onClick={() => { setEditing(undefined); setEditorOpen(true) }}><Plus />Add item</button> : null}</div>
          {dayItems.length ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => { if (event.over && event.active.id !== event.over.id) mutations.reorderItems.mutate({ activeId: String(event.active.id), overId: String(event.over.id), siblings: dayItems }) }}><SortableContext items={dayItems.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="journey-ribbon">{dayItems.map((item) => <SortableItineraryStop key={item.id} item={item} editMode={editMode} onEdit={() => { setEditing(item); setEditorOpen(true) }} onDuplicate={() => mutations.duplicateItem.mutate(item)} onMove={(delta) => mutations.moveItem.mutate({ item, delta, siblings: dayItems })} onDelete={() => { mutations.deleteRecord.mutate({ entity: 'item', id: item.id }); setDeletedId(item.id) }} />)}</div></SortableContext></DndContext> : <div className="empty-state"><Plus size={28} /><h3>This day is wide open.</h3><p>Add a place, a train, or simply a note to yourself.</p>{editMode ? <button className="button primary" onClick={() => setEditorOpen(true)}>Add the first item</button> : null}</div>}
        </section>
        <aside className="trip-aside">
          <section><p className="eyebrow">Route</p><div className="route-list">{routes.length ? routes.map((route, index) => <a key={route.id} href={route.mapsUrl} target="_blank" rel="noreferrer"><span>{index + 1}</span><div><BidiText as="strong" value={route.title}>{route.title}</BidiText><small>{route.description}</small></div></a>) : <p>Add route stops to see the journey here.</p>}</div></section>
          <section><p className="eyebrow">Next booking</p>{bookings[0] ? <><BidiText as="h3" value={bookings[0].title}>{bookings[0].title}</BidiText><p>{bookings[0].description}</p><span className="booking-status">{bookings[0].status ?? 'planned'}</span></> : <p>No upcoming booking yet.</p>}</section>
          <section className="aside-quote"><p>“The best plan leaves enough room for the place itself.”</p></section>
        </aside>
      </div>
      {!readOnly && activeDay ? <EditorDialog open={editorOpen} onOpenChange={setEditorOpen} tripId={trip.id} dayId={activeDay.id} initial={editing} defaultCurrency={trip.displayCurrency} onSave={mutations.saveItem.mutateAsync} /> : null}
      {!readOnly ? <DayEditorDialog key={`${selectedDay ?? 'new'}-${dayEditorOpen}`} open={dayEditorOpen} onOpenChange={setDayEditorOpen} tripId={trip.id} day={selectedDay ? activeDay : undefined} onSave={mutations.saveDay.mutateAsync} onDelete={activeDay ? () => mutations.deleteRecord.mutate({ entity: 'day', id: activeDay.id }) : undefined} onDuplicate={activeDay ? () => { mutations.duplicateDay.mutate(activeDay); setDayEditorOpen(false) } : undefined} onMove={activeDay ? (delta) => mutations.moveDay.mutate({ day: activeDay, delta, siblings: days }) : undefined} /> : null}
      {!readOnly && deletedId ? <UndoToast message="Item deleted" onUndo={() => { mutations.restoreRecord.mutate({ entity: 'item', id: deletedId }); setDeletedId(undefined) }} onDismiss={() => setDeletedId(undefined)} /> : null}
    </>
  }}</TripLayout>
}
