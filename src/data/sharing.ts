import { getNeon } from './neon'

const storageKey = (tripId: string) => `roam-share-token:${tripId}`

export async function getOrCreateShareToken(tripId: string) {
  const neon = await getNeon()
  if (!neon) throw new Error('Neon is required to create a share link.')

  const existing = localStorage.getItem(storageKey(tripId))
  if (existing) {
    const { data, error } = await neon.rpc('get_shared_trip', { raw_token: existing })
    if (!error && data) return existing
  }

  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  const { error } = await neon.rpc('set_trip_share_token', { target_trip_id: tripId, raw_token: token, enabled: true })
  if (error) throw error
  localStorage.setItem(storageKey(tripId), token)
  return token
}
