-- Performance Optimization Indexes
-- Phase 7: Testing & Hardening
-- Created: 2025-01-10

-- =====================================================
-- ACCOUNTS TABLE INDEXES
-- =====================================================

-- Index for filtering by org and type (common query pattern)
CREATE INDEX IF NOT EXISTS idx_accounts_org_type
  ON accounts(org_id, account_type);

-- Index for filtering by org and status
CREATE INDEX IF NOT EXISTS idx_accounts_org_active
  ON accounts(org_id, is_active);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_accounts_org_code
  ON accounts(org_id, account_code);

-- =====================================================
-- JOURNAL ENTRIES TABLE INDEXES
-- =====================================================

-- Index for date range queries (most common for reports)
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_date
  ON journal_entries(org_id, entry_date DESC);

-- Index for period filtering
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_period
  ON journal_entries(org_id, period_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_status
  ON journal_entries(org_id, status);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_period_status
  ON journal_entries(org_id, period_id, status);

-- =====================================================
-- JOURNAL ENTRY LINES TABLE INDEXES
-- =====================================================

-- Index for account lookups (for trial balance, account history)
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account
  ON journal_entry_lines(account_id);

-- Index for entry lookups (for entry detail views)
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry
  ON journal_entry_lines(entry_id);

-- Composite index for account balance calculations
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_entry
  ON journal_entry_lines(account_id, entry_id);

-- =====================================================
-- INVOICES TABLE INDEXES
-- =====================================================

-- Index for customer filtering
CREATE INDEX IF NOT EXISTS idx_invoices_org_customer
  ON invoices(org_id, customer_id);

-- Index for status filtering (for AR aging, overdue lists)
CREATE INDEX IF NOT EXISTS idx_invoices_org_status
  ON invoices(org_id, status);

-- Index for due date filtering (for collections)
CREATE INDEX IF NOT EXISTS idx_invoices_org_due_date
  ON invoices(org_id, due_date DESC)
  WHERE status IN ('sent', 'overdue');

-- Index for invoice number lookups
CREATE INDEX IF NOT EXISTS idx_invoices_org_number
  ON invoices(org_id, invoice_number);

-- Composite index for AR aging reports
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_due
  ON invoices(org_id, status, due_date DESC);

-- =====================================================
-- CUSTOMERS TABLE INDEXES
-- =====================================================

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_customers_org_name
  ON customers(org_id, display_name);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_customers_org_email
  ON customers(org_id, email);

-- Index for active customers
CREATE INDEX IF NOT EXISTS idx_customers_org_active
  ON customers(org_id, is_active);

-- =====================================================
-- BANK TRANSACTIONS TABLE INDEXES
-- =====================================================

-- Index for account filtering
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_account
  ON bank_transactions(org_id, account_id);

-- Index for status filtering (for review lists)
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_status
  ON bank_transactions(org_id, status);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_date
  ON bank_transactions(org_id, transaction_date DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_account_status
  ON bank_transactions(org_id, account_id, status);

-- Index for matching algorithms
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_amount
  ON bank_transactions(org_id, amount);

-- =====================================================
-- ACCOUNTING PERIODS TABLE INDEXES
-- =====================================================

-- Index for finding current/active period
CREATE INDEX IF NOT EXISTS idx_accounting_periods_org_status
  ON accounting_periods(org_id, status);

-- Index for date range lookups
CREATE INDEX IF NOT EXISTS idx_accounting_periods_org_dates
  ON accounting_periods(org_id, start_date, end_date);

-- =====================================================
-- AUDIT LOG TABLE INDEXES
-- =====================================================

-- Index for user activity tracking
CREATE INDEX IF NOT EXISTS idx_audit_log_org_user
  ON audit_log(org_id, user_id);

-- Index for entity tracking
CREATE INDEX IF NOT EXISTS idx_audit_log_org_entity
  ON audit_log(org_id, entity_type, entity_id);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_timestamp
  ON audit_log(org_id, created_at DESC);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_audit_log_org_action
  ON audit_log(org_id, action);

-- =====================================================
-- ORG MEMBERS TABLE INDEXES
-- =====================================================

-- Index for user org lookups
CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON org_members(user_id);

-- Index for org member lists
CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON org_members(org_id);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_org_members_org_role
  ON org_members(org_id, role);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON INDEX idx_accounts_org_type IS 'Optimize account filtering by type';
COMMENT ON INDEX idx_journal_entries_org_date IS 'Optimize date range queries for reports';
COMMENT ON INDEX idx_journal_entry_lines_account IS 'Optimize account balance calculations';
COMMENT ON INDEX idx_invoices_org_due_date IS 'Optimize AR aging and collections queries';
COMMENT ON INDEX idx_bank_transactions_org_account_status IS 'Optimize bank transaction review lists';
COMMENT ON INDEX idx_audit_log_org_timestamp IS 'Optimize audit log queries';

-- =====================================================
-- STATISTICS
-- =====================================================

-- Update statistics for better query planning
ANALYZE accounts;
ANALYZE journal_entries;
ANALYZE journal_entry_lines;
ANALYZE invoices;
ANALYZE customers;
ANALYZE bank_transactions;
ANALYZE accounting_periods;
ANALYZE audit_log;
ANALYZE org_members;
