import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Dialog from '@radix-ui/react-dialog'
import { Archive } from '@phosphor-icons/react/Archive'
import { Trash } from '@phosphor-icons/react/Trash'
import { X } from '@phosphor-icons/react/X'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '../domain/types'
import { useTravelMutations } from '../hooks/useTravelData'

export function TripSettingsDialog({ trip, open, onOpenChange }: { trip: Trip; open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutations = useTravelMutations(trip.id)
  const navigate = useNavigate()
  const [title, setTitle] = useState(trip.title)
  const [subtitle, setSubtitle] = useState(trip.subtitle)
  const [startDate, setStartDate] = useState(trip.startDate)
  const [endDate, setEndDate] = useState(trip.endDate)
  const [currency, setCurrency] = useState(trip.displayCurrency)
  const [coverUrl, setCoverUrl] = useState(trip.coverUrl)
  const [coverAlt, setCoverAlt] = useState(trip.coverAlt)
  const [confirming, setConfirming] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); await mutations.saveTrip.mutateAsync({ ...trip, title, subtitle, startDate, endDate, displayCurrency: currency.toUpperCase(), baseCurrency: currency.toUpperCase(), coverUrl, coverAlt }); onOpenChange(false)
  }
  const remove = async () => { await mutations.deleteRecord.mutateAsync({ entity: 'trip', id: trip.id }); navigate('/') }
  return <><Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="editor-sheet"><div className="editor-heading"><div><Dialog.Title>Trip settings</Dialog.Title><Dialog.Description>Update the details people see at the top of this trip.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close settings"><X /></Dialog.Close></div><form onSubmit={submit}><label>Trip title<input dir="auto" required value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Subtitle<textarea dir="auto" rows={3} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></label><div className="field-pair"><label>Starts<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Ends<input type="date" required min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div><label>Display currency<input required maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value)} /></label><label>Cover image URL<input type="url" required value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} /></label><label>Cover image description<input dir="auto" required value={coverAlt} onChange={(event) => setCoverAlt(event.target.value)} /></label><div className="settings-danger"><p>Trip status and deletion</p><button type="button" className="button secondary" onClick={() => mutations.saveTrip.mutate({ ...trip, status: trip.status === 'archived' ? 'upcoming' : 'archived' })}><Archive />{trip.status === 'archived' ? 'Restore trip' : 'Archive trip'}</button><button type="button" className="button danger" onClick={() => setConfirming(true)}><Trash />Delete trip</button></div><div className="form-actions"><Dialog.Close className="button secondary">Cancel</Dialog.Close><button className="button primary" disabled={mutations.saveTrip.isPending}>{mutations.saveTrip.isPending ? 'Saving…' : 'Save trip'}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
    <AlertDialog.Root open={confirming} onOpenChange={setConfirming}><AlertDialog.Portal><AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="confirm-dialog"><AlertDialog.Title>Delete this trip?</AlertDialog.Title><AlertDialog.Description>The trip is soft-deleted locally and queued for synchronization. Export first if you need a separate backup.</AlertDialog.Description><div className="form-actions"><AlertDialog.Cancel className="button secondary">Keep trip</AlertDialog.Cancel><AlertDialog.Action className="button danger" onClick={remove}>Delete trip</AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root></>
}
