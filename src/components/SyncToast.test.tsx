import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { SyncToast } from './SyncToast'

it('shows the exact sync failure and retries from the toast', async () => {
  const retry = vi.fn()
  render(<SyncToast state="attention" error="Database permission failed." onRetry={retry} onSignIn={() => undefined} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Database permission failed.')
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalledOnce()
})

it('takes a signed-out owner to sign in instead of retrying', async () => {
  const signIn = vi.fn()
  render(<SyncToast state="attention" error="Sign in under More to save changes to the cloud." onRetry={() => undefined} onSignIn={signIn} />)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(signIn).toHaveBeenCalledOnce()
})
