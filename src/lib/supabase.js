import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Rabid Vault] Missing Supabase environment variables.\n' +
    'Copy .env.example to .env.local and fill in your values.\n' +
    'See LOGO-README.md in public/ for setup instructions.'
  )
}

const safeStorage = typeof window !== 'undefined' ? window.localStorage : undefined

export const supabase = createClient(
  SUPABASE_URL      || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      persistSession:     true,
      storage:            safeStorage,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  }
)
