-- Migration: Initialize AI Agents Infrastructure
-- Created: 2025-10-21
-- Description: Create tables and functions for AI agent tracking, execution, and feedback

-- =================================================================
-- ENUMS
-- =================================================================

-- Agent run status
CREATE TYPE agent_run_status AS ENUM (
  'running',
  'completed',
  'failed',
  'cancelled',
  'awaiting_approval'
);

-- Agent action type
CREATE TYPE agent_action_type AS ENUM (
  'categorize',
  'reconcile',
  'post_entry',
  'match_transaction',
  'suggest_rule',
  'explain',
  'detect_anomaly',
  'generate_report'
);

-- Feedback type
CREATE TYPE agent_feedback_type AS ENUM (
  'approve',
  'reject',
  'correct'
);

-- =================================================================
-- TABLES
-- =================================================================

-- Agent Runs
-- Tracks execution of AI agents
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL, -- e.g., 'LedgerBot', 'ReconAI'
  trigger TEXT NOT NULL, -- e.g., 'manual', 'scheduled', 'event'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status agent_run_status NOT NULL DEFAULT 'running',
  input JSONB, -- Agent input parameters
  output JSONB, -- Agent output results
  error TEXT, -- Error message if failed
  metadata JSONB, -- Model version, tokens used, cost, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_agent_runs_org_id ON agent_runs(org_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_agent_name ON agent_runs(agent_name);
CREATE INDEX idx_agent_runs_started_at ON agent_runs(started_at DESC);

-- Add RLS policies
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view agent runs"
  ON agent_runs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert agent runs"
  ON agent_runs FOR INSERT
  WITH CHECK (true); -- System-level inserts only

CREATE POLICY "System can update agent runs"
  ON agent_runs FOR UPDATE
  USING (true); -- System-level updates only

-- Agent Actions
-- Tracks individual actions taken by agents
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_type agent_action_type NOT NULL,
  entity_type TEXT NOT NULL, -- e.g., 'transaction', 'journal_entry'
  entity_id UUID, -- ID of the affected entity
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT, -- AI explanation for this action
  data JSONB, -- Action-specific data
  approved BOOLEAN DEFAULT NULL, -- NULL = pending, true/false = approved/rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_agent_actions_run_id ON agent_actions(agent_run_id);
CREATE INDEX idx_agent_actions_org_id ON agent_actions(org_id);
CREATE INDEX idx_agent_actions_entity ON agent_actions(entity_type, entity_id);
CREATE INDEX idx_agent_actions_approved ON agent_actions(approved) WHERE approved IS NULL;

-- Add RLS policies
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view agent actions"
  ON agent_actions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert agent actions"
  ON agent_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org admins can update agent actions"
  ON agent_actions FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

-- Agent Feedback
-- Tracks user feedback on agent actions (for learning)
CREATE TABLE agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_id UUID REFERENCES agent_actions(id) ON DELETE CASCADE,
  feedback_type agent_feedback_type NOT NULL,
  correction_data JSONB, -- If correcting, what should it have been?
  notes TEXT, -- User's explanation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_agent_feedback_run_id ON agent_feedback(agent_run_id);
CREATE INDEX idx_agent_feedback_org_id ON agent_feedback(org_id);
CREATE INDEX idx_agent_feedback_user_id ON agent_feedback(user_id);
CREATE INDEX idx_agent_feedback_action_id ON agent_feedback(action_id);

-- Add RLS policies
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view feedback"
  ON agent_feedback FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert feedback"
  ON agent_feedback FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- =================================================================
-- FUNCTIONS
-- =================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER agent_runs_updated_at
  BEFORE UPDATE ON agent_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_updated_at();

CREATE TRIGGER agent_actions_updated_at
  BEFORE UPDATE ON agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_updated_at();

-- Approve agent action
CREATE OR REPLACE FUNCTION approve_agent_action(
  p_action_id UUID,
  p_user_id UUID,
  p_approved BOOLEAN,
  p_feedback_type agent_feedback_type DEFAULT 'approve',
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
  v_run_id UUID;
BEGIN
  -- Get org_id and run_id
  SELECT org_id, agent_run_id INTO v_org_id, v_run_id
  FROM agent_actions
  WHERE id = p_action_id;

  -- Update action
  UPDATE agent_actions
  SET
    approved = p_approved,
    approved_by = p_user_id,
    approved_at = NOW()
  WHERE id = p_action_id;

  -- Insert feedback
  INSERT INTO agent_feedback (
    agent_run_id,
    org_id,
    user_id,
    action_id,
    feedback_type,
    notes
  ) VALUES (
    v_run_id,
    v_org_id,
    p_user_id,
    p_action_id,
    p_feedback_type,
    p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get agent metrics for an organization
CREATE OR REPLACE FUNCTION get_agent_metrics(
  p_org_id UUID,
  p_agent_name TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  agent_name TEXT,
  total_runs BIGINT,
  successful_runs BIGINT,
  failed_runs BIGINT,
  avg_confidence NUMERIC,
  approval_rate NUMERIC,
  auto_post_rate NUMERIC,
  tokens_used BIGINT,
  cost_incurred NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.agent_name,
    COUNT(*)::BIGINT AS total_runs,
    COUNT(*) FILTER (WHERE ar.status = 'completed')::BIGINT AS successful_runs,
    COUNT(*) FILTER (WHERE ar.status = 'failed')::BIGINT AS failed_runs,
    ROUND(AVG((ar.metadata->>'confidence')::NUMERIC), 2) AS avg_confidence,
    ROUND(
      COUNT(*) FILTER (WHERE aa.approved = true)::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE aa.approved IS NOT NULL)::NUMERIC, 0) * 100,
      2
    ) AS approval_rate,
    ROUND(
      COUNT(*) FILTER (WHERE aa.approved = true AND aa.confidence >= 0.90)::NUMERIC /
      NULLIF(COUNT(*)::NUMERIC, 0) * 100,
      2
    ) AS auto_post_rate,
    SUM((ar.metadata->>'tokensUsed')::BIGINT) AS tokens_used,
    ROUND(SUM((ar.metadata->>'cost')::NUMERIC), 4) AS cost_incurred
  FROM agent_runs ar
  LEFT JOIN agent_actions aa ON aa.agent_run_id = ar.id
  WHERE
    ar.org_id = p_org_id
    AND (p_agent_name IS NULL OR ar.agent_name = p_agent_name)
    AND ar.started_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY ar.agent_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON TABLE agent_runs IS 'Tracks execution of AI agents';
COMMENT ON TABLE agent_actions IS 'Individual actions taken by agents';
COMMENT ON TABLE agent_feedback IS 'User feedback on agent actions for learning';
COMMENT ON FUNCTION approve_agent_action IS 'Approve or reject an agent action with feedback';
COMMENT ON FUNCTION get_agent_metrics IS 'Get performance metrics for AI agents';
