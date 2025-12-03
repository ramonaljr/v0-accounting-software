/**
 * Account Model (Chart of Accounts)
 * Based on ERPNext's Account DocType
 */

import { z } from 'zod';

// Root types for account classification
export const RootType = z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']);
export type RootType = z.infer<typeof RootType>;

// Report types for financial statements
export const ReportType = z.enum(['Balance Sheet', 'Profit and Loss']);
export type ReportType = z.infer<typeof ReportType>;

// Account types for specific account behaviors
export const AccountType = z.enum([
  'Bank',
  'Cash',
  'Receivable',
  'Payable',
  'Stock',
  'Tax',
  'Chargeable',
  'Income Account',
  'Expense Account',
  'Equity',
  'Fixed Asset',
  'Accumulated Depreciation',
  'Cost of Goods Sold',
  'Round Off',
  'Temporary',
  'Depreciation',
  'Capital Work in Progress',
  'Stock Received But Not Billed',
  'Stock Adjustment',
  'Expenses Included In Asset Valuation',
  'Expenses Included In Valuation',
]);
export type AccountType = z.infer<typeof AccountType>;

// Balance direction constraint
export const BalanceMustBe = z.enum(['Debit', 'Credit']);
export type BalanceMustBe = z.infer<typeof BalanceMustBe>;

// Full Account schema
export const AccountSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Identification
  code: z.string().max(20),
  name: z.string().min(1).max(255),

  // Legacy field (maps to root_type)
  accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),

  // Classification (ERPNext style)
  rootType: RootType,
  reportType: ReportType,
  specificAccountType: AccountType.optional(),

  // Hierarchy (nested set model)
  parentId: z.string().uuid().nullable(),
  lft: z.number().int().default(0),
  rgt: z.number().int().default(0),
  isGroup: z.boolean().default(false),

  // Currency
  currency: z.string().length(3).default('PHP'),

  // Control flags
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFrozen: z.boolean().default(false),
  balanceMustBe: BalanceMustBe.optional(),

  // Tax
  taxRate: z.number().min(0).max(100).optional(),

  // Balance (cached from GL entries)
  balance: z.number().default(0),
  balanceDate: z.date().optional(),

  // Description
  description: z.string().optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

export type Account = z.infer<typeof AccountSchema>;

// Schema for creating a new account
export const CreateAccountSchema = AccountSchema.omit({
  id: true,
  lft: true,
  rgt: true,
  balance: true,
  balanceDate: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAccount = z.infer<typeof CreateAccountSchema>;

// Schema for updating an account
export const UpdateAccountSchema = CreateAccountSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateAccount = z.infer<typeof UpdateAccountSchema>;

// Account with children for tree view
export interface AccountWithChildren extends Account {
  children?: AccountWithChildren[];
  level?: number;
  path?: string;
}

// Helper to determine root type from legacy account type
export function getRootTypeFromAccountType(accountType: string): RootType {
  switch (accountType.toLowerCase()) {
    case 'asset':
      return 'Asset';
    case 'liability':
      return 'Liability';
    case 'equity':
      return 'Equity';
    case 'revenue':
    case 'income':
      return 'Income';
    case 'expense':
      return 'Expense';
    default:
      throw new Error(`Unknown account type: ${accountType}`);
  }
}

// Helper to determine report type from root type
export function getReportTypeFromRootType(rootType: RootType): ReportType {
  switch (rootType) {
    case 'Asset':
    case 'Liability':
    case 'Equity':
      return 'Balance Sheet';
    case 'Income':
    case 'Expense':
      return 'Profit and Loss';
  }
}

// Helper to determine if account has normal debit balance
export function hasNormalDebitBalance(rootType: RootType): boolean {
  return rootType === 'Asset' || rootType === 'Expense';
}

// Helper to determine if account has normal credit balance
export function hasNormalCreditBalance(rootType: RootType): boolean {
  return rootType === 'Liability' || rootType === 'Equity' || rootType === 'Income';
}
