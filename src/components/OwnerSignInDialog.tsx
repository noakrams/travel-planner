import * as Dialog from '@radix-ui/react-dialog'
import { GoogleLogo } from '@phosphor-icons/react/GoogleLogo'
import { X } from '@phosphor-icons/react/X'
import { useState } from 'react'
import { signInWithGoogle } from '../data/supabase'
import type { OwnerAccess } from '../hooks/useOwnerAccess'

export function OwnerSignInDialog({ open, onOpenChange, access }: { open: boolean; onOpenChange: (open: boolean) => void; access: OwnerAccess }) {
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState('')
  const continueWithGoogle = async () => {
    setStarting(true)
    setMessage('')
    try { await signInWithGoogle(denied) }
    catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in could not start.')
      setStarting(false)
    }
  }
  const denied = access === 'denied'
  const unavailable = access === 'unavailable'
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="confirm-dialog owner-sign-in">
        <div className="owner-sign-in-heading">
          <div><p className="eyebrow">Owner access</p><Dialog.Title>Edit as Noa</Dialog.Title></div>
          <Dialog.Close className="icon-button" aria-label="Close"><X /></Dialog.Close>
        </div>
        <Dialog.Description>{denied ? 'This Google account can keep viewing, but it is not approved to edit this trip.' : unavailable ? 'Owner access could not be checked. Check your connection and try again.' : 'Viewing is open to everyone. Continue with Noa Krams’s approved Google account to make changes.'}</Dialog.Description>
        {!unavailable ? <button className="button google" type="button" disabled={starting || access === 'checking'} onClick={continueWithGoogle}><GoogleLogo weight="bold" />{starting ? 'Opening Google…' : denied ? 'Use Noa’s Google account' : 'Continue with Google'}</button> : null}
        {message ? <p className="auth-message" role="status">{message}</p> : null}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
