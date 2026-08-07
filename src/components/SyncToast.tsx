import { useEffect, useRef, useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react/CheckCircle'
import { CloudArrowUp } from '@phosphor-icons/react/CloudArrowUp'
import { SpinnerGap } from '@phosphor-icons/react/SpinnerGap'
import { WarningCircle } from '@phosphor-icons/react/WarningCircle'
import type { SyncState } from '../domain/types'

const copy: Record<SyncState, { title: string; detail: string }> = {
  saving: { title: 'Saving changes…', detail: 'Sending this edit to your private cloud.' },
  saved: { title: 'Saved', detail: 'Your change is safely stored in the cloud.' },
  waiting: { title: 'Waiting to sync', detail: 'Your change is safe on this device and will upload when you are online.' },
  attention: { title: 'Could not save to cloud', detail: 'Your edit is still safe on this device.' }
}

export function SyncToast({ state, error, onRetry, onSignIn }: { state: SyncState; error?: string; onRetry: () => void; onSignIn: () => void }) {
  const [visible, setVisible] = useState(state !== 'saved')
  const previous = useRef(state)

  useEffect(() => {
    const changed = previous.current !== state
    previous.current = state
    if (state === 'saved' && !changed) return
    setVisible(true)
    if (state !== 'saved') return
    const timer = window.setTimeout(() => setVisible(false), 4_000)
    return () => clearTimeout(timer)
  }, [state])

  if (!visible) return null
  const Icon = state === 'saving' ? SpinnerGap : state === 'waiting' ? CloudArrowUp : state === 'attention' ? WarningCircle : CheckCircle
  const detail = state === 'attention' && error ? error : copy[state].detail
  const needsSignIn = state === 'attention' && error?.startsWith('Sign in')
  return <section className={`sync-toast sync-toast-${state}`} role={state === 'attention' ? 'alert' : 'status'} aria-live={state === 'attention' ? 'assertive' : 'polite'} aria-atomic="true">
    <Icon className={state === 'saving' ? 'sync-toast-spinner' : undefined} size={24} weight="bold" aria-hidden="true" />
    <div><strong>{copy[state].title}</strong><span dir="auto">{detail}</span></div>
    {state === 'attention' ? <button type="button" onClick={needsSignIn ? onSignIn : onRetry}>{needsSignIn ? 'Sign in' : 'Retry'}</button> : null}
  </section>
}
