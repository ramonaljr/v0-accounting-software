/**
 * Work Order Model
 * Production order for manufacturing items
 * Based on ERPNext's Work Order DocType
 */

import { z } from 'zod';

export type WorkOrderStatus =
  | 'Draft'
  | 'Not Started'
  | 'In Process'
  | 'Completed'
  | 'Stopped'
  | 'Cancelled';

// Work Order header
export interface WorkOrder {
  id: string;
  orgId: string;
  workOrderNo: string;
  status: WorkOrderStatus;
  // Item details
  itemId: string;
  itemCode?: string;
  itemName?: string;
  bomId: string;
  bomNo?: string;
  // Quantities
  quantity: number;
  uomId: string;
  uomName?: string;
  producedQty: number;
  processLossQty: number;
  // Planning
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  expectedDeliveryDate?: Date;
  leadTimeDays: number;
  // Source
  productionPlanId?: string;
  productionPlanNo?: string;
  salesOrderId?: string;
  salesOrderNo?: string;
  // Warehouse settings
  sourceWarehouseId?: string;
  wipWarehouseId?: string;
  targetWarehouseId?: string;
  scrapWarehouseId?: string;
  // Material handling
  skipTransfer: boolean;
  materialTransferred: number;
  materialTransferredForManufacturing: number;
  // Settings
  useMultiLevelBom: boolean;
  allowAlternativeItem: boolean;
  // Project/Cost center
  projectId?: string;
  costCenterId?: string;
  // Description
  description?: string;
  remarks?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  submittedAt?: Date;
  submittedBy?: string;
}

// Work Order required item
export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  // BOM reference
  bomDetailId?: string;
  sourceBomId?: string;
  // Quantities
  requiredQty: number;
  transferredQty: number;
  consumedQty: number;
  returnedQty: number;
  availableQtyAtSourceWarehouse: number;
  availableQtyAtWipWarehouse: number;
  // UOM
  uomId: string;
  uomName?: string;
  conversionFactor: number;
  stockQty: number;
  stockUomId?: string;
  // Rate
  rate: number;
  amount: number;
  // Settings
  includeItemInManufacturing: boolean;
  allowAlternativeItem: boolean;
  // Source
  sourceWarehouseId?: string;
  originalItemId?: string;
  // Operation link (for Job Card based transfer)
  operationId?: string;
}

// Work Order operation
export interface WorkOrderOperation {
  id: string;
  workOrderId: string;
  operationId: string;
  operationName?: string;
  sequence: number;
  // Workstation
  workstationId?: string;
  workstationName?: string;
  workstationTypeId?: string;
  // Description
  description?: string;
  // Time (per batch)
  timeInMinutes: number;
  plannedOperatingCost: number;
  // For the full order
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  // Status
  status: 'Pending' | 'Work in Progress' | 'Complete';
  completedQty: number;
  processLossQty: number;
  // Batch settings from BOM
  batchSize: number;
  setUpTime: number;
  hourRate: number;
  fixedTime: boolean;
  // Calculated totals
  actualOperatingCost: number;
  actualOperationTime: number;
}

// Work Order with all related data
export interface WorkOrderWithDetails extends WorkOrder {
  items: WorkOrderItem[];
  operations: WorkOrderOperation[];
}

// Zod Schemas
export const createWorkOrderSchema = z.object({
  orgId: z.string().uuid(),
  bomId: z.string().uuid(),
  quantity: z.number().positive(),
  plannedStartDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  salesOrderId: z.string().uuid().optional(),
  productionPlanId: z.string().uuid().optional(),
  sourceWarehouseId: z.string().uuid().optional(),
  wipWarehouseId: z.string().uuid().optional(),
  targetWarehouseId: z.string().uuid().optional(),
  scrapWarehouseId: z.string().uuid().optional(),
  skipTransfer: z.boolean().default(false),
  useMultiLevelBom: z.boolean().default(true),
  allowAlternativeItem: z.boolean().default(false),
  projectId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
});

export type CreateWorkOrder = z.infer<typeof createWorkOrderSchema>;

export interface UpdateWorkOrder extends Partial<CreateWorkOrder> {
  id: string;
}

// Work Order summary for list views
export interface WorkOrderSummary {
  id: string;
  workOrderNo: string;
  status: WorkOrderStatus;
  itemCode: string;
  itemName: string;
  quantity: number;
  producedQty: number;
  percentComplete: number;
  plannedStartDate?: Date;
  expectedDeliveryDate?: Date;
}

// Material transfer for Work Order
export interface WorkOrderMaterialTransfer {
  workOrderId: string;
  items: Array<{
    itemId: string;
    sourceWarehouseId: string;
    targetWarehouseId: string;
    qty: number;
    operationId?: string;
  }>;
  postingDate: Date;
  postingTime?: string;
}

// Production completion
export interface WorkOrderCompletion {
  workOrderId: string;
  operationId?: string; // If completing specific operation
  quantity: number;
  postingDate: Date;
  postingTime?: string;
  targetWarehouseId?: string;
  // Consumed materials (for backflush)
  consumedItems?: Array<{
    itemId: string;
    warehouseId: string;
    qty: number;
    rate?: number;
  }>;
  // Scrap items
  scrapItems?: Array<{
    itemId: string;
    warehouseId: string;
    qty: number;
  }>;
}

// Stop Work Order request
export interface WorkOrderStop {
  workOrderId: string;
  reason: string;
  stoppedAt: Date;
}

// Capacity planning
export interface WorkOrderCapacity {
  workOrderId: string;
  workOrderNo: string;
  itemName: string;
  operations: Array<{
    operationName: string;
    workstationName: string;
    plannedStart: Date;
    plannedEnd: Date;
    duration: number; // minutes
    status: string;
  }>;
}
