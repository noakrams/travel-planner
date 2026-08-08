import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { fixtureTrips } from '../data/fixtures'
import { BudgetSettingsDialog } from './BudgetSettingsDialog'

it('calculates and saves the total trip budget from category limits', async () => {
  const save = vi.fn().mockResolvedValue(undefined)
  render(<BudgetSettingsDialog trip={fixtureTrips[1]} open onOpenChange={() => undefined} onSave={save} />)

  const total = screen.getByLabelText('Total trip budget')
  expect(total).toHaveValue(900_000)
  expect(total).toHaveAttribute('readonly')

  const shopping = screen.getByLabelText('Shopping')
  await userEvent.clear(shopping)
  await userEvent.type(shopping, '60000')
  expect(total).toHaveValue(910_000)

  await userEvent.click(screen.getByRole('button', { name: 'Save budgets' }))
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({
    budgetAmount: 910_000,
    categoryBudgets: expect.objectContaining({ shopping: 60_000 })
  })))
})
