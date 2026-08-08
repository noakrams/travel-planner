import { CaretDown, CaretUp, Copy, DotsThree, PencilSimple, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ContentItem } from '../domain/types'

export function ItemActions({ item, onEdit, onDuplicate, onMove, onDelete }: {
  item: ContentItem
  onEdit: () => void
  onDuplicate: () => void
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button className="card-menu" variant="secondary" size="icon" aria-label={`Actions for ${item.title}`}><DotsThree weight="bold" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={7} className="item-menu">
        <DropdownMenuItem onSelect={onEdit}><PencilSimple />Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}><Copy />Duplicate</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onMove(-1)}><CaretUp />Move up</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onMove(1)}><CaretDown />Move down</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}><Trash />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AlertDialog open={confirming} onOpenChange={setConfirming}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this item?</AlertDialogTitle><AlertDialogDescription>You can undo this immediately after deletion.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep item</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>
}
