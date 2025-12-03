-- Accunza Phase 2 - Accounts Receivable & Payable
-- Migration: Customer/Supplier management, Sales/Purchase Invoices
-- Created: 2025-02-04

-- =====================================================
-- CUSTOMERS
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identification
  customer_code VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_type VARCHAR(20) DEFAULT 'Company' CHECK (customer_type IN ('Company', 'Individual')),

  -- Tax Information (Philippines)
  tax_id VARCHAR(50),                       -- TIN (Tax Identification Number)
  tax_category VARCHAR(50),                 -- VAT Registered, Non-VAT, etc.

  -- Contact
  primary_contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  website VARCHAR(255),

  -- Billing Address
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(2) DEFAULT 'PH',

  -- Shipping Address
  shipping_address_line1 VARCHAR(255),
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(2) DEFAULT 'PH',

  -- Financial
  default_currency VARCHAR(3) DEFAULT 'PHP',
  credit_limit DECIMAL(20,4) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,         -- Days
  price_list_id UUID,                       -- Default price list

  -- Default Accounts
  default_receivable_account_id UUID REFERENCES accounts(id),

  -- Classification
  customer_group VARCHAR(100),
  territory VARCHAR(100),
  industry VARCHAR(100),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_frozen BOOLEAN NOT NULL DEFAULT false,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(org_id, customer_code)
);

CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_code ON customers(org_id, customer_code);
CREATE INDEX idx_customers_name ON customers(org_id, customer_name);
CREATE INDEX idx_customers_active ON customers(org_id, is_active);

-- =====================================================
-- SUPPLIERS
-- =====================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identification
  supplier_code VARCHAR(50) NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(20) DEFAULT 'Company' CHECK (supplier_type IN ('Company', 'Individual')),

  -- Tax Information (Philippines)
  tax_id VARCHAR(50),                       -- TIN
  tax_category VARCHAR(50),                 -- VAT Registered, Non-VAT, etc.
  withholding_tax_category VARCHAR(50),     -- WC010, WC100, etc.

  -- Contact
  primary_contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  website VARCHAR(255),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'PH',

  -- Financial
  default_currency VARCHAR(3) DEFAULT 'PHP',
  payment_terms INTEGER DEFAULT 30,         -- Days

  -- Default Accounts
  default_payable_account_id UUID REFERENCES accounts(id),
  default_expense_account_id UUID REFERENCES accounts(id),

  -- Classification
  supplier_group VARCHAR(100),

  -- Bank Details
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(255),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_frozen BOOLEAN NOT NULL DEFAULT false,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(org_id, supplier_code)
);

CREATE INDEX idx_suppliers_org_id ON suppliers(org_id);
CREATE INDEX idx_suppliers_code ON suppliers(org_id, supplier_code);
CREATE INDEX idx_suppliers_name ON suppliers(org_id, supplier_name);
CREATE INDEX idx_suppliers_active ON suppliers(org_id, is_active);

-- =====================================================
-- SALES INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  invoice_number VARCHAR(50) NOT NULL,
  naming_series VARCHAR(20) DEFAULT 'SINV',

  -- Type
  invoice_type VARCHAR(20) DEFAULT 'Invoice' CHECK (invoice_type IN ('Invoice', 'Credit Note', 'Debit Note')),

  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,

  -- Dates
  posting_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Currency
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  exchange_rate DECIMAL(15,9) NOT NULL DEFAULT 1,

  -- Amounts (in document currency)
  total_qty DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_total DECIMAL(20,4) NOT NULL DEFAULT 0,          -- Before tax
  total_taxes DECIMAL(20,4) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  grand_total DECIMAL(20,4) NOT NULL DEFAULT 0,         -- After tax & discount
  rounding_adjustment DECIMAL(20,4) NOT NULL DEFAULT 0,
  rounded_total DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Amounts (in base currency - PHP)
  base_grand_total DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Outstanding
  outstanding_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Withholding Tax (Philippines)
  apply_withholding_tax BOOLEAN DEFAULT false,
  withholding_tax_amount DECIMAL(20,4) DEFAULT 0,
  net_total DECIMAL(20,4) NOT NULL DEFAULT 0,           -- grand_total - withholding

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Paid', 'Partly Paid', 'Overdue', 'Cancelled', 'Return')),
  is_return BOOLEAN NOT NULL DEFAULT false,
  return_against UUID REFERENCES sales_invoices(id),

  -- Accounts
  debit_to_account_id UUID REFERENCES accounts(id),     -- Receivable account
  income_account_id UUID REFERENCES accounts(id),       -- Default income account

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,

  -- Payment
  payment_terms_template VARCHAR(100),

  -- References
  sales_order_id UUID,                      -- Future: link to sales order
  delivery_note_id UUID,                    -- Future: link to delivery note
  po_number VARCHAR(100),                   -- Customer's PO number
  po_date DATE,

  -- Additional
  remarks TEXT,
  terms_and_conditions TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  submitted_by UUID REFERENCES auth.users(id),

  -- Amendment
  amended_from UUID REFERENCES sales_invoices(id),

  UNIQUE(org_id, invoice_number)
);

CREATE INDEX idx_sales_invoices_org_id ON sales_invoices(org_id);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_posting_date ON sales_invoices(org_id, posting_date);
CREATE INDEX idx_sales_invoices_due_date ON sales_invoices(org_id, due_date);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(org_id, status);
CREATE INDEX idx_sales_invoices_outstanding ON sales_invoices(org_id, outstanding_amount) WHERE outstanding_amount > 0;

-- Sales Invoice Items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL DEFAULT 0,

  -- Item (can be null for service-only invoices)
  item_id UUID,                             -- Future: link to items table
  item_code VARCHAR(100),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Quantity
  qty DECIMAL(20,4) NOT NULL DEFAULT 1,
  uom VARCHAR(50) DEFAULT 'Unit',           -- Unit of Measure
  conversion_factor DECIMAL(15,6) DEFAULT 1,
  stock_qty DECIMAL(20,4),                  -- qty * conversion_factor

  -- Pricing
  rate DECIMAL(20,4) NOT NULL DEFAULT 0,    -- Price per unit
  amount DECIMAL(20,4) NOT NULL DEFAULT 0,  -- qty * rate

  -- Discount
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(20,4) DEFAULT 0,
  net_amount DECIMAL(20,4) NOT NULL DEFAULT 0,  -- amount - discount

  -- Tax
  tax_template_id UUID,                     -- Future: tax templates
  tax_rate DECIMAL(5,2) DEFAULT 12,         -- VAT rate (12% in PH)
  tax_amount DECIMAL(20,4) DEFAULT 0,

  -- Total
  total_amount DECIMAL(20,4) NOT NULL DEFAULT 0,  -- net_amount + tax_amount

  -- Base currency amounts
  base_rate DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_net_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Accounts
  income_account_id UUID REFERENCES accounts(id),
  expense_account_id UUID REFERENCES accounts(id),  -- For COGS

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,

  -- Warehouse (for inventory)
  warehouse_id UUID,                        -- Future: link to warehouses

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_invoice_items_invoice ON sales_invoice_items(sales_invoice_id);
CREATE INDEX idx_sales_invoice_items_item ON sales_invoice_items(item_id);

-- Sales Invoice Taxes (for multiple tax lines)
CREATE TABLE IF NOT EXISTS sales_invoice_taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL DEFAULT 0,

  charge_type VARCHAR(50) NOT NULL DEFAULT 'On Net Total',  -- On Net Total, On Previous Row Total, Actual
  account_id UUID NOT NULL REFERENCES accounts(id),

  description VARCHAR(255),
  rate DECIMAL(5,2) DEFAULT 0,              -- Percentage

  tax_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_tax_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  total DECIMAL(20,4) NOT NULL DEFAULT 0,   -- Cumulative total
  base_total DECIMAL(20,4) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_invoice_taxes_invoice ON sales_invoice_taxes(sales_invoice_id);

-- =====================================================
-- PURCHASE INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  invoice_number VARCHAR(50) NOT NULL,
  naming_series VARCHAR(20) DEFAULT 'PINV',

  -- Type
  invoice_type VARCHAR(20) DEFAULT 'Invoice' CHECK (invoice_type IN ('Invoice', 'Credit Note', 'Debit Note')),

  -- Supplier
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
  supplier_address TEXT,

  -- Supplier's Invoice
  supplier_invoice_number VARCHAR(100),
  supplier_invoice_date DATE,

  -- Dates
  posting_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Currency
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  exchange_rate DECIMAL(15,9) NOT NULL DEFAULT 1,

  -- Amounts (in document currency)
  total_qty DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_total DECIMAL(20,4) NOT NULL DEFAULT 0,          -- Before tax
  total_taxes DECIMAL(20,4) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  grand_total DECIMAL(20,4) NOT NULL DEFAULT 0,         -- After tax & discount
  rounding_adjustment DECIMAL(20,4) NOT NULL DEFAULT 0,
  rounded_total DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Amounts (in base currency - PHP)
  base_grand_total DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Outstanding
  outstanding_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Withholding Tax (Philippines) - deducted from payment
  apply_withholding_tax BOOLEAN DEFAULT false,
  withholding_tax_category VARCHAR(50),
  withholding_tax_rate DECIMAL(5,2) DEFAULT 0,
  withholding_tax_amount DECIMAL(20,4) DEFAULT 0,
  net_total DECIMAL(20,4) NOT NULL DEFAULT 0,           -- Amount to pay

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Paid', 'Partly Paid', 'Overdue', 'Cancelled', 'Return', 'Debit Note Issued')),
  is_return BOOLEAN NOT NULL DEFAULT false,
  return_against UUID REFERENCES purchase_invoices(id),

  -- Accounts
  credit_to_account_id UUID REFERENCES accounts(id),    -- Payable account
  expense_account_id UUID REFERENCES accounts(id),      -- Default expense account

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,

  -- Payment
  payment_terms_template VARCHAR(100),

  -- References
  purchase_order_id UUID,                   -- Future: link to purchase order
  purchase_receipt_id UUID,                 -- Future: link to purchase receipt

  -- Additional
  remarks TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  submitted_by UUID REFERENCES auth.users(id),

  -- Amendment
  amended_from UUID REFERENCES purchase_invoices(id),

  UNIQUE(org_id, invoice_number)
);

CREATE INDEX idx_purchase_invoices_org_id ON purchase_invoices(org_id);
CREATE INDEX idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoices_posting_date ON purchase_invoices(org_id, posting_date);
CREATE INDEX idx_purchase_invoices_due_date ON purchase_invoices(org_id, due_date);
CREATE INDEX idx_purchase_invoices_status ON purchase_invoices(org_id, status);
CREATE INDEX idx_purchase_invoices_outstanding ON purchase_invoices(org_id, outstanding_amount) WHERE outstanding_amount > 0;

-- Purchase Invoice Items
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL DEFAULT 0,

  -- Item
  item_id UUID,                             -- Future: link to items table
  item_code VARCHAR(100),
  item_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Quantity
  qty DECIMAL(20,4) NOT NULL DEFAULT 1,
  uom VARCHAR(50) DEFAULT 'Unit',
  conversion_factor DECIMAL(15,6) DEFAULT 1,
  stock_qty DECIMAL(20,4),

  -- Pricing
  rate DECIMAL(20,4) NOT NULL DEFAULT 0,
  amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Discount
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(20,4) DEFAULT 0,
  net_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Tax
  tax_template_id UUID,
  tax_rate DECIMAL(5,2) DEFAULT 12,
  tax_amount DECIMAL(20,4) DEFAULT 0,

  -- Total
  total_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Base currency amounts
  base_rate DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_net_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  -- Accounts
  expense_account_id UUID REFERENCES accounts(id),

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,

  -- Warehouse (for inventory)
  warehouse_id UUID,

  -- For landed costs
  is_fixed_asset BOOLEAN DEFAULT false,
  asset_id UUID,                            -- Future: link to assets

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_invoice_items_invoice ON purchase_invoice_items(purchase_invoice_id);
CREATE INDEX idx_purchase_invoice_items_item ON purchase_invoice_items(item_id);

-- Purchase Invoice Taxes
CREATE TABLE IF NOT EXISTS purchase_invoice_taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL DEFAULT 0,

  charge_type VARCHAR(50) NOT NULL DEFAULT 'On Net Total',
  account_id UUID NOT NULL REFERENCES accounts(id),

  description VARCHAR(255),
  rate DECIMAL(5,2) DEFAULT 0,

  tax_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_tax_amount DECIMAL(20,4) NOT NULL DEFAULT 0,

  total DECIMAL(20,4) NOT NULL DEFAULT 0,
  base_total DECIMAL(20,4) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_invoice_taxes_invoice ON purchase_invoice_taxes(purchase_invoice_id);

-- =====================================================
-- PAYMENT LEDGER ENTRY (Tracks outstanding)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  posting_date DATE NOT NULL,

  -- Party
  party_type VARCHAR(50) NOT NULL,          -- Customer, Supplier
  party_id UUID NOT NULL,

  -- Voucher (source document)
  voucher_type VARCHAR(50) NOT NULL,        -- Sales Invoice, Purchase Invoice, Payment Entry, Journal Entry
  voucher_id UUID NOT NULL,
  voucher_no VARCHAR(100) NOT NULL,

  -- Against Voucher (for payments)
  against_voucher_type VARCHAR(50),
  against_voucher_id UUID,
  against_voucher_no VARCHAR(100),

  -- Amounts (positive = receivable/debit, negative = payable/credit)
  amount DECIMAL(20,4) NOT NULL,
  amount_in_account_currency DECIMAL(20,4) NOT NULL,

  account_id UUID NOT NULL REFERENCES accounts(id),
  account_currency VARCHAR(3) NOT NULL DEFAULT 'PHP',

  -- Due date for tracking overdue
  due_date DATE,

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),

  -- Flags
  is_cancelled BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_payment_ledger_org ON payment_ledger_entries(org_id);
CREATE INDEX idx_payment_ledger_party ON payment_ledger_entries(party_type, party_id);
CREATE INDEX idx_payment_ledger_voucher ON payment_ledger_entries(voucher_type, voucher_id);
CREATE INDEX idx_payment_ledger_against ON payment_ledger_entries(against_voucher_type, against_voucher_id);
CREATE INDEX idx_payment_ledger_date ON payment_ledger_entries(org_id, posting_date);
CREATE INDEX idx_payment_ledger_due_date ON payment_ledger_entries(org_id, due_date);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_ledger_entries ENABLE ROW LEVEL SECURITY;

-- Customers
CREATE POLICY "Users can view org customers"
  ON customers FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage customers"
  ON customers FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Suppliers
CREATE POLICY "Users can view org suppliers"
  ON suppliers FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage suppliers"
  ON suppliers FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Sales Invoices
CREATE POLICY "Users can view org sales invoices"
  ON sales_invoices FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage sales invoices"
  ON sales_invoices FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Sales Invoice Items
CREATE POLICY "Users can view sales invoice items"
  ON sales_invoice_items FOR SELECT
  USING (sales_invoice_id IN (SELECT id FROM sales_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "Staff can manage sales invoice items"
  ON sales_invoice_items FOR ALL
  USING (sales_invoice_id IN (SELECT id FROM sales_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff'))));

-- Sales Invoice Taxes
CREATE POLICY "Users can view sales invoice taxes"
  ON sales_invoice_taxes FOR SELECT
  USING (sales_invoice_id IN (SELECT id FROM sales_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "Staff can manage sales invoice taxes"
  ON sales_invoice_taxes FOR ALL
  USING (sales_invoice_id IN (SELECT id FROM sales_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff'))));

-- Purchase Invoices
CREATE POLICY "Users can view org purchase invoices"
  ON purchase_invoices FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage purchase invoices"
  ON purchase_invoices FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Purchase Invoice Items
CREATE POLICY "Users can view purchase invoice items"
  ON purchase_invoice_items FOR SELECT
  USING (purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "Staff can manage purchase invoice items"
  ON purchase_invoice_items FOR ALL
  USING (purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff'))));

-- Purchase Invoice Taxes
CREATE POLICY "Users can view purchase invoice taxes"
  ON purchase_invoice_taxes FOR SELECT
  USING (purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())));

CREATE POLICY "Staff can manage purchase invoice taxes"
  ON purchase_invoice_taxes FOR ALL
  USING (purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff'))));

-- Payment Ledger Entries
CREATE POLICY "Users can view payment ledger"
  ON payment_ledger_entries FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "System can manage payment ledger"
  ON payment_ledger_entries FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_sales_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := EXTRACT(YEAR FROM NEW.posting_date)::TEXT;

  SELECT COALESCE(MAX(
    SUBSTRING(invoice_number FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM sales_invoices
  WHERE org_id = NEW.org_id
  AND invoice_number LIKE NEW.naming_series || '-' || v_year || '-%';

  NEW.invoice_number := NEW.naming_series || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_sales_invoice_number_trigger
  BEFORE INSERT ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_sales_invoice_number();

CREATE OR REPLACE FUNCTION generate_purchase_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := EXTRACT(YEAR FROM NEW.posting_date)::TEXT;

  SELECT COALESCE(MAX(
    SUBSTRING(invoice_number FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM purchase_invoices
  WHERE org_id = NEW.org_id
  AND invoice_number LIKE NEW.naming_series || '-' || v_year || '-%';

  NEW.invoice_number := NEW.naming_series || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_purchase_invoice_number_trigger
  BEFORE INSERT ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_purchase_invoice_number();

-- Auto-generate customer/supplier codes
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  v_sequence INTEGER;
BEGIN
  IF NEW.customer_code IS NOT NULL AND NEW.customer_code != '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(
    SUBSTRING(customer_code FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM customers
  WHERE org_id = NEW.org_id
  AND customer_code LIKE 'CUST-%';

  NEW.customer_code := 'CUST-' || LPAD(v_sequence::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_customer_code_trigger
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_code();

CREATE OR REPLACE FUNCTION generate_supplier_code()
RETURNS TRIGGER AS $$
DECLARE
  v_sequence INTEGER;
BEGIN
  IF NEW.supplier_code IS NOT NULL AND NEW.supplier_code != '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(
    SUBSTRING(supplier_code FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO v_sequence
  FROM suppliers
  WHERE org_id = NEW.org_id
  AND supplier_code LIKE 'SUPP-%';

  NEW.supplier_code := 'SUPP-' || LPAD(v_sequence::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_supplier_code_trigger
  BEFORE INSERT ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION generate_supplier_code();

-- Update timestamps
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_invoices_updated_at
  BEFORE UPDATE ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at
  BEFORE UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get customer outstanding balance
CREATE OR REPLACE FUNCTION get_customer_outstanding(
  p_customer_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(20,4) AS $$
DECLARE
  v_outstanding DECIMAL(20,4);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_outstanding
  FROM payment_ledger_entries
  WHERE party_type = 'Customer'
    AND party_id = p_customer_id
    AND posting_date <= p_as_of_date
    AND is_cancelled = false;

  RETURN v_outstanding;
END;
$$ LANGUAGE plpgsql;

-- Get supplier outstanding balance
CREATE OR REPLACE FUNCTION get_supplier_outstanding(
  p_supplier_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(20,4) AS $$
DECLARE
  v_outstanding DECIMAL(20,4);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_outstanding
  FROM payment_ledger_entries
  WHERE party_type = 'Supplier'
    AND party_id = p_supplier_id
    AND posting_date <= p_as_of_date
    AND is_cancelled = false;

  -- Return absolute value (payables are stored as negative)
  RETURN ABS(v_outstanding);
END;
$$ LANGUAGE plpgsql;

-- Get outstanding invoices for a party
CREATE OR REPLACE FUNCTION get_outstanding_invoices(
  p_party_type VARCHAR(50),
  p_party_id UUID
)
RETURNS TABLE (
  voucher_type VARCHAR(50),
  voucher_id UUID,
  voucher_no VARCHAR(100),
  posting_date DATE,
  due_date DATE,
  total_amount DECIMAL(20,4),
  outstanding_amount DECIMAL(20,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ple.voucher_type,
    ple.voucher_id,
    ple.voucher_no,
    ple.posting_date,
    ple.due_date,
    SUM(ple.amount) FILTER (WHERE ple.against_voucher_id IS NULL) as total_amount,
    SUM(ple.amount) as outstanding_amount
  FROM payment_ledger_entries ple
  WHERE ple.party_type = p_party_type
    AND ple.party_id = p_party_id
    AND ple.is_cancelled = false
  GROUP BY ple.voucher_type, ple.voucher_id, ple.voucher_no, ple.posting_date, ple.due_date
  HAVING SUM(ple.amount) != 0
  ORDER BY ple.posting_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE customers IS 'Customer master data for accounts receivable';
COMMENT ON TABLE suppliers IS 'Supplier/Vendor master data for accounts payable';
COMMENT ON TABLE sales_invoices IS 'Sales invoices (accounts receivable)';
COMMENT ON TABLE sales_invoice_items IS 'Line items for sales invoices';
COMMENT ON TABLE sales_invoice_taxes IS 'Tax calculations for sales invoices';
COMMENT ON TABLE purchase_invoices IS 'Purchase invoices/bills (accounts payable)';
COMMENT ON TABLE purchase_invoice_items IS 'Line items for purchase invoices';
COMMENT ON TABLE purchase_invoice_taxes IS 'Tax calculations for purchase invoices';
COMMENT ON TABLE payment_ledger_entries IS 'Tracks outstanding amounts for AR/AP reconciliation';
