import { GoogleLogo } from '@phosphor-icons/react/GoogleLogo'
import { PaperPlaneTilt } from '@phosphor-icons/react/PaperPlaneTilt'
import { useEffect, useState } from 'react'
import { getSupabase, hasSupabaseConfig, sendMagicLink, signInWithGoogle } from '../data/supabase'

export function AuthPanel() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [signedInEmail, setSignedInEmail] = useState<string>()
  const [startingSignIn, setStartingSignIn] = useState<'google' | 'email'>()
  useEffect(() => {
    if (!hasSupabaseConfig()) return
    let active = true
    let unsubscribe: (() => void) | undefined
    void getSupabase().then(async (supabase) => {
      if (!supabase || !active) return
      const { data } = await supabase.auth.getUser()
      if (active) setSignedInEmail(data.user?.email)
      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setSignedInEmail(session?.user.email)
      })
      unsubscribe = () => listener.data.subscription.unsubscribe()
    })
    return () => { active = false; unsubscribe?.() }
  }, [])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStartingSignIn('email')
    setMessage('')
    try { await sendMagicLink(email); setMessage('Check your email for the secure sign-in link.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Sign-in could not start.') }
    finally { setStartingSignIn(undefined) }
  }
  const continueWithGoogle = async () => {
    setStartingSignIn('google')
    setMessage('')
    try { await signInWithGoogle() }
    catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in could not start.')
      setStartingSignIn(undefined)
    }
  }
  const signOut = async () => { const supabase = await getSupabase(); await supabase?.auth.signOut(); setSignedInEmail(undefined) }
  const configured = hasSupabaseConfig()
  return <section className="auth-panel">
    <div>
      <p className="eyebrow">Owner access</p>
      <h2>{signedInEmail ? 'Cloud sync is connected' : 'Your trip, one tap away'}</h2>
      <p>{signedInEmail ? `Signed in as ${signedInEmail}. This device will remember you, and edits will follow you between devices.` : configured ? 'Continue with your approved Google account. You will stay signed in on this device.' : 'Local mode is active. Add public Supabase credentials to enable owner sign-in and cloud sync.'}</p>
    </div>
    {signedInEmail
      ? <button className="button secondary" onClick={signOut}>Sign out</button>
      : <div className="auth-actions">
          <button className="button google" type="button" disabled={!configured || Boolean(startingSignIn)} onClick={continueWithGoogle}>
            <GoogleLogo weight="bold" />{startingSignIn === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </button>
          <details className="auth-fallback">
            <summary>Use an email link instead</summary>
            <form onSubmit={submit}>
              <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <button className="button secondary" disabled={!configured || Boolean(startingSignIn)}><PaperPlaneTilt />{startingSignIn === 'email' ? 'Sending link…' : 'Email sign-in link'}</button>
            </form>
          </details>
          {message ? <p className="auth-message" role="status">{message}</p> : null}
        </div>}
  </section>
}
