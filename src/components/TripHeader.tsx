import { ArrowSquareOut } from '@phosphor-icons/react/ArrowSquareOut'
import { PencilSimple } from '@phosphor-icons/react/PencilSimple'
import { ShareNetwork } from '@phosphor-icons/react/ShareNetwork'
import { format } from 'date-fns'
import { useState } from 'react'
import type { Trip } from '../domain/types'
import { BidiText } from './BidiText'
import { SyncBadge } from './SyncBadge'

export function TripHeader({ trip, editMode, onToggleEdit, readOnly = false, syncState = 'saved', onRetrySync }: { trip: Trip; editMode: boolean; onToggleEdit: () => void; readOnly?: boolean; syncState?: 'saved' | 'waiting' | 'attention' | 'saving'; onRetrySync?: () => void }) {
  const [copied, setCopied] = useState(false)
  const copyShare = async () => {
    await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/share/${trip.shareToken ?? trip.id}`)
    setCopied(true); window.setTimeout(() => setCopied(false), 2500)
  }
  return <header className="trip-hero">
    {trip.coverUrl ? <img src={trip.coverUrl} alt={trip.coverAlt} width="1800" height="1000" fetchPriority="high" /> : null}
    <div className="hero-scrim" />
    <div className="hero-top"><a className="wordmark" href="#/" aria-label="Roam trips">roam<span>·</span></a><SyncBadge state={syncState} onRetry={onRetrySync} /></div>
    <div className="hero-content">
      <p className="eyebrow">{format(new Date(`${trip.startDate}T12:00:00`), 'MMM d')} — {format(new Date(`${trip.endDate}T12:00:00`), 'MMM d, yyyy')}</p>
      <BidiText as="h1" value={trip.title}>{trip.title}</BidiText>
      <BidiText as="p" value={trip.subtitle}>{trip.subtitle}</BidiText>
      <div className="hero-actions">
        {!readOnly ? <button className={`pill light ${editMode ? 'active' : ''}`} onClick={onToggleEdit}><PencilSimple size={18} />{editMode ? 'Done editing' : 'Edit trip'}</button> : null}
        {!readOnly ? <button className="pill glass" onClick={copyShare}><ShareNetwork size={18} />{copied ? 'Link copied' : 'Share'}</button> : null}
        {readOnly ? <span className="pill glass"><ArrowSquareOut size={18} />Read-only shared trip</span> : null}
      </div>
    </div>
  </header>
}
