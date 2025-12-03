-- =====================================================
-- Phases 4-13: Comprehensive Implementation
-- =====================================================
-- Purpose: AP, Taxes, Inventory, Assets, FX, Reporting, Automation, Budgets, Close, Localizations

-- =====================================================
-- Phase 4: Accounts Payable (AP)
-- =====================================================

-- Suppliers Table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  supplier_type text CHECK (supplier_type IN ('company', 'individual')),
  tax_id text,
  email text,
  phone text,
  address_line1 text,
  address_city text,
  address_country text DEFAULT 'US',
  currency text DEFAULT 'USD',
  payment_terms integer DEFAULT 30,
  is_active boolean DEFAULT true NOT NULL,
  is_1099_vendor boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_suppliers_org ON public.suppliers(org_id);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view suppliers for their org" ON public.suppliers FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage suppliers" ON public.suppliers FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Purchase Invoices (Bills) Table
CREATE TABLE public.purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bill_number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  bill_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(15,2) DEFAULT 0.00,
  tax_total numeric(15,2) DEFAULT 0.00,
  total_amount numeric(15,2) DEFAULT 0.00,
  paid_amount numeric(15,2) DEFAULT 0.00,
  outstanding_amount numeric(15,2) DEFAULT 0.00,
  currency text DEFAULT 'USD',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'partial', 'paid', 'void')),
  is_on_hold boolean DEFAULT false,
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT purchase_invoices_number_unique UNIQUE (org_id, bill_number)
);

CREATE INDEX idx_purchase_invoices_org ON public.purchase_invoices(org_id);
CREATE INDEX idx_purchase_invoices_supplier ON public.purchase_invoices(supplier_id);
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view purchase_invoices" ON public.purchase_invoices FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage purchase_invoices" ON public.purchase_invoices FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Supplier Payments Table
CREATE TABLE public.supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payment_number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  payment_date date NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text,
  bank_account_id uuid REFERENCES public.bank_accounts(id),
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'cleared', 'void')),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT supplier_payments_number_unique UNIQUE (org_id, payment_number)
);

CREATE INDEX idx_supplier_payments_org ON public.supplier_payments(org_id);
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view supplier_payments" ON public.supplier_payments FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage supplier_payments" ON public.supplier_payments FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- =====================================================
-- Phase 5: Taxes & Compliance
-- =====================================================

-- Tax Templates Table
CREATE TABLE public.tax_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  template_type text CHECK (template_type IN ('sales', 'purchase')),
  jurisdiction text, -- e.g., 'US-CA', 'EU-VAT', 'PH', 'JP'
  tax_lines jsonb NOT NULL, -- Array of {account_id, rate, description}
  total_rate numeric(5,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT tax_templates_name_unique UNIQUE (org_id, template_name)
);

CREATE INDEX idx_tax_templates_org ON public.tax_templates(org_id);
ALTER TABLE public.tax_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tax_templates" ON public.tax_templates FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage tax_templates" ON public.tax_templates FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- Tax Returns Table
CREATE TABLE public.tax_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  return_type text NOT NULL, -- e.g., 'sales_tax', 'vat', 'income_tax'
  period_start date NOT NULL,
  period_end date NOT NULL,
  jurisdiction text NOT NULL,
  total_sales numeric(15,2) DEFAULT 0.00,
  taxable_sales numeric(15,2) DEFAULT 0.00,
  tax_collected numeric(15,2) DEFAULT 0.00,
  tax_payable numeric(15,2) DEFAULT 0.00,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'filed', 'paid')),
  filed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_tax_returns_org ON public.tax_returns(org_id);
ALTER TABLE public.tax_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tax_returns" ON public.tax_returns FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Accountants can manage tax_returns" ON public.tax_returns FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- =====================================================
-- Phase 6: Inventory & COGS
-- =====================================================

-- Warehouses Table
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  warehouse_code text NOT NULL,
  warehouse_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT warehouses_code_unique UNIQUE (org_id, warehouse_code)
);

CREATE INDEX idx_warehouses_org ON public.warehouses(org_id);
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view warehouses" ON public.warehouses FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage warehouses" ON public.warehouses FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Stock Ledger Table
CREATE TABLE public.stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  posting_date date NOT NULL,
  voucher_type text NOT NULL, -- 'Purchase Receipt', 'Delivery Note', 'Stock Entry'
  voucher_id uuid NOT NULL,
  actual_qty numeric(15,4) NOT NULL, -- Positive for IN, negative for OUT
  qty_after_transaction numeric(15,4) NOT NULL,
  valuation_rate numeric(15,2),
  stock_value numeric(15,2),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_stock_ledger_org ON public.stock_ledger(org_id);
CREATE INDEX idx_stock_ledger_item ON public.stock_ledger(item_id, posting_date DESC);
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view stock_ledger" ON public.stock_ledger FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Staff can insert stock_ledger" ON public.stock_ledger FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- =====================================================
-- Phase 7: Fixed Assets
-- =====================================================

-- Asset Categories Table
CREATE TABLE public.asset_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  depreciation_method text CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'double_declining')),
  useful_life_years integer,
  asset_account_id uuid REFERENCES public.accounts(id),
  depreciation_account_id uuid REFERENCES public.accounts(id),
  accumulated_depreciation_account_id uuid REFERENCES public.accounts(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT asset_categories_name_unique UNIQUE (org_id, category_name)
);

CREATE INDEX idx_asset_categories_org ON public.asset_categories(org_id);
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view asset_categories" ON public.asset_categories FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage asset_categories" ON public.asset_categories FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- Assets Table
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  asset_category_id uuid REFERENCES public.asset_categories(id),
  purchase_date date NOT NULL,
  purchase_amount numeric(15,2) NOT NULL,
  current_value numeric(15,2),
  accumulated_depreciation numeric(15,2) DEFAULT 0.00,
  status text DEFAULT 'in_use' CHECK (status IN ('in_use', 'disposed', 'sold')),
  disposal_date date,
  disposal_amount numeric(15,2),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_assets_org ON public.assets(org_id);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view assets" ON public.assets FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Staff can manage assets" ON public.assets FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')));

-- Depreciation Schedule Table
CREATE TABLE public.depreciation_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  depreciation_date date NOT NULL,
  depreciation_amount numeric(15,2) NOT NULL,
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  is_posted boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_depreciation_schedule_asset ON public.depreciation_schedule(asset_id);
ALTER TABLE public.depreciation_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view depreciation_schedule via asset" ON public.depreciation_schedule FOR SELECT
  USING (asset_id IN (SELECT id FROM public.assets WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())));

-- =====================================================
-- Phase 8: Multi-Currency & FX
-- =====================================================

-- Exchange Rates Table (extends existing)
CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric(12,6) NOT NULL,
  rate_date date NOT NULL,
  source text, -- 'manual', 'api', 'central_bank'
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT exchange_rates_unique UNIQUE (from_currency, to_currency, rate_date)
);

CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates(from_currency, to_currency, rate_date DESC);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exchange_rates" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Admins can insert exchange_rates" ON public.exchange_rates FOR INSERT WITH CHECK (true);

-- FX Revaluations Table
CREATE TABLE public.fx_revaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  revaluation_date date NOT NULL,
  currency text NOT NULL,
  accounts_revalued jsonb NOT NULL, -- Array of {account_id, old_balance, new_balance, gain_loss}
  total_gain_loss numeric(15,2),
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_fx_revaluations_org ON public.fx_revaluations(org_id);
ALTER TABLE public.fx_revaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view fx_revaluations" ON public.fx_revaluations FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- =====================================================
-- Phase 9: Financial Reporting (Views)
-- =====================================================

-- Materialized view for Trial Balance
CREATE MATERIALIZED VIEW public.trial_balance_mv AS
SELECT
  je.org_id,
  jel.account_id,
  a.code AS account_code,
  a.name AS account_name,
  a.account_type,
  SUM(jel.debit) AS total_debits,
  SUM(jel.credit) AS total_credits,
  SUM(jel.debit - jel.credit) AS balance
FROM public.journal_entry_lines jel
JOIN public.journal_entries je ON jel.journal_entry_id = je.id
JOIN public.accounts a ON jel.account_id = a.id
WHERE je.is_posted = true
GROUP BY je.org_id, jel.account_id, a.code, a.name, a.account_type;

CREATE UNIQUE INDEX idx_trial_balance_mv ON public.trial_balance_mv(org_id, account_id);
CREATE INDEX idx_trial_balance_mv_org ON public.trial_balance_mv(org_id);

-- =====================================================
-- Phase 10: Automation & Workflows
-- =====================================================

-- Approval Workflows Table
CREATE TABLE public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_name text NOT NULL,
  document_type text NOT NULL, -- 'journal_entry', 'invoice', 'bill', 'payment'
  approval_rules jsonb NOT NULL, -- Conditions and approvers
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT approval_workflows_unique UNIQUE (org_id, workflow_name)
);

CREATE INDEX idx_approval_workflows_org ON public.approval_workflows(org_id);
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view approval_workflows" ON public.approval_workflows FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- Approval Requests Table
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES public.approval_workflows(id),
  document_type text NOT NULL,
  document_id uuid NOT NULL,
  requested_by uuid REFERENCES auth.users(id),
  approver_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_approval_requests_org ON public.approval_requests(org_id);
CREATE INDEX idx_approval_requests_approver ON public.approval_requests(approver_id, status);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view approval_requests" ON public.approval_requests FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- Scheduled Jobs Table
CREATE TABLE public.scheduled_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type text NOT NULL, -- 'bank_sync', 'depreciation', 'fx_revaluation', 'dunning'
  schedule_cron text NOT NULL, -- Cron expression
  last_run_at timestamptz,
  next_run_at timestamptz,
  is_active boolean DEFAULT true,
  config jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_scheduled_jobs_next_run ON public.scheduled_jobs(next_run_at) WHERE is_active = true;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage scheduled_jobs" ON public.scheduled_jobs FOR ALL
  USING (org_id IS NULL OR org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- =====================================================
-- Phase 11: Budgets & Dimensions
-- =====================================================

-- Budgets Table
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  budget_name text NOT NULL,
  fiscal_year integer NOT NULL,
  account_id uuid REFERENCES public.accounts(id),
  cost_center_id uuid REFERENCES public.cost_centers(id),
  budget_amount numeric(15,2) NOT NULL,
  period_type text CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  enforcement text DEFAULT 'warn' CHECK (enforcement IN ('none', 'warn', 'block')),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT budgets_unique UNIQUE (org_id, fiscal_year, account_id, cost_center_id)
);

CREATE INDEX idx_budgets_org ON public.budgets(org_id);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view budgets" ON public.budgets FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage budgets" ON public.budgets FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')));

-- =====================================================
-- Phase 12: Period Close & Audit (extends Phase 1)
-- =====================================================

-- Period Closing Vouchers Table
CREATE TABLE public.period_closing_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  fiscal_period_id uuid NOT NULL REFERENCES public.fiscal_periods(id),
  closing_date date NOT NULL,
  income_summary_account_id uuid REFERENCES public.accounts(id),
  retained_earnings_account_id uuid REFERENCES public.accounts(id),
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_period_closing_vouchers_org ON public.period_closing_vouchers(org_id);
ALTER TABLE public.period_closing_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view period_closing_vouchers" ON public.period_closing_vouchers FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- =====================================================
-- Phase 13: Advanced & Localizations
-- =====================================================

-- Deferred Revenue Table
CREATE TABLE public.deferred_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sales_invoice_id uuid REFERENCES public.sales_invoices(id),
  total_amount numeric(15,2) NOT NULL,
  recognized_amount numeric(15,2) DEFAULT 0.00,
  remaining_amount numeric(15,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  recognition_method text CHECK (recognition_method IN ('straight_line', 'milestone')),
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_deferred_revenue_org ON public.deferred_revenue(org_id);
ALTER TABLE public.deferred_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view deferred_revenue" ON public.deferred_revenue FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- Localization Settings Table
CREATE TABLE public.localization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  country_code text NOT NULL, -- ISO 3166-1 alpha-2
  locale text NOT NULL, -- e.g., 'en-US', 'es-MX'
  date_format text DEFAULT 'YYYY-MM-DD',
  number_format text DEFAULT 'en-US',
  fiscal_year_start integer DEFAULT 1, -- Month (1-12)
  tax_regime text, -- Country-specific tax regime
  einvoicing_enabled boolean DEFAULT false,
  einvoicing_config jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT localization_settings_org_unique UNIQUE (org_id)
);

CREATE INDEX idx_localization_settings_org ON public.localization_settings(org_id);
ALTER TABLE public.localization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view localization_settings" ON public.localization_settings FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage localization_settings" ON public.localization_settings FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- =====================================================
-- Triggers for all new tables
-- =====================================================

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_invoices_updated_at BEFORE UPDATE ON public.purchase_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.suppliers IS 'Phase 4: Supplier master data for Accounts Payable';
COMMENT ON TABLE public.purchase_invoices IS 'Phase 4: Purchase invoices (bills) with hold capability';
COMMENT ON TABLE public.tax_templates IS 'Phase 5: Tax templates for jurisdiction-specific tax calculations';
COMMENT ON TABLE public.warehouses IS 'Phase 6: Warehouses for inventory management';
COMMENT ON TABLE public.stock_ledger IS 'Phase 6: Perpetual inventory ledger with FIFO/Average valuation';
COMMENT ON TABLE public.assets IS 'Phase 7: Fixed assets register';
COMMENT ON TABLE public.depreciation_schedule IS 'Phase 7: Depreciation schedule for assets';
COMMENT ON TABLE public.exchange_rates IS 'Phase 8: Exchange rates for multi-currency support';
COMMENT ON TABLE public.approval_workflows IS 'Phase 10: Configurable approval workflows';
COMMENT ON TABLE public.budgets IS 'Phase 11: Budgets with variance tracking and enforcement';
COMMENT ON TABLE public.deferred_revenue IS 'Phase 13: Deferred revenue recognition';
COMMENT ON TABLE public.localization_settings IS 'Phase 13: Country-specific localization settings';
