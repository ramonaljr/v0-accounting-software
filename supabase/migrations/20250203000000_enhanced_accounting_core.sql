-- Accunza Phase 2.3 - Enhanced Accounting Core (ERPNext-inspired)
-- Migration: Add robust accounting infrastructure based on ERPNext patterns
-- Created: 2025-02-03

-- =====================================================
-- FISCAL YEARS & PERIODS
-- =====================================================

-- Fiscal Years table
CREATE TABLE IF NOT EXISTS fiscal_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  year_name VARCHAR(20) NOT NULL,           -- e.g., "2024", "2024-25"
  year_start_date DATE NOT NULL,
  year_end_date DATE NOT NULL,

  is_closed BOOLEAN NOT NULL DEFAULT false,
  auto_created BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(org_id, year_name),
  CONSTRAINT valid_fiscal_date_range CHECK (year_end_date > year_start_date)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_years_org_id ON fiscal_years(org_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_years_dates ON fiscal_years(org_id, year_start_date, year_end_date);

-- Accounting Periods (monthly/quarterly locking)
CREATE TABLE IF NOT EXISTS accounting_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,

  period_name VARCHAR(50) NOT NULL,         -- e.g., "January 2024", "Q1 2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, period_name),
  CONSTRAINT valid_period_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_accounting_periods_org_id ON accounting_periods(org_id);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_dates ON accounting_periods(org_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_status ON accounting_periods(org_id, status);

-- =====================================================
-- ENHANCED ACCOUNTS (Chart of Accounts)
-- =====================================================

-- Add new columns to accounts table if they don't exist
DO $$
BEGIN
  -- Add root_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'root_type') THEN
    ALTER TABLE accounts ADD COLUMN root_type VARCHAR(20);
  END IF;

  -- Add report_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'report_type') THEN
    ALTER TABLE accounts ADD COLUMN report_type VARCHAR(30);
  END IF;

  -- Add is_frozen column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'is_frozen') THEN
    ALTER TABLE accounts ADD COLUMN is_frozen BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add balance_must_be column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'balance_must_be') THEN
    ALTER TABLE accounts ADD COLUMN balance_must_be VARCHAR(10);
  END IF;

  -- Add tax_rate column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'tax_rate') THEN
    ALTER TABLE accounts ADD COLUMN tax_rate DECIMAL(5,2);
  END IF;

  -- Add lft/rgt for nested set model
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'lft') THEN
    ALTER TABLE accounts ADD COLUMN lft INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'rgt') THEN
    ALTER TABLE accounts ADD COLUMN rgt INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- Add is_group column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'accounts' AND column_name = 'is_group') THEN
    ALTER TABLE accounts ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                 WHERE constraint_name = 'accounts_root_type_check') THEN
    ALTER TABLE accounts ADD CONSTRAINT accounts_root_type_check
      CHECK (root_type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                 WHERE constraint_name = 'accounts_report_type_check') THEN
    ALTER TABLE accounts ADD CONSTRAINT accounts_report_type_check
      CHECK (report_type IN ('Balance Sheet', 'Profit and Loss'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                 WHERE constraint_name = 'accounts_balance_must_be_check') THEN
    ALTER TABLE accounts ADD CONSTRAINT accounts_balance_must_be_check
      CHECK (balance_must_be IN ('Debit', 'Credit'));
  END IF;
END $$;

-- Update existing accounts to set root_type and report_type based on account_type
UPDATE accounts SET
  root_type = CASE
    WHEN account_type = 'asset' THEN 'Asset'
    WHEN account_type = 'liability' THEN 'Liability'
    WHEN account_type = 'equity' THEN 'Equity'
    WHEN account_type = 'revenue' THEN 'Income'
    WHEN account_type = 'expense' THEN 'Expense'
    ELSE NULL
  END,
  report_type = CASE
    WHEN account_type IN ('asset', 'liability', 'equity') THEN 'Balance Sheet'
    WHEN account_type IN ('revenue', 'expense') THEN 'Profit and Loss'
    ELSE NULL
  END
WHERE root_type IS NULL;

-- =====================================================
-- COST CENTERS
-- =====================================================

CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  cost_center_code VARCHAR(20),
  cost_center_name VARCHAR(255) NOT NULL,

  -- Hierarchy (nested set model)
  parent_id UUID REFERENCES cost_centers(id) ON DELETE RESTRICT,
  lft INTEGER NOT NULL DEFAULT 0,
  rgt INTEGER NOT NULL DEFAULT 0,
  is_group BOOLEAN NOT NULL DEFAULT false,

  is_disabled BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, cost_center_code),
  UNIQUE(org_id, cost_center_name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_org_id ON cost_centers(org_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_parent ON cost_centers(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_lft_rgt ON cost_centers(org_id, lft, rgt);

-- =====================================================
-- GL ENTRIES (Immutable Audit Trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS gl_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Timing
  posting_date DATE NOT NULL,
  posting_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fiscal_year_id UUID REFERENCES fiscal_years(id),

  -- Account
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  account_currency VARCHAR(3) NOT NULL DEFAULT 'PHP',

  -- Party (Customer/Supplier/Employee)
  party_type VARCHAR(50),
  party_id UUID,

  -- Amounts (account currency)
  debit_in_account_currency DECIMAL(20,4) NOT NULL DEFAULT 0,
  credit_in_account_currency DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Amounts (company currency - PHP)
  debit DECIMAL(20,4) NOT NULL DEFAULT 0,
  credit DECIMAL(20,4) NOT NULL DEFAULT 0,
  exchange_rate DECIMAL(15,9) NOT NULL DEFAULT 1,

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

  -- Constraint: cannot have both debit and credit
  CONSTRAINT gl_entries_debit_credit_check CHECK (
    NOT (debit > 0 AND credit > 0)
  )
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_gl_entries_org_id ON gl_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_gl_entries_account ON gl_entries(account_id, posting_date);
CREATE INDEX IF NOT EXISTS idx_gl_entries_voucher ON gl_entries(voucher_type, voucher_id);
CREATE INDEX IF NOT EXISTS idx_gl_entries_party ON gl_entries(party_type, party_id, posting_date);
CREATE INDEX IF NOT EXISTS idx_gl_entries_posting_date ON gl_entries(org_id, posting_date);
CREATE INDEX IF NOT EXISTS idx_gl_entries_fiscal_year ON gl_entries(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_gl_entries_cost_center ON gl_entries(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_gl_entries_cancelled ON gl_entries(org_id, is_cancelled);

-- =====================================================
-- ENHANCED JOURNAL ENTRIES
-- =====================================================

-- Add new columns to journal_entries if they don't exist
DO $$
BEGIN
  -- Add voucher_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'voucher_type') THEN
    ALTER TABLE journal_entries ADD COLUMN voucher_type VARCHAR(50) NOT NULL DEFAULT 'Journal Entry';
  END IF;

  -- Add total_debit column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'total_debit') THEN
    ALTER TABLE journal_entries ADD COLUMN total_debit DECIMAL(20,4) NOT NULL DEFAULT 0;
  END IF;

  -- Add total_credit column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'total_credit') THEN
    ALTER TABLE journal_entries ADD COLUMN total_credit DECIMAL(20,4) NOT NULL DEFAULT 0;
  END IF;

  -- Add is_multi_currency column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'is_multi_currency') THEN
    ALTER TABLE journal_entries ADD COLUMN is_multi_currency BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add fiscal_year_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'fiscal_year_id') THEN
    ALTER TABLE journal_entries ADD COLUMN fiscal_year_id UUID REFERENCES fiscal_years(id);
  END IF;

  -- Add write_off columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'write_off_account_id') THEN
    ALTER TABLE journal_entries ADD COLUMN write_off_account_id UUID REFERENCES accounts(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'write_off_amount') THEN
    ALTER TABLE journal_entries ADD COLUMN write_off_amount DECIMAL(20,4);
  END IF;

  -- Add amended_from column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'amended_from') THEN
    ALTER TABLE journal_entries ADD COLUMN amended_from UUID REFERENCES journal_entries(id);
  END IF;

  -- Add cancelled_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'cancelled_at') THEN
    ALTER TABLE journal_entries ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;

  -- Add cancelled_by column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'cancelled_by') THEN
    ALTER TABLE journal_entries ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add status column with proper values if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entries' AND column_name = 'status') THEN
    ALTER TABLE journal_entries ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Draft';
  END IF;
END $$;

-- Add enhanced columns to journal_entry_lines
DO $$
BEGIN
  -- Add party columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'party_type') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN party_type VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'party_id') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN party_id UUID;
  END IF;

  -- Add cost_center_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'cost_center_id') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id);
  END IF;

  -- Add project_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'project_id') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN project_id UUID;
  END IF;

  -- Add against_account column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'against_account') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN against_account VARCHAR(255);
  END IF;

  -- Add reference columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'reference_type') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN reference_type VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'reference_id') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN reference_id UUID;
  END IF;

  -- Add idx for ordering
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'journal_entry_lines' AND column_name = 'idx') THEN
    ALTER TABLE journal_entry_lines ADD COLUMN idx INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- PAYMENT ENTRIES
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

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
  paid_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  received_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  paid_amount_in_account_currency DECIMAL(20,4) NOT NULL DEFAULT 0,
  received_amount_in_account_currency DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Multi-currency
  paid_from_account_currency VARCHAR(3) DEFAULT 'PHP',
  paid_to_account_currency VARCHAR(3) DEFAULT 'PHP',
  source_exchange_rate DECIMAL(15,9) NOT NULL DEFAULT 1,
  target_exchange_rate DECIMAL(15,9) NOT NULL DEFAULT 1,

  -- Allocation
  total_allocated_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  unallocated_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Difference (for write-off)
  difference_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  write_off_account_id UUID REFERENCES accounts(id),

  -- Bank details
  reference_number VARCHAR(100),
  reference_date DATE,
  cheque_number VARCHAR(50),
  cheque_date DATE,
  bank_account VARCHAR(100),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Cancelled')),

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,

  remarks TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  submitted_by UUID REFERENCES auth.users(id),

  UNIQUE(org_id, voucher_no)
);

CREATE INDEX IF NOT EXISTS idx_payment_entries_org_id ON payment_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_entries_party ON payment_entries(party_type, party_id);
CREATE INDEX IF NOT EXISTS idx_payment_entries_posting_date ON payment_entries(org_id, posting_date);
CREATE INDEX IF NOT EXISTS idx_payment_entries_status ON payment_entries(org_id, status);

-- Payment Entry References (allocation to invoices)
CREATE TABLE IF NOT EXISTS payment_entry_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_entry_id UUID NOT NULL REFERENCES payment_entries(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL DEFAULT 0,

  reference_doctype VARCHAR(50) NOT NULL,   -- Sales Invoice, Purchase Invoice, Journal Entry
  reference_id UUID NOT NULL,
  reference_name VARCHAR(100) NOT NULL,

  due_date DATE,
  total_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  outstanding_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  allocated_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  exchange_rate DECIMAL(15,9) NOT NULL DEFAULT 1,
  exchange_gain_loss DECIMAL(20,4) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_entry_refs_payment ON payment_entry_references(payment_entry_id);
CREATE INDEX IF NOT EXISTS idx_payment_entry_refs_reference ON payment_entry_references(reference_doctype, reference_id);

-- =====================================================
-- COMPANIES (Multi-company support within org)
-- =====================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  company_name VARCHAR(255) NOT NULL,
  abbr VARCHAR(10) NOT NULL,                -- Abbreviation for naming series

  -- Registration
  tax_id VARCHAR(50),                       -- TIN for Philippines
  registration_number VARCHAR(50),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) NOT NULL DEFAULT 'PH',

  -- Contact
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),

  -- Currency & Fiscal
  default_currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  fiscal_year_start_month SMALLINT NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),

  -- Default accounts
  default_receivable_account_id UUID REFERENCES accounts(id),
  default_payable_account_id UUID REFERENCES accounts(id),
  default_income_account_id UUID REFERENCES accounts(id),
  default_expense_account_id UUID REFERENCES accounts(id),
  default_cost_center_id UUID REFERENCES cost_centers(id),

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, company_name),
  UNIQUE(org_id, abbr)
);

CREATE INDEX IF NOT EXISTS idx_companies_org_id ON companies(org_id);

-- =====================================================
-- CURRENCY EXCHANGE RATES
-- =====================================================

CREATE TABLE IF NOT EXISTS currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for system rates

  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  exchange_rate DECIMAL(20,9) NOT NULL,

  effective_date DATE NOT NULL,

  source VARCHAR(50) DEFAULT 'manual',      -- manual, bsp (Bangko Sentral ng Pilipinas), api

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, from_currency, to_currency, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_currency_exchange_org ON currency_exchange_rates(org_id);
CREATE INDEX IF NOT EXISTS idx_currency_exchange_date ON currency_exchange_rates(from_currency, to_currency, effective_date);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_entry_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_exchange_rates ENABLE ROW LEVEL SECURITY;

-- Fiscal Years policies
CREATE POLICY "Users can view org fiscal years"
  ON fiscal_years FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Accountants can manage fiscal years"
  ON fiscal_years FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- Accounting Periods policies
CREATE POLICY "Users can view org accounting periods"
  ON accounting_periods FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Accountants can manage accounting periods"
  ON accounting_periods FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- Cost Centers policies
CREATE POLICY "Users can view org cost centers"
  ON cost_centers FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Accountants can manage cost centers"
  ON cost_centers FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- GL Entries policies (read-only for most, insert via service)
CREATE POLICY "Users can view org gl entries"
  ON gl_entries FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "System can insert gl entries"
  ON gl_entries FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Payment Entries policies
CREATE POLICY "Users can view org payment entries"
  ON payment_entries FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage payment entries"
  ON payment_entries FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Payment Entry References policies
CREATE POLICY "Users can view payment entry references"
  ON payment_entry_references FOR SELECT
  USING (payment_entry_id IN (SELECT id FROM payment_entries WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "Staff can manage payment entry references"
  ON payment_entry_references FOR ALL
  USING (payment_entry_id IN (SELECT id FROM payment_entries WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff'))));

-- Companies policies
CREATE POLICY "Users can view org companies"
  ON companies FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage companies"
  ON companies FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Currency Exchange policies
CREATE POLICY "Users can view exchange rates"
  ON currency_exchange_rates FOR SELECT
  USING (org_id IS NULL OR org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Accountants can manage exchange rates"
  ON currency_exchange_rates FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get fiscal year for a date
CREATE OR REPLACE FUNCTION get_fiscal_year(
  p_org_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_fiscal_year_id UUID;
BEGIN
  SELECT id INTO v_fiscal_year_id
  FROM fiscal_years
  WHERE org_id = p_org_id
    AND p_date >= year_start_date
    AND p_date <= year_end_date
  LIMIT 1;

  RETURN v_fiscal_year_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if accounting period is open
CREATE OR REPLACE FUNCTION is_period_open(
  p_org_id UUID,
  p_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_period_status VARCHAR(20);
BEGIN
  SELECT status INTO v_period_status
  FROM accounting_periods
  WHERE org_id = p_org_id
    AND p_date >= start_date
    AND p_date <= end_date
  LIMIT 1;

  -- If no period found, assume open
  IF v_period_status IS NULL THEN
    RETURN true;
  END IF;

  RETURN v_period_status = 'open';
END;
$$ LANGUAGE plpgsql;

-- Function to get exchange rate
CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3),
  p_date DATE DEFAULT CURRENT_DATE,
  p_org_id UUID DEFAULT NULL
)
RETURNS DECIMAL(20,9) AS $$
DECLARE
  v_rate DECIMAL(20,9);
BEGIN
  -- Same currency
  IF p_from_currency = p_to_currency THEN
    RETURN 1.0;
  END IF;

  -- Try org-specific rate first
  IF p_org_id IS NOT NULL THEN
    SELECT exchange_rate INTO v_rate
    FROM currency_exchange_rates
    WHERE org_id = p_org_id
      AND from_currency = p_from_currency
      AND to_currency = p_to_currency
      AND effective_date <= p_date
    ORDER BY effective_date DESC
    LIMIT 1;

    IF v_rate IS NOT NULL THEN
      RETURN v_rate;
    END IF;
  END IF;

  -- Try system rate
  SELECT exchange_rate INTO v_rate
  FROM currency_exchange_rates
  WHERE org_id IS NULL
    AND from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND effective_date <= p_date
  ORDER BY effective_date DESC
  LIMIT 1;

  -- Return 1.0 if no rate found (should handle this in application)
  RETURN COALESCE(v_rate, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance from GL entries
CREATE OR REPLACE FUNCTION recalculate_account_balance(
  p_account_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(20,4) AS $$
DECLARE
  v_balance DECIMAL(20,4);
BEGIN
  SELECT COALESCE(SUM(debit) - SUM(credit), 0)
  INTO v_balance
  FROM gl_entries
  WHERE account_id = p_account_id
    AND is_cancelled = false
    AND posting_date <= p_as_of_date;

  -- Update the account balance
  UPDATE accounts
  SET balance = v_balance,
      balance_date = NOW()
  WHERE id = p_account_id;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update timestamps
CREATE TRIGGER update_fiscal_years_updated_at
  BEFORE UPDATE ON fiscal_years
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounting_periods_updated_at
  BEFORE UPDATE ON accounting_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON cost_centers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_entries_updated_at
  BEFORE UPDATE ON payment_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate payment entry number
CREATE OR REPLACE FUNCTION generate_payment_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  IF NEW.voucher_no IS NOT NULL AND NEW.voucher_no != '' THEN
    RETURN NEW;
  END IF;

  v_year := EXTRACT(YEAR FROM NEW.posting_date)::TEXT;

  SELECT COALESCE(MAX(
    SUBSTRING(voucher_no FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM payment_entries
  WHERE org_id = NEW.org_id
  AND voucher_no LIKE NEW.naming_series || '-' || v_year || '-%';

  NEW.voucher_no := NEW.naming_series || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_payment_entry_number_trigger
  BEFORE INSERT ON payment_entries
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_entry_number();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE fiscal_years IS 'Fiscal year definitions for each organization';
COMMENT ON TABLE accounting_periods IS 'Monthly/quarterly accounting periods for period locking';
COMMENT ON TABLE cost_centers IS 'Cost center hierarchy for cost allocation and reporting';
COMMENT ON TABLE gl_entries IS 'Immutable general ledger entries - audit trail for all accounting transactions';
COMMENT ON TABLE payment_entries IS 'Payment receipts and disbursements';
COMMENT ON TABLE payment_entry_references IS 'Allocation of payments to invoices';
COMMENT ON TABLE companies IS 'Multiple companies within an organization';
COMMENT ON TABLE currency_exchange_rates IS 'Foreign exchange rates for multi-currency support';
