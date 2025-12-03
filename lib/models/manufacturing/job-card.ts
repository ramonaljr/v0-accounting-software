/**
 * Job Card Model
 * Operation-level tracking for manufacturing
 * Based on ERPNext's Job Card DocType
 */

import { z } from 'zod';

export type JobCardStatus =
  | 'Open'
  | 'Work in Progress'
  | 'Material Transferred'
  | 'On Hold'
  | 'Completed'
  | 'Cancelled';

// Job Card header
export interface JobCard {
  id: string;
  orgId: string;
  jobCardNo: string;
  status: JobCardStatus;
  // Work Order reference
  workOrderId: string;
  workOrderNo?: string;
  bomId?: string;
  // Operation details
  operationId: string;
  operationName?: string;
  sequence: number;
  // Item being produced
  itemId: string;
  itemCode?: string;
  itemName?: string;
  // Workstation
  workstationId?: string;
  workstationName?: string;
  // Quantities
  forQuantity: number; // Qty to produce in this job card
  completedQty: number;
  processLossQty: number;
  totalCompletedQty: number; // Including from other job cards
  // Time
  timeInMinutes: number; // Expected time
  totalTimeInMinutes: number; // Actual total time
  // Timing
  expectedStartDate?: Date;
  expectedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  // Employee
  employeeId?: string;
  employeeName?: string;
  // Costing
  hourRate: number;
  // Batch settings
  batchSize: number;
  // Settings
  isSubcontracted: boolean;
  isCorrective: boolean;
  // Warehouse (for Job Card based material transfer)
  wipWarehouseId?: string;
  // Quality
  qualityInspectionRequired: boolean;
  qualityInspectionTemplate?: string;
  // Project/Cost center
  projectId?: string;
  costCenterId?: string;
  // Remarks
  remarks?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  submittedAt?: Date;
  submittedBy?: string;
}

// Job Card time log
export interface JobCardTimeLog {
  id: string;
  jobCardId: string;
  // Time
  fromTime: Date;
  toTime?: Date;
  timeInMinutes: number;
  // Status during this period
  completedQty: number;
  // Employee
  employeeId?: string;
  employeeName?: string;
  // Costing
  operatingCost: number;
  // Remarks
  remarks?: string;
  // Auto-calculated
  isCompleted: boolean;
}

// Job Card item - material required for this operation
export interface JobCardItem {
  id: string;
  jobCardId: string;
  workOrderItemId?: string;
  // Item
  itemId: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  // Quantities
  requiredQty: number;
  transferredQty: number;
  // UOM
  uomId: string;
  uomName?: string;
  // Source
  sourceWarehouseId?: string;
  allowAlternativeItem: boolean;
}

// Job Card scrap item
export interface JobCardScrapItem {
  id: string;
  jobCardId: string;
  // Item
  itemId: string;
  itemCode?: string;
  itemName?: string;
  description?: string;
  // Quantity
  stockQty: number;
  // UOM
  uomId: string;
  stockUomId?: string;
}

// Job Card with all related data
export interface JobCardWithDetails extends JobCard {
  timeLogs: JobCardTimeLog[];
  items: JobCardItem[];
  scrapItems: JobCardScrapItem[];
}

// Zod Schemas
export const createJobCardSchema = z.object({
  orgId: z.string().uuid(),
  workOrderId: z.string().uuid(),
  operationId: z.string().uuid(),
  workstationId: z.string().uuid().optional(),
  forQuantity: z.number().positive(),
  expectedStartDate: z.coerce.date().optional(),
  expectedEndDate: z.coerce.date().optional(),
  employeeId: z.string().uuid().optional(),
  isSubcontracted: z.boolean().default(false),
  isCorrective: z.boolean().default(false),
  wipWarehouseId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  remarks: z.string().optional(),
});

export const createTimeLogSchema = z.object({
  jobCardId: z.string().uuid(),
  fromTime: z.coerce.date(),
  toTime: z.coerce.date().optional(),
  completedQty: z.number().nonnegative().default(0),
  employeeId: z.string().uuid().optional(),
  remarks: z.string().optional(),
});

export type CreateJobCard = z.infer<typeof createJobCardSchema>;
export type CreateTimeLog = z.infer<typeof createTimeLogSchema>;

export interface UpdateJobCard extends Partial<CreateJobCard> {
  id: string;
  status?: JobCardStatus;
}

// Start job card
export interface JobCardStart {
  jobCardId: string;
  employeeId?: string;
  startTime: Date;
}

// Complete job card
export interface JobCardComplete {
  jobCardId: string;
  completedQty: number;
  endTime: Date;
  processLossQty?: number;
  scrapItems?: Array<{
    itemId: string;
    qty: number;
  }>;
}

// Material transfer for Job Card
export interface JobCardMaterialTransfer {
  jobCardId: string;
  items: Array<{
    itemId: string;
    sourceWarehouseId: string;
    qty: number;
  }>;
  postingDate: Date;
  postingTime?: string;
}

// Job Card summary for list views
export interface JobCardSummary {
  id: string;
  jobCardNo: string;
  status: JobCardStatus;
  workOrderNo: string;
  operationName: string;
  workstationName?: string;
  itemCode: string;
  forQuantity: number;
  completedQty: number;
  expectedStartDate?: Date;
  expectedEndDate?: Date;
}

// Workstation timeline entry
export interface WorkstationTimelineEntry {
  jobCardId: string;
  jobCardNo: string;
  workOrderNo: string;
  operationName: string;
  itemName: string;
  quantity: number;
  startTime: Date;
  endTime: Date;
  status: JobCardStatus;
  employeeName?: string;
}

// Employee workload
export interface EmployeeWorkload {
  employeeId: string;
  employeeName: string;
  jobCards: Array<{
    jobCardNo: string;
    operationName: string;
    itemName: string;
    forQuantity: number;
    expectedStart?: Date;
    expectedEnd?: Date;
    status: JobCardStatus;
  }>;
  totalTimeMinutes: number;
  completedTimeMinutes: number;
}
