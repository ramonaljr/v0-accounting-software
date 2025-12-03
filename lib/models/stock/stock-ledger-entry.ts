/**
 * Stock Ledger Entry Model
 * Based on ERPNext's Stock Ledger Entry DocType
 *
 * This is the immutable audit trail for all stock movements.
 * Each entry records a change in stock quantity and value.
 */

import { z } from 'zod';

// Voucher types that create stock ledger entries
export const StockVoucherType = z.enum([
  'Stock Entry',
  'Purchase Receipt',
  'Purchase Invoice',
  'Delivery Note',
  'Sales Invoice',
  'Stock Reconciliation',
  'Subcontracting Receipt',
  'Asset Repair',
]);
export type StockVoucherType = z.infer<typeof StockVoucherType>;

// Stock Ledger Entry schema
export const StockLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Item and Location
  itemId: z.string().uuid(),
  warehouseId: z.string().uuid(),

  // Timing (critical for FIFO ordering)
  postingDate: z.date(),
  postingTime: z.string(),
  postingDatetime: z.date(),

  // Quantity change
  actualQty: z.number(),  // +ve for in, -ve for out
  qtyAfterTransaction: z.number(),

  // Valuation
  incomingRate: z.number().min(0).default(0),  // Cost for inbound
  outgoingRate: z.number().min(0).default(0),  // Cost for outbound
  valuationRate: z.number().min(0).default(0),  // Current weighted avg rate

  // Stock value
  stockValue: z.number().default(0),  // qty_after × valuation_rate
  stockValueDifference: z.number().default(0),  // Change in value (for GL)

  // FIFO/LIFO queue (array of [qty, rate] pairs)
  stockQueue: z.array(z.tuple([z.number(), z.number()])).optional(),

  // Source document
  voucherType: StockVoucherType,
  voucherId: z.string().uuid(),
  voucherNo: z.string(),
  voucherDetailId: z.string().uuid().optional(),

  // Batch/Serial tracking
  batchId: z.string().uuid().optional(),
  serialNo: z.string().optional(),

  // Flags
  isCancelled: z.boolean().default(false),

  // Dimensions
  projectId: z.string().uuid().optional(),

  // Audit
  createdAt: z.date(),
});

export type StockLedgerEntry = z.infer<typeof StockLedgerEntrySchema>;

// Input for creating SLE (used by services)
export interface StockLedgerEntryInput {
  orgId: string;
  itemId: string;
  warehouseId: string;
  postingDate: Date;
  postingTime?: string;
  actualQty: number;
  incomingRate?: number;
  outgoingRate?: number;
  voucherType: StockVoucherType;
  voucherId: string;
  voucherNo: string;
  voucherDetailId?: string;
  batchId?: string;
  serialNo?: string;
  projectId?: string;
}

// Stock balance at a point in time
export interface StockBalance {
  itemId: string;
  warehouseId: string;
  qty: number;
  valuationRate: number;
  stockValue: number;
  asOfDate: Date;
}

// FIFO Queue entry [quantity, rate]
export type FifoQueueEntry = [number, number];

// Helper to create a new FIFO queue
export function createFifoQueue(): FifoQueueEntry[] {
  return [];
}

/**
 * Add to FIFO queue (for incoming stock)
 * If last entry has same rate, merge. Otherwise append.
 */
export function addToFifoQueue(
  queue: FifoQueueEntry[],
  qty: number,
  rate: number
): FifoQueueEntry[] {
  if (qty <= 0) return queue;

  const newQueue = [...queue];

  // If last entry has same rate, merge
  if (newQueue.length > 0) {
    const lastEntry = newQueue[newQueue.length - 1];
    if (Math.abs(lastEntry[1] - rate) < 0.0001) {
      newQueue[newQueue.length - 1] = [lastEntry[0] + qty, rate];
      return newQueue;
    }
  }

  // Otherwise append new entry
  newQueue.push([qty, rate]);
  return newQueue;
}

/**
 * Remove from FIFO queue (for outgoing stock)
 * Consume from front (oldest first)
 * Returns [newQueue, avgRate, consumedEntries]
 */
export function removeFromFifoQueue(
  queue: FifoQueueEntry[],
  qtyToRemove: number
): {
  newQueue: FifoQueueEntry[];
  avgRate: number;
  totalValue: number;
} {
  if (qtyToRemove <= 0) {
    return {
      newQueue: queue,
      avgRate: 0,
      totalValue: 0,
    };
  }

  const newQueue = [...queue];
  let remaining = qtyToRemove;
  let totalValue = 0;
  let totalQty = 0;

  while (remaining > 0 && newQueue.length > 0) {
    const [entryQty, entryRate] = newQueue[0];

    if (entryQty <= remaining) {
      // Consume entire entry
      totalValue += entryQty * entryRate;
      totalQty += entryQty;
      remaining -= entryQty;
      newQueue.shift();
    } else {
      // Partial consumption
      totalValue += remaining * entryRate;
      totalQty += remaining;
      newQueue[0] = [entryQty - remaining, entryRate];
      remaining = 0;
    }
  }

  return {
    newQueue,
    avgRate: totalQty > 0 ? totalValue / totalQty : 0,
    totalValue,
  };
}

/**
 * Remove from LIFO queue (for outgoing stock)
 * Consume from back (newest first)
 */
export function removeFromLifoQueue(
  queue: FifoQueueEntry[],
  qtyToRemove: number
): {
  newQueue: FifoQueueEntry[];
  avgRate: number;
  totalValue: number;
} {
  if (qtyToRemove <= 0) {
    return {
      newQueue: queue,
      avgRate: 0,
      totalValue: 0,
    };
  }

  const newQueue = [...queue];
  let remaining = qtyToRemove;
  let totalValue = 0;
  let totalQty = 0;

  while (remaining > 0 && newQueue.length > 0) {
    const lastIdx = newQueue.length - 1;
    const [entryQty, entryRate] = newQueue[lastIdx];

    if (entryQty <= remaining) {
      // Consume entire entry
      totalValue += entryQty * entryRate;
      totalQty += entryQty;
      remaining -= entryQty;
      newQueue.pop();
    } else {
      // Partial consumption
      totalValue += remaining * entryRate;
      totalQty += remaining;
      newQueue[lastIdx] = [entryQty - remaining, entryRate];
      remaining = 0;
    }
  }

  return {
    newQueue,
    avgRate: totalQty > 0 ? totalValue / totalQty : 0,
    totalValue,
  };
}

/**
 * Calculate queue total quantity and value
 */
export function getQueueTotals(queue: FifoQueueEntry[]): {
  totalQty: number;
  totalValue: number;
  avgRate: number;
} {
  let totalQty = 0;
  let totalValue = 0;

  for (const [qty, rate] of queue) {
    totalQty += qty;
    totalValue += qty * rate;
  }

  return {
    totalQty,
    totalValue,
    avgRate: totalQty > 0 ? totalValue / totalQty : 0,
  };
}

/**
 * Calculate moving average rate after adding stock
 */
export function calculateMovingAverageRate(
  currentQty: number,
  currentRate: number,
  addQty: number,
  addRate: number
): number {
  const totalQty = currentQty + addQty;
  if (totalQty <= 0) return 0;

  const currentValue = currentQty * currentRate;
  const addValue = addQty * addRate;

  return (currentValue + addValue) / totalQty;
}

/**
 * Round to zero if near zero (prevents floating point errors)
 */
export function roundOffIfNearZero(value: number, precision: number = 0.00001): number {
  return Math.abs(value) < precision ? 0 : value;
}
