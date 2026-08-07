export const syncRequestEvent = 'roam:sync-request'

export function requestSync(tripId: string) {
  window.dispatchEvent(new CustomEvent(syncRequestEvent, { detail: { tripId } }))
}
