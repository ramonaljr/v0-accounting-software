-- OpportunityOS Phase 2.4 - Multi-Currency Support
-- Migration: Initialize multi-currency and exchange rate management
-- Created: 2025-10-21

-- =====================================================
-- MULTI-CURRENCY TABLES
-- =====================================================

-- Currencies (supported currencies)
CREATE TABLE currencies (
  code TEXT PRIMARY KEY, -- ISO 4217 (USD, EUR, PHP, JPY, etc.)
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active currencies
CREATE INDEX idx_currencies_active ON currencies(is_active);

-- Exchange Rates (historical exchange rates)
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency TEXT NOT NULL REFERENCES currencies(code) ON DELETE CASCADE,
  to_currency TEXT NOT NULL REFERENCES currencies(code) ON DELETE CASCADE,
  rate NUMERIC(10,6) NOT NULL, -- Exchange rate (6 decimal places for precision)
  rate_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- "ecb", "openexchangerates", "manual", "xe"
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, rate_date, source)
);

-- Create indexes for exchange rates
CREATE INDEX idx_exchange_rates_from_currency ON exchange_rates(from_currency);
CREATE INDEX idx_exchange_rates_to_currency ON exchange_rates(to_currency);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date);
CREATE INDEX idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency, rate_date);

-- =====================================================
-- SEED DATA - CURRENCIES
-- =====================================================

-- Insert common currencies
INSERT INTO currencies (code, name, symbol, decimal_places, is_active) VALUES
  ('USD', 'US Dollar', '$', 2, true),
  ('EUR', 'Euro', '€', 2, true),
  ('GBP', 'British Pound', '£', 2, true),
  ('PHP', 'Philippine Peso', '₱', 2, true),
  ('JPY', 'Japanese Yen', '¥', 0, true),
  ('SGD', 'Singapore Dollar', 'S$', 2, true),
  ('AUD', 'Australian Dollar', 'A$', 2, true),
  ('CAD', 'Canadian Dollar', 'C$', 2, true),
  ('CHF', 'Swiss Franc', 'CHF', 2, true),
  ('CNY', 'Chinese Yuan', '¥', 2, true),
  ('HKD', 'Hong Kong Dollar', 'HK$', 2, true),
  ('NZD', 'New Zealand Dollar', 'NZ$', 2, true),
  ('SEK', 'Swedish Krona', 'kr', 2, true),
  ('KRW', 'South Korean Won', '₩', 0, true),
  ('NOK', 'Norwegian Krone', 'kr', 2, true),
  ('MXN', 'Mexican Peso', '$', 2, true),
  ('INR', 'Indian Rupee', '₹', 2, true),
  ('BRL', 'Brazilian Real', 'R$', 2, true),
  ('ZAR', 'South African Rand', 'R', 2, true),
  ('THB', 'Thai Baht', '฿', 2, true);

-- =====================================================
-- ROW LEVEL SECURITY - CURRENCIES
-- =====================================================

-- Enable RLS on currencies (read-only for all authenticated users)
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active currencies
CREATE POLICY "Anyone can view active currencies"
  ON currencies FOR SELECT
  USING (is_active = true);

-- =====================================================
-- ROW LEVEL SECURITY - EXCHANGE RATES
-- =====================================================

-- Enable RLS on exchange_rates (read-only for all authenticated users)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view exchange rates
CREATE POLICY "Anyone can view exchange rates"
  ON exchange_rates FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for currencies updated_at
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate exchange rate
CREATE OR REPLACE FUNCTION validate_exchange_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure rate is positive
  IF NEW.rate <= 0 THEN
    RAISE EXCEPTION 'Exchange rate must be positive';
  END IF;

  -- Ensure from and to currencies are different
  IF NEW.from_currency = NEW.to_currency THEN
    RAISE EXCEPTION 'From and to currencies must be different';
  END IF;

  -- Ensure both currencies exist and are active
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = NEW.from_currency AND is_active = true) THEN
    RAISE EXCEPTION 'From currency % is not active', NEW.from_currency;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = NEW.to_currency AND is_active = true) THEN
    RAISE EXCEPTION 'To currency % is not active', NEW.to_currency;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate exchange rate
CREATE TRIGGER validate_exchange_rate_trigger
  BEFORE INSERT OR UPDATE ON exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION validate_exchange_rate();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get exchange rate for a specific date
CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC(10,6);
BEGIN
  -- If same currency, return 1
  IF p_from_currency = p_to_currency THEN
    RETURN 1.000000;
  END IF;

  -- Try to get exact date rate
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND rate_date = p_date
  ORDER BY created_at DESC
  LIMIT 1;

  -- If not found, get most recent rate before date
  IF v_rate IS NULL THEN
    SELECT rate INTO v_rate
    FROM exchange_rates
    WHERE from_currency = p_from_currency
      AND to_currency = p_to_currency
      AND rate_date <= p_date
    ORDER BY rate_date DESC, created_at DESC
    LIMIT 1;
  END IF;

  -- If still not found, try reverse rate (1 / rate)
  IF v_rate IS NULL THEN
    SELECT 1.0 / rate INTO v_rate
    FROM exchange_rates
    WHERE from_currency = p_to_currency
      AND to_currency = p_from_currency
      AND rate_date <= p_date
    ORDER BY rate_date DESC, created_at DESC
    LIMIT 1;
  END IF;

  -- If no rate found, return NULL (caller must handle)
  RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to convert amount between currencies
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC(10,6);
  v_converted NUMERIC(15,2);
BEGIN
  -- Get exchange rate
  v_rate := get_exchange_rate(p_from_currency, p_to_currency, p_date);

  -- If no rate found, raise exception
  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'No exchange rate found for % to % on %', p_from_currency, p_to_currency, p_date;
  END IF;

  -- Convert amount
  v_converted := ROUND(p_amount * v_rate, 2);

  RETURN v_converted;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest exchange rate
CREATE OR REPLACE FUNCTION get_latest_rate(
  p_from_currency TEXT,
  p_to_currency TEXT
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN get_exchange_rate(p_from_currency, p_to_currency, CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to update organization base currency
CREATE OR REPLACE FUNCTION set_org_base_currency(
  p_org_id UUID,
  p_currency_code TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Validate currency exists and is active
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = p_currency_code AND is_active = true) THEN
    RAISE EXCEPTION 'Currency % is not active', p_currency_code;
  END IF;

  -- Update organization settings
  UPDATE organizations
  SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{base_currency}',
    to_jsonb(p_currency_code)
  )
  WHERE id = p_org_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization base currency
CREATE OR REPLACE FUNCTION get_org_base_currency(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_currency TEXT;
BEGIN
  SELECT settings->>'base_currency' INTO v_currency
  FROM organizations
  WHERE id = p_org_id;

  -- Default to USD if not set
  RETURN COALESCE(v_currency, 'USD');
END;
$$ LANGUAGE plpgsql;

-- Function to bulk update exchange rates (for daily sync)
CREATE OR REPLACE FUNCTION bulk_update_exchange_rates(
  p_base_currency TEXT,
  p_rates JSONB,
  p_rate_date DATE DEFAULT CURRENT_DATE,
  p_source TEXT DEFAULT 'api'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_currency TEXT;
  v_rate NUMERIC;
BEGIN
  -- Loop through each currency in the rates object
  FOR v_currency, v_rate IN
    SELECT key, value::TEXT::NUMERIC
    FROM jsonb_each_text(p_rates)
  LOOP
    -- Skip if same currency
    IF v_currency = p_base_currency THEN
      CONTINUE;
    END IF;

    -- Insert or update exchange rate
    INSERT INTO exchange_rates (from_currency, to_currency, rate, rate_date, source)
    VALUES (p_base_currency, v_currency, v_rate, p_rate_date, p_source)
    ON CONFLICT (from_currency, to_currency, rate_date, source)
    DO UPDATE SET
      rate = EXCLUDED.rate,
      metadata = EXCLUDED.metadata,
      created_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for latest exchange rates (most recent rate per currency pair)
CREATE OR REPLACE VIEW latest_exchange_rates AS
SELECT DISTINCT ON (from_currency, to_currency)
  from_currency,
  to_currency,
  rate,
  rate_date,
  source
FROM exchange_rates
ORDER BY from_currency, to_currency, rate_date DESC, created_at DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE currencies IS 'Supported currencies with ISO 4217 codes';
COMMENT ON TABLE exchange_rates IS 'Historical exchange rates for currency conversion';
COMMENT ON COLUMN currencies.code IS 'ISO 4217 currency code (e.g., USD, EUR, JPY)';
COMMENT ON COLUMN currencies.decimal_places IS 'Number of decimal places for the currency';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate from base to target currency';
COMMENT ON COLUMN exchange_rates.source IS 'Source of exchange rate (api, manual, etc.)';
COMMENT ON FUNCTION get_exchange_rate IS 'Get exchange rate for a specific date (with fallback to previous rate)';
COMMENT ON FUNCTION convert_currency IS 'Convert amount from one currency to another';
COMMENT ON FUNCTION bulk_update_exchange_rates IS 'Bulk update exchange rates from API response';
