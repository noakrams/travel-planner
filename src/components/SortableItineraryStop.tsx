import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical } from '@phosphor-icons/react/DotsSixVertical'
import type { ContentItem } from '../domain/types'
import { ItineraryCard } from './ItineraryCard'

export function SortableItineraryStop({ item, editMode, onEdit, onDuplicate, onMove, onDelete }: {
  item: ContentItem; editMode: boolean; onEdit: () => void; onDuplicate: () => void; onMove: (delta: -1 | 1) => void; onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !editMode })
  return <div ref={setNodeRef} className={`journey-stop ${isDragging ? 'is-dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
    <div className="journey-time">{item.startTime ?? '—'}</div><div className="journey-node" aria-hidden="true" />
    <div className="sortable-card-wrap">{editMode ? <button className="drag-handle" {...attributes} {...listeners} aria-label={`Reorder ${item.title}`}><DotsSixVertical size={22} /></button> : null}<ItineraryCard item={item} editMode={editMode} onEdit={onEdit} onDuplicate={onDuplicate} onMove={onMove} onDelete={onDelete} /></div>
  </div>
}
