import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from './drawer'

it('exposes an accessible reusable drawer on every supported side', () => {
  render(<Drawer open><DrawerContent side="bottom"><DrawerTitle>Trip filters</DrawerTitle><DrawerDescription>Narrow the plan.</DrawerDescription></DrawerContent></Drawer>)
  expect(screen.getByRole('dialog', { name: 'Trip filters' })).toHaveAttribute('data-side', 'bottom')
  expect(screen.getByText('Narrow the plan.')).toBeVisible()
})
