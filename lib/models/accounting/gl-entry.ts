/**
 * GL Entry Model (General Ledger Entry)
 * Based on ERPNext's GL Entry DocType
 *
 * GL Entries are immutable - they represent the permanent audit trail
 * of all accounting transactions.
 */

import { z } from 'zod';
import type { PartyType } from './journal-entry';

// Voucher types that can create GL entries
export const GLVoucherType = z.enum([
  'Journal Entry',
  'Sales Invoice',
  'Purchase Invoice',
  'Payment Entry',
  'Stock Entry',
  'Purchase Receipt',
  'Delivery Note',
  'Asset',
  'Payroll Entry',
  'Expense Claim',
  'Bank Transaction',
  'Opening Entry',
]);
export type GLVoucherType = z.infer<typeof GLVoucherType>;

// GL Entry schema
export const GLEntrySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Timing
  postingDate: z.date(),
  postingDatetime: z.date(),
  fiscalYearId: z.string().uuid().optional(),

  // Account
  accountId: z.string().uuid(),
  accountCurrency: z.string().length(3).default('PHP'),

  // Party (Customer/Supplier/Employee)
  partyType: z.string().optional(),
  partyId: z.string().uuid().optional(),

  // Amounts in account currency
  debitInAccountCurrency: z.number().default(0),
  creditInAccountCurrency: z.number().default(0),

  // Amounts in company currency (base currency - PHP)
  debit: z.number().default(0),
  credit: z.number().default(0),
  exchangeRate: z.number().positive().default(1),

  // Source document
  voucherType: GLVoucherType,
  voucherId: z.string().uuid(),
  voucherNo: z.string(),
  voucherDetailId: z.string().uuid().optional(),  // Line item reference

  // Matching (for reconciliation)
  againstVoucherType: GLVoucherType.optional(),
  againstVoucherId: z.string().uuid().optional(),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Flags
  isOpening: z.boolean().default(false),
  isAdvance: z.boolean().default(false),
  isCancelled: z.boolean().default(false),

  remarks: z.string().optional(),

  // Audit (immutable after creation)
  createdAt: z.date(),
  createdBy: z.string().uuid().optional(),
}).refine(
  (data) => !(data.debit > 0 && data.credit > 0),
  { message: 'GL Entry cannot have both debit and credit' }
);

export type GLEntry = z.infer<typeof GLEntrySchema>;

// Input schema for creating GL entries (used by services)
export const GLEntryInputSchema = z.object({
  orgId: z.string().uuid(),
  postingDate: z.date(),
  fiscalYearId: z.string().uuid().optional(),

  accountId: z.string().uuid(),
  accountCurrency: z.string().length(3).default('PHP'),

  partyType: z.string().optional(),
  partyId: z.string().uuid().optional(),

  debitInAccountCurrency: z.number().default(0),
  creditInAccountCurrency: z.number().default(0),

  debit: z.number().default(0),
  credit: z.number().default(0),
  exchangeRate: z.number().positive().default(1),

  voucherType: GLVoucherType,
  voucherId: z.string().uuid(),
  voucherNo: z.string(),
  voucherDetailId: z.string().uuid().optional(),

  againstVoucherType: GLVoucherType.optional(),
  againstVoucherId: z.string().uuid().optional(),

  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  isOpening: z.boolean().default(false),
  isAdvance: z.boolean().default(false),

  remarks: z.string().optional(),
});

export type GLEntryInput = z.infer<typeof GLEntryInputSchema>;

// Account balance result
export interface AccountBalance {
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;               // Debit - Credit
  balanceInAccountCurrency?: number;
}

// Trial balance entry
export interface TrialBalanceEntry extends AccountBalance {
  accountType: string;
  rootType: string;
  parentId?: string;
  isGroup: boolean;
}

// GL Entry filter options
export interface GLEntryFilters {
  orgId: string;
  accountId?: string;
  accountIds?: string[];
  partyType?: string;
  partyId?: string;
  costCenterId?: string;
  projectId?: string;
  voucherType?: string;
  voucherId?: string;
  fromDate?: Date;
  toDate?: Date;
  isCancelled?: boolean;
  isOpening?: boolean;
}

// Helper to toggle negative debit/credit
export function toggleDebitCreditIfNegative(entry: GLEntryInput): GLEntryInput {
  let { debit, credit, debitInAccountCurrency, creditInAccountCurrency } = entry;

  if (debit < 0) {
    credit = Math.abs(debit);
    debit = 0;
    creditInAccountCurrency = Math.abs(debitInAccountCurrency);
    debitInAccountCurrency = 0;
  }

  if (credit < 0) {
    debit = Math.abs(credit);
    credit = 0;
    debitInAccountCurrency = Math.abs(creditInAccountCurrency);
    creditInAccountCurrency = 0;
  }

  return { ...entry, debit, credit, debitInAccountCurrency, creditInAccountCurrency };
}

// Helper to create reversed GL entries for cancellation
export function createReversedGLEntry(original: GLEntry): Omit<GLEntry, 'id' | 'createdAt'> {
  return {
    ...original,
    debit: original.credit,
    credit: original.debit,
    debitInAccountCurrency: original.creditInAccountCurrency,
    creditInAccountCurrency: original.debitInAccountCurrency,
    remarks: `Reversal of ${original.voucherNo}`,
    postingDatetime: new Date(),
  };
}

// Helper to merge similar GL entries
export function mergeSimilarGLEntries(entries: GLEntryInput[]): GLEntryInput[] {
  const merged = new Map<string, GLEntryInput>();

  for (const entry of entries) {
    const key = `${entry.accountId}-${entry.partyType || ''}-${entry.partyId || ''}-${entry.costCenterId || ''}`;

    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.debit += entry.debit;
      existing.credit += entry.credit;
      existing.debitInAccountCurrency += entry.debitInAccountCurrency;
      existing.creditInAccountCurrency += entry.creditInAccountCurrency;
    } else {
      merged.set(key, { ...entry });
    }
  }

  // Filter out zero entries
  return Array.from(merged.values()).filter(
    e => e.debit !== 0 || e.credit !== 0
  );
}

// Helper to validate double-entry
export function validateDoubleEntry(entries: GLEntryInput[]): { valid: boolean; difference: number } {
  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);

  return {
    valid: difference < 0.01,  // Allow small rounding differences
    difference,
  };
}
