import { ArrowClockwise } from '@phosphor-icons/react/ArrowClockwise'
import { ArrowSquareOut } from '@phosphor-icons/react/ArrowSquareOut'
import { CaretDown } from '@phosphor-icons/react/CaretDown'
import { DownloadSimple } from '@phosphor-icons/react/DownloadSimple'
import { ForkKnife } from '@phosphor-icons/react/ForkKnife'
import { Gear } from '@phosphor-icons/react/Gear'
import { LinkSimple } from '@phosphor-icons/react/LinkSimple'
import { IdentificationCard } from '@phosphor-icons/react/IdentificationCard'
import { SimCard } from '@phosphor-icons/react/SimCard'
import { Taxi } from '@phosphor-icons/react/Taxi'
import { Ticket } from '@phosphor-icons/react/Ticket'
import { UploadSimple } from '@phosphor-icons/react/UploadSimple'
import { WifiHigh } from '@phosphor-icons/react/WifiHigh'
import { useRef, useState, type ReactNode } from 'react'
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
  const [applicationsOpen, setApplicationsOpen] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const scrollToTopic = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
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
    try {
      await mutations.saveTrip.mutateAsync({ ...trip, shareEnabled: true, shareToken: token })
      setMessage('A new unlisted link is ready. The old link no longer opens this trip.')
    } catch {
      // The shared mutation toast provides the error details.
    }
  }
  return <>
    <section className="more-intro" aria-labelledby="more-heading">
      <p className="eyebrow">{trip.title} field guide</p>
      <div className="more-intro-copy"><h2 id="more-heading">More, but sorted.</h2><p>Your off-itinerary essentials, arranged by the moment you need them—not by where the app stores them.</p></div>
      <nav className="more-topic-nav" aria-label="More page topics"><button type="button" onClick={() => scrollToTopic('applications')}>Applications</button><button type="button" onClick={() => scrollToTopic('tips')}>Tips</button><button type="button" onClick={() => scrollToTopic('saved')}>Saved finds</button><button type="button" onClick={() => scrollToTopic('trip-tools')}>Trip tools</button></nav>
    </section>

    <section className="app-topic" id="applications" aria-labelledby="applications-heading">
      <button className="topic-toggle topic-title" type="button" aria-expanded={applicationsOpen} aria-controls="applications-content" onClick={() => setApplicationsOpen((open) => !open)}><h3 id="applications-heading">Applications</h3><CaretDown aria-hidden="true" /></button>
      {applicationsOpen ? <div className="app-grid" id="applications-content">
        <AppLink icon={<ForkKnife />} name="Tabelog" use="Find restaurants" description="Japan’s restaurant guide for choosing where to eat." href="https://tabelog.com/en/" />
        <AppLink icon={<Taxi />} name="GO" use="Call a taxi" description="Request a taxi when trains have stopped or feet are done." href="https://go.goinc.jp/en" />
        <AppLink icon={<Ticket />} name="Klook" use="Book travel extras" description="Attractions, stays, transport, and other trip bookings." href="https://www.klook.com/" />
        <AppLink icon={<WifiHigh />} name="Japan Wi-Fi" use="Find free Wi-Fi" description="Connect to supported public Wi-Fi hotspots across Japan." href="https://www.ntt-bp.net/jw-auto/en/" />
        <AppLink icon={<SimCard />} name="7G eSIM" use="Stay connected" description="Set up mobile data before the trip and top up if needed." href="https://7g.app/" />
      </div> : null}
    </section>

    <section className="tips-topic" id="tips" aria-labelledby="tips-heading">
      <button className="topic-toggle topic-title" type="button" aria-expanded={tipsOpen} aria-controls="tips-content" onClick={() => setTipsOpen((open) => !open)}><h3 id="tips-heading">Tips</h3><CaretDown aria-hidden="true" /></button>
      {tipsOpen ? <div className="tips-content" id="tips-content"><p>Complete Visit Japan Web before travelling so your entry details are ready when you land.</p><a className="tip-link" href="https://www.vjw.digital.go.jp/main/#/vjwplo001" target="_blank" rel="noreferrer" aria-label="Open Visit Japan Web to complete your Japan entry form"><IdentificationCard aria-hidden="true" /><span><small>Japan entry</small><strong>Complete the form</strong></span><ArrowSquareOut aria-hidden="true" /></a><p className="tip-note"><strong>No restaurant plan?</strong> Head to a mall—Japan’s mall restaurants are usually a reliable, good option when you have not booked anywhere.</p></div> : null}
    </section>

    <div id="saved"><CollectionPage trip={trip} items={items} kinds={['place', 'food', 'note', 'warning', 'route']} title="Saved finds" intro="Places, food, warnings, notes, and the route—kept out of the day plan until you need them." editMode={editMode} collapsible compactHeading /></div>
    <section className="utility-panel" id="trip-tools" aria-labelledby="portable-heading"><button className="topic-toggle topic-title" type="button" aria-expanded={toolsOpen} aria-controls="trip-tools-content" onClick={() => setToolsOpen((open) => !open)}><h2 id="portable-heading">Trip tools</h2><CaretDown aria-hidden="true" /></button>{toolsOpen ? <div className="utility-actions" id="trip-tools-content">
      <button className="button secondary" onClick={exportJson}><DownloadSimple />Export JSON</button>
      {editMode ? <button className="button secondary" onClick={() => fileRef.current?.click()}><UploadSimple />Import JSON</button> : null}
      {editMode ? <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => importJson(event.target.files?.[0])} /> : null}
      {editMode ? <button className="button secondary" onClick={rotateLink}><ArrowClockwise />Rotate share link</button> : null}
      {trip.shareEnabled ? <a className="button secondary" href={`#/share/${trip.shareToken}`}><LinkSimple />Preview shared trip</a> : null}
      {editMode ? <button className="button secondary" onClick={() => setSettingsOpen(true)}><Gear />Trip settings</button> : null}
    </div> : null}{message ? <p className="inline-message" role="status">{message}</p> : null}</section>{settingsOpen ? <TripSettingsDialog trip={trip} open onOpenChange={setSettingsOpen} /> : null}
  </>
}

function AppLink({ icon, name, use, description, href }: { icon: ReactNode; name: string; use: string; description: string; href: string }) {
  return <a className="app-link-card" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${name}: ${use}`}>
    <span className="app-link-icon" aria-hidden="true">{icon}</span><span className="app-link-copy"><small>{use}</small><strong>{name}</strong><span>{description}</span></span><ArrowSquareOut className="app-link-external" aria-hidden="true" />
  </a>
}
