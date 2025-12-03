/**
 * Bill of Materials (BOM) Model
 * Defines product structure with materials, operations, and costs
 * Based on ERPNext's BOM DocType
 */

import { z } from 'zod';

export type BomStatus = 'Draft' | 'Submitted' | 'Cancelled';

// Bill of Materials header
export interface Bom {
  id: string;
  orgId: string;
  bomNo: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  uomId: string;
  uomName?: string;
  isActive: boolean;
  isDefault: boolean;
  status: BomStatus;
  description?: string;
  routingId?: string;
  // Costing
  rmCostAsPerValuationRate: boolean;
  withOperations: boolean;
  currency: string;
  conversionRate: number;
  // Calculated costs
  rawMaterialCost: number;
  operatingCost: number;
  scrapMaterialCost: number;
  totalCost: number;
  // Transfer settings
  transferMaterialAgainstType: 'Work Order' | 'Job Card';
  // Inspection
  qualityInspectionRequired: boolean;
  qualityInspectionTemplate?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  submittedAt?: Date;
  submittedBy?: string;
}

// BOM item - raw material or component
export interface BomItem {
  id: string;
  bomId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  itemSequence: number;
  quantity: number;
  uomId: string;
  uomName?: string;
  conversionFactor: number;
  stockQty: number;
  stockUomId?: string;
  rate: number;
  amount: number;
  // Source
  sourcedByManufacturer: boolean;
  bomId_sub?: string; // For sub-assembly
  sourceBomNo?: string;
  description?: string;
  // Scrap settings
  includeItemInManufacturing: boolean;
  originalItemId?: string; // If this is a substitute
  allowAlternativeItem: boolean;
  // Operation link
  operationId?: string;
  operationName?: string;
}

// BOM operation - manufacturing step
export interface BomOperation {
  id: string;
  bomId: string;
  operationId: string;
  operationName?: string;
  sequence: number;
  workstationId?: string;
  workstationName?: string;
  description?: string;
  // Time settings
  timeInMinutes: number;
  hourRate: number;
  operatingCost: number;
  // Batch settings
  batchSize: number;
  setUpTime: number;
  fixedTime: boolean;
}

// BOM scrap item - by-product or waste
export interface BomScrapItem {
  id: string;
  bomId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  uomId: string;
  stockQty: number;
  rate: number;
  amount: number;
}

// BOM exploded item - flattened multi-level BOM
export interface BomExplodedItem {
  id: string;
  bomId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  sourceBomId?: string;
  sourceBomNo?: string;
  bomLevel: number;
  quantity: number;
  stockQty: number;
  rate: number;
  amount: number;
  description?: string;
}

// BOM with all related data
export interface BomWithDetails extends Bom {
  items: BomItem[];
  operations: BomOperation[];
  scrapItems: BomScrapItem[];
  explodedItems?: BomExplodedItem[];
}

// Zod Schemas
export const createBomItemSchema = z.object({
  itemId: z.string().uuid(),
  itemSequence: z.number().int().nonnegative().default(0),
  quantity: z.number().positive(),
  uomId: z.string().uuid(),
  conversionFactor: z.number().positive().default(1),
  rate: z.number().nonnegative().optional(),
  sourcedByManufacturer: z.boolean().default(false),
  bomId_sub: z.string().uuid().optional(),
  description: z.string().optional(),
  includeItemInManufacturing: z.boolean().default(true),
  originalItemId: z.string().uuid().optional(),
  allowAlternativeItem: z.boolean().default(false),
  operationId: z.string().uuid().optional(),
});

export const createBomOperationSchema = z.object({
  operationId: z.string().uuid(),
  sequence: z.number().int().positive(),
  workstationId: z.string().uuid().optional(),
  description: z.string().optional(),
  timeInMinutes: z.number().nonnegative(),
  hourRate: z.number().nonnegative().optional(),
  batchSize: z.number().positive().default(1),
  setUpTime: z.number().nonnegative().default(0),
  fixedTime: z.boolean().default(false),
});

export const createBomScrapItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  uomId: z.string().uuid(),
  rate: z.number().nonnegative().optional(),
});

export const createBomSchema = z.object({
  orgId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().positive().default(1),
  uomId: z.string().uuid(),
  description: z.string().optional(),
  routingId: z.string().uuid().optional(),
  rmCostAsPerValuationRate: z.boolean().default(true),
  withOperations: z.boolean().default(false),
  currency: z.string().length(3).default('PHP'),
  conversionRate: z.number().positive().default(1),
  transferMaterialAgainstType: z.enum(['Work Order', 'Job Card']).default('Work Order'),
  qualityInspectionRequired: z.boolean().default(false),
  qualityInspectionTemplate: z.string().optional(),
  items: z.array(createBomItemSchema).min(1),
  operations: z.array(createBomOperationSchema).optional().default([]),
  scrapItems: z.array(createBomScrapItemSchema).optional().default([]),
});

export type CreateBom = z.infer<typeof createBomSchema>;
export type CreateBomItem = z.infer<typeof createBomItemSchema>;
export type CreateBomOperation = z.infer<typeof createBomOperationSchema>;
export type CreateBomScrapItem = z.infer<typeof createBomScrapItemSchema>;

export interface UpdateBom extends Partial<Omit<CreateBom, 'orgId'>> {
  id: string;
}

// BOM tree node for multi-level display
export interface BomTreeNode {
  bomId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uomName: string;
  rate: number;
  amount: number;
  level: number;
  children: BomTreeNode[];
}

// Cost breakdown for BOM
export interface BomCostBreakdown {
  bomId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rawMaterialCost: number;
  operatingCost: number;
  scrapRecovery: number;
  totalCost: number;
  costPerUnit: number;
  breakdown: {
    materials: Array<{
      itemCode: string;
      itemName: string;
      qty: number;
      rate: number;
      amount: number;
    }>;
    operations: Array<{
      operationName: string;
      workstationName?: string;
      timeMinutes: number;
      hourRate: number;
      cost: number;
    }>;
    scrap: Array<{
      itemCode: string;
      itemName: string;
      qty: number;
      rate: number;
      recovery: number;
    }>;
  };
}
