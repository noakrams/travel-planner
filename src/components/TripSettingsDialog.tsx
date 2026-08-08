import { Archive, Trash } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supportedCurrencies } from '../domain/currency'
import type { CurrencyCode, Trip } from '../domain/types'
import { useTravelMutations } from '../hooks/useTravelData'

export function TripSettingsDialog({ trip, open, onOpenChange }: { trip: Trip; open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutations = useTravelMutations(trip.id)
  const navigate = useNavigate()
  const [title, setTitle] = useState(trip.title)
  const [subtitle, setSubtitle] = useState(trip.subtitle)
  const [startDate, setStartDate] = useState(trip.startDate)
  const [endDate, setEndDate] = useState(trip.endDate)
  const [currency, setCurrency] = useState<CurrencyCode>(trip.displayCurrency)
  const [coverUrl, setCoverUrl] = useState(trip.coverUrl)
  const [coverAlt, setCoverAlt] = useState(trip.coverAlt)
  const [confirming, setConfirming] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await mutations.saveTrip.mutateAsync({ ...trip, title, subtitle, startDate, endDate, displayCurrency: currency, coverUrl, coverAlt })
      onOpenChange(false)
    } catch {
      // The shared mutation toast explains the failure and the editor stays open.
    }
  }
  const remove = async () => {
    try {
      await mutations.deleteRecord.mutateAsync({ entity: 'trip', id: trip.id })
      navigate('/')
    } catch {
      // The shared mutation toast explains the failure and keeps the trip available.
    }
  }

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="settings-dialog">
        <DialogHeader><p className="eyebrow">Trip details</p><DialogTitle>Settings</DialogTitle><DialogDescription>Update the details people see throughout this trip.</DialogDescription></DialogHeader>
        <form className="settings-form" onSubmit={submit}>
          <div className="form-field"><Label htmlFor="trip-title">Trip title</Label><Input id="trip-title" dir="auto" required value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <div className="form-field"><Label htmlFor="trip-subtitle">Subtitle</Label><Textarea id="trip-subtitle" dir="auto" rows={3} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></div>
          <div className="field-pair"><div className="form-field"><Label htmlFor="trip-start">Starts</Label><Input id="trip-start" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div className="form-field"><Label htmlFor="trip-end">Ends</Label><Input id="trip-end" type="date" required min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div></div>
          <div className="form-field"><Label htmlFor="trip-currency">Default display currency</Label><Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}><SelectTrigger id="trip-currency" className="form-select"><SelectValue /></SelectTrigger><SelectContent>{supportedCurrencies.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}</SelectContent></Select></div>
          <div className="form-field"><Label htmlFor="cover-url">Cover image URL</Label><Input id="cover-url" type="url" required value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} /></div>
          <div className="form-field"><Label htmlFor="cover-alt">Cover image description</Label><Input id="cover-alt" dir="auto" required value={coverAlt} onChange={(event) => setCoverAlt(event.target.value)} /></div>
          <section className="settings-danger"><div><strong>Trip status</strong><p>Archive a finished trip or permanently remove it from your active list.</p></div><div><Button type="button" variant="outline" onClick={() => mutations.saveTrip.mutate({ ...trip, status: trip.status === 'archived' ? 'upcoming' : 'archived' })}><Archive />{trip.status === 'archived' ? 'Restore trip' : 'Archive trip'}</Button><Button type="button" variant="destructive" onClick={() => setConfirming(true)}><Trash />Delete trip</Button></div></section>
          <DialogFooter className="editor-actions"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={mutations.saveTrip.isPending}>{mutations.saveTrip.isPending ? 'Saving…' : 'Save trip'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirming} onOpenChange={setConfirming}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this trip?</AlertDialogTitle><AlertDialogDescription>The trip is soft-deleted locally and queued for synchronization. Export first if you need a separate backup.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep trip</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>Delete trip</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>
}
