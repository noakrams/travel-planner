import { GoogleLogo } from '@phosphor-icons/react/GoogleLogo'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { bootstrapCloudData, type CloudBootstrapResult } from '../data/cloud'
import { localRepository } from '../data/repository'
import { getNeon, hasNeonConfig, signInWithGoogle } from '../data/neon'

type GateState = 'checking' | 'downloaded' | CloudBootstrapResult['state'] | 'error'

export function CloudDataGate({ children }: { children: ReactNode }) {
  const testOwner = import.meta.env.VITE_E2E_OWNER_BYPASS === 'true'
  const queryClient = useQueryClient()
  const [state, setState] = useState<GateState>(testOwner ? 'downloaded' : 'checking')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    await Promise.resolve()
    setState('checking')
    setMessage('')
    try {
      const result = await bootstrapCloudData()
      if (result.state === 'downloaded') {
        await queryClient.invalidateQueries()
      } else {
        await localRepository.clearCloudCache()
        queryClient.clear()
      }
      setState(result.state)
    } catch (error) {
      await localRepository.clearCloudCache()
      queryClient.clear()
      setMessage(error instanceof Error ? error.message : 'The Neon itinerary could not be loaded.')
      setState('error')
    }
  }, [queryClient])

  useEffect(() => {
    if (testOwner) return
    const initialLoad = window.setTimeout(() => { void load() }, 0)
    let unsubscribe: (() => void) | undefined
    void getNeon().then((neon) => {
      if (!neon) return
      const { data } = neon.auth.onAuthStateChange(() => window.setTimeout(() => { void load() }, 0))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    const onOnline = () => { void load() }
    const onOffline = () => { void load() }
    addEventListener('online', onOnline)
    addEventListener('offline', onOffline)
    return () => {
      clearTimeout(initialLoad)
      unsubscribe?.()
      removeEventListener('online', onOnline)
      removeEventListener('offline', onOffline)
    }
  }, [load, testOwner])

  if (state === 'downloaded') return children
  if (state === 'checking') return <main className="page-skeleton" aria-busy="true" aria-label="Loading itinerary from Neon"><div /><div /><div /></main>
  return <CloudAccessPage state={state} message={message} onRetry={load} />
}

function CloudAccessPage({ state, message, onRetry }: { state: Exclude<GateState, 'checking' | 'downloaded'>; message: string; onRetry: () => Promise<void> }) {
  const [starting, setStarting] = useState(false)
  const [signInError, setSignInError] = useState('')
  const denied = state === 'denied'
  const signIn = async () => {
    setStarting(true)
    setSignInError('')
    try { await signInWithGoogle(denied) }
    catch (error) {
      setSignInError(error instanceof Error ? error.message : 'Google sign-in could not start.')
      setStarting(false)
    }
  }
  const copy = state === 'offline'
    ? { eyebrow: 'Connection required', title: 'Connect to load your private trips', detail: 'Private itinerary data is shown only after it has been verified against Neon.' }
    : state === 'unavailable'
      ? { eyebrow: 'Cloud required', title: 'Neon is not configured', detail: 'This app no longer displays local fixture or cached itinerary data as a substitute.' }
      : state === 'denied'
        ? { eyebrow: 'Account not approved', title: 'Use an approved Google account', detail: 'This account cannot open the private planner. Public share links still work without signing in.' }
        : state === 'error'
          ? { eyebrow: 'Could not verify data', title: 'The private planner is unavailable', detail: message || 'Neon could not be reached, so cached itinerary data was not displayed.' }
          : { eyebrow: 'Private planner', title: 'Sign in to manage your trips', detail: 'Friends do not need an account when you send them a read-only share link.' }
  const canSignIn = hasNeonConfig() && state !== 'offline' && state !== 'error'
  return <main className="cloud-access-page">
    <a className="wordmark dark" href="#/">roam<span>·</span></a>
    <section>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p>{copy.detail}</p>
      <div className="cloud-access-actions">
        {canSignIn ? <button className="button google" type="button" disabled={starting} onClick={signIn}><GoogleLogo weight="bold" />{starting ? 'Opening Google…' : denied ? 'Use another Google account' : 'Continue with Google'}</button> : null}
        {state === 'offline' || state === 'error' ? <button className="button secondary" type="button" onClick={() => { void onRetry() }}>Try again</button> : null}
      </div>
      {signInError ? <p className="auth-message" role="alert">{signInError}</p> : null}
    </section>
  </main>
}
