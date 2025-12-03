-- =====================================================
-- Phase 2: Banking & Reconciliation
-- =====================================================
-- Purpose: Bank accounts, feeds, categorization, and reconciliation per roadmap Phase 2

-- =====================================================
-- Bank Accounts Table
-- =====================================================
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Account details
  account_name text NOT NULL,
  account_number text, -- Last 4 digits or masked
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit_card', 'line_of_credit')),

  -- Bank information
  bank_name text,
  routing_number text,
  swift_code text,
  iban text,

  -- Integration
  integration_type text CHECK (integration_type IN ('plaid', 'wise', 'manual', 'csv')),
  integration_id text, -- External account ID from Plaid/Wise
  integration_metadata jsonb,

  -- Linked GL account
  gl_account_id uuid REFERENCES public.accounts(id),

  -- Currency
  currency text NOT NULL DEFAULT 'USD',

  -- Status
  is_active boolean DEFAULT true NOT NULL,
  last_sync_at timestamptz,
  sync_status text DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  sync_error text,

  -- Balance tracking
  current_balance numeric(15,2) DEFAULT 0.00,
  available_balance numeric(15,2),
  balance_date timestamptz,

  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT bank_accounts_unique UNIQUE (org_id, account_number, bank_name)
);

-- Indexes
CREATE INDEX idx_bank_accounts_org ON public.bank_accounts(org_id);
CREATE INDEX idx_bank_accounts_integration ON public.bank_accounts(integration_type, integration_id);
CREATE INDEX idx_bank_accounts_gl_account ON public.bank_accounts(gl_account_id);
CREATE INDEX idx_bank_accounts_active ON public.bank_accounts(org_id, is_active);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank_accounts for their org"
  ON public.bank_accounts FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage bank_accounts for their org"
  ON public.bank_accounts FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- Bank Transactions Table
-- =====================================================
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_date date NOT NULL,
  posting_date date,
  description text NOT NULL,
  merchant_name text,
  category text,

  -- Amount
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',

  -- Type
  transaction_type text NOT NULL CHECK (transaction_type IN ('debit', 'credit', 'fee', 'interest', 'transfer')),

  -- Integration
  integration_transaction_id text, -- External transaction ID from Plaid/Wise
  integration_metadata jsonb,

  -- Categorization
  suggested_account_id uuid REFERENCES public.accounts(id),
  suggested_confidence numeric(3,2), -- 0.00 to 1.00
  assigned_account_id uuid REFERENCES public.accounts(id),

  -- Reconciliation
  is_reconciled boolean DEFAULT false NOT NULL,
  reconciled_at timestamptz,
  reconciled_by uuid REFERENCES auth.users(id),
  reconciliation_match_id uuid, -- Links to reconciliation_matches

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'categorized', 'reconciled', 'ignored')),
  is_duplicate boolean DEFAULT false,
  is_split boolean DEFAULT false, -- If transaction is split across multiple GL accounts

  -- Linking
  payment_entry_id uuid, -- Reference to ERPNext Payment Entry
  journal_entry_id uuid REFERENCES public.journal_entries(id),

  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT bank_transactions_integration_unique UNIQUE (bank_account_id, integration_transaction_id)
);

-- Indexes
CREATE INDEX idx_bank_transactions_org ON public.bank_transactions(org_id);
CREATE INDEX idx_bank_transactions_account ON public.bank_transactions(bank_account_id, transaction_date DESC);
CREATE INDEX idx_bank_transactions_date ON public.bank_transactions(org_id, transaction_date DESC);
CREATE INDEX idx_bank_transactions_status ON public.bank_transactions(org_id, status);
CREATE INDEX idx_bank_transactions_reconciled ON public.bank_transactions(org_id, is_reconciled);
CREATE INDEX idx_bank_transactions_integration ON public.bank_transactions(integration_transaction_id);

-- Enable RLS
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank_transactions for their org"
  ON public.bank_transactions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage bank_transactions for their org"
  ON public.bank_transactions FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Categorization Rules Table
-- =====================================================
CREATE TABLE public.categorization_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Rule details
  name text NOT NULL,
  description text,
  priority integer DEFAULT 100, -- Lower = higher priority

  -- Matching criteria (ALL must match)
  match_description text, -- Regex or substring
  match_merchant text,
  match_amount_min numeric(15,2),
  match_amount_max numeric(15,2),
  match_transaction_type text CHECK (match_transaction_type IN ('debit', 'credit', 'fee', 'interest', 'transfer')),

  -- Action
  assign_account_id uuid NOT NULL REFERENCES public.accounts(id),
  assign_tax_code text,
  assign_dimension_1 text,
  assign_dimension_2 text,

  -- Status
  is_active boolean DEFAULT true NOT NULL,
  auto_apply boolean DEFAULT false, -- If true, auto-categorize; if false, suggest only
  confidence_threshold numeric(3,2) DEFAULT 0.90, -- Minimum confidence to auto-apply

  -- Statistics
  match_count integer DEFAULT 0,
  last_matched_at timestamptz,

  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_categorization_rules_org ON public.categorization_rules(org_id, priority);
CREATE INDEX idx_categorization_rules_active ON public.categorization_rules(org_id, is_active);

-- Enable RLS
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categorization_rules for their org"
  ON public.categorization_rules FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can manage categorization_rules for their org"
  ON public.categorization_rules FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- Reconciliation Matches Table
-- =====================================================
CREATE TABLE public.reconciliation_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Bank side
  bank_transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
  bank_amount numeric(15,2) NOT NULL,
  bank_date date NOT NULL,

  -- Ledger side (can be multiple for many-to-one matching)
  ledger_type text NOT NULL CHECK (ledger_type IN ('payment_entry', 'journal_entry', 'invoice', 'bill')),
  ledger_id uuid NOT NULL, -- ID of payment/JE/invoice/bill
  ledger_amount numeric(15,2) NOT NULL,
  ledger_date date NOT NULL,

  -- Match details
  match_type text NOT NULL CHECK (match_type IN ('exact', 'partial', 'split', 'many_to_one', 'one_to_many')),
  match_confidence numeric(3,2), -- 0.00 to 1.00
  match_reason text, -- Explanation for AI-suggested matches

  -- Difference handling
  difference_amount numeric(15,2) DEFAULT 0.00,
  difference_reason text CHECK (difference_reason IN ('fee', 'fx', 'rounding', 'other')),
  difference_account_id uuid REFERENCES public.accounts(id), -- Where to post difference

  -- Status
  status text DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected', 'auto_matched')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_reconciliation_matches_org ON public.reconciliation_matches(org_id);
CREATE INDEX idx_reconciliation_matches_bank_tx ON public.reconciliation_matches(bank_transaction_id);
CREATE INDEX idx_reconciliation_matches_ledger ON public.reconciliation_matches(ledger_type, ledger_id);
CREATE INDEX idx_reconciliation_matches_status ON public.reconciliation_matches(org_id, status);

-- Enable RLS
ALTER TABLE public.reconciliation_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliation_matches for their org"
  ON public.reconciliation_matches FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage reconciliation_matches for their org"
  ON public.reconciliation_matches FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Bank Statement Imports Table
-- =====================================================
CREATE TABLE public.bank_statement_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,

  -- Import details
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('csv', 'ofx', 'qif', 'qbo')),
  file_size integer,
  file_url text, -- Storage URL

  -- Processing
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'error')),
  transactions_imported integer DEFAULT 0,
  transactions_duplicates integer DEFAULT 0,
  transactions_errors integer DEFAULT 0,
  error_details jsonb,

  -- Date range
  period_start date,
  period_end date,

  -- Metadata
  imported_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Indexes
CREATE INDEX idx_bank_statement_imports_org ON public.bank_statement_imports(org_id);
CREATE INDEX idx_bank_statement_imports_account ON public.bank_statement_imports(bank_account_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.bank_statement_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank_statement_imports for their org"
  ON public.bank_statement_imports FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage bank_statement_imports for their org"
  ON public.bank_statement_imports FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to apply categorization rules
CREATE OR REPLACE FUNCTION apply_categorization_rules(
  p_bank_transaction_id uuid
) RETURNS uuid AS $$
DECLARE
  v_transaction record;
  v_rule record;
  v_matched_account_id uuid;
BEGIN
  -- Get transaction
  SELECT * INTO v_transaction
  FROM public.bank_transactions
  WHERE id = p_bank_transaction_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Find matching rule (ordered by priority)
  FOR v_rule IN
    SELECT *
    FROM public.categorization_rules
    WHERE org_id = v_transaction.org_id
      AND is_active = true
      AND (match_description IS NULL OR v_transaction.description ~* match_description)
      AND (match_merchant IS NULL OR v_transaction.merchant_name ~* match_merchant)
      AND (match_amount_min IS NULL OR v_transaction.amount >= match_amount_min)
      AND (match_amount_max IS NULL OR v_transaction.amount <= match_amount_max)
      AND (match_transaction_type IS NULL OR v_transaction.transaction_type = match_transaction_type)
    ORDER BY priority ASC
    LIMIT 1
  LOOP
    v_matched_account_id := v_rule.assign_account_id;

    -- Update transaction with suggestion
    UPDATE public.bank_transactions
    SET
      suggested_account_id = v_rule.assign_account_id,
      suggested_confidence = v_rule.confidence_threshold,
      assigned_account_id = CASE
        WHEN v_rule.auto_apply THEN v_rule.assign_account_id
        ELSE assigned_account_id
      END,
      status = CASE
        WHEN v_rule.auto_apply THEN 'categorized'
        ELSE status
      END,
      updated_at = now()
    WHERE id = p_bank_transaction_id;

    -- Update rule statistics
    UPDATE public.categorization_rules
    SET
      match_count = match_count + 1,
      last_matched_at = now()
    WHERE id = v_rule.id;

    EXIT; -- Take first matching rule
  END LOOP;

  RETURN v_matched_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark transaction as reconciled
CREATE OR REPLACE FUNCTION mark_transaction_reconciled(
  p_bank_transaction_id uuid,
  p_user_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.bank_transactions
  SET
    is_reconciled = true,
    reconciled_at = now(),
    reconciled_by = p_user_id,
    status = 'reconciled',
    updated_at = now()
  WHERE id = p_bank_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorization_rules_updated_at
  BEFORE UPDATE ON public.categorization_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliation_matches_updated_at
  BEFORE UPDATE ON public.reconciliation_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.bank_accounts IS 'Bank accounts with Plaid/Wise integration for automated transaction feeds';
COMMENT ON TABLE public.bank_transactions IS 'Bank transactions from feeds or CSV imports with categorization and reconciliation';
COMMENT ON TABLE public.categorization_rules IS 'Rules for automatic transaction categorization based on patterns';
COMMENT ON TABLE public.reconciliation_matches IS 'Matching between bank transactions and ledger entries for reconciliation';
COMMENT ON TABLE public.bank_statement_imports IS 'CSV/OFX/QIF statement import tracking';
COMMENT ON FUNCTION apply_categorization_rules IS 'Apply categorization rules to a bank transaction';
COMMENT ON FUNCTION mark_transaction_reconciled IS 'Mark a bank transaction as reconciled';
