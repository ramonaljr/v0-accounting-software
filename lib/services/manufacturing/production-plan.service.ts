/**
 * Production Plan Service
 * MRP (Material Requirements Planning) implementation
 * Based on ERPNext's production_plan.py
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ProductionPlan,
  ProductionPlanWithDetails,
  ProductionPlanItem,
  ProductionPlanSubAssembly,
  ProductionPlanMaterial,
  CreateProductionPlan,
  UpdateProductionPlan,
  ProductionPlanSalesOrderFilter,
  MrpCalculationResult,
  ProductionPlanWorkOrderCreate,
  ProductionPlanMaterialRequestCreate,
  ProductionPlanSummary,
  ProductionPlanStatus,
  MrpRunOptions,
} from '@/lib/models/manufacturing/production-plan';
import { BomService, ManufacturingError } from './bom.service';
import { WorkOrderService } from './work-order.service';

export class ProductionPlanService {
  /**
   * Create a new Production Plan
   */
  static async create(input: CreateProductionPlan): Promise<ProductionPlanWithDetails> {
    const supabase = await createClient();

    // Generate production plan number
    const { data: lastPp } = await supabase
      .from('production_plans')
      .select('production_plan_no')
      .eq('org_id', input.orgId)
      .like('production_plan_no', 'PP-%')
      .order('production_plan_no', { ascending: false })
      .limit(1);

    const lastNum = lastPp?.[0]?.production_plan_no
      ? parseInt(lastPp[0].production_plan_no.replace('PP-', '')) || 0
      : 0;
    const productionPlanNo = `PP-${String(lastNum + 1).padStart(5, '0')}`;

    // Insert production plan header
    const { data: pp, error: ppError } = await supabase
      .from('production_plans')
      .insert({
        org_id: input.orgId,
        production_plan_no: productionPlanNo,
        status: 'Draft',
        planning_date: input.planningDate.toISOString(),
        posting_date: input.postingDate.toISOString(),
        get_items_from: input.getItemsFrom,
        include_non_stock_items: input.includeNonStockItems,
        include_subcontracted_items: input.includeSubcontractedItems,
        ignore_procurement_lead_time: input.ignoreProcurementLeadTime,
        ignore_existing_ordered_qty: input.ignoreExistingOrderedQty,
        ignore_existing_projected_qty: input.ignoreExistingProjectedQty,
        include_safety_stock: input.includeSafetyStock,
        for_warehouse_id: input.forWarehouseId,
      })
      .select()
      .single();

    if (ppError) {
      throw new ManufacturingError(`Failed to create production plan: ${ppError.message}`);
    }

    // Insert production plan items
    for (const itemInput of input.items) {
      // Validate BOM exists and is active
      const bom = await BomService.getById(itemInput.bomId);
      if (bom.status !== 'Submitted') {
        throw new ManufacturingError(`BOM ${bom.bomNo} is not submitted`);
      }

      // Get item details
      const { data: item } = await supabase
        .from('items')
        .select('item_code, item_name')
        .eq('id', itemInput.itemId)
        .single();

      // Get current stock
      const { data: bins } = await supabase
        .from('bins')
        .select('actual_qty')
        .eq('item_id', itemInput.itemId)
        .eq('warehouse_id', itemInput.warehouseId || input.forWarehouseId);

      const stockQty = (bins || []).reduce(
        (sum, b) => sum + parseFloat(b.actual_qty || '0'),
        0
      );

      await supabase.from('production_plan_items').insert({
        production_plan_id: pp.id,
        item_id: itemInput.itemId,
        bom_id: itemInput.bomId,
        planned_qty: itemInput.plannedQty,
        pending_qty: itemInput.plannedQty,
        produced_qty: 0,
        stock_qty: stockQty,
        ordered_qty: 0,
        reserved_qty: 0,
        warehouse_id: itemInput.warehouseId || input.forWarehouseId,
        sales_order_id: itemInput.salesOrderId,
        sales_order_item_id: itemInput.salesOrderItemId,
        material_request_id: itemInput.materialRequestId,
        material_request_item_id: itemInput.materialRequestItemId,
        planned_start_date: itemInput.plannedStartDate.toISOString(),
        make_or_buy: itemInput.makeOrBuy,
      });
    }

    return this.getById(pp.id);
  }

  /**
   * Get production plan by ID with all details
   */
  static async getById(id: string): Promise<ProductionPlanWithDetails> {
    const supabase = await createClient();

    const { data: pp, error } = await supabase
      .from('production_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pp) {
      throw new ManufacturingError(`Production plan not found: ${id}`);
    }

    // Get items
    const { data: items } = await supabase
      .from('production_plan_items')
      .select(`
        *,
        items (item_code, item_name),
        boms (bom_no),
        warehouses (warehouse_name)
      `)
      .eq('production_plan_id', id)
      .order('id');

    // Get sub-assemblies
    const { data: subAssemblies } = await supabase
      .from('production_plan_sub_assemblies')
      .select(`
        *,
        items (item_code, item_name),
        boms (bom_no),
        warehouses (warehouse_name),
        uoms (uom_name)
      `)
      .eq('production_plan_id', id)
      .order('bom_level', { ascending: true })
      .order('indent', { ascending: true });

    // Get materials
    const { data: materials } = await supabase
      .from('production_plan_materials')
      .select(`
        *,
        items (item_code, item_name),
        warehouses (warehouse_name),
        uoms (uom_name)
      `)
      .eq('production_plan_id', id)
      .order('id');

    return {
      ...this.mapDbToProductionPlan(pp),
      items: (items || []).map(i => ({
        ...this.mapDbToPlanItem(i),
        itemCode: i.items?.item_code,
        itemName: i.items?.item_name,
        bomNo: i.boms?.bom_no,
        warehouseName: i.warehouses?.warehouse_name,
      })),
      subAssemblies: (subAssemblies || []).map(s => ({
        ...this.mapDbToSubAssembly(s),
        itemCode: s.items?.item_code,
        itemName: s.items?.item_name,
        bomNo: s.boms?.bom_no,
        warehouseName: s.warehouses?.warehouse_name,
        uomName: s.uoms?.uom_name,
      })),
      materials: (materials || []).map(m => ({
        ...this.mapDbToMaterial(m),
        itemCode: m.items?.item_code,
        itemName: m.items?.item_name,
        warehouseName: m.warehouses?.warehouse_name,
        uomName: m.uoms?.uom_name,
      })),
    };
  }

  /**
   * List production plans
   */
  static async list(filters: {
    orgId: string;
    status?: ProductionPlanStatus;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductionPlanSummary[]> {
    const supabase = await createClient();

    let query = supabase
      .from('production_plans')
      .select('id, production_plan_no, status, planning_date')
      .eq('org_id', filters.orgId)
      .order('production_plan_no', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.fromDate) {
      query = query.gte('planning_date', filters.fromDate.toISOString());
    }

    if (filters.toDate) {
      query = query.lte('planning_date', filters.toDate.toISOString());
    }

    if (filters.search) {
      query = query.ilike('production_plan_no', `%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new ManufacturingError(`Failed to list production plans: ${error.message}`);
    }

    // Get counts for each plan
    const summaries: ProductionPlanSummary[] = [];

    for (const pp of data || []) {
      const { count: itemCount } = await supabase
        .from('production_plan_items')
        .select('id', { count: 'exact', head: true })
        .eq('production_plan_id', pp.id);

      const { count: materialCount } = await supabase
        .from('production_plan_materials')
        .select('id', { count: 'exact', head: true })
        .eq('production_plan_id', pp.id);

      const { count: woCount } = await supabase
        .from('work_orders')
        .select('id', { count: 'exact', head: true })
        .eq('production_plan_id', pp.id)
        .not('status', 'eq', 'Cancelled');

      const { count: mrCount } = await supabase
        .from('production_plan_materials')
        .select('id', { count: 'exact', head: true })
        .eq('production_plan_id', pp.id)
        .not('material_request_id', 'is', null);

      summaries.push({
        id: pp.id,
        productionPlanNo: pp.production_plan_no,
        status: pp.status,
        planningDate: new Date(pp.planning_date),
        totalItems: itemCount || 0,
        totalMaterials: materialCount || 0,
        workOrdersCreated: woCount || 0,
        materialRequestsCreated: mrCount || 0,
      });
    }

    return summaries;
  }

  /**
   * Get items from Sales Orders
   */
  static async getItemsFromSalesOrders(
    filters: ProductionPlanSalesOrderFilter
  ): Promise<Array<{
    salesOrderId: string;
    salesOrderNo: string;
    salesOrderItemId: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    bomId: string;
    bomNo: string;
    quantity: number;
    deliveredQty: number;
    pendingQty: number;
    deliveryDate?: Date;
  }>> {
    const supabase = await createClient();

    let query = supabase
      .from('sales_order_items')
      .select(`
        id, item_id, qty, delivered_qty,
        sales_orders!inner (
          id, sales_order_no, delivery_date, status,
          customer_id
        ),
        items!inner (
          item_code, item_name, is_stock_item
        )
      `)
      .eq('sales_orders.org_id', filters.orgId)
      .eq('items.is_stock_item', true);

    if (!filters.includeClosedOrders) {
      query = query.not('sales_orders.status', 'in', '("Completed","Cancelled","Closed")');
    }

    if (filters.fromDate) {
      query = query.gte('sales_orders.delivery_date', filters.fromDate.toISOString());
    }

    if (filters.toDate) {
      query = query.lte('sales_orders.delivery_date', filters.toDate.toISOString());
    }

    if (filters.customer) {
      query = query.eq('sales_orders.customer_id', filters.customer);
    }

    if (filters.itemId) {
      query = query.eq('item_id', filters.itemId);
    }

    const { data, error } = await query;

    if (error) {
      throw new ManufacturingError(`Failed to get sales order items: ${error.message}`);
    }

    const results: Array<any> = [];

    for (const row of data || []) {
      const qty = parseFloat(row.qty) || 0;
      const deliveredQty = parseFloat(row.delivered_qty) || 0;
      const pendingQty = qty - deliveredQty;

      if (pendingQty <= 0) continue;

      // Get default BOM
      const bom = await BomService.getDefaultBom(row.item_id);
      if (!bom) continue;

      results.push({
        salesOrderId: (row.sales_orders as any).id,
        salesOrderNo: (row.sales_orders as any).sales_order_no,
        salesOrderItemId: row.id,
        itemId: row.item_id,
        itemCode: (row.items as any).item_code,
        itemName: (row.items as any).item_name,
        bomId: bom.id,
        bomNo: bom.bomNo,
        quantity: qty,
        deliveredQty,
        pendingQty,
        deliveryDate: (row.sales_orders as any).delivery_date
          ? new Date((row.sales_orders as any).delivery_date)
          : undefined,
      });
    }

    return results;
  }

  /**
   * Run MRP calculation
   */
  static async runMrp(options: MrpRunOptions): Promise<MrpCalculationResult> {
    const supabase = await createClient();

    const pp = await this.getById(options.productionPlanId);

    const itemsToManufacture: MrpCalculationResult['itemsToManufacture'] = [];
    const materialsToProcure: MrpCalculationResult['materialsToProcure'] = [];
    const warnings: MrpCalculationResult['warnings'] = [];

    // Clear existing sub-assemblies and materials
    await supabase
      .from('production_plan_sub_assemblies')
      .delete()
      .eq('production_plan_id', pp.id);

    await supabase
      .from('production_plan_materials')
      .delete()
      .eq('production_plan_id', pp.id);

    // Process each item in the plan
    for (const planItem of pp.items) {
      const bom = await BomService.getById(planItem.bomId);

      // Add main item to manufacture list
      itemsToManufacture.push({
        itemId: planItem.itemId,
        itemCode: planItem.itemCode || '',
        itemName: planItem.itemName || '',
        bomId: planItem.bomId,
        qty: planItem.plannedQty,
        plannedStartDate: planItem.plannedStartDate,
        bomLevel: 0,
      });

      // Explode BOM and calculate requirements
      await this.explodeBomForMrp(
        pp.id,
        planItem.id,
        bom,
        planItem.plannedQty,
        planItem.plannedStartDate,
        0,
        options,
        itemsToManufacture,
        materialsToProcure,
        warnings
      );
    }

    // Consolidate materials if requested
    if (options.consolidateByItem) {
      const consolidated = this.consolidateMaterials(materialsToProcure);
      materialsToProcure.length = 0;
      materialsToProcure.push(...consolidated);
    }

    // Insert materials to database
    for (const material of materialsToProcure) {
      await supabase.from('production_plan_materials').insert({
        production_plan_id: pp.id,
        item_id: material.itemId,
        required_qty: material.requiredQty,
        available_qty_at_source_warehouse: material.availableQty,
        available_qty_at_all_warehouses: material.availableQty,
        ordered_qty: material.orderedQty,
        reserved_qty_for_production: 0,
        qty_to_procure: material.qtyToProcure,
        warehouse_id: material.warehouseId,
      });
    }

    return {
      productionPlanId: pp.id,
      itemsToManufacture,
      materialsToProcure,
      warnings,
    };
  }

  /**
   * Explode BOM for MRP calculation
   */
  private static async explodeBomForMrp(
    productionPlanId: string,
    productionPlanItemId: string,
    bom: Awaited<ReturnType<typeof BomService.getById>>,
    qty: number,
    plannedDate: Date,
    level: number,
    options: MrpRunOptions,
    itemsToManufacture: MrpCalculationResult['itemsToManufacture'],
    materialsToProcure: MrpCalculationResult['materialsToProcure'],
    warnings: MrpCalculationResult['warnings']
  ): Promise<void> {
    const supabase = await createClient();

    const multiplier = qty / bom.quantity;

    for (const bomItem of bom.items) {
      const requiredQty = bomItem.stockQty * multiplier;

      if (bomItem.bomId_sub) {
        // Sub-assembly - check if we need to manufacture
        const subBom = await BomService.getById(bomItem.bomId_sub);

        // Get available stock
        const { data: bins } = await supabase
          .from('bins')
          .select('actual_qty')
          .eq('item_id', bomItem.itemId);

        const availableQty = options.includeExistingStock
          ? (bins || []).reduce((sum, b) => sum + parseFloat(b.actual_qty || '0'), 0)
          : 0;

        const qtyToManufacture = Math.max(0, requiredQty - availableQty);

        if (qtyToManufacture > 0) {
          // Add sub-assembly to plan
          await supabase.from('production_plan_sub_assemblies').insert({
            production_plan_id: productionPlanId,
            parent_item_id: bom.itemId,
            item_id: bomItem.itemId,
            bom_id: bomItem.bomId_sub,
            qty: qtyToManufacture,
            stock_qty: availableQty,
            wo_produced_qty: 0,
            bom_level: level + 1,
            indent: level + 1,
            type: 'Work Order',
          });

          itemsToManufacture.push({
            itemId: bomItem.itemId,
            itemCode: bomItem.itemCode || '',
            itemName: bomItem.itemName || '',
            bomId: bomItem.bomId_sub,
            qty: qtyToManufacture,
            plannedStartDate: plannedDate,
            parentItemId: bom.itemId,
            bomLevel: level + 1,
          });

          // Recurse into sub-assembly
          await this.explodeBomForMrp(
            productionPlanId,
            productionPlanItemId,
            subBom,
            qtyToManufacture,
            plannedDate,
            level + 1,
            options,
            itemsToManufacture,
            materialsToProcure,
            warnings
          );
        }
      } else {
        // Raw material - calculate procurement requirement
        const { data: bins } = await supabase
          .from('bins')
          .select('actual_qty')
          .eq('item_id', bomItem.itemId);

        const availableQty = options.includeExistingStock
          ? (bins || []).reduce((sum, b) => sum + parseFloat(b.actual_qty || '0'), 0)
          : 0;

        // Get ordered qty
        let orderedQty = 0;
        if (options.includeOrderedQty) {
          const { data: poItems } = await supabase
            .from('purchase_order_items')
            .select(`
              qty, received_qty,
              purchase_orders!inner (status)
            `)
            .eq('item_id', bomItem.itemId)
            .in('purchase_orders.status', ['Draft', 'To Receive and Bill', 'To Receive']);

          orderedQty = (poItems || []).reduce(
            (sum, p) => sum + (parseFloat(p.qty) || 0) - (parseFloat(p.received_qty) || 0),
            0
          );
        }

        const qtyToProcure = Math.max(0, requiredQty - availableQty - orderedQty);

        if (qtyToProcure > 0 || requiredQty > 0) {
          materialsToProcure.push({
            itemId: bomItem.itemId,
            itemCode: bomItem.itemCode || '',
            itemName: bomItem.itemName || '',
            requiredQty,
            availableQty,
            orderedQty,
            qtyToProcure,
            requiredByDate: plannedDate,
          });
        }
      }
    }
  }

  /**
   * Consolidate materials by item
   */
  private static consolidateMaterials(
    materials: MrpCalculationResult['materialsToProcure']
  ): MrpCalculationResult['materialsToProcure'] {
    const consolidated = new Map<string, typeof materials[0]>();

    for (const material of materials) {
      const existing = consolidated.get(material.itemId);
      if (existing) {
        existing.requiredQty += material.requiredQty;
        existing.qtyToProcure += material.qtyToProcure;
        if (material.requiredByDate < existing.requiredByDate) {
          existing.requiredByDate = material.requiredByDate;
        }
      } else {
        consolidated.set(material.itemId, { ...material });
      }
    }

    return Array.from(consolidated.values());
  }

  /**
   * Submit production plan
   */
  static async submit(id: string): Promise<ProductionPlanWithDetails> {
    const supabase = await createClient();

    const pp = await this.getById(id);

    if (pp.status !== 'Draft') {
      throw new ManufacturingError('Only draft production plans can be submitted');
    }

    if (pp.items.length === 0) {
      throw new ManufacturingError('Production plan must have at least one item');
    }

    await supabase
      .from('production_plans')
      .update({
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id);

    return this.getById(id);
  }

  /**
   * Create Work Orders from Production Plan
   */
  static async createWorkOrders(
    input: ProductionPlanWorkOrderCreate
  ): Promise<string[]> {
    const supabase = await createClient();

    const pp = await this.getById(input.productionPlanId);

    if (!['Submitted', 'In Process'].includes(pp.status)) {
      throw new ManufacturingError('Production plan must be submitted to create work orders');
    }

    const workOrderIds: string[] = [];

    for (const itemInput of input.items) {
      const planItem = pp.items.find(i => i.id === itemInput.productionPlanItemId);
      if (!planItem) {
        throw new ManufacturingError(
          `Production plan item not found: ${itemInput.productionPlanItemId}`
        );
      }

      const qty = itemInput.quantity || planItem.pendingQty;
      if (qty <= 0) continue;

      const wo = await WorkOrderService.create({
        orgId: pp.orgId,
        bomId: planItem.bomId,
        quantity: qty,
        plannedStartDate: planItem.plannedStartDate,
        productionPlanId: pp.id,
        salesOrderId: planItem.salesOrderId,
        sourceWarehouseId: planItem.warehouseId,
        wipWarehouseId: itemInput.wipWarehouseId,
        targetWarehouseId: itemInput.targetWarehouseId || planItem.warehouseId,
        skipTransfer: false,
        useMultiLevelBom: true,
        allowAlternativeItem: false,
      });

      workOrderIds.push(wo.id);

      // Update plan item
      await supabase
        .from('production_plan_items')
        .update({
          pending_qty: planItem.pendingQty - qty,
          work_order_id: wo.id,
        })
        .eq('id', planItem.id);
    }

    // Also create work orders for sub-assemblies
    for (const subAssembly of pp.subAssemblies) {
      if (subAssembly.type !== 'Work Order' || !subAssembly.bomId) continue;

      const wo = await WorkOrderService.create({
        orgId: pp.orgId,
        bomId: subAssembly.bomId,
        quantity: subAssembly.qty - subAssembly.woProducedQty,
        productionPlanId: pp.id,
        sourceWarehouseId: subAssembly.warehouseId,
        skipTransfer: false,
        useMultiLevelBom: true,
        allowAlternativeItem: false,
      });

      workOrderIds.push(wo.id);
    }

    // Update production plan status
    if (pp.status === 'Submitted') {
      await supabase
        .from('production_plans')
        .update({ status: 'In Process' })
        .eq('id', pp.id);
    }

    return workOrderIds;
  }

  /**
   * Create Material Requests from Production Plan
   */
  static async createMaterialRequests(
    input: ProductionPlanMaterialRequestCreate
  ): Promise<string[]> {
    const supabase = await createClient();

    const pp = await this.getById(input.productionPlanId);

    if (!['Submitted', 'In Process', 'Material Requested'].includes(pp.status)) {
      throw new ManufacturingError(
        'Production plan must be submitted to create material requests'
      );
    }

    // Group materials by warehouse for creating material requests
    const materialsByWarehouse = new Map<string, typeof input.materials>();

    for (const matInput of input.materials) {
      const planMaterial = pp.materials.find(m => m.id === matInput.productionPlanMaterialId);
      if (!planMaterial) continue;

      const warehouseId = matInput.targetWarehouseId || planMaterial.warehouseId || 'default';
      if (!materialsByWarehouse.has(warehouseId)) {
        materialsByWarehouse.set(warehouseId, []);
      }
      materialsByWarehouse.get(warehouseId)!.push(matInput);
    }

    const materialRequestIds: string[] = [];

    // Create material request for each warehouse
    for (const [warehouseId, materials] of materialsByWarehouse) {
      // Generate MR number
      const { data: lastMr } = await supabase
        .from('material_requests')
        .select('material_request_no')
        .eq('org_id', pp.orgId)
        .like('material_request_no', 'MR-%')
        .order('material_request_no', { ascending: false })
        .limit(1);

      const lastNum = lastMr?.[0]?.material_request_no
        ? parseInt(lastMr[0].material_request_no.replace('MR-', '')) || 0
        : 0;
      const mrNo = `MR-${String(lastNum + 1).padStart(5, '0')}`;

      const { data: mr, error: mrError } = await supabase
        .from('material_requests')
        .insert({
          org_id: pp.orgId,
          material_request_no: mrNo,
          material_request_type: input.type,
          status: 'Draft',
          transaction_date: new Date().toISOString(),
          production_plan_id: pp.id,
        })
        .select()
        .single();

      if (mrError) {
        throw new ManufacturingError(`Failed to create material request: ${mrError.message}`);
      }

      // Add items to material request
      for (const matInput of materials) {
        const planMaterial = pp.materials.find(m => m.id === matInput.productionPlanMaterialId);
        if (!planMaterial) continue;

        const qty = matInput.quantity || planMaterial.qtyToProcure;
        if (qty <= 0) continue;

        await supabase.from('material_request_items').insert({
          material_request_id: mr.id,
          item_id: planMaterial.itemId,
          qty: qty,
          uom_id: planMaterial.uomId,
          warehouse_id: warehouseId === 'default' ? null : warehouseId,
          schedule_date: matInput.requiredByDate?.toISOString(),
          production_plan_id: pp.id,
        });

        // Update plan material
        await supabase
          .from('production_plan_materials')
          .update({ material_request_id: mr.id })
          .eq('id', planMaterial.id);
      }

      materialRequestIds.push(mr.id);
    }

    // Update production plan status
    if (pp.status === 'Submitted' || pp.status === 'In Process') {
      await supabase
        .from('production_plans')
        .update({ status: 'Material Requested' })
        .eq('id', pp.id);
    }

    return materialRequestIds;
  }

  /**
   * Close production plan
   */
  static async close(id: string): Promise<void> {
    const supabase = await createClient();

    const pp = await this.getById(id);

    if (!['Submitted', 'In Process', 'Material Requested', 'Completed'].includes(pp.status)) {
      throw new ManufacturingError('Cannot close this production plan');
    }

    await supabase
      .from('production_plans')
      .update({ status: 'Closed' })
      .eq('id', id);
  }

  /**
   * Cancel production plan
   */
  static async cancel(id: string): Promise<void> {
    const supabase = await createClient();

    const pp = await this.getById(id);

    if (pp.status === 'Cancelled') {
      throw new ManufacturingError('Production plan is already cancelled');
    }

    // Check for work orders
    const { data: workOrders } = await supabase
      .from('work_orders')
      .select('id')
      .eq('production_plan_id', id)
      .not('status', 'in', '("Draft","Cancelled")');

    if (workOrders && workOrders.length > 0) {
      throw new ManufacturingError('Cancel or close linked work orders first');
    }

    await supabase
      .from('production_plans')
      .update({ status: 'Cancelled' })
      .eq('id', id);
  }

  // Mapping functions
  private static mapDbToProductionPlan(row: any): ProductionPlan {
    return {
      id: row.id,
      orgId: row.org_id,
      productionPlanNo: row.production_plan_no,
      status: row.status,
      planningDate: new Date(row.planning_date),
      postingDate: new Date(row.posting_date),
      itemCode: row.item_code,
      customer: row.customer,
      project: row.project,
      salesOrderId: row.sales_order_id,
      getItemsFrom: row.get_items_from || 'Manual',
      includeNonStockItems: row.include_non_stock_items ?? false,
      includeSubcontractedItems: row.include_subcontracted_items ?? false,
      ignoreProcurementLeadTime: row.ignore_procurement_lead_time ?? false,
      ignoreExistingOrderedQty: row.ignore_existing_ordered_qty ?? false,
      ignoreExistingProjectedQty: row.ignore_existing_projected_qty ?? false,
      includeSafetyStock: row.include_safety_stock ?? true,
      forWarehouseId: row.for_warehouse_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      submittedBy: row.submitted_by,
    };
  }

  private static mapDbToPlanItem(row: any): ProductionPlanItem {
    return {
      id: row.id,
      productionPlanId: row.production_plan_id,
      itemId: row.item_id,
      bomId: row.bom_id,
      plannedQty: parseFloat(row.planned_qty) || 0,
      pendingQty: parseFloat(row.pending_qty) || 0,
      producedQty: parseFloat(row.produced_qty) || 0,
      stockQty: parseFloat(row.stock_qty) || 0,
      orderedQty: parseFloat(row.ordered_qty) || 0,
      reservedQty: parseFloat(row.reserved_qty) || 0,
      warehouseId: row.warehouse_id,
      salesOrderId: row.sales_order_id,
      salesOrderItemId: row.sales_order_item_id,
      materialRequestId: row.material_request_id,
      materialRequestItemId: row.material_request_item_id,
      plannedStartDate: new Date(row.planned_start_date),
      makeOrBuy: row.make_or_buy || 'Make',
      workOrderId: row.work_order_id,
    };
  }

  private static mapDbToSubAssembly(row: any): ProductionPlanSubAssembly {
    return {
      id: row.id,
      productionPlanId: row.production_plan_id,
      parentItemId: row.parent_item_id,
      itemId: row.item_id,
      bomId: row.bom_id,
      qty: parseFloat(row.qty) || 0,
      stockQty: parseFloat(row.stock_qty) || 0,
      woProducedQty: parseFloat(row.wo_produced_qty) || 0,
      warehouseId: row.warehouse_id,
      uomId: row.uom_id,
      bomLevel: row.bom_level || 0,
      indent: row.indent || 0,
      scheduledDate: row.scheduled_date ? new Date(row.scheduled_date) : undefined,
      type: row.type || 'Work Order',
    };
  }

  private static mapDbToMaterial(row: any): ProductionPlanMaterial {
    return {
      id: row.id,
      productionPlanId: row.production_plan_id,
      itemId: row.item_id,
      requiredQty: parseFloat(row.required_qty) || 0,
      availableQtyAtSourceWarehouse: parseFloat(row.available_qty_at_source_warehouse) || 0,
      availableQtyAtAllWarehouses: parseFloat(row.available_qty_at_all_warehouses) || 0,
      orderedQty: parseFloat(row.ordered_qty) || 0,
      reservedQtyForProduction: parseFloat(row.reserved_qty_for_production) || 0,
      qtyToProcure: parseFloat(row.qty_to_procure) || 0,
      warehouseId: row.warehouse_id,
      uomId: row.uom_id,
      bomDetailId: row.bom_detail_id,
      bomNo: row.bom_no,
      productionPlanItemId: row.production_plan_item_id,
      materialRequestId: row.material_request_id,
      purchaseOrderId: row.purchase_order_id,
    };
  }
}
