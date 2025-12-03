-- =====================================================
-- Phase 2.5: Auto-Reconciliation Engine
-- =====================================================
-- Purpose: ML-powered reconciliation with rules, scoring, and feedback loop

-- =====================================================
-- Reconciliation Candidates Table
-- =====================================================
CREATE TABLE public.reconciliation_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Bank transaction
  bank_transaction_id uuid NOT NULL REFERENCES public.bank_transactions(id) ON DELETE CASCADE,

  -- Candidate ledger entry
  candidate_type text NOT NULL CHECK (candidate_type IN ('payment_entry', 'journal_entry', 'invoice', 'bill')),
  candidate_id uuid NOT NULL,

  -- Scoring
  score numeric(5,4) NOT NULL, -- 0.0000 to 1.0000
  rank integer NOT NULL, -- Rank within candidates for this bank transaction

  -- Match features (for explainability)
  amount_delta numeric(15,2),
  date_gap_days integer,
  description_similarity numeric(3,2),
  merchant_match boolean,
  historical_match boolean,
  currency_match boolean,

  -- Reasons (explainable AI)
  match_reasons jsonb, -- Array of reasons why this is a good match
  warning_flags jsonb, -- Array of potential issues

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'auto_applied')),
  applied_at timestamptz,
  applied_by uuid REFERENCES auth.users(id),

  -- Metadata
  model_version text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT reconciliation_candidates_unique UNIQUE (bank_transaction_id, candidate_type, candidate_id)
);

-- Indexes
CREATE INDEX idx_reconciliation_candidates_org ON public.reconciliation_candidates(org_id);
CREATE INDEX idx_reconciliation_candidates_bank_tx ON public.reconciliation_candidates(bank_transaction_id, rank);
CREATE INDEX idx_reconciliation_candidates_score ON public.reconciliation_candidates(bank_transaction_id, score DESC);
CREATE INDEX idx_reconciliation_candidates_status ON public.reconciliation_candidates(org_id, status);

-- Enable RLS
ALTER TABLE public.reconciliation_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliation_candidates for their org"
  ON public.reconciliation_candidates FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage reconciliation_candidates for their org"
  ON public.reconciliation_candidates FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Reconciliation Models Table
-- =====================================================
CREATE TABLE public.reconciliation_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Model details
  model_version text NOT NULL,
  model_type text NOT NULL CHECK (model_type IN ('rule_based', 'ml', 'hybrid')),
  model_config jsonb,

  -- Thresholds (calibrated per org)
  auto_apply_threshold numeric(5,4) DEFAULT 0.9900, -- 99% confidence for auto-apply
  suggest_threshold numeric(5,4) DEFAULT 0.7000, -- 70% confidence for suggestion
  max_candidates integer DEFAULT 3, -- Top-k candidates to show

  -- Performance metrics
  precision_auto numeric(5,4), -- Precision of auto-applied matches
  precision_suggest numeric(5,4), -- Precision of suggested matches
  recall_top3 numeric(5,4), -- Recall within top 3 candidates
  false_positive_rate numeric(5,4),

  -- Training
  training_samples integer DEFAULT 0,
  last_trained_at timestamptz,
  next_training_at timestamptz,

  -- Status
  is_active boolean DEFAULT true,
  is_production boolean DEFAULT false,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_reconciliation_models_org ON public.reconciliation_models(org_id, is_active);

-- Enable RLS
ALTER TABLE public.reconciliation_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliation_models for their org"
  ON public.reconciliation_models FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage reconciliation_models for their org"
  ON public.reconciliation_models FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- Reconciliation Feedback Table
-- =====================================================
CREATE TABLE public.reconciliation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Feedback source
  bank_transaction_id uuid NOT NULL REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES public.reconciliation_candidates(id) ON DELETE CASCADE,

  -- Feedback type
  feedback_type text NOT NULL CHECK (feedback_type IN ('accept', 'reject', 'correct', 'manual_match')),

  -- User action
  user_id uuid NOT NULL REFERENCES auth.users(id),
  user_selected_type text, -- What the user actually matched (if different)
  user_selected_id uuid, -- ID of what user actually matched

  -- Context
  suggested_score numeric(5,4),
  suggested_rank integer,
  time_to_decision interval, -- How long user took to decide

  -- Model improvement
  used_for_training boolean DEFAULT false,
  feedback_weight numeric(3,2) DEFAULT 1.00, -- Higher weight for expert users

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_reconciliation_feedback_org ON public.reconciliation_feedback(org_id);
CREATE INDEX idx_reconciliation_feedback_bank_tx ON public.reconciliation_feedback(bank_transaction_id);
CREATE INDEX idx_reconciliation_feedback_training ON public.reconciliation_feedback(org_id, used_for_training);
CREATE INDEX idx_reconciliation_feedback_created ON public.reconciliation_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.reconciliation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliation_feedback for their org"
  ON public.reconciliation_feedback FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert reconciliation_feedback for their org"
  ON public.reconciliation_feedback FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- =====================================================
-- Historical Mapping Memory Table
-- =====================================================
CREATE TABLE public.reconciliation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Pattern
  counterparty text, -- Merchant, customer, or supplier name
  description_pattern text,
  amount_pattern text, -- e.g., "recurring_100.00", "variable"
  transaction_type text,

  -- Learned mapping
  mapped_to_type text NOT NULL CHECK (mapped_to_type IN ('customer', 'supplier', 'account', 'category')),
  mapped_to_id uuid,
  mapped_to_name text,

  -- Statistics
  occurrence_count integer DEFAULT 1,
  confidence numeric(3,2) DEFAULT 1.00,
  last_seen_at timestamptz DEFAULT now(),
  first_seen_at timestamptz DEFAULT now(),

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT reconciliation_memory_unique UNIQUE (org_id, counterparty, description_pattern)
);

-- Indexes
CREATE INDEX idx_reconciliation_memory_org ON public.reconciliation_memory(org_id);
CREATE INDEX idx_reconciliation_memory_counterparty ON public.reconciliation_memory(org_id, counterparty);
CREATE INDEX idx_reconciliation_memory_confidence ON public.reconciliation_memory(org_id, confidence DESC);

-- Enable RLS
ALTER TABLE public.reconciliation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliation_memory for their org"
  ON public.reconciliation_memory FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage reconciliation_memory"
  ON public.reconciliation_memory FOR ALL
  USING (true);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate text similarity (Jaccard index)
CREATE OR REPLACE FUNCTION text_similarity(text1 text, text2 text)
RETURNS numeric AS $$
DECLARE
  tokens1 text[];
  tokens2 text[];
  intersection_count integer;
  union_count integer;
BEGIN
  -- Convert to lowercase and split into tokens
  tokens1 := regexp_split_to_array(lower(text1), '\s+');
  tokens2 := regexp_split_to_array(lower(text2), '\s+');

  -- Calculate intersection
  SELECT COUNT(DISTINCT token) INTO intersection_count
  FROM unnest(tokens1) AS token
  WHERE token = ANY(tokens2);

  -- Calculate union
  SELECT COUNT(DISTINCT token) INTO union_count
  FROM (
    SELECT unnest(tokens1) AS token
    UNION
    SELECT unnest(tokens2) AS token
  ) AS all_tokens;

  IF union_count = 0 THEN
    RETURN 0;
  END IF;

  RETURN intersection_count::numeric / union_count::numeric;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to record reconciliation feedback
CREATE OR REPLACE FUNCTION record_reconciliation_feedback(
  p_org_id uuid,
  p_bank_transaction_id uuid,
  p_candidate_id uuid,
  p_feedback_type text,
  p_user_id uuid,
  p_suggested_score numeric DEFAULT NULL,
  p_suggested_rank integer DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_feedback_id uuid;
BEGIN
  INSERT INTO public.reconciliation_feedback (
    org_id,
    bank_transaction_id,
    candidate_id,
    feedback_type,
    user_id,
    suggested_score,
    suggested_rank
  ) VALUES (
    p_org_id,
    p_bank_transaction_id,
    p_candidate_id,
    p_feedback_type,
    p_user_id,
    p_suggested_score,
    p_suggested_rank
  ) RETURNING id INTO v_feedback_id;

  RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update reconciliation memory
CREATE OR REPLACE FUNCTION update_reconciliation_memory(
  p_org_id uuid,
  p_counterparty text,
  p_description text,
  p_mapped_to_type text,
  p_mapped_to_id uuid,
  p_mapped_to_name text
) RETURNS void AS $$
BEGIN
  INSERT INTO public.reconciliation_memory (
    org_id,
    counterparty,
    description_pattern,
    mapped_to_type,
    mapped_to_id,
    mapped_to_name,
    occurrence_count,
    last_seen_at,
    first_seen_at
  ) VALUES (
    p_org_id,
    p_counterparty,
    p_description,
    p_mapped_to_type,
    p_mapped_to_id,
    p_mapped_to_name,
    1,
    now(),
    now()
  )
  ON CONFLICT (org_id, counterparty, description_pattern)
  DO UPDATE SET
    occurrence_count = public.reconciliation_memory.occurrence_count + 1,
    last_seen_at = now(),
    confidence = LEAST(1.00, public.reconciliation_memory.confidence + 0.05),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================

CREATE TRIGGER update_reconciliation_candidates_updated_at
  BEFORE UPDATE ON public.reconciliation_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliation_models_updated_at
  BEFORE UPDATE ON public.reconciliation_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliation_memory_updated_at
  BEFORE UPDATE ON public.reconciliation_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.reconciliation_candidates IS 'ML-scored candidate matches for bank transaction reconciliation';
COMMENT ON TABLE public.reconciliation_models IS 'Reconciliation models with org-specific thresholds and performance metrics';
COMMENT ON TABLE public.reconciliation_feedback IS 'User feedback on reconciliation suggestions for active learning';
COMMENT ON TABLE public.reconciliation_memory IS 'Historical mapping memory for pattern-based matching';
COMMENT ON FUNCTION text_similarity IS 'Calculate Jaccard similarity between two text strings';
COMMENT ON FUNCTION record_reconciliation_feedback IS 'Record user feedback for model improvement';
COMMENT ON FUNCTION update_reconciliation_memory IS 'Update historical mapping memory with new occurrence';
