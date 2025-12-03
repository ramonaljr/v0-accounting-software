/**
 * Warehouse Service
 * Manages warehouse/location master data
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Warehouse,
  CreateWarehouse,
  UpdateWarehouse,
  WarehouseListFilters,
  WarehouseWithChildren,
  WarehouseStockSummary,
} from '@/lib/models/stock/warehouse';
import { StockLedgerError } from './stock-ledger.service';

export class WarehouseService {
  /**
   * Create a new warehouse
   */
  static async create(input: CreateWarehouse): Promise<Warehouse> {
    const supabase = await createClient();

    // Generate warehouse code if not provided
    let warehouseCode = input.warehouseCode;
    if (!warehouseCode) {
      warehouseCode = input.warehouseName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10);

      // Check if code exists and append number if needed
      const { data: existing } = await supabase
        .from('warehouses')
        .select('warehouse_code')
        .eq('org_id', input.orgId)
        .like('warehouse_code', `${warehouseCode}%`)
        .order('warehouse_code', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        const lastCode = existing[0].warehouse_code;
        const match = lastCode.match(/(\d+)$/);
        const nextNum = match ? parseInt(match[1]) + 1 : 2;
        warehouseCode = `${warehouseCode}${nextNum}`;
      }
    }

    // Validate parent if provided
    if (input.parentId) {
      const { data: parent, error: parentError } = await supabase
        .from('warehouses')
        .select('id, is_group, org_id')
        .eq('id', input.parentId)
        .single();

      if (parentError || !parent) {
        throw new StockLedgerError('Parent warehouse not found');
      }

      if (parent.org_id !== input.orgId) {
        throw new StockLedgerError('Parent warehouse must belong to the same organization');
      }

      if (!parent.is_group) {
        throw new StockLedgerError('Parent warehouse must be a group warehouse');
      }
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        org_id: input.orgId,
        warehouse_code: warehouseCode,
        warehouse_name: input.warehouseName,
        parent_id: input.parentId,
        is_group: input.isGroup || false,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2,
        city: input.city,
        state_province: input.stateProvince,
        postal_code: input.postalCode,
        country: input.country || 'Philippines',
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        account_id: input.accountId,
        is_rejected_warehouse: input.isRejectedWarehouse || false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new StockLedgerError('Warehouse code or name already exists');
      }
      throw new StockLedgerError(`Failed to create warehouse: ${error.message}`);
    }

    // Update nested set values
    await this.updateNestedSet(input.orgId);

    return this.mapDbToWarehouse(data);
  }

  /**
   * Get warehouse by ID
   */
  static async getById(id: string): Promise<Warehouse> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new StockLedgerError(`Warehouse not found: ${id}`);
    }

    return this.mapDbToWarehouse(data);
  }

  /**
   * Get warehouse by code
   */
  static async getByCode(orgId: string, code: string): Promise<Warehouse | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('org_id', orgId)
      .eq('warehouse_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new StockLedgerError(`Failed to fetch warehouse: ${error.message}`);
    }

    return this.mapDbToWarehouse(data);
  }

  /**
   * List warehouses
   */
  static async list(filters: WarehouseListFilters): Promise<Warehouse[]> {
    const supabase = await createClient();

    let query = supabase
      .from('warehouses')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('warehouse_name');

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.isGroup !== undefined) {
      query = query.eq('is_group', filters.isGroup);
    }

    if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parentId);
      }
    }

    if (filters.search) {
      query = query.or(
        `warehouse_name.ilike.%${filters.search}%,warehouse_code.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new StockLedgerError(`Failed to list warehouses: ${error.message}`);
    }

    return (data || []).map(this.mapDbToWarehouse);
  }

  /**
   * Get warehouse tree
   */
  static async getTree(orgId: string, activeOnly: boolean = true): Promise<WarehouseWithChildren[]> {
    const warehouses = await this.list({
      orgId,
      isActive: activeOnly ? true : undefined,
    });

    return this.buildTree(warehouses);
  }

  /**
   * Build hierarchical tree from flat list
   */
  private static buildTree(warehouses: Warehouse[]): WarehouseWithChildren[] {
    const warehouseMap = new Map<string, WarehouseWithChildren>();
    const roots: WarehouseWithChildren[] = [];

    // First pass: create all nodes
    for (const warehouse of warehouses) {
      warehouseMap.set(warehouse.id, { ...warehouse, children: [], level: 0 });
    }

    // Second pass: build hierarchy
    for (const warehouse of warehouses) {
      const node = warehouseMap.get(warehouse.id)!;

      if (warehouse.parentId) {
        const parent = warehouseMap.get(warehouse.parentId);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    // Sort children by name
    const sortChildren = (nodes: WarehouseWithChildren[]) => {
      nodes.sort((a, b) => a.warehouseName.localeCompare(b.warehouseName));
      for (const node of nodes) {
        if (node.children.length > 0) {
          sortChildren(node.children);
        }
      }
    };

    sortChildren(roots);
    return roots;
  }

  /**
   * Update warehouse
   */
  static async update(input: UpdateWarehouse): Promise<Warehouse> {
    const supabase = await createClient();

    const existing = await this.getById(input.id);

    // Can't change to group if has stock
    if (input.isGroup === true && !existing.isGroup) {
      const { data: bins } = await supabase
        .from('bins')
        .select('id')
        .eq('warehouse_id', input.id)
        .gt('actual_qty', 0)
        .limit(1);

      if (bins && bins.length > 0) {
        throw new StockLedgerError(
          'Cannot convert to group warehouse. Warehouse has stock.'
        );
      }
    }

    const updateData: any = {};

    if (input.warehouseName !== undefined) updateData.warehouse_name = input.warehouseName;
    if (input.parentId !== undefined) updateData.parent_id = input.parentId;
    if (input.isGroup !== undefined) updateData.is_group = input.isGroup;
    if (input.addressLine1 !== undefined) updateData.address_line1 = input.addressLine1;
    if (input.addressLine2 !== undefined) updateData.address_line2 = input.addressLine2;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.stateProvince !== undefined) updateData.state_province = input.stateProvince;
    if (input.postalCode !== undefined) updateData.postal_code = input.postalCode;
    if (input.country !== undefined) updateData.country = input.country;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.mobile !== undefined) updateData.mobile = input.mobile;
    if (input.accountId !== undefined) updateData.account_id = input.accountId;
    if (input.isRejectedWarehouse !== undefined) {
      updateData.is_rejected_warehouse = input.isRejectedWarehouse;
    }
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await supabase
      .from('warehouses')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw new StockLedgerError(`Failed to update warehouse: ${error.message}`);
    }

    // Update nested set if parent changed
    if (input.parentId !== undefined && input.parentId !== existing.parentId) {
      await this.updateNestedSet(existing.orgId);
    }

    return this.mapDbToWarehouse(data);
  }

  /**
   * Delete warehouse
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const existing = await this.getById(id);

    // Check for stock
    const { data: bins } = await supabase
      .from('bins')
      .select('actual_qty')
      .eq('warehouse_id', id)
      .gt('actual_qty', 0)
      .limit(1);

    if (bins && bins.length > 0) {
      throw new StockLedgerError(
        'Cannot delete warehouse with existing stock. Deactivate it instead.'
      );
    }

    // Check for child warehouses
    const { data: children } = await supabase
      .from('warehouses')
      .select('id')
      .eq('parent_id', id)
      .limit(1);

    if (children && children.length > 0) {
      throw new StockLedgerError('Cannot delete warehouse with child warehouses');
    }

    const { error } = await supabase.from('warehouses').delete().eq('id', id);

    if (error) {
      throw new StockLedgerError(`Failed to delete warehouse: ${error.message}`);
    }

    // Update nested set
    await this.updateNestedSet(existing.orgId);
  }

  /**
   * Get warehouse stock summary
   */
  static async getStockSummary(id: string): Promise<WarehouseStockSummary> {
    const supabase = await createClient();

    const warehouse = await this.getById(id);

    const { data: bins } = await supabase
      .from('bins')
      .select('item_id, actual_qty, stock_value')
      .eq('warehouse_id', id)
      .gt('actual_qty', 0);

    const totalItems = (bins || []).length;
    const totalValue = (bins || []).reduce(
      (sum, b) => sum + parseFloat(b.stock_value || '0'),
      0
    );

    return {
      warehouseId: warehouse.id,
      warehouseName: warehouse.warehouseName,
      totalItems,
      totalValue,
    };
  }

  /**
   * Get all child warehouse IDs (including nested children)
   */
  static async getChildWarehouseIds(id: string): Promise<string[]> {
    const supabase = await createClient();

    const warehouse = await this.getById(id);

    // Use nested set for efficient query
    const { data, error } = await supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', warehouse.orgId)
      .gt('lft', warehouse.lft)
      .lt('rgt', warehouse.rgt);

    if (error) {
      throw new StockLedgerError(`Failed to get child warehouses: ${error.message}`);
    }

    return (data || []).map(w => w.id);
  }

  /**
   * Update nested set values (lft/rgt) for warehouses
   */
  private static async updateNestedSet(orgId: string): Promise<void> {
    const supabase = await createClient();

    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('id, parent_id, warehouse_name')
      .eq('org_id', orgId)
      .order('warehouse_name');

    if (error || !warehouses) {
      return;
    }

    let counter = 1;

    const assignValues = async (
      parentId: string | null,
      nodes: typeof warehouses
    ) => {
      const children = nodes.filter(n => n.parent_id === parentId);
      children.sort((a, b) => a.warehouse_name.localeCompare(b.warehouse_name));

      for (const child of children) {
        const lft = counter++;
        await assignValues(child.id, nodes);
        const rgt = counter++;

        await supabase
          .from('warehouses')
          .update({ lft, rgt })
          .eq('id', child.id);
      }
    };

    await assignValues(null, warehouses);
  }

  /**
   * Map database row to Warehouse type
   */
  private static mapDbToWarehouse(row: any): Warehouse {
    return {
      id: row.id,
      orgId: row.org_id,
      warehouseCode: row.warehouse_code,
      warehouseName: row.warehouse_name,
      parentId: row.parent_id,
      isGroup: row.is_group || false,
      lft: row.lft || 0,
      rgt: row.rgt || 0,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      stateProvince: row.state_province,
      postalCode: row.postal_code,
      country: row.country || 'Philippines',
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      accountId: row.account_id,
      isActive: row.is_active ?? true,
      isRejectedWarehouse: row.is_rejected_warehouse || false,
      defaultInTransitWarehouseId: row.default_in_transit_warehouse,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  }
}
