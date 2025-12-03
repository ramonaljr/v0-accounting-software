-- =============================================
-- HR/Payroll Fixes and Missing Functions
-- =============================================

-- Function to increment leaves taken (used by leave approval/cancellation)
CREATE OR REPLACE FUNCTION increment_leaves_taken(
    p_employee_id UUID,
    p_leave_type_id UUID,
    p_days DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE leave_allocations
    SET
        leaves_taken = leaves_taken + p_days,
        updated_at = NOW()
    WHERE employee_id = p_employee_id
        AND leave_type_id = p_leave_type_id
        AND docstatus = 1
        AND from_date <= CURRENT_DATE
        AND to_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Add missing unique constraint for attendance upsert
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_employee_date_unique;
ALTER TABLE attendance ADD CONSTRAINT attendance_employee_date_unique
    UNIQUE (employee_id, attendance_date);

-- Add leave_application_id to attendance if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'leave_application_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN leave_application_id UUID REFERENCES leave_applications(id);
    END IF;
END $$;

-- Add leave_type_id to attendance if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance' AND column_name = 'leave_type_id'
    ) THEN
        ALTER TABLE attendance ADD COLUMN leave_type_id UUID REFERENCES leave_types(id);
    END IF;
END $$;

-- Add missing columns to leave_applications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leave_applications' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE leave_applications ADD COLUMN approved_by UUID REFERENCES employees(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leave_applications' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE leave_applications ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leave_applications' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE leave_applications ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Function to get YTD earnings for an employee
CREATE OR REPLACE FUNCTION get_ytd_earnings(
    p_employee_id UUID,
    p_year INTEGER,
    p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    ytd_gross_pay DECIMAL,
    ytd_taxable_income DECIMAL,
    ytd_tax_withheld DECIMAL,
    ytd_sss DECIMAL,
    ytd_philhealth DECIMAL,
    ytd_pagibig DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(ss.gross_pay), 0) AS ytd_gross_pay,
        COALESCE(SUM(ss.gross_pay - ss.sss_employee - ss.philhealth_employee - ss.pagibig_employee), 0) AS ytd_taxable_income,
        COALESCE(SUM(ss.withholding_tax), 0) AS ytd_tax_withheld,
        COALESCE(SUM(ss.sss_employee), 0) AS ytd_sss,
        COALESCE(SUM(ss.philhealth_employee), 0) AS ytd_philhealth,
        COALESCE(SUM(ss.pagibig_employee), 0) AS ytd_pagibig
    FROM salary_slips ss
    WHERE ss.employee_id = p_employee_id
        AND ss.docstatus = 1
        AND EXTRACT(YEAR FROM ss.posting_date) = p_year
        AND ss.posting_date <= p_as_of_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get working days excluding holidays and weekends
CREATE OR REPLACE FUNCTION get_working_days(
    p_org_id UUID,
    p_from_date DATE,
    p_to_date DATE,
    p_holiday_list_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_working_days INTEGER := 0;
    v_current_date DATE := p_from_date;
    v_is_holiday BOOLEAN;
BEGIN
    WHILE v_current_date <= p_to_date LOOP
        -- Check if weekend (Saturday=6, Sunday=0)
        IF EXTRACT(DOW FROM v_current_date) NOT IN (0, 6) THEN
            -- Check if holiday
            IF p_holiday_list_id IS NOT NULL THEN
                SELECT EXISTS(
                    SELECT 1 FROM holidays
                    WHERE holiday_list_id = p_holiday_list_id
                    AND holiday_date = v_current_date
                ) INTO v_is_holiday;
            ELSE
                v_is_holiday := FALSE;
            END IF;

            IF NOT v_is_holiday THEN
                v_working_days := v_working_days + 1;
            END IF;
        END IF;

        v_current_date := v_current_date + 1;
    END LOOP;

    RETURN v_working_days;
END;
$$ LANGUAGE plpgsql;

-- Function to compute holiday pay
CREATE OR REPLACE FUNCTION compute_holiday_pay(
    p_org_id UUID,
    p_employee_id UUID,
    p_attendance_date DATE,
    p_daily_rate DECIMAL,
    p_hours_worked DECIMAL DEFAULT 8
)
RETURNS TABLE (
    holiday_type VARCHAR,
    base_pay DECIMAL,
    holiday_premium DECIMAL,
    total_pay DECIMAL
) AS $$
DECLARE
    v_holiday_type VARCHAR;
    v_holiday_pay_rate DECIMAL;
BEGIN
    -- Check if the date is a holiday
    SELECT h.holiday_type, COALESCE(h.holiday_pay_rate,
        CASE h.holiday_type
            WHEN 'Regular' THEN 2.0  -- 200% for regular holidays
            WHEN 'Special Non-Working' THEN 1.30  -- 130% for special non-working
            WHEN 'Special Working' THEN 1.30
            ELSE 1.0
        END
    )
    INTO v_holiday_type, v_holiday_pay_rate
    FROM holidays h
    JOIN holiday_lists hl ON h.holiday_list_id = hl.id
    WHERE hl.org_id = p_org_id
        AND h.holiday_date = p_attendance_date
        AND hl.is_default = TRUE
    LIMIT 1;

    IF v_holiday_type IS NULL THEN
        -- Not a holiday
        RETURN QUERY SELECT
            NULL::VARCHAR AS holiday_type,
            p_daily_rate AS base_pay,
            0::DECIMAL AS holiday_premium,
            p_daily_rate AS total_pay;
    ELSE
        RETURN QUERY SELECT
            v_holiday_type AS holiday_type,
            p_daily_rate AS base_pay,
            ROUND(p_daily_rate * (v_holiday_pay_rate - 1), 2) AS holiday_premium,
            ROUND(p_daily_rate * v_holiday_pay_rate, 2) AS total_pay;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to compute 13th month pay
CREATE OR REPLACE FUNCTION compute_thirteenth_month_pay(
    p_employee_id UUID,
    p_year INTEGER
)
RETURNS TABLE (
    total_basic_salary DECIMAL,
    months_worked DECIMAL,
    thirteenth_month_pay DECIMAL,
    taxable_amount DECIMAL,
    tax_exempt_amount DECIMAL
) AS $$
DECLARE
    v_total_basic DECIMAL;
    v_months_worked DECIMAL;
    v_13th_month DECIMAL;
    v_tax_exempt_threshold DECIMAL := 90000; -- Current BIR threshold
BEGIN
    -- Get total basic salary for the year from salary slips
    SELECT
        COALESCE(SUM(
            CASE
                WHEN sse.is_tax_applicable THEN sse.amount
                ELSE 0
            END
        ), 0),
        COUNT(DISTINCT DATE_TRUNC('month', ss.posting_date))
    INTO v_total_basic, v_months_worked
    FROM salary_slips ss
    LEFT JOIN salary_slip_earnings sse ON ss.id = sse.salary_slip_id
    WHERE ss.employee_id = p_employee_id
        AND EXTRACT(YEAR FROM ss.posting_date) = p_year
        AND ss.docstatus = 1;

    -- 13th month = Total Basic / 12
    v_13th_month := ROUND(v_total_basic / 12, 2);

    RETURN QUERY SELECT
        v_total_basic AS total_basic_salary,
        v_months_worked AS months_worked,
        v_13th_month AS thirteenth_month_pay,
        GREATEST(v_13th_month - v_tax_exempt_threshold, 0) AS taxable_amount,
        LEAST(v_13th_month, v_tax_exempt_threshold) AS tax_exempt_amount;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_slips_year ON salary_slips(EXTRACT(YEAR FROM posting_date));
CREATE INDEX IF NOT EXISTS idx_leave_allocations_active ON leave_allocations(employee_id, leave_type_id, docstatus)
    WHERE docstatus = 1;

-- Add unique constraint for leave types upsert
ALTER TABLE leave_types DROP CONSTRAINT IF EXISTS leave_types_org_name_unique;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leave_types_org_id_leave_type_name_key'
    ) THEN
        ALTER TABLE leave_types ADD CONSTRAINT leave_types_org_id_leave_type_name_key
            UNIQUE (org_id, leave_type_name);
    END IF;
END $$;

COMMENT ON FUNCTION increment_leaves_taken IS 'Increments or decrements leaves_taken in leave_allocations';
COMMENT ON FUNCTION get_ytd_earnings IS 'Gets year-to-date earnings summary for an employee';
COMMENT ON FUNCTION get_working_days IS 'Calculates working days between dates excluding weekends and holidays';
COMMENT ON FUNCTION compute_holiday_pay IS 'Computes holiday pay based on PH labor code rates';
COMMENT ON FUNCTION compute_thirteenth_month_pay IS 'Computes 13th month pay for an employee';
