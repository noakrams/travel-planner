import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function hasSupabaseConfig() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export async function getSupabase(): Promise<SupabaseClient | undefined> {
  if (!hasSupabaseConfig()) return undefined
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  }
  return client
}

export async function sendMagicLink(email: string) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Add the public Supabase URL and anon key to enable sign-in.')
  const redirectTo = getAuthRedirectUrl()
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  if (error) throw error
}

export async function signInWithGoogle(selectAccount = false) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Add the public Supabase URL and anon key to enable sign-in.')
  sessionStorage.setItem('roam-auth-return-hash', location.hash)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(),
      queryParams: selectAccount ? { prompt: 'select_account' } : undefined
    }
  })
  if (error) throw error
}

export async function getOwnerAccess(): Promise<'signed-out' | 'owner' | 'denied'> {
  const supabase = await getSupabase()
  if (!supabase) return 'signed-out'
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth.user) return 'signed-out'
  const { data: isOwner, error: ownerError } = await supabase.rpc('is_app_owner')
  if (ownerError) throw ownerError
  return isOwner === true ? 'owner' : 'denied'
}

function getAuthRedirectUrl() {
  return `${location.origin}${location.pathname}#/auth/callback`
}
