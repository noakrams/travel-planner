import { ArrowSquareOut } from '@phosphor-icons/react/ArrowSquareOut'
import { MapPin } from '@phosphor-icons/react/MapPin'
import { BidiText } from './BidiText'
import { ItemActions } from './ItemActions'
import type { ContentItem } from '../domain/types'
import { CachedImage } from './CachedImage'

export function ItineraryCard({ item, editMode, onEdit, onDuplicate, onMove, onDelete }: {
  item: ContentItem; editMode: boolean; onEdit: () => void; onDuplicate: () => void; onMove: (delta: -1 | 1) => void; onDelete: () => void
}) {
  return <article className={`itinerary-card card-${item.kind}`}>
    {item.imageUrl ? <div className="card-image"><CachedImage src={item.imageUrl} alt={item.imageAlt ?? ''} width="1200" height="780" loading={item.position === 0 ? 'eager' : 'lazy'} /></div> : null}
    <div className="card-body">
      <div className="card-kicker"><span>{item.startTime ?? item.kind}</span>{item.status ? <span className="status-dot">{item.status}</span> : null}</div>
      <BidiText as="h3" value={item.title}>{item.title}</BidiText>
      <BidiText as="p" value={item.description}>{item.description}</BidiText>
      {item.location ? <div className="card-location"><MapPin size={17} aria-hidden="true" /><BidiText value={item.location}>{item.location}</BidiText>{item.mapsUrl ? <a href={item.mapsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.location} in Google Maps`}><ArrowSquareOut size={17} /></a> : null}</div> : null}
    </div>
    {editMode ? <ItemActions item={item} onEdit={onEdit} onDuplicate={onDuplicate} onMove={onMove} onDelete={onDelete} /> : null}
  </article>
}
