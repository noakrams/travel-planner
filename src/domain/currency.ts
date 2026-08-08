import type { BudgetCategory, ContentItem, CurrencyCode } from './types'

export const supportedCurrencies: CurrencyCode[] = ['JPY', 'ILS', 'USD', 'EUR']

export const fixedExchangeRates = {
  effectiveDate: '2026-07-30',
  source: 'Bank of Israel representative rates',
  ilsPerUnit: {
    ILS: 1,
    USD: 3.073,
    JPY: 0.018859,
    EUR: 3.5237
  } satisfies Record<CurrencyCode, number>
} as const

export const budgetCategories: BudgetCategory[] = [
  'accommodation',
  'transportation',
  'food',
  'activities',
  'shopping',
  'other'
]

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && supportedCurrencies.includes(value as CurrencyCode)
}

export function normalizeCurrency(value: unknown, fallback: CurrencyCode = 'USD'): CurrencyCode {
  return isCurrencyCode(value) ? value : fallback
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (!Number.isFinite(amount) || amount === 0 || from === to) return amount
  const amountInIls = amount * fixedExchangeRates.ilsPerUnit[from]
  return amountInIls / fixedExchangeRates.ilsPerUnit[to]
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const hasFraction = Math.abs(amount % 1) > 0.005
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: currency === 'JPY' ? 0 : hasFraction ? 2 : 0,
    maximumFractionDigits: currency === 'JPY' ? 0 : hasFraction ? 2 : 0
  }).format(amount)
}

export function inferBudgetCategory(item: Pick<ContentItem, 'kind' | 'budgetCategory'>): BudgetCategory {
  if (item.budgetCategory) return item.budgetCategory
  if (item.kind === 'stay') return 'accommodation'
  if (item.kind === 'transport') return 'transportation'
  if (item.kind === 'food') return 'food'
  if (item.kind === 'activity' || item.kind === 'place' || item.kind === 'booking') return 'activities'
  return 'other'
}
