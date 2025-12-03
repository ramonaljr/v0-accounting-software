# ERPNext to Accunza Migration Plan

## Executive Summary

This document outlines the plan to replicate ERPNext's core functionality in TypeScript/Next.js for the Accunza accounting platform. We are building a modern, AI-powered accounting SaaS that incorporates ERPNext's battle-tested accounting logic while leveraging our stack (Next.js 15, Supabase, TypeScript).

**Scope:**
1. **Accounting Core** (Phase 1 - Priority)
2. **Accounts Receivable/Payable** (Phase 2)
3. **Inventory/Stock Management** (Phase 3)
4. **Manufacturing with Full MRP** (Phase 4)
5. **HR/Payroll with PH Compliance** (Phase 5)

**Target Region:** Philippines (PH) with BIR compliance

---

## Architecture Overview

### ERPNext vs Accunza Comparison

| Aspect | ERPNext | Accunza |
|--------|---------|---------|
| Framework | Python/Frappe | TypeScript/Next.js 15 |
| Database | MariaDB | PostgreSQL (Supabase) |
| ORM | Frappe DocType | Prisma/Drizzle + Raw SQL |
| Auth | Frappe Auth | Supabase Auth |
| Storage | Frappe Files | Supabase Storage |
| Real-time | Frappe Socket | Supabase Realtime |
| API | Frappe REST/RPC | Next.js API Routes + Server Actions |
| UI | Frappe Desk | React 19 + Shadcn UI |

### Directory Structure

```
lib/
├── models/                     # Domain entity definitions (Zod schemas)
│   ├── accounting/
│   │   ├── account.ts          # Chart of Accounts
│   │   ├── journal-entry.ts    # Journal Entry
│   │   ├── gl-entry.ts         # General Ledger Entry
│   │   ├── fiscal-year.ts      # Fiscal Year
│   │   ├── cost-center.ts      # Cost Center
│   │   ├── payment-entry.ts    # Payment Entry
│   │   └── index.ts
│   ├── receivable/
│   │   ├── customer.ts
│   │   ├── sales-invoice.ts
│   │   └── index.ts
│   ├── payable/
│   │   ├── supplier.ts
│   │   ├── purchase-invoice.ts
│   │   └── index.ts
│   ├── inventory/
│   │   ├── item.ts
│   │   ├── warehouse.ts
│   │   ├── stock-ledger-entry.ts
│   │   ├── bin.ts
│   │   └── index.ts
│   ├── manufacturing/
│   │   ├── bom.ts
│   │   ├── work-order.ts
│   │   ├── production-plan.ts
│   │   └── index.ts
│   └── payroll/
│       ├── employee.ts
│       ├── salary-structure.ts
│       ├── salary-slip.ts
│       └── index.ts
│
├── services/                   # Business logic layer
│   ├── accounting/
│   │   ├── ledger.service.ts           # GL posting engine
│   │   ├── journal-entry.service.ts    # JE lifecycle
│   │   ├── account.service.ts          # CoA management
│   │   ├── fiscal-year.service.ts      # Period management
│   │   ├── payment.service.ts          # Payment processing
│   │   └── index.ts
│   ├── inventory/
│   │   ├── stock-ledger.service.ts     # Stock posting
│   │   ├── valuation.service.ts        # FIFO/Moving Avg
│   │   └── index.ts
│   ├── manufacturing/
│   │   ├── mrp.service.ts              # MRP calculations
│   │   ├── work-order.service.ts       # WO lifecycle
│   │   └── index.ts
│   └── payroll/
│       ├── salary-slip.service.ts      # Payroll calc
│       ├── tax.service.ts              # PH tax tables
│       └── index.ts
│
├── db/                         # Database utilities
│   ├── schema/                 # Drizzle schema definitions
│   ├── migrations/             # SQL migrations
│   └── seed/                   # Seed data (COA templates)
│
└── utils/                      # Shared utilities
    ├── currency.ts             # Multi-currency helpers
    ├── fiscal.ts               # Fiscal year helpers
    └── formula-engine.ts       # Expression evaluator
```

---

## Phase 1: Accounting Core

### 1.1 Database Schema

#### accounts (Chart of Accounts)
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Core fields
  account_code VARCHAR(20),
  account_name VARCHAR(255) NOT NULL,

  -- Hierarchy (nested set model)
  parent_id UUID REFERENCES accounts(id),
  lft INTEGER NOT NULL DEFAULT 0,
  rgt INTEGER NOT NULL DEFAULT 0,
  is_group BOOLEAN NOT NULL DEFAULT false,

  -- Classification
  root_type VARCHAR(20) NOT NULL CHECK (root_type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('Balance Sheet', 'Profit and Loss')),
  account_type VARCHAR(50), -- Bank, Cash, Receivable, Payable, Stock, etc.

  -- Currency
  account_currency VARCHAR(3) DEFAULT 'PHP',

  -- Control flags
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  balance_must_be VARCHAR(10) CHECK (balance_must_be IN ('Debit', 'Credit')),

  -- Tax
  tax_rate DECIMAL(5, 2),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(org_id, account_code),
  UNIQUE(org_id, account_name, parent_id)
);

-- RLS Policy
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_org_isolation ON accounts
  USING (org_id = current_setting('app.current_org_id')::UUID);
```

#### fiscal_years
```sql
CREATE TABLE fiscal_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  year_name VARCHAR(20) NOT NULL,           -- e.g., "2024", "2024-25"
  year_start_date DATE NOT NULL,
  year_end_date DATE NOT NULL,

  is_closed BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, year_name),
  CONSTRAINT valid_date_range CHECK (year_end_date > year_start_date)
);
```

#### cost_centers
```sql
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  cost_center_code VARCHAR(20),
  cost_center_name VARCHAR(255) NOT NULL,

  -- Hierarchy
  parent_id UUID REFERENCES cost_centers(id),
  lft INTEGER NOT NULL DEFAULT 0,
  rgt INTEGER NOT NULL DEFAULT 0,
  is_group BOOLEAN NOT NULL DEFAULT false,

  is_disabled BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, cost_center_code),
  UNIQUE(org_id, cost_center_name, parent_id)
);
```

#### journal_entries
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Naming
  voucher_no VARCHAR(50) NOT NULL,          -- Auto-generated: JE-2024-00001
  naming_series VARCHAR(20) DEFAULT 'JE',

  -- Dates
  posting_date DATE NOT NULL,

  -- Type
  voucher_type VARCHAR(50) NOT NULL DEFAULT 'Journal Entry',
  -- Types: Journal Entry, Bank Entry, Cash Entry, Credit Note, Debit Note,
  --        Contra Entry, Excise Entry, Write Off Entry, Opening Entry,
  --        Depreciation Entry, Exchange Rate Revaluation, etc.

  -- Totals (calculated)
  total_debit DECIMAL(20, 4) NOT NULL DEFAULT 0,
  total_credit DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Multi-currency
  is_multi_currency BOOLEAN NOT NULL DEFAULT false,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Cancelled')),

  -- References
  reference_number VARCHAR(100),
  reference_date DATE,
  user_remarks TEXT,

  -- Write-off
  write_off_account_id UUID REFERENCES accounts(id),
  write_off_amount DECIMAL(20, 4),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  submitted_by UUID REFERENCES auth.users(id),

  -- Amendment tracking
  amended_from UUID REFERENCES journal_entries(id),

  UNIQUE(org_id, voucher_no)
);
```

#### journal_entry_accounts (child table)
```sql
CREATE TABLE journal_entry_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL DEFAULT 0,           -- Row order

  -- Account
  account_id UUID NOT NULL REFERENCES accounts(id),

  -- Party (Customer/Supplier/Employee)
  party_type VARCHAR(50),                   -- Customer, Supplier, Employee
  party_id UUID,                            -- Reference to party table

  -- Amounts in account currency
  debit_in_account_currency DECIMAL(20, 4) NOT NULL DEFAULT 0,
  credit_in_account_currency DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Amounts in company currency (PHP)
  debit DECIMAL(20, 4) NOT NULL DEFAULT 0,
  credit DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Exchange rate
  exchange_rate DECIMAL(15, 9) NOT NULL DEFAULT 1,
  account_currency VARCHAR(3) DEFAULT 'PHP',

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,                          -- Future: projects table

  -- Reference
  against_account VARCHAR(255),             -- Contra account names
  reference_type VARCHAR(50),               -- Sales Invoice, Purchase Invoice, etc.
  reference_id UUID,
  reference_detail_id UUID,

  remarks TEXT,

  CONSTRAINT valid_amounts CHECK (
    (debit_in_account_currency >= 0 AND credit_in_account_currency >= 0) AND
    NOT (debit_in_account_currency > 0 AND credit_in_account_currency > 0)
  )
);
```

#### gl_entries (General Ledger - immutable audit trail)
```sql
CREATE TABLE gl_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Timing
  posting_date DATE NOT NULL,
  posting_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),

  -- Account
  account_id UUID NOT NULL REFERENCES accounts(id),
  account_currency VARCHAR(3) NOT NULL DEFAULT 'PHP',

  -- Party
  party_type VARCHAR(50),
  party_id UUID,

  -- Amounts (account currency)
  debit_in_account_currency DECIMAL(20, 4) NOT NULL DEFAULT 0,
  credit_in_account_currency DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Amounts (company currency)
  debit DECIMAL(20, 4) NOT NULL DEFAULT 0,
  credit DECIMAL(20, 4) NOT NULL DEFAULT 0,
  exchange_rate DECIMAL(15, 9) NOT NULL DEFAULT 1,

  -- Source document
  voucher_type VARCHAR(50) NOT NULL,        -- Journal Entry, Sales Invoice, etc.
  voucher_id UUID NOT NULL,
  voucher_no VARCHAR(50) NOT NULL,
  voucher_detail_id UUID,                   -- Line item reference

  -- Matching (for reconciliation)
  against_voucher_type VARCHAR(50),
  against_voucher_id UUID,

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,

  -- Flags
  is_opening BOOLEAN NOT NULL DEFAULT false,
  is_advance BOOLEAN NOT NULL DEFAULT false,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,

  remarks TEXT,

  -- Audit (immutable after creation)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Index for fast queries
  CONSTRAINT gl_entries_check CHECK (
    NOT (debit > 0 AND credit > 0)
  )
);

-- Indexes for common queries
CREATE INDEX idx_gl_entries_account ON gl_entries(account_id, posting_date);
CREATE INDEX idx_gl_entries_voucher ON gl_entries(voucher_type, voucher_id);
CREATE INDEX idx_gl_entries_party ON gl_entries(party_type, party_id, posting_date);
CREATE INDEX idx_gl_entries_posting_date ON gl_entries(org_id, posting_date);
```

#### payment_entries
```sql
CREATE TABLE payment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Naming
  voucher_no VARCHAR(50) NOT NULL,
  naming_series VARCHAR(20) DEFAULT 'PAY',

  -- Type
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('Receive', 'Pay', 'Internal Transfer')),

  -- Dates
  posting_date DATE NOT NULL,

  -- Party
  party_type VARCHAR(50),                   -- Customer, Supplier
  party_id UUID,
  party_name VARCHAR(255),

  -- Payment method
  mode_of_payment VARCHAR(50),              -- Cash, Bank Transfer, Cheque, etc.

  -- Bank accounts
  paid_from_account_id UUID REFERENCES accounts(id),
  paid_to_account_id UUID REFERENCES accounts(id),

  -- Amounts
  paid_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,
  received_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Multi-currency
  source_exchange_rate DECIMAL(15, 9) NOT NULL DEFAULT 1,
  target_exchange_rate DECIMAL(15, 9) NOT NULL DEFAULT 1,

  -- Allocation
  total_allocated_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,
  unallocated_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Difference
  difference_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Bank details
  reference_number VARCHAR(100),
  reference_date DATE,
  cheque_number VARCHAR(50),
  cheque_date DATE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Draft',

  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, voucher_no)
);

-- Payment allocation to invoices
CREATE TABLE payment_entry_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_entry_id UUID NOT NULL REFERENCES payment_entries(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL DEFAULT 0,

  reference_doctype VARCHAR(50) NOT NULL,   -- Sales Invoice, Purchase Invoice
  reference_id UUID NOT NULL,
  reference_name VARCHAR(50) NOT NULL,

  total_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,
  outstanding_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,
  allocated_amount DECIMAL(20, 4) NOT NULL DEFAULT 0,

  exchange_rate DECIMAL(15, 9) NOT NULL DEFAULT 1,
  exchange_gain_loss DECIMAL(20, 4) NOT NULL DEFAULT 0
);
```

### 1.2 TypeScript Models (Zod Schemas)

```typescript
// lib/models/accounting/account.ts
import { z } from 'zod';

export const RootType = z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']);
export const ReportType = z.enum(['Balance Sheet', 'Profit and Loss']);
export const AccountType = z.enum([
  'Bank', 'Cash', 'Receivable', 'Payable', 'Stock',
  'Tax', 'Expense', 'Income', 'Equity', 'Fixed Asset',
  'Accumulated Depreciation', 'Cost of Goods Sold',
  'Round Off', 'Temporary'
]);

export const AccountSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  accountCode: z.string().max(20).optional(),
  accountName: z.string().min(1).max(255),

  parentId: z.string().uuid().nullable(),
  lft: z.number().int(),
  rgt: z.number().int(),
  isGroup: z.boolean().default(false),

  rootType: RootType,
  reportType: ReportType,
  accountType: AccountType.optional(),

  accountCurrency: z.string().length(3).default('PHP'),

  isFrozen: z.boolean().default(false),
  balanceMustBe: z.enum(['Debit', 'Credit']).optional(),

  taxRate: z.number().min(0).max(100).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

export type Account = z.infer<typeof AccountSchema>;

export const CreateAccountSchema = AccountSchema.omit({
  id: true,
  lft: true,
  rgt: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAccount = z.infer<typeof CreateAccountSchema>;
```

```typescript
// lib/models/accounting/journal-entry.ts
import { z } from 'zod';

export const VoucherType = z.enum([
  'Journal Entry', 'Bank Entry', 'Cash Entry',
  'Credit Note', 'Debit Note', 'Contra Entry',
  'Write Off Entry', 'Opening Entry', 'Depreciation Entry',
  'Exchange Rate Revaluation', 'Deferred Revenue', 'Deferred Expense'
]);

export const JournalEntryStatus = z.enum(['Draft', 'Submitted', 'Cancelled']);

export const JournalEntryAccountSchema = z.object({
  id: z.string().uuid(),
  journalEntryId: z.string().uuid(),
  idx: z.number().int().min(0),

  accountId: z.string().uuid(),

  partyType: z.string().optional(),
  partyId: z.string().uuid().optional(),

  debitInAccountCurrency: z.number().min(0).default(0),
  creditInAccountCurrency: z.number().min(0).default(0),

  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),

  exchangeRate: z.number().positive().default(1),
  accountCurrency: z.string().length(3).default('PHP'),

  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  againstAccount: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),

  remarks: z.string().optional(),
}).refine(
  (data) => !(data.debitInAccountCurrency > 0 && data.creditInAccountCurrency > 0),
  { message: 'Entry cannot have both debit and credit' }
);

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  voucherNo: z.string(),
  namingSeries: z.string().default('JE'),

  postingDate: z.date(),

  voucherType: VoucherType.default('Journal Entry'),

  totalDebit: z.number().min(0).default(0),
  totalCredit: z.number().min(0).default(0),

  isMultiCurrency: z.boolean().default(false),

  status: JournalEntryStatus.default('Draft'),

  referenceNumber: z.string().optional(),
  referenceDate: z.date().optional(),
  userRemarks: z.string().optional(),

  writeOffAccountId: z.string().uuid().optional(),
  writeOffAmount: z.number().optional(),

  accounts: z.array(JournalEntryAccountSchema),

  createdAt: z.date(),
  updatedAt: z.date(),
  submittedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  submittedBy: z.string().uuid().optional(),

  amendedFrom: z.string().uuid().optional(),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalEntryAccount = z.infer<typeof JournalEntryAccountSchema>;
```

### 1.3 Core Services

```typescript
// lib/services/accounting/ledger.service.ts

import { createClient } from '@/lib/supabase/server';
import type { JournalEntry, JournalEntryAccount } from '@/lib/models/accounting';

interface GLEntryInput {
  orgId: string;
  postingDate: Date;
  fiscalYearId: string;
  accountId: string;
  accountCurrency: string;
  partyType?: string;
  partyId?: string;
  debitInAccountCurrency: number;
  creditInAccountCurrency: number;
  debit: number;
  credit: number;
  exchangeRate: number;
  voucherType: string;
  voucherId: string;
  voucherNo: string;
  voucherDetailId?: string;
  againstVoucherType?: string;
  againstVoucherId?: string;
  costCenterId?: string;
  projectId?: string;
  isOpening?: boolean;
  isAdvance?: boolean;
  remarks?: string;
}

export class LedgerService {
  /**
   * Main GL posting function - equivalent to ERPNext's make_gl_entries()
   */
  static async makeGLEntries(
    entries: GLEntryInput[],
    options: {
      allowNegativeStock?: boolean;
      viaLandedCostVoucher?: boolean;
      cancelExisting?: boolean;
    } = {}
  ): Promise<void> {
    const supabase = await createClient();

    // Validate accounting period is not closed
    await this.validateAccountingPeriod(entries[0].orgId, entries[0].postingDate);

    // Process and validate entries
    const processedEntries = await this.processGLMap(entries);

    // Validate double-entry
    this.validateDoubleEntry(processedEntries);

    // Check for disabled accounts
    await this.validateDisabledAccounts(processedEntries);

    // Insert GL entries
    await this.saveEntries(processedEntries);
  }

  /**
   * Process GL entry map - merge duplicates, handle negatives
   */
  private static async processGLMap(entries: GLEntryInput[]): Promise<GLEntryInput[]> {
    // Toggle negative values (convert negative debit to credit and vice versa)
    const toggled = entries.map(entry => this.toggleDebitCreditIfNegative(entry));

    // Merge duplicate entries (same account, party, cost center)
    const merged = this.mergeSimilarEntries(toggled);

    // Remove zero entries
    return merged.filter(e => e.debit !== 0 || e.credit !== 0);
  }

  /**
   * Convert negative debit to credit and vice versa
   */
  private static toggleDebitCreditIfNegative(entry: GLEntryInput): GLEntryInput {
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

  /**
   * Merge entries with same account, party, and dimensions
   */
  private static mergeSimilarEntries(entries: GLEntryInput[]): GLEntryInput[] {
    const merged = new Map<string, GLEntryInput>();

    for (const entry of entries) {
      const key = `${entry.accountId}-${entry.partyType}-${entry.partyId}-${entry.costCenterId}`;

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

    return Array.from(merged.values());
  }

  /**
   * Validate that total debit equals total credit
   */
  private static validateDoubleEntry(entries: GLEntryInput[]): void {
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    // Allow small rounding differences (0.01)
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      throw new Error(
        `Debit and Credit not equal. Difference: ${difference.toFixed(4)}`
      );
    }
  }

  /**
   * Check if posting date is within open accounting period
   */
  private static async validateAccountingPeriod(
    orgId: string,
    postingDate: Date
  ): Promise<void> {
    const supabase = await createClient();

    const { data: fiscalYear, error } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('org_id', orgId)
      .lte('year_start_date', postingDate.toISOString().split('T')[0])
      .gte('year_end_date', postingDate.toISOString().split('T')[0])
      .single();

    if (error || !fiscalYear) {
      throw new Error(`No fiscal year found for date ${postingDate.toISOString().split('T')[0]}`);
    }

    if (fiscalYear.is_closed) {
      throw new Error(`Fiscal year ${fiscalYear.year_name} is closed`);
    }
  }

  /**
   * Validate that none of the accounts are disabled/frozen
   */
  private static async validateDisabledAccounts(entries: GLEntryInput[]): Promise<void> {
    const supabase = await createClient();
    const accountIds = [...new Set(entries.map(e => e.accountId))];

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, account_name, is_frozen')
      .in('id', accountIds);

    if (error) throw error;

    const frozenAccounts = accounts?.filter(a => a.is_frozen) || [];
    if (frozenAccounts.length > 0) {
      throw new Error(
        `Cannot post to frozen accounts: ${frozenAccounts.map(a => a.account_name).join(', ')}`
      );
    }
  }

  /**
   * Save GL entries to database
   */
  private static async saveEntries(entries: GLEntryInput[]): Promise<void> {
    const supabase = await createClient();

    const glEntries = entries.map(entry => ({
      org_id: entry.orgId,
      posting_date: entry.postingDate.toISOString().split('T')[0],
      posting_datetime: new Date().toISOString(),
      fiscal_year_id: entry.fiscalYearId,
      account_id: entry.accountId,
      account_currency: entry.accountCurrency,
      party_type: entry.partyType,
      party_id: entry.partyId,
      debit_in_account_currency: entry.debitInAccountCurrency,
      credit_in_account_currency: entry.creditInAccountCurrency,
      debit: entry.debit,
      credit: entry.credit,
      exchange_rate: entry.exchangeRate,
      voucher_type: entry.voucherType,
      voucher_id: entry.voucherId,
      voucher_no: entry.voucherNo,
      voucher_detail_id: entry.voucherDetailId,
      against_voucher_type: entry.againstVoucherType,
      against_voucher_id: entry.againstVoucherId,
      cost_center_id: entry.costCenterId,
      project_id: entry.projectId,
      is_opening: entry.isOpening || false,
      is_advance: entry.isAdvance || false,
      is_cancelled: false,
      remarks: entry.remarks,
    }));

    const { error } = await supabase.from('gl_entries').insert(glEntries);

    if (error) throw error;
  }

  /**
   * Get account balance at a specific date
   */
  static async getBalanceOn(
    accountId: string,
    date: Date,
    options: {
      partyType?: string;
      partyId?: string;
      costCenterId?: string;
      inAccountCurrency?: boolean;
    } = {}
  ): Promise<number> {
    const supabase = await createClient();

    let query = supabase
      .from('gl_entries')
      .select('debit, credit, debit_in_account_currency, credit_in_account_currency')
      .eq('account_id', accountId)
      .eq('is_cancelled', false)
      .lte('posting_date', date.toISOString().split('T')[0]);

    if (options.partyType && options.partyId) {
      query = query.eq('party_type', options.partyType).eq('party_id', options.partyId);
    }

    if (options.costCenterId) {
      query = query.eq('cost_center_id', options.costCenterId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (options.inAccountCurrency) {
      return (data || []).reduce(
        (balance, entry) => balance + entry.debit_in_account_currency - entry.credit_in_account_currency,
        0
      );
    }

    return (data || []).reduce(
      (balance, entry) => balance + entry.debit - entry.credit,
      0
    );
  }

  /**
   * Create reverse GL entries for cancellation
   */
  static async makeReverseGLEntries(
    voucherType: string,
    voucherId: string
  ): Promise<void> {
    const supabase = await createClient();

    // Fetch original entries
    const { data: originalEntries, error } = await supabase
      .from('gl_entries')
      .select('*')
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId)
      .eq('is_cancelled', false);

    if (error) throw error;
    if (!originalEntries || originalEntries.length === 0) return;

    // Create reversed entries (swap debit/credit)
    const reversedEntries = originalEntries.map(entry => ({
      ...entry,
      id: undefined, // Generate new ID
      debit: entry.credit,
      credit: entry.debit,
      debit_in_account_currency: entry.credit_in_account_currency,
      credit_in_account_currency: entry.debit_in_account_currency,
      posting_datetime: new Date().toISOString(),
      remarks: `Reversal of ${entry.voucher_no}`,
    }));

    // Mark original entries as cancelled
    await supabase
      .from('gl_entries')
      .update({ is_cancelled: true })
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId);

    // Insert reversed entries
    await supabase.from('gl_entries').insert(reversedEntries);
  }
}
```

### 1.4 Chart of Accounts - Philippines Template

```typescript
// lib/db/seed/coa-philippines.ts

export const philippinesChartOfAccounts = {
  name: 'Philippines - Standard Chart of Accounts',
  country: 'PH',
  accounts: [
    // ASSETS (1xxxx)
    {
      accountCode: '1',
      accountName: 'Assets',
      rootType: 'Asset',
      reportType: 'Balance Sheet',
      isGroup: true,
      children: [
        {
          accountCode: '11',
          accountName: 'Current Assets',
          isGroup: true,
          children: [
            {
              accountCode: '1101',
              accountName: 'Cash and Cash Equivalents',
              isGroup: true,
              children: [
                { accountCode: '1101-001', accountName: 'Cash on Hand', accountType: 'Cash' },
                { accountCode: '1101-002', accountName: 'Petty Cash', accountType: 'Cash' },
                { accountCode: '1101-003', accountName: 'Cash in Bank - PHP', accountType: 'Bank' },
                { accountCode: '1101-004', accountName: 'Cash in Bank - USD', accountType: 'Bank', accountCurrency: 'USD' },
              ]
            },
            {
              accountCode: '1102',
              accountName: 'Trade and Other Receivables',
              isGroup: true,
              children: [
                { accountCode: '1102-001', accountName: 'Accounts Receivable', accountType: 'Receivable' },
                { accountCode: '1102-002', accountName: 'Allowance for Doubtful Accounts', accountType: 'Receivable' },
                { accountCode: '1102-003', accountName: 'Notes Receivable', accountType: 'Receivable' },
                { accountCode: '1102-004', accountName: 'Advances to Employees', accountType: 'Receivable' },
                { accountCode: '1102-005', accountName: 'Advances to Suppliers', accountType: 'Receivable' },
              ]
            },
            {
              accountCode: '1103',
              accountName: 'Inventories',
              isGroup: true,
              children: [
                { accountCode: '1103-001', accountName: 'Raw Materials', accountType: 'Stock' },
                { accountCode: '1103-002', accountName: 'Work in Process', accountType: 'Stock' },
                { accountCode: '1103-003', accountName: 'Finished Goods', accountType: 'Stock' },
                { accountCode: '1103-004', accountName: 'Merchandise Inventory', accountType: 'Stock' },
                { accountCode: '1103-005', accountName: 'Supplies Inventory' },
              ]
            },
            {
              accountCode: '1104',
              accountName: 'Prepaid Expenses',
              isGroup: true,
              children: [
                { accountCode: '1104-001', accountName: 'Prepaid Rent' },
                { accountCode: '1104-002', accountName: 'Prepaid Insurance' },
                { accountCode: '1104-003', accountName: 'Input VAT', accountType: 'Tax' },
                { accountCode: '1104-004', accountName: 'Creditable Withholding Tax' },
              ]
            },
          ]
        },
        {
          accountCode: '12',
          accountName: 'Non-Current Assets',
          isGroup: true,
          children: [
            {
              accountCode: '1201',
              accountName: 'Property, Plant and Equipment',
              isGroup: true,
              children: [
                { accountCode: '1201-001', accountName: 'Land', accountType: 'Fixed Asset' },
                { accountCode: '1201-002', accountName: 'Buildings', accountType: 'Fixed Asset' },
                { accountCode: '1201-003', accountName: 'Accumulated Depreciation - Buildings', accountType: 'Accumulated Depreciation' },
                { accountCode: '1201-004', accountName: 'Machinery and Equipment', accountType: 'Fixed Asset' },
                { accountCode: '1201-005', accountName: 'Accumulated Depreciation - Machinery', accountType: 'Accumulated Depreciation' },
                { accountCode: '1201-006', accountName: 'Furniture and Fixtures', accountType: 'Fixed Asset' },
                { accountCode: '1201-007', accountName: 'Accumulated Depreciation - Furniture', accountType: 'Accumulated Depreciation' },
                { accountCode: '1201-008', accountName: 'Transportation Equipment', accountType: 'Fixed Asset' },
                { accountCode: '1201-009', accountName: 'Accumulated Depreciation - Transportation', accountType: 'Accumulated Depreciation' },
                { accountCode: '1201-010', accountName: 'Computer Equipment', accountType: 'Fixed Asset' },
                { accountCode: '1201-011', accountName: 'Accumulated Depreciation - Computer', accountType: 'Accumulated Depreciation' },
              ]
            },
            {
              accountCode: '1202',
              accountName: 'Intangible Assets',
              isGroup: true,
              children: [
                { accountCode: '1202-001', accountName: 'Software' },
                { accountCode: '1202-002', accountName: 'Patents and Trademarks' },
                { accountCode: '1202-003', accountName: 'Accumulated Amortization' },
              ]
            },
          ]
        },
      ]
    },

    // LIABILITIES (2xxxx)
    {
      accountCode: '2',
      accountName: 'Liabilities',
      rootType: 'Liability',
      reportType: 'Balance Sheet',
      isGroup: true,
      children: [
        {
          accountCode: '21',
          accountName: 'Current Liabilities',
          isGroup: true,
          children: [
            {
              accountCode: '2101',
              accountName: 'Trade and Other Payables',
              isGroup: true,
              children: [
                { accountCode: '2101-001', accountName: 'Accounts Payable', accountType: 'Payable' },
                { accountCode: '2101-002', accountName: 'Notes Payable' },
                { accountCode: '2101-003', accountName: 'Accrued Expenses' },
                { accountCode: '2101-004', accountName: 'Advances from Customers' },
              ]
            },
            {
              accountCode: '2102',
              accountName: 'Tax Liabilities',
              isGroup: true,
              children: [
                { accountCode: '2102-001', accountName: 'Output VAT', accountType: 'Tax', taxRate: 12 },
                { accountCode: '2102-002', accountName: 'Withholding Tax Payable - Expanded' },
                { accountCode: '2102-003', accountName: 'Withholding Tax Payable - Compensation' },
                { accountCode: '2102-004', accountName: 'Income Tax Payable' },
                { accountCode: '2102-005', accountName: 'Percentage Tax Payable' },
              ]
            },
            {
              accountCode: '2103',
              accountName: 'Employee Benefits Payable',
              isGroup: true,
              children: [
                { accountCode: '2103-001', accountName: 'SSS Payable' },
                { accountCode: '2103-002', accountName: 'PhilHealth Payable' },
                { accountCode: '2103-003', accountName: 'Pag-IBIG Payable' },
                { accountCode: '2103-004', accountName: 'Salaries Payable' },
                { accountCode: '2103-005', accountName: '13th Month Pay Payable' },
              ]
            },
          ]
        },
        {
          accountCode: '22',
          accountName: 'Non-Current Liabilities',
          isGroup: true,
          children: [
            { accountCode: '2201-001', accountName: 'Long-term Loans Payable' },
            { accountCode: '2201-002', accountName: 'Deferred Tax Liability' },
          ]
        },
      ]
    },

    // EQUITY (3xxxx)
    {
      accountCode: '3',
      accountName: 'Equity',
      rootType: 'Equity',
      reportType: 'Balance Sheet',
      isGroup: true,
      children: [
        { accountCode: '3001', accountName: 'Share Capital', accountType: 'Equity' },
        { accountCode: '3002', accountName: 'Additional Paid-in Capital', accountType: 'Equity' },
        { accountCode: '3003', accountName: 'Retained Earnings', accountType: 'Equity' },
        { accountCode: '3004', accountName: 'Treasury Shares', accountType: 'Equity' },
        { accountCode: '3005', accountName: 'Owner\'s Equity', accountType: 'Equity' },
        { accountCode: '3006', accountName: 'Owner\'s Drawings', accountType: 'Equity' },
      ]
    },

    // INCOME (4xxxx)
    {
      accountCode: '4',
      accountName: 'Income',
      rootType: 'Income',
      reportType: 'Profit and Loss',
      isGroup: true,
      children: [
        {
          accountCode: '41',
          accountName: 'Revenue',
          isGroup: true,
          children: [
            { accountCode: '4101', accountName: 'Sales Revenue', accountType: 'Income' },
            { accountCode: '4102', accountName: 'Service Revenue', accountType: 'Income' },
            { accountCode: '4103', accountName: 'Sales Returns and Allowances', accountType: 'Income' },
            { accountCode: '4104', accountName: 'Sales Discounts', accountType: 'Income' },
          ]
        },
        {
          accountCode: '42',
          accountName: 'Other Income',
          isGroup: true,
          children: [
            { accountCode: '4201', accountName: 'Interest Income', accountType: 'Income' },
            { accountCode: '4202', accountName: 'Rental Income', accountType: 'Income' },
            { accountCode: '4203', accountName: 'Foreign Exchange Gain', accountType: 'Income' },
            { accountCode: '4204', accountName: 'Gain on Sale of Assets', accountType: 'Income' },
            { accountCode: '4205', accountName: 'Miscellaneous Income', accountType: 'Income' },
          ]
        },
      ]
    },

    // EXPENSES (5xxxx)
    {
      accountCode: '5',
      accountName: 'Expenses',
      rootType: 'Expense',
      reportType: 'Profit and Loss',
      isGroup: true,
      children: [
        {
          accountCode: '51',
          accountName: 'Cost of Sales',
          isGroup: true,
          children: [
            { accountCode: '5101', accountName: 'Cost of Goods Sold', accountType: 'Cost of Goods Sold' },
            { accountCode: '5102', accountName: 'Cost of Services' },
            { accountCode: '5103', accountName: 'Direct Labor' },
            { accountCode: '5104', accountName: 'Manufacturing Overhead' },
          ]
        },
        {
          accountCode: '52',
          accountName: 'Operating Expenses',
          isGroup: true,
          children: [
            {
              accountCode: '5201',
              accountName: 'Selling Expenses',
              isGroup: true,
              children: [
                { accountCode: '5201-001', accountName: 'Advertising Expense', accountType: 'Expense' },
                { accountCode: '5201-002', accountName: 'Commission Expense', accountType: 'Expense' },
                { accountCode: '5201-003', accountName: 'Delivery Expense', accountType: 'Expense' },
                { accountCode: '5201-004', accountName: 'Marketing Expense', accountType: 'Expense' },
              ]
            },
            {
              accountCode: '5202',
              accountName: 'Administrative Expenses',
              isGroup: true,
              children: [
                { accountCode: '5202-001', accountName: 'Salaries and Wages', accountType: 'Expense' },
                { accountCode: '5202-002', accountName: 'Employee Benefits', accountType: 'Expense' },
                { accountCode: '5202-003', accountName: 'SSS Contribution - Employer', accountType: 'Expense' },
                { accountCode: '5202-004', accountName: 'PhilHealth Contribution - Employer', accountType: 'Expense' },
                { accountCode: '5202-005', accountName: 'Pag-IBIG Contribution - Employer', accountType: 'Expense' },
                { accountCode: '5202-006', accountName: 'Rent Expense', accountType: 'Expense' },
                { accountCode: '5202-007', accountName: 'Utilities Expense', accountType: 'Expense' },
                { accountCode: '5202-008', accountName: 'Office Supplies Expense', accountType: 'Expense' },
                { accountCode: '5202-009', accountName: 'Depreciation Expense', accountType: 'Expense' },
                { accountCode: '5202-010', accountName: 'Insurance Expense', accountType: 'Expense' },
                { accountCode: '5202-011', accountName: 'Professional Fees', accountType: 'Expense' },
                { accountCode: '5202-012', accountName: 'Repairs and Maintenance', accountType: 'Expense' },
                { accountCode: '5202-013', accountName: 'Taxes and Licenses', accountType: 'Expense' },
                { accountCode: '5202-014', accountName: 'Bank Charges', accountType: 'Expense' },
                { accountCode: '5202-015', accountName: 'Miscellaneous Expense', accountType: 'Expense' },
              ]
            },
          ]
        },
        {
          accountCode: '53',
          accountName: 'Other Expenses',
          isGroup: true,
          children: [
            { accountCode: '5301', accountName: 'Interest Expense', accountType: 'Expense' },
            { accountCode: '5302', accountName: 'Foreign Exchange Loss', accountType: 'Expense' },
            { accountCode: '5303', accountName: 'Loss on Sale of Assets', accountType: 'Expense' },
            { accountCode: '5304', accountName: 'Bad Debts Expense', accountType: 'Expense' },
          ]
        },
      ]
    },
  ]
};
```

---

## Phase 2-5: Subsequent Modules

### Phase 2: Accounts Receivable/Payable
- Customer/Supplier master
- Sales Invoice / Purchase Invoice
- Payment allocation and reconciliation
- Aging reports
- Dunning and payment reminders

### Phase 3: Inventory/Stock Management
- Item master with FIFO/Moving Average valuation
- Warehouse hierarchy
- Stock Ledger Entry for audit trail
- Bin management for stock levels
- Stock Entry (transfers, receipts)
- Purchase Receipt / Delivery Note
- Stock Reconciliation

### Phase 4: Manufacturing with Full MRP
- BOM (Bill of Materials)
- Work Order lifecycle
- Production Plan with MRP calculations
- Operations and Workstations
- Job Cards for shop floor
- Subcontracting workflow

### Phase 5: HR/Payroll with PH Compliance
- Employee master
- Salary Structure and Components
- Salary Slip generation
- PH statutory deductions (SSS, PhilHealth, Pag-IBIG)
- Withholding tax (BIR tables)
- 13th month pay
- Leave integration with payroll

---

## Implementation Timeline

| Phase | Module | Estimated Effort |
|-------|--------|------------------|
| 1 | Accounting Core | Foundation |
| 2 | AR/AP | After Phase 1 |
| 3 | Inventory | After Phase 2 |
| 4 | Manufacturing | After Phase 3 |
| 5 | Payroll | After Phase 4 |

---

## Key Differences from ERPNext

1. **No DocType Framework**: We use TypeScript interfaces + Zod schemas instead of Frappe's DocType system
2. **Server Actions**: Next.js Server Actions replace Frappe's whitelisted methods
3. **RLS vs Python Permissions**: Supabase RLS policies replace Frappe's permission system
4. **Immutable GL**: Our GL entries are truly immutable (cancellation creates reversals)
5. **AI Integration**: Native AI agents for categorization, reconciliation (not in ERPNext)
6. **Modern UI**: React 19 + Shadcn vs Frappe Desk

---

## Next Steps

1. Review and approve this migration plan
2. Set up database migrations for Accounting Core
3. Implement TypeScript models and services
4. Build UI components for Chart of Accounts and Journal Entry
5. Integrate with existing Accunza authentication and multi-tenancy
