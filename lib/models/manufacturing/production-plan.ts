/**
 * Production Plan Model
 * MRP (Material Requirements Planning) document
 * Based on ERPNext's Production Plan DocType
 */

import { z } from 'zod';

export type ProductionPlanStatus =
  | 'Draft'
  | 'Submitted'
  | 'Material Requested'
  | 'In Process'
  | 'Completed'
  | 'Closed'
  | 'Cancelled';

// Production Plan header
export interface ProductionPlan {
  id: string;
  orgId: string;
  productionPlanNo: string;
  status: ProductionPlanStatus;
  // Planning dates
  planningDate: Date;
  postingDate: Date;
  // Filters for getting items
  itemCode?: string;
  customer?: string;
  project?: string;
  salesOrderId?: string;
  // MRP settings
  getItemsFrom: 'Sales Order' | 'Material Request' | 'Manual';
  includeNonStockItems: boolean;
  includeSubcontractedItems: boolean;
  ignoreProcurementLeadTime: boolean;
  ignoreExistingOrderedQty: boolean;
  ignoreExistingProjectedQty: boolean;
  // Sub-assembly handling
  includeSafetyStock: boolean;
  forWarehouseId?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  submittedAt?: Date;
  submittedBy?: string;
}

// Production Plan item - item to be manufactured
export interface ProductionPlanItem {
  id: string;
  productionPlanId: string;
  // Item details
  itemId: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  // BOM
  bomId: string;
  bomNo?: string;
  // Quantities
  plannedQty: number;
  pendingQty: number;
  producedQty: number;
  // Stock info
  stockQty: number;
  orderedQty: number;
  reservedQty: number;
  // Warehouse
  warehouseId?: string;
  warehouseName?: string;
  // Source document
  salesOrderId?: string;
  salesOrderNo?: string;
  salesOrderItemId?: string;
  materialRequestId?: string;
  materialRequestNo?: string;
  materialRequestItemId?: string;
  // Dates
  plannedStartDate: Date;
  // Make or buy
  makeOrBuy: 'Make' | 'Buy';
  // Work order ref
  workOrderId?: string;
}

// Production Plan sub-assembly
export interface ProductionPlanSubAssembly {
  id: string;
  productionPlanId: string;
  // Parent item
  parentItemId: string;
  parentItemCode?: string;
  // Sub-assembly item
  itemId: string;
  itemCode?: string;
  itemName?: string;
  // BOM
  bomId?: string;
  bomNo?: string;
  // Quantities
  qty: number;
  stockQty: number;
  woProducedQty: number;
  // Warehouse
  warehouseId?: string;
  // UOM
  uomId?: string;
  uomName?: string;
  // BOM level
  bomLevel: number;
  indent: number;
  // Scheduling
  scheduledDate?: Date;
  // Type
  type: 'Material Request' | 'Work Order';
}

// Production Plan material requirement (MRP output)
export interface ProductionPlanMaterial {
  id: string;
  productionPlanId: string;
  // Item
  itemId: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  // Quantities
  requiredQty: number;
  availableQtyAtSourceWarehouse: number;
  availableQtyAtAllWarehouses: number;
  orderedQty: number;
  reservedQtyForProduction: number;
  // Calculated
  qtyToProcure: number;
  // Warehouse
  warehouseId?: string;
  warehouseName?: string;
  // UOM
  uomId: string;
  uomName?: string;
  // BOM source
  bomDetailId?: string;
  bomNo?: string;
  // Source production plan item
  productionPlanItemId?: string;
  // Procurement
  materialRequestId?: string;
  purchaseOrderId?: string;
}

// Production Plan with all related data
export interface ProductionPlanWithDetails extends ProductionPlan {
  items: ProductionPlanItem[];
  subAssemblies: ProductionPlanSubAssembly[];
  materials: ProductionPlanMaterial[];
}

// Zod Schemas
export const createProductionPlanItemSchema = z.object({
  itemId: z.string().uuid(),
  bomId: z.string().uuid(),
  plannedQty: z.number().positive(),
  warehouseId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  salesOrderItemId: z.string().uuid().optional(),
  materialRequestId: z.string().uuid().optional(),
  materialRequestItemId: z.string().uuid().optional(),
  plannedStartDate: z.coerce.date(),
  makeOrBuy: z.enum(['Make', 'Buy']).default('Make'),
});

export const createProductionPlanSchema = z.object({
  orgId: z.string().uuid(),
  planningDate: z.coerce.date(),
  postingDate: z.coerce.date(),
  getItemsFrom: z.enum(['Sales Order', 'Material Request', 'Manual']).default('Manual'),
  includeNonStockItems: z.boolean().default(false),
  includeSubcontractedItems: z.boolean().default(false),
  ignoreProcurementLeadTime: z.boolean().default(false),
  ignoreExistingOrderedQty: z.boolean().default(false),
  ignoreExistingProjectedQty: z.boolean().default(false),
  includeSafetyStock: z.boolean().default(true),
  forWarehouseId: z.string().uuid().optional(),
  items: z.array(createProductionPlanItemSchema).min(1),
});

export type CreateProductionPlan = z.infer<typeof createProductionPlanSchema>;
export type CreateProductionPlanItem = z.infer<typeof createProductionPlanItemSchema>;

export interface UpdateProductionPlan extends Partial<Omit<CreateProductionPlan, 'orgId'>> {
  id: string;
}

// Get items from Sales Order filter
export interface ProductionPlanSalesOrderFilter {
  orgId: string;
  fromDate?: Date;
  toDate?: Date;
  customer?: string;
  itemId?: string;
  includeClosedOrders?: boolean;
}

// MRP calculation result
export interface MrpCalculationResult {
  productionPlanId: string;
  // Items to manufacture
  itemsToManufacture: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    bomId: string;
    qty: number;
    plannedStartDate: Date;
    parentItemId?: string;
    bomLevel: number;
  }>;
  // Materials to procure
  materialsToProcure: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    requiredQty: number;
    availableQty: number;
    orderedQty: number;
    qtyToProcure: number;
    warehouseId?: string;
    requiredByDate: Date;
  }>;
  // Warnings
  warnings: Array<{
    type: 'missing_bom' | 'inactive_bom' | 'insufficient_stock' | 'long_lead_time';
    itemCode: string;
    message: string;
  }>;
}

// Create Work Orders from Production Plan
export interface ProductionPlanWorkOrderCreate {
  productionPlanId: string;
  items: Array<{
    productionPlanItemId: string;
    quantity?: number; // Override planned qty
    wipWarehouseId?: string;
    targetWarehouseId?: string;
  }>;
}

// Create Material Requests from Production Plan
export interface ProductionPlanMaterialRequestCreate {
  productionPlanId: string;
  materials: Array<{
    productionPlanMaterialId: string;
    quantity?: number; // Override calculated qty
    targetWarehouseId?: string;
    requiredByDate?: Date;
  }>;
  type: 'Purchase' | 'Material Transfer';
}

// Production Plan summary for list views
export interface ProductionPlanSummary {
  id: string;
  productionPlanNo: string;
  status: ProductionPlanStatus;
  planningDate: Date;
  totalItems: number;
  totalMaterials: number;
  workOrdersCreated: number;
  materialRequestsCreated: number;
}

// MRP Run options
export interface MrpRunOptions {
  productionPlanId: string;
  includeExistingStock: boolean;
  includeOrderedQty: boolean;
  includeSafetyStock: boolean;
  consolidateByItem: boolean;
  respectLeadTimes: boolean;
}
