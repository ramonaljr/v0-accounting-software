/**
 * Item Service
 * Manages item master data
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Item,
  CreateItem,
  UpdateItem,
  ItemListFilters,
  ItemWithStock,
  ItemGroup,
  Uom,
} from '@/lib/models/stock/item';
import { StockLedgerError } from './stock-ledger.service';

export class ItemService {
  /**
   * Create a new item
   */
  static async create(input: CreateItem): Promise<Item> {
    const supabase = await createClient();

    // Generate item code if not provided
    let itemCode = input.itemCode;
    if (!itemCode) {
      const { data: lastItem } = await supabase
        .from('items')
        .select('item_code')
        .eq('org_id', input.orgId)
        .like('item_code', 'ITEM-%')
        .order('item_code', { ascending: false })
        .limit(1);

      const lastNum = lastItem?.[0]?.item_code
        ? parseInt(lastItem[0].item_code.replace('ITEM-', '')) || 0
        : 0;
      itemCode = `ITEM-${String(lastNum + 1).padStart(5, '0')}`;
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        org_id: input.orgId,
        item_code: itemCode,
        item_name: input.itemName,
        description: input.description,
        item_group_id: input.itemGroupId,
        brand: input.brand,
        is_stock_item: input.isStockItem ?? true,
        stock_uom_id: input.stockUomId,
        valuation_method: input.valuationMethod || 'Moving Average',
        has_serial_no: input.hasSerialNo || false,
        has_batch_no: input.hasBatchNo || false,
        has_expiry_date: input.hasExpiryDate || false,
        shelf_life_days: input.shelfLifeDays,
        is_purchase_item: input.isPurchaseItem ?? true,
        is_sales_item: input.isSalesItem ?? true,
        standard_rate: input.standardRate || 0,
        valuation_rate: 0,
        default_warehouse_id: input.defaultWarehouseId,
        expense_account_id: input.expenseAccountId,
        income_account_id: input.incomeAccountId,
        reorder_level: input.reorderLevel || 0,
        reorder_qty: input.reorderQty || 0,
        safety_stock: input.safetyStock || 0,
        weight_per_unit: input.weightPerUnit,
        weight_uom: input.weightUom,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new StockLedgerError('Item code already exists');
      }
      throw new StockLedgerError(`Failed to create item: ${error.message}`);
    }

    return this.mapDbToItem(data);
  }

  /**
   * Get item by ID
   */
  static async getById(id: string): Promise<Item> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new StockLedgerError(`Item not found: ${id}`);
    }

    return this.mapDbToItem(data);
  }

  /**
   * Get item by code
   */
  static async getByCode(orgId: string, code: string): Promise<Item | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('org_id', orgId)
      .eq('item_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new StockLedgerError(`Failed to fetch item: ${error.message}`);
    }

    return this.mapDbToItem(data);
  }

  /**
   * List items
   */
  static async list(filters: ItemListFilters): Promise<Item[]> {
    const supabase = await createClient();

    let query = supabase
      .from('items')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('item_name');

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.isStockItem !== undefined) {
      query = query.eq('is_stock_item', filters.isStockItem);
    }

    if (filters.itemGroupId) {
      query = query.eq('item_group_id', filters.itemGroupId);
    }

    if (filters.isPurchaseItem !== undefined) {
      query = query.eq('is_purchase_item', filters.isPurchaseItem);
    }

    if (filters.isSalesItem !== undefined) {
      query = query.eq('is_sales_item', filters.isSalesItem);
    }

    if (filters.search) {
      query = query.or(
        `item_name.ilike.%${filters.search}%,item_code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
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
      throw new StockLedgerError(`Failed to list items: ${error.message}`);
    }

    return (data || []).map(this.mapDbToItem);
  }

  /**
   * Update item
   */
  static async update(input: UpdateItem): Promise<Item> {
    const supabase = await createClient();

    const existing = await this.getById(input.id);

    // Check if valuation method can be changed
    if (input.valuationMethod && input.valuationMethod !== existing.valuation_method) {
      const { data: bins } = await supabase
        .from('bins')
        .select('actual_qty')
        .eq('item_id', input.id)
        .gt('actual_qty', 0)
        .limit(1);

      if (bins && bins.length > 0) {
        throw new StockLedgerError(
          'Cannot change valuation method for items with existing stock'
        );
      }
    }

    const updateData: any = {};

    if (input.itemName !== undefined) updateData.item_name = input.itemName;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.itemGroupId !== undefined) updateData.item_group_id = input.itemGroupId;
    if (input.brand !== undefined) updateData.brand = input.brand;
    if (input.isStockItem !== undefined) updateData.is_stock_item = input.isStockItem;
    if (input.stockUomId !== undefined) updateData.stock_uom_id = input.stockUomId;
    if (input.valuationMethod !== undefined) updateData.valuation_method = input.valuationMethod;
    if (input.hasSerialNo !== undefined) updateData.has_serial_no = input.hasSerialNo;
    if (input.hasBatchNo !== undefined) updateData.has_batch_no = input.hasBatchNo;
    if (input.hasExpiryDate !== undefined) updateData.has_expiry_date = input.hasExpiryDate;
    if (input.shelfLifeDays !== undefined) updateData.shelf_life_days = input.shelfLifeDays;
    if (input.isPurchaseItem !== undefined) updateData.is_purchase_item = input.isPurchaseItem;
    if (input.isSalesItem !== undefined) updateData.is_sales_item = input.isSalesItem;
    if (input.standardRate !== undefined) updateData.standard_rate = input.standardRate;
    if (input.defaultWarehouseId !== undefined) updateData.default_warehouse_id = input.defaultWarehouseId;
    if (input.expenseAccountId !== undefined) updateData.expense_account_id = input.expenseAccountId;
    if (input.incomeAccountId !== undefined) updateData.income_account_id = input.incomeAccountId;
    if (input.reorderLevel !== undefined) updateData.reorder_level = input.reorderLevel;
    if (input.reorderQty !== undefined) updateData.reorder_qty = input.reorderQty;
    if (input.safetyStock !== undefined) updateData.safety_stock = input.safetyStock;
    if (input.weightPerUnit !== undefined) updateData.weight_per_unit = input.weightPerUnit;
    if (input.weightUom !== undefined) updateData.weight_uom = input.weightUom;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw new StockLedgerError(`Failed to update item: ${error.message}`);
    }

    return this.mapDbToItem(data);
  }

  /**
   * Delete item (soft delete by deactivating)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    // Check for stock
    const { data: bins } = await supabase
      .from('bins')
      .select('actual_qty')
      .eq('item_id', id)
      .gt('actual_qty', 0)
      .limit(1);

    if (bins && bins.length > 0) {
      throw new StockLedgerError(
        'Cannot delete item with existing stock. Deactivate it instead.'
      );
    }

    // Check for transactions
    const { data: sle } = await supabase
      .from('stock_ledger_entries')
      .select('id')
      .eq('item_id', id)
      .limit(1);

    if (sle && sle.length > 0) {
      throw new StockLedgerError(
        'Cannot delete item with stock history. Deactivate it instead.'
      );
    }

    const { error } = await supabase.from('items').delete().eq('id', id);

    if (error) {
      throw new StockLedgerError(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Get item with stock summary
   */
  static async getWithStock(id: string): Promise<ItemWithStock> {
    const supabase = await createClient();

    const item = await this.getById(id);

    // Get stock totals
    const { data: bins } = await supabase
      .from('bins')
      .select('actual_qty, stock_value, reserved_qty')
      .eq('item_id', id);

    const totalQty = (bins || []).reduce((sum, b) => sum + parseFloat(b.actual_qty), 0);
    const totalValue = (bins || []).reduce((sum, b) => sum + parseFloat(b.stock_value), 0);
    const reservedQty = (bins || []).reduce((sum, b) => sum + parseFloat(b.reserved_qty), 0);

    return {
      ...item,
      totalQty,
      totalValue,
      availableQty: totalQty - reservedQty,
    };
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(orgId: string): Promise<Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    warehouseId: string;
    actualQty: number;
    reorderLevel: number;
    shortfall: number;
  }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bins')
      .select(`
        item_id,
        warehouse_id,
        actual_qty,
        items!inner (
          item_code,
          item_name,
          reorder_level,
          org_id
        )
      `)
      .eq('items.org_id', orgId)
      .gt('items.reorder_level', 0);

    if (error) {
      throw new StockLedgerError(`Failed to get low stock items: ${error.message}`);
    }

    return (data || [])
      .filter((b: any) => parseFloat(b.actual_qty) <= b.items.reorder_level)
      .map((b: any) => ({
        itemId: b.item_id,
        itemCode: b.items.item_code,
        itemName: b.items.item_name,
        warehouseId: b.warehouse_id,
        actualQty: parseFloat(b.actual_qty),
        reorderLevel: b.items.reorder_level,
        shortfall: b.items.reorder_level - parseFloat(b.actual_qty),
      }));
  }

  /**
   * Get UOMs for organization
   */
  static async getUoms(orgId: string): Promise<Uom[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('uoms')
      .select('*')
      .eq('org_id', orgId)
      .order('uom_name');

    if (error) {
      throw new StockLedgerError(`Failed to get UOMs: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      uomName: row.uom_name,
      mustBeWholeNumber: row.must_be_whole_number || false,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get item groups for organization
   */
  static async getItemGroups(orgId: string): Promise<ItemGroup[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('item_groups')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('group_name');

    if (error) {
      throw new StockLedgerError(`Failed to get item groups: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      groupCode: row.group_code,
      groupName: row.group_name,
      parentId: row.parent_id,
      isGroup: row.is_group || false,
      lft: row.lft || 0,
      rgt: row.rgt || 0,
      defaultExpenseAccountId: row.default_expense_account_id,
      defaultIncomeAccountId: row.default_income_account_id,
      isActive: row.is_active ?? true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  /**
   * Map database row to Item type
   */
  private static mapDbToItem(row: any): Item {
    return {
      id: row.id,
      orgId: row.org_id,
      itemCode: row.item_code,
      itemName: row.item_name,
      description: row.description,
      itemGroupId: row.item_group_id,
      brand: row.brand,
      isStockItem: row.is_stock_item ?? true,
      stockUomId: row.stock_uom_id,
      valuation_method: row.valuation_method || 'Moving Average',
      hasSerialNo: row.has_serial_no || false,
      hasBatchNo: row.has_batch_no || false,
      hasExpiryDate: row.has_expiry_date || false,
      shelfLifeDays: row.shelf_life_days,
      isPurchaseItem: row.is_purchase_item ?? true,
      isSalesItem: row.is_sales_item ?? true,
      standardRate: parseFloat(row.standard_rate) || 0,
      valuationRate: parseFloat(row.valuation_rate) || 0,
      lastPurchaseRate: parseFloat(row.last_purchase_rate) || 0,
      defaultWarehouseId: row.default_warehouse_id,
      expenseAccountId: row.expense_account_id,
      incomeAccountId: row.income_account_id,
      reorderLevel: parseFloat(row.reorder_level) || 0,
      reorderQty: parseFloat(row.reorder_qty) || 0,
      safetyStock: parseFloat(row.safety_stock) || 0,
      weightPerUnit: row.weight_per_unit ? parseFloat(row.weight_per_unit) : undefined,
      weightUom: row.weight_uom,
      hasVariants: row.has_variants || false,
      variantOf: row.variant_of,
      isActive: row.is_active ?? true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  }
}
