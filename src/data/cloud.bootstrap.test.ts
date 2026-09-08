import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getNeon: vi.fn(),
  getOwnerAccess: vi.fn(),
  tripQuery: vi.fn(),
  getSession: vi.fn(),
  replaceFromCloud: vi.fn()
}))

vi.mock('./neon', () => ({
  getNeon: mocks.getNeon,
  getOwnerAccess: mocks.getOwnerAccess,
  hasNeonConfig: () => true
}))

vi.mock('./repository', () => ({
  localRepository: { replaceFromCloud: mocks.replaceFromCloud }
}))

describe('bootstrapCloudData', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.getOwnerAccess.mockResolvedValue('owner')
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'owner' } } },
      error: null
    })
    mocks.tripQuery
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'trip-japan',
            owner_id: 'owner',
            title: 'Japan',
            start_date: '2026-09-18',
            end_date: '2026-10-02',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            version: 1
          }
        ],
        error: null
      })

    const emptyQuery = {
      select: () => ({
        in: () => ({ is: () => Promise.resolve({ data: [], error: null }) })
      })
    }
    const neon = {
      auth: { getSession: mocks.getSession },
      from: (table: string) => {
        if (table === 'trips')
          return { select: () => ({ is: () => mocks.tripQuery() }) }
        if (table === 'media')
          return { select: () => ({ in: () => ({ is: () => Promise.resolve({ data: [], error: null }) }) }) }
        return emptyQuery
      }
    }
    mocks.getNeon.mockResolvedValue(neon)
    mocks.replaceFromCloud.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not replace the itinerary with an empty result while a restored session is settling', async () => {
    const { bootstrapCloudData } = await import('./cloud')

    await expect(bootstrapCloudData()).resolves.toEqual({ state: 'downloaded' })
    expect(mocks.tripQuery).toHaveBeenCalledTimes(2)
    expect(mocks.getSession).toHaveBeenCalledWith({ forceFetch: true })
    expect(mocks.replaceFromCloud).toHaveBeenCalledWith(
      expect.objectContaining({ trips: [expect.objectContaining({ id: 'trip-japan' })] })
    )
  })
})
