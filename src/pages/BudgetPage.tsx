import { Bed, BowlFood, Compass, DotsThreeCircle, PencilSimple, ShoppingBag, Train } from '@phosphor-icons/react'
import { useState, type ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BudgetSettingsDialog } from '../components/BudgetSettingsDialog'
import { TripLayout } from '../components/TripLayout'
import { convertCurrency, fixedExchangeRates, formatCurrency, supportedCurrencies } from '../domain/currency'
import type { BudgetCategory, ContentItem, CurrencyCode, Trip } from '../domain/types'
import { budgetCategoryLabels } from '../domain/types'
import { useTravelMutations } from '../hooks/useTravelData'
import { buildBudgetBreakdown } from '../domain/budget'

const categoryIcons: Record<BudgetCategory, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  accommodation: Bed,
  transportation: Train,
  food: BowlFood,
  activities: Compass,
  shopping: ShoppingBag,
  other: DotsThreeCircle
}

const categoryColors: Record<BudgetCategory, string> = {
  accommodation: 'var(--route)',
  transportation: 'var(--signal-dark)',
  food: 'var(--stamp)',
  activities: 'var(--sky)',
  shopping: 'var(--plum)',
  other: 'var(--atlas-muted)'
}

export default function BudgetPage() {
  return <TripLayout>{({ trip, items, editMode }) => <BudgetContent trip={trip} items={items} editMode={editMode} />}</TripLayout>
}

function BudgetContent({ trip, items, editMode }: { trip: Trip; items: ContentItem[]; editMode: boolean }) {
  const mutations = useTravelMutations(trip.id)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(trip.displayCurrency)
  const breakdown = buildBudgetBreakdown(items, trip, displayCurrency)
  const planned = breakdown.reduce((sum, entry) => sum + entry.cost, 0)
  const totalBudget = convertCurrency(trip.budgetAmount, trip.budgetCurrency, displayCurrency)
  const remaining = totalBudget - planned
  const progress = totalBudget > 0 ? Math.min(100, (planned / totalBudget) * 100) : 0
  const pricedItems = items.filter((item) => item.plannedAmount !== undefined && item.currency).length

  const changeDisplayCurrency = (value: string) => {
    const currency = value as CurrencyCode
    setDisplayCurrency(currency)
    if (editMode && currency !== trip.displayCurrency) mutations.saveTrip.mutate({ ...trip, displayCurrency: currency })
  }

  return <>
    <section className="budget-page">
      <header className="budget-heading">
        <div><p className="eyebrow">{trip.title} · Budget</p><h2>Know what the plan costs.</h2><p>Prices stay in the currency you entered. Roam converts the overview with one fixed rate snapshot.</p></div>
        <div className="budget-heading-actions">
          <div className="display-currency"><label htmlFor="display-currency">Show totals in</label><Select value={displayCurrency} onValueChange={changeDisplayCurrency}><SelectTrigger id="display-currency"><SelectValue /></SelectTrigger><SelectContent>{supportedCurrencies.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent></Select></div>
          {editMode ? <Button onClick={() => setSettingsOpen(true)}><PencilSimple aria-hidden="true" />Set budgets</Button> : null}
        </div>
      </header>

      <section className="budget-hero" aria-label="Trip budget summary">
        <div className="budget-total">
          <span>Total trip budget</span>
          <strong>{totalBudget > 0 ? formatCurrency(totalBudget, displayCurrency) : 'Not set'}</strong>
          <div className="budget-total-progress"><Progress value={progress} aria-label={`${Math.round(progress)} percent of trip budget assigned`} /><div><span>{Math.round(progress)}% assigned</span><span>{pricedItems} priced plan items</span></div></div>
        </div>
        <div className="budget-metric"><span>Plan cost</span><strong>{formatCurrency(planned, displayCurrency)}</strong><small>From every priced item</small></div>
        <div className={`budget-metric ${remaining < 0 ? 'is-over' : ''}`}><span>{remaining < 0 ? 'Over budget' : 'Still available'}</span><strong>{totalBudget > 0 ? formatCurrency(Math.abs(remaining), displayCurrency) : '—'}</strong><small>{totalBudget > 0 ? remaining < 0 ? 'Adjust the plan or limits' : 'Not assigned yet' : 'Set a trip budget to compare'}</small></div>
      </section>

      <section className="budget-breakdown" aria-labelledby="category-heading">
        <div className="budget-section-heading"><div><p className="eyebrow">Categories</p><h3 id="category-heading">Where the budget goes</h3></div><p>Category limits use {trip.budgetCurrency}; values below are shown in {displayCurrency}.</p></div>
        <div className="category-list">{breakdown.map((entry) => {
          const Icon = categoryIcons[entry.category]
          const ratio = entry.limit > 0 ? Math.min(100, (entry.cost / entry.limit) * 100) : 0
          const left = entry.limit - entry.cost
          return <article className="category-row" key={entry.category} style={{ '--category-color': categoryColors[entry.category] } as React.CSSProperties}>
            <div className="category-icon"><Icon size={21} aria-hidden={true} /></div>
            <div className="category-copy"><strong>{budgetCategoryLabels[entry.category]}</strong><span>{entry.count} {entry.count === 1 ? 'item' : 'items'}</span></div>
            <div className="category-progress"><Progress value={ratio} /><div><span>{formatCurrency(entry.cost, displayCurrency)} planned</span><span>{entry.limit > 0 ? `of ${formatCurrency(entry.limit, displayCurrency)}` : 'No category limit'}</span></div></div>
            <div className={`category-remaining ${left < 0 ? 'is-over' : ''}`}><strong>{entry.limit > 0 ? formatCurrency(Math.abs(left), displayCurrency) : '—'}</strong><span>{entry.limit > 0 ? left < 0 ? 'over' : 'left' : 'unlimited'}</span></div>
          </article>
        })}</div>
      </section>

      <p className="rate-note">Fixed conversion snapshot: {fixedExchangeRates.effectiveDate} · {fixedExchangeRates.source}. Original item prices are never rewritten.</p>
    </section>
    {settingsOpen ? <BudgetSettingsDialog trip={trip} open onOpenChange={setSettingsOpen} onSave={mutations.saveTrip.mutateAsync} /> : null}
  </>
}
