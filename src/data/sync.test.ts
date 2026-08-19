import { afterEach, describe, expect, it, vi } from 'vitest'
import { db } from './db'
import type { ContentKind, OutboxEntry } from '../domain/types'

const getUser = vi.hoisted(() => vi.fn(async () => ({ data: { user: null } })))
vi.mock('./neon', () => ({ hasNeonConfig: () => true, getNeon: async () => ({ auth: { getUser } }) }))

import { normalizeRemoteStatus, remotePayload, synchronizeOutbox, syncErrorMessage } from './sync'

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
  it('preserves Data API plain-object error messages', () => {
    expect(syncErrorMessage({ code: '42501', message: 'new row violates row-level security policy' })).toBe('new row violates row-level security policy')
  })
})

describe('remotePayload day assignments', () => {
  it('synchronizes the overnight base for a trip day', () => {
    const entry: OutboxEntry = {
      id: 'sync-day', tripId: 'trip-japan-2026', entity: 'day', entityId: 'day-japan-7', operation: 'update',
      payload: {
        id: 'day-japan-7', tripId: 'trip-japan-2026', date: '2026-09-24', title: 'Tokyo to Kyoto',
        summary: '', baseLocation: 'Kyoto', position: 6, createdAt: '2026-08-07T00:00:00.000Z',
        updatedAt: '2026-08-07T00:00:00.000Z', version: 2
      },
      baseVersion: 1, retryCount: 0, state: 'pending', createdAt: '2026-08-07T00:00:00.000Z',
      updatedAt: '2026-08-07T00:00:00.000Z', version: 1
    }
    expect(remotePayload(entry)).toMatchObject({ base_location: 'Kyoto' })
  })

  it.each(['booking', 'stay', 'transport', 'place', 'food'] satisfies ContentKind[])(
    'keeps the day and time when synchronizing a %s',
    (kind) => {
      const entry: OutboxEntry = {
        id: `sync-${kind}`, tripId: 'trip-japan-2026', entity: 'item', entityId: `item-${kind}`, operation: 'update',
        payload: {
          id: `item-${kind}`, tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind, title: 'Tokyo stop',
          description: 'Published itinerary stop', startTime: '16:45', status: 'booked',
          emailUrl: 'https://mail.google.com/mail/u/0/#inbox/example', position: 3,
          attachments: [{ id: 'confirmation', kind: 'email', label: 'Confirmation email', url: 'https://mail.google.com/mail/u/0/#inbox/example' }],
          createdAt: '2026-08-07T00:00:00.000Z', updatedAt: '2026-08-07T00:00:00.000Z', version: 2
        },
        baseVersion: 1, retryCount: 0, state: 'pending', createdAt: '2026-08-07T00:00:00.000Z',
        updatedAt: '2026-08-07T00:00:00.000Z', version: 1
      }
      expect(remotePayload(entry)).toMatchObject({
        day_id: 'day-japan-2', start_time: '16:45', email_url: 'https://mail.google.com/mail/u/0/#inbox/example',
        attachments: [{ id: 'confirmation', kind: 'email', label: 'Confirmation email', url: 'https://mail.google.com/mail/u/0/#inbox/example' }]
      })
    }
  )
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
    expect((await db.outbox.get('signed-out-edit'))?.error).toBe('Sign in to save changes to the cloud.')
  })
})
