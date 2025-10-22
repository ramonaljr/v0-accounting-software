-- =====================================================
-- Phase 5: User Features - Invoicing & Sales
-- Migration: 20250105000000_init_phase5_invoicing.sql
-- =====================================================

-- =====================================================
-- 1. INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  terms TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT invoices_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT invoices_invoice_number_check CHECK (invoice_number != ''),
  CONSTRAINT invoices_totals_check CHECK (subtotal >= 0 AND tax_total >= 0 AND total >= 0),
  CONSTRAINT invoices_paid_check CHECK (amount_paid >= 0 AND amount_due >= 0),
  CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
  UNIQUE(org_id, invoice_number)
);

-- Indexes
CREATE INDEX idx_invoices_org_id ON invoices(org_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(org_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(org_id, due_date);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date DESC);

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read invoices"
  ON invoices FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Org members can update invoices"
  ON invoices FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

CREATE POLICY "Org owners and admins can delete invoices"
  ON invoices FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 2. INVOICE LINE ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  account_id UUID REFERENCES accounts(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT invoice_line_items_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT invoice_line_items_description_check CHECK (description != ''),
  CONSTRAINT invoice_line_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT invoice_line_items_amounts_check CHECK (unit_price >= 0 AND amount >= 0 AND tax_amount >= 0)
);

-- Indexes
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_org_id ON invoice_line_items(org_id);
CREATE INDEX idx_invoice_line_items_sort_order ON invoice_line_items(invoice_id, sort_order);

-- RLS Policies
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read invoice line items"
  ON invoice_line_items FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can manage invoice line items"
  ON invoice_line_items FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- 3. INVOICE PAYMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  bank_transaction_id UUID,
  journal_entry_id UUID,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT invoice_payments_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT invoice_payments_amount_check CHECK (amount > 0),
  CONSTRAINT invoice_payments_method_check CHECK (payment_method IN ('stripe', 'paypal', 'bank', 'cash', 'check', 'other'))
);

-- Indexes
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_org_id ON invoice_payments(org_id);
CREATE INDEX idx_invoice_payments_payment_date ON invoice_payments(payment_date DESC);

-- RLS Policies
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read invoice payments"
  ON invoice_payments FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert invoice payments"
  ON invoice_payments FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
    AND created_by = auth.uid()
  );

-- =====================================================
-- 4. ITEMS (PRODUCTS & SERVICES) TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'service',
  sku TEXT,
  name TEXT NOT NULL,
  sales_description TEXT,
  purchase_description TEXT,
  sales_price NUMERIC(15,2) DEFAULT 0,
  purchase_cost NUMERIC(15,2) DEFAULT 0,
  income_account_id UUID REFERENCES accounts(id),
  expense_account_id UUID REFERENCES accounts(id),
  asset_account_id UUID REFERENCES accounts(id),
  taxable BOOLEAN NOT NULL DEFAULT true,
  track_quantity BOOLEAN NOT NULL DEFAULT false,
  quantity_on_hand NUMERIC(15,3) DEFAULT 0,
  reorder_point NUMERIC(15,3),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT items_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT items_name_check CHECK (name != ''),
  CONSTRAINT items_type_check CHECK (type IN ('service', 'non_inventory', 'inventory')),
  CONSTRAINT items_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT items_pricing_check CHECK (sales_price >= 0 AND purchase_cost >= 0),
  UNIQUE(org_id, sku) WHERE sku IS NOT NULL
);

-- Indexes
CREATE INDEX idx_items_org_id ON items(org_id);
CREATE INDEX idx_items_name ON items(org_id, name);
CREATE INDEX idx_items_type ON items(org_id, type);
CREATE INDEX idx_items_status ON items(org_id, status);

-- RLS Policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read items"
  ON items FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can manage items"
  ON items FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. FUNCTIONS FOR INVOICE CALCULATIONS
-- =====================================================

-- Update invoice totals from line items
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  line_subtotal NUMERIC(15,2);
  line_tax_total NUMERIC(15,2);
  line_total NUMERIC(15,2);
  paid_total NUMERIC(15,2);
BEGIN
  -- Calculate totals from line items
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(amount + tax_amount), 0)
  INTO line_subtotal, line_tax_total, line_total
  FROM invoice_line_items
  WHERE invoice_id = invoice_uuid;

  -- Calculate total payments
  SELECT COALESCE(SUM(amount), 0)
  INTO paid_total
  FROM invoice_payments
  WHERE invoice_id = invoice_uuid;

  -- Update invoice
  UPDATE invoices
  SET
    subtotal = line_subtotal,
    tax_total = line_tax_total,
    total = line_total,
    amount_paid = paid_total,
    amount_due = line_total - paid_total,
    updated_at = NOW()
  WHERE id = invoice_uuid;
END;
$$;

-- Trigger to recalculate invoice totals when line items change
CREATE OR REPLACE FUNCTION trigger_recalculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_invoice_totals(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_invoice_totals(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER recalculate_invoice_totals_on_line_items
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_invoice_totals();

CREATE TRIGGER recalculate_invoice_totals_on_payments
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_invoice_totals();

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON TABLE invoices IS 'Customer invoices for accounts receivable';
COMMENT ON TABLE invoice_line_items IS 'Line items for invoices with products/services';
COMMENT ON TABLE invoice_payments IS 'Payments received against invoices';
COMMENT ON TABLE items IS 'Products and services catalog';

COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, viewed, partial, paid, overdue, cancelled';
COMMENT ON COLUMN invoices.amount_due IS 'Outstanding balance (total - amount_paid)';
COMMENT ON COLUMN items.type IS 'Item type: service, non_inventory, inventory';
COMMENT ON COLUMN items.track_quantity IS 'Whether to track inventory quantities';
