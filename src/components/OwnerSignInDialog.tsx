import { GoogleLogo } from '@phosphor-icons/react/GoogleLogo'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { signInWithGoogle } from '../data/supabase'
import type { OwnerAccess } from '../hooks/useOwnerAccess'

export function OwnerSignInDialog({ open, onOpenChange, access }: { open: boolean; onOpenChange: (open: boolean) => void; access: OwnerAccess }) {
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState('')
  const denied = access === 'denied'
  const unavailable = access === 'unavailable'
  const continueWithGoogle = async () => {
    setStarting(true)
    setMessage('')
    try { await signInWithGoogle(denied) }
    catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in could not start.')
      setStarting(false)
    }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="confirm-dialog owner-sign-in">
      <DialogHeader><p className="eyebrow">Editor access</p><DialogTitle>Edit trip</DialogTitle><DialogDescription>{denied ? 'This Google account can keep viewing, but it is not approved to edit this trip.' : unavailable ? 'Editor access could not be checked. Check your connection and try again.' : 'Viewing is open to everyone. Continue with an approved Google account to make changes.'}</DialogDescription></DialogHeader>
      {!unavailable ? <Button className="google" type="button" disabled={starting || access === 'checking'} onClick={continueWithGoogle}><GoogleLogo weight="bold" />{starting ? 'Opening Google…' : denied ? 'Use another Google account' : 'Continue with Google'}</Button> : null}
      {message ? <p className="auth-message" role="status">{message}</p> : null}
    </DialogContent>
  </Dialog>
}
