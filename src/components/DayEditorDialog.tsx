import { CaretDown } from '@phosphor-icons/react/CaretDown'
import { CaretUp } from '@phosphor-icons/react/CaretUp'
import { Copy } from '@phosphor-icons/react/Copy'
import { MapPin } from '@phosphor-icons/react/MapPin'
import { Trash } from '@phosphor-icons/react/Trash'
import { useState, type FormEvent } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TripDay } from '../domain/types'

export function DayEditorDialog({ open, onOpenChange, day, tripId, onSave, onDelete, onDuplicate, onMove }: {
  open: boolean; onOpenChange: (open: boolean) => void; day?: TripDay; tripId: string;
  onSave: (day: Partial<TripDay> & Pick<TripDay, 'tripId' | 'date' | 'title'>) => Promise<unknown>; onDelete?: () => void; onDuplicate?: () => void; onMove?: (delta: -1 | 1) => void
}) {
  const [title, setTitle] = useState(day?.title ?? '')
  const [date, setDate] = useState(day?.date ?? '')
  const [summary, setSummary] = useState(day?.summary ?? '')
  const [baseLocation, setBaseLocation] = useState(day?.baseLocation ?? '')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave({ ...day, tripId, title, date, summary, baseLocation: baseLocation.trim() || undefined })
      onOpenChange(false)
    } catch {
      // The shared mutation toast explains the failure and the editor stays open.
    } finally {
      setSaving(false)
    }
  }

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="editor-sheet compact">
        <DialogHeader><p className="eyebrow">Itinerary day</p><DialogTitle>{day ? 'Edit day' : 'Add a day'}</DialogTitle><DialogDescription>Day titles and notes can be English, Hebrew, or mixed.</DialogDescription></DialogHeader>
        <form onSubmit={submit}>
          <div className="form-field"><Label htmlFor="day-date">Date</Label><Input id="day-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></div>
          <div className="form-field"><Label htmlFor="day-base"><MapPin />Overnight base</Label><Input id="day-base" dir="auto" placeholder="Tokyo" value={baseLocation} onChange={(event) => setBaseLocation(event.target.value)} /><small>Consecutive days with the same base are grouped together.</small></div>
          <div className="form-field"><Label htmlFor="day-title">Day title</Label><Input id="day-title" dir="auto" required value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <div className="form-field"><Label htmlFor="day-summary">Summary</Label><Textarea id="day-summary" dir="auto" rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></div>
          {day ? <div className="day-order-actions"><Button type="button" variant="outline" onClick={() => onMove?.(-1)}><CaretUp />Move up</Button><Button type="button" variant="outline" onClick={() => onMove?.(1)}><CaretDown />Move down</Button><Button type="button" variant="outline" onClick={onDuplicate}><Copy />Duplicate day</Button></div> : null}
          <DialogFooter className="editor-actions">{day && onDelete ? <Button type="button" variant="destructive" className="push-left" onClick={() => setConfirming(true)}><Trash />Delete day</Button> : null}<DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save day'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirming} onOpenChange={setConfirming}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this day?</AlertDialogTitle><AlertDialogDescription>Its itinerary items stay on this device until synchronization and can be recovered from an export.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep day</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { onDelete?.(); onOpenChange(false) }}>Delete day</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>
}
