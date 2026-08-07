import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CaretDown } from '@phosphor-icons/react/CaretDown'
import { CaretUp } from '@phosphor-icons/react/CaretUp'
import { Copy } from '@phosphor-icons/react/Copy'
import { DotsThree } from '@phosphor-icons/react/DotsThree'
import { PencilSimple } from '@phosphor-icons/react/PencilSimple'
import { Trash } from '@phosphor-icons/react/Trash'
import { useState } from 'react'
import type { ContentItem } from '../domain/types'

export function ItemActions({ item, onEdit, onDuplicate, onMove, onDelete }: {
  item: ContentItem; onEdit: () => void; onDuplicate: () => void; onMove: (delta: -1 | 1) => void; onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return <>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="icon-button card-menu" aria-label={`Actions for ${item.title}`}><DotsThree size={22} weight="bold" /></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content className="menu-content" sideOffset={6} align="end">
        <DropdownMenu.Item onSelect={onEdit}><PencilSimple />Edit</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={onDuplicate}><Copy />Duplicate</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => onMove(-1)}><CaretUp />Move up</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => onMove(1)}><CaretDown />Move down</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item className="danger-item" onSelect={() => setConfirming(true)}><Trash />Delete</DropdownMenu.Item>
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
    <AlertDialog.Root open={confirming} onOpenChange={setConfirming}><AlertDialog.Portal>
      <AlertDialog.Overlay className="dialog-overlay" />
      <AlertDialog.Content className="confirm-dialog"><AlertDialog.Title>Delete this item?</AlertDialog.Title><AlertDialog.Description>You can undo this immediately after deletion.</AlertDialog.Description><div className="form-actions"><AlertDialog.Cancel className="button secondary">Keep item</AlertDialog.Cancel><AlertDialog.Action className="button danger" onClick={onDelete}>Delete</AlertDialog.Action></div></AlertDialog.Content>
    </AlertDialog.Portal></AlertDialog.Root>
  </>
}
