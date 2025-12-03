-- =====================================================
-- Phase 3: Accounts Receivable (AR)
-- =====================================================
-- Purpose: Customers, items, sales invoices, payments, credit notes, aging per roadmap Phase 3

-- =====================================================
-- Customers Table
-- =====================================================
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Customer details
  customer_name text NOT NULL,
  customer_type text CHECK (customer_type IN ('company', 'individual')),
  tax_id text,

  -- Contact
  email text,
  phone text,
  website text,

  -- Billing address
  billing_address_line1 text,
  billing_address_line2 text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  billing_country text DEFAULT 'US',

  -- Shipping address
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,

  -- Financial
  currency text DEFAULT 'USD',
  payment_terms integer DEFAULT 30, -- Days
  credit_limit numeric(15,2),
  current_balance numeric(15,2) DEFAULT 0.00,

  -- Status
  is_active boolean DEFAULT true NOT NULL,
  credit_hold boolean DEFAULT false,

  -- Metadata
  notes text,
  tags text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_customers_org ON public.customers(org_id);
CREATE INDEX idx_customers_name ON public.customers(org_id, customer_name);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_active ON public.customers(org_id, is_active);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers for their org"
  ON public.customers FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage customers for their org"
  ON public.customers FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Items Table
-- =====================================================
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Item details
  item_code text NOT NULL,
  item_name text NOT NULL,
  description text,
  item_group text, -- e.g., 'Products', 'Services'

  -- Type
  item_type text NOT NULL CHECK (item_type IN ('product', 'service')),
  is_stock_item boolean DEFAULT false,

  -- Pricing
  standard_rate numeric(15,2),
  currency text DEFAULT 'USD',

  -- Accounts
  income_account_id uuid REFERENCES public.accounts(id),
  expense_account_id uuid REFERENCES public.accounts(id),

  -- Tax
  default_tax_template text,
  is_taxable boolean DEFAULT true,

  -- Status
  is_active boolean DEFAULT true NOT NULL,
  is_sales_item boolean DEFAULT true,
  is_purchase_item boolean DEFAULT true,

  -- Metadata
  unit_of_measure text DEFAULT 'Unit',
  barcode text,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT items_code_unique UNIQUE (org_id, item_code)
);

-- Indexes
CREATE INDEX idx_items_org ON public.items(org_id);
CREATE INDEX idx_items_code ON public.items(org_id, item_code);
CREATE INDEX idx_items_active ON public.items(org_id, is_active);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items for their org"
  ON public.items FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage items for their org"
  ON public.items FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Sales Invoices Table
-- =====================================================
CREATE TABLE public.sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,

  -- Dates
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  posting_date date,

  -- Amounts
  subtotal numeric(15,2) NOT NULL DEFAULT 0.00,
  tax_total numeric(15,2) NOT NULL DEFAULT 0.00,
  discount_amount numeric(15,2) DEFAULT 0.00,
  total_amount numeric(15,2) NOT NULL DEFAULT 0.00,
  paid_amount numeric(15,2) DEFAULT 0.00,
  outstanding_amount numeric(15,2) NOT NULL DEFAULT 0.00,

  -- Currency
  currency text NOT NULL DEFAULT 'USD',
  exchange_rate numeric(10,6) DEFAULT 1.000000,

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void')),
  is_posted boolean DEFAULT false,

  -- Payment
  payment_terms integer DEFAULT 30,
  payment_link text, -- Stripe/PayPal payment link

  -- References
  po_number text,
  journal_entry_id uuid REFERENCES public.journal_entries(id),

  -- Dunning
  dunning_status text CHECK (dunning_status IN ('none', 'reminder_1', 'reminder_2', 'final_notice', 'collections')),
  last_reminder_sent_at timestamptz,

  -- Metadata
  notes text,
  terms_and_conditions text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT sales_invoices_number_unique UNIQUE (org_id, invoice_number)
);

-- Indexes
CREATE INDEX idx_sales_invoices_org ON public.sales_invoices(org_id);
CREATE INDEX idx_sales_invoices_number ON public.sales_invoices(org_id, invoice_number);
CREATE INDEX idx_sales_invoices_customer ON public.sales_invoices(customer_id, invoice_date DESC);
CREATE INDEX idx_sales_invoices_date ON public.sales_invoices(org_id, invoice_date DESC);
CREATE INDEX idx_sales_invoices_due_date ON public.sales_invoices(org_id, due_date);
CREATE INDEX idx_sales_invoices_status ON public.sales_invoices(org_id, status);
CREATE INDEX idx_sales_invoices_overdue ON public.sales_invoices(org_id, due_date) WHERE outstanding_amount > 0 AND status NOT IN ('paid', 'void');

-- Enable RLS
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales_invoices for their org"
  ON public.sales_invoices FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage sales_invoices for their org"
  ON public.sales_invoices FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Sales Invoice Lines Table
-- =====================================================
CREATE TABLE public.sales_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_invoice_id uuid NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Line details
  line_number integer NOT NULL,
  item_id uuid REFERENCES public.items(id),
  description text NOT NULL,

  -- Quantity and pricing
  quantity numeric(15,4) NOT NULL DEFAULT 1.0000,
  unit_price numeric(15,2) NOT NULL,
  discount_percent numeric(5,2) DEFAULT 0.00,
  discount_amount numeric(15,2) DEFAULT 0.00,

  -- Amounts
  subtotal numeric(15,2) NOT NULL,
  tax_amount numeric(15,2) DEFAULT 0.00,
  total_amount numeric(15,2) NOT NULL,

  -- Account
  income_account_id uuid REFERENCES public.accounts(id),
  tax_template text,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT sales_invoice_lines_line_unique UNIQUE (sales_invoice_id, line_number)
);

-- Indexes
CREATE INDEX idx_sales_invoice_lines_invoice ON public.sales_invoice_lines(sales_invoice_id);
CREATE INDEX idx_sales_invoice_lines_item ON public.sales_invoice_lines(item_id);

-- Enable RLS
ALTER TABLE public.sales_invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales_invoice_lines for their org"
  ON public.sales_invoice_lines FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage sales_invoice_lines for their org"
  ON public.sales_invoice_lines FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Customer Payments Table
-- =====================================================
CREATE TABLE public.customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Payment details
  payment_number text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  payment_date date NOT NULL,

  -- Amount
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  exchange_rate numeric(10,6) DEFAULT 1.000000,

  -- Payment method
  payment_method text CHECK (payment_method IN ('cash', 'check', 'credit_card', 'bank_transfer', 'stripe', 'paypal', 'other')),
  reference_number text,

  -- Bank
  bank_account_id uuid REFERENCES public.bank_accounts(id),
  bank_transaction_id uuid REFERENCES public.bank_transactions(id),

  -- Accounting
  deposit_to_account_id uuid REFERENCES public.accounts(id),
  journal_entry_id uuid REFERENCES public.journal_entries(id),

  -- Status
  status text DEFAULT 'undeposited' CHECK (status IN ('undeposited', 'deposited', 'cleared', 'void')),
  is_posted boolean DEFAULT false,

  -- Integration
  payment_gateway text,
  payment_gateway_id text,
  payment_gateway_metadata jsonb,

  -- Metadata
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT customer_payments_number_unique UNIQUE (org_id, payment_number)
);

-- Indexes
CREATE INDEX idx_customer_payments_org ON public.customer_payments(org_id);
CREATE INDEX idx_customer_payments_customer ON public.customer_payments(customer_id, payment_date DESC);
CREATE INDEX idx_customer_payments_date ON public.customer_payments(org_id, payment_date DESC);
CREATE INDEX idx_customer_payments_status ON public.customer_payments(org_id, status);

-- Enable RLS
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customer_payments for their org"
  ON public.customer_payments FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage customer_payments for their org"
  ON public.customer_payments FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Payment Allocations Table
-- =====================================================
CREATE TABLE public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_payment_id uuid NOT NULL REFERENCES public.customer_payments(id) ON DELETE CASCADE,
  sales_invoice_id uuid NOT NULL REFERENCES public.sales_invoices(id) ON DELETE RESTRICT,

  -- Allocation
  allocated_amount numeric(15,2) NOT NULL,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_payment_allocations_payment ON public.payment_allocations(customer_payment_id);
CREATE INDEX idx_payment_allocations_invoice ON public.payment_allocations(sales_invoice_id);

-- Enable RLS
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment_allocations via payment"
  ON public.payment_allocations FOR SELECT
  USING (
    customer_payment_id IN (
      SELECT id FROM public.customer_payments cp
      WHERE cp.org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can manage payment_allocations via payment"
  ON public.payment_allocations FOR ALL
  USING (
    customer_payment_id IN (
      SELECT id FROM public.customer_payments cp
      WHERE cp.org_id IN (
        SELECT org_id FROM public.org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
      )
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(p_invoice_id uuid)
RETURNS void AS $$
DECLARE
  v_subtotal numeric(15,2);
  v_tax_total numeric(15,2);
  v_total numeric(15,2);
BEGIN
  SELECT
    COALESCE(SUM(subtotal), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(total_amount), 0)
  INTO v_subtotal, v_tax_total, v_total
  FROM public.sales_invoice_lines
  WHERE sales_invoice_id = p_invoice_id;

  UPDATE public.sales_invoices
  SET
    subtotal = v_subtotal,
    tax_total = v_tax_total,
    total_amount = v_total,
    outstanding_amount = v_total - COALESCE(paid_amount, 0),
    updated_at = now()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_allocated numeric(15,2);
  v_invoice_total numeric(15,2);
  v_new_status text;
BEGIN
  -- Calculate total allocated to this invoice
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM public.payment_allocations
  WHERE sales_invoice_id = NEW.sales_invoice_id;

  -- Get invoice total
  SELECT total_amount INTO v_invoice_total
  FROM public.sales_invoices
  WHERE id = NEW.sales_invoice_id;

  -- Determine status
  IF v_total_allocated >= v_invoice_total THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > 0 THEN
    v_new_status := 'partial';
  ELSIF (SELECT due_date FROM public.sales_invoices WHERE id = NEW.sales_invoice_id) < CURRENT_DATE THEN
    v_new_status := 'overdue';
  ELSE
    v_new_status := 'sent';
  END IF;

  -- Update invoice
  UPDATE public.sales_invoices
  SET
    paid_amount = v_total_allocated,
    outstanding_amount = v_invoice_total - v_total_allocated,
    status = v_new_status,
    updated_at = now()
  WHERE id = NEW.sales_invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice status
CREATE TRIGGER trigger_update_invoice_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- =====================================================
-- Triggers
-- =====================================================

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_invoices_updated_at
  BEFORE UPDATE ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_payments_updated_at
  BEFORE UPDATE ON public.customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.customers IS 'Customer master data with credit limits and payment terms';
COMMENT ON TABLE public.items IS 'Items (products and services) for sales and purchases';
COMMENT ON TABLE public.sales_invoices IS 'Sales invoices with dunning and payment link support';
COMMENT ON TABLE public.sales_invoice_lines IS 'Line items for sales invoices';
COMMENT ON TABLE public.customer_payments IS 'Customer payment receipts with gateway integration';
COMMENT ON TABLE public.payment_allocations IS 'Allocation of payments to invoices';
