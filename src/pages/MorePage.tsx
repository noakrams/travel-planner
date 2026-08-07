import { ArrowClockwise } from '@phosphor-icons/react/ArrowClockwise'
import { DownloadSimple } from '@phosphor-icons/react/DownloadSimple'
import { Gear } from '@phosphor-icons/react/Gear'
import { LinkSimple } from '@phosphor-icons/react/LinkSimple'
import { UploadSimple } from '@phosphor-icons/react/UploadSimple'
import { useRef, useState } from 'react'
import { CollectionPage } from '../components/CollectionPage'
import { TripLayout } from '../components/TripLayout'
import { localRepository } from '../data/repository'
import type { ContentItem, Trip } from '../domain/types'
import { useTravelMutations } from '../hooks/useTravelData'
import { TripSettingsDialog } from '../components/TripSettingsDialog'

export function MorePage() {
  return <TripLayout>{({ trip, items, editMode }) => <MoreContent trip={trip} items={items} editMode={editMode} />}</TripLayout>
}

function MoreContent({ trip, items, editMode }: { trip: Trip; items: ContentItem[]; editMode: boolean }) {
  const mutations = useTravelMutations(trip.id)
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const exportJson = async () => {
    const raw = await localRepository.exportTrip(trip.id)
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`; anchor.click(); URL.revokeObjectURL(url)
  }
  const importJson = async (file?: File) => {
    if (!file) return
    try { await localRepository.importTrip(await file.text()); setMessage('Trip imported. Return to Trips to open it.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'The file could not be imported.') }
  }
  const rotateLink = async () => {
    const bytes = crypto.getRandomValues(new Uint8Array(24))
    const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    await mutations.saveTrip.mutateAsync({ ...trip, shareEnabled: true, shareToken: token })
    setMessage('A new unlisted link is ready. The old link no longer opens this trip.')
  }
  return <>
    <CollectionPage trip={trip} items={items} kinds={['place', 'food', 'note', 'warning', 'route']} title="More to remember" intro="Saved places, food, warnings, notes, and the route—kept out of the day plan until you need them." editMode={editMode} />
    <section className="utility-panel" aria-labelledby="portable-heading"><div><p className="eyebrow">Portable by design</p><h2 id="portable-heading">Sharing & backup</h2><p>Export a complete copy at any time. Imports create a separate trip, so the original stays safe.</p></div><div className="utility-actions">
      <button className="button secondary" onClick={exportJson}><DownloadSimple />Export JSON</button>
      {editMode ? <button className="button secondary" onClick={() => fileRef.current?.click()}><UploadSimple />Import JSON</button> : null}
      {editMode ? <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => importJson(event.target.files?.[0])} /> : null}
      {editMode ? <button className="button secondary" onClick={rotateLink}><ArrowClockwise />Rotate share link</button> : null}
      {trip.shareEnabled ? <a className="button secondary" href={`#/share/${trip.shareToken}`}><LinkSimple />Preview shared trip</a> : null}
      {editMode ? <button className="button secondary" onClick={() => setSettingsOpen(true)}><Gear />Trip settings</button> : null}
    </div>{message ? <p className="inline-message" role="status">{message}</p> : null}</section><TripSettingsDialog trip={trip} open={settingsOpen} onOpenChange={setSettingsOpen} />
  </>
}
