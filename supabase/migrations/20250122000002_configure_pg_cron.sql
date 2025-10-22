-- =====================================================
-- pg_cron Configuration for Automated Jobs
-- =====================================================
-- This migration sets up pg_cron scheduled jobs for:
-- 1. Daily FX rate updates (1 AM)
-- 2. Nightly anomaly detection (2 AM)
-- 3. Nightly AI categorization (3 AM)
-- 4. Daily bank feed sync (4 AM)
--
-- All times are in UTC. Adjust for your timezone.
-- =====================================================

-- Enable pg_cron extension (requires superuser)
-- Note: On Supabase, this is pre-enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (if needed)
GRANT USAGE ON SCHEMA cron TO postgres;

-- =====================================================
-- Job 1: Daily FX Rate Updates (1 AM UTC)
-- =====================================================
-- Calls the nightly-fx-rates Edge Function to fetch latest exchange rates
-- Frequency: Daily at 1:00 AM UTC
-- =====================================================

SELECT cron.schedule(
  'daily-fx-rate-update',           -- Job name
  '0 1 * * *',                      -- Cron expression: 1 AM daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/nightly-fx-rates',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW()
      )
    ) AS request_id;
  $$
);

-- =====================================================
-- Job 2: Nightly Anomaly Detection (2 AM UTC)
-- =====================================================
-- Calls the nightly-anomaly-detection Edge Function
-- Frequency: Daily at 2:00 AM UTC
-- Processes up to 500 transactions per org
-- =====================================================

SELECT cron.schedule(
  'nightly-anomaly-detection',      -- Job name
  '0 2 * * *',                      -- Cron expression: 2 AM daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/nightly-anomaly-detection',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW(),
        'maxTransactionsPerOrg', 500
      )
    ) AS request_id;
  $$
);

-- =====================================================
-- Job 3: Nightly AI Categorization (3 AM UTC)
-- =====================================================
-- Calls the nightly-categorization Edge Function
-- Frequency: Daily at 3:00 AM UTC
-- Auto-categorizes uncategorized transactions
-- =====================================================

SELECT cron.schedule(
  'nightly-ai-categorization',      -- Job name
  '0 3 * * *',                      -- Cron expression: 3 AM daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/nightly-categorization',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW(),
        'batchSize', 100
      )
    ) AS request_id;
  $$
);

-- =====================================================
-- Job 4: Daily Bank Feed Sync (4 AM UTC)
-- =====================================================
-- Calls the daily-bank-sync Edge Function to fetch new transactions
-- Frequency: Daily at 4:00 AM UTC
-- Syncs all connected bank accounts
-- =====================================================

SELECT cron.schedule(
  'daily-bank-feed-sync',           -- Job name
  '0 4 * * *',                      -- Cron expression: 4 AM daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/daily-bank-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW(),
        'syncDays', 7
      )
    ) AS request_id;
  $$
);

-- =====================================================
-- Job 5: Weekly Reconciliation (Sunday 5 AM UTC)
-- =====================================================
-- Runs weekly reconciliation for all accounts
-- Frequency: Weekly on Sunday at 5:00 AM UTC
-- =====================================================

SELECT cron.schedule(
  'weekly-reconciliation',          -- Job name
  '0 5 * * 0',                      -- Cron expression: 5 AM on Sundays
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/weekly-reconciliation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'timestamp', NOW()
      )
    ) AS request_id;
  $$
);

-- =====================================================
-- Job Monitoring Table
-- =====================================================
-- Create a table to track job execution history
-- =====================================================

CREATE TABLE IF NOT EXISTS cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('running', 'success', 'failed')),
  orgs_processed INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  result_summary JSONB,
  error_details TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying job history
CREATE INDEX idx_cron_job_logs_job_name ON cron_job_logs(job_name);
CREATE INDEX idx_cron_job_logs_started_at ON cron_job_logs(started_at DESC);
CREATE INDEX idx_cron_job_logs_status ON cron_job_logs(status);

-- =====================================================
-- Helper Function: Log Job Execution
-- =====================================================

CREATE OR REPLACE FUNCTION log_cron_job_execution(
  p_job_name VARCHAR(100),
  p_status VARCHAR(20),
  p_orgs_processed INTEGER DEFAULT 0,
  p_items_processed INTEGER DEFAULT 0,
  p_errors_count INTEGER DEFAULT 0,
  p_result_summary JSONB DEFAULT NULL,
  p_error_details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO cron_job_logs (
    job_name,
    status,
    orgs_processed,
    items_processed,
    errors_count,
    result_summary,
    error_details,
    completed_at,
    execution_time_ms
  ) VALUES (
    p_job_name,
    p_status,
    p_orgs_processed,
    p_items_processed,
    p_errors_count,
    p_result_summary,
    p_error_details,
    NOW(),
    EXTRACT(EPOCH FROM (NOW() - (SELECT started_at FROM cron_job_logs WHERE job_name = p_job_name ORDER BY started_at DESC LIMIT 1))) * 1000
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =====================================================
-- View: Recent Job Executions
-- =====================================================

CREATE OR REPLACE VIEW recent_cron_jobs AS
SELECT
  job_name,
  started_at,
  completed_at,
  status,
  orgs_processed,
  items_processed,
  errors_count,
  execution_time_ms,
  CASE
    WHEN status = 'success' AND errors_count = 0 THEN 'healthy'
    WHEN status = 'success' AND errors_count > 0 THEN 'warning'
    WHEN status = 'failed' THEN 'critical'
    ELSE 'unknown'
  END AS health_status,
  result_summary
FROM cron_job_logs
WHERE started_at > NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- =====================================================
-- Configuration Settings Table
-- =====================================================
-- Store pg_cron configuration in database for easy management
-- =====================================================

CREATE TABLE IF NOT EXISTS cron_job_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  function_url TEXT NOT NULL,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 300,
  timeout_seconds INTEGER DEFAULT 600,
  config_params JSONB DEFAULT '{}',
  last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified_by UUID REFERENCES auth.users(id)
);

-- Insert default configurations
INSERT INTO cron_job_config (job_name, cron_expression, function_url, config_params) VALUES
  ('daily-fx-rate-update', '0 1 * * *', '/functions/v1/nightly-fx-rates', '{"providers": ["openexchangerates.org"]}'),
  ('nightly-anomaly-detection', '0 2 * * *', '/functions/v1/nightly-anomaly-detection', '{"maxTransactionsPerOrg": 500}'),
  ('nightly-ai-categorization', '0 3 * * *', '/functions/v1/nightly-categorization', '{"batchSize": 100, "confidenceThreshold": 0.90}'),
  ('daily-bank-feed-sync', '0 4 * * *', '/functions/v1/daily-bank-sync', '{"syncDays": 7}'),
  ('weekly-reconciliation', '0 5 * * 0', '/functions/v1/weekly-reconciliation', '{"autoApproveConfidence": 0.95}')
ON CONFLICT (job_name) DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE cron_job_logs IS 'Tracks execution history of all scheduled cron jobs';
COMMENT ON TABLE cron_job_config IS 'Configuration settings for pg_cron scheduled jobs';
COMMENT ON VIEW recent_cron_jobs IS 'Shows recent cron job executions with health status';
COMMENT ON FUNCTION log_cron_job_execution IS 'Logs the execution result of a cron job';

-- =====================================================
-- Grants (if needed for specific roles)
-- =====================================================

-- Allow service role to manage cron jobs
-- GRANT SELECT, INSERT, UPDATE ON cron_job_logs TO service_role;
-- GRANT SELECT, UPDATE ON cron_job_config TO service_role;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these queries to verify pg_cron setup:
--
-- List all scheduled jobs:
-- SELECT * FROM cron.job;
--
-- Check recent job runs:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- View job history:
-- SELECT * FROM recent_cron_jobs;
--
-- Disable a job:
-- UPDATE cron_job_config SET is_enabled = false WHERE job_name = 'daily-fx-rate-update';
-- SELECT cron.unschedule('daily-fx-rate-update');
--
-- Re-enable a job:
-- UPDATE cron_job_config SET is_enabled = true WHERE job_name = 'daily-fx-rate-update';
-- (Then re-run the cron.schedule command from above)
-- =====================================================
