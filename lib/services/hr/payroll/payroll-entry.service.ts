/**
 * Payroll Entry Service
 * Manages payroll entry creation and submission
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PayrollEntry,
  PayrollEntryWithDetails,
  CreatePayrollEntry,
} from '@/lib/models/hr/payroll';
import { HrError } from '../statutory-ph.service';
import { mapDbToPayrollEntry, mapDbToSalarySlip } from './mappers';
import type { PayrollEntryRow, PayrollEmployee, AttendanceSummary } from './types';

export class PayrollEntryService {
  /**
   * Create a new payroll entry
   */
  static async createPayrollEntry(input: CreatePayrollEntry): Promise<PayrollEntry> {
    const supabase = await createClient();

    // Generate payroll entry number
    const { data: lastPe } = await supabase
      .from('payroll_entries')
      .select('payroll_entry_no')
      .eq('org_id', input.orgId)
      .like('payroll_entry_no', 'PE-%')
      .order('payroll_entry_no', { ascending: false })
      .limit(1);

    const lastNum = lastPe?.[0]?.payroll_entry_no
      ? parseInt(lastPe[0].payroll_entry_no.replace('PE-', '')) || 0
      : 0;
    const payrollEntryNo = `PE-${String(lastNum + 1).padStart(5, '0')}`;

    const { data, error } = await supabase
      .from('payroll_entries')
      .insert({
        org_id: input.orgId,
        payroll_entry_no: payrollEntryNo,
        payroll_period_id: input.payrollPeriodId,
        posting_date: input.postingDate.toISOString(),
        start_date: input.startDate.toISOString(),
        end_date: input.endDate.toISOString(),
        payroll_frequency: input.payrollFrequency,
        department_id: input.departmentId,
        branch_id: input.branchId,
        designation_id: input.designationId,
        company_id: input.companyId,
        currency: input.currency,
        exchange_rate: input.exchangeRate,
        payment_account_id: input.paymentAccountId,
        cost_center_id: input.costCenterId,
        project_id: input.projectId,
        status: 'Draft',
        docstatus: 0,
        total_employees: 0,
        total_gross_pay: 0,
        total_deductions: 0,
        total_net_pay: 0,
      })
      .select()
      .single();

    if (error) {
      throw new HrError(`Failed to create payroll entry: ${error.message}`);
    }

    return mapDbToPayrollEntry(data as PayrollEntryRow);
  }

  /**
   * Get payroll entry by ID
   */
  static async getPayrollEntryById(id: string): Promise<PayrollEntryWithDetails> {
    const supabase = await createClient();

    const { data: pe, error } = await supabase
      .from('payroll_entries')
      .select(`
        *,
        departments (department_name),
        branches (branch_name)
      `)
      .eq('id', id)
      .single();

    if (error || !pe) {
      throw new HrError(`Payroll entry not found: ${id}`);
    }

    // Get salary slips
    const { data: slips } = await supabase
      .from('salary_slips')
      .select('*')
      .eq('payroll_entry_id', id)
      .order('employee_name');

    return {
      ...mapDbToPayrollEntry(pe as PayrollEntryRow),
      departmentName: pe.departments?.department_name,
      branchName: pe.branches?.branch_name,
      salarySlips: (slips || []).map(mapDbToSalarySlip),
    };
  }

  /**
   * Get employees for payroll based on filters
   */
  static async getEmployeesForPayroll(
    orgId: string,
    startDate: Date,
    endDate: Date,
    filters: {
      departmentId?: string;
      branchId?: string;
      designationId?: string;
    } = {}
  ): Promise<PayrollEmployee[]> {
    const supabase = await createClient();

    interface SalaryAssignmentRow {
      id: string;
      employee_id: string;
      base_pay: string | number;
      employees: {
        employee_no: string;
        first_name: string;
        middle_name?: string;
        last_name: string;
        status: string;
        department_id?: string;
        designation_id?: string;
        branch_id?: string;
        departments?: { department_name: string };
        designations?: { designation_name: string };
      };
    }

    // Get active employees with salary structure assignments
    let query = supabase
      .from('salary_structure_assignments')
      .select(`
        id, employee_id, base_pay,
        employees!inner (
          employee_no, first_name, middle_name, last_name, status,
          department_id, designation_id, branch_id,
          departments (department_name),
          designations (designation_name)
        )
      `)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .eq('docstatus', 1)
      .lte('from_date', endDate.toISOString())
      .or(`to_date.is.null,to_date.gte.${startDate.toISOString()}`)
      .eq('employees.status', 'Active');

    if (filters.departmentId) {
      query = query.eq('employees.department_id', filters.departmentId);
    }

    if (filters.branchId) {
      query = query.eq('employees.branch_id', filters.branchId);
    }

    if (filters.designationId) {
      query = query.eq('employees.designation_id', filters.designationId);
    }

    const { data, error } = await query;

    if (error) {
      throw new HrError(`Failed to get employees: ${error.message}`);
    }

    return ((data || []) as unknown as SalaryAssignmentRow[]).map((row) => ({
      employeeId: row.employee_id,
      employeeNo: row.employees.employee_no,
      employeeName: `${row.employees.first_name} ${row.employees.middle_name || ''} ${row.employees.last_name}`.trim(),
      departmentName: row.employees.departments?.department_name,
      designationName: row.employees.designations?.designation_name,
      salaryStructureAssignmentId: row.id,
      basePay: parseFloat(String(row.base_pay)) || 0,
    }));
  }

  /**
   * Submit payroll entry
   */
  static async submitPayrollEntry(id: string): Promise<PayrollEntry> {
    const supabase = await createClient();

    const pe = await this.getPayrollEntryById(id);

    if (pe.status !== 'Draft') {
      throw new HrError('Only draft payroll entries can be submitted');
    }

    if (pe.salarySlips.length === 0) {
      throw new HrError('Create salary slips before submitting');
    }

    // Submit all salary slips
    await supabase
      .from('salary_slips')
      .update({ status: 'Submitted', docstatus: 1 })
      .eq('payroll_entry_id', id);

    // Update payroll entry
    const { data, error } = await supabase
      .from('payroll_entries')
      .update({
        status: 'Submitted',
        docstatus: 1,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new HrError(`Failed to submit payroll entry: ${error.message}`);
    }

    return mapDbToPayrollEntry(data as PayrollEntryRow);
  }

  /**
   * Update payroll entry totals after salary slips are created
   */
  static async updatePayrollEntryTotals(payrollEntryId: string): Promise<void> {
    const supabase = await createClient();

    const { data: slips } = await supabase
      .from('salary_slips')
      .select('gross_pay, total_deduction, net_pay')
      .eq('payroll_entry_id', payrollEntryId);

    const totals = (slips || []).reduce(
      (acc, slip) => ({
        employees: acc.employees + 1,
        grossPay: acc.grossPay + (parseFloat(slip.gross_pay) || 0),
        deductions: acc.deductions + (parseFloat(slip.total_deduction) || 0),
        netPay: acc.netPay + (parseFloat(slip.net_pay) || 0),
      }),
      { employees: 0, grossPay: 0, deductions: 0, netPay: 0 }
    );

    await supabase
      .from('payroll_entries')
      .update({
        total_employees: totals.employees,
        total_gross_pay: totals.grossPay,
        total_deductions: totals.deductions,
        total_net_pay: totals.netPay,
      })
      .eq('id', payrollEntryId);
  }

  /**
   * Get attendance summary for an employee in a period
   */
  static async getAttendanceSummary(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceSummary> {
    const supabase = await createClient();

    // Get attendance records
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status, working_hours, overtime_hours, night_diff_hours')
      .eq('employee_id', employeeId)
      .gte('attendance_date', startDate.toISOString())
      .lte('attendance_date', endDate.toISOString());

    // Calculate working days in period (excluding weekends)
    let totalWorkingDays = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    const presentDays = (attendance || []).filter(a => a.status === 'Present').length;
    const absentDays = (attendance || []).filter(a => a.status === 'Absent').length;
    const halfDays = (attendance || []).filter(a => a.status === 'Half Day').length;
    const lwpDays = (attendance || []).filter(a => a.status === 'On Leave').length;

    const overtimeHours = (attendance || []).reduce(
      (sum, a) => sum + (parseFloat(a.overtime_hours) || 0), 0
    );
    const nightDiffHours = (attendance || []).reduce(
      (sum, a) => sum + (parseFloat(a.night_diff_hours) || 0), 0
    );

    return {
      totalWorkingDays,
      presentDays: presentDays + (halfDays * 0.5),
      absentDays: absentDays + (halfDays * 0.5),
      leaveWithoutPay: lwpDays,
      overtimeHours,
      nightDiffHours,
      holidayHours: 0,
    };
  }
}
