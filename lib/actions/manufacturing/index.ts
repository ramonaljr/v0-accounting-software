'use server';

/**
 * Manufacturing Server Actions
 * Server-side actions for BOM, Work Orders, and Production
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { BomService, WorkOrderService, JobCardService, ProductionPlanService } from '@/lib/services/manufacturing';

// =============================================
// HELPER: Get current org
// =============================================

async function getCurrentOrg(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return membership?.org_id ?? null;
}

// =============================================
// ACTION RESULT TYPE
// =============================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// BOM ACTIONS
// =============================================

/**
 * List BOMs
 */
export async function listBoms(options?: {
  itemId?: string;
  isActive?: boolean;
  status?: string;
  search?: string;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const boms = await BomService.list({
      orgId,
      itemId: options?.itemId,
      isActive: options?.isActive,
      status: options?.status,
      search: options?.search,
      limit: options?.limit,
    });

    return { success: true, data: boms };
  } catch (error) {
    console.error('[listBoms] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list BOMs',
    };
  }
}

/**
 * Get BOM by ID
 */
export async function getBom(id: string): Promise<ActionResult> {
  try {
    const bom = await BomService.getById(id);
    return { success: true, data: bom };
  } catch (error) {
    console.error('[getBom] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get BOM',
    };
  }
}

/**
 * Create BOM
 */
export async function createBom(data: {
  itemId: string;
  quantity?: number;
  description?: string;
  uomId?: string;
  withOperations?: boolean;
  items: Array<{
    itemId: string;
    quantity: number;
    rate?: number;
    uomId?: string;
  }>;
  operations?: Array<{
    operationId: string;
    workstationId?: string;
    timeInMinutes: number;
    description?: string;
    sequence: number;
  }>;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const bom = await BomService.create({
      orgId,
      itemId: data.itemId,
      quantity: data.quantity || 1,
      uomId: data.uomId,
      description: data.description,
      withOperations: data.withOperations,
      items: data.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        rate: item.rate,
        uomId: item.uomId,
      })),
      operations: data.operations,
    });

    revalidatePath('/manufacturing/bom');

    return { success: true, data: bom };
  } catch (error) {
    console.error('[createBom] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create BOM',
    };
  }
}

/**
 * Calculate BOM cost
 */
export async function calculateBomCost(bomId: string, qty?: number): Promise<ActionResult> {
  try {
    const cost = await BomService.calculateCosts(bomId);
    return { success: true, data: cost };
  } catch (error) {
    console.error('[calculateBomCost] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate BOM cost',
    };
  }
}

/**
 * Get BOM by ID with full details
 */
export async function getBomById(id: string): Promise<ActionResult> {
  try {
    const bom = await BomService.getById(id);
    return { success: true, data: bom };
  } catch (error) {
    console.error('[getBomById] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get BOM',
    };
  }
}

/**
 * Submit BOM (make it active)
 */
export async function submitBom(id: string): Promise<ActionResult> {
  try {
    const bom = await BomService.submit(id);
    revalidatePath('/manufacturing/bom');
    return { success: true, data: bom };
  } catch (error) {
    console.error('[submitBom] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit BOM',
    };
  }
}

/**
 * Set BOM as default for item
 */
export async function setDefaultBom(id: string): Promise<ActionResult> {
  try {
    await BomService.setAsDefault(id);
    revalidatePath('/manufacturing/bom');
    return { success: true };
  } catch (error) {
    console.error('[setDefaultBom] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default BOM',
    };
  }
}

/**
 * Cancel BOM
 */
export async function cancelBom(id: string): Promise<ActionResult> {
  try {
    await BomService.cancel(id);
    revalidatePath('/manufacturing/bom');
    return { success: true };
  } catch (error) {
    console.error('[cancelBom] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel BOM',
    };
  }
}

// =============================================
// WORK ORDER ACTIONS
// =============================================

/**
 * List work orders
 */
export async function listWorkOrders(options?: {
  status?: string;
  itemId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const workOrders = await WorkOrderService.list({
      orgId,
      status: options?.status as any,
      itemId: options?.itemId,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
      limit: options?.limit,
    });

    return { success: true, data: workOrders };
  } catch (error) {
    console.error('[listWorkOrders] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list work orders',
    };
  }
}

/**
 * Get work order by ID
 */
export async function getWorkOrder(id: string): Promise<ActionResult> {
  try {
    const workOrder = await WorkOrderService.getById(id);
    return { success: true, data: workOrder };
  } catch (error) {
    console.error('[getWorkOrder] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get work order',
    };
  }
}

/**
 * Create work order
 */
export async function createWorkOrder(data: {
  bomId: string;
  qty: number;
  plannedStartDate: string;
  targetWarehouseId: string;
  wipWarehouseId?: string;
  sourceWarehouseId?: string;
  salesOrderId?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const workOrder = await WorkOrderService.create({
      orgId,
      bomId: data.bomId,
      qty: data.qty,
      plannedStartDate: new Date(data.plannedStartDate),
      targetWarehouseId: data.targetWarehouseId,
      wipWarehouseId: data.wipWarehouseId,
      sourceWarehouseId: data.sourceWarehouseId,
      salesOrderId: data.salesOrderId,
    });

    revalidatePath('/manufacturing/work-orders');

    return { success: true, data: workOrder };
  } catch (error) {
    console.error('[createWorkOrder] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create work order',
    };
  }
}

/**
 * Start work order
 */
export async function startWorkOrder(id: string): Promise<ActionResult> {
  try {
    const workOrder = await WorkOrderService.start(id);

    revalidatePath('/manufacturing/work-orders');
    revalidatePath(`/manufacturing/work-orders/${id}`);

    return { success: true, data: workOrder };
  } catch (error) {
    console.error('[startWorkOrder] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start work order',
    };
  }
}

/**
 * Complete work order
 */
export async function completeWorkOrder(id: string): Promise<ActionResult> {
  try {
    const workOrder = await WorkOrderService.complete(id);

    revalidatePath('/manufacturing/work-orders');
    revalidatePath(`/manufacturing/work-orders/${id}`);
    revalidatePath('/inventory/items');

    return { success: true, data: workOrder };
  } catch (error) {
    console.error('[completeWorkOrder] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete work order',
    };
  }
}

/**
 * Cancel work order
 */
export async function cancelWorkOrder(id: string): Promise<ActionResult> {
  try {
    const workOrder = await WorkOrderService.cancel(id);

    revalidatePath('/manufacturing/work-orders');
    revalidatePath(`/manufacturing/work-orders/${id}`);

    return { success: true, data: workOrder };
  } catch (error) {
    console.error('[cancelWorkOrder] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel work order',
    };
  }
}

// =============================================
// JOB CARD ACTIONS
// =============================================

/**
 * List job cards
 */
export async function listJobCards(options?: {
  workOrderId?: string;
  status?: string;
  workstationId?: string;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const jobCards = await JobCardService.list({
      orgId,
      workOrderId: options?.workOrderId,
      status: options?.status as any,
      workstationId: options?.workstationId,
      limit: options?.limit,
    });

    return { success: true, data: jobCards };
  } catch (error) {
    console.error('[listJobCards] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list job cards',
    };
  }
}

/**
 * Start job card
 */
export async function startJobCard(id: string, employeeId?: string): Promise<ActionResult> {
  try {
    const jobCard = await JobCardService.start(id, employeeId);

    revalidatePath('/manufacturing/job-cards');
    revalidatePath(`/manufacturing/job-cards/${id}`);

    return { success: true, data: jobCard };
  } catch (error) {
    console.error('[startJobCard] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start job card',
    };
  }
}

/**
 * Complete job card
 */
export async function completeJobCard(
  id: string,
  completedQty: number,
  rejectedQty?: number
): Promise<ActionResult> {
  try {
    const jobCard = await JobCardService.complete(id, completedQty, rejectedQty);

    revalidatePath('/manufacturing/job-cards');
    revalidatePath(`/manufacturing/job-cards/${id}`);

    return { success: true, data: jobCard };
  } catch (error) {
    console.error('[completeJobCard] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete job card',
    };
  }
}

// =============================================
// PRODUCTION PLAN ACTIONS
// =============================================

/**
 * List production plans
 */
export async function listProductionPlans(options?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const plans = await ProductionPlanService.list({
      orgId,
      status: options?.status as any,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
      limit: options?.limit,
    });

    return { success: true, data: plans };
  } catch (error) {
    console.error('[listProductionPlans] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list production plans',
    };
  }
}

/**
 * Create production plan
 */
export async function createProductionPlan(data: {
  planName: string;
  postingDate: string;
  fromDate: string;
  toDate: string;
  items: Array<{
    itemId: string;
    bomId: string;
    plannedQty: number;
    warehouseId: string;
    plannedStartDate: string;
  }>;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const plan = await ProductionPlanService.create({
      orgId,
      planName: data.planName,
      postingDate: new Date(data.postingDate),
      fromDate: new Date(data.fromDate),
      toDate: new Date(data.toDate),
      items: data.items.map(item => ({
        ...item,
        plannedStartDate: new Date(item.plannedStartDate),
      })),
    });

    revalidatePath('/manufacturing/production-plans');

    return { success: true, data: plan };
  } catch (error) {
    console.error('[createProductionPlan] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create production plan',
    };
  }
}

/**
 * Generate work orders from production plan
 */
export async function generateWorkOrdersFromPlan(planId: string): Promise<ActionResult> {
  try {
    const workOrders = await ProductionPlanService.generateWorkOrders(planId);

    revalidatePath('/manufacturing/production-plans');
    revalidatePath(`/manufacturing/production-plans/${planId}`);
    revalidatePath('/manufacturing/work-orders');

    return { success: true, data: workOrders };
  } catch (error) {
    console.error('[generateWorkOrdersFromPlan] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate work orders',
    };
  }
}
