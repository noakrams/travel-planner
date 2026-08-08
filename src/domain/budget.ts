import { budgetCategories, convertCurrency, inferBudgetCategory } from './currency'
import type { BudgetCategory, ContentItem, CurrencyCode, Trip } from './types'

export function buildBudgetBreakdown(items: ContentItem[], trip: Trip, displayCurrency: CurrencyCode) {
  const grouped = new Map<BudgetCategory, { cost: number; count: number }>(
    budgetCategories.map((category) => [category, { cost: 0, count: 0 }])
  )
  for (const item of items) {
    if (item.plannedAmount === undefined || !item.currency) continue
    const category = inferBudgetCategory(item)
    const current = grouped.get(category)!
    current.cost += convertCurrency(item.plannedAmount, item.currency, displayCurrency)
    current.count += 1
  }
  return budgetCategories.map((category) => ({
    category,
    ...grouped.get(category)!,
    limit: convertCurrency(trip.categoryBudgets[category] ?? 0, trip.budgetCurrency, displayCurrency)
  }))
}
