/**
 * Work Order Service
 * Manages production orders with material consumption and completion
 * Based on ERPNext's work_order.py
 */

import { createClient } from '@/lib/supabase/server';
import type {
  WorkOrder,
  WorkOrderWithDetails,
  WorkOrderItem,
  WorkOrderOperation,
  CreateWorkOrder,
  UpdateWorkOrder,
  WorkOrderSummary,
  WorkOrderMaterialTransfer,
  WorkOrderCompletion,
  WorkOrderStop,
  WorkOrderStatus,
} from '@/lib/models/manufacturing/work-order';
import { BomService, ManufacturingError } from './bom.service';
import { StockEntryService } from '@/lib/services/stock/stock-entry.service';

export class WorkOrderService {
  /**
   * Create a new Work Order from BOM
   */
  static async create(input: CreateWorkOrder): Promise<WorkOrderWithDetails> {
    const supabase = await createClient();

    // Get BOM details
    const bom = await BomService.getById(input.bomId);

    if (bom.status !== 'Submitted') {
      throw new ManufacturingError('Can only create work orders from submitted BOMs');
    }

    // Generate work order number
    const { data: lastWo } = await supabase
      .from('work_orders')
      .select('work_order_no')
      .eq('org_id', input.orgId)
      .like('work_order_no', 'WO-%')
      .order('work_order_no', { ascending: false })
      .limit(1);

    const lastNum = lastWo?.[0]?.work_order_no
      ? parseInt(lastWo[0].work_order_no.replace('WO-', '')) || 0
      : 0;
    const workOrderNo = `WO-${String(lastNum + 1).padStart(5, '0')}`;

    // Calculate lead time from operations
    let leadTimeDays = 0;
    if (bom.operations.length > 0) {
      const totalMinutes = bom.operations.reduce(
        (sum, op) => sum + (op.timeInMinutes * (input.quantity / (op.batchSize || 1))),
        0
      );
      leadTimeDays = Math.ceil(totalMinutes / (8 * 60)); // 8-hour workday
    }

    // Calculate planned end date
    let plannedEndDate = input.plannedStartDate
      ? new Date(input.plannedStartDate)
      : undefined;
    if (plannedEndDate && leadTimeDays > 0) {
      plannedEndDate.setDate(plannedEndDate.getDate() + leadTimeDays);
    }

    // Insert work order
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .insert({
        org_id: input.orgId,
        work_order_no: workOrderNo,
        status: 'Draft',
        item_id: bom.itemId,
        bom_id: bom.id,
        quantity: input.quantity,
        uom_id: bom.uomId,
        produced_qty: 0,
        process_loss_qty: 0,
        planned_start_date: input.plannedStartDate?.toISOString(),
        planned_end_date: plannedEndDate?.toISOString(),
        expected_delivery_date: input.expectedDeliveryDate?.toISOString(),
        lead_time_days: leadTimeDays,
        production_plan_id: input.productionPlanId,
        sales_order_id: input.salesOrderId,
        source_warehouse_id: input.sourceWarehouseId,
        wip_warehouse_id: input.wipWarehouseId,
        target_warehouse_id: input.targetWarehouseId,
        scrap_warehouse_id: input.scrapWarehouseId,
        skip_transfer: input.skipTransfer,
        material_transferred: 0,
        material_transferred_for_manufacturing: 0,
        use_multi_level_bom: input.useMultiLevelBom,
        allow_alternative_item: input.allowAlternativeItem,
        project_id: input.projectId,
        cost_center_id: input.costCenterId,
        description: input.description,
        remarks: input.remarks,
      })
      .select()
      .single();

    if (woError) {
      throw new ManufacturingError(`Failed to create work order: ${woError.message}`);
    }

    // Create work order items from BOM
    const multiplier = input.quantity / bom.quantity;

    // Get items - either exploded or direct based on setting
    const itemsToUse = input.useMultiLevelBom && bom.explodedItems?.length
      ? bom.explodedItems.map(e => ({
          itemId: e.itemId,
          quantity: e.stockQty * multiplier,
          uomId: bom.items.find(i => i.itemId === e.itemId)?.uomId || bom.uomId,
          conversionFactor: 1,
          description: e.description,
          bomDetailId: undefined,
          sourceBomId: e.sourceBomId,
          includeItemInManufacturing: true,
          allowAlternativeItem: false,
          operationId: undefined,
        }))
      : bom.items.filter(i => i.includeItemInManufacturing).map(i => ({
          itemId: i.itemId,
          quantity: i.stockQty * multiplier,
          uomId: i.uomId,
          conversionFactor: i.conversionFactor,
          description: i.description,
          bomDetailId: i.id,
          sourceBomId: i.bomId_sub,
          includeItemInManufacturing: i.includeItemInManufacturing,
          allowAlternativeItem: i.allowAlternativeItem,
          operationId: i.operationId,
        }));

    for (const item of itemsToUse) {
      // Get item details
      const { data: itemData } = await supabase
        .from('items')
        .select('item_code, item_name, valuation_rate, stock_uom_id')
        .eq('id', item.itemId)
        .single();

      const rate = parseFloat(itemData?.valuation_rate) || 0;

      await supabase.from('work_order_items').insert({
        work_order_id: wo.id,
        item_id: item.itemId,
        description: item.description,
        bom_detail_id: item.bomDetailId,
        source_bom_id: item.sourceBomId,
        required_qty: item.quantity,
        transferred_qty: 0,
        consumed_qty: 0,
        returned_qty: 0,
        uom_id: item.uomId,
        conversion_factor: item.conversionFactor,
        stock_qty: item.quantity,
        stock_uom_id: itemData?.stock_uom_id,
        rate: rate,
        amount: item.quantity * rate,
        include_item_in_manufacturing: item.includeItemInManufacturing,
        allow_alternative_item: item.allowAlternativeItem,
        source_warehouse_id: input.sourceWarehouseId,
        operation_id: item.operationId,
      });
    }

    // Create work order operations from BOM
    if (bom.withOperations && bom.operations.length > 0) {
      let plannedStartTime = input.plannedStartDate
        ? new Date(input.plannedStartDate)
        : new Date();

      for (const op of bom.operations) {
        const timeForOrder = op.fixedTime
          ? op.timeInMinutes
          : op.timeInMinutes * (input.quantity / (op.batchSize || 1));

        const plannedEndTime = new Date(plannedStartTime);
        plannedEndTime.setMinutes(plannedEndTime.getMinutes() + timeForOrder);

        await supabase.from('work_order_operations').insert({
          work_order_id: wo.id,
          operation_id: op.operationId,
          sequence: op.sequence,
          workstation_id: op.workstationId,
          description: op.description,
          time_in_minutes: op.timeInMinutes,
          planned_operating_cost: op.operatingCost * multiplier,
          planned_start_time: plannedStartTime.toISOString(),
          planned_end_time: plannedEndTime.toISOString(),
          status: 'Pending',
          completed_qty: 0,
          process_loss_qty: 0,
          batch_size: op.batchSize,
          set_up_time: op.setUpTime,
          hour_rate: op.hourRate,
          fixed_time: op.fixedTime,
          actual_operating_cost: 0,
          actual_operation_time: 0,
        });

        plannedStartTime = plannedEndTime;
      }
    }

    return this.getById(wo.id);
  }

  /**
   * Get work order by ID with all details
   */
  static async getById(id: string): Promise<WorkOrderWithDetails> {
    const supabase = await createClient();

    const { data: wo, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        items!work_orders_item_id_fkey (item_code, item_name),
        boms (bom_no),
        uoms (uom_name)
      `)
      .eq('id', id)
      .single();

    if (error || !wo) {
      throw new ManufacturingError(`Work order not found: ${id}`);
    }

    // Get items
    const { data: items } = await supabase
      .from('work_order_items')
      .select(`
        *,
        items (item_code, item_name),
        uoms (uom_name)
      `)
      .eq('work_order_id', id)
      .order('id');

    // Get operations
    const { data: operations } = await supabase
      .from('work_order_operations')
      .select(`
        *,
        operations (operation_name),
        workstations (workstation_name)
      `)
      .eq('work_order_id', id)
      .order('sequence');

    return {
      ...this.mapDbToWorkOrder(wo),
      itemCode: wo.items?.item_code,
      itemName: wo.items?.item_name,
      bomNo: wo.boms?.bom_no,
      uomName: wo.uoms?.uom_name,
      items: (items || []).map(i => ({
        ...this.mapDbToWorkOrderItem(i),
        itemCode: i.items?.item_code,
        itemName: i.items?.item_name,
        uomName: i.uoms?.uom_name,
      })),
      operations: (operations || []).map(o => ({
        ...this.mapDbToWorkOrderOperation(o),
        operationName: o.operations?.operation_name,
        workstationName: o.workstations?.workstation_name,
      })),
    };
  }

  /**
   * List work orders
   */
  static async list(filters: {
    orgId: string;
    status?: WorkOrderStatus;
    itemId?: string;
    bomId?: string;
    productionPlanId?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkOrderSummary[]> {
    const supabase = await createClient();

    let query = supabase
      .from('work_orders')
      .select(`
        id, work_order_no, status, quantity, produced_qty,
        planned_start_date, expected_delivery_date,
        items!work_orders_item_id_fkey (item_code, item_name)
      `)
      .eq('org_id', filters.orgId)
      .order('work_order_no', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.itemId) {
      query = query.eq('item_id', filters.itemId);
    }

    if (filters.bomId) {
      query = query.eq('bom_id', filters.bomId);
    }

    if (filters.productionPlanId) {
      query = query.eq('production_plan_id', filters.productionPlanId);
    }

    if (filters.fromDate) {
      query = query.gte('planned_start_date', filters.fromDate.toISOString());
    }

    if (filters.toDate) {
      query = query.lte('planned_start_date', filters.toDate.toISOString());
    }

    if (filters.search) {
      query = query.or(
        `work_order_no.ilike.%${filters.search}%`
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new ManufacturingError(`Failed to list work orders: ${error.message}`);
    }

    return (data || []).map(wo => ({
      id: wo.id,
      workOrderNo: wo.work_order_no,
      status: wo.status,
      itemCode: wo.items?.item_code || '',
      itemName: wo.items?.item_name || '',
      quantity: parseFloat(wo.quantity) || 0,
      producedQty: parseFloat(wo.produced_qty) || 0,
      percentComplete: ((parseFloat(wo.produced_qty) || 0) / (parseFloat(wo.quantity) || 1)) * 100,
      plannedStartDate: wo.planned_start_date ? new Date(wo.planned_start_date) : undefined,
      expectedDeliveryDate: wo.expected_delivery_date ? new Date(wo.expected_delivery_date) : undefined,
    }));
  }

  /**
   * Submit work order (start production)
   */
  static async submit(id: string): Promise<WorkOrderWithDetails> {
    const supabase = await createClient();

    const wo = await this.getById(id);

    if (wo.status !== 'Draft') {
      throw new ManufacturingError('Only draft work orders can be submitted');
    }

    // Validate required warehouses
    if (!wo.skipTransfer && !wo.sourceWarehouseId) {
      throw new ManufacturingError('Source warehouse is required');
    }

    if (!wo.targetWarehouseId) {
      throw new ManufacturingError('Target warehouse is required');
    }

    await supabase
      .from('work_orders')
      .update({
        status: 'Not Started',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id);

    return this.getById(id);
  }

  /**
   * Transfer materials to WIP warehouse
   */
  static async transferMaterials(input: WorkOrderMaterialTransfer): Promise<void> {
    const supabase = await createClient();

    const wo = await this.getById(input.workOrderId);

    if (!['Not Started', 'In Process'].includes(wo.status)) {
      throw new ManufacturingError('Cannot transfer materials for this work order status');
    }

    // Create Stock Entry for material transfer
    const transferItems = input.items.map(item => ({
      itemId: item.itemId,
      sourceWarehouseId: item.sourceWarehouseId,
      targetWarehouseId: item.targetWarehouseId,
      qty: item.qty,
    }));

    await StockEntryService.create({
      orgId: wo.orgId,
      stockEntryType: 'Material Transfer for Manufacture',
      postingDate: input.postingDate,
      postingTime: input.postingTime,
      workOrderId: wo.id,
      items: transferItems.map(t => ({
        itemId: t.itemId,
        qty: t.qty,
        sourceWarehouseId: t.sourceWarehouseId,
        targetWarehouseId: t.targetWarehouseId,
      })),
    });

    // Update work order items transferred qty
    for (const item of input.items) {
      await supabase.rpc('update_work_order_item_transferred', {
        p_work_order_id: wo.id,
        p_item_id: item.itemId,
        p_qty: item.qty,
      });
    }

    // Update work order status
    if (wo.status === 'Not Started') {
      await supabase
        .from('work_orders')
        .update({ status: 'In Process', actual_start_date: new Date().toISOString() })
        .eq('id', wo.id);
    }
  }

  /**
   * Complete production (manufacture finished goods)
   */
  static async completeProduction(input: WorkOrderCompletion): Promise<void> {
    const supabase = await createClient();

    const wo = await this.getById(input.workOrderId);

    if (!['Not Started', 'In Process'].includes(wo.status)) {
      throw new ManufacturingError('Cannot complete production for this work order status');
    }

    const newProducedQty = wo.producedQty + input.quantity;
    if (newProducedQty > wo.quantity) {
      throw new ManufacturingError(
        `Cannot produce more than ordered quantity. Remaining: ${wo.quantity - wo.producedQty}`
      );
    }

    // Create Stock Entry for manufacture
    const manufactureItems: any[] = [];

    // Add consumed raw materials (subtract from WIP)
    if (input.consumedItems && input.consumedItems.length > 0) {
      for (const consumed of input.consumedItems) {
        manufactureItems.push({
          itemId: consumed.itemId,
          qty: consumed.qty,
          sourceWarehouseId: consumed.warehouseId,
          basicRate: consumed.rate,
        });
      }
    } else {
      // Backflush - calculate consumed materials based on BOM ratio
      const bom = await BomService.getById(wo.bomId);
      const ratio = input.quantity / bom.quantity;

      for (const item of wo.items) {
        const consumeQty = item.requiredQty * ratio / wo.quantity * input.quantity;
        manufactureItems.push({
          itemId: item.itemId,
          qty: consumeQty,
          sourceWarehouseId: wo.wipWarehouseId || wo.sourceWarehouseId,
        });
      }
    }

    // Add finished goods (add to target warehouse)
    manufactureItems.push({
      itemId: wo.itemId,
      qty: input.quantity,
      targetWarehouseId: input.targetWarehouseId || wo.targetWarehouseId,
      isFinishedItem: true,
    });

    // Add scrap items if any
    if (input.scrapItems && input.scrapItems.length > 0) {
      for (const scrap of input.scrapItems) {
        manufactureItems.push({
          itemId: scrap.itemId,
          qty: scrap.qty,
          targetWarehouseId: scrap.warehouseId || wo.scrapWarehouseId,
          isScrapItem: true,
        });
      }
    }

    await StockEntryService.create({
      orgId: wo.orgId,
      stockEntryType: 'Manufacture',
      postingDate: input.postingDate,
      postingTime: input.postingTime,
      workOrderId: wo.id,
      items: manufactureItems,
    });

    // Update work order
    const isComplete = newProducedQty >= wo.quantity;

    await supabase
      .from('work_orders')
      .update({
        produced_qty: newProducedQty,
        status: isComplete ? 'Completed' : 'In Process',
        actual_end_date: isComplete ? new Date().toISOString() : null,
      })
      .eq('id', wo.id);

    // Update operation if specified
    if (input.operationId) {
      await supabase
        .from('work_order_operations')
        .update({
          completed_qty: newProducedQty,
          status: isComplete ? 'Complete' : 'Work in Progress',
          actual_end_time: isComplete ? new Date().toISOString() : null,
        })
        .eq('work_order_id', wo.id)
        .eq('operation_id', input.operationId);
    }
  }

  /**
   * Stop work order
   */
  static async stop(input: WorkOrderStop): Promise<void> {
    const supabase = await createClient();

    const wo = await this.getById(input.workOrderId);

    if (!['Not Started', 'In Process'].includes(wo.status)) {
      throw new ManufacturingError('Cannot stop this work order');
    }

    await supabase
      .from('work_orders')
      .update({
        status: 'Stopped',
        remarks: input.reason,
      })
      .eq('id', input.workOrderId);
  }

  /**
   * Resume stopped work order
   */
  static async resume(id: string): Promise<void> {
    const supabase = await createClient();

    const wo = await this.getById(id);

    if (wo.status !== 'Stopped') {
      throw new ManufacturingError('Only stopped work orders can be resumed');
    }

    const newStatus = wo.producedQty > 0 ? 'In Process' : 'Not Started';

    await supabase
      .from('work_orders')
      .update({ status: newStatus })
      .eq('id', id);
  }

  /**
   * Cancel work order
   */
  static async cancel(id: string): Promise<void> {
    const supabase = await createClient();

    const wo = await this.getById(id);

    if (wo.status === 'Cancelled') {
      throw new ManufacturingError('Work order is already cancelled');
    }

    if (wo.producedQty > 0) {
      throw new ManufacturingError('Cannot cancel work order with produced quantity');
    }

    // Check for stock entries
    const { data: stockEntries } = await supabase
      .from('stock_entries')
      .select('id')
      .eq('work_order_id', id)
      .not('status', 'eq', 'Cancelled')
      .limit(1);

    if (stockEntries && stockEntries.length > 0) {
      throw new ManufacturingError('Cancel related stock entries first');
    }

    // Check for job cards
    const { data: jobCards } = await supabase
      .from('job_cards')
      .select('id')
      .eq('work_order_id', id)
      .not('status', 'eq', 'Cancelled')
      .limit(1);

    if (jobCards && jobCards.length > 0) {
      throw new ManufacturingError('Cancel related job cards first');
    }

    await supabase
      .from('work_orders')
      .update({ status: 'Cancelled' })
      .eq('id', id);
  }

  /**
   * Update work order quantity
   */
  static async updateQuantity(id: string, newQty: number): Promise<WorkOrderWithDetails> {
    const supabase = await createClient();

    const wo = await this.getById(id);

    if (!['Draft', 'Not Started'].includes(wo.status)) {
      throw new ManufacturingError('Cannot change quantity after production has started');
    }

    if (newQty <= 0) {
      throw new ManufacturingError('Quantity must be positive');
    }

    const ratio = newQty / wo.quantity;

    // Update work order
    await supabase
      .from('work_orders')
      .update({ quantity: newQty })
      .eq('id', id);

    // Update items
    for (const item of wo.items) {
      const newRequiredQty = item.requiredQty * ratio;
      await supabase
        .from('work_order_items')
        .update({
          required_qty: newRequiredQty,
          stock_qty: newRequiredQty,
          amount: newRequiredQty * item.rate,
        })
        .eq('id', item.id);
    }

    // Update operations
    for (const op of wo.operations) {
      if (!op.fixedTime) {
        const newCost = op.plannedOperatingCost * ratio;
        await supabase
          .from('work_order_operations')
          .update({ planned_operating_cost: newCost })
          .eq('id', op.id);
      }
    }

    return this.getById(id);
  }

  /**
   * Get required materials for work order
   */
  static async getRequiredMaterials(id: string): Promise<Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    requiredQty: number;
    transferredQty: number;
    pendingQty: number;
    availableQty: number;
    warehouseId?: string;
  }>> {
    const supabase = await createClient();

    const wo = await this.getById(id);

    const materials: Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      requiredQty: number;
      transferredQty: number;
      pendingQty: number;
      availableQty: number;
      warehouseId?: string;
    }> = [];

    for (const item of wo.items) {
      // Get available stock
      const { data: bins } = await supabase
        .from('bins')
        .select('actual_qty')
        .eq('item_id', item.itemId)
        .eq('warehouse_id', item.sourceWarehouseId || wo.sourceWarehouseId);

      const availableQty = bins?.reduce((sum, b) => sum + parseFloat(b.actual_qty || '0'), 0) || 0;
      const pendingQty = item.requiredQty - item.transferredQty;

      materials.push({
        itemId: item.itemId,
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        requiredQty: item.requiredQty,
        transferredQty: item.transferredQty,
        pendingQty: pendingQty > 0 ? pendingQty : 0,
        availableQty,
        warehouseId: item.sourceWarehouseId || wo.sourceWarehouseId,
      });
    }

    return materials;
  }

  // Mapping functions
  private static mapDbToWorkOrder(row: any): WorkOrder {
    return {
      id: row.id,
      orgId: row.org_id,
      workOrderNo: row.work_order_no,
      status: row.status,
      itemId: row.item_id,
      bomId: row.bom_id,
      quantity: parseFloat(row.quantity) || 0,
      uomId: row.uom_id,
      producedQty: parseFloat(row.produced_qty) || 0,
      processLossQty: parseFloat(row.process_loss_qty) || 0,
      plannedStartDate: row.planned_start_date ? new Date(row.planned_start_date) : undefined,
      plannedEndDate: row.planned_end_date ? new Date(row.planned_end_date) : undefined,
      actualStartDate: row.actual_start_date ? new Date(row.actual_start_date) : undefined,
      actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : undefined,
      expectedDeliveryDate: row.expected_delivery_date ? new Date(row.expected_delivery_date) : undefined,
      leadTimeDays: row.lead_time_days || 0,
      productionPlanId: row.production_plan_id,
      salesOrderId: row.sales_order_id,
      sourceWarehouseId: row.source_warehouse_id,
      wipWarehouseId: row.wip_warehouse_id,
      targetWarehouseId: row.target_warehouse_id,
      scrapWarehouseId: row.scrap_warehouse_id,
      skipTransfer: row.skip_transfer ?? false,
      materialTransferred: parseFloat(row.material_transferred) || 0,
      materialTransferredForManufacturing: parseFloat(row.material_transferred_for_manufacturing) || 0,
      useMultiLevelBom: row.use_multi_level_bom ?? true,
      allowAlternativeItem: row.allow_alternative_item ?? false,
      projectId: row.project_id,
      costCenterId: row.cost_center_id,
      description: row.description,
      remarks: row.remarks,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      submittedBy: row.submitted_by,
    };
  }

  private static mapDbToWorkOrderItem(row: any): WorkOrderItem {
    return {
      id: row.id,
      workOrderId: row.work_order_id,
      itemId: row.item_id,
      description: row.description,
      bomDetailId: row.bom_detail_id,
      sourceBomId: row.source_bom_id,
      requiredQty: parseFloat(row.required_qty) || 0,
      transferredQty: parseFloat(row.transferred_qty) || 0,
      consumedQty: parseFloat(row.consumed_qty) || 0,
      returnedQty: parseFloat(row.returned_qty) || 0,
      availableQtyAtSourceWarehouse: parseFloat(row.available_qty_at_source_warehouse) || 0,
      availableQtyAtWipWarehouse: parseFloat(row.available_qty_at_wip_warehouse) || 0,
      uomId: row.uom_id,
      conversionFactor: parseFloat(row.conversion_factor) || 1,
      stockQty: parseFloat(row.stock_qty) || 0,
      stockUomId: row.stock_uom_id,
      rate: parseFloat(row.rate) || 0,
      amount: parseFloat(row.amount) || 0,
      includeItemInManufacturing: row.include_item_in_manufacturing ?? true,
      allowAlternativeItem: row.allow_alternative_item ?? false,
      sourceWarehouseId: row.source_warehouse_id,
      originalItemId: row.original_item_id,
      operationId: row.operation_id,
    };
  }

  private static mapDbToWorkOrderOperation(row: any): WorkOrderOperation {
    return {
      id: row.id,
      workOrderId: row.work_order_id,
      operationId: row.operation_id,
      sequence: row.sequence || 0,
      workstationId: row.workstation_id,
      workstationTypeId: row.workstation_type_id,
      description: row.description,
      timeInMinutes: parseFloat(row.time_in_minutes) || 0,
      plannedOperatingCost: parseFloat(row.planned_operating_cost) || 0,
      plannedStartTime: row.planned_start_time ? new Date(row.planned_start_time) : undefined,
      plannedEndTime: row.planned_end_time ? new Date(row.planned_end_time) : undefined,
      actualStartTime: row.actual_start_time ? new Date(row.actual_start_time) : undefined,
      actualEndTime: row.actual_end_time ? new Date(row.actual_end_time) : undefined,
      status: row.status || 'Pending',
      completedQty: parseFloat(row.completed_qty) || 0,
      processLossQty: parseFloat(row.process_loss_qty) || 0,
      batchSize: parseFloat(row.batch_size) || 1,
      setUpTime: parseFloat(row.set_up_time) || 0,
      hourRate: parseFloat(row.hour_rate) || 0,
      fixedTime: row.fixed_time ?? false,
      actualOperatingCost: parseFloat(row.actual_operating_cost) || 0,
      actualOperationTime: parseFloat(row.actual_operation_time) || 0,
    };
  }
}
