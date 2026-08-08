import { describe, expect, it } from 'vitest'
import { convertCurrency, formatCurrency, inferBudgetCategory } from './currency'

describe('fixed currency conversion', () => {
  it('uses the July 30 Bank of Israel snapshot', () => {
    expect(convertCurrency(100, 'JPY', 'ILS')).toBeCloseTo(1.8859, 4)
    expect(convertCurrency(1, 'USD', 'ILS')).toBeCloseTo(3.073, 4)
    expect(convertCurrency(1, 'USD', 'JPY')).toBeCloseTo(162.946, 3)
  })

  it('formats each supported currency clearly', () => {
    expect(formatCurrency(9600, 'JPY')).toContain('9,600')
    expect(formatCurrency(120, 'ILS')).toContain('120')
    expect(formatCurrency(42.5, 'USD')).toContain('42.50')
  })

  it('derives sensible categories for older items', () => {
    expect(inferBudgetCategory({ kind: 'stay' })).toBe('accommodation')
    expect(inferBudgetCategory({ kind: 'food' })).toBe('food')
    expect(inferBudgetCategory({ kind: 'note' })).toBe('other')
    expect(inferBudgetCategory({ kind: 'activity', budgetCategory: 'shopping' })).toBe('shopping')
  })
})
