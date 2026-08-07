import { useCallback, useEffect, useRef, useState } from 'react'
import type { SyncState } from '../domain/types'
import { db } from '../data/db'
import { retryFailedOutbox, synchronizeOutbox, syncErrorMessage } from '../data/sync'
import { syncRequestEvent } from '../data/syncEvents'

export function useSync(tripId?: string): { state: SyncState; error?: string; retry: () => void } {
  const [state, setState] = useState<SyncState>('saved')
  const [error, setError] = useState<string>()
  const mounted = useRef(true)
  const syncing = useRef(false)

  const update = useCallback(async (retryFailed = false) => {
    if (syncing.current) return
    if (!navigator.onLine) { if (mounted.current) { setState('waiting'); setError(undefined) }; return }
    const entries = tripId ? await db.outbox.where('tripId').equals(tripId).toArray() : await db.outbox.toArray()
    const needsRetry = entries.some((entry) => entry.state === 'failed' || entry.state === 'processing')
    if (needsRetry && !retryFailed) {
      if (mounted.current) { setState('attention'); setError(entries.find((entry) => entry.error)?.error ?? 'The last cloud save did not finish.') }
      return
    }
    if (!entries.length) { if (mounted.current) { setState('saved'); setError(undefined) }; return }

    syncing.current = true
    if (mounted.current) { setState('saving'); setError(undefined) }
    try {
      const result = needsRetry ? await retryFailedOutbox() : await synchronizeOutbox()
      const failedEntries = result.failed
        ? (tripId ? await db.outbox.where('tripId').equals(tripId).toArray() : await db.outbox.toArray()).filter((entry) => entry.state === 'failed')
        : []
      if (mounted.current) {
        setState(result.failed ? 'attention' : 'saved')
        setError(failedEntries.find((entry) => entry.error)?.error)
      }
    } catch (caught) {
      if (mounted.current) {
        setState('attention')
        setError(syncErrorMessage(caught))
      }
    } finally {
      syncing.current = false
    }
  }, [tripId])

  useEffect(() => {
    mounted.current = true
    const initialTimer = window.setTimeout(() => { void update() }, 0)
    const onOnline = () => { void update(true) }
    const onOffline = () => { void update() }
    const onSyncRequest = (event: Event) => {
      const requestedTripId = (event as CustomEvent<{ tripId?: string }>).detail?.tripId
      if (!tripId || !requestedTripId || requestedTripId === tripId) void update(true)
    }
    const timer = window.setInterval(() => { void update(true) }, 20_000)
    addEventListener('online', onOnline); addEventListener('offline', onOffline)
    addEventListener(syncRequestEvent, onSyncRequest)
    return () => { mounted.current = false; clearTimeout(initialTimer); removeEventListener('online', onOnline); removeEventListener('offline', onOffline); removeEventListener(syncRequestEvent, onSyncRequest); clearInterval(timer) }
  }, [tripId, update])

  return { state, error, retry: () => { void update(true) } }
}
