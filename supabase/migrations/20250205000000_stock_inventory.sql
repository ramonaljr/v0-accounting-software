-- =====================================================
-- Stock/Inventory Management Schema
-- Based on ERPNext Stock Module
-- =====================================================

-- =====================================================
-- WAREHOUSES (Storage Locations)
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  warehouse_code VARCHAR(50) NOT NULL,
  warehouse_name VARCHAR(255) NOT NULL,

  -- Hierarchy (NestedSet model)
  parent_id UUID REFERENCES warehouses(id),
  is_group BOOLEAN DEFAULT FALSE,
  lft INTEGER DEFAULT 0,
  rgt INTEGER DEFAULT 0,

  -- Location
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Philippines',

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),

  -- Linked GL account for perpetual inventory
  account_id UUID REFERENCES accounts(id),

  -- Flags
  is_active BOOLEAN DEFAULT TRUE,
  is_rejected_warehouse BOOLEAN DEFAULT FALSE,  -- For quality rejections
  default_in_transit_warehouse UUID REFERENCES warehouses(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_warehouse_code UNIQUE(org_id, warehouse_code),
  CONSTRAINT uq_warehouse_name UNIQUE(org_id, warehouse_name)
);

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view warehouses in their org"
  ON warehouses FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage warehouses"
  ON warehouses FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant')
  ));

CREATE INDEX idx_warehouses_org ON warehouses(org_id);
CREATE INDEX idx_warehouses_parent ON warehouses(parent_id);
CREATE INDEX idx_warehouses_lft_rgt ON warehouses(lft, rgt);

-- =====================================================
-- UNIT OF MEASURE (UOM)
-- =====================================================
CREATE TABLE IF NOT EXISTS uoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  uom_name VARCHAR(50) NOT NULL,
  must_be_whole_number BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_uom_name UNIQUE(org_id, uom_name)
);

ALTER TABLE uoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view UOMs in their org"
  ON uoms FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =====================================================
-- ITEM GROUPS (Categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS item_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  group_code VARCHAR(50) NOT NULL,
  group_name VARCHAR(255) NOT NULL,

  parent_id UUID REFERENCES item_groups(id),
  is_group BOOLEAN DEFAULT FALSE,
  lft INTEGER DEFAULT 0,
  rgt INTEGER DEFAULT 0,

  -- Default accounts for items in this group
  default_expense_account_id UUID REFERENCES accounts(id),
  default_income_account_id UUID REFERENCES accounts(id),

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_item_group_code UNIQUE(org_id, group_code)
);

ALTER TABLE item_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view item groups in their org"
  ON item_groups FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =====================================================
-- ITEMS (Master Data)
-- =====================================================
CREATE TYPE valuation_method AS ENUM ('FIFO', 'Moving Average', 'LIFO');

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Info
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Classification
  item_group_id UUID REFERENCES item_groups(id),
  brand VARCHAR(100),

  -- Stock settings
  is_stock_item BOOLEAN DEFAULT TRUE,
  stock_uom_id UUID REFERENCES uoms(id),
  valuation_method valuation_method DEFAULT 'Moving Average',

  -- Tracking
  has_serial_no BOOLEAN DEFAULT FALSE,
  has_batch_no BOOLEAN DEFAULT FALSE,
  has_expiry_date BOOLEAN DEFAULT FALSE,
  shelf_life_days INTEGER,

  -- Purchase/Sales flags
  is_purchase_item BOOLEAN DEFAULT TRUE,
  is_sales_item BOOLEAN DEFAULT TRUE,

  -- Pricing
  standard_rate DECIMAL(18,4) DEFAULT 0,
  valuation_rate DECIMAL(18,4) DEFAULT 0,
  last_purchase_rate DECIMAL(18,4) DEFAULT 0,

  -- Defaults
  default_warehouse_id UUID REFERENCES warehouses(id),

  -- Accounts
  expense_account_id UUID REFERENCES accounts(id),
  income_account_id UUID REFERENCES accounts(id),

  -- Reorder
  reorder_level DECIMAL(18,4) DEFAULT 0,
  reorder_qty DECIMAL(18,4) DEFAULT 0,
  safety_stock DECIMAL(18,4) DEFAULT 0,

  -- Dimensions
  weight_per_unit DECIMAL(18,4),
  weight_uom VARCHAR(50),

  -- Variant management
  has_variants BOOLEAN DEFAULT FALSE,
  variant_of UUID REFERENCES items(id),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_item_code UNIQUE(org_id, item_code)
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their org"
  ON items FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage items"
  ON items FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
  ));

CREATE INDEX idx_items_org ON items(org_id);
CREATE INDEX idx_items_code ON items(item_code);
CREATE INDEX idx_items_group ON items(item_group_id);
CREATE INDEX idx_items_active ON items(org_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- ITEM UOM CONVERSION
-- =====================================================
CREATE TABLE IF NOT EXISTS item_uom_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,

  uom_id UUID NOT NULL REFERENCES uoms(id),
  conversion_factor DECIMAL(18,6) NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_item_uom UNIQUE(item_id, uom_id)
);

-- =====================================================
-- BATCHES (for batch-tracked items)
-- =====================================================
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  batch_id VARCHAR(100) NOT NULL,  -- User-visible batch number
  item_id UUID NOT NULL REFERENCES items(id),

  -- Expiry
  manufacturing_date DATE,
  expiry_date DATE,

  -- Supplier info
  supplier_id UUID REFERENCES suppliers(id),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_batch_id UNIQUE(org_id, batch_id)
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view batches in their org"
  ON batches FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE INDEX idx_batches_item ON batches(item_id);
CREATE INDEX idx_batches_expiry ON batches(expiry_date) WHERE expiry_date IS NOT NULL;

-- =====================================================
-- SERIAL NUMBERS (for serialized items)
-- =====================================================
CREATE TYPE serial_status AS ENUM ('Active', 'Inactive', 'Delivered', 'Expired', 'Warranty', 'Returned');

CREATE TABLE IF NOT EXISTS serial_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  serial_no VARCHAR(100) NOT NULL,
  item_id UUID NOT NULL REFERENCES items(id),

  -- Current location
  warehouse_id UUID REFERENCES warehouses(id),
  batch_id UUID REFERENCES batches(id),

  -- Status
  status serial_status DEFAULT 'Active',

  -- Purchase info
  purchase_date DATE,
  purchase_rate DECIMAL(18,4),
  supplier_id UUID REFERENCES suppliers(id),

  -- Sale info
  delivery_date DATE,
  customer_id UUID REFERENCES customers(id),

  -- Warranty
  warranty_expiry_date DATE,
  warranty_period INTEGER,  -- Days

  -- Maintenance
  maintenance_status VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_serial_no UNIQUE(org_id, serial_no)
);

ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view serials in their org"
  ON serial_numbers FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE INDEX idx_serials_item ON serial_numbers(item_id);
CREATE INDEX idx_serials_warehouse ON serial_numbers(warehouse_id);
CREATE INDEX idx_serials_status ON serial_numbers(status);

-- =====================================================
-- STOCK LEDGER ENTRY (Immutable audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Item and Location
  item_id UUID NOT NULL REFERENCES items(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- Timing (critical for FIFO ordering)
  posting_date DATE NOT NULL,
  posting_time TIME NOT NULL DEFAULT '00:00:00',
  posting_datetime TIMESTAMPTZ NOT NULL,

  -- Quantity change
  actual_qty DECIMAL(18,4) NOT NULL,  -- +ve for in, -ve for out
  qty_after_transaction DECIMAL(18,4) NOT NULL,

  -- Valuation
  incoming_rate DECIMAL(18,4) DEFAULT 0,  -- Cost for inbound
  outgoing_rate DECIMAL(18,4) DEFAULT 0,  -- Cost for outbound
  valuation_rate DECIMAL(18,4) NOT NULL DEFAULT 0,  -- Weighted avg rate

  -- Stock value
  stock_value DECIMAL(18,4) NOT NULL DEFAULT 0,  -- qty_after × valuation_rate
  stock_value_difference DECIMAL(18,4) DEFAULT 0,  -- Change in value (for GL)

  -- FIFO/LIFO queue (JSON array of [qty, rate] pairs)
  stock_queue JSONB,

  -- Source document
  voucher_type VARCHAR(50) NOT NULL,  -- Stock Entry, Purchase Receipt, etc.
  voucher_id UUID NOT NULL,
  voucher_no VARCHAR(50) NOT NULL,
  voucher_detail_id UUID,  -- Link to line item

  -- Batch/Serial tracking
  batch_id UUID REFERENCES batches(id),
  serial_no VARCHAR(100),

  -- Flags
  is_cancelled BOOLEAN DEFAULT FALSE,

  -- Dimensions
  project_id UUID,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure immutability - entries cannot be updated or deleted
  CONSTRAINT sle_no_update CHECK (TRUE)
);

ALTER TABLE stock_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SLE in their org"
  ON stock_ledger_entries FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "System can insert SLE"
  ON stock_ledger_entries FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
  ));

-- Critical index for FIFO ordering and balance queries
CREATE INDEX idx_sle_item_warehouse_datetime
  ON stock_ledger_entries(item_id, warehouse_id, posting_datetime, created_at);
CREATE INDEX idx_sle_voucher
  ON stock_ledger_entries(voucher_type, voucher_id);
CREATE INDEX idx_sle_batch
  ON stock_ledger_entries(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_sle_org_date
  ON stock_ledger_entries(org_id, posting_date);

-- =====================================================
-- BIN (Real-time stock balance per item/warehouse)
-- =====================================================
CREATE TABLE IF NOT EXISTS bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  item_id UUID NOT NULL REFERENCES items(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- Actual on-hand qty (from latest SLE)
  actual_qty DECIMAL(18,4) DEFAULT 0,

  -- Current valuation rate
  valuation_rate DECIMAL(18,4) DEFAULT 0,
  stock_value DECIMAL(18,4) DEFAULT 0,

  -- Reserved quantities
  ordered_qty DECIMAL(18,4) DEFAULT 0,      -- Pending purchase orders
  reserved_qty DECIMAL(18,4) DEFAULT 0,     -- Reserved for sales orders
  indented_qty DECIMAL(18,4) DEFAULT 0,     -- Material requests
  planned_qty DECIMAL(18,4) DEFAULT 0,      -- Production plans
  reserved_qty_for_production DECIMAL(18,4) DEFAULT 0,

  -- Projected qty (calculated)
  -- = actual + ordered + indented + planned - reserved - reserved_for_production
  projected_qty DECIMAL(18,4) GENERATED ALWAYS AS (
    actual_qty + ordered_qty + indented_qty + planned_qty
    - reserved_qty - reserved_qty_for_production
  ) STORED,

  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_bin_item_warehouse UNIQUE(item_id, warehouse_id)
);

ALTER TABLE bins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bins in their org"
  ON bins FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE INDEX idx_bins_item ON bins(item_id);
CREATE INDEX idx_bins_warehouse ON bins(warehouse_id);
CREATE INDEX idx_bins_low_stock ON bins(org_id, actual_qty)
  WHERE actual_qty <= 0;

-- =====================================================
-- STOCK ENTRY TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_entry_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type_name VARCHAR(100) NOT NULL,
  purpose VARCHAR(50) NOT NULL,  -- Material Issue, Material Receipt, Material Transfer, Manufacture, Repack

  -- Default accounts
  add_to_transit BOOLEAN DEFAULT FALSE,

  is_active BOOLEAN DEFAULT TRUE,

  CONSTRAINT uq_stock_entry_type UNIQUE(org_id, type_name)
);

-- =====================================================
-- STOCK ENTRY (Movement document)
-- =====================================================
CREATE TYPE stock_entry_status AS ENUM ('Draft', 'Submitted', 'Cancelled');

CREATE TABLE IF NOT EXISTS stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  entry_number VARCHAR(50) NOT NULL,
  naming_series VARCHAR(20) DEFAULT 'STE',

  -- Type and purpose
  stock_entry_type_id UUID REFERENCES stock_entry_types(id),
  purpose VARCHAR(50) NOT NULL,  -- Material Issue, Receipt, Transfer, Manufacture, Repack

  -- Timing
  posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  posting_time TIME NOT NULL DEFAULT CURRENT_TIME,

  -- Simple transfer convenience fields
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),

  -- Manufacturing link
  work_order_id UUID,  -- Will reference work_orders when manufacturing module added
  bom_id UUID,         -- Will reference bill_of_materials

  -- Totals
  total_incoming_value DECIMAL(18,4) DEFAULT 0,
  total_outgoing_value DECIMAL(18,4) DEFAULT 0,
  value_difference DECIMAL(18,4) DEFAULT 0,

  -- Status
  status stock_entry_status DEFAULT 'Draft',

  -- Additional
  remarks TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  submitted_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_stock_entry_number UNIQUE(org_id, entry_number)
);

ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stock entries in their org"
  ON stock_entries FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage stock entries"
  ON stock_entries FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
  ));

CREATE INDEX idx_stock_entries_org ON stock_entries(org_id);
CREATE INDEX idx_stock_entries_date ON stock_entries(posting_date);
CREATE INDEX idx_stock_entries_status ON stock_entries(status);

-- Auto-generate entry number
CREATE OR REPLACE FUNCTION generate_stock_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  next_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(NEW.posting_date, 'YY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(entry_number FROM 'STE-' || year_suffix || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM stock_entries
  WHERE org_id = NEW.org_id
    AND entry_number LIKE 'STE-' || year_suffix || '-%';

  NEW.entry_number := 'STE-' || year_suffix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_entry_number
  BEFORE INSERT ON stock_entries
  FOR EACH ROW
  WHEN (NEW.entry_number IS NULL)
  EXECUTE FUNCTION generate_stock_entry_number();

-- =====================================================
-- STOCK ENTRY ITEMS (Detail rows)
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_entry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_entry_id UUID NOT NULL REFERENCES stock_entries(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  -- Item
  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),

  -- Warehouses
  s_warehouse_id UUID REFERENCES warehouses(id),  -- Source
  t_warehouse_id UUID REFERENCES warehouses(id),  -- Target

  -- Quantity
  qty DECIMAL(18,4) NOT NULL,
  uom_id UUID REFERENCES uoms(id),
  conversion_factor DECIMAL(18,6) DEFAULT 1,
  stock_uom_qty DECIMAL(18,4),  -- qty in stock UOM

  -- Valuation
  basic_rate DECIMAL(18,4) DEFAULT 0,  -- Cost/rate
  basic_amount DECIMAL(18,4) DEFAULT 0,  -- qty × rate
  valuation_rate DECIMAL(18,4) DEFAULT 0,

  -- For transfers with costs
  additional_cost DECIMAL(18,4) DEFAULT 0,

  -- Batch/Serial
  batch_id UUID REFERENCES batches(id),
  serial_no TEXT,  -- Comma-separated for multiple

  -- Manufacturing
  is_finished_item BOOLEAN DEFAULT FALSE,
  is_scrap_item BOOLEAN DEFAULT FALSE,

  -- Expense account (for consumption)
  expense_account_id UUID REFERENCES accounts(id),

  -- Dimensions
  cost_center_id UUID REFERENCES cost_centers(id),
  project_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_entry_items_entry ON stock_entry_items(stock_entry_id);
CREATE INDEX idx_stock_entry_items_item ON stock_entry_items(item_id);

-- =====================================================
-- STOCK RECONCILIATION
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  reconciliation_number VARCHAR(50) NOT NULL,

  -- Timing
  posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  posting_time TIME NOT NULL DEFAULT CURRENT_TIME,

  -- Purpose
  purpose VARCHAR(100) DEFAULT 'Stock Reconciliation',

  -- Status
  status stock_entry_status DEFAULT 'Draft',

  -- Totals
  total_difference_value DECIMAL(18,4) DEFAULT 0,

  -- Additional
  remarks TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_reconciliation_number UNIQUE(org_id, reconciliation_number)
);

ALTER TABLE stock_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliations in their org"
  ON stock_reconciliations FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =====================================================
-- STOCK RECONCILIATION ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_reconciliation_id UUID NOT NULL REFERENCES stock_reconciliations(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  -- Item and location
  item_id UUID NOT NULL REFERENCES items(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- System vs Physical
  current_qty DECIMAL(18,4) DEFAULT 0,
  current_valuation_rate DECIMAL(18,4) DEFAULT 0,
  qty DECIMAL(18,4),  -- New physical count
  valuation_rate DECIMAL(18,4),  -- New rate

  -- Differences (calculated)
  quantity_difference DECIMAL(18,4) GENERATED ALWAYS AS (
    COALESCE(qty, 0) - current_qty
  ) STORED,
  amount_difference DECIMAL(18,4) GENERATED ALWAYS AS (
    COALESCE(qty * valuation_rate, 0) - (current_qty * current_valuation_rate)
  ) STORED,

  -- Batch/Serial
  batch_id UUID REFERENCES batches(id),
  serial_no TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recon_items_recon ON stock_reconciliation_items(stock_reconciliation_id);
CREATE INDEX idx_recon_items_item ON stock_reconciliation_items(item_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current stock balance for item/warehouse
CREATE OR REPLACE FUNCTION get_stock_balance(
  p_item_id UUID,
  p_warehouse_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  qty DECIMAL,
  valuation_rate DECIMAL,
  stock_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sle.qty_after_transaction,
    sle.valuation_rate,
    sle.stock_value
  FROM stock_ledger_entries sle
  WHERE sle.item_id = p_item_id
    AND sle.warehouse_id = p_warehouse_id
    AND sle.posting_date <= p_as_of_date
    AND sle.is_cancelled = FALSE
  ORDER BY sle.posting_datetime DESC, sle.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL, 0::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Get FIFO queue for item/warehouse
CREATE OR REPLACE FUNCTION get_fifo_queue(
  p_item_id UUID,
  p_warehouse_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_queue JSONB;
BEGIN
  SELECT stock_queue INTO v_queue
  FROM stock_ledger_entries
  WHERE item_id = p_item_id
    AND warehouse_id = p_warehouse_id
    AND is_cancelled = FALSE
  ORDER BY posting_datetime DESC, created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_queue, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Update bin from latest SLE
CREATE OR REPLACE FUNCTION update_bin_from_sle()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bins (org_id, item_id, warehouse_id, actual_qty, valuation_rate, stock_value, updated_at)
  VALUES (
    NEW.org_id,
    NEW.item_id,
    NEW.warehouse_id,
    NEW.qty_after_transaction,
    NEW.valuation_rate,
    NEW.stock_value,
    NOW()
  )
  ON CONFLICT (item_id, warehouse_id)
  DO UPDATE SET
    actual_qty = EXCLUDED.actual_qty,
    valuation_rate = EXCLUDED.valuation_rate,
    stock_value = EXCLUDED.stock_value,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bin_on_sle
  AFTER INSERT ON stock_ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_bin_from_sle();

-- Get all warehouses stock for an item
CREATE OR REPLACE FUNCTION get_item_stock_summary(
  p_org_id UUID,
  p_item_id UUID
)
RETURNS TABLE(
  warehouse_id UUID,
  warehouse_name VARCHAR,
  actual_qty DECIMAL,
  reserved_qty DECIMAL,
  available_qty DECIMAL,
  valuation_rate DECIMAL,
  stock_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.warehouse_id,
    w.warehouse_name,
    b.actual_qty,
    b.reserved_qty,
    (b.actual_qty - b.reserved_qty) as available_qty,
    b.valuation_rate,
    b.stock_value
  FROM bins b
  JOIN warehouses w ON w.id = b.warehouse_id
  WHERE b.org_id = p_org_id
    AND b.item_id = p_item_id
    AND b.actual_qty != 0
  ORDER BY w.warehouse_name;
END;
$$ LANGUAGE plpgsql;

-- Check for negative stock
CREATE OR REPLACE FUNCTION check_negative_stock(
  p_item_id UUID,
  p_warehouse_id UUID,
  p_qty_change DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_qty DECIMAL;
BEGIN
  SELECT COALESCE(actual_qty, 0) INTO v_current_qty
  FROM bins
  WHERE item_id = p_item_id AND warehouse_id = p_warehouse_id;

  IF v_current_qty IS NULL THEN
    v_current_qty := 0;
  END IF;

  -- Return TRUE if stock would go negative
  RETURN (v_current_qty + p_qty_change) < 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DEFAULT STOCK ENTRY TYPES
-- =====================================================
CREATE OR REPLACE FUNCTION seed_stock_entry_types(p_org_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO stock_entry_types (org_id, type_name, purpose, add_to_transit)
  VALUES
    (p_org_id, 'Material Issue', 'Material Issue', FALSE),
    (p_org_id, 'Material Receipt', 'Material Receipt', FALSE),
    (p_org_id, 'Material Transfer', 'Material Transfer', FALSE),
    (p_org_id, 'Material Transfer for Manufacture', 'Material Transfer', TRUE),
    (p_org_id, 'Manufacture', 'Manufacture', FALSE),
    (p_org_id, 'Repack', 'Repack', FALSE),
    (p_org_id, 'Send to Subcontractor', 'Material Transfer', TRUE)
  ON CONFLICT (org_id, type_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DEFAULT UOMS
-- =====================================================
CREATE OR REPLACE FUNCTION seed_default_uoms(p_org_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO uoms (org_id, uom_name, must_be_whole_number)
  VALUES
    (p_org_id, 'Unit', TRUE),
    (p_org_id, 'Piece', TRUE),
    (p_org_id, 'Box', TRUE),
    (p_org_id, 'Pack', TRUE),
    (p_org_id, 'Dozen', TRUE),
    (p_org_id, 'Kilogram', FALSE),
    (p_org_id, 'Gram', FALSE),
    (p_org_id, 'Liter', FALSE),
    (p_org_id, 'Milliliter', FALSE),
    (p_org_id, 'Meter', FALSE),
    (p_org_id, 'Centimeter', FALSE),
    (p_org_id, 'Square Meter', FALSE),
    (p_org_id, 'Cubic Meter', FALSE),
    (p_org_id, 'Hour', FALSE),
    (p_org_id, 'Day', FALSE)
  ON CONFLICT (org_id, uom_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
