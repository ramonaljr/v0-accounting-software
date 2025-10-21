import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side use (Client Components, browser context).
 * This client uses the anon key and is safe for client-side queries with RLS enabled.
 *
 * IMPORTANT: Only use this for read operations or simple mutations where RLS policies
 * are properly configured. For complex operations, prefer Server Actions.
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 * import { useEffect, useState } from 'react'
 *
 * export function AccountsList() {
 *   const [accounts, setAccounts] = useState([])
 *   const supabase = createClient()
 *
 *   useEffect(() => {
 *     async function fetchAccounts() {
 *       const { data } = await supabase
 *         .from('accounts')
 *         .select('*')
 *         .eq('org_id', orgId) // Always scope by org_id
 *
 *       setAccounts(data || [])
 *     }
 *     fetchAccounts()
 *   }, [])
 *
 *   return <div>render accounts</div>
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
