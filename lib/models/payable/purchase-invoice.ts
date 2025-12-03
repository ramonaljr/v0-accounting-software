/**
 * Purchase Invoice Model
 * Based on ERPNext's Purchase Invoice DocType
 */

import { z } from 'zod';

// Invoice types
export const PurchaseInvoiceType = z.enum(['Invoice', 'Credit Note', 'Debit Note']);
export type PurchaseInvoiceType = z.infer<typeof PurchaseInvoiceType>;

// Invoice status
export const PurchaseInvoiceStatus = z.enum([
  'Draft',
  'Submitted',
  'Paid',
  'Partly Paid',
  'Overdue',
  'Cancelled',
  'Return',
  'On Hold',
]);
export type PurchaseInvoiceStatus = z.infer<typeof PurchaseInvoiceStatus>;

// Purchase Invoice Item schema
export const PurchaseInvoiceItemSchema = z.object({
  id: z.string().uuid(),
  purchaseInvoiceId: z.string().uuid(),
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
  expenseAccountId: z.string().uuid().optional(),

  // Asset
  isFixedAsset: z.boolean().default(false),
  assetId: z.string().uuid().optional(),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Warehouse (for inventory items)
  warehouseId: z.string().uuid().optional(),

  createdAt: z.date(),
});

export type PurchaseInvoiceItem = z.infer<typeof PurchaseInvoiceItemSchema>;

// Purchase Invoice Tax schema
export const PurchaseInvoiceTaxSchema = z.object({
  id: z.string().uuid(),
  purchaseInvoiceId: z.string().uuid(),
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

export type PurchaseInvoiceTax = z.infer<typeof PurchaseInvoiceTaxSchema>;

// Purchase Invoice schema
export const PurchaseInvoiceSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Naming
  invoiceNumber: z.string(),
  namingSeries: z.string().default('PINV'),
  supplierInvoiceNo: z.string().max(100).optional(),  // Supplier's invoice number

  // Type
  invoiceType: PurchaseInvoiceType.default('Invoice'),

  // Supplier
  supplierId: z.string().uuid(),
  supplierName: z.string(),
  supplierAddress: z.string().optional(),

  // Dates
  postingDate: z.date(),
  dueDate: z.date(),
  supplierInvoiceDate: z.date().optional(),

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

  // Withholding Tax (Philippines specific)
  applyWithholdingTax: z.boolean().default(false),
  withholdingTaxType: z.string().max(50).optional(),  // EWT-1%, EWT-2%, EWT-5%, etc.
  withholdingTaxRate: z.number().min(0).max(100).default(0),
  withholdingTaxAmount: z.number().min(0).default(0),
  netTotal: z.number().min(0).default(0),  // Amount after withholding

  // Status
  status: PurchaseInvoiceStatus.default('Draft'),
  isReturn: z.boolean().default(false),
  returnAgainst: z.string().uuid().optional(),
  onHoldReason: z.string().optional(),

  // Accounts
  creditToAccountId: z.string().uuid().optional(),  // Accounts Payable
  expenseAccountId: z.string().uuid().optional(),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Payment terms
  paymentTermsTemplate: z.string().max(100).optional(),

  // References
  purchaseOrderId: z.string().uuid().optional(),
  purchaseReceiptId: z.string().uuid().optional(),

  // Additional
  remarks: z.string().optional(),
  termsAndConditions: z.string().optional(),

  // Items and taxes
  items: z.array(PurchaseInvoiceItemSchema).optional(),
  taxes: z.array(PurchaseInvoiceTaxSchema).optional(),

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

export type PurchaseInvoice = z.infer<typeof PurchaseInvoiceSchema>;

// Create Purchase Invoice input schema
export const CreatePurchaseInvoiceSchema = z.object({
  orgId: z.string().uuid(),
  invoiceType: PurchaseInvoiceType.default('Invoice'),
  supplierInvoiceNo: z.string().max(100).optional(),

  supplierId: z.string().uuid(),

  postingDate: z.date(),
  dueDate: z.date().optional(),
  supplierInvoiceDate: z.date().optional(),

  currency: z.string().length(3).default('PHP'),
  exchangeRate: z.number().positive().default(1),

  // Discount at invoice level
  discountAmount: z.number().min(0).default(0),

  // Withholding Tax
  applyWithholdingTax: z.boolean().default(false),
  withholdingTaxType: z.string().max(50).optional(),
  withholdingTaxRate: z.number().min(0).max(100).default(0),

  // Accounts
  creditToAccountId: z.string().uuid().optional(),
  expenseAccountId: z.string().uuid().optional(),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // References
  purchaseOrderId: z.string().uuid().optional(),
  purchaseReceiptId: z.string().uuid().optional(),

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
    expenseAccountId: z.string().uuid().optional(),
    isFixedAsset: z.boolean().default(false),
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

export type CreatePurchaseInvoice = z.infer<typeof CreatePurchaseInvoiceSchema>;

// Update Purchase Invoice schema (for drafts only)
export const UpdatePurchaseInvoiceSchema = CreatePurchaseInvoiceSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdatePurchaseInvoice = z.infer<typeof UpdatePurchaseInvoiceSchema>;

// Purchase Invoice list filters
export interface PurchaseInvoiceListFilters {
  orgId: string;
  supplierId?: string;
  status?: PurchaseInvoiceStatus;
  fromDate?: Date;
  toDate?: Date;
  isOverdue?: boolean;
  hasOutstanding?: boolean;
  onHold?: boolean;
  limit?: number;
  offset?: number;
}

// Philippines Withholding Tax Types
export const PH_WITHHOLDING_TAX_TYPES = [
  { code: 'WC010', rate: 1, description: 'Professional fees - individual (1%)' },
  { code: 'WC020', rate: 2, description: 'Professional fees - juridical (2%)' },
  { code: 'WC100', rate: 5, description: 'Professional fees - individual/large taxpayer (5%)' },
  { code: 'WC120', rate: 10, description: 'Professional fees - individual non-resident (10%)' },
  { code: 'WC140', rate: 15, description: 'Professional fees - non-resident (15%)' },
  { code: 'WI010', rate: 1, description: 'Rentals - movable property (1%)' },
  { code: 'WI020', rate: 5, description: 'Rentals - real property (5%)' },
  { code: 'WI100', rate: 2, description: 'Services - contractor (2%)' },
  { code: 'WI150', rate: 1, description: 'Services - local purchase (1%)' },
  { code: 'WI160', rate: 2, description: 'Services - local purchase >P10k (2%)' },
];

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
  options: {
    invoiceDiscountAmount?: number;
    exchangeRate?: number;
    applyWithholdingTax?: boolean;
    withholdingTaxRate?: number;
  } = {}
): {
  totalQty: number;
  baseTotal: number;
  totalTaxes: number;
  grandTotal: number;
  baseGrandTotal: number;
  withholdingTaxAmount: number;
  netTotal: number;
} {
  const {
    invoiceDiscountAmount = 0,
    exchangeRate = 1,
    applyWithholdingTax = false,
    withholdingTaxRate = 0,
  } = options;

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const baseTotal = items.reduce((sum, item) => sum + item.netAmount, 0);
  const totalTaxes = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = baseTotal + totalTaxes - invoiceDiscountAmount;

  // Calculate withholding tax (applied on baseTotal before VAT in Philippines)
  const withholdingTaxAmount = applyWithholdingTax
    ? baseTotal * (withholdingTaxRate / 100)
    : 0;

  // Net total is what supplier receives (grandTotal - withholding)
  const netTotal = grandTotal - withholdingTaxAmount;

  return {
    totalQty,
    baseTotal,
    totalTaxes,
    grandTotal,
    baseGrandTotal: grandTotal * exchangeRate,
    withholdingTaxAmount,
    netTotal,
  };
}
