-- =====================================================
-- Phase 5: User Features - Reporting & Dashboard
-- Migration: 20250105000001_init_phase5_reporting.sql
-- =====================================================

-- =====================================================
-- 1. REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_scheduled BOOLEAN NOT NULL DEFAULT false,
  schedule_cron TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reports_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT reports_name_check CHECK (name != ''),
  CONSTRAINT reports_type_check CHECK (report_type IN ('pl', 'bs', 'cf', 'trial_balance', 'ar_aging', 'ap_aging', 'custom'))
);

-- Indexes
CREATE INDEX idx_reports_org_id ON reports(org_id);
CREATE INDEX idx_reports_type ON reports(org_id, report_type);
CREATE INDEX idx_reports_scheduled ON reports(org_id, is_scheduled) WHERE is_scheduled = true;

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read reports"
  ON reports FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can manage reports"
  ON reports FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- 2. REPORT RUNS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start DATE,
  period_end DATE,
  data JSONB,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT report_runs_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT report_runs_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

-- Indexes
CREATE INDEX idx_report_runs_report_id ON report_runs(report_id);
CREATE INDEX idx_report_runs_org_id ON report_runs(org_id);
CREATE INDEX idx_report_runs_date ON report_runs(run_date DESC);
CREATE INDEX idx_report_runs_status ON report_runs(org_id, status);

-- RLS Policies
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read report runs"
  ON report_runs FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- 3. DASHBOARD WIDGETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 4}',
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT dashboard_widgets_org_id_check CHECK (org_id IS NOT NULL),
  CONSTRAINT dashboard_widgets_type_check CHECK (widget_type IN (
    'revenue_chart', 'expense_chart', 'cash_flow_chart', 'bank_accounts',
    'ar_summary', 'ap_summary', 'recent_transactions', 'alerts',
    'profit_loss', 'balance_sheet', 'key_metrics', 'tax_summary'
  ))
);

-- Indexes
CREATE INDEX idx_dashboard_widgets_org_id ON dashboard_widgets(org_id);
CREATE INDEX idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(org_id, widget_type);

-- RLS Policies
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their dashboard widgets"
  ON dashboard_widgets FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can manage their dashboard widgets"
  ON dashboard_widgets FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- =====================================================
-- 4. REPORTING VIEWS
-- =====================================================

-- Trial Balance View
CREATE OR REPLACE VIEW trial_balance AS
SELECT
  je.org_id,
  a.id AS account_id,
  a.code AS account_code,
  a.name AS account_name,
  a.type AS account_type,
  SUM(CASE WHEN jel.type = 'debit' THEN jel.amount ELSE 0 END) AS total_debits,
  SUM(CASE WHEN jel.type = 'credit' THEN jel.amount ELSE 0 END) AS total_credits,
  SUM(CASE WHEN jel.type = 'debit' THEN jel.amount ELSE -jel.amount END) AS balance
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
JOIN accounts a ON jel.account_id = a.id
WHERE je.status = 'posted'
GROUP BY je.org_id, a.id, a.code, a.name, a.type;

-- AR Aging View (simplified)
CREATE OR REPLACE VIEW ar_aging AS
SELECT
  i.org_id,
  i.customer_id,
  c.name AS customer_name,
  COUNT(i.id) AS invoice_count,
  SUM(i.amount_due) AS total_outstanding,
  SUM(CASE WHEN CURRENT_DATE <= i.due_date THEN i.amount_due ELSE 0 END) AS current,
  SUM(CASE WHEN CURRENT_DATE > i.due_date AND CURRENT_DATE <= i.due_date + 30 THEN i.amount_due ELSE 0 END) AS days_1_30,
  SUM(CASE WHEN CURRENT_DATE > i.due_date + 30 AND CURRENT_DATE <= i.due_date + 60 THEN i.amount_due ELSE 0 END) AS days_31_60,
  SUM(CASE WHEN CURRENT_DATE > i.due_date + 60 AND CURRENT_DATE <= i.due_date + 90 THEN i.amount_due ELSE 0 END) AS days_61_90,
  SUM(CASE WHEN CURRENT_DATE > i.due_date + 90 THEN i.amount_due ELSE 0 END) AS days_90_plus
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.amount_due > 0
  AND i.status NOT IN ('cancelled', 'paid')
GROUP BY i.org_id, i.customer_id, c.name;

-- =====================================================
-- 5. REPORT GENERATION FUNCTIONS
-- =====================================================

-- Generate Profit & Loss Report
CREATE OR REPLACE FUNCTION generate_profit_loss(
  p_org_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  account_type TEXT,
  account_code TEXT,
  account_name TEXT,
  amount NUMERIC(15,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.type AS account_type,
    a.code AS account_code,
    a.name AS account_name,
    SUM(CASE
      WHEN a.type IN ('revenue', 'other_income') THEN
        CASE WHEN jel.type = 'credit' THEN jel.amount ELSE -jel.amount END
      WHEN a.type IN ('expense', 'cost_of_goods_sold', 'other_expense') THEN
        CASE WHEN jel.type = 'debit' THEN jel.amount ELSE -jel.amount END
      ELSE 0
    END) AS amount
  FROM journal_entries je
  JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
  JOIN accounts a ON jel.account_id = a.id
  WHERE je.org_id = p_org_id
    AND je.status = 'posted'
    AND je.entry_date >= p_start_date
    AND je.entry_date <= p_end_date
    AND a.type IN ('revenue', 'other_income', 'expense', 'cost_of_goods_sold', 'other_expense')
  GROUP BY a.type, a.code, a.name
  ORDER BY a.type, a.code;
END;
$$;

-- Generate Balance Sheet Report
CREATE OR REPLACE FUNCTION generate_balance_sheet(
  p_org_id UUID,
  p_as_of_date DATE
)
RETURNS TABLE (
  account_type TEXT,
  account_code TEXT,
  account_name TEXT,
  balance NUMERIC(15,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.type AS account_type,
    a.code AS account_code,
    a.name AS account_name,
    SUM(CASE
      WHEN a.type IN ('asset', 'expense') THEN
        CASE WHEN jel.type = 'debit' THEN jel.amount ELSE -jel.amount END
      WHEN a.type IN ('liability', 'equity', 'revenue') THEN
        CASE WHEN jel.type = 'credit' THEN jel.amount ELSE -jel.amount END
      ELSE 0
    END) AS balance
  FROM journal_entries je
  JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
  JOIN accounts a ON jel.account_id = a.id
  WHERE je.org_id = p_org_id
    AND je.status = 'posted'
    AND je.entry_date <= p_as_of_date
    AND a.type IN ('asset', 'liability', 'equity')
  GROUP BY a.type, a.code, a.name
  ORDER BY a.type, a.code;
END;
$$;

-- =====================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON TABLE reports IS 'Saved report configurations and schedules';
COMMENT ON TABLE report_runs IS 'Historical report execution results';
COMMENT ON TABLE dashboard_widgets IS 'User dashboard widget configurations';
COMMENT ON VIEW trial_balance IS 'Trial balance view showing debit/credit totals per account';
COMMENT ON VIEW ar_aging IS 'Accounts receivable aging by customer';
