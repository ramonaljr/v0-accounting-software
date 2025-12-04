/**
 * Row Level Security (RLS) Helpers
 *
 * Utilities for enforcing organization-based access control at the application level.
 * These helpers complement Supabase RLS policies to ensure data isolation.
 *
 * IMPORTANT: These functions should be used in server-side code only.
 * RLS policies in Supabase are the primary security mechanism.
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrg } from '@/lib/auth/org';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY = {
  owner: 5,
  admin: 4,
  accountant: 3,
  staff: 2,
  viewer: 1,
} as const;

export type OrgRole = keyof typeof ROLE_HIERARCHY;

/**
 * Permission actions for resources
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'submit' | 'approve';

/**
 * Resource permission map
 * Defines minimum role required for each action on each resource
 */
export const RESOURCE_PERMISSIONS: Record<string, Record<PermissionAction, OrgRole>> = {
  // Accounting
  journal_entry: {
    create: 'accountant',
    read: 'viewer',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },
  account: {
    create: 'accountant',
    read: 'viewer',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },
  payment_entry: {
    create: 'accountant',
    read: 'viewer',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },

  // HR
  employee: {
    create: 'admin',
    read: 'staff',
    update: 'admin',
    delete: 'admin',
    submit: 'admin',
    approve: 'owner',
  },
  leave_application: {
    create: 'staff',
    read: 'staff',
    update: 'staff',
    delete: 'admin',
    submit: 'staff',
    approve: 'accountant',
  },
  payroll_entry: {
    create: 'accountant',
    read: 'accountant',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },
  salary_slip: {
    create: 'accountant',
    read: 'staff',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },

  // Stock
  stock_entry: {
    create: 'staff',
    read: 'viewer',
    update: 'staff',
    delete: 'accountant',
    submit: 'staff',
    approve: 'accountant',
  },
  item: {
    create: 'staff',
    read: 'viewer',
    update: 'staff',
    delete: 'accountant',
    submit: 'staff',
    approve: 'accountant',
  },

  // Payable
  purchase_invoice: {
    create: 'accountant',
    read: 'viewer',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },
  supplier: {
    create: 'accountant',
    read: 'viewer',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },

  // Receivable
  sales_invoice: {
    create: 'staff',
    read: 'viewer',
    update: 'staff',
    delete: 'accountant',
    submit: 'staff',
    approve: 'accountant',
  },
  customer: {
    create: 'staff',
    read: 'viewer',
    update: 'staff',
    delete: 'accountant',
    submit: 'staff',
    approve: 'accountant',
  },

  // Manufacturing
  work_order: {
    create: 'staff',
    read: 'viewer',
    update: 'staff',
    delete: 'accountant',
    submit: 'staff',
    approve: 'accountant',
  },
  bom: {
    create: 'accountant',
    read: 'viewer',
    update: 'accountant',
    delete: 'admin',
    submit: 'accountant',
    approve: 'admin',
  },

  // Settings
  organization: {
    create: 'owner',
    read: 'viewer',
    update: 'admin',
    delete: 'owner',
    submit: 'admin',
    approve: 'owner',
  },
  org_member: {
    create: 'admin',
    read: 'viewer',
    update: 'admin',
    delete: 'admin',
    submit: 'admin',
    approve: 'owner',
  },
};

/**
 * Check if a role has sufficient permission
 */
export function hasRole(userRole: OrgRole, requiredRole: OrgRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get the user's role in the current organization
 */
export async function getCurrentUserRole(): Promise<OrgRole | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const context = await getCurrentOrg();
  if (!context) return null;

  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', context.orgId)
    .eq('user_id', user.id)
    .single();

  return data?.role as OrgRole | null;
}

/**
 * Check if user can perform action on resource
 */
export async function canPerformAction(
  resource: string,
  action: PermissionAction
): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  if (!userRole) return false;

  const resourcePermissions = RESOURCE_PERMISSIONS[resource];
  if (!resourcePermissions) {
    // Default to requiring admin for unknown resources
    return hasRole(userRole, 'admin');
  }

  const requiredRole = resourcePermissions[action];
  return hasRole(userRole, requiredRole);
}

/**
 * Require permission - throws if user lacks permission
 */
export async function requirePermission(
  resource: string,
  action: PermissionAction
): Promise<void> {
  const userRole = await getCurrentUserRole();

  if (!userRole) {
    throw new UnauthorizedError('Authentication required');
  }

  const resourcePermissions = RESOURCE_PERMISSIONS[resource];
  const requiredRole = resourcePermissions?.[action] || 'admin';

  if (!hasRole(userRole, requiredRole)) {
    throw new ForbiddenError(
      `Insufficient permissions. ${requiredRole} role or higher required to ${action} ${resource}`
    );
  }
}

/**
 * Verify user has access to a specific record
 */
export async function verifyRecordAccess(
  table: string,
  recordId: string,
  orgId?: string
): Promise<boolean> {
  const supabase = await createClient();
  const context = await getCurrentOrg();
  const targetOrgId = orgId || context?.orgId;

  if (!targetOrgId) return false;

  const { data, error } = await supabase
    .from(table)
    .select('id, org_id')
    .eq('id', recordId)
    .single();

  if (error || !data) return false;

  // Verify the record belongs to the user's organization
  return data.org_id === targetOrgId;
}

/**
 * Require record access - throws if user cannot access record
 */
export async function requireRecordAccess(
  table: string,
  recordId: string,
  orgId?: string
): Promise<void> {
  const hasAccess = await verifyRecordAccess(table, recordId, orgId);

  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this record');
  }
}

/**
 * Build an org-scoped query (helper for services)
 */
export async function getOrgScopedClient() {
  const supabase = await createClient();
  const context = await getCurrentOrg();

  if (!context) {
    throw new UnauthorizedError('No organization context');
  }

  return { supabase, orgId: context.orgId };
}

/**
 * Verify that a user has permission and the record belongs to their org
 * Common pattern for update/delete operations
 */
export async function requireRecordPermission(
  table: string,
  recordId: string,
  action: PermissionAction
): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; orgId: string }> {
  const { supabase, orgId } = await getOrgScopedClient();

  // Check permission
  await requirePermission(table, action);

  // Check record access
  await requireRecordAccess(table, recordId, orgId);

  return { supabase, orgId };
}

/**
 * SQL helper for generating RLS policy conditions
 * Use this for creating Supabase RLS policies
 */
export const RLS_POLICY_TEMPLATES = {
  /**
   * Basic org isolation policy
   */
  orgIsolation: (table: string) => `
    -- ${table}: Organization isolation policy
    CREATE POLICY "${table}_org_isolation" ON ${table}
      USING (org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ));
  `,

  /**
   * Insert policy for org members
   */
  insertForOrgMembers: (table: string) => `
    -- ${table}: Insert policy for org members
    CREATE POLICY "${table}_insert" ON ${table}
      FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ));
  `,

  /**
   * Update policy (own org records only)
   */
  updateOwnOrg: (table: string) => `
    -- ${table}: Update policy for own org records
    CREATE POLICY "${table}_update" ON ${table}
      FOR UPDATE
      USING (org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ));
  `,

  /**
   * Delete policy (admin only)
   */
  deleteAdminOnly: (table: string) => `
    -- ${table}: Delete policy for admins only
    CREATE POLICY "${table}_delete" ON ${table}
      FOR DELETE
      USING (org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
      ));
  `,

  /**
   * Role-based access policy
   */
  roleBasedAccess: (table: string, minRole: OrgRole) => `
    -- ${table}: Role-based access (${minRole}+)
    CREATE POLICY "${table}_role_based" ON ${table}
      USING (org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND CASE role
          WHEN 'owner' THEN 5
          WHEN 'admin' THEN 4
          WHEN 'accountant' THEN 3
          WHEN 'staff' THEN 2
          WHEN 'viewer' THEN 1
          ELSE 0
        END >= ${ROLE_HIERARCHY[minRole]}
      ));
  `,
} as const;
