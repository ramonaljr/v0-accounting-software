-- =============================================
-- Additional HR/Payroll Tables
-- 13th Month Pay, Loans, Salary Structure Assignments
-- =============================================

-- =============================================
-- 13TH MONTH PAY TABLES
-- =============================================

-- 13th Month Pay Batches
CREATE TABLE IF NOT EXISTS thirteenth_month_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    batch_name VARCHAR(200) NOT NULL,
    year INTEGER NOT NULL,
    -- Totals
    total_employees INTEGER DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    total_taxable DECIMAL(15,2) DEFAULT 0,
    total_tax_exempt DECIMAL(15,2) DEFAULT 0,
    -- Status
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Computed, Released, Cancelled
    computed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, year, batch_name)
);

-- 13th Month Pay Computations (per employee)
CREATE TABLE IF NOT EXISTS thirteenth_month_computations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES thirteenth_month_batches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    year INTEGER NOT NULL,
    -- Computation
    total_basic_salary DECIMAL(15,2) DEFAULT 0,
    months_worked DECIMAL(4,2) DEFAULT 0,
    thirteenth_month_pay DECIMAL(15,2) DEFAULT 0,
    tax_exempt_amount DECIMAL(15,2) DEFAULT 0,
    taxable_amount DECIMAL(15,2) DEFAULT 0,
    -- Status
    status VARCHAR(50) DEFAULT 'Computed', -- Computed, Released, Cancelled
    release_date DATE,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, employee_id)
);

-- =============================================
-- EMPLOYEE LOANS TABLES
-- =============================================

-- Employee Loans
CREATE TABLE IF NOT EXISTS employee_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    -- Loan details
    loan_type VARCHAR(50) NOT NULL, -- SSS Loan, Pag-IBIG Loan, Company Loan, Cash Advance, Other
    loan_no VARCHAR(50) NOT NULL,
    description TEXT,
    -- Amounts
    loan_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    total_interest DECIMAL(15,2) DEFAULT 0,
    total_repayment_amount DECIMAL(15,2) NOT NULL,
    -- Repayment schedule
    repayment_start_date DATE NOT NULL,
    repayment_period_months INTEGER NOT NULL,
    monthly_deduction DECIMAL(15,2) NOT NULL,
    -- Status tracking
    total_amount_paid DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Approved, Disbursed, Repaying, Closed, Cancelled
    -- Dates
    application_date DATE NOT NULL,
    approval_date DATE,
    disbursement_date DATE,
    closed_date DATE,
    -- Approvals
    approved_by UUID REFERENCES employees(id),
    docstatus INTEGER DEFAULT 0,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, loan_no)
);

-- Loan Repayments
CREATE TABLE IF NOT EXISTS loan_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES employee_loans(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    -- Payment details
    repayment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    balance_after DECIMAL(15,2) NOT NULL,
    -- Reference
    salary_slip_id UUID REFERENCES salary_slips(id),
    payroll_period VARCHAR(50),
    -- Status
    status VARCHAR(50) DEFAULT 'Paid', -- Pending, Paid, Cancelled
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SALARY STRUCTURE ASSIGNMENTS
-- =============================================

-- Add salary structure assignments table if not exists
CREATE TABLE IF NOT EXISTS salary_structure_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    salary_structure_id UUID NOT NULL REFERENCES salary_structures(id),
    from_date DATE NOT NULL,
    to_date DATE,
    base_pay DECIMAL(15,2) NOT NULL,
    variable_pay_percent DECIMAL(5,2),
    income_category VARCHAR(100), -- For tax computation
    docstatus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_13th_month_batches_org_year ON thirteenth_month_batches(org_id, year);
CREATE INDEX IF NOT EXISTS idx_13th_month_comp_batch ON thirteenth_month_computations(batch_id);
CREATE INDEX IF NOT EXISTS idx_13th_month_comp_employee ON thirteenth_month_computations(employee_id, year);

CREATE INDEX IF NOT EXISTS idx_employee_loans_org ON employee_loans(org_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_employee ON employee_loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_status ON employee_loans(status) WHERE status IN ('Disbursed', 'Repaying');
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON loan_repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_salary_slip ON loan_repayments(salary_slip_id);

CREATE INDEX IF NOT EXISTS idx_salary_structure_assign_emp ON salary_structure_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structure_assign_active ON salary_structure_assignments(employee_id, from_date, to_date)
    WHERE docstatus = 1;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE thirteenth_month_batches IS 'Batches for 13th month pay computation and release';
COMMENT ON TABLE thirteenth_month_computations IS 'Individual 13th month pay computations per employee';
COMMENT ON TABLE employee_loans IS 'Employee loans including SSS, Pag-IBIG, company loans, and cash advances';
COMMENT ON TABLE loan_repayments IS 'Loan repayment history and deductions';
COMMENT ON TABLE salary_structure_assignments IS 'Assignment of salary structures to employees with effective dates';
