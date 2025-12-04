/**
 * ERPNext Sync Infrastructure
 * Handles bidirectional sync with retry logic and observability
 */

import { erpnextFetch } from './client'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface SyncOptions {
  orgId: string
  entityType: string
  entityId: string
  erpDoctype: string
  direction: 'push' | 'pull'
  maxRetries?: number
  retryDelayMs?: number
}

export interface SyncResult {
  success: boolean
  erpName?: string
  error?: string
  duration: number
}

/**
 * Compute content hash for change detection
 */
export function computeContentHash(data: Record<string, unknown>): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort())
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

/**
 * Create or update ERP mapping
 */
export async function upsertERPMapping(params: {
  orgId: string
  entityType: string
  entityId: string
  erpDoctype: string
  erpName: string
  contentHash: string
  status?: 'pending' | 'synced' | 'error' | 'conflict'
  errorMessage?: string
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('erp_map')
    .upsert({
      org_id: params.orgId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      erp_doctype: params.erpDoctype,
      erp_name: params.erpName,
      content_hash: params.contentHash,
      sync_status: params.status || 'synced',
      error_message: params.errorMessage,
      last_synced_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id,entity_type,entity_id'
    })

  if (error) {
    throw new Error(`Failed to upsert ERP mapping: ${error.message}`)
  }
}

/**
 * Get ERP mapping for an entity
 */
export async function getERPMapping(params: {
  orgId: string
  entityType: string
  entityId: string
}): Promise<{
  erpDoctype: string
  erpName: string
  contentHash: string
  syncStatus: string
  lastSyncedAt: string | null
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('erp_map')
    .select('*')
    .eq('org_id', params.orgId)
    .eq('entity_type', params.entityType)
    .eq('entity_id', params.entityId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    erpDoctype: data.erp_doctype,
    erpName: data.erp_name,
    contentHash: data.content_hash,
    syncStatus: data.sync_status,
    lastSyncedAt: data.last_synced_at,
  }
}

/**
 * Log sync event
 */
export async function logSyncEvent(params: {
  orgId: string
  eventType: 'push' | 'pull' | 'retry' | 'error'
  entityType: string
  entityId: string
  erpDoctype: string
  erpName?: string
  direction: 'push' | 'pull'
  status: 'started' | 'success' | 'error' | 'skipped'
  errorMessage?: string
  errorStack?: string
  retryCount?: number
  durationMs?: number
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sync_events')
    .insert({
      org_id: params.orgId,
      event_type: params.eventType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      erp_doctype: params.erpDoctype,
      erp_name: params.erpName,
      direction: params.direction,
      status: params.status,
      error_message: params.errorMessage,
      error_stack: params.errorStack,
      retry_count: params.retryCount || 0,
      duration_ms: params.durationMs,
      request_payload: params.requestPayload,
      response_payload: params.responsePayload,
      completed_at: params.status !== 'started' ? new Date().toISOString() : null,
    })

  if (error) {
    console.error('Failed to log sync event:', error)
  }
}

/**
 * Push entity to ERPNext
 */
export async function pushToERPNext(
  options: SyncOptions,
  payload: Record<string, unknown>
): Promise<SyncResult> {
  const startTime = Date.now()
  const maxRetries = options.maxRetries || 3
  const retryDelay = options.retryDelayMs || 1000

  let lastError: Error | null = null
  let attempt = 0

  // Log initial sync event
  await logSyncEvent({
    orgId: options.orgId,
    eventType: 'push',
    entityType: options.entityType,
    entityId: options.entityId,
    erpDoctype: options.erpDoctype,
    direction: 'push',
    status: 'started',
    requestPayload: payload,
  })

  while (attempt < maxRetries) {
    try {
      // Check if mapping exists
      const mapping = await getERPMapping({
        orgId: options.orgId,
        entityType: options.entityType,
        entityId: options.entityId,
      })

      let response: { data?: { name?: string }; name?: string }

      if (mapping?.erpName) {
        // Update existing document
        response = await erpnextFetch(`/api/resource/${options.erpDoctype}/${mapping.erpName}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        // Create new document
        response = await erpnextFetch(`/api/resource/${options.erpDoctype}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      const erpName = response.data?.name || response.name

      if (!erpName) {
        throw new Error('ERPNext did not return a document name')
      }

      // Compute content hash
      const contentHash = computeContentHash(payload)

      // Update mapping
      await upsertERPMapping({
        orgId: options.orgId,
        entityType: options.entityType,
        entityId: options.entityId,
        erpDoctype: options.erpDoctype,
        erpName,
        contentHash,
        status: 'synced',
      })

      const duration = Date.now() - startTime

      // Log success
      await logSyncEvent({
        orgId: options.orgId,
        eventType: 'push',
        entityType: options.entityType,
        entityId: options.entityId,
        erpDoctype: options.erpDoctype,
        erpName,
        direction: 'push',
        status: 'success',
        durationMs: duration,
        requestPayload: payload,
        responsePayload: response,
      })

      return {
        success: true,
        erpName,
        duration,
      }
    } catch (error) {
      lastError = error as Error
      attempt++

      // Log retry or error
      await logSyncEvent({
        orgId: options.orgId,
        eventType: attempt < maxRetries ? 'retry' : 'error',
        entityType: options.entityType,
        entityId: options.entityId,
        erpDoctype: options.erpDoctype,
        direction: 'push',
        status: 'error',
        errorMessage: lastError.message,
        errorStack: lastError.stack,
        retryCount: attempt,
        requestPayload: payload,
      })

      if (attempt < maxRetries) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)))
      }
    }
  }

  // All retries failed
  const duration = Date.now() - startTime

  // Update mapping with error status
  await upsertERPMapping({
    orgId: options.orgId,
    entityType: options.entityType,
    entityId: options.entityId,
    erpDoctype: options.erpDoctype,
    erpName: '', // No ERP name on failure
    contentHash: '',
    status: 'error',
    errorMessage: lastError?.message,
  })

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    duration,
  }
}

/**
 * Pull entity from ERPNext
 */
export async function pullFromERPNext(
  options: SyncOptions
): Promise<SyncResult> {
  const startTime = Date.now()

  // Get mapping
  const mapping = await getERPMapping({
    orgId: options.orgId,
    entityType: options.entityType,
    entityId: options.entityId,
  })

  if (!mapping?.erpName) {
    return {
      success: false,
      error: 'No ERP mapping found',
      duration: Date.now() - startTime,
    }
  }

  try {
    // Log pull event
    await logSyncEvent({
      orgId: options.orgId,
      eventType: 'pull',
      entityType: options.entityType,
      entityId: options.entityId,
      erpDoctype: options.erpDoctype,
      erpName: mapping.erpName,
      direction: 'pull',
      status: 'started',
    })

    // Fetch from ERPNext
    const response = await erpnextFetch<Record<string, unknown>>(
      `/api/resource/${options.erpDoctype}/${mapping.erpName}`
    )

    const duration = Date.now() - startTime

    // Log success
    await logSyncEvent({
      orgId: options.orgId,
      eventType: 'pull',
      entityType: options.entityType,
      entityId: options.entityId,
      erpDoctype: options.erpDoctype,
      erpName: mapping.erpName,
      direction: 'pull',
      status: 'success',
      durationMs: duration,
      responsePayload: response,
    })

    return {
      success: true,
      erpName: mapping.erpName,
      duration,
    }
  } catch (error) {
    const err = error as Error
    const duration = Date.now() - startTime

    // Log error
    await logSyncEvent({
      orgId: options.orgId,
      eventType: 'error',
      entityType: options.entityType,
      entityId: options.entityId,
      erpDoctype: options.erpDoctype,
      erpName: mapping.erpName,
      direction: 'pull',
      status: 'error',
      errorMessage: err.message,
      errorStack: err.stack,
      durationMs: duration,
    })

    return {
      success: false,
      error: err.message,
      duration,
    }
  }
}

/**
 * Batch sync multiple entities
 */
export async function batchSync(
  entities: Array<SyncOptions & { payload?: Record<string, unknown> }>
): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  for (const entity of entities) {
    if (entity.direction === 'push' && entity.payload) {
      const result = await pushToERPNext(entity, entity.payload)
      results.push(result)
    } else if (entity.direction === 'pull') {
      const result = await pullFromERPNext(entity)
      results.push(result)
    }
  }

  return results
}
