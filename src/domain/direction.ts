const strongRtl = /[\u0590-\u05ff\u0600-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/
const strongLtr = /[A-Za-z\u00c0-\u02af]/

export function directionOf(value: string): 'rtl' | 'ltr' | 'auto' {
  for (const character of value) {
    if (strongRtl.test(character)) return 'rtl'
    if (strongLtr.test(character)) return 'ltr'
  }
  return 'auto'
}
