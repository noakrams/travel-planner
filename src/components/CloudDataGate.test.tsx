import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CloudDataGate } from './CloudDataGate'

const mocks = vi.hoisted(() => ({
  bootstrapCloudData: vi.fn(),
  clearCloudCache: vi.fn(),
  pendingCount: vi.fn(),
  invalidateQueries: vi.fn(),
  clearQueries: vi.fn()
}))

vi.mock('../data/cloud', () => ({ bootstrapCloudData: mocks.bootstrapCloudData }))
vi.mock('../data/repository', () => ({
  localRepository: { clearCloudCache: mocks.clearCloudCache, pendingCount: mocks.pendingCount }
}))
vi.mock('../data/neon', () => ({
  getNeon: async () => undefined,
  hasNeonConfig: () => true,
  signInWithGoogle: vi.fn()
}))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: (() => {
    const queryClient = { invalidateQueries: mocks.invalidateQueries, clear: mocks.clearQueries }
    return () => queryClient
  })()
}))

describe('CloudDataGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.bootstrapCloudData.mockResolvedValue({ state: 'downloaded' })
    mocks.pendingCount.mockResolvedValue(0)
  })

  it('refreshes Neon data in the background when the tab becomes active again', async () => {
    let finishRefresh: ((value: { state: 'downloaded' }) => void) | undefined
    const refresh = new Promise<{ state: 'downloaded' }>((resolve) => { finishRefresh = resolve })
    mocks.bootstrapCloudData
      .mockResolvedValueOnce({ state: 'downloaded' })
      .mockReturnValueOnce(refresh)

    render(<CloudDataGate><p>Current itinerary</p></CloudDataGate>)
    expect(await screen.findByText('Current itinerary')).toBeVisible()

    window.dispatchEvent(new Event('focus'))
    await waitFor(() => expect(mocks.bootstrapCloudData).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Current itinerary')).toBeVisible()
    expect(screen.queryByLabelText('Loading itinerary from Neon')).not.toBeInTheDocument()

    await act(async () => { finishRefresh?.({ state: 'downloaded' }) })
    await waitFor(() => expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2))
  })

  it('does not replace the local snapshot while edits are still syncing', async () => {
    mocks.pendingCount.mockResolvedValue(1)
    render(<CloudDataGate><p>Unsynced itinerary</p></CloudDataGate>)
    expect(await screen.findByText('Unsynced itinerary')).toBeVisible()

    window.dispatchEvent(new Event('focus'))
    await waitFor(() => expect(mocks.pendingCount).toHaveBeenCalledOnce())
    expect(mocks.bootstrapCloudData).toHaveBeenCalledOnce()
    expect(screen.getByText('Unsynced itinerary')).toBeVisible()
  })
})
