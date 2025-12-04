'use server';

/**
 * Stock/Inventory Server Actions
 * Server-side actions for inventory management
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ItemService, WarehouseService, StockEntryService, StockLedgerService } from '@/lib/services/stock';
import { logAuditEvent } from '@/lib/audit/logger';

// =============================================
// HELPER: Get current org and user
// =============================================

interface AuthContext {
  orgId: string;
  userId: string;
}

async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.org_id) return null;

  return {
    orgId: membership.org_id,
    userId: user.id,
  };
}

async function getCurrentOrg(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return membership?.org_id ?? null;
}

// =============================================
// ACTION RESULT TYPE
// =============================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// ITEM ACTIONS
// =============================================

/**
 * List items with filters
 */
export async function listItems(options?: {
  search?: string;
  itemGroupId?: string;
  isStockItem?: boolean;
  isSalesItem?: boolean;
  isPurchaseItem?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const items = await ItemService.list({
      orgId,
      search: options?.search,
      itemGroupId: options?.itemGroupId,
      isStockItem: options?.isStockItem,
      isSalesItem: options?.isSalesItem,
      isPurchaseItem: options?.isPurchaseItem,
      isActive: options?.isActive ?? true,
      limit: options?.limit,
      offset: options?.offset,
    });

    return { success: true, data: items };
  } catch (error) {
    console.error('[listItems] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list items',
    };
  }
}

/**
 * Get item by ID with stock info
 */
export async function getItem(id: string): Promise<ActionResult> {
  try {
    const item = await ItemService.getWithStock(id);
    return { success: true, data: item };
  } catch (error) {
    console.error('[getItem] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get item',
    };
  }
}

/**
 * Create a new item
 */
export async function createItem(data: {
  itemName: string;
  itemCode?: string;
  description?: string;
  itemGroupId?: string;
  stockUomId?: string;
  isStockItem?: boolean;
  isSalesItem?: boolean;
  isPurchaseItem?: boolean;
  standardRate?: number;
  reorderLevel?: number;
  reorderQty?: number;
  safetyStock?: number;
  defaultWarehouseId?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const item = await ItemService.create({
      orgId,
      itemName: data.itemName,
      itemCode: data.itemCode,
      description: data.description,
      itemGroupId: data.itemGroupId,
      stockUomId: data.stockUomId,
      isStockItem: data.isStockItem ?? true,
      valuationMethod: 'Moving Average',
      hasSerialNo: false,
      hasBatchNo: false,
      hasExpiryDate: false,
      isPurchaseItem: data.isPurchaseItem ?? true,
      isSalesItem: data.isSalesItem ?? true,
      standardRate: data.standardRate ?? 0,
      reorderLevel: data.reorderLevel ?? 0,
      reorderQty: data.reorderQty ?? 0,
      safetyStock: data.safetyStock ?? 0,
      defaultWarehouseId: data.defaultWarehouseId,
    });

    revalidatePath('/inventory/items');
    revalidatePath('/products');

    return { success: true, data: item };
  } catch (error) {
    console.error('[createItem] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create item',
    };
  }
}

/**
 * Update item
 */
export async function updateItem(
  id: string,
  data: {
    itemName?: string;
    description?: string;
    itemGroupId?: string;
    standardRate?: number;
    reorderLevel?: number;
    reorderQty?: number;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  try {
    const item = await ItemService.update({
      id,
      ...data,
    });

    revalidatePath('/inventory/items');
    revalidatePath(`/inventory/items/${id}`);
    revalidatePath('/products');

    return { success: true, data: item };
  } catch (error) {
    console.error('[updateItem] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update item',
    };
  }
}

/**
 * Get low stock items
 */
export async function getLowStockItems(): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const items = await ItemService.getLowStockItems(orgId);
    return { success: true, data: items };
  } catch (error) {
    console.error('[getLowStockItems] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get low stock items',
    };
  }
}

/**
 * Get item groups
 */
export async function listItemGroups(): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const groups = await ItemService.getItemGroups(orgId);
    return { success: true, data: groups };
  } catch (error) {
    console.error('[listItemGroups] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list item groups',
    };
  }
}

/**
 * Get UOMs
 */
export async function listUoms(): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const uoms = await ItemService.getUoms(orgId);
    return { success: true, data: uoms };
  } catch (error) {
    console.error('[listUoms] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list UOMs',
    };
  }
}

// =============================================
// WAREHOUSE ACTIONS
// =============================================

/**
 * List warehouses
 */
export async function listWarehouses(): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const warehouses = await WarehouseService.list({ orgId });
    return { success: true, data: warehouses };
  } catch (error) {
    console.error('[listWarehouses] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list warehouses',
    };
  }
}

/**
 * Create warehouse
 */
export async function createWarehouse(data: {
  warehouseName: string;
  warehouseCode?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  parentId?: string;
  isGroup?: boolean;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const warehouse = await WarehouseService.create({
      orgId,
      warehouseName: data.warehouseName,
      warehouseCode: data.warehouseCode,
      addressLine1: data.addressLine1,
      city: data.city,
      country: data.country ?? 'Philippines',
      parentId: data.parentId,
      isGroup: data.isGroup ?? false,
      isRejectedWarehouse: false,
    });

    revalidatePath('/inventory/warehouses');

    return { success: true, data: warehouse };
  } catch (error) {
    console.error('[createWarehouse] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create warehouse',
    };
  }
}

/**
 * Get warehouse stock
 */
export async function getWarehouseStock(warehouseId: string): Promise<ActionResult> {
  try {
    const stock = await WarehouseService.getStockSummary(warehouseId);
    return { success: true, data: stock };
  } catch (error) {
    console.error('[getWarehouseStock] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get warehouse stock',
    };
  }
}

// =============================================
// STOCK ENTRY ACTIONS
// =============================================

/**
 * Create stock entry (receipt, issue, transfer)
 */
export async function createStockEntry(data: {
  purpose: 'Material Receipt' | 'Material Issue' | 'Material Transfer';
  postingDate: string;
  postingTime?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  remarks?: string;
  items: Array<{
    itemId: string;
    qty: number;
    basicRate?: number;
    serialNo?: string;
    batchNo?: string;
  }>;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const auth = await getAuthContext();
    const entry = await StockEntryService.create({
      orgId,
      purpose: data.purpose,
      postingDate: new Date(data.postingDate),
      postingTime: data.postingTime || '12:00:00',
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      remarks: data.remarks,
      items: data.items.map((item) => ({
        itemId: item.itemId,
        qty: item.qty,
        basicRate: item.basicRate,
        serialNo: item.serialNo,
        batchNo: item.batchNo,
        isFinishedItem: false,
        isScrapItem: false,
      })),
    });

    // Audit log for stock entry creation
    await logAuditEvent({
      orgId: auth?.orgId,
      userId: auth?.userId,
      action: 'create',
      entityType: 'stock_entry',
      entityId: entry.id,
      changes: {
        purpose: data.purpose,
        itemCount: data.items.length,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
      },
    });

    revalidatePath('/inventory/stock-entries');
    revalidatePath('/inventory/items');

    return { success: true, data: entry };
  } catch (error) {
    console.error('[createStockEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create stock entry',
    };
  }
}

/**
 * List stock entries
 */
export async function listStockEntries(options?: {
  purpose?: 'Material Receipt' | 'Material Issue' | 'Material Transfer' | 'Material Transfer for Manufacture' | 'Manufacture' | 'Repack' | 'Send to Subcontractor';
  fromDate?: string;
  toDate?: string;
  status?: 'Draft' | 'Submitted' | 'Cancelled';
  limit?: number;
  offset?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const entries = await StockEntryService.list({
      orgId,
      purpose: options?.purpose,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
      status: options?.status,
      limit: options?.limit,
      offset: options?.offset,
    });

    return { success: true, data: entries };
  } catch (error) {
    console.error('[listStockEntries] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list stock entries',
    };
  }
}

/**
 * Submit stock entry
 */
export async function submitStockEntry(id: string): Promise<ActionResult> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: 'User not authenticated' };
    }

    const entry = await StockEntryService.submit(id, auth.userId);

    // Audit log for stock entry submission (inventory movement)
    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'submit',
      entityType: 'stock_entry',
      entityId: id,
      metadata: {
        severity: 'high',
        description: 'Stock entry posted - inventory levels updated',
      },
    });

    revalidatePath('/inventory/stock-entries');
    revalidatePath(`/inventory/stock-entries/${id}`);
    revalidatePath('/inventory/items');

    return { success: true, data: entry };
  } catch (error) {
    console.error('[submitStockEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit stock entry',
    };
  }
}

/**
 * Cancel stock entry
 */
export async function cancelStockEntry(id: string): Promise<ActionResult> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: 'User not authenticated' };
    }

    const entry = await StockEntryService.cancel(id, auth.userId);

    // Audit log for stock entry cancellation
    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'cancel',
      entityType: 'stock_entry',
      entityId: id,
      metadata: {
        severity: 'high',
        description: 'Stock entry cancelled - inventory levels reversed',
      },
    });

    revalidatePath('/inventory/stock-entries');
    revalidatePath(`/inventory/stock-entries/${id}`);
    revalidatePath('/inventory/items');

    return { success: true, data: entry };
  } catch (error) {
    console.error('[cancelStockEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel stock entry',
    };
  }
}

// =============================================
// STOCK LEDGER ACTIONS
// =============================================

/**
 * Get stock balance for a specific item and warehouse
 */
export async function getStockBalance(options: {
  itemId: string;
  warehouseId: string;
  asOfDate?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const balance = await StockLedgerService.getStockBalance(
      options.itemId,
      options.warehouseId,
      options.asOfDate ? new Date(options.asOfDate) : undefined
    );

    return { success: true, data: balance };
  } catch (error) {
    console.error('[getStockBalance] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stock balance',
    };
  }
}

/**
 * Get stock ledger entries for an item
 */
export async function getStockLedger(options: {
  itemId: string;
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const entries = await StockLedgerService.getEntriesByItem(options.itemId, {
      warehouseId: options.warehouseId,
      fromDate: options.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options.toDate ? new Date(options.toDate) : undefined,
      limit: options.limit,
    });

    return { success: true, data: entries };
  } catch (error) {
    console.error('[getStockLedger] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stock ledger',
    };
  }
}

/**
 * Get inventory valuation summary
 * Returns total value of inventory grouped by item
 */
export async function getInventoryValuation(): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const supabase = await createClient();

    // Get the latest stock ledger entry for each item/warehouse combination
    const { data, error } = await supabase
      .from('stock_ledger_entries')
      .select(`
        item_id,
        items!inner(item_name, item_code),
        warehouse_id,
        warehouses!inner(warehouse_name),
        qty_after_transaction,
        valuation_rate,
        stock_value
      `)
      .eq('is_cancelled', false)
      .order('posting_datetime', { ascending: false });

    if (error) {
      throw new Error(`Failed to get inventory valuation: ${error.message}`);
    }

    // Group by item and calculate totals
    const itemMap = new Map<string, {
      itemId: string;
      itemName: string;
      itemCode: string;
      totalQty: number;
      totalValue: number;
      warehouses: Array<{
        warehouseId: string;
        warehouseName: string;
        qty: number;
        value: number;
      }>;
    }>();

    const seenCombos = new Set<string>();
    for (const row of data || []) {
      const comboKey = `${row.item_id}-${row.warehouse_id}`;
      if (seenCombos.has(comboKey)) continue; // Skip older entries for same item/warehouse
      seenCombos.add(comboKey);

      const itemData = row.items as unknown as { item_name: string; item_code: string };
      const warehouseData = row.warehouses as unknown as { warehouse_name: string };
      const qty = parseFloat(String(row.qty_after_transaction)) || 0;
      const value = parseFloat(String(row.stock_value)) || 0;

      if (!itemMap.has(row.item_id)) {
        itemMap.set(row.item_id, {
          itemId: row.item_id,
          itemName: itemData.item_name,
          itemCode: itemData.item_code,
          totalQty: 0,
          totalValue: 0,
          warehouses: [],
        });
      }

      const item = itemMap.get(row.item_id)!;
      item.totalQty += qty;
      item.totalValue += value;
      item.warehouses.push({
        warehouseId: row.warehouse_id,
        warehouseName: warehouseData.warehouse_name,
        qty,
        value,
      });
    }

    const valuation = {
      items: Array.from(itemMap.values()),
      totalValue: Array.from(itemMap.values()).reduce((sum, item) => sum + item.totalValue, 0),
      totalItems: itemMap.size,
    };

    return { success: true, data: valuation };
  } catch (error) {
    console.error('[getInventoryValuation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory valuation',
    };
  }
}
