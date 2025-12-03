/**
 * Cost Center Model
 * Based on ERPNext's Cost Center DocType
 */

import { z } from 'zod';

// Cost Center schema
export const CostCenterSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  costCenterCode: z.string().max(20).optional(),
  costCenterName: z.string().min(1).max(255),

  // Hierarchy (nested set model)
  parentId: z.string().uuid().nullable(),
  lft: z.number().int().default(0),
  rgt: z.number().int().default(0),
  isGroup: z.boolean().default(false),

  isDisabled: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CostCenter = z.infer<typeof CostCenterSchema>;

// Create schema
export const CreateCostCenterSchema = CostCenterSchema.omit({
  id: true,
  lft: true,
  rgt: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCostCenter = z.infer<typeof CreateCostCenterSchema>;

// Cost Center with children for tree view
export interface CostCenterWithChildren extends CostCenter {
  children?: CostCenterWithChildren[];
  level?: number;
  path?: string;
}
