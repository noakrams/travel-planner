import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { directionOf } from '../domain/direction'

type Props = {
  as?: ElementType
  children: ReactNode
  value?: string
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'dir'>

export function BidiText({ as, children, value, className = '', ...props }: Props) {
  const Component = as ?? 'span'
  const text = value ?? (typeof children === 'string' ? children : '')
  return <Component dir={directionOf(text)} className={`bidi-text ${className}`} {...props}>{children}</Component>
}
