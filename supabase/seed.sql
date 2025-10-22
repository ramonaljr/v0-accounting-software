-- =====================================================
-- Sample Data Seeding Script
-- =====================================================
-- This script creates sample data for testing AI workflows:
-- - Organizations and users
-- - Chart of accounts
-- - Bank accounts and transactions
-- - Vendors and customers
-- - Expenses and invoices
-- - Journal entries for testing reconciliation
--
-- Usage: Run this after initial migrations
-- Purpose: Testing categorization, reconciliation, anomaly detection
-- =====================================================

-- =====================================================
-- 1. Sample Organizations
-- =====================================================

INSERT INTO organizations (id, name, legal_name, tax_id, settings, is_active, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Acme Corp Demo',
    'Acme Corporation LLC',
    '12-3456789',
    jsonb_build_object(
      'currency', 'USD',
      'accounting_basis', 'accrual',
      'fiscal_year_end', '12-31',
      'timezone', 'America/New_York',
      'ai_categorization_enabled', true,
      'ai_categorization_threshold', 0.90,
      'reconciliation_enabled', true,
      'anomaly_detection_enabled', true
    ),
    true,
    NOW() - INTERVAL '30 days'
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Tech Startup Ltd',
    'Tech Startup Limited',
    '98-7654321',
    jsonb_build_object(
      'currency', 'USD',
      'accounting_basis', 'cash',
      'fiscal_year_end', '12-31',
      'timezone', 'America/Los_Angeles',
      'ai_categorization_enabled', true,
      'ai_categorization_threshold', 0.85,
      'reconciliation_enabled', true,
      'anomaly_detection_enabled', true
    ),
    true,
    NOW() - INTERVAL '60 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. Sample Chart of Accounts
-- =====================================================

INSERT INTO accounts (org_id, code, name, type, subtype, parent_account_id, is_active, is_system)
VALUES
  -- Assets (1000-1999)
  ('00000000-0000-0000-0000-000000000001'::uuid, '1000', 'Assets', 'asset', 'current_asset', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, '1010', 'Cash - Operating', 'asset', 'cash', (SELECT id FROM accounts WHERE code = '1000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '1020', 'Cash - Payroll', 'asset', 'cash', (SELECT id FROM accounts WHERE code = '1000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '1100', 'Accounts Receivable', 'asset', 'accounts_receivable', (SELECT id FROM accounts WHERE code = '1000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, '1200', 'Inventory', 'asset', 'inventory', (SELECT id FROM accounts WHERE code = '1000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),

  -- Liabilities (2000-2999)
  ('00000000-0000-0000-0000-000000000001'::uuid, '2000', 'Liabilities', 'liability', 'current_liability', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, '2100', 'Accounts Payable', 'liability', 'accounts_payable', (SELECT id FROM accounts WHERE code = '2000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, '2200', 'Sales Tax Payable', 'liability', 'sales_tax_payable', (SELECT id FROM accounts WHERE code = '2000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, true),

  -- Equity (3000-3999)
  ('00000000-0000-0000-0000-000000000001'::uuid, '3000', 'Equity', 'equity', 'equity', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, '3100', 'Retained Earnings', 'equity', 'retained_earnings', (SELECT id FROM accounts WHERE code = '3000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, true),

  -- Revenue (4000-4999)
  ('00000000-0000-0000-0000-000000000001'::uuid, '4000', 'Revenue', 'revenue', 'sales_revenue', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, '4010', 'Product Sales', 'revenue', 'sales_revenue', (SELECT id FROM accounts WHERE code = '4000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '4020', 'Service Revenue', 'revenue', 'service_revenue', (SELECT id FROM accounts WHERE code = '4000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),

  -- Expenses (5000-5999)
  ('00000000-0000-0000-0000-000000000001'::uuid, '5000', 'Cost of Goods Sold', 'expense', 'cost_of_goods_sold', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6000', 'Operating Expenses', 'expense', 'operating_expense', NULL, true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6100', 'Rent Expense', 'expense', 'rent_expense', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6200', 'Office Supplies', 'expense', 'office_expense', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6300', 'Software Subscriptions', 'expense', 'software_expense', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6400', 'Travel & Meals', 'expense', 'travel_expense', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6500', 'Utilities', 'expense', 'utilities_expense', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6600', 'Marketing & Advertising', 'expense', 'marketing_expense', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6700', 'Professional Fees', 'expense', 'professional_fees', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false),
  ('00000000-0000-0000-0000-000000000001'::uuid, '6800', 'Bank Fees', 'expense', 'bank_fees', (SELECT id FROM accounts WHERE code = '6000' AND org_id = '00000000-0000-0000-0000-000000000001'), true, false)
ON CONFLICT (org_id, code) DO NOTHING;

-- =====================================================
-- 3. Sample Bank Accounts
-- =====================================================

INSERT INTO bank_accounts (org_id, account_name, account_number, routing_number, bank_name, account_type, currency, current_balance, available_balance, is_active, last_sync_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Business Checking',
    '****1234',
    '021000021',
    'Chase Bank',
    'checking',
    'USD',
    45750.50,
    45750.50,
    true,
    NOW() - INTERVAL '1 hour'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Business Savings',
    '****5678',
    '021000021',
    'Chase Bank',
    'savings',
    'USD',
    125000.00,
    125000.00,
    true,
    NOW() - INTERVAL '1 hour'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. Sample Bank Transactions (for AI categorization testing)
-- =====================================================

INSERT INTO bank_transactions (
  org_id,
  bank_account_id,
  transaction_date,
  posted_date,
  description,
  merchant_name,
  amount,
  transaction_type,
  category,
  status,
  is_reconciled,
  needs_review,
  created_at
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM bank_accounts WHERE account_number = '****1234' AND org_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
  transaction_date,
  posted_date,
  description,
  merchant_name,
  amount,
  transaction_type,
  category,
  'posted',
  false,
  true,
  NOW()
FROM (VALUES
  -- Expenses (should be categorized)
  (NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'AMZN Mktp US*2X9YZ3KL2', 'Amazon', -125.47, 'debit', 'Shopping', NULL),
  (NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'SQ *STARBUCKS COFFEE', 'Starbucks', -15.75, 'debit', 'Restaurants', NULL),
  (NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'STRIPE PAYMENT PROCESSING', 'Stripe', -89.25, 'debit', 'Software', NULL),
  (NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 'GOOGLE WORKSPACE', 'Google', -30.00, 'debit', 'Software', NULL),
  (NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 'OFFICE DEPOT #1234', 'Office Depot', -245.80, 'debit', 'Office Supplies', NULL),
  (NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 'DELTA AIR LINES', 'Delta', -487.50, 'debit', 'Travel', NULL),
  (NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 'HILTON HOTELS SAN FRANCISCO', 'Hilton', -325.00, 'debit', 'Travel', NULL),
  (NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', 'COMCAST CABLE', 'Comcast', -129.99, 'debit', 'Utilities', NULL),
  (NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', 'FACEBOOK ADS', 'Facebook', -1250.00, 'debit', 'Advertising', NULL),
  (NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days', 'ACME LAW FIRM', 'Acme Law', -1500.00, 'debit', 'Professional Services', NULL),

  -- Revenue (should be categorized)
  (NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'STRIPE TRANSFER', 'Stripe', 4500.00, 'credit', 'Income', NULL),
  (NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 'CUSTOMER PAYMENT - INV-1001', 'Customer', 2750.00, 'credit', 'Income', NULL),
  (NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 'SHOPIFY PAYOUT', 'Shopify', 3200.50, 'credit', 'Income', NULL),
  (NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', 'CUSTOMER PAYMENT - INV-1002', 'Customer', 5500.00, 'credit', 'Income', NULL),

  -- Duplicate transactions (for anomaly detection)
  (NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'OFFICE DEPOT #1234', 'Office Depot', -245.80, 'debit', 'Office Supplies', NULL),
  (NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'OFFICE DEPOT #1234', 'Office Depot', -245.80, 'debit', 'Office Supplies', NULL),

  -- Unusual amount (for anomaly detection - >3 std dev)
  (NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 'LARGE EQUIPMENT PURCHASE', 'Vendor', -25000.00, 'debit', 'Equipment', NULL),

  -- Miscellaneous
  (NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', 'MONTHLY RENT PAYMENT', 'Landlord', -3500.00, 'debit', 'Rent', NULL),
  (NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', 'PAYROLL DEPOSIT', 'ADP', -15000.00, 'debit', 'Payroll', NULL),
  (NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', 'ATM WITHDRAWAL', 'ATM', -200.00, 'debit', 'Cash Withdrawal', NULL)
) AS t(transaction_date, posted_date, description, merchant_name, amount, transaction_type, category, account_id);

-- =====================================================
-- 5. Sample Vendors
-- =====================================================

INSERT INTO vendors (org_id, name, email, phone, billing_address, payment_terms, tax_id, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Office Depot',
    'billing@officedepot.com',
    '1-800-463-3768',
    jsonb_build_object(
      'street', '6600 North Military Trail',
      'city', 'Boca Raton',
      'state', 'FL',
      'zip', '33496',
      'country', 'US'
    ),
    'NET_30',
    '59-0677878',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Comcast Business',
    'business@comcast.com',
    '1-800-391-3000',
    jsonb_build_object(
      'street', '1701 JFK Boulevard',
      'city', 'Philadelphia',
      'state', 'PA',
      'zip', '19103',
      'country', 'US'
    ),
    'DUE_ON_RECEIPT',
    '27-0000798',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Acme Law Firm',
    'billing@acmelawfirm.com',
    '415-555-0123',
    jsonb_build_object(
      'street', '123 Market Street',
      'city', 'San Francisco',
      'state', 'CA',
      'zip', '94102',
      'country', 'US'
    ),
    'NET_15',
    '94-1234567',
    true
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. Sample Customers
-- =====================================================

INSERT INTO customers (org_id, name, email, phone, billing_address, payment_terms, tax_id, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'ABC Manufacturing Inc',
    'ap@abcmanufacturing.com',
    '555-123-4567',
    jsonb_build_object(
      'street', '456 Industrial Way',
      'city', 'Detroit',
      'state', 'MI',
      'zip', '48201',
      'country', 'US'
    ),
    'NET_30',
    '38-1234567',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Tech Solutions LLC',
    'billing@techsolutions.com',
    '555-987-6543',
    jsonb_build_object(
      'street', '789 Tech Park Drive',
      'city', 'Austin',
      'state', 'TX',
      'zip', '78701',
      'country', 'US'
    ),
    'NET_15',
    '74-7654321',
    true
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. Sample Journal Entries (for reconciliation testing)
-- =====================================================

-- Revenue entry matching bank deposit
INSERT INTO journal_entries (org_id, entry_date, entry_type, reference, description, status, posted_by, posted_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW() - INTERVAL '3 days',
  'standard',
  'INV-1003',
  'Customer payment received via Stripe',
  'posted',
  NULL,
  NOW() - INTERVAL '3 days'
RETURNING id;

-- Create line items for the revenue entry
INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
SELECT
  (SELECT id FROM journal_entries WHERE reference = 'INV-1003' AND org_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
  account_id,
  debit,
  credit,
  description
FROM (VALUES
  ((SELECT id FROM accounts WHERE code = '1010' AND org_id = '00000000-0000-0000-0000-000000000001'), 4500.00, 0.00, 'Cash receipt - Stripe transfer'),
  ((SELECT id FROM accounts WHERE code = '4010' AND org_id = '00000000-0000-0000-0000-000000000001'), 0.00, 4500.00, 'Product sales revenue')
) AS t(account_id, debit, credit, description);

-- Expense entry for rent
INSERT INTO journal_entries (org_id, entry_date, entry_type, reference, description, status, posted_by, posted_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW() - INTERVAL '9 days',
  'standard',
  'RENT-JAN-2025',
  'Monthly rent payment for January 2025',
  'posted',
  NULL,
  NOW() - INTERVAL '9 days'
RETURNING id;

INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
SELECT
  (SELECT id FROM journal_entries WHERE reference = 'RENT-JAN-2025' AND org_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
  account_id,
  debit,
  credit,
  description
FROM (VALUES
  ((SELECT id FROM accounts WHERE code = '6100' AND org_id = '00000000-0000-0000-0000-000000000001'), 3500.00, 0.00, 'Rent expense - January 2025'),
  ((SELECT id FROM accounts WHERE code = '1010' AND org_id = '00000000-0000-0000-0000-000000000001'), 0.00, 3500.00, 'Cash payment to landlord')
) AS t(account_id, debit, credit, description);

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify seed data:
--
-- Check organizations:
-- SELECT * FROM organizations WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
--
-- Check accounts:
-- SELECT code, name, type, subtype FROM accounts WHERE org_id = '00000000-0000-0000-0000-000000000001' ORDER BY code;
--
-- Check bank transactions needing categorization:
-- SELECT transaction_date, merchant_name, amount, description, needs_review
-- FROM bank_transactions
-- WHERE org_id = '00000000-0000-0000-0000-000000000001'
-- AND needs_review = true
-- ORDER BY transaction_date DESC;
--
-- Check for duplicate transactions:
-- SELECT merchant_name, amount, COUNT(*) as count
-- FROM bank_transactions
-- WHERE org_id = '00000000-0000-0000-0000-000000000001'
-- GROUP BY merchant_name, amount
-- HAVING COUNT(*) > 1;
--
-- Check unreconciled transactions:
-- SELECT bt.transaction_date, bt.merchant_name, bt.amount
-- FROM bank_transactions bt
-- WHERE bt.org_id = '00000000-0000-0000-0000-000000000001'
-- AND bt.is_reconciled = false
-- ORDER BY bt.transaction_date DESC;
-- =====================================================
