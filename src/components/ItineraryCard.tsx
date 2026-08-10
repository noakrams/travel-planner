import { ArrowSquareOut } from '@phosphor-icons/react/ArrowSquareOut'
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple'
import { LinkSimple } from '@phosphor-icons/react/LinkSimple'
import { MapPin } from '@phosphor-icons/react/MapPin'
import { MapTrifold } from '@phosphor-icons/react/MapTrifold'
import { Paperclip } from '@phosphor-icons/react/Paperclip'
import { BidiText } from './BidiText'
import { ItemActions } from './ItemActions'
import type { ContentItem } from '../domain/types'
import { CachedImage } from './CachedImage'
import { formatCurrency, inferBudgetCategory } from '../domain/currency'
import { budgetCategoryLabels } from '../domain/types'

export function ItineraryCard({ item, editMode, onEdit, onDuplicate, onMove, onDelete }: {
  item: ContentItem; editMode: boolean; onEdit: () => void; onDuplicate: () => void; onMove: (delta: -1 | 1) => void; onDelete: () => void
}) {
  const attachments = item.attachments?.length
    ? item.attachments
    : item.emailUrl ? [{ id: 'legacy-email', kind: 'email' as const, label: 'Confirmation email', url: item.emailUrl }] : []
  return <article className={`itinerary-card card-${item.kind}`}>
    {item.imageUrl ? <div className="card-image"><CachedImage src={item.imageUrl} alt={item.imageAlt ?? ''} width="1200" height="780" loading={item.position === 0 ? 'eager' : 'lazy'} /></div> : null}
    <div className="card-body">
      <div className="card-kicker"><span>{item.startTime ?? item.kind}</span>{item.status ? <span className="status-dot">{item.status}</span> : null}</div>
      <BidiText as="h3" value={item.title}>{item.title}</BidiText>
      <BidiText as="p" value={item.description}>{item.description}</BidiText>
      <div className="card-footer"><div className="card-links">{item.location || item.mapsUrl ? <div className="card-location"><div className="card-address"><MapPin size={17} aria-hidden="true" />{item.location ? <BidiText value={item.location}>{item.location}</BidiText> : <span>Location</span>}</div>{item.mapsUrl ? <a className="card-map-link" href={item.mapsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.location || item.title} in Google Maps`}><MapTrifold size={17} aria-hidden="true" /><span>Google Maps</span><ArrowSquareOut size={15} aria-hidden="true" /></a> : null}</div> : null}{attachments.length ? <div className="card-documents"><span className="card-documents-label"><Paperclip size={15} aria-hidden="true" />Confirmations &amp; tickets</span><div className="card-attachments" aria-label={`Reservation confirmations and tickets for ${item.title}`}>{attachments.map((attachment) => <a key={attachment.id} className="card-attachment-link" href={attachment.url} target="_blank" rel="noreferrer" aria-label={`Open ${attachment.label} for ${item.title}`}>{attachment.kind === 'email' ? <EnvelopeSimple size={17} aria-hidden="true" /> : attachment.kind === 'file' ? <Paperclip size={17} aria-hidden="true" /> : <LinkSimple size={17} aria-hidden="true" />}<span>{attachment.label}</span><ArrowSquareOut size={15} aria-hidden="true" /></a>)}</div></div> : null}</div>{item.plannedAmount !== undefined && item.currency ? <span className="card-cost"><small>{budgetCategoryLabels[inferBudgetCategory(item)]}</small>{formatCurrency(item.plannedAmount, item.currency)}</span> : null}</div>
    </div>
    {editMode ? <ItemActions item={item} onEdit={onEdit} onDuplicate={onDuplicate} onMove={onMove} onDelete={onDelete} /> : null}
  </article>
}
