import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || SUPABASE_URL === 'undefined' || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'undefined') {
  console.error(
    '[Rabid Vault] Missing Supabase environment variables.\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set as GitHub Secrets.\n' +
    'Current values — URL: ' + SUPABASE_URL + ' KEY: ' + (SUPABASE_ANON_KEY ? 'set' : 'missing')
  )
}

const safeStorage = typeof window !== 'undefined' ? window.localStorage : undefined

export const supabase = createClient(
  (SUPABASE_URL && SUPABASE_URL !== 'undefined') ? SUPABASE_URL : 'https://placeholder.supabase.co',
  (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'undefined') ? SUPABASE_ANON_KEY : 'placeholder',
  {
    auth: {
      persistSession:     true,
      storage:            safeStorage,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  }
)

// Export the URL so other modules can use it safely
export const SUPABASE_URL_SAFE = (SUPABASE_URL && SUPABASE_URL !== 'undefined') 
  ? SUPABASE_URL 
  : null
