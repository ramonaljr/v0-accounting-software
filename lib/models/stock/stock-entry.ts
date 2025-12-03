/**
 * Stock Entry Model
 * Based on ERPNext's Stock Entry DocType
 *
 * Stock Entry is the primary document for internal stock movements:
 * - Material Receipt (incoming stock)
 * - Material Issue (outgoing stock)
 * - Material Transfer (between warehouses)
 * - Manufacture (consume raw materials, produce finished goods)
 * - Repack (convert one item to another)
 */

import { z } from 'zod';

// Stock Entry purposes
export const StockEntryPurpose = z.enum([
  'Material Issue',
  'Material Receipt',
  'Material Transfer',
  'Material Transfer for Manufacture',
  'Manufacture',
  'Repack',
  'Send to Subcontractor',
]);
export type StockEntryPurpose = z.infer<typeof StockEntryPurpose>;

// Stock Entry status
export const StockEntryStatus = z.enum(['Draft', 'Submitted', 'Cancelled']);
export type StockEntryStatus = z.infer<typeof StockEntryStatus>;

// Stock Entry Item schema
export const StockEntryItemSchema = z.object({
  id: z.string().uuid(),
  stockEntryId: z.string().uuid(),
  idx: z.number().int().min(0).default(0),

  // Item
  itemId: z.string().uuid(),
  itemCode: z.string().max(100),
  itemName: z.string().max(255).optional(),

  // Warehouses
  sWarehouseId: z.string().uuid().optional(),  // Source
  tWarehouseId: z.string().uuid().optional(),  // Target

  // Quantity
  qty: z.number().positive(),
  uomId: z.string().uuid().optional(),
  conversionFactor: z.number().positive().default(1),
  stockUomQty: z.number().optional(),  // qty in stock UOM

  // Valuation
  basicRate: z.number().min(0).default(0),  // Cost/rate
  basicAmount: z.number().min(0).default(0),  // qty × rate
  valuationRate: z.number().min(0).default(0),

  // For transfers with additional costs
  additionalCost: z.number().min(0).default(0),

  // Batch/Serial
  batchId: z.string().uuid().optional(),
  serialNo: z.string().optional(),  // Comma-separated for multiple

  // Manufacturing
  isFinishedItem: z.boolean().default(false),
  isScrapItem: z.boolean().default(false),

  // Expense account (for consumption)
  expenseAccountId: z.string().uuid().optional(),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  createdAt: z.date(),
});

export type StockEntryItem = z.infer<typeof StockEntryItemSchema>;

// Stock Entry schema
export const StockEntrySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Naming
  entryNumber: z.string(),
  namingSeries: z.string().default('STE'),

  // Type and purpose
  stockEntryTypeId: z.string().uuid().optional(),
  purpose: StockEntryPurpose,

  // Timing
  postingDate: z.date(),
  postingTime: z.string(),

  // Simple transfer convenience fields
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),

  // Manufacturing link
  workOrderId: z.string().uuid().optional(),
  bomId: z.string().uuid().optional(),

  // Totals
  totalIncomingValue: z.number().min(0).default(0),
  totalOutgoingValue: z.number().min(0).default(0),
  valueDifference: z.number().default(0),

  // Status
  status: StockEntryStatus.default('Draft'),

  // Additional
  remarks: z.string().optional(),

  // Items
  items: z.array(StockEntryItemSchema).optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  submittedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  submittedBy: z.string().uuid().optional(),
});

export type StockEntry = z.infer<typeof StockEntrySchema>;

// Create Stock Entry Item input
export const CreateStockEntryItemSchema = z.object({
  itemId: z.string().uuid(),
  sWarehouseId: z.string().uuid().optional(),
  tWarehouseId: z.string().uuid().optional(),
  qty: z.number().positive(),
  uomId: z.string().uuid().optional(),
  basicRate: z.number().min(0).optional(),
  batchId: z.string().uuid().optional(),
  serialNo: z.string().optional(),
  isFinishedItem: z.boolean().default(false),
  isScrapItem: z.boolean().default(false),
  expenseAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export type CreateStockEntryItem = z.infer<typeof CreateStockEntryItemSchema>;

// Create Stock Entry input schema
export const CreateStockEntrySchema = z.object({
  orgId: z.string().uuid(),
  purpose: StockEntryPurpose,

  postingDate: z.date().default(() => new Date()),
  postingTime: z.string().optional(),

  // Simple transfer
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),

  // Manufacturing
  workOrderId: z.string().uuid().optional(),
  bomId: z.string().uuid().optional(),

  remarks: z.string().optional(),

  items: z.array(CreateStockEntryItemSchema).min(1),
});

export type CreateStockEntry = z.infer<typeof CreateStockEntrySchema>;

// Update Stock Entry schema
export const UpdateStockEntrySchema = CreateStockEntrySchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateStockEntry = z.infer<typeof UpdateStockEntrySchema>;

// Stock Entry list filters
export interface StockEntryListFilters {
  orgId: string;
  purpose?: StockEntryPurpose;
  status?: StockEntryStatus;
  fromDate?: Date;
  toDate?: Date;
  itemId?: string;
  warehouseId?: string;
  limit?: number;
  offset?: number;
}

// Stock Entry Type
export interface StockEntryType {
  id: string;
  orgId: string;
  typeName: string;
  purpose: StockEntryPurpose;
  addToTransit: boolean;
  isActive: boolean;
}

/**
 * Validate stock entry items based on purpose
 */
export function validateStockEntryItems(
  purpose: StockEntryPurpose,
  items: CreateStockEntryItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    switch (purpose) {
      case 'Material Issue':
        if (!item.sWarehouseId) {
          errors.push(`Item ${i + 1}: Source warehouse is required for Material Issue`);
        }
        if (item.tWarehouseId) {
          errors.push(`Item ${i + 1}: Target warehouse should not be set for Material Issue`);
        }
        break;

      case 'Material Receipt':
        if (!item.tWarehouseId) {
          errors.push(`Item ${i + 1}: Target warehouse is required for Material Receipt`);
        }
        if (item.sWarehouseId) {
          errors.push(`Item ${i + 1}: Source warehouse should not be set for Material Receipt`);
        }
        break;

      case 'Material Transfer':
      case 'Material Transfer for Manufacture':
      case 'Send to Subcontractor':
        if (!item.sWarehouseId) {
          errors.push(`Item ${i + 1}: Source warehouse is required for transfer`);
        }
        if (!item.tWarehouseId) {
          errors.push(`Item ${i + 1}: Target warehouse is required for transfer`);
        }
        if (item.sWarehouseId && item.sWarehouseId === item.tWarehouseId) {
          errors.push(`Item ${i + 1}: Source and target warehouse cannot be the same`);
        }
        break;

      case 'Manufacture':
        // For manufacture, items without source are finished goods (target only)
        // Items without target are raw materials (source only)
        if (!item.sWarehouseId && !item.tWarehouseId) {
          errors.push(`Item ${i + 1}: Either source or target warehouse is required`);
        }
        break;

      case 'Repack':
        // Similar to manufacture
        if (!item.sWarehouseId && !item.tWarehouseId) {
          errors.push(`Item ${i + 1}: Either source or target warehouse is required`);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate stock entry totals
 */
export function calculateStockEntryTotals(items: Array<{
  qty: number;
  basicRate: number;
  sWarehouseId?: string;
  tWarehouseId?: string;
}>): {
  totalIncomingValue: number;
  totalOutgoingValue: number;
  valueDifference: number;
} {
  let totalIncomingValue = 0;
  let totalOutgoingValue = 0;

  for (const item of items) {
    const amount = item.qty * item.basicRate;

    if (item.tWarehouseId && !item.sWarehouseId) {
      // Pure incoming (receipt)
      totalIncomingValue += amount;
    } else if (item.sWarehouseId && !item.tWarehouseId) {
      // Pure outgoing (issue)
      totalOutgoingValue += amount;
    } else if (item.sWarehouseId && item.tWarehouseId) {
      // Transfer - counts as both
      totalIncomingValue += amount;
      totalOutgoingValue += amount;
    }
  }

  return {
    totalIncomingValue,
    totalOutgoingValue,
    valueDifference: totalIncomingValue - totalOutgoingValue,
  };
}
