/**
 * ERPNext Comprehensive Integration
 * Complete sync utilities for all ERPNext doctypes across all phases
 */

import { erpnextFetch } from './client'
import { pushToERPNext, getERPMapping } from './sync'

/**
 * Generic sync function for any doctype
 */
export async function syncToERPNext(params: {
  orgId: string
  entityType: string
  entityId: string
  erpDoctype: string
  payload: Record<string, unknown>
  companyName?: string
}): Promise<{ success: boolean; erpName?: string; error?: string }> {
  return pushToERPNext(
    {
      orgId: params.orgId,
      entityType: params.entityType,
      entityId: params.entityId,
      erpDoctype: params.erpDoctype,
      direction: 'push',
    },
    params.payload
  )
}

/**
 * Import generic doctype list from ERPNext
 */
export async function importFromERPNext(params: {
  doctype: string
  fields: string[]
  filters?: Array<[string, string, string | number | boolean]>
  limit?: number
}): Promise<unknown[]> {
  try {
    const fieldsParam = JSON.stringify(params.fields)
    const filtersParam = params.filters ? `&filters=${JSON.stringify(params.filters)}` : ''
    const limitParam = params.limit ? `&limit_page_length=${params.limit}` : '&limit_page_length=999'

    const response = await erpnextFetch(
      `/api/resource/${params.doctype}?fields=${fieldsParam}${filtersParam}${limitParam}`
    )

    return response.data || []
  } catch (error) {
    console.error(`Failed to import ${params.doctype}:`, error)
    return []
  }
}

/**
 * Submit a document in ERPNext (mark as finalized)
 */
export async function submitDocument(params: {
  doctype: string
  name: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await erpnextFetch(`/api/resource/${params.doctype}/${params.name}`, {
      method: 'PUT',
      body: JSON.stringify({ docstatus: 1 }),
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Submit failed',
    }
  }
}

/**
 * Cancel a document in ERPNext
 */
export async function cancelDocument(params: {
  doctype: string
  name: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await erpnextFetch(`/api/resource/${params.doctype}/${params.name}`, {
      method: 'PUT',
      body: JSON.stringify({ docstatus: 2 }),
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cancel failed',
    }
  }
}

/**
 * Get document by name
 */
export async function getDocument(params: {
  doctype: string
  name: string
}): Promise<unknown> {
  try {
    const response = await erpnextFetch(`/api/resource/${params.doctype}/${params.name}`)
    return response.data || response
  } catch (error) {
    console.error(`Failed to get ${params.doctype}:`, error)
    return null
  }
}

/**
 * Phase 4: Supplier sync
 */
export async function pushSupplierToERPNext(orgId: string, supplierId: string, payload: Record<string, unknown>) {
  return syncToERPNext({
    orgId,
    entityType: 'supplier',
    entityId: supplierId,
    erpDoctype: 'Supplier',
    payload,
  })
}

/**
 * Phase 4: Purchase Invoice sync
 */
export async function pushPurchaseInvoiceToERPNext(orgId: string, billId: string, payload: Record<string, unknown>) {
  return syncToERPNext({
    orgId,
    entityType: 'purchase_invoice',
    entityId: billId,
    erpDoctype: 'Purchase Invoice',
    payload,
  })
}

/**
 * Phase 5: Tax Template sync
 */
export async function pushTaxTemplateToERPNext(orgId: string, templateId: string, payload: Record<string, unknown>) {
  return syncToERPNext({
    orgId,
    entityType: 'tax_template',
    entityId: templateId,
    erpDoctype: 'Sales Taxes and Charges Template',
    payload,
  })
}

/**
 * Phase 6: Warehouse sync
 */
export async function pushWarehouseToERPNext(orgId: string, warehouseId: string, payload: Record<string, unknown>) {
  return syncToERPNext({
    orgId,
    entityType: 'warehouse',
    entityId: warehouseId,
    erpDoctype: 'Warehouse',
    payload,
  })
}

/**
 * Phase 6: Stock Entry sync
 */
export async function pushStockEntryToERPNext(orgId: string, entryId: string, payload: Record<string, unknown>) {
  return syncToERPNext({
    orgId,
    entityType: 'stock_entry',
    entityId: entryId,
    erpDoctype: 'Stock Entry',
    payload,
  })
}

/**
 * Phase 7: Asset sync
 */
export async function pushAssetToERPNext(orgId: string, assetId: string, payload: Record<string, unknown>) {
  return syncToERPNext({
    orgId,
    entityType: 'asset',
    entityId: assetId,
    erpDoctype: 'Asset',
    payload,
  })
}

/**
 * Phase 8: Exchange Rate sync
 */
export async function pushExchangeRateToERPNext(payload: Record<string, unknown>) {
  try {
    const response = await erpnextFetch('/api/resource/Currency Exchange', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return {
      success: true,
      erpName: response.data?.name || response.name,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to push exchange rate',
    }
  }
}

/**
 * Bulk sync utility
 */
export async function bulkSync(items: Array<{
  orgId: string
  entityType: string
  entityId: string
  erpDoctype: string
  payload: Record<string, unknown>
}>): Promise<Array<{ success: boolean; erpName?: string; error?: string }>> {
  const results: Array<{ success: boolean; erpName?: string; error?: string }> = []

  for (const item of items) {
    const result = await syncToERPNext(item)
    results.push(result)

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

/**
 * Batch import helper
 */
export async function batchImport(params: {
  doctype: string
  companyName?: string
  limit?: number
}): Promise<unknown[]> {
  const filters = params.companyName
    ? [['company', '=', params.companyName] as [string, string, string]]
    : undefined

  return importFromERPNext({
    doctype: params.doctype,
    fields: ['*'],
    filters,
    limit: params.limit,
  })
}

/**
 * Sync status checker
 */
export async function checkSyncStatus(params: {
  orgId: string
  entityType: string
}): Promise<{
  total: number
  synced: number
  pending: number
  errors: number
}> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: mappings } = await supabase
    .from('erp_map')
    .select('sync_status')
    .eq('org_id', params.orgId)
    .eq('entity_type', params.entityType)

  const total = mappings?.length || 0
  const synced = mappings?.filter(m => m.sync_status === 'synced').length || 0
  const pending = mappings?.filter(m => m.sync_status === 'pending').length || 0
  const errors = mappings?.filter(m => m.sync_status === 'error').length || 0

  return { total, synced, pending, errors }
}
