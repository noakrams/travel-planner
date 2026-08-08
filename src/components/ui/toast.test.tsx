import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToastProvider, useToast } from './toast'

function ToastHarness() {
  const toast = useToast()
  const save = () => {
    const id = toast.loading('Saving plan item…', 'Storing this change on your device…')
    toast.success('Plan item saved', 'Your change is stored on this device.', id)
  }
  return <><button onClick={save}>Save</button><button onClick={() => toast.error('Could not save changes', 'Database unavailable.')}>Fail</button></>
}

describe('shared toast', () => {
  it('replaces a loading notification with the matching saved state', async () => {
    render(<ToastProvider><ToastHarness /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.queryByText('Saving plan item…')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Plan item saved')
    expect(screen.getByRole('status')).toHaveTextContent('stored on this device')
  })

  it('announces errors assertively', async () => {
    render(<ToastProvider><ToastHarness /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Fail' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save changes')
    expect(screen.getByRole('alert')).toHaveTextContent('Database unavailable.')
  })
})
