import { Plus } from '@phosphor-icons/react/Plus'
import { useState } from 'react'
import { BidiText } from './BidiText'
import { EditorDialog } from './EditorDialog'
import { ItemActions } from './ItemActions'
import { UndoToast } from './UndoToast'
import type { ContentItem, ContentKind, Trip } from '../domain/types'
import { contentKindLabels } from '../domain/types'
import { useTravelMutations } from '../hooks/useTravelData'
import { formatCurrency } from '../domain/currency'

export function CollectionPage({ trip, items, kinds, title, intro, editMode }: { trip: Trip; items: ContentItem[]; kinds: ContentKind[]; title: string; intro: string; editMode: boolean }) {
  const mutations = useTravelMutations(trip.id)
  const [editing, setEditing] = useState<ContentItem | undefined>()
  const [open, setOpen] = useState(false)
  const [deletedId, setDeletedId] = useState<string>()
  const visible = items.filter((item) => kinds.includes(item.kind))
  return <section className="collection-page">
    <div className="collection-heading"><div><p className="eyebrow">{trip.title}</p><h2>{title}</h2><p>{intro}</p></div>{editMode ? <button className="pill dark" onClick={() => { setEditing(undefined); setOpen(true) }}><Plus />Add {contentKindLabels[kinds[0]].toLowerCase()}</button> : null}</div>
    <div className="collection-list">{visible.length ? visible.map((item) => <article className="collection-row" key={item.id}>
      <div className={`kind-mark kind-${item.kind}`}><span>{contentKindLabels[item.kind]}</span></div>
      <div><BidiText as="h3" value={item.title}>{item.title}</BidiText><BidiText as="p" value={item.description}>{item.description}</BidiText><div className="row-meta">{item.startTime ? <span>{item.startTime}</span> : null}{item.location ? <BidiText value={item.location}>{item.location}</BidiText> : null}{item.status ? <span>{item.status}</span> : null}{item.plannedAmount !== undefined && item.currency ? <span>{formatCurrency(item.plannedAmount, item.currency)}</span> : null}</div></div>
      {editMode ? <ItemActions item={item} onEdit={() => { setEditing(item); setOpen(true) }} onDuplicate={() => mutations.duplicateItem.mutate(item)} onMove={(delta) => mutations.moveItem.mutate({ item, delta, siblings: visible })} onDelete={() => { mutations.deleteRecord.mutate({ entity: 'item', id: item.id }); setDeletedId(item.id) }} /> : null}
    </article>) : <div className="empty-state"><Plus size={28} /><h3>Nothing here yet.</h3><p>{editMode ? 'Use the add button to keep the first detail.' : 'The owner has not added anything here.'}</p></div>}</div>
    <EditorDialog open={open} onOpenChange={setOpen} tripId={trip.id} initial={editing} defaultKind={kinds[0]} defaultCurrency={trip.displayCurrency} onSave={mutations.saveItem.mutateAsync} />
    {deletedId ? <UndoToast message="Item deleted" onUndo={() => { mutations.restoreRecord.mutate({ entity: 'item', id: deletedId }); setDeletedId(undefined) }} onDismiss={() => setDeletedId(undefined)} /> : null}
  </section>
}
