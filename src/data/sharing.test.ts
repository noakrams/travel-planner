import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('./neon', () => ({ getNeon: async () => ({ rpc }) }))

import { getOrCreateShareToken, shareTrip } from './sharing'

beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
    clear: () => {
      values.clear()
    }
  })
  rpc.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('reuses a locally remembered token only after Neon verifies it', async () => {
  localStorage.setItem('roam-share-token:trip-one', 'verified-token')
  rpc.mockResolvedValueOnce({ data: { trip: { id: 'trip-one' } }, error: null })

  await expect(getOrCreateShareToken('trip-one')).resolves.toBe('verified-token')
  expect(rpc).toHaveBeenCalledWith('get_shared_trip', { raw_token: 'verified-token' })
})

it('creates the database token before returning a new share link token', async () => {
  rpc.mockResolvedValueOnce({ data: null, error: null })

  const token = await getOrCreateShareToken('trip-two')

  expect(token).toHaveLength(48)
  expect(rpc).toHaveBeenCalledWith('set_trip_share_token', {
    target_trip_id: 'trip-two',
    raw_token: token,
    enabled: true
  })
  expect(localStorage.getItem('roam-share-token:trip-two')).toBe(token)
})

it('opens the native share sheet when the phone supports it', async () => {
  const share = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { ...navigator, share })
  rpc.mockResolvedValueOnce({ data: null, error: null })

  await expect(shareTrip({ id: 'trip-three', title: 'Japan 2026' })).resolves.toBe('shared')

  expect(share).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Japan 2026', url: expect.stringContaining('#/share/') })
  )
})

it('copies the link when native sharing is unavailable', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
  rpc.mockResolvedValueOnce({ data: null, error: null })

  await expect(shareTrip({ id: 'trip-four', title: 'Japan 2026' })).resolves.toBe('copied')

  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#/share/'))
})
