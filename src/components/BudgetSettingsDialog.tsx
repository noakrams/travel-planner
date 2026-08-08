import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { budgetCategories, supportedCurrencies } from '../domain/currency'
import type { BudgetCategory, CurrencyCode, Trip } from '../domain/types'
import { budgetCategoryLabels } from '../domain/types'

interface Props {
  trip: Trip
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (trip: Trip) => Promise<unknown>
}

type DraftBudgets = Record<BudgetCategory, string>

function budgetValue(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function BudgetSettingsDialog({ trip, open, onOpenChange, onSave }: Props) {
  const [currency, setCurrency] = useState<CurrencyCode>(trip.budgetCurrency)
  const [budgets, setBudgets] = useState<DraftBudgets>(() => Object.fromEntries(
    budgetCategories.map((category) => [category, trip.categoryBudgets[category] ? String(trip.categoryBudgets[category]) : ''])
  ) as DraftBudgets)
  const [saving, setSaving] = useState(false)
  const totalAmount = budgetCategories.reduce((sum, category) => sum + budgetValue(budgets[category]), 0)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...trip,
        budgetAmount: totalAmount,
        budgetCurrency: currency,
        categoryBudgets: Object.fromEntries(budgetCategories.flatMap((category) => {
          const value = budgetValue(budgets[category])
          return value > 0 ? [[category, value]] : []
        }))
      })
      onOpenChange(false)
    } catch {
      // The shared mutation toast explains the failure and the editor stays open.
    } finally {
      setSaving(false)
    }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="budget-settings-dialog">
      <DialogHeader>
        <p className="eyebrow">Budget limits</p>
        <DialogTitle>Set the guardrails</DialogTitle>
        <DialogDescription>Use one currency for the trip budget. Individual plan items can still be entered in JPY, ILS, USD, or EUR.</DialogDescription>
      </DialogHeader>
      <form className="budget-settings-form" onSubmit={submit}>
        <div className="budget-total-fields">
          <div className="form-field calculated-budget"><div className="calculated-budget-label"><Label htmlFor="trip-budget">Total trip budget</Label><span>Calculated</span></div><Input id="trip-budget" type="number" value={totalAmount} readOnly aria-describedby="trip-budget-help" /><p id="trip-budget-help">Sum of all category budgets below.</p></div>
          <div className="form-field"><Label htmlFor="budget-currency">Currency</Label><Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}><SelectTrigger id="budget-currency" className="form-select"><SelectValue /></SelectTrigger><SelectContent>{supportedCurrencies.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="category-budget-fields">
          <div><h3>Category budgets</h3><p>Optional limits help you see where there is room left.</p></div>
          {budgetCategories.map((category) => <div className="category-budget-field" key={category}><Label htmlFor={`budget-${category}`}>{budgetCategoryLabels[category]}</Label><Input id={`budget-${category}`} type="number" inputMode="decimal" min="0" step="0.01" placeholder="No limit" value={budgets[category]} onChange={(event) => setBudgets((current) => ({ ...current, [category]: event.target.value }))} /></div>)}
        </div>
        <DialogFooter className="editor-actions">
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save budgets'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
