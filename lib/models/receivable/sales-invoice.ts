/**
 * Sales Invoice Model
 * Based on ERPNext's Sales Invoice DocType
 */

import { z } from 'zod';

// Invoice types
export const SalesInvoiceType = z.enum(['Invoice', 'Credit Note', 'Debit Note']);
export type SalesInvoiceType = z.infer<typeof SalesInvoiceType>;

// Invoice status
export const SalesInvoiceStatus = z.enum([
  'Draft',
  'Submitted',
  'Paid',
  'Partly Paid',
  'Overdue',
  'Cancelled',
  'Return',
]);
export type SalesInvoiceStatus = z.infer<typeof SalesInvoiceStatus>;

// Sales Invoice Item schema
export const SalesInvoiceItemSchema = z.object({
  id: z.string().uuid(),
  salesInvoiceId: z.string().uuid(),
  idx: z.number().int().min(0).default(0),

  // Item
  itemId: z.string().uuid().optional(),
  itemCode: z.string().max(100).optional(),
  itemName: z.string().min(1).max(255),
  description: z.string().optional(),

  // Quantity
  qty: z.number().min(0).default(1),
  uom: z.string().max(50).default('Unit'),
  conversionFactor: z.number().positive().default(1),
  stockQty: z.number().optional(),

  // Pricing
  rate: z.number().min(0).default(0),
  amount: z.number().min(0).default(0),

  // Discount
  discountPercentage: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  netAmount: z.number().min(0).default(0),

  // Tax
  taxTemplateId: z.string().uuid().optional(),
  taxRate: z.number().min(0).max(100).default(12),  // 12% VAT in PH
  taxAmount: z.number().min(0).default(0),

  // Total
  totalAmount: z.number().min(0).default(0),

  // Base currency amounts
  baseRate: z.number().min(0).default(0),
  baseAmount: z.number().min(0).default(0),
  baseNetAmount: z.number().min(0).default(0),

  // Accounts
  incomeAccountId: z.string().uuid().optional(),
  expenseAccountId: z.string().uuid().optional(),  // For COGS

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Warehouse
  warehouseId: z.string().uuid().optional(),

  createdAt: z.date(),
});

export type SalesInvoiceItem = z.infer<typeof SalesInvoiceItemSchema>;

// Sales Invoice Tax schema
export const SalesInvoiceTaxSchema = z.object({
  id: z.string().uuid(),
  salesInvoiceId: z.string().uuid(),
  idx: z.number().int().min(0).default(0),

  chargeType: z.string().default('On Net Total'),
  accountId: z.string().uuid(),

  description: z.string().max(255).optional(),
  rate: z.number().min(0).max(100).default(0),

  taxAmount: z.number().default(0),
  baseTaxAmount: z.number().default(0),

  total: z.number().default(0),
  baseTotal: z.number().default(0),

  createdAt: z.date(),
});

export type SalesInvoiceTax = z.infer<typeof SalesInvoiceTaxSchema>;

// Sales Invoice schema
export const SalesInvoiceSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Naming
  invoiceNumber: z.string(),
  namingSeries: z.string().default('SINV'),

  // Type
  invoiceType: SalesInvoiceType.default('Invoice'),

  // Customer
  customerId: z.string().uuid(),
  customerName: z.string(),
  customerAddress: z.string().optional(),

  // Dates
  postingDate: z.date(),
  dueDate: z.date(),

  // Currency
  currency: z.string().length(3).default('PHP'),
  exchangeRate: z.number().positive().default(1),

  // Amounts
  totalQty: z.number().min(0).default(0),
  baseTotal: z.number().min(0).default(0),
  totalTaxes: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  grandTotal: z.number().min(0).default(0),
  roundingAdjustment: z.number().default(0),
  roundedTotal: z.number().min(0).default(0),

  // Base currency
  baseGrandTotal: z.number().min(0).default(0),

  // Outstanding
  outstandingAmount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),

  // Withholding Tax
  applyWithholdingTax: z.boolean().default(false),
  withholdingTaxAmount: z.number().min(0).default(0),
  netTotal: z.number().min(0).default(0),

  // Status
  status: SalesInvoiceStatus.default('Draft'),
  isReturn: z.boolean().default(false),
  returnAgainst: z.string().uuid().optional(),

  // Accounts
  debitToAccountId: z.string().uuid().optional(),
  incomeAccountId: z.string().uuid().optional(),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Payment terms
  paymentTermsTemplate: z.string().max(100).optional(),

  // References
  salesOrderId: z.string().uuid().optional(),
  deliveryNoteId: z.string().uuid().optional(),
  poNumber: z.string().max(100).optional(),
  poDate: z.date().optional(),

  // Additional
  remarks: z.string().optional(),
  termsAndConditions: z.string().optional(),

  // Items and taxes
  items: z.array(SalesInvoiceItemSchema).optional(),
  taxes: z.array(SalesInvoiceTaxSchema).optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  submittedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  submittedBy: z.string().uuid().optional(),

  // Amendment
  amendedFrom: z.string().uuid().optional(),
});

export type SalesInvoice = z.infer<typeof SalesInvoiceSchema>;

// Create Sales Invoice input schema
export const CreateSalesInvoiceSchema = z.object({
  orgId: z.string().uuid(),
  invoiceType: SalesInvoiceType.default('Invoice'),

  customerId: z.string().uuid(),

  postingDate: z.date(),
  dueDate: z.date().optional(),  // Calculated from payment terms if not provided

  currency: z.string().length(3).default('PHP'),
  exchangeRate: z.number().positive().default(1),

  // Discount at invoice level
  discountAmount: z.number().min(0).default(0),

  // Withholding
  applyWithholdingTax: z.boolean().default(false),

  // Accounts
  debitToAccountId: z.string().uuid().optional(),
  incomeAccountId: z.string().uuid().optional(),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // References
  salesOrderId: z.string().uuid().optional(),
  deliveryNoteId: z.string().uuid().optional(),
  poNumber: z.string().max(100).optional(),
  poDate: z.date().optional(),

  remarks: z.string().optional(),
  termsAndConditions: z.string().optional(),

  // Items
  items: z.array(z.object({
    itemId: z.string().uuid().optional(),
    itemCode: z.string().max(100).optional(),
    itemName: z.string().min(1).max(255),
    description: z.string().optional(),
    qty: z.number().min(0).default(1),
    uom: z.string().max(50).default('Unit'),
    rate: z.number().min(0),
    discountPercentage: z.number().min(0).max(100).default(0),
    taxRate: z.number().min(0).max(100).default(12),
    incomeAccountId: z.string().uuid().optional(),
    costCenterId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
  })).min(1),

  // Taxes (optional - can be auto-calculated)
  taxes: z.array(z.object({
    accountId: z.string().uuid(),
    description: z.string().optional(),
    rate: z.number().min(0).max(100),
  })).optional(),
});

export type CreateSalesInvoice = z.infer<typeof CreateSalesInvoiceSchema>;

// Update Sales Invoice schema (for drafts only)
export const UpdateSalesInvoiceSchema = CreateSalesInvoiceSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateSalesInvoice = z.infer<typeof UpdateSalesInvoiceSchema>;

// Sales Invoice list filters
export interface SalesInvoiceListFilters {
  orgId: string;
  customerId?: string;
  status?: SalesInvoiceStatus;
  fromDate?: Date;
  toDate?: Date;
  isOverdue?: boolean;
  hasOutstanding?: boolean;
  limit?: number;
  offset?: number;
}

// Helper to calculate item amounts
export function calculateItemAmounts(item: {
  qty: number;
  rate: number;
  discountPercentage?: number;
  taxRate?: number;
  exchangeRate?: number;
}): {
  amount: number;
  discountAmount: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  baseRate: number;
  baseAmount: number;
  baseNetAmount: number;
} {
  const exchangeRate = item.exchangeRate || 1;
  const amount = item.qty * item.rate;
  const discountAmount = amount * ((item.discountPercentage || 0) / 100);
  const netAmount = amount - discountAmount;
  const taxAmount = netAmount * ((item.taxRate || 0) / 100);
  const totalAmount = netAmount + taxAmount;

  return {
    amount,
    discountAmount,
    netAmount,
    taxAmount,
    totalAmount,
    baseRate: item.rate * exchangeRate,
    baseAmount: amount * exchangeRate,
    baseNetAmount: netAmount * exchangeRate,
  };
}

// Helper to calculate invoice totals
export function calculateInvoiceTotals(
  items: Array<{
    qty: number;
    netAmount: number;
    taxAmount: number;
    totalAmount: number;
  }>,
  invoiceDiscountAmount: number = 0,
  exchangeRate: number = 1
): {
  totalQty: number;
  baseTotal: number;
  totalTaxes: number;
  grandTotal: number;
  baseGrandTotal: number;
} {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const baseTotal = items.reduce((sum, item) => sum + item.netAmount, 0);
  const totalTaxes = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = baseTotal + totalTaxes - invoiceDiscountAmount;

  return {
    totalQty,
    baseTotal,
    totalTaxes,
    grandTotal,
    baseGrandTotal: grandTotal * exchangeRate,
  };
}
