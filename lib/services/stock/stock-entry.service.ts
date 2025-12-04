/**
 * Stock Entry Service
 * Manages stock movements: receipts, issues, transfers, manufacture
 * Based on ERPNext's Stock Entry controller
 */

import { createClient } from '@/lib/supabase/server';
import type {
  StockEntry,
  StockEntryItem,
  CreateStockEntry,
  UpdateStockEntry,
  StockEntryListFilters,
  StockEntryPurpose,
} from '@/lib/models/stock/stock-entry';
import {
  validateStockEntryItems,
  calculateStockEntryTotals,
} from '@/lib/models/stock/stock-entry';
import { StockLedgerService, StockLedgerError } from './stock-ledger.service';
import type { StockLedgerEntryInput } from '@/lib/models/stock/stock-ledger-entry';
import { LedgerService, AccountingError } from '../accounting/ledger.service';
import type { GLEntryInput } from '@/lib/models/accounting/gl-entry';

export class StockEntryService {
  /**
   * Create a new stock entry (draft)
   */
  static async create(input: CreateStockEntry): Promise<StockEntry> {
    const supabase = await createClient();

    // Validate items based on purpose
    const validation = validateStockEntryItems(input.purpose, input.items);
    if (!validation.valid) {
      throw new StockLedgerError(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Get item details for calculating amounts
    const itemIds = [...new Set(input.items.map(i => i.itemId))];
    const { data: itemsData } = await supabase
      .from('items')
      .select('id, item_code, item_name, valuation_rate')
      .in('id', itemIds);

    const itemMap = new Map(itemsData?.map(i => [i.id, i]) || []);

    // Calculate item amounts
    const processedItems = input.items.map((item, idx) => {
      const itemData = itemMap.get(item.itemId);
      const basicRate = item.basicRate ?? (itemData?.valuation_rate || 0);

      return {
        ...item,
        idx,
        itemCode: itemData?.item_code || '',
        itemName: itemData?.item_name || '',
        basicRate,
        basicAmount: item.qty * basicRate,
        stockUomQty: item.qty * (item.uomId ? 1 : 1),  // Apply conversion if UOM provided
      };
    });

    // Calculate totals
    const totals = calculateStockEntryTotals(processedItems.map(i => ({
      qty: i.qty,
      basicRate: i.basicRate,
      sWarehouseId: i.sWarehouseId,
      tWarehouseId: i.tWarehouseId,
    })));

    // Insert stock entry
    const postingTime = input.postingTime || new Date().toTimeString().split(' ')[0];

    const { data: entry, error: entryError } = await supabase
      .from('stock_entries')
      .insert({
        org_id: input.orgId,
        purpose: input.purpose,
        posting_date: input.postingDate.toISOString().split('T')[0],
        posting_time: postingTime,
        from_warehouse_id: input.fromWarehouseId,
        to_warehouse_id: input.toWarehouseId,
        work_order_id: input.workOrderId,
        bom_id: input.bomId,
        total_incoming_value: totals.totalIncomingValue,
        total_outgoing_value: totals.totalOutgoingValue,
        value_difference: totals.valueDifference,
        status: 'Draft',
        remarks: input.remarks,
      })
      .select()
      .single();

    if (entryError) {
      throw new StockLedgerError(`Failed to create stock entry: ${entryError.message}`);
    }

    // Insert items
    const itemsToInsert = processedItems.map((item) => ({
      stock_entry_id: entry.id,
      idx: item.idx,
      item_id: item.itemId,
      item_code: item.itemCode,
      item_name: item.itemName,
      s_warehouse_id: item.sWarehouseId,
      t_warehouse_id: item.tWarehouseId,
      qty: item.qty,
      uom_id: item.uomId,
      conversion_factor: 1,
      stock_uom_qty: item.stockUomQty,
      basic_rate: item.basicRate,
      basic_amount: item.basicAmount,
      valuation_rate: item.basicRate,
      additional_cost: 0,
      batch_id: item.batchId,
      serial_no: item.serialNo,
      is_finished_item: item.isFinishedItem || false,
      is_scrap_item: item.isScrapItem || false,
      expense_account_id: item.expenseAccountId,
      cost_center_id: item.costCenterId,
      project_id: item.projectId,
    }));

    const { error: itemsError } = await supabase
      .from('stock_entry_items')
      .insert(itemsToInsert);

    if (itemsError) {
      await supabase.from('stock_entries').delete().eq('id', entry.id);
      throw new StockLedgerError(`Failed to create stock entry items: ${itemsError.message}`);
    }

    return this.getById(entry.id);
  }

  /**
   * Get stock entry by ID
   */
  static async getById(id: string): Promise<StockEntry> {
    const supabase = await createClient();

    const { data: entry, error } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !entry) {
      throw new StockLedgerError(`Stock entry not found: ${id}`);
    }

    // Get items
    const { data: items } = await supabase
      .from('stock_entry_items')
      .select('*')
      .eq('stock_entry_id', id)
      .order('idx');

    return this.mapDbToStockEntry(entry, items || []);
  }

  /**
   * List stock entries
   */
  static async list(filters: StockEntryListFilters): Promise<StockEntry[]> {
    const supabase = await createClient();

    let query = supabase
      .from('stock_entries')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('posting_date', { ascending: false });

    if (filters.purpose) {
      query = query.eq('purpose', filters.purpose);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.fromDate) {
      query = query.gte('posting_date', filters.fromDate.toISOString().split('T')[0]);
    }

    if (filters.toDate) {
      query = query.lte('posting_date', filters.toDate.toISOString().split('T')[0]);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new StockLedgerError(`Failed to list stock entries: ${error.message}`);
    }

    return (data || []).map(e => this.mapDbToStockEntry(e, []));
  }

  /**
   * Update stock entry (drafts only)
   */
  static async update(input: UpdateStockEntry): Promise<StockEntry> {
    const supabase = await createClient();

    const existing = await this.getById(input.id);

    if (existing.status !== 'Draft') {
      throw new StockLedgerError('Can only update draft stock entries');
    }

    const updateData: any = {};

    if (input.postingDate) updateData.posting_date = input.postingDate.toISOString().split('T')[0];
    if (input.postingTime) updateData.posting_time = input.postingTime;
    if (input.remarks !== undefined) updateData.remarks = input.remarks;

    // If items are updated, recalculate totals
    if (input.items) {
      const validation = validateStockEntryItems(
        input.purpose || existing.purpose,
        input.items
      );
      if (!validation.valid) {
        throw new StockLedgerError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get item details
      const itemIds = [...new Set(input.items.map(i => i.itemId))];
      const { data: itemsData } = await supabase
        .from('items')
        .select('id, item_code, item_name, valuation_rate')
        .in('id', itemIds);

      const itemMap = new Map(itemsData?.map(i => [i.id, i]) || []);

      const processedItems = input.items.map((item, idx) => {
        const itemData = itemMap.get(item.itemId);
        const basicRate = item.basicRate ?? (itemData?.valuation_rate || 0);

        return {
          ...item,
          idx,
          itemCode: itemData?.item_code || '',
          itemName: itemData?.item_name || '',
          basicRate,
          basicAmount: item.qty * basicRate,
        };
      });

      const totals = calculateStockEntryTotals(processedItems.map(i => ({
        qty: i.qty,
        basicRate: i.basicRate,
        sWarehouseId: i.sWarehouseId,
        tWarehouseId: i.tWarehouseId,
      })));

      updateData.total_incoming_value = totals.totalIncomingValue;
      updateData.total_outgoing_value = totals.totalOutgoingValue;
      updateData.value_difference = totals.valueDifference;

      // Delete and recreate items
      await supabase.from('stock_entry_items').delete().eq('stock_entry_id', input.id);

      const itemsToInsert = processedItems.map((item) => ({
        stock_entry_id: input.id,
        idx: item.idx,
        item_id: item.itemId,
        item_code: item.itemCode,
        item_name: item.itemName,
        s_warehouse_id: item.sWarehouseId,
        t_warehouse_id: item.tWarehouseId,
        qty: item.qty,
        uom_id: item.uomId,
        basic_rate: item.basicRate,
        basic_amount: item.basicAmount,
        valuation_rate: item.basicRate,
        batch_id: item.batchId,
        serial_no: item.serialNo,
        is_finished_item: item.isFinishedItem || false,
        is_scrap_item: item.isScrapItem || false,
        expense_account_id: item.expenseAccountId,
        cost_center_id: item.costCenterId,
        project_id: item.projectId,
      }));

      await supabase.from('stock_entry_items').insert(itemsToInsert);
    }

    const { error } = await supabase
      .from('stock_entries')
      .update(updateData)
      .eq('id', input.id);

    if (error) {
      throw new StockLedgerError(`Failed to update stock entry: ${error.message}`);
    }

    return this.getById(input.id);
  }

  /**
   * Submit stock entry - creates SLE and GL entries
   */
  static async submit(id: string, userId: string): Promise<StockEntry> {
    const supabase = await createClient();

    const entry = await this.getById(id);

    if (entry.status !== 'Draft') {
      throw new StockLedgerError('Can only submit draft stock entries');
    }

    // Build stock ledger entries
    const sleInputs: StockLedgerEntryInput[] = [];

    for (const item of entry.items || []) {
      // Source warehouse (outgoing)
      if (item.sWarehouseId) {
        sleInputs.push({
          orgId: entry.orgId,
          itemId: item.itemId,
          warehouseId: item.sWarehouseId,
          postingDate: entry.postingDate,
          postingTime: entry.postingTime,
          actualQty: -item.qty,
          outgoingRate: item.valuationRate,
          voucherType: 'Stock Entry' as const,
          voucherId: entry.id,
          voucherNo: entry.entryNumber,
          voucherDetailId: item.id,
          batchId: item.batchId,
          serialNo: item.serialNo,
          projectId: item.projectId,
        });
      }

      // Target warehouse (incoming)
      if (item.tWarehouseId) {
        sleInputs.push({
          orgId: entry.orgId,
          itemId: item.itemId,
          warehouseId: item.tWarehouseId,
          postingDate: entry.postingDate,
          postingTime: entry.postingTime,
          actualQty: item.qty,
          incomingRate: item.basicRate,
          voucherType: 'Stock Entry' as const,
          voucherId: entry.id,
          voucherNo: entry.entryNumber,
          voucherDetailId: item.id,
          batchId: item.batchId,
          serialNo: item.serialNo,
          projectId: item.projectId,
        });
      }
    }

    // Create stock ledger entries
    await StockLedgerService.makeStockLedgerEntries(sleInputs);

    // Create GL entries for perpetual inventory (if enabled)
    await this.makeGLEntries(entry);

    // Update status
    const { error: updateError } = await supabase
      .from('stock_entries')
      .update({
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: userId,
      })
      .eq('id', id);

    if (updateError) {
      throw new StockLedgerError(`Failed to update stock entry status: ${updateError.message}`);
    }

    return this.getById(id);
  }

  /**
   * Cancel stock entry - reverses SLE and GL entries
   */
  static async cancel(id: string, userId: string): Promise<StockEntry> {
    const supabase = await createClient();

    const entry = await this.getById(id);

    if (entry.status === 'Draft') {
      throw new StockLedgerError('Cannot cancel draft stock entry. Delete it instead.');
    }

    if (entry.status === 'Cancelled') {
      throw new StockLedgerError('Stock entry is already cancelled');
    }

    // Reverse stock ledger entries
    await StockLedgerService.makeReverseStockLedgerEntries('Stock Entry', id);

    // Reverse GL entries
    await LedgerService.makeReverseGLEntries('Stock Entry', id);

    // Update status
    const { error } = await supabase
      .from('stock_entries')
      .update({
        status: 'Cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new StockLedgerError(`Failed to cancel stock entry: ${error.message}`);
    }

    return this.getById(id);
  }

  /**
   * Delete stock entry (drafts only)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const entry = await this.getById(id);

    if (entry.status !== 'Draft') {
      throw new StockLedgerError('Can only delete draft stock entries. Cancel submitted entries.');
    }

    await supabase.from('stock_entry_items').delete().eq('stock_entry_id', id);
    const { error } = await supabase.from('stock_entries').delete().eq('id', id);

    if (error) {
      throw new StockLedgerError(`Failed to delete stock entry: ${error.message}`);
    }
  }

  /**
   * Create GL entries for stock movement (perpetual inventory)
   */
  private static async makeGLEntries(entry: StockEntry): Promise<void> {
    const supabase = await createClient();

    // Get stock value differences from SLE
    const stockValueDiff = await StockLedgerService.getStockValueDifference(
      'Stock Entry',
      entry.id
    );

    if (stockValueDiff === 0) return;

    // Get default accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code')
      .eq('org_id', entry.orgId)
      .in('code', ['1120', '5101']);  // Inventory, COGS/Expense

    const accountMap = new Map(accounts?.map(a => [a.code, a.id]) || []);
    const inventoryAccount = accountMap.get('1120');
    const expenseAccount = accountMap.get('5101');

    if (!inventoryAccount || !expenseAccount) return;

    const glEntries: GLEntryInput[] = [];

    switch (entry.purpose) {
      case 'Material Receipt':
        // Debit Inventory, Credit (various - purchase/adjustment)
        glEntries.push({
          orgId: entry.orgId,
          accountId: inventoryAccount,
          accountCurrency: 'PHP',
          postingDate: entry.postingDate,
          voucherType: 'Stock Entry' as const,
          voucherId: entry.id,
          voucherNo: entry.entryNumber,
          debitInAccountCurrency: entry.totalIncomingValue,
          creditInAccountCurrency: 0,
          debit: entry.totalIncomingValue,
          credit: 0,
          exchangeRate: 1,
          remarks: `Stock Receipt - ${entry.entryNumber}`,
          isOpening: false,
          isAdvance: false,
        });
        // Credit would depend on source (opening stock, purchase, etc.)
        break;

      case 'Material Issue':
        // Debit Expense/COGS, Credit Inventory
        glEntries.push({
          orgId: entry.orgId,
          accountId: expenseAccount,
          accountCurrency: 'PHP',
          postingDate: entry.postingDate,
          voucherType: 'Stock Entry' as const,
          voucherId: entry.id,
          voucherNo: entry.entryNumber,
          debitInAccountCurrency: entry.totalOutgoingValue,
          creditInAccountCurrency: 0,
          debit: entry.totalOutgoingValue,
          credit: 0,
          exchangeRate: 1,
          remarks: `Stock Issue - ${entry.entryNumber}`,
          isOpening: false,
          isAdvance: false,
        });
        glEntries.push({
          orgId: entry.orgId,
          accountId: inventoryAccount,
          accountCurrency: 'PHP',
          postingDate: entry.postingDate,
          voucherType: 'Stock Entry' as const,
          voucherId: entry.id,
          voucherNo: entry.entryNumber,
          debitInAccountCurrency: 0,
          creditInAccountCurrency: entry.totalOutgoingValue,
          debit: 0,
          credit: entry.totalOutgoingValue,
          exchangeRate: 1,
          remarks: `Stock Issue - ${entry.entryNumber}`,
          isOpening: false,
          isAdvance: false,
        });
        break;

      case 'Material Transfer':
        // No P&L impact, just warehouse tracking
        // Could post to transit account if enabled
        break;

      case 'Manufacture':
        // Complex - consume raw materials, produce finished goods
        // Debit FG Inventory, Credit RM Inventory + WIP
        if (entry.valueDifference !== 0) {
          // Value difference goes to manufacturing variance account
        }
        break;
    }

    if (glEntries.length > 0) {
      try {
        await LedgerService.makeGLEntries(glEntries);
      } catch (error) {
        console.error('Failed to create GL entries for stock entry:', error);
        // Don't fail the stock entry if GL posting fails
        // This can be reconciled later
      }
    }
  }

  /**
   * Quick material receipt (helper method)
   */
  static async createMaterialReceipt(
    orgId: string,
    warehouseId: string,
    items: Array<{
      itemId: string;
      qty: number;
      rate: number;
      batchId?: string;
      serialNo?: string;
    }>,
    remarks?: string
  ): Promise<StockEntry> {
    return this.create({
      orgId,
      purpose: 'Material Receipt',
      postingDate: new Date(),
      toWarehouseId: warehouseId,
      remarks,
      items: items.map(item => ({
        itemId: item.itemId,
        tWarehouseId: warehouseId,
        qty: item.qty,
        basicRate: item.rate,
        batchId: item.batchId,
        serialNo: item.serialNo,
        isFinishedItem: false,
        isScrapItem: false,
      })),
    });
  }

  /**
   * Quick material issue (helper method)
   */
  static async createMaterialIssue(
    orgId: string,
    warehouseId: string,
    items: Array<{
      itemId: string;
      qty: number;
      batchId?: string;
      serialNo?: string;
    }>,
    remarks?: string
  ): Promise<StockEntry> {
    return this.create({
      orgId,
      purpose: 'Material Issue',
      postingDate: new Date(),
      fromWarehouseId: warehouseId,
      remarks,
      items: items.map(item => ({
        itemId: item.itemId,
        sWarehouseId: warehouseId,
        qty: item.qty,
        batchId: item.batchId,
        serialNo: item.serialNo,
        isFinishedItem: false,
        isScrapItem: false,
      })),
    });
  }

  /**
   * Quick material transfer (helper method)
   */
  static async createMaterialTransfer(
    orgId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    items: Array<{
      itemId: string;
      qty: number;
      batchId?: string;
      serialNo?: string;
    }>,
    remarks?: string
  ): Promise<StockEntry> {
    return this.create({
      orgId,
      purpose: 'Material Transfer',
      postingDate: new Date(),
      fromWarehouseId,
      toWarehouseId,
      remarks,
      items: items.map(item => ({
        itemId: item.itemId,
        sWarehouseId: fromWarehouseId,
        tWarehouseId: toWarehouseId,
        qty: item.qty,
        batchId: item.batchId,
        serialNo: item.serialNo,
        isFinishedItem: false,
        isScrapItem: false,
      })),
    });
  }

  /**
   * Map database row to StockEntry type
   */
  private static mapDbToStockEntry(row: any, items: any[]): StockEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      entryNumber: row.entry_number,
      namingSeries: row.naming_series || 'STE',
      stockEntryTypeId: row.stock_entry_type_id,
      purpose: row.purpose,
      postingDate: new Date(row.posting_date),
      postingTime: row.posting_time,
      fromWarehouseId: row.from_warehouse_id,
      toWarehouseId: row.to_warehouse_id,
      workOrderId: row.work_order_id,
      bomId: row.bom_id,
      totalIncomingValue: parseFloat(row.total_incoming_value) || 0,
      totalOutgoingValue: parseFloat(row.total_outgoing_value) || 0,
      valueDifference: parseFloat(row.value_difference) || 0,
      status: row.status,
      remarks: row.remarks,
      items: items.map(this.mapDbToItem),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
      createdBy: row.created_by,
      submittedBy: row.submitted_by,
    };
  }

  private static mapDbToItem(row: any): StockEntryItem {
    return {
      id: row.id,
      stockEntryId: row.stock_entry_id,
      idx: row.idx,
      itemId: row.item_id,
      itemCode: row.item_code,
      itemName: row.item_name,
      sWarehouseId: row.s_warehouse_id,
      tWarehouseId: row.t_warehouse_id,
      qty: parseFloat(row.qty) || 0,
      uomId: row.uom_id,
      conversionFactor: parseFloat(row.conversion_factor) || 1,
      stockUomQty: row.stock_uom_qty ? parseFloat(row.stock_uom_qty) : undefined,
      basicRate: parseFloat(row.basic_rate) || 0,
      basicAmount: parseFloat(row.basic_amount) || 0,
      valuationRate: parseFloat(row.valuation_rate) || 0,
      additionalCost: parseFloat(row.additional_cost) || 0,
      batchId: row.batch_id,
      serialNo: row.serial_no,
      isFinishedItem: row.is_finished_item || false,
      isScrapItem: row.is_scrap_item || false,
      expenseAccountId: row.expense_account_id,
      costCenterId: row.cost_center_id,
      projectId: row.project_id,
      createdAt: new Date(row.created_at),
    };
  }
}
