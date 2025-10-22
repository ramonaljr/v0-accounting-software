-- =====================================================
-- Phase 4: Automation & Reconciliation - OCR & Expenses
-- Migration: 20250104000000_init_phase4_ocr_expenses.sql
-- =====================================================

-- =====================================================
-- 1. RECEIPTS TABLE (OCR Processing)
-- =====================================================

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  ocr_status TEXT NOT NULL DEFAULT 'pending',
  ocr_result JSONB,
  ocr_confidence NUMERIC(3,2),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT receipts_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT receipts_file_path_check CHECK (file_path != ''),
  CONSTRAINT receipts_ocr_status_check CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT receipts_ocr_confidence_check CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1))
);

-- Indexes
CREATE INDEX idx_receipts_org_id ON receipts(org_id);
CREATE INDEX idx_receipts_uploaded_by ON receipts(uploaded_by);
CREATE INDEX idx_receipts_ocr_status ON receipts(ocr_status);
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);

-- RLS Policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read receipts"
  ON receipts FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert receipts"
  ON receipts FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Org members can update their receipts"
  ON receipts FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners and admins can delete receipts"
  ON receipts FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 2. EXPENSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  vendor_name TEXT,
  date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tax_amount NUMERIC(15,2) DEFAULT 0,
  category TEXT,
  description TEXT,
  account_id UUID REFERENCES accounts(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT expenses_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT expenses_amount_check CHECK (amount > 0),
  CONSTRAINT expenses_tax_amount_check CHECK (tax_amount >= 0),
  CONSTRAINT expenses_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'posted'))
);

-- Indexes
CREATE INDEX idx_expenses_org_id ON expenses(org_id);
CREATE INDEX idx_expenses_receipt_id ON expenses(receipt_id);
CREATE INDEX idx_expenses_account_id ON expenses(account_id);
CREATE INDEX idx_expenses_submitted_by ON expenses(submitted_by);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(date DESC);

-- RLS Policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read expenses"
  ON expenses FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Org members can update their draft expenses"
  ON expenses FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND (
      submitted_by = auth.uid() OR
      org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'accountant')
      )
    )
  );

CREATE POLICY "Org owners and admins can delete expenses"
  ON expenses FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 3. VENDORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  tax_id TEXT,
  payment_terms TEXT,
  default_account_id UUID REFERENCES accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT vendors_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT vendors_name_check CHECK (name != ''),
  UNIQUE(org_id, name)
);

-- Indexes
CREATE INDEX idx_vendors_org_id ON vendors(org_id);
CREATE INDEX idx_vendors_name ON vendors(org_id, name);
CREATE INDEX idx_vendors_email ON vendors(email) WHERE email IS NOT NULL;
CREATE INDEX idx_vendors_is_active ON vendors(org_id, is_active);

-- RLS Policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read vendors"
  ON vendors FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert vendors"
  ON vendors FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

CREATE POLICY "Org members can update vendors"
  ON vendors FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

CREATE POLICY "Org owners and admins can delete vendors"
  ON vendors FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 4. CUSTOMERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  tax_id TEXT,
  payment_terms TEXT,
  credit_limit NUMERIC(15,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT customers_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT customers_name_check CHECK (name != ''),
  CONSTRAINT customers_credit_limit_check CHECK (credit_limit IS NULL OR credit_limit >= 0),
  UNIQUE(org_id, name)
);

-- Indexes
CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_name ON customers(org_id, name);
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_is_active ON customers(org_id, is_active);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read customers"
  ON customers FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert customers"
  ON customers FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

CREATE POLICY "Org members can update customers"
  ON customers FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

CREATE POLICY "Org owners and admins can delete customers"
  ON customers FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE receipts IS 'Stores uploaded receipt images and OCR processing results';
COMMENT ON TABLE expenses IS 'Expense entries created from receipts or manual entry';
COMMENT ON TABLE vendors IS 'Vendor directory for accounts payable';
COMMENT ON TABLE customers IS 'Customer directory for accounts receivable';

COMMENT ON COLUMN receipts.ocr_result IS 'Structured data extracted from OCR (vendor, date, amount, line items)';
COMMENT ON COLUMN receipts.ocr_confidence IS 'Overall OCR confidence score (0.0 to 1.0)';
COMMENT ON COLUMN expenses.status IS 'Expense approval status: draft, submitted, approved, rejected, posted';
COMMENT ON COLUMN vendors.address IS 'JSON object with street, city, state, zip, country';
COMMENT ON COLUMN customers.billing_address IS 'JSON object with street, city, state, zip, country';
COMMENT ON COLUMN customers.shipping_address IS 'JSON object with street, city, state, zip, country';
