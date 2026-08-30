import { getNeon } from './neon'

const storageKey = (tripId: string) => `roam-share-token:${tripId}`

export function shareUrl(token: string) {
  return `${location.origin}${location.pathname}#/share/${token}`
}

async function copyShareUrl(url: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return
    } catch {
      // Some mobile browsers expose the Clipboard API but reject it outside a
      // permissioned context. Fall through to the broadly supported copy path.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = url
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Your browser could not copy the share link.')
}

export async function shareTrip(trip: { id: string; title: string }) {
  const token = await getOrCreateShareToken(trip.id)
  const url = shareUrl(token)

  if (navigator.share) {
    try {
      await navigator.share({ title: trip.title, text: `View ${trip.title}`, url })
      return 'shared' as const
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled' as const
    }
  }

  await copyShareUrl(url)
  return 'copied' as const
}

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
  const { error } = await neon.rpc('set_trip_share_token', {
    target_trip_id: tripId,
    raw_token: token,
    enabled: true
  })
  if (error) throw error
  localStorage.setItem(storageKey(tripId), token)
  return token
}
