/**
 * Stock Ledger Service
 * Core engine for stock movements and valuation
 * Based on ERPNext's stock_ledger.py
 */

import { createClient } from '@/lib/supabase/server';
import type {
  StockLedgerEntry,
  StockLedgerEntryInput,
  StockBalance,
  FifoQueueEntry,
} from '@/lib/models/stock/stock-ledger-entry';
import {
  addToFifoQueue,
  removeFromFifoQueue,
  removeFromLifoQueue,
  getQueueTotals,
  calculateMovingAverageRate,
  roundOffIfNearZero,
} from '@/lib/models/stock/stock-ledger-entry';
import type { ValuationMethod } from '@/lib/models/stock/item';

export class StockLedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockLedgerError';
  }
}

interface MakeSLEOptions {
  allowNegativeStock?: boolean;
  validateOnlyMode?: boolean;  // Just validate, don't create entries
}

export class StockLedgerService {
  /**
   * Create stock ledger entries
   * This is the core function that creates SLE records and updates bins
   */
  static async makeStockLedgerEntries(
    entries: StockLedgerEntryInput[],
    options: MakeSLEOptions = {}
  ): Promise<StockLedgerEntry[]> {
    const supabase = await createClient();
    const { allowNegativeStock = false, validateOnlyMode = false } = options;

    const createdEntries: StockLedgerEntry[] = [];

    for (const entry of entries) {
      // Get item details for valuation method
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('valuation_method')
        .eq('id', entry.itemId)
        .single();

      if (itemError || !item) {
        throw new StockLedgerError(`Item not found: ${entry.itemId}`);
      }

      const valuationMethod = item.valuation_method as ValuationMethod;

      // Get current stock balance
      const currentBalance = await this.getStockBalance(
        entry.itemId,
        entry.warehouseId
      );

      // Get current FIFO queue for queue-based valuation
      let currentQueue: FifoQueueEntry[] = [];
      if (valuationMethod === 'FIFO' || valuationMethod === 'LIFO') {
        currentQueue = await this.getFifoQueue(entry.itemId, entry.warehouseId);
      }

      // Calculate new quantities
      const qtyAfterTransaction = currentBalance.qty + entry.actualQty;

      // Check for negative stock
      if (!allowNegativeStock && qtyAfterTransaction < 0) {
        throw new StockLedgerError(
          `Insufficient stock for item ${entry.itemId} in warehouse ${entry.warehouseId}. ` +
          `Available: ${currentBalance.qty}, Required: ${Math.abs(entry.actualQty)}`
        );
      }

      // Calculate valuation rate and stock value
      let valuationRate: number;
      let stockValue: number;
      let newQueue: FifoQueueEntry[] = currentQueue;
      let outgoingRate = entry.outgoingRate || 0;

      if (entry.actualQty > 0) {
        // Incoming stock
        const incomingRate = entry.incomingRate || 0;

        switch (valuationMethod) {
          case 'FIFO':
          case 'LIFO':
            newQueue = addToFifoQueue(currentQueue, entry.actualQty, incomingRate);
            const totals = getQueueTotals(newQueue);
            valuationRate = totals.avgRate;
            stockValue = totals.totalValue;
            break;

          case 'Moving Average':
          default:
            valuationRate = calculateMovingAverageRate(
              currentBalance.qty,
              currentBalance.valuationRate,
              entry.actualQty,
              incomingRate
            );
            stockValue = qtyAfterTransaction * valuationRate;
            break;
        }
      } else if (entry.actualQty < 0) {
        // Outgoing stock
        const qtyToRemove = Math.abs(entry.actualQty);

        switch (valuationMethod) {
          case 'FIFO':
            const fifoResult = removeFromFifoQueue(currentQueue, qtyToRemove);
            newQueue = fifoResult.newQueue;
            outgoingRate = fifoResult.avgRate;
            const fifoTotals = getQueueTotals(newQueue);
            valuationRate = fifoTotals.avgRate;
            stockValue = fifoTotals.totalValue;
            break;

          case 'LIFO':
            const lifoResult = removeFromLifoQueue(currentQueue, qtyToRemove);
            newQueue = lifoResult.newQueue;
            outgoingRate = lifoResult.avgRate;
            const lifoTotals = getQueueTotals(newQueue);
            valuationRate = lifoTotals.avgRate;
            stockValue = lifoTotals.totalValue;
            break;

          case 'Moving Average':
          default:
            // Use current valuation rate for outgoing
            valuationRate = currentBalance.valuationRate;
            outgoingRate = valuationRate;
            stockValue = qtyAfterTransaction * valuationRate;
            break;
        }
      } else {
        // No quantity change (just value adjustment)
        valuationRate = entry.incomingRate || currentBalance.valuationRate;
        stockValue = currentBalance.qty * valuationRate;
      }

      // Round off near-zero values
      valuationRate = roundOffIfNearZero(valuationRate);
      stockValue = roundOffIfNearZero(stockValue);
      const stockValueDifference = stockValue - currentBalance.stockValue;

      // If validate only, don't create entry
      if (validateOnlyMode) {
        continue;
      }

      // Prepare posting datetime
      const postingTime = entry.postingTime || '00:00:00';
      const postingDateStr = entry.postingDate.toISOString().split('T')[0];
      const postingDatetime = new Date(`${postingDateStr}T${postingTime}`);

      // Insert stock ledger entry
      const { data: sle, error: sleError } = await supabase
        .from('stock_ledger_entries')
        .insert({
          org_id: entry.orgId,
          item_id: entry.itemId,
          warehouse_id: entry.warehouseId,
          posting_date: postingDateStr,
          posting_time: postingTime,
          posting_datetime: postingDatetime.toISOString(),
          actual_qty: entry.actualQty,
          qty_after_transaction: qtyAfterTransaction,
          incoming_rate: entry.incomingRate || 0,
          outgoing_rate: outgoingRate,
          valuation_rate: valuationRate,
          stock_value: stockValue,
          stock_value_difference: stockValueDifference,
          stock_queue: newQueue.length > 0 ? JSON.stringify(newQueue) : null,
          voucher_type: entry.voucherType,
          voucher_id: entry.voucherId,
          voucher_no: entry.voucherNo,
          voucher_detail_id: entry.voucherDetailId,
          batch_id: entry.batchId,
          serial_no: entry.serialNo,
          project_id: entry.projectId,
          is_cancelled: false,
        })
        .select()
        .single();

      if (sleError) {
        throw new StockLedgerError(`Failed to create stock ledger entry: ${sleError.message}`);
      }

      createdEntries.push(this.mapDbToSLE(sle));
    }

    return createdEntries;
  }

  /**
   * Get current stock balance for item/warehouse
   */
  static async getStockBalance(
    itemId: string,
    warehouseId: string,
    asOfDate?: Date
  ): Promise<StockBalance> {
    const supabase = await createClient();

    let query = supabase
      .from('stock_ledger_entries')
      .select('qty_after_transaction, valuation_rate, stock_value')
      .eq('item_id', itemId)
      .eq('warehouse_id', warehouseId)
      .eq('is_cancelled', false)
      .order('posting_datetime', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (asOfDate) {
      query = query.lte('posting_date', asOfDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      throw new StockLedgerError(`Failed to get stock balance: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        itemId,
        warehouseId,
        qty: 0,
        valuationRate: 0,
        stockValue: 0,
        asOfDate: asOfDate || new Date(),
      };
    }

    return {
      itemId,
      warehouseId,
      qty: parseFloat(data[0].qty_after_transaction) || 0,
      valuationRate: parseFloat(data[0].valuation_rate) || 0,
      stockValue: parseFloat(data[0].stock_value) || 0,
      asOfDate: asOfDate || new Date(),
    };
  }

  /**
   * Get FIFO queue for item/warehouse
   */
  static async getFifoQueue(
    itemId: string,
    warehouseId: string
  ): Promise<FifoQueueEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('stock_ledger_entries')
      .select('stock_queue')
      .eq('item_id', itemId)
      .eq('warehouse_id', warehouseId)
      .eq('is_cancelled', false)
      .order('posting_datetime', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return [];
    }

    const queue = data[0].stock_queue;
    if (!queue) return [];

    try {
      return typeof queue === 'string' ? JSON.parse(queue) : queue;
    } catch {
      return [];
    }
  }

  /**
   * Create reverse stock ledger entries (for cancellation)
   */
  static async makeReverseStockLedgerEntries(
    voucherType: string,
    voucherId: string
  ): Promise<void> {
    const supabase = await createClient();

    // Get original entries
    const { data: originalEntries, error } = await supabase
      .from('stock_ledger_entries')
      .select('*')
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId)
      .eq('is_cancelled', false);

    if (error) {
      throw new StockLedgerError(`Failed to get original entries: ${error.message}`);
    }

    if (!originalEntries || originalEntries.length === 0) {
      return;
    }

    // Create reverse entries
    const reverseInputs: StockLedgerEntryInput[] = originalEntries.map(entry => ({
      orgId: entry.org_id,
      itemId: entry.item_id,
      warehouseId: entry.warehouse_id,
      postingDate: new Date(),
      actualQty: -parseFloat(entry.actual_qty),
      incomingRate: parseFloat(entry.outgoing_rate) || 0,
      outgoingRate: parseFloat(entry.incoming_rate) || 0,
      voucherType: voucherType as any,
      voucherId: voucherId,
      voucherNo: entry.voucher_no + '-CANCEL',
      voucherDetailId: entry.voucher_detail_id,
      batchId: entry.batch_id,
      serialNo: entry.serial_no,
      projectId: entry.project_id,
    }));

    await this.makeStockLedgerEntries(reverseInputs, { allowNegativeStock: true });

    // Mark original entries as cancelled
    await supabase
      .from('stock_ledger_entries')
      .update({ is_cancelled: true })
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId)
      .eq('is_cancelled', false);
  }

  /**
   * Get stock value for GL posting
   */
  static async getStockValueDifference(
    voucherType: string,
    voucherId: string
  ): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('stock_ledger_entries')
      .select('stock_value_difference')
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId)
      .eq('is_cancelled', false);

    if (error) {
      throw new StockLedgerError(`Failed to get stock value difference: ${error.message}`);
    }

    return (data || []).reduce(
      (sum, entry) => sum + parseFloat(entry.stock_value_difference || '0'),
      0
    );
  }

  /**
   * Get stock ledger entries for a voucher
   */
  static async getEntriesByVoucher(
    voucherType: string,
    voucherId: string
  ): Promise<StockLedgerEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('stock_ledger_entries')
      .select('*')
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId)
      .order('posting_datetime')
      .order('created_at');

    if (error) {
      throw new StockLedgerError(`Failed to get entries: ${error.message}`);
    }

    return (data || []).map(this.mapDbToSLE);
  }

  /**
   * Get stock ledger entries for an item
   */
  static async getEntriesByItem(
    itemId: string,
    options: {
      warehouseId?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    } = {}
  ): Promise<StockLedgerEntry[]> {
    const supabase = await createClient();

    let query = supabase
      .from('stock_ledger_entries')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_cancelled', false)
      .order('posting_datetime', { ascending: false })
      .order('created_at', { ascending: false });

    if (options.warehouseId) {
      query = query.eq('warehouse_id', options.warehouseId);
    }

    if (options.fromDate) {
      query = query.gte('posting_date', options.fromDate.toISOString().split('T')[0]);
    }

    if (options.toDate) {
      query = query.lte('posting_date', options.toDate.toISOString().split('T')[0]);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new StockLedgerError(`Failed to get entries: ${error.message}`);
    }

    return (data || []).map(this.mapDbToSLE);
  }

  /**
   * Get item stock summary across all warehouses
   */
  static async getItemStockSummary(
    orgId: string,
    itemId: string
  ): Promise<Array<{
    warehouseId: string;
    warehouseName: string;
    qty: number;
    valuationRate: number;
    stockValue: number;
  }>> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_item_stock_summary', {
      p_org_id: orgId,
      p_item_id: itemId,
    });

    if (error) {
      throw new StockLedgerError(`Failed to get stock summary: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      qty: parseFloat(row.actual_qty) || 0,
      valuationRate: parseFloat(row.valuation_rate) || 0,
      stockValue: parseFloat(row.stock_value) || 0,
    }));
  }

  /**
   * Map database row to StockLedgerEntry type
   */
  private static mapDbToSLE(row: any): StockLedgerEntry {
    let stockQueue: FifoQueueEntry[] | undefined;
    if (row.stock_queue) {
      try {
        stockQueue = typeof row.stock_queue === 'string'
          ? JSON.parse(row.stock_queue)
          : row.stock_queue;
      } catch {
        stockQueue = undefined;
      }
    }

    return {
      id: row.id,
      orgId: row.org_id,
      itemId: row.item_id,
      warehouseId: row.warehouse_id,
      postingDate: new Date(row.posting_date),
      postingTime: row.posting_time,
      postingDatetime: new Date(row.posting_datetime),
      actualQty: parseFloat(row.actual_qty) || 0,
      qtyAfterTransaction: parseFloat(row.qty_after_transaction) || 0,
      incomingRate: parseFloat(row.incoming_rate) || 0,
      outgoingRate: parseFloat(row.outgoing_rate) || 0,
      valuationRate: parseFloat(row.valuation_rate) || 0,
      stockValue: parseFloat(row.stock_value) || 0,
      stockValueDifference: parseFloat(row.stock_value_difference) || 0,
      stockQueue,
      voucherType: row.voucher_type,
      voucherId: row.voucher_id,
      voucherNo: row.voucher_no,
      voucherDetailId: row.voucher_detail_id,
      batchId: row.batch_id,
      serialNo: row.serial_no,
      isCancelled: row.is_cancelled || false,
      projectId: row.project_id,
      createdAt: new Date(row.created_at),
    };
  }
}
