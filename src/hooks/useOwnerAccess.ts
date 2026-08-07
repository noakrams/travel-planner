import { useEffect, useState } from 'react'
import { getOwnerAccess, getSupabase, hasSupabaseConfig } from '../data/supabase'

export type OwnerAccess = 'checking' | 'signed-out' | 'owner' | 'denied' | 'unavailable'

export function useOwnerAccess() {
  const testOwner = import.meta.env.VITE_E2E_OWNER_BYPASS === 'true'
  const configured = hasSupabaseConfig()
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
    void getSupabase().then((supabase) => {
      if (!supabase || !active) return
      const { data } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => { void refresh() }, 0))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => { active = false; unsubscribe?.() }
  }, [configured, testOwner])

  return access
}
