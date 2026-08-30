import { House } from '@phosphor-icons/react/House'
import { PencilSimple } from '@phosphor-icons/react/PencilSimple'
import { ShareNetwork } from '@phosphor-icons/react/ShareNetwork'
import { useState } from 'react'
import { shareTrip } from '../data/sharing'
import type { ContentItem, Trip, TripDay } from '../domain/types'
import { ItinerarySearch } from './ItinerarySearch'

export function TripActions({
  trip,
  days,
  items,
  editMode,
  onToggleEdit,
  onSearchSelect
}: {
  trip: Trip
  days: TripDay[]
  items: ContentItem[]
  editMode: boolean
  onToggleEdit: () => void
  onSearchSelect: (day: TripDay, item?: ContentItem) => void
}) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState('')

  const share = async () => {
    setSharing(true)
    setShareError('')
    try {
      const result = await shareTrip(trip)
      if (result === 'copied') {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2500)
      }
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'The share link could not be created.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="trip-actions-wrap">
      <div className="trip-action-bar" aria-label="Trip actions">
        <ItinerarySearch days={days} items={items} onSelect={onSearchSelect} />
        <button className={`pill light ${editMode ? 'active' : ''}`} onClick={onToggleEdit}>
          <PencilSimple size={18} />
          {editMode ? 'Done editing' : 'Edit trip'}
        </button>
        <button className="pill glass" disabled={sharing} onClick={share}>
          <ShareNetwork size={18} />
          {sharing ? 'Creating link…' : copied ? 'Link copied' : 'Share'}
        </button>
        <a className="pill glass" href="#/">
          <House size={18} />
          Trips
        </a>
      </div>
      {shareError ? (
        <p className="share-error trip-action-error" role="alert">
          {shareError}
        </p>
      ) : null}
    </div>
  )
}
