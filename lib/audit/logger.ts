import { createAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

interface LogAuditEventParams {
  orgId?: string | null
  userId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  changes?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

/**
 * Log an audit event
 * This uses the admin client to bypass RLS for audit logging
 */
export async function logAuditEvent(params: LogAuditEventParams) {
  const {
    orgId,
    userId,
    action,
    entityType,
    entityId,
    changes,
    metadata = {},
  } = params

  try {
    const supabase = createAdminClient()

    const auditLog: AuditLogInsert = {
      org_id: orgId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes ? (changes as never) : null,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      } as never,
    }

    const { error } = await supabase.from('audit_logs').insert(auditLog)

    if (error) {
      console.error('Failed to log audit event:', error)
      // Don't throw - audit logging should not break the main flow
    }
  } catch (err) {
    console.error('Unexpected error logging audit event:', err)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log a field-level change
 */
export async function logFieldChange(
  params: Omit<LogAuditEventParams, 'changes'> & {
    field: string
    oldValue: unknown
    newValue: unknown
  }
) {
  const { field, oldValue, newValue, ...rest } = params

  await logAuditEvent({
    ...rest,
    changes: {
      field,
      old: oldValue,
      new: newValue,
    },
  })
}

/**
 * Log a sensitive action (e.g., bank connection, data export)
 */
export async function logSensitiveAction(
  params: Omit<LogAuditEventParams, 'metadata'> & {
    metadata?: Record<string, unknown>
  }
) {
  await logAuditEvent({
    ...params,
    metadata: {
      ...params.metadata,
      sensitive: true,
      severity: 'high',
    },
  })
}

/**
 * Batch log multiple events (for bulk operations)
 */
export async function logBulkEvents(events: LogAuditEventParams[]) {
  const supabase = createAdminClient()

  const auditLogs: AuditLogInsert[] = events.map((event) => ({
    org_id: event.orgId,
    user_id: event.userId,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId,
    changes: event.changes ? (event.changes as never) : null,
    metadata: {
      ...event.metadata,
      timestamp: new Date().toISOString(),
    } as never,
  }))

  try {
    const { error } = await supabase.from('audit_logs').insert(auditLogs)

    if (error) {
      console.error('Failed to log bulk audit events:', error)
    }
  } catch (err) {
    console.error('Unexpected error logging bulk audit events:', err)
  }
}

/**
 * Simplified audit logging with automatic org/user context
 * For use in server actions where context is available
 */
export async function logAudit(params: {
  action: string
  entity_type: string
  entity_id?: string | null
  changes?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}) {
  // Import here to avoid circular dependency
  const { getCurrentOrg } = await import('@/lib/auth/org')
  const context = await getCurrentOrg()

  await logAuditEvent({
    orgId: context?.orgId || null,
    userId: context?.userId || null,
    action: params.action,
    entityType: params.entity_type,
    entityId: params.entity_id,
    changes: params.changes,
    metadata: params.metadata,
  })
}
