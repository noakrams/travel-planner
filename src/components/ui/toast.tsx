/* eslint-disable react-refresh/only-export-components */
import { CheckCircle } from '@phosphor-icons/react/CheckCircle'
import { Info } from '@phosphor-icons/react/Info'
import { SpinnerGap } from '@phosphor-icons/react/SpinnerGap'
import { WarningCircle } from '@phosphor-icons/react/WarningCircle'
import { X } from '@phosphor-icons/react/X'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ToastVariant = 'success' | 'error' | 'loading' | 'info'

export interface ToastInput {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number | null
}

interface ToastRecord extends ToastInput {
  id: string
  variant: ToastVariant
  duration: number | null
}

interface ToastApi {
  show: (toast: ToastInput) => string
  dismiss: (id: string) => void
  loading: (title: string, description?: string) => string
  success: (title: string, description?: string, id?: string) => string
  error: (title: string, description?: string, id?: string) => string
  info: (title: string, description?: string, id?: string) => string
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback((input: ToastInput) => {
    const id = input.id ?? `toast-${++nextId.current}`
    const record: ToastRecord = {
      ...input,
      id,
      variant: input.variant ?? 'info',
      duration: input.duration === undefined ? 4_500 : input.duration
    }
    setToasts((current) => [...current.filter((toast) => toast.id !== id), record].slice(-4))
    return id
  }, [])

  const api = useMemo<ToastApi>(() => ({
    show,
    dismiss,
    loading: (title, description) => show({ title, description, variant: 'loading', duration: null }),
    success: (title, description, id) => show({ id, title, description, variant: 'success' }),
    error: (title, description, id) => show({ id, title, description, variant: 'error', duration: 7_000 }),
    info: (title, description, id) => show({ id, title, description, variant: 'info' })
  }), [dismiss, show])

  return <ToastContext.Provider value={api}>
    {children}
    {typeof document !== 'undefined' ? createPortal(<ToastViewport toasts={toasts} onDismiss={dismiss} />, document.body) : null}
  </ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider.')
  return context
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: string) => void }) {
  return <section className="toast-viewport" aria-label="Notifications">
    {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />)}
  </section>
}

const icons = { success: CheckCircle, error: WarningCircle, loading: SpinnerGap, info: Info }

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration === null) return
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [onDismiss, toast.duration, toast.id])

  const Icon = icons[toast.variant]
  const urgent = toast.variant === 'error'
  return <article className={`app-toast app-toast-${toast.variant}`} role={urgent ? 'alert' : 'status'} aria-live={urgent ? 'assertive' : 'polite'} aria-atomic="true">
    <Icon className={toast.variant === 'loading' ? 'app-toast-spinner' : undefined} size={23} weight="bold" aria-hidden="true" />
    <div><strong>{toast.title}</strong>{toast.description ? <span dir="auto">{toast.description}</span> : null}</div>
    {toast.variant !== 'loading' ? <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"><X size={17} aria-hidden="true" /></button> : null}
  </article>
}
