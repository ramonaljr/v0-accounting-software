/**
 * Bill of Materials (BOM) Service
 * Manages BOMs with cost calculation, explosion, and validation
 * Based on ERPNext's bom.py
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Bom,
  BomWithDetails,
  BomItem,
  BomOperation,
  BomScrapItem,
  BomExplodedItem,
  CreateBom,
  UpdateBom,
  BomTreeNode,
  BomCostBreakdown,
} from '@/lib/models/manufacturing/bom';

export class ManufacturingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManufacturingError';
  }
}

export class BomService {
  /**
   * Create a new BOM
   */
  static async create(input: CreateBom): Promise<BomWithDetails> {
    const supabase = await createClient();

    // Generate BOM number
    const { data: lastBom } = await supabase
      .from('boms')
      .select('bom_no')
      .eq('org_id', input.orgId)
      .like('bom_no', 'BOM-%')
      .order('bom_no', { ascending: false })
      .limit(1);

    const lastNum = lastBom?.[0]?.bom_no
      ? parseInt(lastBom[0].bom_no.replace('BOM-', '')) || 0
      : 0;
    const bomNo = `BOM-${String(lastNum + 1).padStart(5, '0')}`;

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, item_code, item_name, stock_uom_id')
      .eq('id', input.itemId)
      .single();

    if (itemError || !item) {
      throw new ManufacturingError(`Item not found: ${input.itemId}`);
    }

    // Validate items exist
    for (const bomItem of input.items) {
      const { data: itemData, error: itemDataError } = await supabase
        .from('items')
        .select('id')
        .eq('id', bomItem.itemId)
        .single();

      if (itemDataError || !itemData) {
        throw new ManufacturingError(`BOM item not found: ${bomItem.itemId}`);
      }
    }

    // Check for circular dependency
    for (const bomItem of input.items) {
      if (bomItem.bomId_sub) {
        await this.checkCircularDependency(input.itemId, bomItem.bomId_sub);
      }
    }

    // Insert BOM header
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .insert({
        org_id: input.orgId,
        bom_no: bomNo,
        item_id: input.itemId,
        quantity: input.quantity,
        uom_id: input.uomId || item.stock_uom_id,
        is_active: false,
        is_default: false,
        status: 'Draft',
        description: input.description,
        routing_id: input.routingId,
        rm_cost_as_per_valuation_rate: input.rmCostAsPerValuationRate,
        with_operations: input.withOperations,
        currency: input.currency,
        conversion_rate: input.conversionRate,
        transfer_material_against: input.transferMaterialAgainstType,
        quality_inspection_required: input.qualityInspectionRequired,
        quality_inspection_template: input.qualityInspectionTemplate,
        raw_material_cost: 0,
        operating_cost: 0,
        scrap_material_cost: 0,
        total_cost: 0,
      })
      .select()
      .single();

    if (bomError) {
      throw new ManufacturingError(`Failed to create BOM: ${bomError.message}`);
    }

    // Insert BOM items
    const bomItems: BomItem[] = [];
    for (let i = 0; i < input.items.length; i++) {
      const itemInput = input.items[i];

      // Get item details for rate if using valuation rate
      let rate = itemInput.rate || 0;
      if (input.rmCostAsPerValuationRate && !itemInput.rate) {
        const { data: itemValuation } = await supabase
          .from('items')
          .select('valuation_rate')
          .eq('id', itemInput.itemId)
          .single();
        rate = parseFloat(itemValuation?.valuation_rate) || 0;
      }

      const stockQty = itemInput.quantity * (itemInput.conversionFactor || 1);
      const amount = stockQty * rate;

      const { data: bomItemData, error: bomItemError } = await supabase
        .from('bom_items')
        .insert({
          bom_id: bom.id,
          item_id: itemInput.itemId,
          item_sequence: itemInput.itemSequence || i + 1,
          qty: itemInput.quantity,
          uom_id: itemInput.uomId,
          conversion_factor: itemInput.conversionFactor || 1,
          stock_qty: stockQty,
          rate: rate,
          amount: amount,
          sourced_by_manufacturer: itemInput.sourcedByManufacturer,
          bom_id_sub: itemInput.bomId_sub,
          description: itemInput.description,
          include_item_in_manufacturing: itemInput.includeItemInManufacturing,
          original_item_id: itemInput.originalItemId,
          allow_alternative_item: itemInput.allowAlternativeItem,
          operation_id: itemInput.operationId,
        })
        .select()
        .single();

      if (bomItemError) {
        throw new ManufacturingError(`Failed to create BOM item: ${bomItemError.message}`);
      }

      bomItems.push(this.mapDbToBomItem(bomItemData));
    }

    // Insert BOM operations
    const bomOperations: BomOperation[] = [];
    if (input.operations && input.operations.length > 0) {
      for (const opInput of input.operations) {
        // Get operation details
        const { data: operation } = await supabase
          .from('operations')
          .select('operation_name')
          .eq('id', opInput.operationId)
          .single();

        // Get workstation rate if not provided
        let hourRate = opInput.hourRate || 0;
        if (!hourRate && opInput.workstationId) {
          const { data: workstation } = await supabase
            .from('workstations')
            .select('hour_rate')
            .eq('id', opInput.workstationId)
            .single();
          hourRate = parseFloat(workstation?.hour_rate) || 0;
        }

        const operatingCost = (opInput.timeInMinutes / 60) * hourRate;

        const { data: bomOpData, error: bomOpError } = await supabase
          .from('bom_operations')
          .insert({
            bom_id: bom.id,
            operation_id: opInput.operationId,
            sequence: opInput.sequence,
            workstation_id: opInput.workstationId,
            description: opInput.description,
            time_in_minutes: opInput.timeInMinutes,
            hour_rate: hourRate,
            operating_cost: operatingCost,
            batch_size: opInput.batchSize,
            set_up_time: opInput.setUpTime,
            fixed_time: opInput.fixedTime,
          })
          .select()
          .single();

        if (bomOpError) {
          throw new ManufacturingError(`Failed to create BOM operation: ${bomOpError.message}`);
        }

        bomOperations.push({
          ...this.mapDbToBomOperation(bomOpData),
          operationName: operation?.operation_name,
        });
      }
    }

    // Insert BOM scrap items
    const bomScrapItems: BomScrapItem[] = [];
    if (input.scrapItems && input.scrapItems.length > 0) {
      for (const scrapInput of input.scrapItems) {
        const { data: scrapData, error: scrapError } = await supabase
          .from('bom_scrap_items')
          .insert({
            bom_id: bom.id,
            item_id: scrapInput.itemId,
            qty: scrapInput.quantity,
            uom_id: scrapInput.uomId,
            stock_qty: scrapInput.quantity,
            rate: scrapInput.rate || 0,
            amount: scrapInput.quantity * (scrapInput.rate || 0),
          })
          .select()
          .single();

        if (scrapError) {
          throw new ManufacturingError(`Failed to create BOM scrap item: ${scrapError.message}`);
        }

        bomScrapItems.push(this.mapDbToBomScrapItem(scrapData));
      }
    }

    // Calculate costs
    await this.calculateCosts(bom.id);

    // Get updated BOM
    return this.getById(bom.id);
  }

  /**
   * Get BOM by ID with all details
   */
  static async getById(id: string): Promise<BomWithDetails> {
    const supabase = await createClient();

    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select(`
        *,
        items!boms_item_id_fkey (item_code, item_name),
        uoms (uom_name)
      `)
      .eq('id', id)
      .single();

    if (bomError || !bom) {
      throw new ManufacturingError(`BOM not found: ${id}`);
    }

    // Get BOM items
    const { data: items } = await supabase
      .from('bom_items')
      .select(`
        *,
        items (item_code, item_name),
        uoms (uom_name),
        operations (operation_name)
      `)
      .eq('bom_id', id)
      .order('item_sequence');

    // Get BOM operations
    const { data: operations } = await supabase
      .from('bom_operations')
      .select(`
        *,
        operations (operation_name),
        workstations (workstation_name)
      `)
      .eq('bom_id', id)
      .order('sequence');

    // Get BOM scrap items
    const { data: scrapItems } = await supabase
      .from('bom_scrap_items')
      .select(`
        *,
        items (item_code, item_name)
      `)
      .eq('bom_id', id);

    return {
      ...this.mapDbToBom(bom),
      itemCode: bom.items?.item_code,
      itemName: bom.items?.item_name,
      uomName: bom.uoms?.uom_name,
      items: (items || []).map(i => ({
        ...this.mapDbToBomItem(i),
        itemCode: i.items?.item_code,
        itemName: i.items?.item_name,
        uomName: i.uoms?.uom_name,
        operationName: i.operations?.operation_name,
      })),
      operations: (operations || []).map(o => ({
        ...this.mapDbToBomOperation(o),
        operationName: o.operations?.operation_name,
        workstationName: o.workstations?.workstation_name,
      })),
      scrapItems: (scrapItems || []).map(s => ({
        ...this.mapDbToBomScrapItem(s),
        itemCode: s.items?.item_code,
        itemName: s.items?.item_name,
      })),
    };
  }

  /**
   * Get default BOM for an item
   */
  static async getDefaultBom(itemId: string): Promise<BomWithDetails | null> {
    const supabase = await createClient();

    const { data: bom, error } = await supabase
      .from('boms')
      .select('id')
      .eq('item_id', itemId)
      .eq('is_default', true)
      .eq('is_active', true)
      .eq('status', 'Submitted')
      .single();

    if (error || !bom) {
      return null;
    }

    return this.getById(bom.id);
  }

  /**
   * List BOMs
   */
  static async list(filters: {
    orgId: string;
    itemId?: string;
    isActive?: boolean;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Bom[]> {
    const supabase = await createClient();

    let query = supabase
      .from('boms')
      .select(`
        *,
        items!boms_item_id_fkey (item_code, item_name)
      `)
      .eq('org_id', filters.orgId)
      .order('bom_no', { ascending: false });

    if (filters.itemId) {
      query = query.eq('item_id', filters.itemId);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(
        `bom_no.ilike.%${filters.search}%,items.item_code.ilike.%${filters.search}%,items.item_name.ilike.%${filters.search}%`
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
      throw new ManufacturingError(`Failed to list BOMs: ${error.message}`);
    }

    return (data || []).map(b => ({
      ...this.mapDbToBom(b),
      itemCode: b.items?.item_code,
      itemName: b.items?.item_name,
    }));
  }

  /**
   * Submit BOM (make it active)
   */
  static async submit(id: string): Promise<BomWithDetails> {
    const supabase = await createClient();

    const bom = await this.getById(id);

    if (bom.status !== 'Draft') {
      throw new ManufacturingError('Only draft BOMs can be submitted');
    }

    if (bom.items.length === 0) {
      throw new ManufacturingError('BOM must have at least one item');
    }

    // Validate all sub-BOMs are submitted
    for (const item of bom.items) {
      if (item.bomId_sub) {
        const { data: subBom } = await supabase
          .from('boms')
          .select('status')
          .eq('id', item.bomId_sub)
          .single();

        if (!subBom || subBom.status !== 'Submitted') {
          throw new ManufacturingError(
            `Sub-assembly BOM for item ${item.itemCode} is not submitted`
          );
        }
      }
    }

    // Update exploded items
    await this.updateExplodedItems(id);

    // Submit BOM
    const { error } = await supabase
      .from('boms')
      .update({
        status: 'Submitted',
        is_active: true,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new ManufacturingError(`Failed to submit BOM: ${error.message}`);
    }

    return this.getById(id);
  }

  /**
   * Set as default BOM
   */
  static async setAsDefault(id: string): Promise<void> {
    const supabase = await createClient();

    const bom = await this.getById(id);

    if (bom.status !== 'Submitted') {
      throw new ManufacturingError('Only submitted BOMs can be set as default');
    }

    // Clear existing default
    await supabase
      .from('boms')
      .update({ is_default: false })
      .eq('item_id', bom.itemId)
      .eq('org_id', bom.orgId);

    // Set new default
    await supabase
      .from('boms')
      .update({ is_default: true })
      .eq('id', id);
  }

  /**
   * Cancel BOM
   */
  static async cancel(id: string): Promise<void> {
    const supabase = await createClient();

    const bom = await this.getById(id);

    // Check if used in any work orders
    const { data: workOrders } = await supabase
      .from('work_orders')
      .select('id')
      .eq('bom_id', id)
      .not('status', 'eq', 'Cancelled')
      .limit(1);

    if (workOrders && workOrders.length > 0) {
      throw new ManufacturingError('Cannot cancel BOM used in work orders');
    }

    // Check if used as sub-BOM
    const { data: parentBoms } = await supabase
      .from('bom_items')
      .select('bom_id')
      .eq('bom_id_sub', id)
      .limit(1);

    if (parentBoms && parentBoms.length > 0) {
      throw new ManufacturingError('Cannot cancel BOM used as sub-assembly in other BOMs');
    }

    await supabase
      .from('boms')
      .update({
        status: 'Cancelled',
        is_active: false,
        is_default: false,
      })
      .eq('id', id);
  }

  /**
   * Calculate BOM costs
   */
  static async calculateCosts(id: string): Promise<BomCostBreakdown> {
    const supabase = await createClient();

    const bom = await this.getById(id);

    let rawMaterialCost = 0;
    let operatingCost = 0;
    let scrapMaterialCost = 0;

    const breakdown: BomCostBreakdown['breakdown'] = {
      materials: [],
      operations: [],
      scrap: [],
    };

    // Calculate raw material cost
    for (const item of bom.items) {
      if (!item.includeItemInManufacturing) continue;

      let rate = item.rate;
      if (bom.rmCostAsPerValuationRate) {
        const { data: itemData } = await supabase
          .from('items')
          .select('valuation_rate')
          .eq('id', item.itemId)
          .single();
        rate = parseFloat(itemData?.valuation_rate) || 0;
      }

      const amount = item.stockQty * rate;
      rawMaterialCost += amount;

      breakdown.materials.push({
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        qty: item.stockQty,
        rate: rate,
        amount: amount,
      });
    }

    // Calculate operating cost
    for (const op of bom.operations) {
      const cost = (op.timeInMinutes / 60) * op.hourRate;
      operatingCost += cost;

      breakdown.operations.push({
        operationName: op.operationName || '',
        workstationName: op.workstationName,
        timeMinutes: op.timeInMinutes,
        hourRate: op.hourRate,
        cost: cost,
      });
    }

    // Calculate scrap recovery
    for (const scrap of bom.scrapItems) {
      const recovery = scrap.stockQty * scrap.rate;
      scrapMaterialCost += recovery;

      breakdown.scrap.push({
        itemCode: scrap.itemCode || '',
        itemName: scrap.itemName || '',
        qty: scrap.stockQty,
        rate: scrap.rate,
        recovery: recovery,
      });
    }

    const totalCost = rawMaterialCost + operatingCost - scrapMaterialCost;

    // Update BOM costs
    await supabase
      .from('boms')
      .update({
        raw_material_cost: rawMaterialCost,
        operating_cost: operatingCost,
        scrap_material_cost: scrapMaterialCost,
        total_cost: totalCost,
      })
      .eq('id', id);

    return {
      bomId: bom.id,
      itemCode: bom.itemCode || '',
      itemName: bom.itemName || '',
      quantity: bom.quantity,
      rawMaterialCost,
      operatingCost,
      scrapRecovery: scrapMaterialCost,
      totalCost,
      costPerUnit: totalCost / bom.quantity,
      breakdown,
    };
  }

  /**
   * Update exploded items (flatten multi-level BOM)
   */
  static async updateExplodedItems(id: string): Promise<BomExplodedItem[]> {
    const supabase = await createClient();

    // Clear existing exploded items
    await supabase.from('bom_exploded_items').delete().eq('bom_id', id);

    const bom = await this.getById(id);
    const explodedItems: BomExplodedItem[] = [];

    const explodeBom = async (
      bomId: string,
      parentQty: number,
      level: number
    ) => {
      const bomData = await this.getById(bomId);

      for (const item of bomData.items) {
        const qty = item.stockQty * (parentQty / bomData.quantity);

        if (item.bomId_sub) {
          // Sub-assembly - recurse
          await explodeBom(item.bomId_sub, qty, level + 1);
        } else {
          // Raw material - add to list
          const { data: explodedItem, error } = await supabase
            .from('bom_exploded_items')
            .insert({
              bom_id: id,
              item_id: item.itemId,
              source_bom_id: bomId,
              bom_level: level,
              qty: qty,
              stock_qty: qty,
              rate: item.rate,
              amount: qty * item.rate,
              description: item.description,
            })
            .select()
            .single();

          if (!error && explodedItem) {
            explodedItems.push(this.mapDbToExplodedItem(explodedItem));
          }
        }
      }
    };

    await explodeBom(id, bom.quantity, 0);

    return explodedItems;
  }

  /**
   * Get BOM tree (visual hierarchy)
   */
  static async getTree(id: string): Promise<BomTreeNode> {
    const bom = await this.getById(id);

    const buildTree = async (
      bomData: BomWithDetails,
      qty: number,
      level: number
    ): Promise<BomTreeNode> => {
      const children: BomTreeNode[] = [];

      for (const item of bomData.items) {
        const itemQty = item.stockQty * (qty / bomData.quantity);

        if (item.bomId_sub) {
          const subBom = await this.getById(item.bomId_sub);
          const childNode = await buildTree(subBom, itemQty, level + 1);
          children.push(childNode);
        } else {
          children.push({
            bomId: bomData.id,
            itemId: item.itemId,
            itemCode: item.itemCode || '',
            itemName: item.itemName || '',
            quantity: itemQty,
            uomName: item.uomName || '',
            rate: item.rate,
            amount: itemQty * item.rate,
            level: level + 1,
            children: [],
          });
        }
      }

      return {
        bomId: bomData.id,
        itemId: bomData.itemId,
        itemCode: bomData.itemCode || '',
        itemName: bomData.itemName || '',
        quantity: qty,
        uomName: bomData.uomName || '',
        rate: bomData.totalCost / bomData.quantity,
        amount: (bomData.totalCost / bomData.quantity) * qty,
        level,
        children,
      };
    };

    return buildTree(bom, bom.quantity, 0);
  }

  /**
   * Check for circular BOM dependency
   */
  private static async checkCircularDependency(
    parentItemId: string,
    subBomId: string,
    visited: Set<string> = new Set()
  ): Promise<void> {
    const supabase = await createClient();

    if (visited.has(subBomId)) {
      throw new ManufacturingError('Circular BOM dependency detected');
    }

    visited.add(subBomId);

    const { data: subBom } = await supabase
      .from('boms')
      .select('id, item_id')
      .eq('id', subBomId)
      .single();

    if (!subBom) return;

    if (subBom.item_id === parentItemId) {
      throw new ManufacturingError('Circular BOM dependency: item references itself');
    }

    // Check sub-BOM's items
    const { data: items } = await supabase
      .from('bom_items')
      .select('bom_id_sub')
      .eq('bom_id', subBomId)
      .not('bom_id_sub', 'is', null);

    for (const item of items || []) {
      if (item.bom_id_sub) {
        await this.checkCircularDependency(parentItemId, item.bom_id_sub, visited);
      }
    }
  }

  /**
   * Copy BOM
   */
  static async copy(id: string, newItemId?: string): Promise<BomWithDetails> {
    const sourceBom = await this.getById(id);

    const createInput: CreateBom = {
      orgId: sourceBom.orgId,
      itemId: newItemId || sourceBom.itemId,
      quantity: sourceBom.quantity,
      uomId: sourceBom.uomId,
      description: sourceBom.description,
      routingId: sourceBom.routingId,
      rmCostAsPerValuationRate: sourceBom.rmCostAsPerValuationRate,
      withOperations: sourceBom.withOperations,
      currency: sourceBom.currency,
      conversionRate: sourceBom.conversionRate,
      transferMaterialAgainstType: sourceBom.transferMaterialAgainstType,
      qualityInspectionRequired: sourceBom.qualityInspectionRequired,
      qualityInspectionTemplate: sourceBom.qualityInspectionTemplate,
      items: sourceBom.items.map(i => ({
        itemId: i.itemId,
        itemSequence: i.itemSequence,
        quantity: i.quantity,
        uomId: i.uomId,
        conversionFactor: i.conversionFactor,
        rate: i.rate,
        sourcedByManufacturer: i.sourcedByManufacturer,
        bomId_sub: i.bomId_sub,
        description: i.description,
        includeItemInManufacturing: i.includeItemInManufacturing,
        originalItemId: i.originalItemId,
        allowAlternativeItem: i.allowAlternativeItem,
        operationId: i.operationId,
      })),
      operations: sourceBom.operations.map(o => ({
        operationId: o.operationId,
        sequence: o.sequence,
        workstationId: o.workstationId,
        description: o.description,
        timeInMinutes: o.timeInMinutes,
        hourRate: o.hourRate,
        batchSize: o.batchSize,
        setUpTime: o.setUpTime,
        fixedTime: o.fixedTime,
      })),
      scrapItems: sourceBom.scrapItems.map(s => ({
        itemId: s.itemId,
        quantity: s.quantity,
        uomId: s.uomId,
        rate: s.rate,
      })),
    };

    return this.create(createInput);
  }

  // Mapping functions
  private static mapDbToBom(row: any): Bom {
    return {
      id: row.id,
      orgId: row.org_id,
      bomNo: row.bom_no,
      itemId: row.item_id,
      quantity: parseFloat(row.quantity) || 1,
      uomId: row.uom_id,
      isActive: row.is_active ?? false,
      isDefault: row.is_default ?? false,
      status: row.status || 'Draft',
      description: row.description,
      routingId: row.routing_id,
      rmCostAsPerValuationRate: row.rm_cost_as_per_valuation_rate ?? true,
      withOperations: row.with_operations ?? false,
      currency: row.currency || 'PHP',
      conversionRate: parseFloat(row.conversion_rate) || 1,
      rawMaterialCost: parseFloat(row.raw_material_cost) || 0,
      operatingCost: parseFloat(row.operating_cost) || 0,
      scrapMaterialCost: parseFloat(row.scrap_material_cost) || 0,
      totalCost: parseFloat(row.total_cost) || 0,
      transferMaterialAgainstType: row.transfer_material_against || 'Work Order',
      qualityInspectionRequired: row.quality_inspection_required ?? false,
      qualityInspectionTemplate: row.quality_inspection_template,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      submittedBy: row.submitted_by,
    };
  }

  private static mapDbToBomItem(row: any): BomItem {
    return {
      id: row.id,
      bomId: row.bom_id,
      itemId: row.item_id,
      itemSequence: row.item_sequence || 0,
      quantity: parseFloat(row.qty) || 0,
      uomId: row.uom_id,
      conversionFactor: parseFloat(row.conversion_factor) || 1,
      stockQty: parseFloat(row.stock_qty) || 0,
      stockUomId: row.stock_uom_id,
      rate: parseFloat(row.rate) || 0,
      amount: parseFloat(row.amount) || 0,
      sourcedByManufacturer: row.sourced_by_manufacturer ?? false,
      bomId_sub: row.bom_id_sub,
      sourceBomNo: row.source_bom_no,
      description: row.description,
      includeItemInManufacturing: row.include_item_in_manufacturing ?? true,
      originalItemId: row.original_item_id,
      allowAlternativeItem: row.allow_alternative_item ?? false,
      operationId: row.operation_id,
    };
  }

  private static mapDbToBomOperation(row: any): BomOperation {
    return {
      id: row.id,
      bomId: row.bom_id,
      operationId: row.operation_id,
      sequence: row.sequence || 0,
      workstationId: row.workstation_id,
      description: row.description,
      timeInMinutes: parseFloat(row.time_in_minutes) || 0,
      hourRate: parseFloat(row.hour_rate) || 0,
      operatingCost: parseFloat(row.operating_cost) || 0,
      batchSize: parseFloat(row.batch_size) || 1,
      setUpTime: parseFloat(row.set_up_time) || 0,
      fixedTime: row.fixed_time ?? false,
    };
  }

  private static mapDbToBomScrapItem(row: any): BomScrapItem {
    return {
      id: row.id,
      bomId: row.bom_id,
      itemId: row.item_id,
      quantity: parseFloat(row.qty) || 0,
      uomId: row.uom_id,
      stockQty: parseFloat(row.stock_qty) || 0,
      rate: parseFloat(row.rate) || 0,
      amount: parseFloat(row.amount) || 0,
    };
  }

  private static mapDbToExplodedItem(row: any): BomExplodedItem {
    return {
      id: row.id,
      bomId: row.bom_id,
      itemId: row.item_id,
      sourceBomId: row.source_bom_id,
      sourceBomNo: row.source_bom_no,
      bomLevel: row.bom_level || 0,
      quantity: parseFloat(row.qty) || 0,
      stockQty: parseFloat(row.stock_qty) || 0,
      rate: parseFloat(row.rate) || 0,
      amount: parseFloat(row.amount) || 0,
      description: row.description,
    };
  }
}
