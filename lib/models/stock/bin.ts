/**
 * Bin Model
 * Based on ERPNext's Bin DocType
 *
 * Real-time stock balance per item/warehouse combination.
 * This is a denormalized view of stock for fast lookups.
 */

import { z } from 'zod';

// Bin schema
export const BinSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  itemId: z.string().uuid(),
  warehouseId: z.string().uuid(),

  // Actual on-hand qty (from latest SLE)
  actualQty: z.number().default(0),

  // Current valuation rate
  valuationRate: z.number().default(0),
  stockValue: z.number().default(0),

  // Reserved quantities
  orderedQty: z.number().default(0),      // Pending purchase orders
  reservedQty: z.number().default(0),     // Reserved for sales orders
  indentedQty: z.number().default(0),     // Material requests
  plannedQty: z.number().default(0),      // Production plans
  reservedQtyForProduction: z.number().default(0),

  // Projected qty (calculated)
  projectedQty: z.number().default(0),

  // Audit
  updatedAt: z.date(),
});

export type Bin = z.infer<typeof BinSchema>;

// Bin with item and warehouse names for display
export interface BinWithDetails extends Bin {
  itemCode: string;
  itemName: string;
  warehouseName: string;
  uomName?: string;
}

// Stock summary by item
export interface ItemStockSummary {
  itemId: string;
  itemCode: string;
  itemName: string;
  totalQty: number;
  totalValue: number;
  warehouseBreakdown: Array<{
    warehouseId: string;
    warehouseName: string;
    qty: number;
    valuationRate: number;
    value: number;
  }>;
}

// Stock summary by warehouse
export interface WarehouseStockSummary {
  warehouseId: string;
  warehouseName: string;
  totalItems: number;
  totalValue: number;
  itemBreakdown: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    qty: number;
    valuationRate: number;
    value: number;
  }>;
}

// Low stock item
export interface LowStockItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  actualQty: number;
  reorderLevel: number;
  reorderQty: number;
  shortfall: number;
}

// Stock availability check result
export interface StockAvailability {
  itemId: string;
  warehouseId: string;
  requestedQty: number;
  availableQty: number;
  reservedQty: number;
  isAvailable: boolean;
  shortfall: number;
}

/**
 * Calculate projected quantity from bin fields
 */
export function calculateProjectedQty(bin: {
  actualQty: number;
  orderedQty: number;
  indentedQty: number;
  plannedQty: number;
  reservedQty: number;
  reservedQtyForProduction: number;
}): number {
  return (
    bin.actualQty +
    bin.orderedQty +
    bin.indentedQty +
    bin.plannedQty -
    bin.reservedQty -
    bin.reservedQtyForProduction
  );
}

/**
 * Check if stock is available for reservation
 */
export function checkStockAvailability(
  bin: Bin,
  requestedQty: number,
  allowNegative: boolean = false
): StockAvailability {
  const availableQty = bin.actualQty - bin.reservedQty - bin.reservedQtyForProduction;
  const isAvailable = allowNegative || availableQty >= requestedQty;
  const shortfall = Math.max(0, requestedQty - availableQty);

  return {
    itemId: bin.itemId,
    warehouseId: bin.warehouseId,
    requestedQty,
    availableQty,
    reservedQty: bin.reservedQty,
    isAvailable,
    shortfall,
  };
}
