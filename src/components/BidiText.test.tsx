import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BidiText } from './BidiText'

describe('BidiText', () => {
  it('isolates Hebrew content without changing surrounding UI direction', () => {
    render(<div dir="ltr"><button>Save</button><BidiText value="להזמין Prado at 20:30">להזמין Prado at 20:30</BidiText></div>)
    expect(screen.getByText('Save').closest('div')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText('להזמין Prado at 20:30')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByText('להזמין Prado at 20:30')).toHaveClass('bidi-text')
  })
})
