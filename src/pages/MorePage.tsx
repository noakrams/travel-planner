import { zodResolver } from '@hookform/resolvers/zod'
import { Check, MagnifyingGlass, PencilSimple, Plus, Tag, Trash, X } from '@phosphor-icons/react'
import { useDeferredValue, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TripLayout } from '../components/TripLayout'
import type { ContentItem, ItemAttachment, Trip } from '../domain/types'
import { useTravelMutations } from '../hooks/useTravelData'

const tipSchema = z.object({
  title: z.string().trim().min(1, 'Add a short title.'),
  description: z.string().trim().min(1, 'Add the tip details.')
})

type TipValues = z.infer<typeof tipSchema>

const tipLabelPrefix = 'tip-label://'
const searchAliases: Record<string, string[]> = {
  arrival: ['entry', 'land', 'airport'],
  food: ['restaurant', 'dinner', 'lunch'],
  money: ['cash', 'yen', 'payment'],
  train: ['transit', 'station', 'rail']
}

function tipLabels(item: ContentItem) {
  return (item.attachments ?? []).flatMap((attachment) =>
    attachment.url.startsWith(tipLabelPrefix) && attachment.label.trim()
      ? [attachment.label.trim()]
      : []
  )
}

function labelAttachments(labels: string[]): ItemAttachment[] {
  return labels.map((label) => ({
    id: `tip-label-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    kind: 'link',
    label,
    url: `${tipLabelPrefix}${encodeURIComponent(label.toLowerCase())}`
  }))
}

function searchMatches(tip: ContentItem, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true
  const haystack = `${tip.title} ${tip.description}`.toLowerCase()
  return query.split(/\s+/).every((word) => {
    const candidates = [word, ...(searchAliases[word] ?? [])]
    return candidates.some((candidate) => haystack.includes(candidate))
  })
}

export function MorePage() {
  return <TripLayout>{({ trip, items, editMode }) => <TipsPage trip={trip} items={items} editMode={editMode} />}</TripLayout>
}

function TipsPage({ trip, items, editMode }: { trip: Trip; items: ContentItem[]; editMode: boolean }) {
  const mutations = useTravelMutations(trip.id)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [activeLabel, setActiveLabel] = useState<string>()
  const [editing, setEditing] = useState<ContentItem | null | undefined>()
  const tips = useMemo(
    () => items.filter((item) => item.kind === 'note' && item.noteType === 'tip'),
    [items]
  )
  const labels = useMemo(
    () => [...new Set(tips.flatMap(tipLabels))].toSorted((a, b) => a.localeCompare(b)),
    [tips]
  )
  const visibleTips = useMemo(
    () =>
      tips.filter(
        (tip) =>
          searchMatches(tip, deferredQuery) &&
          (!activeLabel || tipLabels(tip).some((label) => label === activeLabel))
      ),
    [activeLabel, deferredQuery, tips]
  )

  return (
    <section className="tips-page" aria-labelledby="tips-heading">
      <header className="tips-page-header">
        <div>
          <p className="eyebrow">{trip.title} field notes</p>
          <h1 id="tips-heading">Tips</h1>
          <p>Small things worth remembering, ready when you need them.</p>
        </div>
        {editMode ? (
          <Button className="tips-add-button" onClick={() => setEditing(null)}>
            <Plus weight="bold" aria-hidden="true" />
            Add tip
          </Button>
        ) : null}
      </header>

      <div className="tips-search">
        <Label className="visually-hidden" htmlFor="tip-search">
          Search tips
        </Label>
        <MagnifyingGlass aria-hidden="true" />
        <Input
          id="tip-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles and details"
        />
        {query ? (
          <button type="button" aria-label="Clear tip search" onClick={() => setQuery('')}>
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {labels.length ? (
        <nav className="tips-label-filter" aria-label="Filter tips by label">
          <button
            className={!activeLabel ? 'active' : undefined}
            type="button"
            onClick={() => setActiveLabel(undefined)}
          >
            All <span>{tips.length}</span>
          </button>
          {labels.map((label) => (
            <button
              className={activeLabel === label ? 'active' : undefined}
              key={label}
              type="button"
              onClick={() => setActiveLabel(label)}
            >
              {label}
            </button>
          ))}
        </nav>
      ) : null}

      {visibleTips.length ? (
        <div className="tips-list">
          {visibleTips.map((tip) => (
            <article className="tip-card" key={tip.id}>
              <div className="tip-card-copy">
                <h2>{tip.title}</h2>
                <p>{tip.description}</p>
              </div>
              {tipLabels(tip).length ? (
                <div className="tip-card-labels" aria-label="Labels">
                  {tipLabels(tip).map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              ) : null}
              {editMode ? (
                <div className="tip-card-actions">
                  <Button variant="ghost" size="icon-lg" onClick={() => setEditing(tip)} aria-label={`Edit ${tip.title}`}>
                    <PencilSimple aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    onClick={() => void mutations.deleteRecord.mutateAsync({ entity: 'item', id: tip.id })}
                    aria-label={`Delete ${tip.title}`}
                  >
                    <Trash aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="tips-empty">
          <Tag aria-hidden="true" />
          <h2>{query || activeLabel ? 'No matching tips' : 'Your tips start here'}</h2>
          <p>
            {query || activeLabel
              ? 'Try another word or clear the current filter.'
              : editMode
                ? 'Add the little pieces of travel wisdom you want close at hand.'
                : 'Switch on edit mode to add your first tip.'}
          </p>
          {editMode && !query && !activeLabel ? (
            <Button onClick={() => setEditing(null)}>
              <Plus weight="bold" aria-hidden="true" />
              Add your first tip
            </Button>
          ) : null}
        </div>
      )}

      <TipDialog
        availableLabels={labels}
        initial={editing ?? undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        open={editing !== undefined}
        onSave={async (values, selectedLabels) => {
          await mutations.saveItem.mutateAsync({
            ...editing,
            tripId: trip.id,
            kind: 'note',
            noteType: 'tip',
            title: values.title,
            description: values.description,
            dayId: undefined,
            attachments: labelAttachments(selectedLabels)
          })
          setEditing(undefined)
        }}
      />
    </section>
  )
}

function TipDialog({
  availableLabels,
  initial,
  onOpenChange,
  open,
  onSave
}: {
  availableLabels: string[]
  initial?: ContentItem
  onOpenChange: (open: boolean) => void
  open: boolean
  onSave: (values: TipValues, labels: string[]) => Promise<void>
}) {
  const [labelQuery, setLabelQuery] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const form = useForm<TipValues>({ resolver: zodResolver(tipSchema), defaultValues: { title: '', description: '' } })
  const dialogKey = initial?.id ?? 'new'
  const reset = () => {
    form.reset({ title: initial?.title ?? '', description: initial?.description ?? '' })
    setSelectedLabels(initial ? tipLabels(initial) : [])
    setLabelQuery('')
  }
  const normalizedQuery = labelQuery.trim().replace(/\s+/g, ' ')
  const matchingLabels = availableLabels.filter(
    (label) => label.toLocaleLowerCase().includes(normalizedQuery.toLocaleLowerCase()) && !selectedLabels.includes(label)
  )
  const canCreate = Boolean(normalizedQuery) && !availableLabels.some((label) => label.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase())
  const toggleLabel = (label: string) => {
    setSelectedLabels((current) => current.includes(label) ? current.filter((value) => value !== label) : [...current, label])
    setLabelQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tip-dialog" onOpenAutoFocus={reset}>
        <DialogHeader>
          <p className="eyebrow">{initial ? 'Refine a note' : 'Field note'}</p>
          <DialogTitle>{initial ? 'Edit tip' : 'Add a tip'}</DialogTitle>
          <DialogDescription>A title helps future-you find it quickly.</DialogDescription>
        </DialogHeader>
        <form
          key={dialogKey}
          className="tip-form"
          onSubmit={form.handleSubmit(async (values) => onSave(values, selectedLabels))}
          noValidate
        >
          <div className="form-field">
            <Label htmlFor="tip-title">Title</Label>
            <Input id="tip-title" {...form.register('title')} aria-invalid={Boolean(form.formState.errors.title)} />
            {form.formState.errors.title ? <p className="field-error">{form.formState.errors.title.message}</p> : null}
          </div>
          <div className="form-field">
            <Label htmlFor="tip-description">Details</Label>
            <Textarea id="tip-description" rows={4} {...form.register('description')} aria-invalid={Boolean(form.formState.errors.description)} />
            {form.formState.errors.description ? <p className="field-error">{form.formState.errors.description.message}</p> : null}
          </div>
          <fieldset className="tip-label-picker">
            <legend>Labels <span>(optional)</span></legend>
            {selectedLabels.length ? (
              <div className="tip-selected-labels">
                {selectedLabels.map((label) => (
                  <button key={label} type="button" onClick={() => toggleLabel(label)}>{label}<X aria-hidden="true" /></button>
                ))}
              </div>
            ) : <p>No labels yet. Add one below.</p>}
            <div className="tip-label-search">
              <MagnifyingGlass aria-hidden="true" />
              <Input value={labelQuery} onChange={(event) => setLabelQuery(event.target.value)} placeholder="Search or create a label" />
            </div>
            {(labelQuery || matchingLabels.length) ? (
              <div className="tip-label-options" role="listbox" aria-label="Available labels">
                {matchingLabels.map((label) => <button key={label} type="button" onClick={() => toggleLabel(label)}><Check aria-hidden="true" />{label}</button>)}
                {canCreate ? <button type="button" onClick={() => toggleLabel(normalizedQuery)}><Plus aria-hidden="true" />Create “{normalizedQuery}”</button> : null}
                {!matchingLabels.length && !canCreate ? <p>No labels match this search.</p> : null}
              </div>
            ) : null}
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{initial ? 'Save changes' : 'Save tip'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
