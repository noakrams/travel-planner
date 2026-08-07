import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../data/db'
import { useSync } from './useSync'

function SyncHarness({ enabled = true }: { enabled?: boolean }) {
  const { state, error, retry } = useSync('trip-test', enabled)
  return <><button onClick={retry}>{state}</button><output>{error}</output></>
}

describe('useSync', () => {
  beforeEach(async () => {
    await db.delete(); await db.open()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    await db.outbox.add({
      id: 'failed-entry', tripId: 'trip-test', entity: 'trip', entityId: 'trip-test', operation: 'update',
      payload: {}, baseVersion: 1, retryCount: 1, state: 'failed', error: 'Temporary failure',
      createdAt: '2026-08-07T00:00:00.000Z', updatedAt: '2026-08-07T00:00:00.000Z', version: 1
    })
    await db.outbox.add({
      id: 'interrupted-entry', tripId: 'trip-test', entity: 'day', entityId: 'day-test', operation: 'update',
      payload: {}, baseVersion: 1, retryCount: 0, state: 'processing',
      createdAt: '2026-08-07T00:00:01.000Z', updatedAt: '2026-08-07T00:00:01.000Z', version: 1
    })
  })
  afterEach(async () => { cleanup(); await db.delete() })

  it('runs a failed outbox retry and updates the visible state', async () => {
    const user = userEvent.setup()
    render(<SyncHarness />)
    expect(await screen.findByRole('button', { name: 'attention' })).toBeInTheDocument()
    expect(screen.getByText('Temporary failure')).toBeInTheDocument()
    await user.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'saved' })).toBeInTheDocument())
    expect(await db.outbox.count()).toBe(0)
  })

  it('synchronizes immediately when a save requests it', async () => {
    await db.outbox.clear()
    render(<SyncHarness />)
    await db.outbox.add({
      id: 'new-entry', tripId: 'trip-test', entity: 'trip', entityId: 'trip-test', operation: 'update',
      payload: {}, baseVersion: 1, retryCount: 0, state: 'pending',
      createdAt: '2026-08-07T00:00:02.000Z', updatedAt: '2026-08-07T00:00:02.000Z', version: 1
    })
    window.dispatchEvent(new CustomEvent('roam:sync-request', { detail: { tripId: 'trip-test' } }))
    await waitFor(() => expect(db.outbox.count()).resolves.toBe(0))
    expect(screen.getByRole('button', { name: 'saved' })).toBeInTheDocument()
  })

  it('does not expose or retry owner cloud work for a public viewer', async () => {
    render(<SyncHarness enabled={false} />)
    expect(screen.getByRole('button', { name: 'saved' })).toBeInTheDocument()
    expect(screen.queryByText('Temporary failure')).not.toBeInTheDocument()
    await new Promise((resolve) => window.setTimeout(resolve, 20))
    expect(await db.outbox.count()).toBe(2)
  })
})
