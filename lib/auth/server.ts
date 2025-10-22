import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type OrgMember = Database['public']['Tables']['org_members']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

/**
 * Get the current authenticated user (cached per request)
 * Use this in Server Components and Server Actions
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})

/**
 * Get the current user's profile
 */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
})

/**
 * Get all organizations the current user is a member of
 */
export const getUserOrganizations = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (!memberships) return []

  type OrgWithRole = Organization & { userRole: OrgMember['role'] }

  return memberships
    .filter((m): m is typeof m & { organizations: Organization } =>
      m.organizations !== null
    )
    .map((m): OrgWithRole => ({
      ...m.organizations,
      userRole: m.role,
    }))
})

/**
 * Get the user's current organization (first one they're a member of)
 * In production, this would be stored in session or context
 */
export const getCurrentOrganization = cache(async () => {
  const orgs = await getUserOrganizations()
  return orgs[0] || null
})

/**
 * Check if user is a member of a specific organization
 */
export async function isOrgMember(orgId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  return !!data
}

/**
 * Check if user has a specific role or higher in an organization
 */
export async function hasOrgRole(
  orgId: string,
  requiredRole: OrgMember['role']
): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!data) return false

  // Role hierarchy: owner > admin > accountant > staff > viewer
  const roleHierarchy: Record<OrgMember['role'], number> = {
    owner: 5,
    admin: 4,
    accountant: 3,
    staff: 2,
    viewer: 1,
  }

  const userRole = data.role as OrgMember['role']
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Require authentication - throw error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Require organization membership - throw error if not a member
 */
export async function requireOrgMembership(orgId: string) {
  const user = await requireAuth()
  const isMember = await isOrgMember(orgId)

  if (!isMember) {
    throw new Error('Forbidden: Not an organization member')
  }

  return user
}

/**
 * Require specific role in organization - throw error if insufficient permissions
 */
export async function requireOrgRole(
  orgId: string,
  requiredRole: OrgMember['role']
) {
  const user = await requireAuth()
  const hasRole = await hasOrgRole(orgId, requiredRole)

  if (!hasRole) {
    throw new Error(
      `Forbidden: Requires ${requiredRole} role or higher`
    )
  }

  return user
}
