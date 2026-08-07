import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Dialog from '@radix-ui/react-dialog'
import { Trash } from '@phosphor-icons/react/Trash'
import { X } from '@phosphor-icons/react/X'
import { Copy } from '@phosphor-icons/react/Copy'
import { CaretUp } from '@phosphor-icons/react/CaretUp'
import { CaretDown } from '@phosphor-icons/react/CaretDown'
import { useState } from 'react'
import type { TripDay } from '../domain/types'

export function DayEditorDialog({ open, onOpenChange, day, tripId, onSave, onDelete, onDuplicate, onMove }: {
  open: boolean; onOpenChange: (open: boolean) => void; day?: TripDay; tripId: string;
  onSave: (day: Partial<TripDay> & Pick<TripDay, 'tripId' | 'date' | 'title'>) => Promise<unknown>; onDelete?: () => void; onDuplicate?: () => void; onMove?: (delta: -1 | 1) => void
}) {
  const [title, setTitle] = useState(day?.title ?? '')
  const [date, setDate] = useState(day?.date ?? '')
  const [summary, setSummary] = useState(day?.summary ?? '')
  const [confirming, setConfirming] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); await onSave({ ...day, tripId, title, date, summary }); onOpenChange(false) }
  return <><Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="editor-sheet compact"><div className="editor-heading"><div><Dialog.Title>{day ? 'Edit day' : 'Add a day'}</Dialog.Title><Dialog.Description>Day titles and notes can be English, Hebrew, or mixed.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X /></Dialog.Close></div><form onSubmit={submit}><label>Date<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Day title<input dir="auto" required value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Summary<textarea dir="auto" rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>{day ? <div className="day-order-actions"><button type="button" className="button secondary" onClick={() => onMove?.(-1)}><CaretUp />Move up</button><button type="button" className="button secondary" onClick={() => onMove?.(1)}><CaretDown />Move down</button><button type="button" className="button secondary" onClick={onDuplicate}><Copy />Duplicate day</button></div> : null}<div className="form-actions">{day && onDelete ? <button type="button" className="button danger push-left" onClick={() => setConfirming(true)}><Trash />Delete day</button> : null}<Dialog.Close className="button secondary">Cancel</Dialog.Close><button className="button primary">Save day</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
    <AlertDialog.Root open={confirming} onOpenChange={setConfirming}><AlertDialog.Portal><AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="confirm-dialog"><AlertDialog.Title>Delete this day?</AlertDialog.Title><AlertDialog.Description>Its itinerary items stay on this device until synchronization and can be recovered from an export.</AlertDialog.Description><div className="form-actions"><AlertDialog.Cancel className="button secondary">Keep day</AlertDialog.Cancel><AlertDialog.Action className="button danger" onClick={() => { onDelete?.(); onOpenChange(false) }}>Delete day</AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root></>
}
