-- Migration: Initialize Reconciliation Infrastructure
-- Created: 2025-10-21
-- Description: Create tables and functions for bank reconciliation and AI-powered matching

-- =================================================================
-- ENUMS
-- =================================================================

-- Reconciliation status
CREATE TYPE reconciliation_status AS ENUM (
  'draft',
  'in_progress',
  'completed',
  'failed'
);

-- Match type
CREATE TYPE match_type AS ENUM (
  'exact',           -- Perfect match (amount + date + reference)
  'fuzzy',           -- Close match (within tolerance)
  'partial',         -- Partial amount match
  'many_to_one',     -- Multiple bank txns → single entry
  'one_to_many',     -- Single bank txn → multiple entries
  'suggested'        -- AI-suggested match
);

-- =================================================================
-- TABLES
-- =================================================================

-- Reconciliations
-- Tracks bank reconciliation sessions
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL, -- Date of this reconciliation
  statement_date DATE NOT NULL, -- Bank statement date
  statement_balance NUMERIC(15,2) NOT NULL, -- Ending balance per bank
  ledger_balance NUMERIC(15,2) NOT NULL, -- GL balance
  adjusted_balance NUMERIC(15,2), -- After adjustments
  difference NUMERIC(15,2) DEFAULT 0, -- Unreconciled difference
  status reconciliation_status NOT NULL DEFAULT 'draft',
  started_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB, -- Totals, counts, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_reconciliations_org_id ON reconciliations(org_id);
CREATE INDEX idx_reconciliations_account_id ON reconciliations(account_id);
CREATE INDEX idx_reconciliations_status ON reconciliations(status);
CREATE INDEX idx_reconciliations_date ON reconciliations(reconciliation_date DESC);

-- Add RLS policies
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view reconciliations"
  ON reconciliations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org accountants can insert reconciliations"
  ON reconciliations FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

CREATE POLICY "Org accountants can update reconciliations"
  ON reconciliations FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- Reconciliation Matches
-- Links bank transactions to journal entries
CREATE TABLE reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES reconciliations(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_transaction_id UUID REFERENCES bank_transactions(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  match_type match_type NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  difference NUMERIC(15,2) DEFAULT 0, -- Amount difference if partial
  approved BOOLEAN DEFAULT NULL, -- NULL = pending, true/false = approved/rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  reasoning TEXT, -- AI explanation for match
  metadata JSONB, -- Match details, scores, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_recon_matches_recon_id ON reconciliation_matches(reconciliation_id);
CREATE INDEX idx_recon_matches_org_id ON reconciliation_matches(org_id);
CREATE INDEX idx_recon_matches_bank_txn ON reconciliation_matches(bank_transaction_id);
CREATE INDEX idx_recon_matches_journal_entry ON reconciliation_matches(journal_entry_id);
CREATE INDEX idx_recon_matches_approved ON reconciliation_matches(approved) WHERE approved IS NULL;

-- Add RLS policies
ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view matches"
  ON reconciliation_matches FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert matches"
  ON reconciliation_matches FOR INSERT
  WITH CHECK (true); -- System-level inserts

CREATE POLICY "Org accountants can update matches"
  ON reconciliation_matches FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =================================================================
-- FUNCTIONS
-- =================================================================

-- Update updated_at timestamp
CREATE TRIGGER reconciliations_updated_at
  BEFORE UPDATE ON reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_updated_at();

CREATE TRIGGER reconciliation_matches_updated_at
  BEFORE UPDATE ON reconciliation_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_updated_at();

-- Get unmatched bank transactions for reconciliation
CREATE OR REPLACE FUNCTION get_unmatched_bank_transactions(
  p_org_id UUID,
  p_account_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  id UUID,
  date DATE,
  description TEXT,
  amount NUMERIC,
  merchant_name TEXT,
  category TEXT,
  is_reconciled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bt.id,
    bt.date,
    bt.description,
    bt.amount,
    bt.merchant_name,
    bt.category,
    bt.is_reconciled
  FROM bank_transactions bt
  WHERE
    bt.org_id = p_org_id
    AND bt.bank_connection_id IN (
      SELECT bc.id FROM bank_connections bc
      WHERE bc.account_id = p_account_id
    )
    AND bt.date BETWEEN p_start_date AND p_end_date
    AND bt.is_reconciled = false
  ORDER BY bt.date, bt.amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unmatched journal entries for reconciliation
CREATE OR REPLACE FUNCTION get_unmatched_journal_entries(
  p_org_id UUID,
  p_account_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  id UUID,
  entry_number TEXT,
  entry_date DATE,
  description TEXT,
  amount NUMERIC,
  is_posted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    je.id,
    je.entry_number,
    je.entry_date,
    je.description,
    COALESCE(jel.debit, jel.credit) AS amount,
    je.is_posted
  FROM journal_entries je
  INNER JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
  WHERE
    je.org_id = p_org_id
    AND jel.account_id = p_account_id
    AND je.entry_date BETWEEN p_start_date AND p_end_date
    AND je.is_posted = true
    AND NOT EXISTS (
      SELECT 1 FROM reconciliation_matches rm
      WHERE rm.journal_entry_id = je.id
      AND rm.approved = true
    )
  ORDER BY je.entry_date, amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a reconciliation
CREATE OR REPLACE FUNCTION complete_reconciliation(
  p_reconciliation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_approved_count INTEGER;
  v_total_bank NUMERIC;
  v_total_ledger NUMERIC;
  v_difference NUMERIC;
BEGIN
  -- Count approved matches
  SELECT COUNT(*) INTO v_approved_count
  FROM reconciliation_matches
  WHERE reconciliation_id = p_reconciliation_id
  AND approved = true;

  -- Calculate totals
  SELECT
    COALESCE(SUM(bt.amount), 0),
    COALESCE(SUM(COALESCE(jel.debit, jel.credit)), 0)
  INTO v_total_bank, v_total_ledger
  FROM reconciliation_matches rm
  LEFT JOIN bank_transactions bt ON bt.id = rm.bank_transaction_id
  LEFT JOIN journal_entries je ON je.id = rm.journal_entry_id
  LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
  WHERE rm.reconciliation_id = p_reconciliation_id
  AND rm.approved = true;

  v_difference := v_total_bank - v_total_ledger;

  -- Update reconciliation
  UPDATE reconciliations
  SET
    status = 'completed',
    completed_by = p_user_id,
    completed_at = NOW(),
    adjusted_balance = v_total_ledger,
    difference = v_difference,
    metadata = jsonb_build_object(
      'approved_matches', v_approved_count,
      'total_bank', v_total_bank,
      'total_ledger', v_total_ledger
    )
  WHERE id = p_reconciliation_id;

  -- Mark matched transactions as reconciled
  UPDATE bank_transactions
  SET is_reconciled = true
  WHERE id IN (
    SELECT bank_transaction_id
    FROM reconciliation_matches
    WHERE reconciliation_id = p_reconciliation_id
    AND approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get reconciliation statistics
CREATE OR REPLACE FUNCTION get_reconciliation_stats(
  p_org_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  total_reconciliations BIGINT,
  completed_reconciliations BIGINT,
  avg_matches_per_recon NUMERIC,
  avg_auto_match_rate NUMERIC,
  accounts_needing_recon BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_reconciliations,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_reconciliations,
    ROUND(AVG((metadata->>'approved_matches')::NUMERIC), 2) AS avg_matches_per_recon,
    ROUND(
      AVG(
        (SELECT COUNT(*) FROM reconciliation_matches rm
         WHERE rm.reconciliation_id = r.id
         AND rm.approved = true
         AND rm.confidence >= 0.90)::NUMERIC /
        NULLIF((metadata->>'approved_matches')::NUMERIC, 0) * 100
      ),
      2
    ) AS avg_auto_match_rate,
    (
      SELECT COUNT(DISTINCT account_id)
      FROM bank_connections
      WHERE org_id = p_org_id
      AND is_active = true
      AND last_sync_at < NOW() - INTERVAL '7 days'
    )::BIGINT AS accounts_needing_recon
  FROM reconciliations r
  WHERE
    r.org_id = p_org_id
    AND r.created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON TABLE reconciliations IS 'Bank reconciliation sessions linking bank statements to general ledger';
COMMENT ON TABLE reconciliation_matches IS 'Individual matches between bank transactions and journal entries';
COMMENT ON FUNCTION get_unmatched_bank_transactions IS 'Get bank transactions that need reconciliation';
COMMENT ON FUNCTION get_unmatched_journal_entries IS 'Get journal entries that need reconciliation';
COMMENT ON FUNCTION complete_reconciliation IS 'Mark a reconciliation as complete and update transaction statuses';
COMMENT ON FUNCTION get_reconciliation_stats IS 'Get reconciliation performance metrics';
