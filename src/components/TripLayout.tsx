import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTravelData'
import { BottomNav } from './BottomNav'
import { TripHeader } from './TripHeader'
import { useSync } from '../hooks/useSync'
import { useQuery } from '@tanstack/react-query'
import { localRepository } from '../data/repository'
import { SyncToast } from './SyncToast'
import { OwnerSignInDialog } from './OwnerSignInDialog'
import { useOwnerAccess } from '../hooks/useOwnerAccess'
import type { ContentItem, TripDay } from '../domain/types'

export function TripLayout({ children, readOnly = false, variant = 'default' }: { children: (context: NonNullable<ReturnType<typeof useTrip>['data']> & { editMode: boolean; canEdit: boolean }) => ReactNode; readOnly?: boolean; variant?: 'default' | 'map' }) {
  const { tripId, shareToken } = useParams()
  const navigate = useNavigate()
  const resolvedId = tripId ?? shareToken
  const query = useQuery({ queryKey: [readOnly ? 'shared-trip' : 'trip', resolvedId], queryFn: () => readOnly ? localRepository.getSharedTrip(resolvedId!) : localRepository.getTrip(resolvedId!), enabled: Boolean(resolvedId) })
  const [editRequested, setEditRequested] = useState(() => Boolean(resolvedId && sessionStorage.getItem('roam-edit-after-sign-in') === resolvedId))
  const [signInOpen, setSignInOpen] = useState(false)
  const ownerAccess = useOwnerAccess()
  const canEdit = ownerAccess === 'owner' || ownerAccess === 'editor'
  const editMode = editRequested && canEdit
  const { state: syncState, error: syncError, retry: retrySync } = useSync(resolvedId, canEdit && !readOnly)
  const toggleEdit = () => {
    if (editMode) {
      setEditRequested(false)
      sessionStorage.removeItem('roam-edit-after-sign-in')
      return
    }
    if (canEdit) { setEditRequested(true); return }
    if (resolvedId) sessionStorage.setItem('roam-edit-after-sign-in', resolvedId)
    setEditRequested(true)
    setSignInOpen(true)
  }
  const changeSignInOpen = (open: boolean) => {
    setSignInOpen(open)
    if (!open && !canEdit) {
      setEditRequested(false)
      sessionStorage.removeItem('roam-edit-after-sign-in')
    }
  }
  if (query.isLoading) return <main className="page-skeleton" aria-busy="true"><div /><div /><div /></main>
  if (!query.data) return <main className="empty-page"><p className="eyebrow">Trip unavailable</p><h1>{readOnly ? 'This share link is invalid or no longer active.' : 'This trip is not available in Neon.'}</h1><a className="button primary" href="#/">Return to trips</a></main>
  const tripData = query.data
  const openSearchResult = (day: TripDay, item?: ContentItem) => {
    const target = item ? `itinerary-item-${item.id}` : 'day-heading'
    if (readOnly && shareToken) navigate(`/share/${shareToken}?day=${day.date}`, { state: { itinerarySearchTarget: target } })
    else navigate(`/trip/${tripData.trip.id}/day/${day.date}`, { state: { itinerarySearchTarget: target } })
  }
  return <div className={`app-shell${variant === 'map' ? ' map-app-shell' : ''}`}>
    <TripHeader trip={tripData.trip} days={tripData.days} items={tripData.items} editMode={editMode} onToggleEdit={toggleEdit} onSearchSelect={openSearchResult} readOnly={readOnly} syncState={syncState} onRetrySync={retrySync} compact={variant === 'map'} />
    {!readOnly ? <BottomNav /> : null}
    <main>{children({ ...tripData, editMode: readOnly ? false : editMode, canEdit })}</main>
    {!readOnly ? <SyncToast state={syncState} error={syncError} onRetry={retrySync} onSignIn={() => setSignInOpen(true)} /> : null}
    {!readOnly ? <OwnerSignInDialog open={signInOpen} onOpenChange={changeSignInOpen} access={ownerAccess} /> : null}
  </div>
}
