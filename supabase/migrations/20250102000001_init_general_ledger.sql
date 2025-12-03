-- Accunza Phase 2.2 - General Ledger
-- Migration: Initialize General Ledger and Double-Entry Bookkeeping schema
-- Created: 2025-10-21

-- =====================================================
-- GENERAL LEDGER TABLES
-- =====================================================

-- Journal Entries (header)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL, -- Auto-generated, e.g., "JE-2025-001"
  entry_date DATE NOT NULL,
  posting_date DATE, -- When posted to ledger
  description TEXT NOT NULL,
  reference TEXT, -- External reference number
  source TEXT NOT NULL DEFAULT 'manual', -- "manual", "bank_feed", "ai_bot", "invoice", "bill"
  source_id UUID, -- Reference to source entity (e.g., bank_transaction.id, invoice.id)
  is_posted BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, entry_number)
);

-- Create indexes for journal entries
CREATE INDEX idx_journal_entries_org_id ON journal_entries(org_id);
CREATE INDEX idx_journal_entries_entry_number ON journal_entries(org_id, entry_number);
CREATE INDEX idx_journal_entries_entry_date ON journal_entries(org_id, entry_date);
CREATE INDEX idx_journal_entries_posting_date ON journal_entries(org_id, posting_date);
CREATE INDEX idx_journal_entries_posted ON journal_entries(org_id, is_posted);
CREATE INDEX idx_journal_entries_source ON journal_entries(org_id, source, source_id);

-- Journal Entry Lines (detail)
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  description TEXT,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
  credit NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  fx_rate NUMERIC(10,6) DEFAULT 1.000000, -- Foreign exchange rate
  base_debit NUMERIC(15,2) NOT NULL DEFAULT 0.00, -- In org base currency
  base_credit NUMERIC(15,2) NOT NULL DEFAULT 0.00, -- In org base currency
  dimension_1 TEXT, -- e.g., department, class
  dimension_2 TEXT, -- e.g., project, location
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint: Either debit OR credit must be zero (not both)
  CHECK (
    (debit = 0 AND credit > 0) OR
    (debit > 0 AND credit = 0)
  )
);

-- Create indexes for journal entry lines
CREATE INDEX idx_journal_entry_lines_journal_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_org_id ON journal_entry_lines(org_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(org_id, account_id);

-- Transactions (simplified view for common use cases)
-- This is a denormalized view for quick access to transaction data
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category TEXT, -- High-level category for reporting
  vendor_id UUID, -- Reference to vendors table (created in Phase 4)
  customer_id UUID, -- Reference to customers table (created in Phase 4)
  reconciliation_id UUID, -- Reference to reconciliations table (created later)
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_org_id ON transactions(org_id);
CREATE INDEX idx_transactions_date ON transactions(org_id, date);
CREATE INDEX idx_transactions_account ON transactions(org_id, account_id);
CREATE INDEX idx_transactions_reconciled ON transactions(org_id, is_reconciled);
CREATE INDEX idx_transactions_journal_entry ON transactions(journal_entry_id);

-- =====================================================
-- ROW LEVEL SECURITY - JOURNAL ENTRIES
-- =====================================================

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view journal entries in their organization
CREATE POLICY "Users can view org journal entries"
  ON journal_entries FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Staff+ can create journal entries
CREATE POLICY "Staff can create journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Staff+ can update unposted journal entries
CREATE POLICY "Staff can update unposted entries"
  ON journal_entries FOR UPDATE
  USING (
    is_posted = false
    AND org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Admin+ can delete unposted journal entries
CREATE POLICY "Admin can delete unposted entries"
  ON journal_entries FOR DELETE
  USING (
    is_posted = false
    AND is_locked = false
    AND org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- ROW LEVEL SECURITY - JOURNAL ENTRY LINES
-- =====================================================

-- Enable RLS on journal_entry_lines
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view lines in their organization
CREATE POLICY "Users can view org journal entry lines"
  ON journal_entry_lines FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Staff+ can create journal entry lines
CREATE POLICY "Staff can create journal entry lines"
  ON journal_entry_lines FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Staff+ can update lines for unposted entries
CREATE POLICY "Staff can update unposted lines"
  ON journal_entry_lines FOR UPDATE
  USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries
      WHERE is_posted = false
      AND org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'accountant', 'staff')
      )
    )
  );

-- Policy: Admin+ can delete lines for unposted entries
CREATE POLICY "Admin can delete unposted lines"
  ON journal_entry_lines FOR DELETE
  USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries
      WHERE is_posted = false AND is_locked = false
      AND org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'accountant')
      )
    )
  );

-- =====================================================
-- ROW LEVEL SECURITY - TRANSACTIONS
-- =====================================================

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view transactions in their organization
CREATE POLICY "Users can view org transactions"
  ON transactions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Staff+ can create transactions
CREATE POLICY "Staff can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Staff+ can update transactions
CREATE POLICY "Staff can update transactions"
  ON transactions FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Admin+ can delete transactions
CREATE POLICY "Admin can delete transactions"
  ON transactions FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for journal_entries updated_at
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate balanced journal entry
CREATE OR REPLACE FUNCTION validate_balanced_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debits NUMERIC(15,2);
  v_total_credits NUMERIC(15,2);
  v_is_posted BOOLEAN;
BEGIN
  -- Only validate when posting
  SELECT is_posted INTO v_is_posted
  FROM journal_entries
  WHERE id = NEW.id;

  IF v_is_posted OR NEW.is_posted THEN
    -- Calculate total debits and credits
    SELECT
      COALESCE(SUM(base_debit), 0),
      COALESCE(SUM(base_credit), 0)
    INTO v_total_debits, v_total_credits
    FROM journal_entry_lines
    WHERE journal_entry_id = NEW.id;

    -- Check if balanced
    IF ABS(v_total_debits - v_total_credits) > 0.01 THEN
      RAISE EXCEPTION 'Journal entry is not balanced: debits=% credits=%', v_total_debits, v_total_credits;
    END IF;

    -- Set posting date if not set
    IF NEW.posting_date IS NULL THEN
      NEW.posting_date := CURRENT_DATE;
    END IF;

    -- Set posted_by and posted_at
    IF NEW.posted_by IS NULL THEN
      NEW.posted_by := auth.uid();
      NEW.posted_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate journal entry balance before posting
CREATE TRIGGER validate_journal_entry_balance
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  WHEN (NEW.is_posted = true AND OLD.is_posted = false)
  EXECUTE FUNCTION validate_balanced_entry();

-- Function to prevent editing posted entries
CREATE OR REPLACE FUNCTION prevent_edit_posted_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_is_posted BOOLEAN;
  v_is_locked BOOLEAN;
BEGIN
  -- Get current posted and locked status
  SELECT is_posted, is_locked INTO v_is_posted, v_is_locked
  FROM journal_entries
  WHERE id = OLD.journal_entry_id;

  IF v_is_posted THEN
    RAISE EXCEPTION 'Cannot modify lines of a posted journal entry';
  END IF;

  IF v_is_locked THEN
    RAISE EXCEPTION 'Cannot modify lines of a locked journal entry';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent editing posted entry lines
CREATE TRIGGER prevent_edit_posted_lines
  BEFORE UPDATE OR DELETE ON journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION prevent_edit_posted_entry();

-- Function to auto-generate journal entry number
CREATE OR REPLACE FUNCTION generate_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_entry_number TEXT;
BEGIN
  -- If entry_number is already set, don't generate
  IF NEW.entry_number IS NOT NULL AND NEW.entry_number != '' THEN
    RETURN NEW;
  END IF;

  -- Get year from entry_date
  v_year := EXTRACT(YEAR FROM NEW.entry_date)::TEXT;

  -- Get next sequence number for this org and year
  SELECT COALESCE(MAX(
    SUBSTRING(entry_number FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM journal_entries
  WHERE org_id = NEW.org_id
  AND entry_number LIKE 'JE-' || v_year || '-%';

  -- Generate entry number: JE-YYYY-NNN
  v_entry_number := 'JE-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

  NEW.entry_number := v_entry_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate entry number
CREATE TRIGGER generate_journal_entry_number
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION generate_entry_number();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate trial balance
CREATE OR REPLACE FUNCTION get_trial_balance(
  p_org_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  total_debits NUMERIC(15,2),
  total_credits NUMERIC(15,2),
  balance NUMERIC(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.code,
    a.name,
    a.account_type,
    COALESCE(SUM(jel.base_debit), 0.00) as total_debits,
    COALESCE(SUM(jel.base_credit), 0.00) as total_credits,
    COALESCE(SUM(jel.base_debit) - SUM(jel.base_credit), 0.00) as balance
  FROM accounts a
  LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
  WHERE a.org_id = p_org_id
    AND a.is_active = true
    AND (je.is_posted = true OR je.id IS NULL)
    AND (je.entry_date <= p_as_of_date OR je.id IS NULL)
  GROUP BY a.id, a.code, a.name, a.account_type
  ORDER BY a.code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE journal_entries IS 'Journal entry headers for double-entry bookkeeping';
COMMENT ON TABLE journal_entry_lines IS 'Journal entry line items (debits and credits)';
COMMENT ON TABLE transactions IS 'Simplified transaction view for common operations';
COMMENT ON COLUMN journal_entries.entry_number IS 'Auto-generated unique entry number (e.g., JE-2025-0001)';
COMMENT ON COLUMN journal_entries.is_posted IS 'Posted entries are final and cannot be edited';
COMMENT ON COLUMN journal_entries.is_locked IS 'Locked entries are in a closed period and cannot be modified';
COMMENT ON COLUMN journal_entry_lines.base_debit IS 'Debit amount in organization base currency';
COMMENT ON COLUMN journal_entry_lines.base_credit IS 'Credit amount in organization base currency';
COMMENT ON COLUMN journal_entry_lines.fx_rate IS 'Foreign exchange rate used for conversion';
