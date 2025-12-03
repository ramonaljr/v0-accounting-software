-- =====================================================
-- Manufacturing Module Schema
-- Based on ERPNext Manufacturing Module
-- =====================================================

-- =====================================================
-- OPERATIONS (Master data for manufacturing steps)
-- =====================================================
CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  operation_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Default workstation
  default_workstation_id UUID,  -- Will reference workstations

  -- Configuration
  batch_size INTEGER DEFAULT 1,
  create_job_card_based_on_batch_size BOOLEAN DEFAULT FALSE,
  is_corrective_operation BOOLEAN DEFAULT FALSE,

  -- Timing
  total_operation_time DECIMAL(18,4) DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_operation_name UNIQUE(org_id, operation_name)
);

ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operations in their org"
  ON operations FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =====================================================
-- WORKSTATION TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS workstation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type_name VARCHAR(100) NOT NULL,
  description TEXT,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_workstation_type UNIQUE(org_id, type_name)
);

ALTER TABLE workstation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workstation types in their org"
  ON workstation_types FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- =====================================================
-- WORKSTATIONS (Production resources)
-- =====================================================
CREATE TYPE workstation_status AS ENUM ('Production', 'Off', 'Idle', 'Problem', 'Maintenance', 'Setup');

CREATE TABLE IF NOT EXISTS workstations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  workstation_name VARCHAR(255) NOT NULL,
  workstation_type_id UUID REFERENCES workstation_types(id),
  description TEXT,

  -- Capacity
  production_capacity INTEGER DEFAULT 1,  -- Parallel job cards allowed

  -- Location
  warehouse_id UUID REFERENCES warehouses(id),

  -- Status
  status workstation_status DEFAULT 'Idle',
  is_disabled BOOLEAN DEFAULT FALSE,

  -- Costs (PHP per hour)
  hour_rate DECIMAL(18,4) DEFAULT 0,
  electricity_cost DECIMAL(18,4) DEFAULT 0,
  consumable_cost DECIMAL(18,4) DEFAULT 0,
  rent_cost DECIMAL(18,4) DEFAULT 0,
  wages_cost DECIMAL(18,4) DEFAULT 0,

  -- Working hours
  working_hours_per_day DECIMAL(8,2) DEFAULT 8,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_workstation_name UNIQUE(org_id, workstation_name)
);

ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workstations in their org"
  ON workstations FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Add foreign key to operations
ALTER TABLE operations
  ADD CONSTRAINT fk_operations_workstation
  FOREIGN KEY (default_workstation_id) REFERENCES workstations(id);

CREATE INDEX idx_workstations_org ON workstations(org_id);
CREATE INDEX idx_workstations_type ON workstations(workstation_type_id);

-- =====================================================
-- ROUTING (Reusable operation sequences)
-- =====================================================
CREATE TABLE IF NOT EXISTS routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  routing_name VARCHAR(255) NOT NULL,
  description TEXT,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_routing_name UNIQUE(org_id, routing_name)
);

-- Routing operations (child table)
CREATE TABLE IF NOT EXISTS routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  operation_id UUID NOT NULL REFERENCES operations(id),
  sequence_id INTEGER NOT NULL,

  workstation_id UUID REFERENCES workstations(id),
  workstation_type_id UUID REFERENCES workstation_types(id),

  time_in_mins DECIMAL(18,4) NOT NULL DEFAULT 0,
  fixed_time BOOLEAN DEFAULT FALSE,  -- Time doesn't scale with quantity
  hour_rate DECIMAL(18,4) DEFAULT 0,

  batch_size INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_ops_routing ON routing_operations(routing_id);

-- =====================================================
-- BILL OF MATERIALS (BOM)
-- =====================================================
CREATE TYPE bom_status AS ENUM ('Draft', 'Active', 'Inactive');

CREATE TABLE IF NOT EXISTS boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  bom_number VARCHAR(50) NOT NULL,

  -- Product
  item_id UUID NOT NULL REFERENCES items(id),
  quantity DECIMAL(18,4) NOT NULL DEFAULT 1,  -- Qty of FG produced

  -- Status
  status bom_status DEFAULT 'Draft',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Configuration
  with_operations BOOLEAN DEFAULT FALSE,
  is_phantom_bom BOOLEAN DEFAULT FALSE,  -- Virtual assembly
  track_semi_finished_goods BOOLEAN DEFAULT FALSE,
  allow_alternative_item BOOLEAN DEFAULT FALSE,

  -- Process loss
  process_loss_percentage DECIMAL(8,4) DEFAULT 0,
  process_loss_qty DECIMAL(18,4) DEFAULT 0,

  -- Routing
  routing_id UUID REFERENCES routings(id),

  -- Warehouses
  source_warehouse_id UUID REFERENCES warehouses(id),
  wip_warehouse_id UUID REFERENCES warehouses(id),
  fg_warehouse_id UUID REFERENCES warehouses(id),
  scrap_warehouse_id UUID REFERENCES warehouses(id),

  -- Transfer settings
  transfer_material_against VARCHAR(20) DEFAULT 'Work Order',  -- Work Order or Job Card

  -- Costs (calculated, read-only)
  raw_material_cost DECIMAL(18,4) DEFAULT 0,
  operating_cost DECIMAL(18,4) DEFAULT 0,
  scrap_material_cost DECIMAL(18,4) DEFAULT 0,
  total_cost DECIMAL(18,4) DEFAULT 0,

  -- Currency
  currency VARCHAR(3) DEFAULT 'PHP',
  conversion_rate DECIMAL(18,6) DEFAULT 1,

  -- Additional
  description TEXT,
  inspection_required BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_bom_number UNIQUE(org_id, bom_number)
);

ALTER TABLE boms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view BOMs in their org"
  ON boms FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage BOMs"
  ON boms FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
  ));

CREATE INDEX idx_boms_org ON boms(org_id);
CREATE INDEX idx_boms_item ON boms(item_id);
CREATE INDEX idx_boms_default ON boms(item_id, is_default) WHERE is_default = TRUE;

-- Auto-generate BOM number
CREATE OR REPLACE FUNCTION generate_bom_number()
RETURNS TRIGGER AS $$
DECLARE
  item_code VARCHAR;
  next_num INTEGER;
BEGIN
  SELECT i.item_code INTO item_code
  FROM items i WHERE i.id = NEW.item_id;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(bom_number FROM 'BOM-' || item_code || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM boms
  WHERE org_id = NEW.org_id
    AND bom_number LIKE 'BOM-' || item_code || '-%';

  NEW.bom_number := 'BOM-' || item_code || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bom_number
  BEFORE INSERT ON boms
  FOR EACH ROW
  WHEN (NEW.bom_number IS NULL)
  EXECUTE FUNCTION generate_bom_number();

-- =====================================================
-- BOM ITEMS (Raw materials/components)
-- =====================================================
CREATE TABLE IF NOT EXISTS bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  -- Item
  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),

  -- Quantity
  qty DECIMAL(18,4) NOT NULL,
  uom_id UUID REFERENCES uoms(id),
  stock_qty DECIMAL(18,4),
  stock_uom VARCHAR(50),

  -- Cost
  rate DECIMAL(18,4) DEFAULT 0,
  amount DECIMAL(18,4) DEFAULT 0,
  base_rate DECIMAL(18,4) DEFAULT 0,
  base_amount DECIMAL(18,4) DEFAULT 0,

  -- Sub-assembly
  bom_no UUID REFERENCES boms(id),  -- Reference to sub-assembly BOM
  do_not_explode BOOLEAN DEFAULT FALSE,
  is_sub_assembly_item BOOLEAN DEFAULT FALSE,
  is_phantom_item BOOLEAN DEFAULT FALSE,

  -- Operation link (when to consume)
  operation_id UUID REFERENCES operations(id),
  operation_row_id INTEGER,

  -- Warehouse
  source_warehouse_id UUID REFERENCES warehouses(id),

  -- Flags
  allow_alternative_item BOOLEAN DEFAULT FALSE,
  include_item_in_manufacturing BOOLEAN DEFAULT TRUE,
  sourced_by_supplier BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_item ON bom_items(item_id);

-- =====================================================
-- BOM OPERATIONS (Manufacturing steps)
-- =====================================================
CREATE TABLE IF NOT EXISTS bom_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  operation_id UUID NOT NULL REFERENCES operations(id),
  sequence_id INTEGER NOT NULL,

  workstation_id UUID REFERENCES workstations(id),
  workstation_type_id UUID REFERENCES workstation_types(id),

  -- Timing
  time_in_mins DECIMAL(18,4) NOT NULL DEFAULT 0,
  fixed_time BOOLEAN DEFAULT FALSE,
  batch_size INTEGER DEFAULT 1,

  -- Cost
  hour_rate DECIMAL(18,4) DEFAULT 0,
  operating_cost DECIMAL(18,4) DEFAULT 0,
  base_hour_rate DECIMAL(18,4) DEFAULT 0,
  base_operating_cost DECIMAL(18,4) DEFAULT 0,

  -- Semi-finished goods
  finished_good_id UUID REFERENCES items(id),
  finished_good_qty DECIMAL(18,4),
  finished_good_bom_id UUID REFERENCES boms(id),
  is_final_finished_good BOOLEAN DEFAULT FALSE,

  -- Configuration
  is_subcontracted BOOLEAN DEFAULT FALSE,
  skip_material_transfer BOOLEAN DEFAULT FALSE,
  backflush_from_wip_warehouse BOOLEAN DEFAULT FALSE,

  -- Warehouses
  source_warehouse_id UUID REFERENCES warehouses(id),
  wip_warehouse_id UUID REFERENCES warehouses(id),
  fg_warehouse_id UUID REFERENCES warehouses(id),

  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_ops_bom ON bom_operations(bom_id);
CREATE INDEX idx_bom_ops_sequence ON bom_operations(bom_id, sequence_id);

-- =====================================================
-- BOM SCRAP ITEMS (Waste/by-products)
-- =====================================================
CREATE TABLE IF NOT EXISTS bom_scrap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,

  stock_qty DECIMAL(18,4) NOT NULL,
  stock_uom VARCHAR(50),

  -- Value (positive = recoverable, negative = disposal cost)
  rate DECIMAL(18,4) DEFAULT 0,
  amount DECIMAL(18,4) DEFAULT 0,
  base_rate DECIMAL(18,4) DEFAULT 0,
  base_amount DECIMAL(18,4) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_scrap_bom ON bom_scrap_items(bom_id);

-- =====================================================
-- BOM EXPLODED ITEMS (Flattened multi-level BOM)
-- =====================================================
CREATE TABLE IF NOT EXISTS bom_exploded_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,

  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,

  qty DECIMAL(18,4) NOT NULL,
  stock_qty DECIMAL(18,4),
  stock_uom VARCHAR(50),

  rate DECIMAL(18,4) DEFAULT 0,
  amount DECIMAL(18,4) DEFAULT 0,

  -- Source tracking
  source_bom_id UUID REFERENCES boms(id),
  bom_level INTEGER DEFAULT 0,

  include_item_in_manufacturing BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_exploded_bom ON bom_exploded_items(bom_id);

-- =====================================================
-- WORK ORDER (Production order)
-- =====================================================
CREATE TYPE work_order_status AS ENUM (
  'Draft',
  'Submitted',
  'Not Started',
  'In Process',
  'Stock Reserved',
  'Stock Partially Reserved',
  'Completed',
  'Stopped',
  'Closed',
  'Cancelled'
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  work_order_number VARCHAR(50) NOT NULL,
  naming_series VARCHAR(20) DEFAULT 'WO',

  -- Production
  production_item_id UUID NOT NULL REFERENCES items(id),
  item_name VARCHAR(255),
  qty DECIMAL(18,4) NOT NULL,
  stock_uom VARCHAR(50),

  -- BOM
  bom_id UUID NOT NULL REFERENCES boms(id),
  use_multi_level_bom BOOLEAN DEFAULT TRUE,

  -- Status
  status work_order_status DEFAULT 'Draft',

  -- Warehouses
  source_warehouse_id UUID REFERENCES warehouses(id),
  wip_warehouse_id UUID REFERENCES warehouses(id),
  fg_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  scrap_warehouse_id UUID REFERENCES warehouses(id),

  -- Progress
  material_transferred_for_manufacturing DECIMAL(18,4) DEFAULT 0,
  produced_qty DECIMAL(18,4) DEFAULT 0,
  process_loss_qty DECIMAL(18,4) DEFAULT 0,
  max_producible_qty DECIMAL(18,4),

  -- Timing
  planned_start_date TIMESTAMPTZ NOT NULL,
  planned_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  expected_delivery_date DATE,
  lead_time DECIMAL(18,4),

  -- Costs
  planned_operating_cost DECIMAL(18,4) DEFAULT 0,
  actual_operating_cost DECIMAL(18,4) DEFAULT 0,
  additional_operating_cost DECIMAL(18,4) DEFAULT 0,
  corrective_operation_cost DECIMAL(18,4) DEFAULT 0,
  total_operating_cost DECIMAL(18,4) DEFAULT 0,

  -- Configuration
  skip_transfer BOOLEAN DEFAULT FALSE,
  from_wip_warehouse BOOLEAN DEFAULT FALSE,
  allow_alternative_item BOOLEAN DEFAULT FALSE,
  reserve_stock BOOLEAN DEFAULT FALSE,
  track_semi_finished_goods BOOLEAN DEFAULT FALSE,
  transfer_material_against VARCHAR(20) DEFAULT 'Work Order',

  -- References
  sales_order_id UUID,  -- Will reference sales_orders
  production_plan_id UUID,  -- Will reference production_plans
  material_request_id UUID,  -- Will reference material_requests

  -- Additional
  remarks TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  submitted_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_work_order_number UNIQUE(org_id, work_order_number)
);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work orders in their org"
  ON work_orders FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage work orders"
  ON work_orders FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'accountant', 'staff')
  ));

CREATE INDEX idx_work_orders_org ON work_orders(org_id);
CREATE INDEX idx_work_orders_item ON work_orders(production_item_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_date ON work_orders(planned_start_date);

-- Auto-generate work order number
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  next_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(NEW.planned_start_date, 'YY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(work_order_number FROM 'WO-' || year_suffix || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM work_orders
  WHERE org_id = NEW.org_id
    AND work_order_number LIKE 'WO-' || year_suffix || '-%';

  NEW.work_order_number := 'WO-' || year_suffix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_work_order_number
  BEFORE INSERT ON work_orders
  FOR EACH ROW
  WHEN (NEW.work_order_number IS NULL)
  EXECUTE FUNCTION generate_work_order_number();

-- =====================================================
-- WORK ORDER ITEMS (Required materials)
-- =====================================================
CREATE TABLE IF NOT EXISTS work_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  -- Item
  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),

  -- Quantities
  required_qty DECIMAL(18,4) NOT NULL,
  stock_uom VARCHAR(50),
  transferred_qty DECIMAL(18,4) DEFAULT 0,
  consumed_qty DECIMAL(18,4) DEFAULT 0,
  returned_qty DECIMAL(18,4) DEFAULT 0,

  -- Stock availability (read-only)
  available_qty_at_source DECIMAL(18,4) DEFAULT 0,
  available_qty_at_wip DECIMAL(18,4) DEFAULT 0,
  stock_reserved_qty DECIMAL(18,4) DEFAULT 0,

  -- Warehouse
  source_warehouse_id UUID REFERENCES warehouses(id),

  -- Operation link
  operation_id UUID REFERENCES operations(id),

  -- Cost
  rate DECIMAL(18,4) DEFAULT 0,
  amount DECIMAL(18,4) DEFAULT 0,

  -- Flags
  allow_alternative_item BOOLEAN DEFAULT FALSE,
  include_item_in_manufacturing BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_items_wo ON work_order_items(work_order_id);
CREATE INDEX idx_wo_items_item ON work_order_items(item_id);

-- =====================================================
-- WORK ORDER OPERATIONS
-- =====================================================
CREATE TYPE wo_operation_status AS ENUM ('Pending', 'Work in Progress', 'Completed');

CREATE TABLE IF NOT EXISTS work_order_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  operation_id UUID NOT NULL REFERENCES operations(id),
  operation_name VARCHAR(255),
  sequence_id INTEGER NOT NULL,

  -- Status
  status wo_operation_status DEFAULT 'Pending',

  -- Progress
  completed_qty DECIMAL(18,4) DEFAULT 0,
  process_loss_qty DECIMAL(18,4) DEFAULT 0,

  -- Workstation
  workstation_id UUID REFERENCES workstations(id),
  workstation_type_id UUID REFERENCES workstation_types(id),

  -- Semi-finished goods
  finished_good_id UUID REFERENCES items(id),
  bom_id UUID REFERENCES boms(id),

  -- Timing
  time_in_mins DECIMAL(18,4) DEFAULT 0,
  planned_start_time TIMESTAMPTZ,
  planned_end_time TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  actual_operation_time DECIMAL(18,4) DEFAULT 0,

  -- Cost
  hour_rate DECIMAL(18,4) DEFAULT 0,
  planned_operating_cost DECIMAL(18,4) DEFAULT 0,
  actual_operating_cost DECIMAL(18,4) DEFAULT 0,

  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_ops_wo ON work_order_operations(work_order_id);
CREATE INDEX idx_wo_ops_sequence ON work_order_operations(work_order_id, sequence_id);

-- =====================================================
-- JOB CARD (Operation-level work tracking)
-- =====================================================
CREATE TYPE job_card_status AS ENUM (
  'Open',
  'Work in Progress',
  'Material Transferred',
  'On Hold',
  'Submitted',
  'Completed',
  'Cancelled'
);

CREATE TABLE IF NOT EXISTS job_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  job_card_number VARCHAR(50) NOT NULL,

  -- References
  work_order_id UUID NOT NULL REFERENCES work_orders(id),
  operation_id UUID NOT NULL REFERENCES operations(id),
  work_order_operation_id UUID REFERENCES work_order_operations(id),

  -- Production
  production_item_id UUID REFERENCES items(id),
  for_quantity DECIMAL(18,4) NOT NULL,  -- Qty to process

  -- Semi-finished goods
  finished_good_id UUID REFERENCES items(id),

  -- Status
  status job_card_status DEFAULT 'Open',

  -- Workstation
  workstation_id UUID REFERENCES workstations(id),
  workstation_type_id UUID REFERENCES workstation_types(id),

  -- Timing
  expected_start_date TIMESTAMPTZ,
  expected_end_date TIMESTAMPTZ,
  started_time TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  total_time_in_mins DECIMAL(18,4) DEFAULT 0,

  -- Progress
  manufactured_qty DECIMAL(18,4) DEFAULT 0,
  transferred_qty DECIMAL(18,4) DEFAULT 0,
  total_completed_qty DECIMAL(18,4) DEFAULT 0,
  process_loss_qty DECIMAL(18,4) DEFAULT 0,

  -- Cost
  hour_rate DECIMAL(18,4) DEFAULT 0,

  -- Material handling
  skip_material_transfer BOOLEAN DEFAULT FALSE,
  backflush_from_wip_warehouse BOOLEAN DEFAULT FALSE,
  source_warehouse_id UUID REFERENCES warehouses(id),
  wip_warehouse_id UUID REFERENCES warehouses(id),
  target_warehouse_id UUID REFERENCES warehouses(id),

  -- Configuration
  is_subcontracted BOOLEAN DEFAULT FALSE,

  remarks TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,

  CONSTRAINT uq_job_card_number UNIQUE(org_id, job_card_number)
);

ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view job cards in their org"
  ON job_cards FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE INDEX idx_job_cards_org ON job_cards(org_id);
CREATE INDEX idx_job_cards_wo ON job_cards(work_order_id);
CREATE INDEX idx_job_cards_status ON job_cards(status);

-- Auto-generate job card number
CREATE OR REPLACE FUNCTION generate_job_card_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  next_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(job_card_number FROM 'JC-' || year_suffix || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM job_cards
  WHERE org_id = NEW.org_id
    AND job_card_number LIKE 'JC-' || year_suffix || '-%';

  NEW.job_card_number := 'JC-' || year_suffix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_job_card_number
  BEFORE INSERT ON job_cards
  FOR EACH ROW
  WHEN (NEW.job_card_number IS NULL)
  EXECUTE FUNCTION generate_job_card_number();

-- =====================================================
-- JOB CARD TIME LOGS (Worker hours)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_card_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  from_time TIMESTAMPTZ NOT NULL,
  to_time TIMESTAMPTZ,

  time_in_mins DECIMAL(18,4) DEFAULT 0,
  completed_qty DECIMAL(18,4) DEFAULT 0,

  employee_id UUID,  -- Will reference employees when HR module added
  employee_name VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jc_time_logs_jc ON job_card_time_logs(job_card_id);

-- =====================================================
-- JOB CARD ITEMS (Material consumption per job card)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),

  required_qty DECIMAL(18,4) NOT NULL,
  transferred_qty DECIMAL(18,4) DEFAULT 0,
  consumed_qty DECIMAL(18,4) DEFAULT 0,

  stock_uom VARCHAR(50),

  source_warehouse_id UUID REFERENCES warehouses(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jc_items_jc ON job_card_items(job_card_id);

-- =====================================================
-- JOB CARD SCRAP ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS job_card_scrap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,

  stock_qty DECIMAL(18,4) NOT NULL,
  stock_uom VARCHAR(50),

  rate DECIMAL(18,4) DEFAULT 0,
  amount DECIMAL(18,4) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jc_scrap_jc ON job_card_scrap_items(job_card_id);

-- =====================================================
-- PRODUCTION PLAN (MRP Planning)
-- =====================================================
CREATE TYPE production_plan_status AS ENUM (
  'Draft',
  'Submitted',
  'In Process',
  'Completed',
  'Closed',
  'Cancelled'
);

CREATE TABLE IF NOT EXISTS production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Naming
  plan_number VARCHAR(50) NOT NULL,

  -- Timing
  posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  from_date DATE,
  to_date DATE,
  from_delivery_date DATE,
  to_delivery_date DATE,

  -- Status
  status production_plan_status DEFAULT 'Draft',

  -- Source configuration
  get_items_from VARCHAR(50) DEFAULT 'Sales Order',  -- Sales Order or Material Request

  -- Filters
  customer_id UUID REFERENCES customers(id),
  item_id UUID REFERENCES items(id),
  warehouse_id UUID REFERENCES warehouses(id),
  sub_assembly_warehouse_id UUID REFERENCES warehouses(id),

  -- Configuration
  combine_items BOOLEAN DEFAULT TRUE,
  include_non_stock_items BOOLEAN DEFAULT FALSE,
  include_safety_stock BOOLEAN DEFAULT FALSE,
  include_subcontracted_items BOOLEAN DEFAULT FALSE,
  skip_available_sub_assembly_item BOOLEAN DEFAULT FALSE,
  consider_minimum_order_qty BOOLEAN DEFAULT FALSE,
  ignore_existing_ordered_qty BOOLEAN DEFAULT FALSE,
  reserve_stock BOOLEAN DEFAULT FALSE,

  -- Totals
  total_planned_qty DECIMAL(18,4) DEFAULT 0,
  total_produced_qty DECIMAL(18,4) DEFAULT 0,

  remarks TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_production_plan_number UNIQUE(org_id, plan_number)
);

ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view production plans in their org"
  ON production_plans FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE INDEX idx_production_plans_org ON production_plans(org_id);
CREATE INDEX idx_production_plans_status ON production_plans(status);

-- Auto-generate production plan number
CREATE OR REPLACE FUNCTION generate_production_plan_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  next_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(NEW.posting_date, 'YY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(plan_number FROM 'PP-' || year_suffix || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM production_plans
  WHERE org_id = NEW.org_id
    AND plan_number LIKE 'PP-' || year_suffix || '-%';

  NEW.plan_number := 'PP-' || year_suffix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_production_plan_number
  BEFORE INSERT ON production_plans
  FOR EACH ROW
  WHEN (NEW.plan_number IS NULL)
  EXECUTE FUNCTION generate_production_plan_number();

-- =====================================================
-- PRODUCTION PLAN ITEMS (Items to manufacture)
-- =====================================================
CREATE TABLE IF NOT EXISTS production_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_plan_id UUID NOT NULL REFERENCES production_plans(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  -- Item
  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),

  bom_id UUID REFERENCES boms(id),

  -- Quantities
  planned_qty DECIMAL(18,4) NOT NULL,
  pending_qty DECIMAL(18,4) DEFAULT 0,
  ordered_qty DECIMAL(18,4) DEFAULT 0,
  produced_qty DECIMAL(18,4) DEFAULT 0,

  stock_uom VARCHAR(50),

  -- Warehouse
  warehouse_id UUID REFERENCES warehouses(id),

  -- Timing
  planned_start_date DATE,
  expected_delivery_date DATE,

  -- Source reference
  sales_order_id UUID,  -- Will reference sales_orders
  sales_order_item_id UUID,
  material_request_id UUID,

  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pp_items_pp ON production_plan_items(production_plan_id);

-- =====================================================
-- PRODUCTION PLAN SUB-ASSEMBLY ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS production_plan_sub_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_plan_id UUID NOT NULL REFERENCES production_plans(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  -- Item
  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),

  bom_id UUID REFERENCES boms(id),
  bom_level INTEGER DEFAULT 0,

  -- Quantities
  qty DECIMAL(18,4) NOT NULL,
  ordered_qty DECIMAL(18,4) DEFAULT 0,
  received_qty DECIMAL(18,4) DEFAULT 0,

  stock_uom VARCHAR(50),

  -- Warehouse
  fg_warehouse_id UUID REFERENCES warehouses(id),

  -- Manufacturing type
  type_of_manufacturing VARCHAR(50) DEFAULT 'In House',  -- In House, Subcontract, Material Request

  -- Supplier (for subcontract)
  supplier_id UUID REFERENCES suppliers(id),

  -- Timing
  schedule_date DATE,

  -- Parent reference
  parent_item_id UUID REFERENCES items(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pp_sub_pp ON production_plan_sub_assemblies(production_plan_id);

-- =====================================================
-- PRODUCTION PLAN MATERIAL REQUIREMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS production_plan_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_plan_id UUID NOT NULL REFERENCES production_plans(id) ON DELETE CASCADE,
  idx INTEGER DEFAULT 0,

  -- Item
  item_id UUID NOT NULL REFERENCES items(id),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255),

  -- Quantities
  required_qty DECIMAL(18,4) NOT NULL,
  available_qty DECIMAL(18,4) DEFAULT 0,
  ordered_qty DECIMAL(18,4) DEFAULT 0,
  to_order_qty DECIMAL(18,4) DEFAULT 0,

  stock_uom VARCHAR(50),

  -- Warehouse
  warehouse_id UUID REFERENCES warehouses(id),

  -- Material request type
  material_request_type VARCHAR(50) DEFAULT 'Purchase',  -- Purchase, Manufacture, Transfer

  -- Source reference
  from_bom_id UUID REFERENCES boms(id),
  main_item_id UUID REFERENCES items(id),
  sub_assembly_item_id UUID REFERENCES items(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pp_materials_pp ON production_plan_materials(production_plan_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get default BOM for an item
CREATE OR REPLACE FUNCTION get_default_bom(p_item_id UUID)
RETURNS UUID AS $$
DECLARE
  v_bom_id UUID;
BEGIN
  SELECT id INTO v_bom_id
  FROM boms
  WHERE item_id = p_item_id
    AND is_default = TRUE
    AND is_active = TRUE
    AND status = 'Active'
  LIMIT 1;

  RETURN v_bom_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate BOM cost
CREATE OR REPLACE FUNCTION calculate_bom_cost(p_bom_id UUID)
RETURNS TABLE(
  raw_material_cost DECIMAL,
  operating_cost DECIMAL,
  scrap_material_cost DECIMAL,
  total_cost DECIMAL
) AS $$
DECLARE
  v_rm_cost DECIMAL := 0;
  v_op_cost DECIMAL := 0;
  v_scrap_cost DECIMAL := 0;
BEGIN
  -- Raw material cost
  SELECT COALESCE(SUM(amount), 0) INTO v_rm_cost
  FROM bom_items WHERE bom_id = p_bom_id;

  -- Operating cost
  SELECT COALESCE(SUM(operating_cost), 0) INTO v_op_cost
  FROM bom_operations WHERE bom_id = p_bom_id;

  -- Scrap cost (could be negative for recoverable scrap)
  SELECT COALESCE(SUM(amount), 0) INTO v_scrap_cost
  FROM bom_scrap_items WHERE bom_id = p_bom_id;

  RETURN QUERY SELECT v_rm_cost, v_op_cost, v_scrap_cost, (v_rm_cost + v_op_cost + v_scrap_cost);
END;
$$ LANGUAGE plpgsql;

-- Update work order status based on progress
CREATE OR REPLACE FUNCTION update_work_order_status()
RETURNS TRIGGER AS $$
DECLARE
  v_status work_order_status;
  v_over_production_pct DECIMAL := 10;  -- Allow 10% over-production
BEGIN
  -- Calculate new status
  IF NEW.produced_qty >= NEW.qty * (1 - v_over_production_pct / 100) THEN
    v_status := 'Completed';
  ELSIF NEW.produced_qty > 0 OR NEW.material_transferred_for_manufacturing > 0 THEN
    v_status := 'In Process';
  ELSIF NEW.status = 'Submitted' THEN
    v_status := 'Not Started';
  ELSE
    v_status := NEW.status;
  END IF;

  -- Only update if changed
  IF v_status != NEW.status AND NEW.status NOT IN ('Stopped', 'Closed', 'Cancelled') THEN
    NEW.status := v_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_wo_status
  BEFORE UPDATE OF produced_qty, material_transferred_for_manufacturing ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_work_order_status();
