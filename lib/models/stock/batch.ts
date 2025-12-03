/**
 * Batch Model
 * Based on ERPNext's Batch DocType
 *
 * Batch tracking for items that require lot/batch management.
 */

import { z } from 'zod';

// Batch schema
export const BatchSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  batchId: z.string().max(100),  // User-visible batch number
  itemId: z.string().uuid(),

  // Expiry
  manufacturingDate: z.date().optional(),
  expiryDate: z.date().optional(),

  // Supplier info
  supplierId: z.string().uuid().optional(),

  // Status
  isActive: z.boolean().default(true),

  createdAt: z.date(),
});

export type Batch = z.infer<typeof BatchSchema>;

// Create Batch input
export const CreateBatchSchema = z.object({
  orgId: z.string().uuid(),
  batchId: z.string().max(100).optional(),  // Auto-generated if not provided
  itemId: z.string().uuid(),
  manufacturingDate: z.date().optional(),
  expiryDate: z.date().optional(),
  supplierId: z.string().uuid().optional(),
});

export type CreateBatch = z.infer<typeof CreateBatchSchema>;

// Batch with stock info
export interface BatchWithStock extends Batch {
  itemCode: string;
  itemName: string;
  totalQty: number;
  warehouseBreakdown: Array<{
    warehouseId: string;
    warehouseName: string;
    qty: number;
  }>;
}

// Expiring batch alert
export interface ExpiringBatch {
  batchId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  expiryDate: Date;
  daysToExpiry: number;
  qty: number;
  warehouseId: string;
  warehouseName: string;
}

// Serial Number status
export const SerialStatus = z.enum([
  'Active',
  'Inactive',
  'Delivered',
  'Expired',
  'Warranty',
  'Returned',
]);
export type SerialStatus = z.infer<typeof SerialStatus>;

// Serial Number schema
export const SerialNumberSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  serialNo: z.string().max(100),
  itemId: z.string().uuid(),

  // Current location
  warehouseId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),

  // Status
  status: SerialStatus.default('Active'),

  // Purchase info
  purchaseDate: z.date().optional(),
  purchaseRate: z.number().min(0).optional(),
  supplierId: z.string().uuid().optional(),

  // Sale info
  deliveryDate: z.date().optional(),
  customerId: z.string().uuid().optional(),

  // Warranty
  warrantyExpiryDate: z.date().optional(),
  warrantyPeriod: z.number().int().optional(),  // Days

  // Maintenance
  maintenanceStatus: z.string().max(50).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SerialNumber = z.infer<typeof SerialNumberSchema>;

// Create Serial Number input
export const CreateSerialNumberSchema = z.object({
  orgId: z.string().uuid(),
  serialNo: z.string().max(100),
  itemId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  purchaseDate: z.date().optional(),
  purchaseRate: z.number().min(0).optional(),
  supplierId: z.string().uuid().optional(),
  warrantyPeriod: z.number().int().optional(),
});

export type CreateSerialNumber = z.infer<typeof CreateSerialNumberSchema>;

/**
 * Generate batch ID with prefix
 */
export function generateBatchId(prefix: string = 'BATCH'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Check if batch is expired
 */
export function isBatchExpired(batch: { expiryDate?: Date }): boolean {
  if (!batch.expiryDate) return false;
  return new Date() > batch.expiryDate;
}

/**
 * Calculate days to expiry
 */
export function getDaysToExpiry(expiryDate: Date): number {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
