/**
 * Organization context helpers
 * Get current user's organization and role
 */

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'

type OrgMember = Database['public']['Tables']['org_members']['Row']

export interface UserOrgContext {
  userId: string
  orgId: string
  role: OrgMember['role']
  org: {
    id: string
    name: string
    slug: string
    settings: Record<string, unknown>
  }
}

/**
 * Get current user's organization context
 * @returns User organization context or null if not found
 */
export async function getCurrentOrg(): Promise<UserOrgContext | null> {
  // DEVELOPMENT MODE: Return mock context if not in production
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    // Use valid UUID format for development to avoid database type errors
    const devOrgId = '00000000-0000-0000-0000-000000000001';
    const devUserId = '00000000-0000-0000-0000-000000000002';

    return {
      userId: devUserId,
      orgId: devOrgId,
      role: 'owner',
      org: {
        id: devOrgId,
        name: 'Development Company',
        slug: 'dev-company',
        settings: {},
      },
    }
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  // Get user's org membership
  const { data: membership, error: memberError } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (memberError || !membership) {
    return null
  }

  // Get organization details
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, settings')
    .eq('id', membership.org_id)
    .single()

  if (orgError || !org) {
    return null
  }

  return {
    userId: user.id,
    orgId: membership.org_id,
    role: membership.role,
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      settings: org.settings,
    },
  }
}

/**
 * Check if user has required role
 * @param requiredRole Minimum required role
 * @returns True if user has sufficient permissions
 */
export async function hasRole(
  requiredRole: OrgMember['role']
): Promise<boolean> {
  const context = await getCurrentOrg()
  if (!context) return false

  const roleHierarchy: Record<OrgMember['role'], number> = {
    viewer: 0,
    staff: 1,
    accountant: 2,
    admin: 3,
    owner: 4,
  }

  return roleHierarchy[context.role] >= roleHierarchy[requiredRole]
}

/**
 * Require authentication and organization membership
 * @throws Error if not authenticated or not a member
 */
export async function requireOrg(): Promise<UserOrgContext> {
  const context = await getCurrentOrg()
  if (!context) {
    throw new Error('Unauthorized: No organization access')
  }
  return context
}

/**
 * Require specific role
 * @param requiredRole Minimum required role
 * @throws Error if insufficient permissions
 */
export async function requireRole(
  requiredRole: OrgMember['role']
): Promise<UserOrgContext> {
  const context = await requireOrg()

  const roleHierarchy: Record<OrgMember['role'], number> = {
    viewer: 0,
    staff: 1,
    accountant: 2,
    admin: 3,
    owner: 4,
  }

  if (roleHierarchy[context.role] < roleHierarchy[requiredRole]) {
    throw new Error(
      `Unauthorized: Requires ${requiredRole} role or higher (current: ${context.role})`
    )
  }

  return context
}
