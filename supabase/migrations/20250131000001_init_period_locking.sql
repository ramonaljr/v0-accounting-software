-- =====================================================
-- Phase 1: Period Management and Locking
-- =====================================================
-- Purpose: Implement fiscal periods, closing, and locking per roadmap Phase 1

-- =====================================================
-- Fiscal Periods Table
-- =====================================================
CREATE TABLE public.fiscal_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Period details
  name text NOT NULL, -- e.g., "Q1 2025", "January 2025"
  start_date date NOT NULL,
  end_date date NOT NULL,
  fiscal_year integer NOT NULL, -- e.g., 2025
  period_type text NOT NULL CHECK (period_type IN ('month', 'quarter', 'year')),

  -- Status
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),

  -- Closing information
  closed_by uuid REFERENCES auth.users(id),
  closed_at timestamptz,
  closing_entry_id uuid, -- Reference to closing JE

  -- Lock enforcement
  locked_by uuid REFERENCES auth.users(id),
  locked_at timestamptz,
  lock_reason text,

  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure no overlapping periods
  CONSTRAINT fiscal_periods_unique UNIQUE (org_id, start_date, end_date),
  CONSTRAINT fiscal_periods_dates_valid CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX idx_fiscal_periods_org ON public.fiscal_periods(org_id);
CREATE INDEX idx_fiscal_periods_dates ON public.fiscal_periods(org_id, start_date, end_date);
CREATE INDEX idx_fiscal_periods_year ON public.fiscal_periods(org_id, fiscal_year);
CREATE INDEX idx_fiscal_periods_status ON public.fiscal_periods(org_id, status);

-- Enable RLS
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view fiscal_periods for their org"
  ON public.fiscal_periods FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can manage fiscal_periods for their org"
  ON public.fiscal_periods FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- Cost Centers Table
-- =====================================================
CREATE TABLE public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Cost center details
  code text NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.cost_centers(id) ON DELETE RESTRICT,

  -- Status
  is_active boolean DEFAULT true NOT NULL,
  is_group boolean DEFAULT false NOT NULL, -- Group cost centers are parents only

  -- Metadata
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT cost_centers_unique UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX idx_cost_centers_org ON public.cost_centers(org_id);
CREATE INDEX idx_cost_centers_code ON public.cost_centers(org_id, code);
CREATE INDEX idx_cost_centers_parent ON public.cost_centers(parent_id);

-- Enable RLS
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view cost_centers for their org"
  ON public.cost_centers FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can manage cost_centers for their org"
  ON public.cost_centers FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- =====================================================
-- Add cost_center_id to journal_entry_lines
-- =====================================================
ALTER TABLE public.journal_entry_lines
ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_cost_center
  ON public.journal_entry_lines(cost_center_id);

-- =====================================================
-- Add period_id to journal_entries
-- =====================================================
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.fiscal_periods(id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_period
  ON public.journal_entries(period_id);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get period for a date
CREATE OR REPLACE FUNCTION get_period_for_date(
  p_org_id uuid,
  p_date date
) RETURNS uuid AS $$
DECLARE
  v_period_id uuid;
BEGIN
  SELECT id INTO v_period_id
  FROM public.fiscal_periods
  WHERE org_id = p_org_id
    AND p_date >= start_date
    AND p_date <= end_date
  LIMIT 1;

  RETURN v_period_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if period is locked
CREATE OR REPLACE FUNCTION is_period_locked(
  p_org_id uuid,
  p_date date
) RETURNS boolean AS $$
DECLARE
  v_is_locked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.fiscal_periods
    WHERE org_id = p_org_id
      AND p_date >= start_date
      AND p_date <= end_date
      AND status = 'locked'
  ) INTO v_is_locked;

  RETURN COALESCE(v_is_locked, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to prevent posting to locked periods
CREATE OR REPLACE FUNCTION check_period_lock_on_je()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when posting
  IF NEW.is_posted = true AND (OLD.is_posted IS NULL OR OLD.is_posted = false) THEN
    -- Check if the entry date falls in a locked period
    IF is_period_locked(NEW.org_id, NEW.entry_date) THEN
      RAISE EXCEPTION 'Cannot post journal entry: period for date % is locked', NEW.entry_date;
    END IF;
  END IF;

  -- Auto-assign period if not set
  IF NEW.period_id IS NULL THEN
    NEW.period_id := get_period_for_date(NEW.org_id, NEW.entry_date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check period lock on journal entries
DROP TRIGGER IF EXISTS trigger_check_period_lock_on_je ON public.journal_entries;
CREATE TRIGGER trigger_check_period_lock_on_je
  BEFORE INSERT OR UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_period_lock_on_je();

-- Function to close a period
CREATE OR REPLACE FUNCTION close_fiscal_period(
  p_period_id uuid,
  p_user_id uuid
) RETURNS void AS $$
DECLARE
  v_period record;
BEGIN
  -- Get period details
  SELECT * INTO v_period
  FROM public.fiscal_periods
  WHERE id = p_period_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Period not found';
  END IF;

  IF v_period.status != 'open' THEN
    RAISE EXCEPTION 'Period is already closed or locked';
  END IF;

  -- Update period status
  UPDATE public.fiscal_periods
  SET
    status = 'closed',
    closed_by = p_user_id,
    closed_at = now(),
    updated_at = now()
  WHERE id = p_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock a period
CREATE OR REPLACE FUNCTION lock_fiscal_period(
  p_period_id uuid,
  p_user_id uuid,
  p_reason text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_period record;
BEGIN
  -- Get period details
  SELECT * INTO v_period
  FROM public.fiscal_periods
  WHERE id = p_period_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Period not found';
  END IF;

  IF v_period.status = 'open' THEN
    RAISE EXCEPTION 'Period must be closed before locking';
  END IF;

  -- Update period status
  UPDATE public.fiscal_periods
  SET
    status = 'locked',
    locked_by = p_user_id,
    locked_at = now(),
    lock_reason = p_reason,
    updated_at = now()
  WHERE id = p_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock a period (admin only)
CREATE OR REPLACE FUNCTION unlock_fiscal_period(
  p_period_id uuid,
  p_user_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.fiscal_periods
  SET
    status = 'closed',
    locked_by = NULL,
    locked_at = NULL,
    lock_reason = NULL,
    updated_at = now()
  WHERE id = p_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reopen a period (admin only)
CREATE OR REPLACE FUNCTION reopen_fiscal_period(
  p_period_id uuid,
  p_user_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.fiscal_periods
  SET
    status = 'open',
    closed_by = NULL,
    closed_at = NULL,
    closing_entry_id = NULL,
    locked_by = NULL,
    locked_at = NULL,
    lock_reason = NULL,
    updated_at = now()
  WHERE id = p_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Updated At Triggers
-- =====================================================

CREATE TRIGGER update_fiscal_periods_updated_at
  BEFORE UPDATE ON public.fiscal_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.fiscal_periods IS 'Fiscal periods with opening, closing, and locking capabilities for period-end controls';
COMMENT ON TABLE public.cost_centers IS 'Cost centers for dimensional reporting and budgeting';
COMMENT ON FUNCTION get_period_for_date IS 'Get fiscal period ID for a given date';
COMMENT ON FUNCTION is_period_locked IS 'Check if a date falls within a locked period';
COMMENT ON FUNCTION close_fiscal_period IS 'Close a fiscal period (prevent further changes)';
COMMENT ON FUNCTION lock_fiscal_period IS 'Lock a fiscal period (absolute lock, requires unlock to change)';
COMMENT ON FUNCTION unlock_fiscal_period IS 'Unlock a locked fiscal period (admin only)';
COMMENT ON FUNCTION reopen_fiscal_period IS 'Reopen a closed period (admin only)';
