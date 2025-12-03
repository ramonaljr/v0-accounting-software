/**
 * 13th Month Pay Service
 * Handles 13th month pay computation for Philippines compliance
 *
 * Per PD 851 and DOLE regulations:
 * - All rank-and-file employees who have worked at least 1 month are entitled
 * - 13th month = Total Basic Salary Earned / 12
 * - Must be paid on or before December 24
 * - Tax-exempt up to PHP 90,000 (as of TRAIN Law)
 */

import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================

export interface ThirteenthMonthComputation {
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  year: number;
  // Computation details
  totalBasicSalary: number;
  monthsWorked: number;
  thirteenthMonthPay: number;
  // Tax treatment
  taxExemptThreshold: number;
  taxExemptAmount: number;
  taxableAmount: number;
  // Status
  status: 'Draft' | 'Computed' | 'Released' | 'Cancelled';
  releaseDate?: Date;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ThirteenthMonthBatch {
  id: string;
  orgId: string;
  batchName: string;
  year: number;
  // Totals
  totalEmployees: number;
  totalAmount: number;
  totalTaxable: number;
  totalTaxExempt: number;
  // Status
  status: 'Draft' | 'Computed' | 'Released' | 'Cancelled';
  computedAt?: Date;
  releasedAt?: Date;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ComputationOptions {
  orgId: string;
  year: number;
  employeeIds?: string[];
  departmentId?: string;
  asOfDate?: Date;
  includeProrated?: boolean;
}

// Current BIR threshold for tax-exempt 13th month
const TAX_EXEMPT_THRESHOLD = 90000;

// =============================================
// SERVICE CLASS
// =============================================

export class ThirteenthMonthService {
  /**
   * Compute 13th month pay for an employee
   */
  static async computeForEmployee(
    employeeId: string,
    year: number,
    asOfDate?: Date
  ): Promise<ThirteenthMonthComputation> {
    const supabase = await createClient();

    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, employee_no, first_name, last_name, date_of_joining, relieving_date, status')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      throw new Error('Employee not found');
    }

    // Use database function if available, otherwise compute manually
    const { data: ytdData, error: ytdError } = await supabase.rpc(
      'compute_thirteenth_month_pay',
      {
        p_employee_id: employeeId,
        p_year: year,
      }
    );

    if (!ytdError && ytdData && ytdData.length > 0) {
      const result = ytdData[0];
      return {
        employeeId: employee.id,
        employeeNo: employee.employee_no,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        year,
        totalBasicSalary: Number(result.total_basic_salary),
        monthsWorked: Number(result.months_worked),
        thirteenthMonthPay: Number(result.thirteenth_month_pay),
        taxExemptThreshold: TAX_EXEMPT_THRESHOLD,
        taxExemptAmount: Number(result.tax_exempt_amount),
        taxableAmount: Number(result.taxable_amount),
        status: 'Computed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Manual computation fallback
    const computation = await this.manualCompute(employeeId, year, asOfDate);

    return {
      employeeId: employee.id,
      employeeNo: employee.employee_no,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      year,
      ...computation,
      status: 'Computed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Manual computation without database function
   */
  private static async manualCompute(
    employeeId: string,
    year: number,
    asOfDate?: Date
  ): Promise<{
    totalBasicSalary: number;
    monthsWorked: number;
    thirteenthMonthPay: number;
    taxExemptThreshold: number;
    taxExemptAmount: number;
    taxableAmount: number;
  }> {
    const supabase = await createClient();
    const effectiveDate = asOfDate || new Date();

    // Get all salary slips for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(
      Math.min(
        effectiveDate.getTime(),
        new Date(year, 11, 31).getTime()
      )
    );

    // Query salary slips with basic earnings
    const { data: salarySlips, error } = await supabase
      .from('salary_slips')
      .select(`
        id,
        posting_date,
        gross_pay,
        salary_slip_earnings (
          id,
          amount,
          is_tax_applicable,
          salary_component:salary_components (
            component_code,
            is_tax_applicable
          )
        )
      `)
      .eq('employee_id', employeeId)
      .eq('docstatus', 1)
      .gte('posting_date', startDate.toISOString())
      .lte('posting_date', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch salary data: ${error.message}`);
    }

    // Calculate total basic salary (taxable earnings only for 13th month)
    let totalBasicSalary = 0;
    const monthsWithPay = new Set<string>();

    for (const slip of salarySlips || []) {
      const monthKey = slip.posting_date.substring(0, 7); // YYYY-MM
      monthsWithPay.add(monthKey);

      // Sum up earnings that count towards 13th month
      for (const earning of slip.salary_slip_earnings || []) {
        // Include Basic Pay and other regular taxable earnings
        if (earning.is_tax_applicable) {
          totalBasicSalary += earning.amount;
        }
      }
    }

    const monthsWorked = monthsWithPay.size;
    const thirteenthMonthPay = monthsWorked > 0
      ? Math.round((totalBasicSalary / 12) * 100) / 100
      : 0;

    return {
      totalBasicSalary: Math.round(totalBasicSalary * 100) / 100,
      monthsWorked,
      thirteenthMonthPay,
      taxExemptThreshold: TAX_EXEMPT_THRESHOLD,
      taxExemptAmount: Math.min(thirteenthMonthPay, TAX_EXEMPT_THRESHOLD),
      taxableAmount: Math.max(thirteenthMonthPay - TAX_EXEMPT_THRESHOLD, 0),
    };
  }

  /**
   * Create a 13th month pay batch for computation
   */
  static async createBatch(
    orgId: string,
    year: number,
    batchName?: string
  ): Promise<ThirteenthMonthBatch> {
    const supabase = await createClient();

    const { data: batch, error } = await supabase
      .from('thirteenth_month_batches')
      .insert({
        org_id: orgId,
        batch_name: batchName || `13th Month Pay ${year}`,
        year,
        total_employees: 0,
        total_amount: 0,
        total_taxable: 0,
        total_tax_exempt: 0,
        status: 'Draft',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create batch: ${error.message}`);
    }

    return {
      id: batch.id,
      orgId: batch.org_id,
      batchName: batch.batch_name,
      year: batch.year,
      totalEmployees: batch.total_employees,
      totalAmount: batch.total_amount,
      totalTaxable: batch.total_taxable,
      totalTaxExempt: batch.total_tax_exempt,
      status: batch.status,
      computedAt: batch.computed_at ? new Date(batch.computed_at) : undefined,
      releasedAt: batch.released_at ? new Date(batch.released_at) : undefined,
      createdAt: new Date(batch.created_at),
      updatedAt: new Date(batch.updated_at),
    };
  }

  /**
   * Compute 13th month for all eligible employees in an organization
   */
  static async computeForOrganization(
    options: ComputationOptions
  ): Promise<{
    batchId: string;
    computations: ThirteenthMonthComputation[];
    summary: {
      totalEmployees: number;
      totalAmount: number;
      totalTaxable: number;
      totalTaxExempt: number;
    };
  }> {
    const supabase = await createClient();
    const { orgId, year, employeeIds, departmentId, asOfDate, includeProrated } = options;

    // Get eligible employees
    let employeeQuery = supabase
      .from('employees')
      .select('id, employee_no, first_name, last_name, date_of_joining, relieving_date, status')
      .eq('org_id', orgId);

    // Filter by department if specified
    if (departmentId) {
      employeeQuery = employeeQuery.eq('department_id', departmentId);
    }

    // Filter by specific employee IDs if provided
    if (employeeIds && employeeIds.length > 0) {
      employeeQuery = employeeQuery.in('id', employeeIds);
    }

    // Only include active employees or those who left during the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    employeeQuery = employeeQuery.or(
      `status.eq.Active,and(status.eq.Left,relieving_date.gte.${yearStart.toISOString()})`
    );

    // Must have joined before the year ends
    employeeQuery = employeeQuery.lte('date_of_joining', yearEnd.toISOString());

    const { data: employees, error: empError } = await employeeQuery;

    if (empError) {
      throw new Error(`Failed to fetch employees: ${empError.message}`);
    }

    if (!employees || employees.length === 0) {
      throw new Error('No eligible employees found');
    }

    // Create batch
    const batch = await this.createBatch(orgId, year);

    // Compute for each employee
    const computations: ThirteenthMonthComputation[] = [];
    let totalAmount = 0;
    let totalTaxable = 0;
    let totalTaxExempt = 0;

    for (const employee of employees) {
      try {
        const computation = await this.computeForEmployee(employee.id, year, asOfDate);

        // Save computation to database
        await supabase.from('thirteenth_month_computations').insert({
          batch_id: batch.id,
          employee_id: employee.id,
          year,
          total_basic_salary: computation.totalBasicSalary,
          months_worked: computation.monthsWorked,
          thirteenth_month_pay: computation.thirteenthMonthPay,
          tax_exempt_amount: computation.taxExemptAmount,
          taxable_amount: computation.taxableAmount,
          status: 'Computed',
        });

        computations.push(computation);
        totalAmount += computation.thirteenthMonthPay;
        totalTaxable += computation.taxableAmount;
        totalTaxExempt += computation.taxExemptAmount;
      } catch (error) {
        console.error(`Failed to compute 13th month for employee ${employee.id}:`, error);
      }
    }

    // Update batch totals
    await supabase
      .from('thirteenth_month_batches')
      .update({
        total_employees: computations.length,
        total_amount: totalAmount,
        total_taxable: totalTaxable,
        total_tax_exempt: totalTaxExempt,
        status: 'Computed',
        computed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    return {
      batchId: batch.id,
      computations,
      summary: {
        totalEmployees: computations.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalTaxExempt: Math.round(totalTaxExempt * 100) / 100,
      },
    };
  }

  /**
   * Release 13th month pay (mark as paid)
   */
  static async releaseBatch(
    batchId: string,
    releaseDate?: Date
  ): Promise<void> {
    const supabase = await createClient();
    const effectiveDate = releaseDate || new Date();

    // Update batch status
    const { error: batchError } = await supabase
      .from('thirteenth_month_batches')
      .update({
        status: 'Released',
        released_at: effectiveDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .eq('status', 'Computed');

    if (batchError) {
      throw new Error(`Failed to release batch: ${batchError.message}`);
    }

    // Update all computations in the batch
    const { error: compError } = await supabase
      .from('thirteenth_month_computations')
      .update({
        status: 'Released',
        release_date: effectiveDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('batch_id', batchId);

    if (compError) {
      console.error('Failed to update computation statuses:', compError);
    }
  }

  /**
   * Get batch details with computations
   */
  static async getBatchDetails(
    batchId: string
  ): Promise<{
    batch: ThirteenthMonthBatch;
    computations: ThirteenthMonthComputation[];
  }> {
    const supabase = await createClient();

    const { data: batch, error: batchError } = await supabase
      .from('thirteenth_month_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      throw new Error('Batch not found');
    }

    const { data: computations, error: compError } = await supabase
      .from('thirteenth_month_computations')
      .select(`
        *,
        employee:employees (
          id,
          employee_no,
          first_name,
          last_name
        )
      `)
      .eq('batch_id', batchId)
      .order('employee_no', { ascending: true, foreignTable: 'employees' });

    if (compError) {
      throw new Error(`Failed to fetch computations: ${compError.message}`);
    }

    return {
      batch: {
        id: batch.id,
        orgId: batch.org_id,
        batchName: batch.batch_name,
        year: batch.year,
        totalEmployees: batch.total_employees,
        totalAmount: batch.total_amount,
        totalTaxable: batch.total_taxable,
        totalTaxExempt: batch.total_tax_exempt,
        status: batch.status,
        computedAt: batch.computed_at ? new Date(batch.computed_at) : undefined,
        releasedAt: batch.released_at ? new Date(batch.released_at) : undefined,
        createdAt: new Date(batch.created_at),
        updatedAt: new Date(batch.updated_at),
      },
      computations: (computations || []).map((c) => ({
        employeeId: c.employee_id,
        employeeNo: c.employee?.employee_no || '',
        employeeName: c.employee
          ? `${c.employee.first_name} ${c.employee.last_name}`
          : '',
        year: c.year,
        totalBasicSalary: c.total_basic_salary,
        monthsWorked: c.months_worked,
        thirteenthMonthPay: c.thirteenth_month_pay,
        taxExemptThreshold: TAX_EXEMPT_THRESHOLD,
        taxExemptAmount: c.tax_exempt_amount,
        taxableAmount: c.taxable_amount,
        status: c.status,
        releaseDate: c.release_date ? new Date(c.release_date) : undefined,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })),
    };
  }

  /**
   * List batches for an organization
   */
  static async listBatches(
    orgId: string,
    year?: number
  ): Promise<ThirteenthMonthBatch[]> {
    const supabase = await createClient();

    let query = supabase
      .from('thirteenth_month_batches')
      .select('*')
      .eq('org_id', orgId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list batches: ${error.message}`);
    }

    return (data || []).map((b) => ({
      id: b.id,
      orgId: b.org_id,
      batchName: b.batch_name,
      year: b.year,
      totalEmployees: b.total_employees,
      totalAmount: b.total_amount,
      totalTaxable: b.total_taxable,
      totalTaxExempt: b.total_tax_exempt,
      status: b.status,
      computedAt: b.computed_at ? new Date(b.computed_at) : undefined,
      releasedAt: b.released_at ? new Date(b.released_at) : undefined,
      createdAt: new Date(b.created_at),
      updatedAt: new Date(b.updated_at),
    }));
  }

  /**
   * Generate 13th month pay report
   */
  static async generateReport(
    batchId: string
  ): Promise<{
    title: string;
    year: number;
    computedDate: Date;
    employees: Array<{
      employeeNo: string;
      employeeName: string;
      totalBasicSalary: number;
      monthsWorked: number;
      thirteenthMonthPay: number;
      taxExemptAmount: number;
      taxableAmount: number;
    }>;
    totals: {
      totalBasicSalary: number;
      totalThirteenthMonth: number;
      totalTaxExempt: number;
      totalTaxable: number;
    };
  }> {
    const { batch, computations } = await this.getBatchDetails(batchId);

    const employees = computations.map((c) => ({
      employeeNo: c.employeeNo,
      employeeName: c.employeeName,
      totalBasicSalary: c.totalBasicSalary,
      monthsWorked: c.monthsWorked,
      thirteenthMonthPay: c.thirteenthMonthPay,
      taxExemptAmount: c.taxExemptAmount,
      taxableAmount: c.taxableAmount,
    }));

    const totals = employees.reduce(
      (acc, e) => ({
        totalBasicSalary: acc.totalBasicSalary + e.totalBasicSalary,
        totalThirteenthMonth: acc.totalThirteenthMonth + e.thirteenthMonthPay,
        totalTaxExempt: acc.totalTaxExempt + e.taxExemptAmount,
        totalTaxable: acc.totalTaxable + e.taxableAmount,
      }),
      { totalBasicSalary: 0, totalThirteenthMonth: 0, totalTaxExempt: 0, totalTaxable: 0 }
    );

    return {
      title: batch.batchName,
      year: batch.year,
      computedDate: batch.computedAt || new Date(),
      employees,
      totals: {
        totalBasicSalary: Math.round(totals.totalBasicSalary * 100) / 100,
        totalThirteenthMonth: Math.round(totals.totalThirteenthMonth * 100) / 100,
        totalTaxExempt: Math.round(totals.totalTaxExempt * 100) / 100,
        totalTaxable: Math.round(totals.totalTaxable * 100) / 100,
      },
    };
  }
}
