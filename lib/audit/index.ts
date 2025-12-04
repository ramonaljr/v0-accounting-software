/**
 * Audit Logging - Barrel Export
 *
 * Central export point for audit logging utilities.
 *
 * @example
 * import { logAuditEvent, logAudit } from '@/lib/audit';
 */

export {
  logAuditEvent,
  logFieldChange,
  logSensitiveAction,
  logBulkEvents,
  logAudit,
} from './logger';
