-- Migration: Seed Common Categorization Rules
-- Created: 2025-10-21
-- Description: Seed common merchant-to-account mappings for auto-categorization

-- This migration will create a template set of categorization rules that new organizations
-- can optionally import. These are not inserted directly but stored as templates.

-- Note: In production, these would be inserted per organization during onboarding

-- Common SaaS/Software Merchants → Software/Services Expense
-- Examples: AWS, Google Cloud, Microsoft, GitHub, etc.

COMMENT ON TABLE categorization_rules IS 'Auto-categorization rules for bank transactions. Rules are evaluated by priority (lower = higher priority).';

-- Helper function to create rules for a specific organization
CREATE OR REPLACE FUNCTION seed_default_categorization_rules(
  p_org_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_software_account_id UUID;
  v_advertising_account_id UUID;
  v_hosting_account_id UUID;
  v_office_supplies_account_id UUID;
  v_payment_processing_account_id UUID;
  v_utilities_account_id UUID;
  v_meals_account_id UUID;
  v_travel_account_id UUID;
BEGIN
  -- Get or create standard expense accounts for the organization
  -- Note: These accounts should already exist from COA initialization

  -- Software & Services (typically 6200)
  SELECT id INTO v_software_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code = '6200'
    AND account_type = 'expense'
  LIMIT 1;

  -- Advertising & Marketing (typically 6100)
  SELECT id INTO v_advertising_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code = '6100'
    AND account_type = 'expense'
  LIMIT 1;

  -- Hosting & Infrastructure (typically 6210)
  SELECT id INTO v_hosting_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code LIKE '621%'
    AND account_type = 'expense'
  LIMIT 1;

  -- If specific accounts don't exist, fall back to general accounts
  IF v_hosting_account_id IS NULL THEN
    v_hosting_account_id := v_software_account_id;
  END IF;

  -- Office Supplies (typically 6300)
  SELECT id INTO v_office_supplies_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code LIKE '63%'
    AND account_type = 'expense'
  LIMIT 1;

  -- Payment Processing Fees (typically 6410)
  SELECT id INTO v_payment_processing_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code LIKE '641%'
    AND account_type = 'expense'
  LIMIT 1;

  -- Utilities (typically 6500)
  SELECT id INTO v_utilities_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code LIKE '65%'
    AND account_type = 'expense'
  LIMIT 1;

  -- Meals & Entertainment (typically 6700)
  SELECT id INTO v_meals_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code LIKE '67%'
    AND account_type = 'expense'
  LIMIT 1;

  -- Travel (typically 6800)
  SELECT id INTO v_travel_account_id
  FROM accounts
  WHERE org_id = p_org_id
    AND code LIKE '68%'
    AND account_type = 'expense'
  LIMIT 1;

  -- Insert categorization rules
  -- Priority: lower number = higher priority

  -- Cloud Hosting & Infrastructure
  IF v_hosting_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'merchant', 'AWS|Amazon Web Services', v_hosting_account_id, 10, true),
      (p_org_id, 'merchant', 'Google Cloud|GCP', v_hosting_account_id, 10, true),
      (p_org_id, 'merchant', 'Microsoft Azure|Azure', v_hosting_account_id, 10, true),
      (p_org_id, 'merchant', 'DigitalOcean', v_hosting_account_id, 10, true),
      (p_org_id, 'merchant', 'Heroku', v_hosting_account_id, 10, true),
      (p_org_id, 'merchant', 'Vercel', v_hosting_account_id, 10, true),
      (p_org_id, 'merchant', 'Netlify', v_hosting_account_id, 10, true),
      (p_org_id, 'merchant', 'Cloudflare', v_hosting_account_id, 10, true);
  END IF;

  -- Software & SaaS
  IF v_software_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'merchant', 'GitHub', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'GitLab', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Atlassian|JIRA|Confluence', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Slack', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Notion', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Zoom', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Figma', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Adobe', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Microsoft 365|Office 365', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Google Workspace', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Dropbox', v_software_account_id, 20, true),
      (p_org_id, 'merchant', 'Linear', v_software_account_id, 20, true);
  END IF;

  -- Advertising & Marketing
  IF v_advertising_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'merchant', 'Google Ads|AdWords', v_advertising_account_id, 15, true),
      (p_org_id, 'merchant', 'Facebook Ads|Meta Ads', v_advertising_account_id, 15, true),
      (p_org_id, 'merchant', 'LinkedIn Ads', v_advertising_account_id, 15, true),
      (p_org_id, 'merchant', 'Twitter Ads', v_advertising_account_id, 15, true),
      (p_org_id, 'merchant', 'Mailchimp', v_advertising_account_id, 15, true),
      (p_org_id, 'merchant', 'SendGrid', v_advertising_account_id, 15, true),
      (p_org_id, 'merchant', 'HubSpot', v_advertising_account_id, 15, true);
  END IF;

  -- Payment Processing
  IF v_payment_processing_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'merchant', 'Stripe', v_payment_processing_account_id, 5, true),
      (p_org_id, 'merchant', 'PayPal', v_payment_processing_account_id, 5, true),
      (p_org_id, 'merchant', 'Square', v_payment_processing_account_id, 5, true),
      (p_org_id, 'description', 'payment processing fee', v_payment_processing_account_id, 5, true),
      (p_org_id, 'description', 'merchant service', v_payment_processing_account_id, 5, true);
  END IF;

  -- Office Supplies
  IF v_office_supplies_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'merchant', 'Amazon|AMZN', v_office_supplies_account_id, 50, true),
      (p_org_id, 'merchant', 'Staples|Office Depot', v_office_supplies_account_id, 30, true),
      (p_org_id, 'description', 'office supplies', v_office_supplies_account_id, 30, true);
  END IF;

  -- Utilities
  IF v_utilities_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'description', 'electric|electricity|power company', v_utilities_account_id, 40, true),
      (p_org_id, 'description', 'water|sewer', v_utilities_account_id, 40, true),
      (p_org_id, 'description', 'gas company|natural gas', v_utilities_account_id, 40, true),
      (p_org_id, 'description', 'internet|ISP|broadband', v_utilities_account_id, 40, true),
      (p_org_id, 'description', 'phone|mobile|cellular', v_utilities_account_id, 40, true);
  END IF;

  -- Meals & Entertainment (50% deductible in US)
  IF v_meals_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'description', 'restaurant|cafe|coffee', v_meals_account_id, 60, true),
      (p_org_id, 'merchant', 'Starbucks|Dunkin', v_meals_account_id, 60, true),
      (p_org_id, 'description', 'doordash|uber eats|grubhub', v_meals_account_id, 60, true);
  END IF;

  -- Travel
  IF v_travel_account_id IS NOT NULL THEN
    INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority, is_active)
    VALUES
      (p_org_id, 'merchant', 'Uber|Lyft', v_travel_account_id, 45, true),
      (p_org_id, 'description', 'airline|airways|flight', v_travel_account_id, 45, true),
      (p_org_id, 'description', 'hotel|hilton|marriott|airbnb', v_travel_account_id, 45, true),
      (p_org_id, 'description', 'car rental|hertz|enterprise', v_travel_account_id, 45, true);
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION seed_default_categorization_rules IS 'Seeds default categorization rules for a new organization based on their chart of accounts';

-- Example usage (would be called during org onboarding):
-- SELECT seed_default_categorization_rules('org-uuid-here');
