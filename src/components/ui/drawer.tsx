import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Drawer(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerContent({ className, children, side = 'right', showCloseButton = true, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { side?: 'top' | 'right' | 'bottom' | 'left'; showCloseButton?: boolean }) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay data-slot="drawer-overlay" className="fixed inset-0 z-50 bg-black/25 backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
    <DialogPrimitive.Content data-slot="drawer-content" data-side={side} className={cn('drawer-content', className)} {...props}>
      {children}
      {showCloseButton ? <DialogPrimitive.Close asChild><Button className="drawer-close" size="icon-sm" variant="ghost"><X /><span className="sr-only">Close</span></Button></DialogPrimitive.Close> : null}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
}

function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="drawer-header" className={cn('drawer-header', className)} {...props} />
}

function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="drawer-footer" className={cn('drawer-footer', className)} {...props} />
}

function DrawerTitle(props: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="drawer-title" {...props} />
}

function DrawerDescription(props: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="drawer-description" {...props} />
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger }
