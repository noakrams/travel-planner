import { useEffect, useState } from 'react'
import { getNeon, getOwnerAccess, hasNeonConfig } from '../data/neon'

export type OwnerAccess = 'checking' | 'signed-out' | 'owner' | 'editor' | 'denied' | 'unavailable'

export function useOwnerAccess() {
  const testOwner = import.meta.env.VITE_E2E_OWNER_BYPASS === 'true'
  const configured = hasNeonConfig()
  const [access, setAccess] = useState<OwnerAccess>(() => testOwner ? 'owner' : configured ? 'checking' : import.meta.env.DEV ? 'owner' : 'signed-out')

  useEffect(() => {
    if (testOwner || !configured) return
    let active = true
    let unsubscribe: (() => void) | undefined
    const refresh = async () => {
      try {
        const next = await getOwnerAccess()
        if (active) setAccess(next)
      } catch {
        if (active) setAccess('unavailable')
      }
    }
    void refresh()
    void getNeon().then((neon) => {
      if (!neon || !active) return
      const { data } = neon.auth.onAuthStateChange(() => window.setTimeout(() => { void refresh() }, 0))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => { active = false; unsubscribe?.() }
  }, [configured, testOwner])

  return access
}
