'use server';

/**
 * Stock/Inventory Server Actions
 * Server-side actions for inventory management
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ItemService, WarehouseService, StockEntryService, StockLedgerService } from '@/lib/services/stock';

// =============================================
// HELPER: Get current org
// =============================================

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
  defaultWarehouseId?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const item = await ItemService.create({
      orgId,
      ...data,
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

    const warehouses = await WarehouseService.list(orgId);
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
  warehouseType?: string;
  address?: string;
  parentWarehouseId?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const warehouse = await WarehouseService.create({
      orgId,
      ...data,
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
    const stock = await WarehouseService.getStock(warehouseId);
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
  stockEntryType: 'Material Receipt' | 'Material Issue' | 'Material Transfer';
  postingDate: string;
  postingTime?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  remarks?: string;
  items: Array<{
    itemId: string;
    qty: number;
    rate?: number;
    serialNo?: string;
    batchNo?: string;
  }>;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const entry = await StockEntryService.create({
      orgId,
      stockEntryType: data.stockEntryType,
      postingDate: new Date(data.postingDate),
      postingTime: data.postingTime || '12:00:00',
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      remarks: data.remarks,
      items: data.items,
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
  stockEntryType?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
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
      stockEntryType: options?.stockEntryType as any,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
      status: options?.status as any,
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
    const entry = await StockEntryService.submit(id);

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
    const entry = await StockEntryService.cancel(id);

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
 * Get stock balance
 */
export async function getStockBalance(options: {
  itemId?: string;
  warehouseId?: string;
  asOfDate?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const balance = await StockLedgerService.getStockBalance({
      orgId,
      itemId: options.itemId,
      warehouseId: options.warehouseId,
      asOfDate: options.asOfDate ? new Date(options.asOfDate) : undefined,
    });

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
 * Get stock ledger entries
 */
export async function getStockLedger(options: {
  itemId?: string;
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

    const entries = await StockLedgerService.getStockLedgerEntries({
      orgId,
      itemId: options.itemId,
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
 */
export async function getInventoryValuation(): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const valuation = await StockLedgerService.getInventoryValuation(orgId);
    return { success: true, data: valuation };
  } catch (error) {
    console.error('[getInventoryValuation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory valuation',
    };
  }
}
