import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from '@phosphor-icons/react/X'
import { useEffect } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ContentItem, ContentKind, TripDay } from '../domain/types'
import { contentKindLabels } from '../domain/types'
import { resizePhoto } from '../data/images'
import { localRepository } from '../data/repository'

const schema = z.object({
  kind: z.string(), title: z.string().trim().min(1, 'Add a title.'), description: z.string(),
  startTime: z.string(), location: z.string(), mapsUrl: z.union([z.literal(''), z.url('Enter a complete URL, including https://.')]),
  imageUrl: z.union([z.literal(''), z.url('Enter a complete image URL, including https://.')]), imageAlt: z.string(),
  plannedAmount: z.string(), actualAmount: z.string(), currency: z.string().max(3)
}).refine((value) => !value.imageUrl || value.imageAlt.trim().length > 0, { path: ['imageAlt'], message: 'Describe the image for people who cannot see it.' })

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  dayId?: string
  initial?: ContentItem
  defaultKind?: ContentKind
  days?: TripDay[]
  onSave: (item: Partial<ContentItem> & Pick<ContentItem, 'tripId' | 'kind' | 'title'>) => Promise<unknown>
}

const blank: FormValues = { kind: 'activity', title: '', description: '', startTime: '', location: '', mapsUrl: '', imageUrl: '', imageAlt: '', plannedAmount: '', actualAmount: '', currency: 'EUR' }

export function EditorDialog({ open, onOpenChange, tripId, dayId, initial, defaultKind = 'activity', onSave }: Props) {
  const [photo, setPhoto] = useState<File>()
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: blank, mode: 'onBlur' })
  useEffect(() => {
    reset(initial ? {
      kind: initial.kind, title: initial.title, description: initial.description, startTime: initial.startTime ?? '',
      location: initial.location ?? '', mapsUrl: initial.mapsUrl ?? '', imageUrl: initial.imageUrl ?? '', imageAlt: initial.imageAlt ?? '',
      plannedAmount: initial.plannedAmount?.toString() ?? '', actualAmount: initial.actualAmount?.toString() ?? '', currency: initial.currency ?? 'EUR'
    } : { ...blank, kind: defaultKind })
  }, [defaultKind, initial, open, reset])

  const submit = async (values: FormValues) => {
    if (photo && !values.imageAlt.trim()) { setError('imageAlt', { message: 'Describe the uploaded image for people who cannot see it.' }); return }
    let imageUrl = values.imageUrl || undefined
    if (photo) {
      const media = await localRepository.queuePhoto(tripId, await resizePhoto(photo), values.imageAlt)
      imageUrl = `local-media:${media.id}`
    }
    await onSave({
      ...initial, tripId, dayId: initial?.dayId ?? dayId, kind: values.kind as ContentKind, title: values.title,
      description: values.description, startTime: values.startTime || undefined, location: values.location || undefined,
      mapsUrl: values.mapsUrl || undefined, imageUrl, imageAlt: values.imageAlt || undefined,
      plannedAmount: values.plannedAmount ? Number(values.plannedAmount) : undefined,
      actualAmount: values.actualAmount ? Number(values.actualAmount) : undefined, currency: values.currency || undefined
    })
    setPhoto(undefined); onOpenChange(false)
  }

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="editor-sheet" aria-describedby="editor-description">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="editor-heading">
          <div><Dialog.Title>{initial ? 'Edit item' : 'Add to the trip'}</Dialog.Title><Dialog.Description id="editor-description">Changes save to this device first and sync when a connection is available.</Dialog.Description></div>
          <Dialog.Close className="icon-button" aria-label="Close editor"><X size={22} /></Dialog.Close>
        </div>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <label>Type<select {...register('kind')}>{Object.entries(contentKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Title<input dir="auto" {...register('title')} aria-invalid={Boolean(errors.title)} /></label>{errors.title ? <p className="field-error" role="alert">{errors.title.message}</p> : null}
          <label>Notes<textarea dir="auto" rows={4} {...register('description')} /></label>
          <div className="field-pair"><label>Time<input type="time" {...register('startTime')} /></label><label>Location<input dir="auto" {...register('location')} /></label></div>
          <label>Google Maps URL<input type="url" inputMode="url" {...register('mapsUrl')} aria-invalid={Boolean(errors.mapsUrl)} /></label>{errors.mapsUrl ? <p className="field-error" role="alert">{errors.mapsUrl.message}</p> : null}
          <details><summary>Photo and budget</summary>
            <label>Upload a photo<input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0])} /></label>
            <p className="helper-text">Choose the camera or photo library on iPhone. Roam resizes the image and queues it when offline.</p>
            <label>External image URL<input type="url" inputMode="url" {...register('imageUrl')} /></label>
            <label>Image description<input dir="auto" {...register('imageAlt')} /></label>{errors.imageAlt ? <p className="field-error" role="alert">{errors.imageAlt.message}</p> : null}
            <div className="field-pair"><label>Planned<input type="number" inputMode="decimal" min="0" step="0.01" {...register('plannedAmount')} /></label><label>Actual<input type="number" inputMode="decimal" min="0" step="0.01" {...register('actualAmount')} /></label></div>
            <label>Currency<input autoCapitalize="characters" maxLength={3} {...register('currency')} /></label>
          </details>
          <div className="form-actions"><Dialog.Close className="button secondary" type="button">Cancel</Dialog.Close><button className="button primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
