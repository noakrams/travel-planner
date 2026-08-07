import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight } from '@phosphor-icons/react/ArrowRight'
import { Copy } from '@phosphor-icons/react/Copy'
import { Plus } from '@phosphor-icons/react/Plus'
import { X } from '@phosphor-icons/react/X'
import { format } from 'date-fns'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BidiText } from '../components/BidiText'
import { useTravelMutations, useTrips } from '../hooks/useTravelData'
import { useOwnerAccess } from '../hooks/useOwnerAccess'

export function TripsPage() {
  const { data: trips = [], isLoading } = useTrips()
  const { saveTrip, duplicateTrip } = useTravelMutations()
  const navigate = useNavigate()
  const ownerAccess = useOwnerAccess()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('2027-03-01')
  const [endDate, setEndDate] = useState('2027-03-08')
  const createTrip = async (event: React.FormEvent) => {
    event.preventDefault()
    const trip = await saveTrip.mutateAsync({ title, subtitle: 'A new journey, ready to shape', startDate, endDate, timezone: 'UTC', baseCurrency: 'USD', displayCurrency: 'USD' })
    setOpen(false); navigate(`/trip/${trip.id}`)
  }
  return <main className="trips-page">
    <header className="trips-header"><a className="wordmark dark" href="#/">roam<span>·</span></a>{ownerAccess === 'owner' ? <button className="pill dark" onClick={() => setOpen(true)}><Plus size={18} />New trip</button> : null}</header>
    <section className="trips-intro"><p className="eyebrow">Your journeys</p><h1>Where are you<br /><em>going next?</em></h1><p>Hold the details lightly. Keep the days that matter close.</p></section>
    {isLoading ? <div className="page-skeleton"><div /><div /></div> : <section className="trip-grid" aria-label="Trips">{trips.map((trip, index) => <article className={`trip-poster poster-${index % 3}`} key={trip.id}>
      <a href={`#/trip/${trip.id}`} aria-label={`Open ${trip.title}`}><img src={trip.coverUrl} alt={trip.coverAlt} width="900" height="1100" loading={index ? 'lazy' : 'eager'} /><div className="poster-scrim" /><div className="poster-copy"><p>{format(new Date(`${trip.startDate}T12:00:00`), 'MMM d')} — {format(new Date(`${trip.endDate}T12:00:00`), 'MMM d')}</p><BidiText as="h2" value={trip.title}>{trip.title}</BidiText><span>Open itinerary <ArrowRight /></span></div></a>
      {ownerAccess === 'owner' ? <button className="poster-duplicate" onClick={() => duplicateTrip.mutate(trip.id)} aria-label={`Duplicate ${trip.title}`}><Copy size={18} />Duplicate</button> : null}
    </article>)}</section>}
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="editor-sheet compact"><div className="editor-heading"><div><Dialog.Title>Create a trip</Dialog.Title><Dialog.Description>Start with the dates. Everything else can change later.</Dialog.Description></div><Dialog.Close className="icon-button"><X /></Dialog.Close></div><form onSubmit={createTrip}><label>Trip name<input dir="auto" required value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="field-pair"><label>Starts<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Ends<input type="date" required value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} /></label></div><div className="form-actions"><Dialog.Close className="button secondary">Cancel</Dialog.Close><button className="button primary" disabled={!title.trim() || saveTrip.isPending}>{saveTrip.isPending ? 'Creating…' : 'Create trip'}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>
}
