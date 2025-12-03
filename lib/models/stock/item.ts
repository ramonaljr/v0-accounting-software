/**
 * Item Model
 * Based on ERPNext's Item DocType
 */

import { z } from 'zod';

// Valuation methods
export const ValuationMethod = z.enum(['FIFO', 'Moving Average', 'LIFO']);
export type ValuationMethod = z.infer<typeof ValuationMethod>;

// Item schema
export const ItemSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Basic Info
  itemCode: z.string().max(100),
  itemName: z.string().min(1).max(255),
  description: z.string().optional(),

  // Classification
  itemGroupId: z.string().uuid().optional(),
  brand: z.string().max(100).optional(),

  // Stock settings
  isStockItem: z.boolean().default(true),
  stockUomId: z.string().uuid().optional(),
  valuation_method: ValuationMethod.default('Moving Average'),

  // Tracking
  hasSerialNo: z.boolean().default(false),
  hasBatchNo: z.boolean().default(false),
  hasExpiryDate: z.boolean().default(false),
  shelfLifeDays: z.number().int().optional(),

  // Purchase/Sales flags
  isPurchaseItem: z.boolean().default(true),
  isSalesItem: z.boolean().default(true),

  // Pricing
  standardRate: z.number().min(0).default(0),
  valuationRate: z.number().min(0).default(0),
  lastPurchaseRate: z.number().min(0).default(0),

  // Defaults
  defaultWarehouseId: z.string().uuid().optional(),

  // Accounts
  expenseAccountId: z.string().uuid().optional(),
  incomeAccountId: z.string().uuid().optional(),

  // Reorder
  reorderLevel: z.number().min(0).default(0),
  reorderQty: z.number().min(0).default(0),
  safetyStock: z.number().min(0).default(0),

  // Dimensions
  weightPerUnit: z.number().optional(),
  weightUom: z.string().max(50).optional(),

  // Variant management
  hasVariants: z.boolean().default(false),
  variantOf: z.string().uuid().optional(),

  // Status
  isActive: z.boolean().default(true),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

export type Item = z.infer<typeof ItemSchema>;

// Create Item input schema
export const CreateItemSchema = z.object({
  orgId: z.string().uuid(),
  itemCode: z.string().max(100).optional(),
  itemName: z.string().min(1).max(255),
  description: z.string().optional(),

  itemGroupId: z.string().uuid().optional(),
  brand: z.string().max(100).optional(),

  isStockItem: z.boolean().default(true),
  stockUomId: z.string().uuid().optional(),
  valuationMethod: ValuationMethod.default('Moving Average'),

  hasSerialNo: z.boolean().default(false),
  hasBatchNo: z.boolean().default(false),
  hasExpiryDate: z.boolean().default(false),
  shelfLifeDays: z.number().int().optional(),

  isPurchaseItem: z.boolean().default(true),
  isSalesItem: z.boolean().default(true),

  standardRate: z.number().min(0).default(0),

  defaultWarehouseId: z.string().uuid().optional(),
  expenseAccountId: z.string().uuid().optional(),
  incomeAccountId: z.string().uuid().optional(),

  reorderLevel: z.number().min(0).default(0),
  reorderQty: z.number().min(0).default(0),
  safetyStock: z.number().min(0).default(0),

  weightPerUnit: z.number().optional(),
  weightUom: z.string().max(50).optional(),
});

export type CreateItem = z.infer<typeof CreateItemSchema>;

// Update Item schema
export const UpdateItemSchema = CreateItemSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export type UpdateItem = z.infer<typeof UpdateItemSchema>;

// Item list filters
export interface ItemListFilters {
  orgId: string;
  isActive?: boolean;
  isStockItem?: boolean;
  itemGroupId?: string;
  isPurchaseItem?: boolean;
  isSalesItem?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// Item with stock info
export interface ItemWithStock extends Item {
  totalQty: number;
  totalValue: number;
  availableQty: number;
}

// Item Group schema
export const ItemGroupSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  groupCode: z.string().max(50),
  groupName: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
  isGroup: z.boolean().default(false),
  lft: z.number().int().default(0),
  rgt: z.number().int().default(0),
  defaultExpenseAccountId: z.string().uuid().optional(),
  defaultIncomeAccountId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ItemGroup = z.infer<typeof ItemGroupSchema>;

// UOM schema
export const UomSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  uomName: z.string().max(50),
  mustBeWholeNumber: z.boolean().default(false),
  createdAt: z.date(),
});

export type Uom = z.infer<typeof UomSchema>;

// Item UOM Conversion schema
export const ItemUomConversionSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  uomId: z.string().uuid(),
  conversionFactor: z.number().positive().default(1),
  createdAt: z.date(),
});

export type ItemUomConversion = z.infer<typeof ItemUomConversionSchema>;
