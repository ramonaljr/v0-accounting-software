/**
 * Agent Feedback System
 * Stores user feedback on AI agent actions for continuous learning
 */

-- Agent feedback table
CREATE TABLE IF NOT EXISTS agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Agent action reference
  agent_run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  agent_action_id UUID REFERENCES agent_actions(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL, -- 'categorization', 'reconciliation', 'insight', etc.

  -- Feedback type
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'correction', 'comment')),

  -- Feedback data
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating (optional)
  was_helpful BOOLEAN, -- Simple yes/no

  -- Correction data (for 'correction' type)
  original_suggestion JSONB, -- What the AI suggested
  user_correction JSONB, -- What the user corrected it to
  correction_reason TEXT, -- Why the user corrected it

  -- Comment data (for 'comment' type)
  comment TEXT,

  -- Entity reference
  entity_type VARCHAR(50), -- 'transaction', 'journal_entry', 'reconciliation', etc.
  entity_id UUID,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_agent_feedback_org_id ON agent_feedback(org_id);
CREATE INDEX idx_agent_feedback_user_id ON agent_feedback(user_id);
CREATE INDEX idx_agent_feedback_agent_run_id ON agent_feedback(agent_run_id);
CREATE INDEX idx_agent_feedback_agent_action_id ON agent_feedback(agent_action_id);
CREATE INDEX idx_agent_feedback_agent_type ON agent_feedback(agent_type);
CREATE INDEX idx_agent_feedback_feedback_type ON agent_feedback(feedback_type);
CREATE INDEX idx_agent_feedback_entity ON agent_feedback(entity_type, entity_id);
CREATE INDEX idx_agent_feedback_created_at ON agent_feedback(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view feedback for their org
CREATE POLICY "Users can view org feedback"
  ON agent_feedback
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert feedback for their org
CREATE POLICY "Users can insert org feedback"
  ON agent_feedback
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON agent_feedback
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete own feedback"
  ON agent_feedback
  FOR DELETE
  USING (user_id = auth.uid());

-- Feedback analytics view
CREATE OR REPLACE VIEW agent_feedback_analytics AS
SELECT
  org_id,
  agent_type,
  feedback_type,
  COUNT(*) as total_feedback,
  COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count,
  COUNT(*) FILTER (WHERE was_helpful = false) as not_helpful_count,
  AVG(rating) as avg_rating,
  COUNT(*) FILTER (WHERE feedback_type = 'correction') as corrections_count,
  COUNT(*) FILTER (WHERE feedback_type = 'thumbs_up') as thumbs_up_count,
  COUNT(*) FILTER (WHERE feedback_type = 'thumbs_down') as thumbs_down_count,
  MIN(created_at) as first_feedback_at,
  MAX(created_at) as latest_feedback_at
FROM agent_feedback
GROUP BY org_id, agent_type, feedback_type;

-- Grant access to view
GRANT SELECT ON agent_feedback_analytics TO authenticated;

-- Function to get feedback summary for an agent run
CREATE OR REPLACE FUNCTION get_agent_run_feedback_summary(p_agent_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'thumbs_up', COUNT(*) FILTER (WHERE feedback_type = 'thumbs_up'),
    'thumbs_down', COUNT(*) FILTER (WHERE feedback_type = 'thumbs_down'),
    'corrections', COUNT(*) FILTER (WHERE feedback_type = 'correction'),
    'comments', COUNT(*) FILTER (WHERE feedback_type = 'comment'),
    'avg_rating', AVG(rating),
    'helpful_percentage',
      CASE
        WHEN COUNT(*) FILTER (WHERE was_helpful IS NOT NULL) > 0
        THEN (COUNT(*) FILTER (WHERE was_helpful = true)::FLOAT /
              COUNT(*) FILTER (WHERE was_helpful IS NOT NULL)::FLOAT * 100)
        ELSE NULL
      END
  )
  INTO v_summary
  FROM agent_feedback
  WHERE agent_run_id = p_agent_run_id;

  RETURN v_summary;
END;
$$;

-- Comments
COMMENT ON TABLE agent_feedback IS 'Stores user feedback on AI agent actions for continuous learning and improvement';
COMMENT ON COLUMN agent_feedback.feedback_type IS 'Type of feedback: thumbs_up, thumbs_down, correction, comment';
COMMENT ON COLUMN agent_feedback.original_suggestion IS 'AI''s original suggestion (for corrections)';
COMMENT ON COLUMN agent_feedback.user_correction IS 'User''s corrected value (for corrections)';
COMMENT ON COLUMN agent_feedback.correction_reason IS 'Reason for correction (for learning)';
COMMENT ON VIEW agent_feedback_analytics IS 'Aggregated feedback metrics by org and agent type';
COMMENT ON FUNCTION get_agent_run_feedback_summary IS 'Returns feedback summary for a specific agent run';
