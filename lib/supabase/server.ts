import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side use (Server Components, Server Actions, Route Handlers).
 * This client automatically handles cookie-based authentication with Next.js.
 *
 * IMPORTANT: Never access Supabase directly in components - use server actions or API routes.
 * This ensures proper security boundaries and RLS enforcement.
 *
 * @example
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function getTransactions() {
 *   const supabase = await createClient()
 *   const { data, error } = await supabase
 *     .from('transactions')
 *     .select('*')
 *     .eq('org_id', orgId) // Always scope by org_id
 *
 *   if (error) throw error
 *   return data
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase Admin client with service role privileges.
 * Use this ONLY for operations that need to bypass RLS (e.g., system tasks, admin operations).
 *
 * WARNING: This client has unrestricted access. Use with extreme caution.
 * Always validate permissions in your application logic before using this client.
 *
 * @example
 * ```tsx
 * import { createAdminClient } from '@/lib/supabase/server'
 *
 * export async function createSystemAuditLog(data: AuditLogData) {
 *   const supabase = createAdminClient()
 *   const { error } = await supabase
 *     .from('audit_logs')
 *     .insert(data)
 *
 *   if (error) throw error
 * }
 * ```
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookie handling
        },
      },
    }
  )
}
