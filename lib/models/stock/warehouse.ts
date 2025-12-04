/**
 * Warehouse Model
 * Based on ERPNext's Warehouse DocType
 */

import { z } from 'zod';

// Warehouse schema
export const WarehouseSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Naming
  warehouseCode: z.string().max(50),
  warehouseName: z.string().min(1).max(255),

  // Hierarchy
  parentId: z.string().uuid().optional(),
  isGroup: z.boolean().default(false),
  lft: z.number().int().default(0),
  rgt: z.number().int().default(0),

  // Location
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default('Philippines'),

  // Contact
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),

  // Linked GL account for perpetual inventory
  accountId: z.string().uuid().optional(),

  // Flags
  isActive: z.boolean().default(true),
  isRejectedWarehouse: z.boolean().default(false),
  defaultInTransitWarehouseId: z.string().uuid().optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

export type Warehouse = z.infer<typeof WarehouseSchema>;

// Warehouse with children for tree display
export interface WarehouseWithChildren extends Warehouse {
  children: WarehouseWithChildren[];
  level: number;
}

// Create Warehouse input schema
export const CreateWarehouseSchema = z.object({
  orgId: z.string().uuid(),
  warehouseName: z.string().min(1).max(255),
  warehouseCode: z.string().max(50).optional(),

  parentId: z.string().uuid().optional(),
  isGroup: z.boolean().default(false),

  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default('Philippines'),

  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),

  accountId: z.string().uuid().optional(),
  isRejectedWarehouse: z.boolean().default(false),
});

export type CreateWarehouse = z.infer<typeof CreateWarehouseSchema>;

// Update Warehouse schema
export const UpdateWarehouseSchema = CreateWarehouseSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export type UpdateWarehouse = z.infer<typeof UpdateWarehouseSchema>;

// Warehouse list filters
export interface WarehouseListFilters {
  orgId: string;
  isActive?: boolean;
  isGroup?: boolean;
  parentId?: string | null;
  search?: string;
}

// NOTE: WarehouseStockSummary is exported from './bin' to avoid duplication
