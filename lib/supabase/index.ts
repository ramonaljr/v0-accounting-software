/**
 * Supabase - Barrel Export
 *
 * Central export point for Supabase clients and utilities.
 *
 * @example
 * import { createClient, createServerClient } from '@/lib/supabase';
 */

// Server-side client (use in Server Components, Server Actions, Route Handlers)
export { createClient } from './server';

// Client-side client (use only in Client Components where absolutely necessary)
export { createClient as createBrowserClient } from './client';

// Database types (auto-generated from Supabase schema)
export type { Database } from './database.types';

// Common type aliases exported from database.types
export type {
  AccountType,
  OrgRole,
  SubscriptionTier,
  SubscriptionStatus,
  AccountingBasis,
  SyncStatus,
  BankSyncLogStatus,
} from './database.types';

// Middleware utilities
export { updateSession } from './middleware';
