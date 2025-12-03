/**
 * Payment Entry Model
 * Based on ERPNext's Payment Entry DocType
 */

import { z } from 'zod';

// Payment types
export const PaymentType = z.enum(['Receive', 'Pay', 'Internal Transfer']);
export type PaymentType = z.infer<typeof PaymentType>;

// Payment Entry status
export const PaymentEntryStatus = z.enum(['Draft', 'Submitted', 'Cancelled']);
export type PaymentEntryStatus = z.infer<typeof PaymentEntryStatus>;

// Mode of payment
export const ModeOfPayment = z.enum([
  'Cash',
  'Bank Transfer',
  'Cheque',
  'Credit Card',
  'Wire Transfer',
  'Bank Draft',
]);
export type ModeOfPayment = z.infer<typeof ModeOfPayment>;

// Payment Entry Reference (allocation to invoices)
export const PaymentEntryReferenceSchema = z.object({
  id: z.string().uuid(),
  paymentEntryId: z.string().uuid(),
  idx: z.number().int().default(0),

  referenceDoctype: z.string(),             // Sales Invoice, Purchase Invoice, Journal Entry
  referenceId: z.string().uuid(),
  referenceName: z.string(),                // Invoice number

  dueDate: z.date().optional(),
  totalAmount: z.number().default(0),
  outstandingAmount: z.number().default(0),
  allocatedAmount: z.number().default(0),

  exchangeRate: z.number().positive().default(1),
  exchangeGainLoss: z.number().default(0),

  createdAt: z.date(),
});

export type PaymentEntryReference = z.infer<typeof PaymentEntryReferenceSchema>;

// Payment Entry schema
export const PaymentEntrySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Naming
  voucherNo: z.string(),
  namingSeries: z.string().default('PAY'),

  // Type
  paymentType: PaymentType,

  // Dates
  postingDate: z.date(),

  // Party
  partyType: z.string().optional(),         // Customer, Supplier
  partyId: z.string().uuid().optional(),
  partyName: z.string().optional(),

  // Payment method
  modeOfPayment: ModeOfPayment.optional(),

  // Bank accounts
  paidFromAccountId: z.string().uuid().optional(),
  paidToAccountId: z.string().uuid().optional(),

  // Amounts in transaction currency
  paidAmount: z.number().min(0).default(0),
  receivedAmount: z.number().min(0).default(0),

  // Amounts in account currency
  paidAmountInAccountCurrency: z.number().min(0).default(0),
  receivedAmountInAccountCurrency: z.number().min(0).default(0),

  // Multi-currency
  paidFromAccountCurrency: z.string().length(3).default('PHP'),
  paidToAccountCurrency: z.string().length(3).default('PHP'),
  sourceExchangeRate: z.number().positive().default(1),
  targetExchangeRate: z.number().positive().default(1),

  // Allocation
  totalAllocatedAmount: z.number().min(0).default(0),
  unallocatedAmount: z.number().min(0).default(0),

  // Difference (for write-off)
  differenceAmount: z.number().default(0),
  writeOffAccountId: z.string().uuid().optional(),

  // Bank details
  referenceNumber: z.string().optional(),
  referenceDate: z.date().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.date().optional(),
  bankAccount: z.string().optional(),

  // Status
  status: PaymentEntryStatus.default('Draft'),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  remarks: z.string().optional(),

  // References
  references: z.array(PaymentEntryReferenceSchema).optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  submittedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  submittedBy: z.string().uuid().optional(),
});

export type PaymentEntry = z.infer<typeof PaymentEntrySchema>;

// Create schema
export const CreatePaymentEntrySchema = z.object({
  orgId: z.string().uuid(),
  paymentType: PaymentType,
  postingDate: z.date(),

  partyType: z.string().optional(),
  partyId: z.string().uuid().optional(),
  partyName: z.string().optional(),

  modeOfPayment: ModeOfPayment.optional(),

  paidFromAccountId: z.string().uuid().optional(),
  paidToAccountId: z.string().uuid().optional(),

  paidAmount: z.number().min(0).default(0),
  receivedAmount: z.number().min(0).default(0),

  sourceExchangeRate: z.number().positive().default(1),
  targetExchangeRate: z.number().positive().default(1),

  referenceNumber: z.string().optional(),
  referenceDate: z.date().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.date().optional(),

  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  remarks: z.string().optional(),

  references: z.array(z.object({
    referenceDoctype: z.string(),
    referenceId: z.string().uuid(),
    referenceName: z.string(),
    allocatedAmount: z.number().min(0),
  })).optional(),
});

export type CreatePaymentEntry = z.infer<typeof CreatePaymentEntrySchema>;

// Helper to calculate unallocated amount
export function calculateUnallocatedAmount(
  paidAmount: number,
  totalAllocatedAmount: number
): number {
  return Math.max(0, paidAmount - totalAllocatedAmount);
}

// Helper to determine if payment is fully allocated
export function isFullyAllocated(paymentEntry: PaymentEntry): boolean {
  return paymentEntry.unallocatedAmount === 0;
}
