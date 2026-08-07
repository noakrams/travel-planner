import { describe, expect, it } from 'vitest'
import { directionOf } from './direction'

describe('directionOf', () => {
  it('detects English, Hebrew, and neutral values', () => {
    expect(directionOf('Lisbon')).toBe('ltr')
    expect(directionOf('תזכורת לערב')).toBe('rtl')
    expect(directionOf('123 / ¥')).toBe('auto')
  })

  it('uses the first strong character for mixed-direction content', () => {
    expect(directionOf('Prado — להזמין ל־20:30')).toBe('ltr')
    expect(directionOf('להזמין Prado at 20:30')).toBe('rtl')
  })
})
