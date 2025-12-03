/**
 * Operation Model
 * Manufacturing operation/step master data
 * Based on ERPNext's Operation DocType
 */

import { z } from 'zod';

// Operation master - defines a manufacturing step
export interface Operation {
  id: string;
  orgId: string;
  operationName: string;
  description?: string;
  workstationTypeId?: string;
  defaultWorkstationId?: string;
  batchSize: number;
  qualityInspectionTemplate?: string;
  subOperations: SubOperation[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface SubOperation {
  operationId: string;
  operationName: string;
  sequence: number;
  timeInMinutes: number;
}

// Workstation type - grouping of similar workstations
export interface WorkstationType {
  id: string;
  orgId: string;
  typeName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

// Workstation - physical production resource
export interface Workstation {
  id: string;
  orgId: string;
  workstationCode: string;
  workstationName: string;
  workstationTypeId?: string;
  description?: string;
  productionCapacity: number;
  hourRate: number;
  hourRateElectricity: number;
  hourRateConsumable: number;
  hourRateRent: number;
  hourRateLabor: number;
  workingHours: WorkstationWorkingHour[];
  holidayListId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkstationWorkingHour {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  enabled: boolean;
}

// Routing - reusable sequence of operations
export interface Routing {
  id: string;
  orgId: string;
  routingName: string;
  description?: string;
  operations: RoutingOperation[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface RoutingOperation {
  id: string;
  routingId: string;
  operationId: string;
  operationName?: string;
  sequence: number;
  workstationId?: string;
  workstationName?: string;
  timeInMinutes: number;
  hourRate: number;
  batchSize: number;
  setUpTime: number;
  description?: string;
  fixedTime: boolean;
}

// Zod Schemas
export const createOperationSchema = z.object({
  orgId: z.string().uuid(),
  operationName: z.string().min(1).max(200),
  description: z.string().optional(),
  workstationTypeId: z.string().uuid().optional(),
  defaultWorkstationId: z.string().uuid().optional(),
  batchSize: z.number().positive().default(1),
  qualityInspectionTemplate: z.string().optional(),
  subOperations: z.array(z.object({
    operationId: z.string().uuid(),
    sequence: z.number().int().positive(),
    timeInMinutes: z.number().nonnegative(),
  })).optional().default([]),
});

export const createWorkstationSchema = z.object({
  orgId: z.string().uuid(),
  workstationCode: z.string().min(1).max(50).optional(),
  workstationName: z.string().min(1).max(200),
  workstationTypeId: z.string().uuid().optional(),
  description: z.string().optional(),
  productionCapacity: z.number().nonnegative().default(1),
  hourRate: z.number().nonnegative().default(0),
  hourRateElectricity: z.number().nonnegative().default(0),
  hourRateConsumable: z.number().nonnegative().default(0),
  hourRateRent: z.number().nonnegative().default(0),
  hourRateLabor: z.number().nonnegative().default(0),
  workingHours: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    enabled: z.boolean(),
  })).optional().default([]),
  holidayListId: z.string().uuid().optional(),
});

export const createRoutingSchema = z.object({
  orgId: z.string().uuid(),
  routingName: z.string().min(1).max(200),
  description: z.string().optional(),
  operations: z.array(z.object({
    operationId: z.string().uuid(),
    sequence: z.number().int().positive(),
    workstationId: z.string().uuid().optional(),
    timeInMinutes: z.number().nonnegative(),
    hourRate: z.number().nonnegative().optional(),
    batchSize: z.number().positive().default(1),
    setUpTime: z.number().nonnegative().default(0),
    description: z.string().optional(),
    fixedTime: z.boolean().default(false),
  })).min(1),
});

export type CreateOperation = z.infer<typeof createOperationSchema>;
export type CreateWorkstation = z.infer<typeof createWorkstationSchema>;
export type CreateRouting = z.infer<typeof createRoutingSchema>;

export interface UpdateOperation extends Partial<CreateOperation> {
  id: string;
  isActive?: boolean;
}

export interface UpdateWorkstation extends Partial<CreateWorkstation> {
  id: string;
  isActive?: boolean;
}

export interface UpdateRouting extends Partial<CreateRouting> {
  id: string;
  isActive?: boolean;
}
