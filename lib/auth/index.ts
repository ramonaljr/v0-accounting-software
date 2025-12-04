/**
 * Authentication - Barrel Export
 *
 * Central export point for authentication utilities.
 *
 * @example
 * import { getCurrentUser, requireAuth, hasOrgRole } from '@/lib/auth';
 */

// Server-side auth utilities
export {
  getCurrentUser,
  getCurrentProfile,
  getUserOrganizations,
  getCurrentOrganization,
  isOrgMember,
  hasOrgRole,
  requireAuth,
  requireOrgMembership,
  requireOrgRole,
} from './server';

// Org utilities
export { getCurrentOrg } from './org';
