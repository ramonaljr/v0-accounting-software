-- OpportunityOS Phase 2.3 - Bank Feeds Integration
-- Migration: Initialize Bank Feeds and Transaction Sync schema
-- Created: 2025-10-21

-- =====================================================
-- BANK FEEDS TABLES
-- =====================================================

-- Bank Connections (integrated bank accounts)
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- "plaid", "wise", "manual"
  provider_account_id TEXT, -- External account ID from provider
  institution_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- "checking", "savings", "credit_card", "line_of_credit"
  account_number_last4 TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  access_token_encrypted TEXT, -- Encrypted access token
  refresh_token_encrypted TEXT, -- Encrypted refresh token
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- Linked GL account
  sync_status TEXT NOT NULL DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'disconnected', 'pending')),
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  sync_frequency TEXT DEFAULT 'daily', -- "realtime", "hourly", "daily", "manual"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for bank connections
CREATE INDEX idx_bank_connections_org_id ON bank_connections(org_id);
CREATE INDEX idx_bank_connections_provider ON bank_connections(org_id, provider);
CREATE INDEX idx_bank_connections_status ON bank_connections(org_id, sync_status);
CREATE INDEX idx_bank_connections_linked_account ON bank_connections(linked_account_id);

-- Bank Transactions (synced from bank feeds)
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  provider_transaction_id TEXT NOT NULL, -- Unique ID from provider
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL, -- Positive for credits, negative for debits
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT, -- Category from provider
  merchant_name TEXT,
  pending BOOLEAN NOT NULL DEFAULT false,
  reconciliation_id UUID, -- Link to reconciliation record
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  categorization_confidence NUMERIC(3,2), -- AI confidence score (0.00 - 1.00)
  suggested_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  suggested_by TEXT, -- "ai_bot", "rule", "manual", "historical"
  metadata JSONB DEFAULT '{}', -- Additional provider data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, provider_transaction_id)
);

-- Create indexes for bank transactions
CREATE INDEX idx_bank_transactions_org_id ON bank_transactions(org_id);
CREATE INDEX idx_bank_transactions_connection ON bank_transactions(bank_connection_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(org_id, date);
CREATE INDEX idx_bank_transactions_reconciled ON bank_transactions(org_id, is_reconciled);
CREATE INDEX idx_bank_transactions_pending ON bank_transactions(org_id, pending);
CREATE INDEX idx_bank_transactions_provider_id ON bank_transactions(provider_transaction_id);
CREATE INDEX idx_bank_transactions_suggested_account ON bank_transactions(suggested_account_id);

-- Bank Sync Logs (sync history and observability)
CREATE TABLE bank_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial', 'running')),
  transactions_imported INTEGER DEFAULT 0,
  transactions_updated INTEGER DEFAULT 0,
  transactions_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for bank sync logs
CREATE INDEX idx_bank_sync_logs_org_id ON bank_sync_logs(org_id);
CREATE INDEX idx_bank_sync_logs_connection ON bank_sync_logs(bank_connection_id);
CREATE INDEX idx_bank_sync_logs_started_at ON bank_sync_logs(started_at);
CREATE INDEX idx_bank_sync_logs_status ON bank_sync_logs(org_id, status);

-- Categorization Rules (auto-categorization rules)
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('merchant', 'description', 'amount_range', 'combined')),
  pattern TEXT NOT NULL, -- Regex or exact match pattern
  conditions JSONB NOT NULL DEFAULT '{}', -- Additional conditions
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  auto_apply BOOLEAN NOT NULL DEFAULT false, -- Auto-post if true
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority rules evaluated first
  is_active BOOLEAN NOT NULL DEFAULT true,
  match_count INTEGER NOT NULL DEFAULT 0, -- Track usage
  last_matched_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for categorization rules
CREATE INDEX idx_categorization_rules_org_id ON categorization_rules(org_id);
CREATE INDEX idx_categorization_rules_active ON categorization_rules(org_id, is_active);
CREATE INDEX idx_categorization_rules_priority ON categorization_rules(org_id, priority DESC);
CREATE INDEX idx_categorization_rules_account ON categorization_rules(account_id);

-- =====================================================
-- ROW LEVEL SECURITY - BANK CONNECTIONS
-- =====================================================

-- Enable RLS on bank_connections
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view bank connections in their organization
CREATE POLICY "Users can view org bank connections"
  ON bank_connections FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admin+ can create bank connections
CREATE POLICY "Admin can create bank connections"
  ON bank_connections FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- Policy: Admin+ can update bank connections
CREATE POLICY "Admin can update bank connections"
  ON bank_connections FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- Policy: Admin+ can delete bank connections
CREATE POLICY "Admin can delete bank connections"
  ON bank_connections FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- ROW LEVEL SECURITY - BANK TRANSACTIONS
-- =====================================================

-- Enable RLS on bank_transactions
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view bank transactions in their organization
CREATE POLICY "Users can view org bank transactions"
  ON bank_transactions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: System can create bank transactions (from sync)
CREATE POLICY "System can create bank transactions"
  ON bank_transactions FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Staff+ can update bank transactions
CREATE POLICY "Staff can update bank transactions"
  ON bank_transactions FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Admin+ can delete bank transactions
CREATE POLICY "Admin can delete bank transactions"
  ON bank_transactions FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- ROW LEVEL SECURITY - BANK SYNC LOGS
-- =====================================================

-- Enable RLS on bank_sync_logs
ALTER TABLE bank_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sync logs in their organization
CREATE POLICY "Users can view org sync logs"
  ON bank_sync_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: System can create sync logs
CREATE POLICY "System can create sync logs"
  ON bank_sync_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- ROW LEVEL SECURITY - CATEGORIZATION RULES
-- =====================================================

-- Enable RLS on categorization_rules
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view rules in their organization
CREATE POLICY "Users can view org rules"
  ON categorization_rules FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Staff+ can create rules
CREATE POLICY "Staff can create rules"
  ON categorization_rules FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Staff+ can update rules
CREATE POLICY "Staff can update rules"
  ON categorization_rules FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- Policy: Admin+ can delete rules
CREATE POLICY "Admin can delete rules"
  ON categorization_rules FOR DELETE
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

-- Trigger for bank_connections updated_at
CREATE TRIGGER update_bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bank_transactions updated_at
CREATE TRIGGER update_bank_transactions_updated_at
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for categorization_rules updated_at
CREATE TRIGGER update_categorization_rules_updated_at
  BEFORE UPDATE ON categorization_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update rule match count
CREATE OR REPLACE FUNCTION update_rule_match_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update match count when a rule is applied
  IF NEW.suggested_by = 'rule' AND NEW.suggested_account_id IS NOT NULL THEN
    UPDATE categorization_rules
    SET
      match_count = match_count + 1,
      last_matched_at = NOW()
    WHERE account_id = NEW.suggested_account_id
      AND org_id = NEW.org_id
      AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track rule usage
CREATE TRIGGER track_rule_usage
  AFTER INSERT OR UPDATE ON bank_transactions
  FOR EACH ROW
  WHEN (NEW.suggested_by = 'rule')
  EXECUTE FUNCTION update_rule_match_count();

-- Function to prevent duplicate bank transactions
CREATE OR REPLACE FUNCTION prevent_duplicate_bank_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for existing transaction with same provider_transaction_id
  IF EXISTS (
    SELECT 1 FROM bank_transactions
    WHERE org_id = NEW.org_id
      AND provider_transaction_id = NEW.provider_transaction_id
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate bank transaction: provider_transaction_id already exists';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent duplicates
CREATE TRIGGER prevent_duplicate_bank_txn
  BEFORE INSERT OR UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_bank_transaction();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to apply categorization rules
CREATE OR REPLACE FUNCTION apply_categorization_rules(
  p_org_id UUID,
  p_transaction_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_transaction RECORD;
  v_rule RECORD;
  v_matched BOOLEAN := false;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM bank_transactions
  WHERE id = p_transaction_id AND org_id = p_org_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Try to match against active rules (ordered by priority)
  FOR v_rule IN
    SELECT * FROM categorization_rules
    WHERE org_id = p_org_id
      AND is_active = true
    ORDER BY priority DESC, created_at ASC
  LOOP
    -- Simple pattern matching (can be enhanced with regex)
    IF v_rule.rule_type = 'merchant' AND v_transaction.merchant_name ILIKE '%' || v_rule.pattern || '%' THEN
      v_matched := true;
    ELSIF v_rule.rule_type = 'description' AND v_transaction.description ILIKE '%' || v_rule.pattern || '%' THEN
      v_matched := true;
    END IF;

    -- If matched, update transaction
    IF v_matched THEN
      UPDATE bank_transactions
      SET
        suggested_account_id = v_rule.account_id,
        suggested_by = 'rule',
        categorization_confidence = 0.95
      WHERE id = p_transaction_id;

      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to get unreconciled transactions count
CREATE OR REPLACE FUNCTION get_unreconciled_count(
  p_org_id UUID,
  p_bank_connection_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM bank_transactions
  WHERE org_id = p_org_id
    AND is_reconciled = false
    AND pending = false
    AND (p_bank_connection_id IS NULL OR bank_connection_id = p_bank_connection_id);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE bank_connections IS 'Bank account connections via Plaid, Wise, or manual entry';
COMMENT ON TABLE bank_transactions IS 'Synced bank transactions from connected accounts';
COMMENT ON TABLE bank_sync_logs IS 'Bank sync history and observability logs';
COMMENT ON TABLE categorization_rules IS 'Auto-categorization rules for bank transactions';
COMMENT ON COLUMN bank_connections.access_token_encrypted IS 'Encrypted access token for bank API';
COMMENT ON COLUMN bank_transactions.amount IS 'Transaction amount (positive=credit, negative=debit)';
COMMENT ON COLUMN bank_transactions.categorization_confidence IS 'AI confidence score (0.00-1.00)';
COMMENT ON COLUMN categorization_rules.auto_apply IS 'If true, automatically post matched transactions';
