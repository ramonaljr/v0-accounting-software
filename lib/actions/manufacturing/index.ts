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

// Default UOM ID for when none is provided (placeholder - should be fetched from DB in production)
const DEFAULT_UOM_ID = '00000000-0000-0000-0000-000000000001';

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
    uomId?: string;
    rate?: number;
    itemSequence?: number;
    conversionFactor?: number;
    sourcedByManufacturer?: boolean;
    includeItemInManufacturing?: boolean;
    allowAlternativeItem?: boolean;
  }>;
  operations?: Array<{
    operationId: string;
    sequence: number;
    timeInMinutes: number;
    batchSize?: number;
    setUpTime?: number;
    fixedTime?: boolean;
    workstationId?: string;
    description?: string;
    hourRate?: number;
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
      uomId: data.uomId || DEFAULT_UOM_ID,
      description: data.description,
      withOperations: data.withOperations ?? false,
      rmCostAsPerValuationRate: true,
      currency: 'PHP',
      conversionRate: 1,
      transferMaterialAgainstType: 'Work Order',
      qualityInspectionRequired: false,
      items: data.items.map((item, idx) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        uomId: item.uomId || DEFAULT_UOM_ID,
        itemSequence: item.itemSequence ?? idx + 1,
        conversionFactor: item.conversionFactor ?? 1,
        rate: item.rate,
        sourcedByManufacturer: item.sourcedByManufacturer ?? false,
        includeItemInManufacturing: item.includeItemInManufacturing ?? true,
        allowAlternativeItem: item.allowAlternativeItem ?? false,
      })),
      operations: (data.operations || []).map(op => ({
        operationId: op.operationId,
        sequence: op.sequence,
        timeInMinutes: op.timeInMinutes,
        batchSize: op.batchSize ?? 1,
        setUpTime: op.setUpTime ?? 0,
        fixedTime: op.fixedTime ?? false,
        workstationId: op.workstationId,
        description: op.description,
        hourRate: op.hourRate,
      })),
      scrapItems: [],
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
  quantity: number;
  plannedStartDate?: string;
  expectedDeliveryDate?: string;
  targetWarehouseId?: string;
  wipWarehouseId?: string;
  sourceWarehouseId?: string;
  scrapWarehouseId?: string;
  salesOrderId?: string;
  productionPlanId?: string;
  skipTransfer?: boolean;
  useMultiLevelBom?: boolean;
  allowAlternativeItem?: boolean;
  projectId?: string;
  costCenterId?: string;
  description?: string;
  remarks?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const workOrder = await WorkOrderService.create({
      orgId,
      bomId: data.bomId,
      quantity: data.quantity,
      plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : undefined,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      targetWarehouseId: data.targetWarehouseId,
      wipWarehouseId: data.wipWarehouseId,
      sourceWarehouseId: data.sourceWarehouseId,
      scrapWarehouseId: data.scrapWarehouseId,
      salesOrderId: data.salesOrderId,
      productionPlanId: data.productionPlanId,
      skipTransfer: data.skipTransfer ?? false,
      useMultiLevelBom: data.useMultiLevelBom ?? true,
      allowAlternativeItem: data.allowAlternativeItem ?? false,
      projectId: data.projectId,
      costCenterId: data.costCenterId,
      description: data.description,
      remarks: data.remarks,
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
 * Submit work order (start production)
 */
export async function startWorkOrder(id: string): Promise<ActionResult> {
  try {
    const workOrder = await WorkOrderService.submit(id);

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
 * Complete work order production
 */
export async function completeWorkOrder(id: string, quantity?: number): Promise<ActionResult> {
  try {
    const workOrder = await WorkOrderService.getById(id);
    const remainingQty = workOrder.quantity - workOrder.producedQty;

    await WorkOrderService.completeProduction({
      workOrderId: id,
      quantity: quantity || remainingQty,
      postingDate: new Date(),
    });

    revalidatePath('/manufacturing/work-orders');
    revalidatePath(`/manufacturing/work-orders/${id}`);
    revalidatePath('/inventory/items');

    return { success: true, data: await WorkOrderService.getById(id) };
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
    const jobCard = await JobCardService.start({
      jobCardId: id,
      employeeId,
      startTime: new Date(),
    });

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
  processLossQty?: number
): Promise<ActionResult> {
  try {
    const jobCard = await JobCardService.complete({
      jobCardId: id,
      completedQty,
      endTime: new Date(),
      processLossQty,
    });

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
  postingDate: string;
  planningDate?: string;
  getItemsFrom?: 'Sales Order' | 'Material Request' | 'Manual';
  forWarehouseId?: string;
  items: Array<{
    itemId: string;
    bomId: string;
    plannedQty: number;
    plannedStartDate: string;
    makeOrBuy?: 'Make' | 'Buy';
    warehouseId?: string;
    salesOrderId?: string;
    salesOrderItemId?: string;
    materialRequestId?: string;
    materialRequestItemId?: string;
  }>;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const plan = await ProductionPlanService.create({
      orgId,
      postingDate: new Date(data.postingDate),
      planningDate: data.planningDate ? new Date(data.planningDate) : new Date(data.postingDate),
      getItemsFrom: data.getItemsFrom ?? 'Manual',
      includeNonStockItems: false,
      includeSubcontractedItems: false,
      ignoreProcurementLeadTime: false,
      ignoreExistingOrderedQty: false,
      ignoreExistingProjectedQty: false,
      includeSafetyStock: true,
      forWarehouseId: data.forWarehouseId,
      items: data.items.map(item => ({
        itemId: item.itemId,
        bomId: item.bomId,
        plannedQty: item.plannedQty,
        plannedStartDate: new Date(item.plannedStartDate),
        makeOrBuy: item.makeOrBuy ?? 'Make',
        warehouseId: item.warehouseId,
        salesOrderId: item.salesOrderId,
        salesOrderItemId: item.salesOrderItemId,
        materialRequestId: item.materialRequestId,
        materialRequestItemId: item.materialRequestItemId,
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
export async function generateWorkOrdersFromPlan(data: {
  productionPlanId: string;
  items: Array<{
    productionPlanItemId: string;
    quantity?: number;
    wipWarehouseId?: string;
    targetWarehouseId?: string;
  }>;
}): Promise<ActionResult> {
  try {
    const workOrders = await ProductionPlanService.createWorkOrders({
      productionPlanId: data.productionPlanId,
      items: data.items,
    });

    revalidatePath('/manufacturing/production-plans');
    revalidatePath(`/manufacturing/production-plans/${data.productionPlanId}`);
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
