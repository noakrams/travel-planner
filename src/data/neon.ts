import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL as string | undefined

let client: ReturnType<typeof createClient> | undefined

export function hasNeonConfig() {
  return Boolean(authUrl && dataApiUrl)
}

export async function getNeon() {
  if (!hasNeonConfig()) return undefined
  if (!client) {
    client = createClient({
      auth: {
        adapter: SupabaseAuthAdapter(),
        url: authUrl!
      },
      dataApi: {
        url: dataApiUrl!
      }
    })
  }
  return client
}

export async function sendMagicLink(email: string) {
  const neon = await getNeon()
  if (!neon) throw new Error('Add the public Neon Auth and Data API URLs to enable sign-in.')
  const redirectTo = getAuthRedirectUrl()
  const { error } = await neon.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  if (error) throw error
}

export async function signInWithGoogle(selectAccount = false) {
  const neon = await getNeon()
  if (!neon) throw new Error('Add the public Neon Auth and Data API URLs to enable sign-in.')
  sessionStorage.setItem('roam-auth-return-hash', location.hash)
  const { error } = await neon.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(),
      queryParams: selectAccount ? { prompt: 'select_account' } : undefined
    }
  })
  if (error) throw error
}

export async function getOwnerAccess(): Promise<'signed-out' | 'owner' | 'editor' | 'denied'> {
  const neon = await getNeon()
  if (!neon) return 'signed-out'

  // Better Auth refreshes its session when a tab becomes active, but that refresh
  // can still be in flight when CloudDataGate asks for access. Reading the cached
  // session here can therefore send a recently-returned approved user to the
  // "Account not approved" screen. Force a server-backed session read before
  // asking the database to evaluate the allowlist.
  const { data: sessionData, error: sessionError } = await neon.auth.getSession({
    forceFetch: true
  })
  if (sessionError || !sessionData.session?.user) return 'signed-out'
  const { data: role, error: roleError } = await neon.rpc('get_app_access_role')
  if (roleError) throw roleError
  return role === 'owner' || role === 'editor' ? role : 'denied'
}

function getAuthRedirectUrl() {
  const callback = new URL(location.pathname, location.origin)
  callback.searchParams.set('auth', 'callback')
  return callback.toString()
}
