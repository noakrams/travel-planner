# Shared UI components

These primitives are the reusable UI layer for Roam. Import the component from its own file so Vite can keep route bundles small.

| Need | Component | Notes |
| --- | --- | --- |
| Action | `button.tsx` | Variants, sizes, icon buttons, and `asChild` links |
| Text input | `input.tsx`, `textarea.tsx`, `label.tsx` | Consistent focus, validation, and disabled states |
| Dropdown selection | `select.tsx` | Radix keyboard navigation and mobile-safe menu portal |
| Action menu | `dropdown-menu.tsx` | Items, groups, labels, checkboxes, radios, and submenus |
| Modal | `dialog.tsx` | General editing and settings dialogs |
| Confirmation | `alert-dialog.tsx` | Destructive or irreversible decisions |
| Drawer / sheet | `drawer.tsx` | `top`, `right`, `bottom`, or `left`; use bottom on mobile workflows |
| Notification | `toast.tsx` | Global loading, success, error, and informational feedback |
| Navigation | `tabs.tsx` | Keyboard-accessible tab lists and panels |
| Context help | `tooltip.tsx` | Short supplementary labels only |
| Status | `badge.tsx`, `progress.tsx` | Compact state labels and measurable progress |
| Structure | `separator.tsx` | Accessible visual or semantic separators |

## Toast example

```tsx
const toast = useToast()
const id = toast.loading('Saving changes…')

try {
  await save()
  toast.success('Saved', 'Your changes are stored on this device.', id)
} catch (error) {
  toast.error('Could not save', getErrorMessage(error), id)
}
```

## Drawer example

```tsx
<Drawer>
  <DrawerTrigger asChild><Button>Open filters</Button></DrawerTrigger>
  <DrawerContent side="bottom">
    <DrawerHeader>
      <DrawerTitle>Filters</DrawerTitle>
      <DrawerDescription>Narrow the itinerary.</DrawerDescription>
    </DrawerHeader>
  </DrawerContent>
</Drawer>
```
