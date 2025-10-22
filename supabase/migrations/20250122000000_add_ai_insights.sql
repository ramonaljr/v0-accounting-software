-- Migration: Add AI Insights Table
-- Created: 2025-01-22
-- Description: Store AI-generated insights, anomalies, and suggestions for dashboard display

-- =================================================================
-- ENUMS
-- =================================================================

-- AI Insight Severity
CREATE TYPE ai_insight_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

-- AI Insight Agent Type
CREATE TYPE ai_insight_agent_type AS ENUM (
  'anomaly',     -- Anomaly detection (InsightAI)
  'variance',    -- Variance analysis
  'forecast',    -- Predictive insights
  'suggestion'   -- Optimization suggestions
);

-- =================================================================
-- TABLES
-- =================================================================

-- AI Insights
-- Stores AI-generated insights for dashboard display
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_type ai_insight_agent_type NOT NULL,
  severity ai_insight_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  action_url TEXT, -- URL to drill down (e.g., /expenses?category=software)
  why_link TEXT, -- URL to explanation (e.g., /ai/explain/anomaly-1)

  -- Related entities
  entity_type TEXT, -- e.g., 'transaction', 'account', 'customer'
  entity_id UUID,

  -- Insight metadata
  data JSONB, -- Insight-specific data (e.g., variance amount, affected transactions)

  -- Status tracking
  viewed BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  insight_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Date this insight applies to
  expires_at TIMESTAMPTZ, -- When this insight is no longer relevant
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_ai_insights_org_id ON ai_insights(org_id);
CREATE INDEX idx_ai_insights_severity ON ai_insights(severity);
CREATE INDEX idx_ai_insights_agent_type ON ai_insights(agent_type);
CREATE INDEX idx_ai_insights_dismissed ON ai_insights(dismissed) WHERE NOT dismissed;
CREATE INDEX idx_ai_insights_date ON ai_insights(insight_date DESC);
CREATE INDEX idx_ai_insights_expires ON ai_insights(expires_at) WHERE expires_at IS NOT NULL;

-- Add RLS policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view ai insights"
  ON ai_insights FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert ai insights"
  ON ai_insights FOR INSERT
  WITH CHECK (true); -- System-level inserts only

CREATE POLICY "Org members can update ai insights"
  ON ai_insights FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete ai insights"
  ON ai_insights FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =================================================================
-- FUNCTIONS
-- =================================================================

-- Function to automatically expire old insights
CREATE OR REPLACE FUNCTION expire_old_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark insights as dismissed if they've expired
  UPDATE ai_insights
  SET dismissed = true,
      dismissed_at = NOW(),
      updated_at = NOW()
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND NOT dismissed;
END;
$$;

-- =================================================================
-- TRIGGERS
-- =================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON TABLE ai_insights IS 'AI-generated insights, anomalies, and suggestions displayed on the dashboard';
COMMENT ON COLUMN ai_insights.agent_type IS 'Which AI agent generated this insight';
COMMENT ON COLUMN ai_insights.severity IS 'Urgency level for this insight';
COMMENT ON COLUMN ai_insights.confidence IS 'AI confidence score (0.0 to 1.0)';
COMMENT ON COLUMN ai_insights.action_url IS 'Deep link to related page for action';
COMMENT ON COLUMN ai_insights.why_link IS 'Link to AI explanation of reasoning';
COMMENT ON COLUMN ai_insights.expires_at IS 'When this insight is no longer relevant';
