import { CheckCircle } from '@phosphor-icons/react/CheckCircle'
import { CloudArrowUp } from '@phosphor-icons/react/CloudArrowUp'
import { WarningCircle } from '@phosphor-icons/react/WarningCircle'
import type { SyncState } from '../domain/types'

const labels: Record<SyncState, string> = {
  saving: 'Saving', saved: 'Saved', waiting: 'Waiting to sync', attention: 'Needs attention'
}

export function SyncBadge({ state, onRetry }: { state: SyncState; onRetry?: () => void }) {
  const Icon = state === 'attention' ? WarningCircle : state === 'waiting' ? CloudArrowUp : CheckCircle
  if (state === 'attention' && onRetry) return <button className="sync-badge sync-attention" onClick={onRetry}><Icon size={16} weight="bold" aria-hidden="true" />Needs attention — Retry</button>
  return <span className={`sync-badge sync-${state}`} role="status"><Icon size={16} weight="bold" aria-hidden="true" />{labels[state]}</span>
}
