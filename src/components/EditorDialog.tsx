import { zodResolver } from '@hookform/resolvers/zod'
import { EnvelopeSimple, ImageSquare, LinkSimple, MapPin, Paperclip, Plus, Receipt, Trash, UploadSimple } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { budgetCategories, inferBudgetCategory, supportedCurrencies } from '../domain/currency'
import type { BudgetCategory, ContentItem, ContentKind, CurrencyCode, TripDay } from '../domain/types'
import { budgetCategoryLabels, contentKindLabels } from '../domain/types'
import { resizePhoto } from '../data/images'
import { localRepository } from '../data/repository'

const schema = z.object({
  kind: z.string(),
  title: z.string().trim().min(1, 'Add a title.'),
  description: z.string(),
  startTime: z.string(),
  location: z.string(),
  mapsUrl: z.union([z.literal(''), z.url('Enter a complete URL, including https://.')]),
  attachments: z.array(z.object({
    id: z.string(),
    kind: z.enum(['email', 'link', 'file']),
    label: z.string().trim().min(1, 'Add a label.'),
    url: z.url('Enter a complete URL, including https://.')
  })),
  imageUrl: z.union([z.literal(''), z.url('Enter a complete image URL, including https://.')]),
  imageAlt: z.string(),
  cost: z.string().refine((value) => !value || Number(value) >= 0, 'Cost cannot be negative.'),
  currency: z.string(),
  budgetCategory: z.string()
}).refine((value) => !value.imageUrl || value.imageAlt.trim().length > 0, {
  path: ['imageAlt'],
  message: 'Describe the image for people who cannot see it.'
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  dayId?: string
  initial?: ContentItem
  defaultKind?: ContentKind
  defaultCurrency?: CurrencyCode
  days?: TripDay[]
  onSave: (item: Partial<ContentItem> & Pick<ContentItem, 'tripId' | 'kind' | 'title'>) => Promise<unknown>
}

function emptyValues(kind: ContentKind, currency: CurrencyCode): FormValues {
  return {
    kind,
    title: '',
    description: '',
    startTime: '',
    location: '',
    mapsUrl: '',
    attachments: [],
    imageUrl: '',
    imageAlt: '',
    cost: '',
    currency,
    budgetCategory: inferBudgetCategory({ kind })
  }
}

export function EditorDialog({
  open,
  onOpenChange,
  tripId,
  dayId,
  initial,
  defaultKind = 'activity',
  defaultCurrency = 'JPY',
  onSave
}: Props) {
  const [photo, setPhoto] = useState<File>()
  const toast = useToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues(defaultKind, defaultCurrency),
    mode: 'onBlur'
  })
  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control,
    name: 'attachments',
    keyName: '_fieldId'
  })

  useEffect(() => {
    reset(initial ? {
      kind: initial.kind,
      title: initial.title,
      description: initial.description,
      startTime: initial.startTime ?? '',
      location: initial.location ?? '',
      mapsUrl: initial.mapsUrl ?? '',
      attachments: initial.attachments?.length ? initial.attachments : initial.emailUrl ? [{
        id: 'legacy-email', kind: 'email', label: 'Confirmation email', url: initial.emailUrl
      }] : [],
      imageUrl: initial.imageUrl ?? '',
      imageAlt: initial.imageAlt ?? '',
      cost: initial.plannedAmount?.toString() ?? '',
      currency: initial.currency ?? defaultCurrency,
      budgetCategory: inferBudgetCategory(initial)
    } : emptyValues(defaultKind, defaultCurrency))
  }, [defaultCurrency, defaultKind, initial, open, reset])

  const submit = async (values: FormValues) => {
    if (photo && !values.imageAlt.trim()) {
      setError('imageAlt', { message: 'Describe the uploaded image for people who cannot see it.' })
      return
    }
    let saveStarted = false
    try {
      let imageUrl = values.imageUrl || undefined
      if (photo) {
        const media = await localRepository.queuePhoto(tripId, await resizePhoto(photo), values.imageAlt)
        imageUrl = `local-media:${media.id}`
      }
      saveStarted = true
      await onSave({
        ...initial,
        tripId,
        dayId: initial?.dayId ?? dayId,
        kind: values.kind as ContentKind,
        title: values.title,
        description: values.description,
        startTime: values.startTime || undefined,
        location: values.location || undefined,
        mapsUrl: values.mapsUrl || undefined,
        emailUrl: values.attachments.find((attachment) => attachment.kind === 'email')?.url,
        attachments: values.attachments,
        imageUrl,
        imageAlt: values.imageAlt || undefined,
        plannedAmount: values.cost ? Number(values.cost) : undefined,
        actualAmount: undefined,
        currency: values.cost ? values.currency as CurrencyCode : undefined,
        budgetCategory: values.cost ? values.budgetCategory as BudgetCategory : undefined
      })
      setPhoto(undefined)
      onOpenChange(false)
    } catch (error) {
      if (!saveStarted) toast.error('Could not prepare the photo', error instanceof Error ? error.message : 'Choose a different photo and try again.')
    }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="editor-dialog" aria-describedby="editor-description">
      <DialogHeader className="editor-dialog-header">
        <p className="eyebrow">{initial ? 'Plan item' : 'Add to the route'}</p>
        <DialogTitle>{initial ? 'Edit the details' : 'What belongs in the plan?'}</DialogTitle>
        <DialogDescription id="editor-description">Changes save on this device first and sync when a connection is available.</DialogDescription>
      </DialogHeader>
      <form className="editor-form" onSubmit={handleSubmit(submit)} noValidate>
        <div className="form-field">
          <Label htmlFor="item-type">Type</Label>
          <Controller name="kind" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id="item-type" className="form-select"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(contentKindLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>} />
        </div>
        <div className="form-field form-field-wide">
          <Label htmlFor="item-title">Title</Label>
          <Input id="item-title" dir="auto" {...register('title')} aria-invalid={Boolean(errors.title)} />
          {errors.title ? <p className="field-error" role="alert">{errors.title.message}</p> : null}
        </div>
        <div className="form-field form-field-wide">
          <Label htmlFor="item-notes">Notes</Label>
          <Textarea id="item-notes" dir="auto" rows={4} {...register('description')} />
        </div>
        <div className="form-field">
          <Label htmlFor="item-time">Time</Label>
          <Input id="item-time" type="time" {...register('startTime')} />
        </div>
        <div className="form-field">
          <Label htmlFor="item-location"><MapPin aria-hidden="true" />Location</Label>
          <Input id="item-location" dir="auto" {...register('location')} />
        </div>
        <div className="form-field form-field-wide">
          <Label htmlFor="maps-url">Google Maps URL</Label>
          <Input id="maps-url" type="url" inputMode="url" {...register('mapsUrl')} aria-invalid={Boolean(errors.mapsUrl)} />
          {errors.mapsUrl ? <p className="field-error" role="alert">{errors.mapsUrl.message}</p> : null}
        </div>
        <details className="form-section form-field-wide attachment-fields">
          <summary><Paperclip aria-hidden="true" />Confirmations &amp; tickets{attachmentFields.length ? <span className="attachment-count">{attachmentFields.length}</span> : null}</summary>
          <div className="attachment-fields-inner">
            <p className="helper-text">Add reservation emails, booking confirmations, flight tickets, vouchers, or file links here. Google Maps belongs in the location field above. These documents stay private when the trip is shared.</p>
            {attachmentFields.map((field, index) => <div className="attachment-editor-row" key={field._fieldId}>
              <div className="form-field attachment-kind">
                <Label htmlFor={`attachment-kind-${index}`}>Type</Label>
                <Controller name={`attachments.${index}.kind`} control={control} render={({ field: kindField }) => <Select value={kindField.value} onValueChange={kindField.onChange}>
                  <SelectTrigger id={`attachment-kind-${index}`} className="form-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email"><EnvelopeSimple aria-hidden="true" />Confirmation email</SelectItem>
                    <SelectItem value="link"><LinkSimple aria-hidden="true" />Booking or ticket link</SelectItem>
                    <SelectItem value="file"><Paperclip aria-hidden="true" />Voucher or file link</SelectItem>
                  </SelectContent>
                </Select>} />
              </div>
              <div className="form-field attachment-label">
                <Label htmlFor={`attachment-label-${index}`}>Label</Label>
                <Input id={`attachment-label-${index}`} dir="auto" {...register(`attachments.${index}.label`)} aria-invalid={Boolean(errors.attachments?.[index]?.label)} />
                {errors.attachments?.[index]?.label ? <p className="field-error" role="alert">{errors.attachments[index]?.label?.message}</p> : null}
              </div>
              <div className="form-field attachment-url">
                <Label htmlFor={`attachment-url-${index}`}>URL</Label>
                <Input id={`attachment-url-${index}`} type="url" inputMode="url" placeholder="https://…" {...register(`attachments.${index}.url`)} aria-invalid={Boolean(errors.attachments?.[index]?.url)} />
                {errors.attachments?.[index]?.url ? <p className="field-error" role="alert">{errors.attachments[index]?.url?.message}</p> : null}
              </div>
              <Button className="attachment-remove" type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)} aria-label={`Remove attachment ${index + 1}`}><Trash aria-hidden="true" /></Button>
            </div>)}
            <Button className="attachment-add" type="button" variant="outline" onClick={() => appendAttachment({ id: crypto.randomUUID(), kind: 'link', label: 'Reservation confirmation', url: '' })}><Plus aria-hidden="true" />Add confirmation or ticket</Button>
          </div>
        </details>

        <section className="form-section form-field-wide" aria-labelledby="cost-heading">
          <div className="form-section-heading"><Receipt aria-hidden="true" /><div><h3 id="cost-heading">Cost</h3><p>Enter the price in the currency you were quoted.</p></div></div>
          <div className="cost-fields">
            <div className="form-field">
              <Label htmlFor="item-cost">Amount</Label>
              <Input id="item-cost" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0" {...register('cost')} aria-invalid={Boolean(errors.cost)} />
              {errors.cost ? <p className="field-error" role="alert">{errors.cost.message}</p> : null}
            </div>
            <div className="form-field">
              <Label htmlFor="item-currency">Currency</Label>
              <Controller name="currency" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="item-currency" className="form-select"><SelectValue /></SelectTrigger>
                <SelectContent>{supportedCurrencies.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent>
              </Select>} />
            </div>
            <div className="form-field cost-category">
              <Label htmlFor="budget-category">Budget category</Label>
              <Controller name="budgetCategory" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="budget-category" className="form-select"><SelectValue /></SelectTrigger>
                <SelectContent>{budgetCategories.map((category) => <SelectItem key={category} value={category}>{budgetCategoryLabels[category]}</SelectItem>)}</SelectContent>
              </Select>} />
            </div>
          </div>
        </section>

        <details className="form-section form-field-wide photo-fields">
          <summary><ImageSquare aria-hidden="true" />Photo</summary>
          <div className="photo-fields-inner">
            <div className="form-field"><Label htmlFor="photo-upload"><UploadSimple aria-hidden="true" />Upload a photo</Label><Input id="photo-upload" type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0])} /></div>
            <p className="helper-text">Choose the camera or photo library on iPhone. Roam resizes the image and queues it offline.</p>
            <div className="form-field"><Label htmlFor="image-url">External image URL</Label><Input id="image-url" type="url" inputMode="url" {...register('imageUrl')} /></div>
            <div className="form-field"><Label htmlFor="image-alt">Image description</Label><Input id="image-alt" dir="auto" {...register('imageAlt')} aria-invalid={Boolean(errors.imageAlt)} />{errors.imageAlt ? <p className="field-error" role="alert">{errors.imageAlt.message}</p> : null}</div>
          </div>
        </details>

        <DialogFooter className="editor-actions">
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save changes'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
