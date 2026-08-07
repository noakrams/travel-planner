import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTravelData'
import { BottomNav } from './BottomNav'
import { TripHeader } from './TripHeader'
import { useSync } from '../hooks/useSync'
import { useQuery } from '@tanstack/react-query'
import { localRepository } from '../data/repository'
import { SyncToast } from './SyncToast'
import { OwnerSignInDialog } from './OwnerSignInDialog'
import { useOwnerAccess } from '../hooks/useOwnerAccess'

export function TripLayout({ children, readOnly = false }: { children: (context: NonNullable<ReturnType<typeof useTrip>['data']> & { editMode: boolean }) => ReactNode; readOnly?: boolean }) {
  const { tripId, shareToken } = useParams()
  const resolvedId = tripId ?? shareToken
  const query = useQuery({ queryKey: [readOnly ? 'shared-trip' : 'trip', resolvedId], queryFn: () => readOnly ? localRepository.getSharedTrip(resolvedId!) : localRepository.getTrip(resolvedId!), enabled: Boolean(resolvedId) })
  const [editRequested, setEditRequested] = useState(() => Boolean(resolvedId && sessionStorage.getItem('roam-edit-after-sign-in') === resolvedId))
  const [signInOpen, setSignInOpen] = useState(false)
  const ownerAccess = useOwnerAccess()
  const canEdit = ownerAccess === 'owner' || ownerAccess === 'editor'
  const editMode = editRequested && canEdit
  const { state: syncState, error: syncError, retry: retrySync } = useSync(resolvedId, canEdit)
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
  if (!query.data) return <main className="empty-page"><p className="eyebrow">Trip unavailable</p><h1>This trip is not on this device.</h1><a className="button primary" href="#/">Return to trips</a></main>
  return <div className="app-shell">
    <TripHeader trip={query.data.trip} editMode={editMode} onToggleEdit={toggleEdit} readOnly={readOnly} syncState={syncState} onRetrySync={retrySync} />
    {!readOnly ? <BottomNav /> : null}
    <main>{children({ ...query.data, editMode: readOnly ? false : editMode })}</main>
    {!readOnly ? <SyncToast state={syncState} error={syncError} onRetry={retrySync} onSignIn={() => setSignInOpen(true)} /> : null}
    {!readOnly ? <OwnerSignInDialog open={signInOpen} onOpenChange={changeSignInOpen} access={ownerAccess} /> : null}
  </div>
}
