import { afterEach, describe, expect, it, vi } from 'vitest'
import { db } from './db'

const getUser = vi.hoisted(() => vi.fn(async () => ({ data: { user: null } })))
vi.mock('./supabase', () => ({ hasSupabaseConfig: () => true, getSupabase: async () => ({ auth: { getUser } }) }))

import { normalizeRemoteStatus, synchronizeOutbox, syncErrorMessage } from './sync'

afterEach(async () => { await db.delete() })

describe('normalizeRemoteStatus', () => {
  it('maps editorial fixture labels to database-safe synchronization statuses', () => {
    expect(normalizeRemoteStatus('booked')).toBe('confirmed')
    expect(normalizeRemoteStatus('confirmed')).toBe('confirmed')
    expect(normalizeRemoteStatus('recommended')).toBe('planned')
    expect(normalizeRemoteStatus('optional')).toBe('planned')
    expect(normalizeRemoteStatus('reserve')).toBe('planned')
  })
})

describe('syncErrorMessage', () => {
  it('preserves Supabase plain-object error messages', () => {
    expect(syncErrorMessage({ code: '42501', message: 'new row violates row-level security policy' })).toBe('new row violates row-level security policy')
  })
})

describe('synchronizeOutbox authentication', () => {
  it('stops before database writes and records a useful sign-in action', async () => {
    await db.open()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    await db.outbox.add({
      id: 'signed-out-edit', tripId: 'trip-test', entity: 'item', entityId: 'transport-test', operation: 'update',
      payload: { kind: 'transport' }, baseVersion: 1, retryCount: 0, state: 'pending',
      createdAt: '2026-08-07T00:00:00.000Z', updatedAt: '2026-08-07T00:00:00.000Z', version: 1
    })
    await expect(synchronizeOutbox()).resolves.toEqual({ synced: 0, failed: 1 })
    expect((await db.outbox.get('signed-out-edit'))?.error).toBe('Sign in under More to save changes to the cloud.')
  })
})
