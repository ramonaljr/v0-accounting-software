/**
 * Journal Entry Model
 * Based on ERPNext's Journal Entry DocType
 */

import { z } from 'zod';

// Voucher types for journal entries
export const VoucherType = z.enum([
  'Journal Entry',
  'Bank Entry',
  'Cash Entry',
  'Credit Note',
  'Debit Note',
  'Contra Entry',
  'Excise Entry',
  'Write Off Entry',
  'Opening Entry',
  'Depreciation Entry',
  'Exchange Rate Revaluation',
  'Deferred Revenue',
  'Deferred Expense',
  'Inter Company Journal Entry',
]);
export type VoucherType = z.infer<typeof VoucherType>;

// Journal Entry status
export const JournalEntryStatus = z.enum(['Draft', 'Submitted', 'Cancelled']);
export type JournalEntryStatus = z.infer<typeof JournalEntryStatus>;

// Party types for journal entry lines
export const PartyType = z.enum(['Customer', 'Supplier', 'Employee', 'Shareholder', 'Member']);
export type PartyType = z.infer<typeof PartyType>;

// Journal Entry Account (line item) schema
export const JournalEntryAccountSchema = z.object({
  id: z.string().uuid(),
  journalEntryId: z.string().uuid(),
  orgId: z.string().uuid(),
  idx: z.number().int().min(0).default(0),

  // Account
  accountId: z.string().uuid(),

  // Party (Customer/Supplier/Employee)
  partyType: PartyType.optional(),
  partyId: z.string().uuid().optional(),

  // Amounts in account currency
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),

  // Amounts in company currency (base currency)
  baseDebit: z.number().min(0).default(0),
  baseCredit: z.number().min(0).default(0),

  // Exchange rate (account currency to base currency)
  exchangeRate: z.number().positive().default(1),
  currency: z.string().length(3).default('PHP'),

  // FX rate (for display)
  fxRate: z.number().positive().default(1),

  // Dimensions
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  dimension1: z.string().optional(),        // Custom dimension
  dimension2: z.string().optional(),        // Custom dimension

  // Reference
  againstAccount: z.string().optional(),    // Contra account names
  referenceType: z.string().optional(),     // Sales Invoice, Purchase Invoice, etc.
  referenceId: z.string().uuid().optional(),

  description: z.string().optional(),

  createdAt: z.date(),
}).refine(
  (data) => !(data.debit > 0 && data.credit > 0),
  { message: 'Entry cannot have both debit and credit' }
);

export type JournalEntryAccount = z.infer<typeof JournalEntryAccountSchema>;

// Journal Entry (header) schema
export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Naming
  entryNumber: z.string(),                  // Auto-generated: JE-2024-00001
  namingSeries: z.string().default('JE'),

  // Dates
  entryDate: z.date(),
  postingDate: z.date().optional(),

  // Type
  voucherType: VoucherType.default('Journal Entry'),

  // Description
  description: z.string(),

  // Totals (calculated from lines)
  totalDebit: z.number().min(0).default(0),
  totalCredit: z.number().min(0).default(0),

  // Multi-currency
  isMultiCurrency: z.boolean().default(false),

  // Status
  status: JournalEntryStatus.default('Draft'),
  isPosted: z.boolean().default(false),
  isLocked: z.boolean().default(false),

  // Source
  source: z.string().default('manual'),     // manual, bank_feed, ai_bot, invoice, bill
  sourceId: z.string().uuid().optional(),

  // References
  reference: z.string().optional(),         // External reference number

  // Write-off
  writeOffAccountId: z.string().uuid().optional(),
  writeOffAmount: z.number().optional(),

  // Fiscal
  fiscalYearId: z.string().uuid().optional(),

  // Amendment tracking
  amendedFrom: z.string().uuid().optional(),

  // Line items
  accounts: z.array(JournalEntryAccountSchema).optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  postedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  createdBy: z.string().uuid(),
  postedBy: z.string().uuid().optional(),
  cancelledBy: z.string().uuid().optional(),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;

// Schema for creating a new journal entry
export const CreateJournalEntrySchema = z.object({
  orgId: z.string().uuid(),
  entryDate: z.date(),
  voucherType: VoucherType.default('Journal Entry'),
  description: z.string().min(1),
  reference: z.string().optional(),
  source: z.string().default('manual'),
  sourceId: z.string().uuid().optional(),
  isMultiCurrency: z.boolean().default(false),
  accounts: z.array(z.object({
    accountId: z.string().uuid(),
    partyType: PartyType.optional(),
    partyId: z.string().uuid().optional(),
    debit: z.number().min(0).default(0),
    credit: z.number().min(0).default(0),
    exchangeRate: z.number().positive().default(1),
    currency: z.string().length(3).default('PHP'),
    costCenterId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    description: z.string().optional(),
  })).min(2),                               // At least 2 lines required
}).refine(
  (data) => {
    const totalDebit = data.accounts.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = data.accounts.reduce((sum, a) => sum + a.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  },
  { message: 'Journal entry must be balanced (total debit must equal total credit)' }
);

export type CreateJournalEntry = z.infer<typeof CreateJournalEntrySchema>;

// Schema for updating a draft journal entry
export const UpdateJournalEntrySchema = CreateJournalEntrySchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateJournalEntry = z.infer<typeof UpdateJournalEntrySchema>;

// Helper to calculate totals from accounts
export function calculateJournalEntryTotals(accounts: Pick<JournalEntryAccount, 'debit' | 'credit' | 'baseDebit' | 'baseCredit'>[]) {
  const totalDebit = accounts.reduce((sum, a) => sum + (a.baseDebit || a.debit), 0);
  const totalCredit = accounts.reduce((sum, a) => sum + (a.baseCredit || a.credit), 0);

  return {
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    difference: totalDebit - totalCredit,
  };
}

// Helper to generate against_account string
export function generateAgainstAccounts(
  accounts: Pick<JournalEntryAccount, 'accountId' | 'debit' | 'credit'>[],
  accountNames: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const account of accounts) {
    const contraAccounts: string[] = [];

    for (const other of accounts) {
      if (other.accountId === account.accountId) continue;

      // If this is a debit, contra is the credits
      if (account.debit > 0 && other.credit > 0) {
        contraAccounts.push(accountNames[other.accountId] || other.accountId);
      }
      // If this is a credit, contra is the debits
      if (account.credit > 0 && other.debit > 0) {
        contraAccounts.push(accountNames[other.accountId] || other.accountId);
      }
    }

    result[account.accountId] = contraAccounts.join(', ');
  }

  return result;
}
