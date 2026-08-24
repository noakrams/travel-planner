import { ArrowSquareOut } from '@phosphor-icons/react/ArrowSquareOut'
import { PencilSimple } from '@phosphor-icons/react/PencilSimple'
import { House } from '@phosphor-icons/react/House'
import { Check } from '@phosphor-icons/react/Check'
import { format } from 'date-fns'
import type { ContentItem, Trip, TripDay } from '../domain/types'
import { BidiText } from './BidiText'
import { ItinerarySearch } from './ItinerarySearch'
import { SyncBadge } from './SyncBadge'

export function TripHeader({ trip, days, items, editMode, onToggleEdit, onSearchSelect, readOnly = false, syncState = 'saved', onRetrySync, compact = false }: { trip: Trip; days: TripDay[]; items: ContentItem[]; editMode: boolean; onToggleEdit: () => void; onSearchSelect: (day: TripDay, item?: ContentItem) => void; readOnly?: boolean; syncState?: 'saved' | 'waiting' | 'attention' | 'saving'; onRetrySync?: () => void; compact?: boolean }) {
  if (compact) return <header className="map-page-header">
    <a className="wordmark dark" href="#/" aria-label="Roam trips">roam<span>·</span></a>
    <div className="map-page-trip-title"><strong>{trip.title}</strong><span>{format(new Date(`${trip.startDate}T12:00:00`), 'MMM d')} — {format(new Date(`${trip.endDate}T12:00:00`), 'MMM d, yyyy')}</span></div>
    <div className="map-page-header-actions">
      <SyncBadge state={syncState} onRetry={onRetrySync} />
      {!readOnly ? <button type="button" className={`map-header-action${editMode ? ' active' : ''}`} aria-label={editMode ? 'Done editing map' : 'Edit map'} onClick={onToggleEdit}>{editMode ? <Check /> : <PencilSimple />}</button> : null}
      <a className="map-header-action" href="#/" aria-label="Trips"><House /></a>
    </div>
  </header>
  return <header className="trip-hero">
    {trip.coverUrl ? <img src={trip.coverUrl} alt={trip.coverAlt} width="1800" height="1000" fetchPriority="high" /> : null}
    <div className="hero-scrim" />
    <div className="hero-top"><a className="wordmark" href="#/" aria-label="Roam trips">roam<span>·</span></a><SyncBadge state={syncState} onRetry={onRetrySync} /></div>
    <div className="hero-content">
      <p className="eyebrow">{format(new Date(`${trip.startDate}T12:00:00`), 'MMM d')} — {format(new Date(`${trip.endDate}T12:00:00`), 'MMM d, yyyy')}</p>
      <BidiText as="h1" value={trip.title}>{trip.title}</BidiText>
      <BidiText as="p" value={trip.subtitle}>{trip.subtitle}</BidiText>
      {readOnly ? <div className="hero-actions">
        <ItinerarySearch days={days} items={items} onSelect={onSearchSelect} />
        <span className="pill glass"><ArrowSquareOut size={18} />Read-only shared trip</span>
      </div> : null}
    </div>
  </header>
}
