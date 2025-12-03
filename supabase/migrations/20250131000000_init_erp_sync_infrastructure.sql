-- =====================================================
-- Phase 0: ERPNext Sync Infrastructure
-- =====================================================
-- Purpose: Establish mapping tables, sync events, and audit logging
-- for ERPNext integration per roadmap.md Phase 0

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS public.sync_events CASCADE;
DROP TABLE IF EXISTS public.erp_map CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- =====================================================
-- ERP Mapping Table
-- =====================================================
-- Maps our internal entities to ERPNext doctypes
CREATE TABLE public.erp_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Our entity information
  entity_type text NOT NULL, -- e.g., 'account', 'journal_entry', 'customer', 'invoice'
  entity_id uuid NOT NULL,   -- Reference to our internal ID

  -- ERPNext doctype information
  erp_doctype text NOT NULL, -- e.g., 'Account', 'Journal Entry', 'Customer', 'Sales Invoice'
  erp_name text NOT NULL,    -- ERPNext document name (primary key in ERPNext)

  -- Sync metadata
  last_synced_at timestamptz,
  content_hash text,         -- Hash of content to detect changes
  sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict')),
  error_message text,
  retry_count integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure unique mapping per org
  CONSTRAINT erp_map_unique UNIQUE (org_id, entity_type, entity_id),
  CONSTRAINT erp_map_erp_unique UNIQUE (org_id, erp_doctype, erp_name)
);

-- Indexes for performance
CREATE INDEX idx_erp_map_org_entity ON public.erp_map(org_id, entity_type, entity_id);
CREATE INDEX idx_erp_map_erp_doc ON public.erp_map(org_id, erp_doctype, erp_name);
CREATE INDEX idx_erp_map_status ON public.erp_map(sync_status) WHERE sync_status IN ('pending', 'error');

-- Enable RLS
ALTER TABLE public.erp_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view erp_map for their org"
  ON public.erp_map FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage erp_map for their org"
  ON public.erp_map FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- Sync Events Table
-- =====================================================
-- Tracks all sync operations for observability
CREATE TABLE public.sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Event details
  event_type text NOT NULL, -- 'push', 'pull', 'retry', 'error'
  entity_type text NOT NULL,
  entity_id uuid,
  erp_doctype text,
  erp_name text,

  -- Sync operation details
  direction text NOT NULL CHECK (direction IN ('push', 'pull')),
  status text NOT NULL CHECK (status IN ('started', 'success', 'error', 'skipped')),

  -- Error handling
  error_message text,
  error_stack text,
  retry_count integer DEFAULT 0,

  -- Performance metrics
  duration_ms integer,

  -- Payload (for debugging)
  request_payload jsonb,
  response_payload jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Indexes
CREATE INDEX idx_sync_events_org ON public.sync_events(org_id, created_at DESC);
CREATE INDEX idx_sync_events_entity ON public.sync_events(entity_type, entity_id);
CREATE INDEX idx_sync_events_status ON public.sync_events(status) WHERE status = 'error';
CREATE INDEX idx_sync_events_created ON public.sync_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view sync_events for their org"
  ON public.sync_events FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- Only system can insert sync events (via service role)
CREATE POLICY "Service role can insert sync_events"
  ON public.sync_events FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Audit Log Table (Tamper-Evident)
-- =====================================================
-- Immutable append-only audit log with cryptographic signatures
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Actor information
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'ai_agent', 'system')),
  actor_id uuid, -- user_id or agent_id
  actor_email text,

  -- Action details
  action text NOT NULL, -- e.g., 'journal_entry.post', 'reconciliation.approve', 'bank.connect'
  entity_type text NOT NULL,
  entity_id uuid,

  -- Change tracking
  old_values jsonb,
  new_values jsonb,
  diff jsonb, -- Minimal diff of changes

  -- Context
  ip_address inet,
  user_agent text,
  session_id text,

  -- Tamper detection
  content_hash text NOT NULL, -- Hash of (org_id || actor_id || action || entity_type || entity_id || timestamp)
  prev_hash text, -- Hash chain: reference to previous audit log entry hash

  -- Metadata
  metadata jsonb, -- Additional context

  -- Timestamp (immutable)
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_audit_log_org ON public.audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_type, actor_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON public.audit_log(action, created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Read-only for org members
CREATE POLICY "Users can view audit_log for their org"
  ON public.audit_log FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- Only system can insert audit logs (via service role)
CREATE POLICY "Service role can insert audit_log"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes to ensure immutability
CREATE POLICY "Audit logs are immutable"
  ON public.audit_log FOR UPDATE
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON public.audit_log FOR DELETE
  USING (false);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to compute content hash for audit log
CREATE OR REPLACE FUNCTION compute_audit_hash(
  p_org_id uuid,
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_timestamp timestamptz
) RETURNS text AS $$
BEGIN
  RETURN encode(
    digest(
      p_org_id::text || '|' ||
      COALESCE(p_actor_id::text, '') || '|' ||
      p_action || '|' ||
      p_entity_type || '|' ||
      COALESCE(p_entity_id::text, '') || '|' ||
      p_timestamp::text,
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to insert audit log with hash chain
CREATE OR REPLACE FUNCTION insert_audit_log(
  p_org_id uuid,
  p_actor_type text,
  p_actor_id uuid,
  p_actor_email text,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_diff jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
  v_timestamp timestamptz;
  v_content_hash text;
  v_prev_hash text;
BEGIN
  v_id := gen_random_uuid();
  v_timestamp := now();

  -- Compute content hash
  v_content_hash := compute_audit_hash(
    p_org_id,
    p_actor_id,
    p_action,
    p_entity_type,
    p_entity_id,
    v_timestamp
  );

  -- Get previous hash for chain
  SELECT content_hash INTO v_prev_hash
  FROM public.audit_log
  WHERE org_id = p_org_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Insert audit log entry
  INSERT INTO public.audit_log (
    id,
    org_id,
    actor_type,
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    diff,
    content_hash,
    prev_hash,
    metadata,
    created_at
  ) VALUES (
    v_id,
    p_org_id,
    p_actor_type,
    p_actor_id,
    p_actor_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_diff,
    v_content_hash,
    v_prev_hash,
    p_metadata,
    v_timestamp
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_erp_sync_status(
  p_org_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE public.erp_map
  SET
    sync_status = p_status,
    error_message = p_error_message,
    retry_count = CASE
      WHEN p_status = 'error' THEN retry_count + 1
      ELSE retry_count
    END,
    updated_at = now()
  WHERE org_id = p_org_id
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Updated At Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_erp_map_updated_at
  BEFORE UPDATE ON public.erp_map
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.erp_map IS 'Maps internal entities to ERPNext doctypes for bidirectional sync';
COMMENT ON TABLE public.sync_events IS 'Tracks all sync operations for observability and debugging';
COMMENT ON TABLE public.audit_log IS 'Immutable tamper-evident audit log with hash chain for financial compliance';
COMMENT ON FUNCTION insert_audit_log IS 'Inserts audit log entry with hash chain for tamper detection';
COMMENT ON FUNCTION compute_audit_hash IS 'Computes SHA-256 hash for audit log entry';
COMMENT ON FUNCTION update_erp_sync_status IS 'Updates sync status and retry count for entity mapping';
