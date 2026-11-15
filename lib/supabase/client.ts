import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  const supabaseUrl = rawUrl.replace(/^["']|["']$/g, '').trim() || 'https://placeholder.supabase.co'
  const supabaseKey = rawKey.replace(/^["']|["']$/g, '').trim() || 'placeholder-key'

  return createBrowserClient(supabaseUrl, supabaseKey)
}
