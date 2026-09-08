import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSession: vi.fn(),
  rpc: vi.fn()
}))

vi.mock('@neondatabase/neon-js', () => ({
  createClient: mocks.createClient,
  SupabaseAuthAdapter: () => () => ({})
}))

describe('getOwnerAccess', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_NEON_AUTH_URL', 'https://auth.example.com')
    vi.stubEnv('VITE_NEON_DATA_API_URL', 'https://data.example.com')
    vi.clearAllMocks()
    mocks.createClient.mockReturnValue({
      auth: { getSession: mocks.getSession },
      rpc: mocks.rpc
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('waits for a fresh browser session before checking the approved-account role', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'approved-user' } } },
      error: null
    })
    mocks.rpc.mockResolvedValue({ data: 'owner', error: null })

    const { getOwnerAccess } = await import('./neon')

    await expect(getOwnerAccess()).resolves.toBe('owner')
    expect(mocks.getSession).toHaveBeenCalledWith({ forceFetch: true })
    expect(mocks.rpc).toHaveBeenCalledWith('get_app_access_role')
  })
})
