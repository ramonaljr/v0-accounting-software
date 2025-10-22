-- OpportunityOS Phase 2.1 - Chart of Accounts
-- Migration: Initialize Chart of Accounts schema
-- Created: 2025-10-21

-- =====================================================
-- CHART OF ACCOUNTS
-- =====================================================

-- Account types enum (using check constraint instead of enum for flexibility)
-- Types: asset, liability, equity, revenue, expense

-- COA Templates table (pre-built chart of accounts by region/industry)
CREATE TABLE coa_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL, -- e.g., "US", "EU", "PH", "JP"
  industry TEXT NOT NULL, -- e.g., "general", "retail", "saas", "services"
  template_data JSONB NOT NULL, -- Full COA structure as JSON
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for COA templates
CREATE INDEX idx_coa_templates_region ON coa_templates(region);
CREATE INDEX idx_coa_templates_industry ON coa_templates(industry);
CREATE INDEX idx_coa_templates_active ON coa_templates(is_active);

-- Accounts table (organization-specific chart of accounts)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- e.g., "1000", "4000" (account number)
  name TEXT NOT NULL, -- e.g., "Cash", "Revenue"
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES accounts(id) ON DELETE RESTRICT, -- For hierarchical accounts
  currency TEXT NOT NULL DEFAULT 'USD',
  is_system BOOLEAN NOT NULL DEFAULT false, -- System accounts can't be deleted
  is_active BOOLEAN NOT NULL DEFAULT true,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  balance_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

-- Create indexes for accounts
CREATE INDEX idx_accounts_org_id ON accounts(org_id);
CREATE INDEX idx_accounts_code ON accounts(org_id, code);
CREATE INDEX idx_accounts_type ON accounts(org_id, account_type);
CREATE INDEX idx_accounts_parent ON accounts(parent_id);
CREATE INDEX idx_accounts_active ON accounts(org_id, is_active);

-- =====================================================
-- ROW LEVEL SECURITY - ACCOUNTS
-- =====================================================

-- Enable RLS on accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view accounts in their organization
CREATE POLICY "Users can view org accounts"
  ON accounts FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admin/Owner can create accounts
CREATE POLICY "Admin can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- Policy: Admin/Owner can update accounts
CREATE POLICY "Admin can update accounts"
  ON accounts FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- Policy: Owner can delete non-system accounts
CREATE POLICY "Owner can delete accounts"
  ON accounts FOR DELETE
  USING (
    is_system = false
    AND org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- ROW LEVEL SECURITY - COA TEMPLATES
-- =====================================================

-- Enable RLS on coa_templates (read-only for all authenticated users)
ALTER TABLE coa_templates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active templates
CREATE POLICY "Anyone can view active templates"
  ON coa_templates FOR SELECT
  USING (is_active = true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for accounts table
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for coa_templates table
CREATE TRIGGER update_coa_templates_updated_at
  BEFORE UPDATE ON coa_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate account hierarchy (prevent circular references)
CREATE OR REPLACE FUNCTION validate_account_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_depth INTEGER := 0;
  v_max_depth INTEGER := 10;
BEGIN
  -- If no parent, no validation needed
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if parent exists and belongs to same org
  SELECT parent_id INTO v_parent_id
  FROM accounts
  WHERE id = NEW.parent_id AND org_id = NEW.org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent account must belong to the same organization';
  END IF;

  -- Prevent self-reference
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'Account cannot be its own parent';
  END IF;

  -- Check for circular reference
  v_parent_id := NEW.parent_id;
  WHILE v_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
    IF v_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Circular reference detected in account hierarchy';
    END IF;

    SELECT parent_id INTO v_parent_id
    FROM accounts
    WHERE id = v_parent_id;

    v_depth := v_depth + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate account hierarchy
CREATE TRIGGER validate_account_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION validate_account_hierarchy();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get account full path (hierarchical name)
CREATE OR REPLACE FUNCTION get_account_path(account_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT := '';
  v_name TEXT;
  v_parent_id UUID;
  v_depth INTEGER := 0;
  v_max_depth INTEGER := 10;
BEGIN
  -- Start with the current account
  SELECT name, parent_id INTO v_name, v_parent_id
  FROM accounts
  WHERE id = account_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_path := v_name;

  -- Walk up the hierarchy
  WHILE v_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
    SELECT name, parent_id INTO v_name, v_parent_id
    FROM accounts
    WHERE id = v_parent_id;

    v_path := v_name || ' > ' || v_path;
    v_depth := v_depth + 1;
  END LOOP;

  RETURN v_path;
END;
$$ LANGUAGE plpgsql;

-- Function to get account balance as of a specific date
CREATE OR REPLACE FUNCTION get_account_balance(
  p_account_id UUID,
  p_as_of_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC(15,2);
BEGIN
  -- This is a placeholder - actual implementation will sum from journal_entry_lines
  -- For now, return the stored balance
  SELECT balance INTO v_balance
  FROM accounts
  WHERE id = p_account_id;

  RETURN COALESCE(v_balance, 0.00);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE coa_templates IS 'Pre-built Chart of Accounts templates for different regions and industries';
COMMENT ON TABLE accounts IS 'Organization-specific Chart of Accounts';
COMMENT ON COLUMN accounts.code IS 'Account number/code (unique per organization)';
COMMENT ON COLUMN accounts.account_type IS 'Account type: asset, liability, equity, revenue, expense';
COMMENT ON COLUMN accounts.parent_id IS 'Parent account for hierarchical structure';
COMMENT ON COLUMN accounts.is_system IS 'System accounts cannot be deleted or have type changed';
COMMENT ON COLUMN accounts.balance IS 'Current account balance (cached, recalculated from journal entries)';
COMMENT ON COLUMN accounts.balance_date IS 'Date when balance was last calculated';
