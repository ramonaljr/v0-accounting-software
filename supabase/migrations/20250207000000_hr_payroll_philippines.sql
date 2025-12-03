-- =============================================
-- HR/Payroll Module with Philippines Compliance
-- Based on ERPNext HR module + PH statutory requirements
-- =============================================

-- =============================================
-- PART 1: EMPLOYEE MASTER DATA
-- =============================================

-- Department
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    department_code VARCHAR(20),
    department_name VARCHAR(200) NOT NULL,
    parent_id UUID REFERENCES departments(id),
    company_id UUID REFERENCES companies(id),
    is_group BOOLEAN DEFAULT FALSE,
    lft INTEGER DEFAULT 0,
    rgt INTEGER DEFAULT 0,
    cost_center_id UUID REFERENCES cost_centers(id),
    payroll_cost_center_id UUID REFERENCES cost_centers(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, department_code)
);

-- Designation/Job Title
CREATE TABLE designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    designation_code VARCHAR(20),
    designation_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, designation_code)
);

-- Employment Type
CREATE TABLE employment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    -- Leave settings
    default_leave_policy_id UUID,
    -- PH specific
    is_regular BOOLEAN DEFAULT TRUE, -- Regular vs Contractual/Project-based
    is_subject_to_statutory BOOLEAN DEFAULT TRUE, -- Subject to SSS, PhilHealth, Pag-IBIG
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, type_name)
);

-- Branch/Work Location
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    branch_code VARCHAR(20),
    branch_name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, branch_code)
);

-- Employee Grade/Level
CREATE TABLE employee_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    grade_name VARCHAR(100) NOT NULL,
    description TEXT,
    -- Salary range
    default_base_pay DECIMAL(15,2) DEFAULT 0,
    min_base_pay DECIMAL(15,2),
    max_base_pay DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, grade_name)
);

-- Employee Master
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_no VARCHAR(50) NOT NULL,
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20), -- Jr., Sr., III, etc.
    gender VARCHAR(20),
    date_of_birth DATE,
    marital_status VARCHAR(50),
    blood_group VARCHAR(10),
    -- Contact
    personal_email VARCHAR(255),
    company_email VARCHAR(255),
    mobile_phone VARCHAR(50),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(100),
    -- Address
    current_address TEXT,
    permanent_address TEXT,
    -- Employment
    status VARCHAR(50) DEFAULT 'Active', -- Active, Left, Suspended
    employment_type_id UUID REFERENCES employment_types(id),
    department_id UUID REFERENCES departments(id),
    designation_id UUID REFERENCES designations(id),
    branch_id UUID REFERENCES branches(id),
    grade_id UUID REFERENCES employee_grades(id),
    reports_to UUID REFERENCES employees(id),
    date_of_joining DATE,
    date_of_confirmation DATE,
    contract_end_date DATE,
    relieving_date DATE,
    reason_for_leaving TEXT,
    -- User link
    user_id UUID REFERENCES auth.users(id),
    -- PH Government IDs (encrypted in practice)
    tin_no VARCHAR(50), -- Tax Identification Number
    sss_no VARCHAR(50), -- Social Security System
    philhealth_no VARCHAR(50), -- Philippine Health Insurance
    pagibig_no VARCHAR(50), -- Pag-IBIG Fund (HDMF)
    -- Bank details
    bank_name VARCHAR(200),
    bank_account_no VARCHAR(100),
    bank_account_name VARCHAR(200),
    -- Payroll
    salary_mode VARCHAR(50) DEFAULT 'Bank', -- Bank, Cash, Cheque
    payment_days_basis VARCHAR(50) DEFAULT 'Calendar Days', -- Calendar Days, Working Days
    -- Photo
    image_url TEXT,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, employee_no)
);

-- Employee Education
CREATE TABLE employee_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    school_university VARCHAR(300),
    qualification VARCHAR(200),
    level VARCHAR(100), -- High School, College, Masters, Doctorate
    field_of_study VARCHAR(200),
    year_of_graduation INTEGER,
    class_grade VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Work Experience
CREATE TABLE employee_work_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_name VARCHAR(300),
    designation VARCHAR(200),
    from_date DATE,
    to_date DATE,
    address TEXT,
    salary DECIMAL(15,2),
    reason_for_leaving TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Dependents (for tax computation)
CREATE TABLE employee_dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    dependent_name VARCHAR(200) NOT NULL,
    relationship VARCHAR(100), -- Spouse, Child, Parent
    date_of_birth DATE,
    gender VARCHAR(20),
    is_qualified_dependent BOOLEAN DEFAULT FALSE, -- For BIR additional exemption
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PART 2: SALARY STRUCTURE
-- =============================================

-- Salary Component (Earnings & Deductions)
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    component_code VARCHAR(50) NOT NULL,
    component_name VARCHAR(200) NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- Earning, Deduction
    description TEXT,
    -- Calculation
    type VARCHAR(50) DEFAULT 'Amount', -- Amount, Percentage
    amount DECIMAL(15,2) DEFAULT 0,
    formula TEXT, -- For computed components
    amount_based_on_formula BOOLEAN DEFAULT FALSE,
    formula_description TEXT,
    -- Accounting
    account_id UUID REFERENCES accounts(id),
    -- Tax settings
    is_tax_applicable BOOLEAN DEFAULT TRUE,
    is_flexible_benefit BOOLEAN DEFAULT FALSE,
    -- PH Statutory
    is_sss_applicable BOOLEAN DEFAULT TRUE,
    is_philhealth_applicable BOOLEAN DEFAULT TRUE,
    is_pagibig_applicable BOOLEAN DEFAULT TRUE,
    -- Payslip
    do_not_include_in_total BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, component_code)
);

-- Salary Structure
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    structure_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    -- Payroll settings
    payroll_frequency VARCHAR(50) DEFAULT 'Monthly', -- Monthly, Semi-Monthly, Weekly, Daily
    payment_days_per_month INTEGER DEFAULT 22,
    -- Time settings
    hour_rate_formula TEXT, -- How to compute hourly rate
    -- Company
    company_id UUID REFERENCES companies(id),
    currency VARCHAR(3) DEFAULT 'PHP',
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, structure_name)
);

-- Salary Structure Earnings
CREATE TABLE salary_structure_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    salary_component_id UUID NOT NULL REFERENCES salary_components(id),
    -- Amount/Formula
    amount DECIMAL(15,2) DEFAULT 0,
    amount_based_on_formula BOOLEAN DEFAULT FALSE,
    formula TEXT,
    -- Conditions
    condition TEXT,
    -- Display
    abbr VARCHAR(50),
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Structure Deductions
CREATE TABLE salary_structure_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    salary_component_id UUID NOT NULL REFERENCES salary_components(id),
    -- Amount/Formula
    amount DECIMAL(15,2) DEFAULT 0,
    amount_based_on_formula BOOLEAN DEFAULT FALSE,
    formula TEXT,
    -- Conditions
    condition TEXT,
    -- Display
    abbr VARCHAR(50),
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Structure Assignment (links employee to salary structure)
CREATE TABLE salary_structure_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    salary_structure_id UUID NOT NULL REFERENCES salary_structures(id),
    from_date DATE NOT NULL,
    to_date DATE,
    -- Base pay
    base_pay DECIMAL(15,2) NOT NULL,
    -- Variable components override
    variable DECIMAL(15,2) DEFAULT 0,
    -- Tax settings
    income_tax_slab_id UUID,
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    docstatus INTEGER DEFAULT 0, -- 0=Draft, 1=Submitted, 2=Cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- PART 3: PHILIPPINES STATUTORY TABLES
-- =============================================

-- SSS Contribution Table (updated annually)
CREATE TABLE sss_contribution_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    -- Compensation range
    compensation_range_from DECIMAL(15,2) NOT NULL,
    compensation_range_to DECIMAL(15,2) NOT NULL,
    monthly_salary_credit DECIMAL(15,2) NOT NULL,
    -- Contributions
    employer_contribution_ss DECIMAL(15,2) NOT NULL, -- Social Security
    employer_contribution_ec DECIMAL(15,2) NOT NULL, -- Employee Compensation
    employee_contribution DECIMAL(15,2) NOT NULL,
    -- WISP (Workers' Investment and Savings Program) for salary credit > 20k
    employer_contribution_wisp DECIMAL(15,2) DEFAULT 0,
    employee_contribution_wisp DECIMAL(15,2) DEFAULT 0,
    total_contribution DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, effective_date, compensation_range_from)
);

-- PhilHealth Contribution Table
CREATE TABLE philhealth_contribution_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    -- Rate-based (current system)
    premium_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.05 for 5%
    income_floor DECIMAL(15,2) NOT NULL, -- Minimum monthly basic salary
    income_ceiling DECIMAL(15,2) NOT NULL, -- Maximum monthly basic salary
    -- Contribution limits
    min_contribution DECIMAL(15,2),
    max_contribution DECIMAL(15,2),
    -- Split
    employee_share_rate DECIMAL(5,4) DEFAULT 0.5, -- 50%
    employer_share_rate DECIMAL(5,4) DEFAULT 0.5, -- 50%
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, effective_date)
);

-- Pag-IBIG (HDMF) Contribution Table
CREATE TABLE pagibig_contribution_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    -- Compensation range
    compensation_range_from DECIMAL(15,2) NOT NULL,
    compensation_range_to DECIMAL(15,2),
    -- Rates
    employee_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.01, 0.02
    employer_rate DECIMAL(5,4) NOT NULL,
    -- Caps
    max_compensation_for_computation DECIMAL(15,2) DEFAULT 5000, -- Max base for mandatory
    -- Additional MP2 voluntary
    allow_additional_contribution BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, effective_date, compensation_range_from)
);

-- BIR Withholding Tax Table (TRAIN Law)
CREATE TABLE bir_withholding_tax_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    payroll_frequency VARCHAR(50) NOT NULL, -- Annual, Monthly, Semi-Monthly, Weekly, Daily
    -- Tax bracket
    compensation_range_from DECIMAL(15,2) NOT NULL,
    compensation_range_to DECIMAL(15,2),
    -- Tax computation
    fixed_tax DECIMAL(15,2) NOT NULL, -- Fixed amount
    tax_rate DECIMAL(5,4) NOT NULL, -- Rate for excess
    excess_over DECIMAL(15,2) NOT NULL, -- Amount to subtract before applying rate
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, effective_date, payroll_frequency, compensation_range_from)
);

-- 13th Month Pay Settings
CREATE TABLE thirteenth_month_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    fiscal_year_id UUID REFERENCES fiscal_years(id),
    -- Computation
    computation_method VARCHAR(50) DEFAULT 'Basic Salary', -- Basic Salary, Gross Pay
    include_allowances BOOLEAN DEFAULT FALSE,
    prorate_for_resigned BOOLEAN DEFAULT TRUE,
    -- Payment schedule
    first_half_percentage DECIMAL(5,2) DEFAULT 50, -- Pay in November
    first_half_date DATE,
    second_half_date DATE, -- Usually December
    -- Tax exempt threshold (currently PHP 90,000)
    tax_exempt_threshold DECIMAL(15,2) DEFAULT 90000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, fiscal_year_id)
);

-- =============================================
-- PART 4: ATTENDANCE & LEAVE
-- =============================================

-- Shift Type
CREATE TABLE shift_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- Break
    break_duration_minutes INTEGER DEFAULT 60,
    -- Working hours
    working_hours_threshold DECIMAL(4,2) DEFAULT 4, -- Min hours for half day
    -- Late/Undertime grace
    late_entry_grace_period INTEGER DEFAULT 0, -- minutes
    early_exit_grace_period INTEGER DEFAULT 0,
    -- Overtime settings
    enable_auto_ot BOOLEAN DEFAULT FALSE,
    ot_start_after_minutes INTEGER DEFAULT 0, -- OT starts after this many minutes beyond shift
    -- Night differential (10pm - 6am in PH)
    night_diff_start_time TIME DEFAULT '22:00',
    night_diff_end_time TIME DEFAULT '06:00',
    night_diff_rate DECIMAL(5,4) DEFAULT 0.10, -- 10% additional
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, shift_name)
);

-- Employee Shift Assignment
CREATE TABLE employee_shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    shift_type_id UUID NOT NULL REFERENCES shift_types(id),
    from_date DATE NOT NULL,
    to_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holiday List
CREATE TABLE holiday_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    list_name VARCHAR(200) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, list_name)
);

-- Holiday
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_list_id UUID NOT NULL REFERENCES holiday_lists(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    description VARCHAR(300),
    holiday_type VARCHAR(50) DEFAULT 'Regular', -- Regular, Special Non-Working, Special Working
    -- PH specific rates
    regular_pay_rate DECIMAL(5,4) DEFAULT 1.0, -- 100% for regular days
    holiday_pay_rate DECIMAL(5,4), -- Additional rate for working on holiday
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(holiday_list_id, holiday_date)
);

-- Attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    shift_type_id UUID REFERENCES shift_types(id),
    -- Status
    status VARCHAR(50) NOT NULL, -- Present, Absent, Half Day, On Leave, Work From Home
    -- Time in/out
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    -- Computed hours
    working_hours DECIMAL(5,2) DEFAULT 0,
    late_hours DECIMAL(5,2) DEFAULT 0,
    early_exit_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    night_diff_hours DECIMAL(5,2) DEFAULT 0,
    -- Leave link
    leave_application_id UUID,
    -- Remarks
    remarks TEXT,
    -- Metadata
    docstatus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, employee_id, attendance_date)
);

-- Leave Type
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    leave_type_name VARCHAR(200) NOT NULL,
    -- Allocation
    max_leaves_allowed INTEGER,
    max_continuous_days_allowed INTEGER,
    is_carry_forward BOOLEAN DEFAULT FALSE,
    max_carry_forward_days INTEGER DEFAULT 0,
    carry_forward_expiry_days INTEGER,
    -- Settings
    is_lwp BOOLEAN DEFAULT FALSE, -- Leave Without Pay
    is_paid_leave BOOLEAN DEFAULT TRUE,
    include_holiday_within_leave_as_leave BOOLEAN DEFAULT TRUE,
    is_compensatory BOOLEAN DEFAULT FALSE,
    -- Encashment
    allow_encashment BOOLEAN DEFAULT FALSE,
    encashment_threshold_days INTEGER,
    earning_component_id UUID REFERENCES salary_components(id),
    -- Applicability
    applicable_after_days INTEGER DEFAULT 0, -- From date of joining
    -- PH Specific
    is_service_incentive_leave BOOLEAN DEFAULT FALSE, -- SIL - 5 days mandatory
    is_maternity_leave BOOLEAN DEFAULT FALSE,
    is_paternity_leave BOOLEAN DEFAULT FALSE,
    is_solo_parent_leave BOOLEAN DEFAULT FALSE,
    is_vawc_leave BOOLEAN DEFAULT FALSE, -- Violence Against Women and Children
    is_magna_carta_leave BOOLEAN DEFAULT FALSE, -- For women
    -- Document requirement
    requires_attachment BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, leave_type_name)
);

-- Leave Policy
CREATE TABLE leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    policy_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, policy_name)
);

-- Leave Policy Detail
CREATE TABLE leave_policy_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_policy_id UUID NOT NULL REFERENCES leave_policies(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    annual_allocation INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(leave_policy_id, leave_type_id)
);

-- Leave Allocation
CREATE TABLE leave_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    -- Period
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    -- Leaves
    new_leaves_allocated DECIMAL(5,2) NOT NULL,
    carry_forward_leaves DECIMAL(5,2) DEFAULT 0,
    total_leaves_allocated DECIMAL(5,2) NOT NULL,
    leaves_taken DECIMAL(5,2) DEFAULT 0,
    leaves_encashed DECIMAL(5,2) DEFAULT 0,
    -- Computed
    balance_leaves DECIMAL(5,2) GENERATED ALWAYS AS (
        total_leaves_allocated - leaves_taken - leaves_encashed
    ) STORED,
    -- Status
    docstatus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Application
CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    -- Dates
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    half_day BOOLEAN DEFAULT FALSE,
    half_day_date DATE,
    -- Total
    total_leave_days DECIMAL(5,2) NOT NULL,
    -- Reason
    reason TEXT,
    -- Approval
    status VARCHAR(50) DEFAULT 'Open', -- Open, Approved, Rejected, Cancelled
    leave_approver_id UUID REFERENCES employees(id),
    posting_date DATE,
    -- Salary
    leave_allocation_id UUID REFERENCES leave_allocations(id),
    -- Attachment
    attachment_url TEXT,
    -- Metadata
    docstatus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- PART 5: PAYROLL PROCESSING
-- =============================================

-- Payroll Period
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    period_name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    -- Payroll frequency
    payroll_frequency VARCHAR(50) DEFAULT 'Monthly',
    -- Status
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, period_name)
);

-- Payroll Entry (batch payroll processing)
CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    payroll_entry_no VARCHAR(50) NOT NULL,
    -- Period
    payroll_period_id UUID REFERENCES payroll_periods(id),
    posting_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payroll_frequency VARCHAR(50) DEFAULT 'Monthly',
    -- Filters used
    department_id UUID REFERENCES departments(id),
    branch_id UUID REFERENCES branches(id),
    designation_id UUID REFERENCES designations(id),
    -- Company
    company_id UUID REFERENCES companies(id),
    currency VARCHAR(3) DEFAULT 'PHP',
    exchange_rate DECIMAL(15,6) DEFAULT 1,
    -- Bank
    payment_account_id UUID REFERENCES accounts(id),
    -- Cost center
    cost_center_id UUID REFERENCES cost_centers(id),
    project_id UUID,
    -- Totals
    total_employees INTEGER DEFAULT 0,
    total_gross_pay DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net_pay DECIMAL(15,2) DEFAULT 0,
    -- Status
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Submitted, Cancelled
    docstatus INTEGER DEFAULT 0,
    -- GL Entry
    journal_entry_id UUID REFERENCES journal_entries(id),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, payroll_entry_no)
);

-- Salary Slip
CREATE TABLE salary_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    salary_slip_no VARCHAR(50) NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    -- Period
    payroll_entry_id UUID REFERENCES payroll_entries(id),
    posting_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    -- Employee details (snapshot)
    employee_name VARCHAR(300),
    department VARCHAR(200),
    designation VARCHAR(200),
    branch VARCHAR(200),
    -- Salary structure
    salary_structure_id UUID REFERENCES salary_structures(id),
    -- Working days
    total_working_days DECIMAL(5,2) NOT NULL,
    payment_days DECIMAL(5,2) NOT NULL,
    leave_without_pay DECIMAL(5,2) DEFAULT 0,
    absent_days DECIMAL(5,2) DEFAULT 0,
    -- Hours (for overtime, etc.)
    total_working_hours DECIMAL(7,2) DEFAULT 0,
    hour_rate DECIMAL(15,4) DEFAULT 0,
    -- Overtime
    overtime_hours DECIMAL(7,2) DEFAULT 0,
    overtime_amount DECIMAL(15,2) DEFAULT 0,
    -- Night differential
    night_diff_hours DECIMAL(7,2) DEFAULT 0,
    night_diff_amount DECIMAL(15,2) DEFAULT 0,
    -- Holiday pay
    holiday_hours DECIMAL(7,2) DEFAULT 0,
    holiday_pay_amount DECIMAL(15,2) DEFAULT 0,
    -- Totals
    gross_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deduction DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
    rounded_total DECIMAL(15,2) DEFAULT 0,
    -- PH Statutory breakdown
    sss_employee DECIMAL(15,2) DEFAULT 0,
    sss_employer DECIMAL(15,2) DEFAULT 0,
    philhealth_employee DECIMAL(15,2) DEFAULT 0,
    philhealth_employer DECIMAL(15,2) DEFAULT 0,
    pagibig_employee DECIMAL(15,2) DEFAULT 0,
    pagibig_employer DECIMAL(15,2) DEFAULT 0,
    withholding_tax DECIMAL(15,2) DEFAULT 0,
    -- Year-to-date
    ytd_gross_pay DECIMAL(15,2) DEFAULT 0,
    ytd_taxable_income DECIMAL(15,2) DEFAULT 0,
    ytd_tax_withheld DECIMAL(15,2) DEFAULT 0,
    -- Bank
    bank_name VARCHAR(200),
    bank_account_no VARCHAR(100),
    -- Status
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Submitted, Paid, Cancelled
    docstatus INTEGER DEFAULT 0,
    -- Journal entry for this slip
    journal_entry_id UUID REFERENCES journal_entries(id),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, salary_slip_no)
);

-- Salary Slip Earnings
CREATE TABLE salary_slip_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_slip_id UUID NOT NULL REFERENCES salary_slips(id) ON DELETE CASCADE,
    salary_component_id UUID NOT NULL REFERENCES salary_components(id),
    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    -- YTD
    year_to_date DECIMAL(15,2) DEFAULT 0,
    -- Tax/Statutory flags (snapshot)
    is_tax_applicable BOOLEAN DEFAULT TRUE,
    is_sss_applicable BOOLEAN DEFAULT TRUE,
    is_philhealth_applicable BOOLEAN DEFAULT TRUE,
    is_pagibig_applicable BOOLEAN DEFAULT TRUE,
    -- Display
    abbr VARCHAR(50),
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Slip Deductions
CREATE TABLE salary_slip_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_slip_id UUID NOT NULL REFERENCES salary_slips(id) ON DELETE CASCADE,
    salary_component_id UUID NOT NULL REFERENCES salary_components(id),
    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    -- YTD
    year_to_date DECIMAL(15,2) DEFAULT 0,
    -- Display
    abbr VARCHAR(50),
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional Salary (one-time earnings/deductions)
CREATE TABLE additional_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    salary_component_id UUID NOT NULL REFERENCES salary_components(id),
    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    -- Period
    from_date DATE,
    to_date DATE,
    payroll_date DATE, -- Specific payroll to include in
    -- Type
    type VARCHAR(50), -- Earning, Deduction
    -- Reason
    reason TEXT,
    -- Link to salary slip
    salary_slip_id UUID REFERENCES salary_slips(id),
    -- Status
    docstatus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PART 6: LOANS AND ADVANCES
-- =============================================

-- Loan Type
CREATE TABLE loan_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    loan_type_name VARCHAR(200) NOT NULL,
    description TEXT,
    -- Limits
    maximum_loan_amount DECIMAL(15,2),
    rate_of_interest DECIMAL(5,4) DEFAULT 0, -- Annual rate
    -- Repayment
    repayment_method VARCHAR(50) DEFAULT 'Equal Monthly Installments',
    -- Deduction component
    salary_component_id UUID REFERENCES salary_components(id),
    -- Disbursement account
    disbursement_account_id UUID REFERENCES accounts(id),
    payment_account_id UUID REFERENCES accounts(id),
    -- Flags
    is_term_loan BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, loan_type_name)
);

-- Loan
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    loan_no VARCHAR(50) NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    loan_type_id UUID NOT NULL REFERENCES loan_types(id),
    -- Loan details
    loan_amount DECIMAL(15,2) NOT NULL,
    rate_of_interest DECIMAL(5,4) DEFAULT 0,
    -- Disbursement
    disbursement_date DATE,
    disbursed_amount DECIMAL(15,2) DEFAULT 0,
    -- Repayment
    repayment_start_date DATE,
    repayment_periods INTEGER NOT NULL, -- Number of installments
    monthly_repayment_amount DECIMAL(15,2) NOT NULL,
    -- Status
    total_amount_paid DECIMAL(15,2) DEFAULT 0,
    total_interest_payable DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Sanctioned, Disbursed, Partially Paid, Repaid, Closed
    docstatus INTEGER DEFAULT 0,
    -- Journal entries
    disbursement_journal_entry_id UUID REFERENCES journal_entries(id),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, loan_no)
);

-- Loan Repayment Schedule
CREATE TABLE loan_repayment_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    -- Schedule
    payment_date DATE NOT NULL,
    payment_no INTEGER NOT NULL,
    -- Amounts
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    total_payment DECIMAL(15,2) NOT NULL,
    balance_loan_amount DECIMAL(15,2) NOT NULL,
    -- Status
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    salary_slip_id UUID REFERENCES salary_slips(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PART 7: YEAR-END PROCESSING
-- =============================================

-- BIR Form 2316 (Annual tax document for employees)
CREATE TABLE bir_form_2316 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    fiscal_year INTEGER NOT NULL,
    -- Employer info
    employer_tin VARCHAR(50),
    employer_name VARCHAR(300),
    employer_address TEXT,
    -- Employee info (snapshot)
    employee_tin VARCHAR(50),
    employee_name VARCHAR(300),
    employee_address TEXT,
    -- Compensation
    gross_compensation_income DECIMAL(15,2) DEFAULT 0,
    less_non_taxable_income DECIMAL(15,2) DEFAULT 0,
    taxable_compensation_income DECIMAL(15,2) DEFAULT 0,
    -- Tax
    tax_due DECIMAL(15,2) DEFAULT 0,
    tax_withheld DECIMAL(15,2) DEFAULT 0,
    -- 13th month & other benefits
    thirteenth_month_pay DECIMAL(15,2) DEFAULT 0,
    de_minimis_benefits DECIMAL(15,2) DEFAULT 0,
    -- SSS, PhilHealth, Pag-IBIG contributions
    sss_contributions DECIMAL(15,2) DEFAULT 0,
    philhealth_contributions DECIMAL(15,2) DEFAULT 0,
    pagibig_contributions DECIMAL(15,2) DEFAULT 0,
    -- Status
    status VARCHAR(50) DEFAULT 'Draft',
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, employee_id, fiscal_year)
);

-- Alphalist (BIR submission)
CREATE TABLE bir_alphalist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER, -- NULL for annual, 1-4 for quarterly
    -- Report type
    alphalist_type VARCHAR(50), -- 7.1 (employees), 7.2 (terminated), 7.3 (minimum wage)
    -- Submission
    submission_date DATE,
    reference_no VARCHAR(100),
    -- File
    file_url TEXT,
    -- Status
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, fiscal_year, quarter, alphalist_type)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_employees_org_id ON employees(org_id);
CREATE INDEX idx_employees_status ON employees(org_id, status);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_tin ON employees(org_id, tin_no);
CREATE INDEX idx_employees_sss ON employees(org_id, sss_no);

CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_attendance_org_date ON attendance(org_id, attendance_date);

CREATE INDEX idx_leave_applications_employee ON leave_applications(employee_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(org_id, status);
CREATE INDEX idx_leave_applications_dates ON leave_applications(from_date, to_date);

CREATE INDEX idx_salary_slips_employee ON salary_slips(employee_id);
CREATE INDEX idx_salary_slips_period ON salary_slips(start_date, end_date);
CREATE INDEX idx_salary_slips_payroll_entry ON salary_slips(payroll_entry_id);

CREATE INDEX idx_payroll_entries_org_date ON payroll_entries(org_id, posting_date);
CREATE INDEX idx_payroll_entries_period ON payroll_entries(payroll_period_id);

CREATE INDEX idx_loans_employee ON loans(employee_id);
CREATE INDEX idx_loans_status ON loans(org_id, status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structure_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structure_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structure_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sss_contribution_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE philhealth_contribution_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagibig_contribution_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE bir_withholding_tax_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE thirteenth_month_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policy_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slip_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slip_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE bir_form_2316 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bir_alphalist ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to compute SSS contribution
CREATE OR REPLACE FUNCTION compute_sss_contribution(
    p_org_id UUID,
    p_monthly_compensation DECIMAL,
    p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    employee_contribution DECIMAL,
    employer_contribution DECIMAL,
    employer_ec DECIMAL,
    employee_wisp DECIMAL,
    employer_wisp DECIMAL,
    total_contribution DECIMAL,
    monthly_salary_credit DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sct.employee_contribution,
        sct.employer_contribution_ss,
        sct.employer_contribution_ec,
        sct.employee_contribution_wisp,
        sct.employer_contribution_wisp,
        sct.total_contribution,
        sct.monthly_salary_credit
    FROM sss_contribution_table sct
    WHERE sct.org_id = p_org_id
        AND sct.effective_date <= p_effective_date
        AND (sct.end_date IS NULL OR sct.end_date >= p_effective_date)
        AND p_monthly_compensation >= sct.compensation_range_from
        AND p_monthly_compensation <= sct.compensation_range_to
    ORDER BY sct.effective_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to compute PhilHealth contribution
CREATE OR REPLACE FUNCTION compute_philhealth_contribution(
    p_org_id UUID,
    p_monthly_basic_salary DECIMAL,
    p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    employee_share DECIMAL,
    employer_share DECIMAL,
    total_contribution DECIMAL
) AS $$
DECLARE
    v_rate DECIMAL;
    v_floor DECIMAL;
    v_ceiling DECIMAL;
    v_base DECIMAL;
    v_total DECIMAL;
BEGIN
    SELECT premium_rate, income_floor, income_ceiling
    INTO v_rate, v_floor, v_ceiling
    FROM philhealth_contribution_table
    WHERE org_id = p_org_id
        AND effective_date <= p_effective_date
        AND (end_date IS NULL OR end_date >= p_effective_date)
    ORDER BY effective_date DESC
    LIMIT 1;

    -- Apply floor and ceiling
    v_base := GREATEST(LEAST(p_monthly_basic_salary, v_ceiling), v_floor);
    v_total := v_base * v_rate;

    RETURN QUERY SELECT
        ROUND(v_total / 2, 2) AS employee_share,
        ROUND(v_total / 2, 2) AS employer_share,
        ROUND(v_total, 2) AS total_contribution;
END;
$$ LANGUAGE plpgsql;

-- Function to compute Pag-IBIG contribution
CREATE OR REPLACE FUNCTION compute_pagibig_contribution(
    p_org_id UUID,
    p_monthly_compensation DECIMAL,
    p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    employee_contribution DECIMAL,
    employer_contribution DECIMAL,
    total_contribution DECIMAL
) AS $$
DECLARE
    v_ee_rate DECIMAL;
    v_er_rate DECIMAL;
    v_max_base DECIMAL;
    v_base DECIMAL;
BEGIN
    SELECT employee_rate, employer_rate, max_compensation_for_computation
    INTO v_ee_rate, v_er_rate, v_max_base
    FROM pagibig_contribution_table
    WHERE org_id = p_org_id
        AND effective_date <= p_effective_date
        AND (end_date IS NULL OR end_date >= p_effective_date)
        AND p_monthly_compensation >= compensation_range_from
        AND (compensation_range_to IS NULL OR p_monthly_compensation <= compensation_range_to)
    ORDER BY effective_date DESC
    LIMIT 1;

    -- Apply ceiling
    v_base := LEAST(p_monthly_compensation, COALESCE(v_max_base, 5000));

    RETURN QUERY SELECT
        ROUND(v_base * v_ee_rate, 2) AS employee_contribution,
        ROUND(v_base * v_er_rate, 2) AS employer_contribution,
        ROUND(v_base * (v_ee_rate + v_er_rate), 2) AS total_contribution;
END;
$$ LANGUAGE plpgsql;

-- Function to compute BIR withholding tax
CREATE OR REPLACE FUNCTION compute_withholding_tax(
    p_org_id UUID,
    p_taxable_income DECIMAL,
    p_payroll_frequency VARCHAR DEFAULT 'Monthly',
    p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL AS $$
DECLARE
    v_fixed_tax DECIMAL;
    v_tax_rate DECIMAL;
    v_excess_over DECIMAL;
    v_tax DECIMAL;
BEGIN
    SELECT fixed_tax, tax_rate, excess_over
    INTO v_fixed_tax, v_tax_rate, v_excess_over
    FROM bir_withholding_tax_table
    WHERE org_id = p_org_id
        AND payroll_frequency = p_payroll_frequency
        AND effective_date <= p_effective_date
        AND (end_date IS NULL OR end_date >= p_effective_date)
        AND p_taxable_income >= compensation_range_from
        AND (compensation_range_to IS NULL OR p_taxable_income < compensation_range_to)
    ORDER BY effective_date DESC, compensation_range_from DESC
    LIMIT 1;

    IF v_fixed_tax IS NULL THEN
        RETURN 0;
    END IF;

    v_tax := v_fixed_tax + ((p_taxable_income - v_excess_over) * v_tax_rate);

    RETURN GREATEST(ROUND(v_tax, 2), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get employee's leave balance
CREATE OR REPLACE FUNCTION get_leave_balance(
    p_employee_id UUID,
    p_leave_type_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT COALESCE(SUM(balance_leaves), 0)
    INTO v_balance
    FROM leave_allocations
    WHERE employee_id = p_employee_id
        AND leave_type_id = p_leave_type_id
        AND from_date <= p_as_of_date
        AND to_date >= p_as_of_date
        AND docstatus = 1;

    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update salary slip totals
CREATE OR REPLACE FUNCTION update_salary_slip_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE salary_slips
    SET
        gross_pay = (
            SELECT COALESCE(SUM(amount), 0)
            FROM salary_slip_earnings
            WHERE salary_slip_id = COALESCE(NEW.salary_slip_id, OLD.salary_slip_id)
        ),
        total_deduction = (
            SELECT COALESCE(SUM(amount), 0)
            FROM salary_slip_deductions
            WHERE salary_slip_id = COALESCE(NEW.salary_slip_id, OLD.salary_slip_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.salary_slip_id, OLD.salary_slip_id);

    -- Update net pay
    UPDATE salary_slips
    SET net_pay = gross_pay - total_deduction,
        rounded_total = ROUND(gross_pay - total_deduction, 0)
    WHERE id = COALESCE(NEW.salary_slip_id, OLD.salary_slip_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_salary_slip_earnings_update
AFTER INSERT OR UPDATE OR DELETE ON salary_slip_earnings
FOR EACH ROW EXECUTE FUNCTION update_salary_slip_totals();

CREATE TRIGGER trg_salary_slip_deductions_update
AFTER INSERT OR UPDATE OR DELETE ON salary_slip_deductions
FOR EACH ROW EXECUTE FUNCTION update_salary_slip_totals();

-- =============================================
-- INITIAL PH STATUTORY DATA (2024 rates)
-- =============================================

-- Note: These would be inserted per organization during setup
-- Example SSS rates, PhilHealth rates, Pag-IBIG rates, and BIR tax tables
-- would be inserted here with actual 2024 values

COMMENT ON TABLE sss_contribution_table IS 'SSS contribution table - update annually based on SSS circulars';
COMMENT ON TABLE philhealth_contribution_table IS 'PhilHealth contribution table - update based on PhilHealth circulars';
COMMENT ON TABLE pagibig_contribution_table IS 'Pag-IBIG/HDMF contribution table - update based on HDMF circulars';
COMMENT ON TABLE bir_withholding_tax_table IS 'BIR withholding tax table - based on TRAIN Law (RA 10963)';
