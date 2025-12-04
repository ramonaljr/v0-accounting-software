/**
 * Salary Slip Service
 * Manages salary slip creation, viewing, and payslip generation
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SalarySlip,
  SalarySlipWithDetails,
  PayslipViewModel,
} from '@/lib/models/hr/payroll';
import { HrError } from '../statutory-ph.service';
import {
  mapDbToSalarySlip,
  mapDbToSalarySlipEarning,
  mapDbToSalarySlipDeduction,
  mapDbToSalaryStructure,
} from './mappers';
import { PayrollCalculationService } from './payroll-calculation.service';
import { PayrollEntryService } from './payroll-entry.service';
import type { SalarySlipRow, SalaryStructureWithDetails, AttendanceSummary } from './types';

export class SalarySlipService {
  /**
   * Create salary slips for a payroll entry
   */
  static async createSalarySlips(payrollEntryId: string): Promise<SalarySlip[]> {
    const supabase = await createClient();

    const pe = await PayrollEntryService.getPayrollEntryById(payrollEntryId);

    if (pe.status !== 'Draft') {
      throw new HrError('Can only create salary slips for draft payroll entries');
    }

    // Get employees for this payroll
    const employees = await PayrollEntryService.getEmployeesForPayroll(
      pe.orgId,
      pe.startDate,
      pe.endDate,
      {
        departmentId: pe.departmentId,
        branchId: pe.branchId,
        designationId: pe.designationId,
      }
    );

    const createdSlips: SalarySlip[] = [];

    for (const emp of employees) {
      // Check if slip already exists
      const { data: existingSlip } = await supabase
        .from('salary_slips')
        .select('id')
        .eq('payroll_entry_id', payrollEntryId)
        .eq('employee_id', emp.employeeId)
        .single();

      if (existingSlip) continue;

      // Get attendance summary for period
      const attendance = await PayrollEntryService.getAttendanceSummary(
        emp.employeeId,
        pe.startDate,
        pe.endDate
      );

      // Create salary slip
      const slip = await this.createSalarySlip({
        orgId: pe.orgId,
        employeeId: emp.employeeId,
        payrollEntryId,
        startDate: pe.startDate,
        endDate: pe.endDate,
        salaryStructureAssignmentId: emp.salaryStructureAssignmentId,
        attendance,
      });

      createdSlips.push(slip);
    }

    // Update payroll entry totals
    await PayrollEntryService.updatePayrollEntryTotals(payrollEntryId);

    return createdSlips;
  }

  /**
   * Create individual salary slip
   */
  static async createSalarySlip(input: {
    orgId: string;
    employeeId: string;
    payrollEntryId?: string;
    startDate: Date;
    endDate: Date;
    salaryStructureAssignmentId: string;
    attendance: AttendanceSummary;
  }): Promise<SalarySlip> {
    const supabase = await createClient();

    // Get employee details
    const { data: employee } = await supabase
      .from('employees')
      .select(`
        *,
        departments (department_name),
        designations (designation_name),
        branches (branch_name)
      `)
      .eq('id', input.employeeId)
      .single();

    if (!employee) {
      throw new HrError(`Employee not found: ${input.employeeId}`);
    }

    // Get salary structure assignment
    const { data: assignment } = await supabase
      .from('salary_structure_assignments')
      .select(`
        *,
        salary_structures (
          *
        )
      `)
      .eq('id', input.salaryStructureAssignmentId)
      .single();

    if (!assignment) {
      throw new HrError('Salary structure assignment not found');
    }

    // Get salary structure with earnings and deductions
    const salaryStructure = await this.getSalaryStructureWithDetails(
      assignment.salary_structure_id
    );

    // Calculate salary
    const calculation = await PayrollCalculationService.calculateSalary({
      employeeId: input.employeeId,
      startDate: input.startDate,
      endDate: input.endDate,
      salaryStructureAssignmentId: input.salaryStructureAssignmentId,
      totalWorkingDays: input.attendance.totalWorkingDays,
      presentDays: input.attendance.presentDays,
      absentDays: input.attendance.absentDays,
      leaveWithoutPay: input.attendance.leaveWithoutPay,
      overtimeHours: input.attendance.overtimeHours,
      nightDiffHours: input.attendance.nightDiffHours,
      holidayHours: input.attendance.holidayHours,
      additionalEarnings: [],
      additionalDeductions: [],
    });

    // Generate salary slip number
    const { data: lastSlip } = await supabase
      .from('salary_slips')
      .select('salary_slip_no')
      .eq('org_id', input.orgId)
      .like('salary_slip_no', 'SS-%')
      .order('salary_slip_no', { ascending: false })
      .limit(1);

    const lastNum = lastSlip?.[0]?.salary_slip_no
      ? parseInt(lastSlip[0].salary_slip_no.replace('SS-', '')) || 0
      : 0;
    const salarySlipNo = `SS-${String(lastNum + 1).padStart(6, '0')}`;

    // Calculate payment days
    const paymentDays = input.attendance.totalWorkingDays -
      input.attendance.absentDays -
      input.attendance.leaveWithoutPay;

    // Calculate hour rate
    const hourRate = parseFloat(assignment.base_pay) /
      (salaryStructure.paymentDaysPerMonth * 8);

    // Insert salary slip
    const { data: slip, error: slipError } = await supabase
      .from('salary_slips')
      .insert({
        org_id: input.orgId,
        salary_slip_no: salarySlipNo,
        employee_id: input.employeeId,
        payroll_entry_id: input.payrollEntryId,
        posting_date: new Date().toISOString(),
        start_date: input.startDate.toISOString(),
        end_date: input.endDate.toISOString(),
        employee_name: `${employee.first_name} ${employee.middle_name || ''} ${employee.last_name}`.trim(),
        department: employee.departments?.department_name,
        designation: employee.designations?.designation_name,
        branch: employee.branches?.branch_name,
        salary_structure_id: salaryStructure.id,
        total_working_days: input.attendance.totalWorkingDays,
        payment_days: paymentDays,
        leave_without_pay: input.attendance.leaveWithoutPay,
        absent_days: input.attendance.absentDays,
        total_working_hours: paymentDays * 8,
        hour_rate: hourRate,
        overtime_hours: input.attendance.overtimeHours,
        overtime_amount: input.attendance.overtimeHours * hourRate * 1.25,
        night_diff_hours: input.attendance.nightDiffHours,
        night_diff_amount: input.attendance.nightDiffHours * hourRate * 0.10,
        holiday_hours: input.attendance.holidayHours,
        holiday_pay_amount: 0,
        gross_pay: calculation.grossPay,
        total_deduction: calculation.totalDeductions,
        net_pay: calculation.netPay,
        rounded_total: Math.round(calculation.netPay),
        sss_employee: calculation.sssEmployee,
        sss_employer: calculation.sssEmployer,
        philhealth_employee: calculation.philhealthEmployee,
        philhealth_employer: calculation.philhealthEmployer,
        pagibig_employee: calculation.pagibigEmployee,
        pagibig_employer: calculation.pagibigEmployer,
        withholding_tax: calculation.withholdingTax,
        bank_name: employee.bank_name,
        bank_account_no: employee.bank_account_no,
        status: 'Draft',
        docstatus: 0,
      })
      .select()
      .single();

    if (slipError) {
      throw new HrError(`Failed to create salary slip: ${slipError.message}`);
    }

    // Insert earnings
    for (let i = 0; i < calculation.earnings.length; i++) {
      const earning = calculation.earnings[i];
      await supabase.from('salary_slip_earnings').insert({
        salary_slip_id: slip.id,
        salary_component_id: earning.componentId,
        amount: earning.amount,
        year_to_date: 0,
        is_tax_applicable: earning.isTaxable,
        is_sss_applicable: true,
        is_philhealth_applicable: true,
        is_pagibig_applicable: true,
        sequence: i,
      });
    }

    // Insert deductions
    for (let i = 0; i < calculation.deductions.length; i++) {
      const deduction = calculation.deductions[i];
      await supabase.from('salary_slip_deductions').insert({
        salary_slip_id: slip.id,
        salary_component_id: deduction.componentId,
        amount: deduction.amount,
        year_to_date: 0,
        sequence: i,
      });
    }

    return mapDbToSalarySlip(slip as SalarySlipRow);
  }

  /**
   * Get salary slip by ID with details
   */
  static async getSalarySlipById(id: string): Promise<SalarySlipWithDetails> {
    const supabase = await createClient();

    const { data: slip, error } = await supabase
      .from('salary_slips')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !slip) {
      throw new HrError(`Salary slip not found: ${id}`);
    }

    // Get earnings
    const { data: earnings } = await supabase
      .from('salary_slip_earnings')
      .select(`
        *,
        salary_components (component_name)
      `)
      .eq('salary_slip_id', id)
      .order('sequence');

    // Get deductions
    const { data: deductions } = await supabase
      .from('salary_slip_deductions')
      .select(`
        *,
        salary_components (component_name)
      `)
      .eq('salary_slip_id', id)
      .order('sequence');

    return {
      ...mapDbToSalarySlip(slip as SalarySlipRow),
      earnings: (earnings || []).map(e => ({
        ...mapDbToSalarySlipEarning(e),
        salaryComponentName: e.salary_components?.component_name,
      })),
      deductions: (deductions || []).map(d => ({
        ...mapDbToSalarySlipDeduction(d),
        salaryComponentName: d.salary_components?.component_name,
      })),
    };
  }

  /**
   * Generate payslip view model
   */
  static async generatePayslip(salarySlipId: string): Promise<PayslipViewModel> {
    const slip = await this.getSalarySlipById(salarySlipId);

    const supabase = await createClient();

    // Get company details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, address')
      .eq('id', slip.orgId)
      .single();

    // Get employee details
    const { data: employee } = await supabase
      .from('employees')
      .select('employee_no, tin_no, sss_no, philhealth_no, pagibig_no')
      .eq('id', slip.employeeId)
      .single();

    // Format period string
    const startMonth = slip.startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const endMonth = slip.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const payPeriod = startMonth === endMonth
      ? startMonth
      : `${slip.startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endMonth}`;

    return {
      companyName: org?.name || '',
      companyAddress: org?.address || '',
      payPeriod,
      payDate: slip.postingDate,
      employeeNo: employee?.employee_no || '',
      employeeName: slip.employeeName,
      department: slip.department || '',
      designation: slip.designation || '',
      tinNo: employee?.tin_no,
      sssNo: employee?.sss_no,
      philhealthNo: employee?.philhealth_no,
      pagibigNo: employee?.pagibig_no,
      totalDays: slip.totalWorkingDays,
      daysWorked: slip.paymentDays,
      absentDays: slip.absentDays,
      earnings: slip.earnings.map(e => ({
        description: e.salaryComponentName || '',
        amount: e.amount,
      })),
      totalEarnings: slip.grossPay,
      deductions: slip.deductions.map(d => ({
        description: d.salaryComponentName || '',
        amount: d.amount,
      })),
      totalDeductions: slip.totalDeduction,
      netPay: slip.netPay,
      netPayInWords: this.numberToWords(slip.netPay),
      ytdGross: slip.ytdGrossPay,
      ytdTax: slip.ytdTaxWithheld,
      bankName: slip.bankName,
      bankAccountNo: slip.bankAccountNo,
    };
  }

  /**
   * Get salary structure with details
   */
  private static async getSalaryStructureWithDetails(id: string): Promise<SalaryStructureWithDetails> {
    const supabase = await createClient();

    const { data: structure } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('id', id)
      .single();

    const { data: earnings } = await supabase
      .from('salary_structure_earnings')
      .select('*')
      .eq('salary_structure_id', id)
      .order('sequence');

    const { data: deductions } = await supabase
      .from('salary_structure_deductions')
      .select('*')
      .eq('salary_structure_id', id)
      .order('sequence');

    return mapDbToSalaryStructure(structure, earnings || [], deductions || []);
  }

  /**
   * Convert number to words (simplified)
   */
  private static numberToWords(num: number): string {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    });
    return `${formatter.format(num)} only`;
  }
}
