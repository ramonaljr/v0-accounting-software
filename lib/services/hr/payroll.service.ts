/**
 * Payroll Service
 * Manages payroll processing, salary slips, and GL posting
 * Based on ERPNext's Payroll Entry and Salary Slip
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PayrollEntry,
  PayrollEntryWithDetails,
  SalarySlip,
  SalarySlipWithDetails,
  SalarySlipEarning,
  SalarySlipDeduction,
  AdditionalSalary,
  CreatePayrollEntry,
  CreateAdditionalSalary,
  PayrollCalculationInput,
  PayrollCalculationResult,
  PayslipViewModel,
} from '@/lib/models/hr/payroll';
import type { SalaryStructureAssignment, SalaryStructureWithDetails } from '@/lib/models/hr/salary';
import { PhStatutoryService, HrError } from './statutory-ph.service';
import { evaluateFormula } from '@/lib/utils/formula-parser';

export class PayrollService {
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

    return this.mapDbToPayrollEntry(data);
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
      ...this.mapDbToPayrollEntry(pe),
      departmentName: pe.departments?.department_name,
      branchName: pe.branches?.branch_name,
      salarySlips: (slips || []).map(this.mapDbToSalarySlip),
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
  ): Promise<Array<{
    employeeId: string;
    employeeNo: string;
    employeeName: string;
    departmentName?: string;
    designationName?: string;
    salaryStructureAssignmentId: string;
    basePay: number;
  }>> {
    const supabase = await createClient();

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

    return (data || []).map((row: any) => ({
      employeeId: row.employee_id,
      employeeNo: row.employees.employee_no,
      employeeName: `${row.employees.first_name} ${row.employees.middle_name || ''} ${row.employees.last_name}`.trim(),
      departmentName: row.employees.departments?.department_name,
      designationName: row.employees.designations?.designation_name,
      salaryStructureAssignmentId: row.id,
      basePay: parseFloat(row.base_pay) || 0,
    }));
  }

  /**
   * Create salary slips for a payroll entry
   */
  static async createSalarySlips(payrollEntryId: string): Promise<SalarySlip[]> {
    const supabase = await createClient();

    const pe = await this.getPayrollEntryById(payrollEntryId);

    if (pe.status !== 'Draft') {
      throw new HrError('Can only create salary slips for draft payroll entries');
    }

    // Get employees for this payroll
    const employees = await this.getEmployeesForPayroll(
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
      const attendance = await this.getAttendanceSummary(
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
    await this.updatePayrollEntryTotals(payrollEntryId);

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
    attendance: {
      totalWorkingDays: number;
      presentDays: number;
      absentDays: number;
      leaveWithoutPay: number;
      overtimeHours: number;
      nightDiffHours: number;
      holidayHours: number;
    };
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
    const calculation = await this.calculateSalary({
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
        holiday_pay_amount: 0, // Would need holiday rates
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
        year_to_date: 0, // Would need YTD calculation
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

    return this.mapDbToSalarySlip(slip);
  }

  /**
   * Calculate salary for an employee
   */
  static async calculateSalary(
    input: PayrollCalculationInput
  ): Promise<PayrollCalculationResult> {
    const supabase = await createClient();

    // Get salary structure assignment
    const { data: assignment } = await supabase
      .from('salary_structure_assignments')
      .select('*, salary_structures (*)')
      .eq('id', input.salaryStructureAssignmentId)
      .single();

    if (!assignment) {
      throw new HrError('Salary structure assignment not found');
    }

    const salaryStructure = await this.getSalaryStructureWithDetails(
      assignment.salary_structure_id
    );

    const basePay = parseFloat(assignment.base_pay) || 0;
    const paymentDays = input.presentDays;
    const totalDays = input.totalWorkingDays;

    // Calculate earnings
    const earnings: PayrollCalculationResult['earnings'] = [];
    let grossPay = 0;

    for (const earning of salaryStructure.earnings) {
      let amount = 0;

      if (earning.amountBasedOnFormula && earning.formula) {
        // Evaluate formula using safe parser
        amount = this.evaluateFormulaInternal(earning.formula, { basePay, paymentDays, totalDays });
      } else {
        // Pro-rate based on payment days
        amount = (earning.amount || basePay) * (paymentDays / totalDays);
      }

      // Get component details
      const { data: component } = await supabase
        .from('salary_components')
        .select('component_name, is_tax_applicable')
        .eq('id', earning.salaryComponentId)
        .single();

      earnings.push({
        componentId: earning.salaryComponentId,
        componentName: component?.component_name || '',
        amount: Math.round(amount * 100) / 100,
        isTaxable: component?.is_tax_applicable ?? true,
      });

      grossPay += amount;
    }

    // Add overtime pay
    if (input.overtimeHours > 0) {
      const hourRate = basePay / (salaryStructure.paymentDaysPerMonth * 8);
      const otAmount = input.overtimeHours * hourRate * 1.25; // 125% for regular OT
      earnings.push({
        componentId: 'overtime',
        componentName: 'Overtime Pay',
        amount: Math.round(otAmount * 100) / 100,
        isTaxable: true,
      });
      grossPay += otAmount;
    }

    // Add night differential
    if (input.nightDiffHours > 0) {
      const hourRate = basePay / (salaryStructure.paymentDaysPerMonth * 8);
      const ndAmount = input.nightDiffHours * hourRate * 0.10; // 10% additional
      earnings.push({
        componentId: 'night_diff',
        componentName: 'Night Differential',
        amount: Math.round(ndAmount * 100) / 100,
        isTaxable: true,
      });
      grossPay += ndAmount;
    }

    // Add additional earnings
    for (const addEarning of input.additionalEarnings) {
      const { data: component } = await supabase
        .from('salary_components')
        .select('component_name, is_tax_applicable')
        .eq('id', addEarning.componentId)
        .single();

      earnings.push({
        componentId: addEarning.componentId,
        componentName: component?.component_name || '',
        amount: addEarning.amount,
        isTaxable: component?.is_tax_applicable ?? true,
      });
      grossPay += addEarning.amount;
    }

    // Get employee org_id for statutory calculations
    const { data: employee } = await supabase
      .from('employees')
      .select('org_id')
      .eq('id', input.employeeId)
      .single();

    const orgId = employee?.org_id;

    // Calculate statutory deductions
    const statutory = await PhStatutoryService.computeAllStatutoryDeductions(
      orgId,
      basePay, // Monthly basic for PhilHealth
      grossPay, // Monthly gross for SSS/Pag-IBIG
      input.startDate
    );

    // Calculate taxable income
    const taxableIncome = grossPay -
      statutory.sss.employeeContribution -
      statutory.sss.employeeWisp -
      statutory.philhealth.employeeShare -
      statutory.pagibig.employeeContribution;

    // Calculate withholding tax
    const withholdingTax = await PhStatutoryService.computeWithholdingTax(
      orgId,
      taxableIncome,
      salaryStructure.payrollFrequency as any,
      input.startDate
    );

    // Build deductions array
    const deductions: PayrollCalculationResult['deductions'] = [];

    // SSS
    if (statutory.sss.employeeContribution > 0) {
      deductions.push({
        componentId: 'sss',
        componentName: 'SSS Contribution',
        amount: statutory.sss.employeeContribution + statutory.sss.employeeWisp,
      });
    }

    // PhilHealth
    if (statutory.philhealth.employeeShare > 0) {
      deductions.push({
        componentId: 'philhealth',
        componentName: 'PhilHealth Contribution',
        amount: statutory.philhealth.employeeShare,
      });
    }

    // Pag-IBIG
    if (statutory.pagibig.employeeContribution > 0) {
      deductions.push({
        componentId: 'pagibig',
        componentName: 'Pag-IBIG Contribution',
        amount: statutory.pagibig.employeeContribution,
      });
    }

    // Withholding Tax
    if (withholdingTax > 0) {
      deductions.push({
        componentId: 'withholding_tax',
        componentName: 'Withholding Tax',
        amount: withholdingTax,
      });
    }

    // Add salary structure deductions
    for (const deduction of salaryStructure.deductions) {
      let amount = 0;

      if (deduction.amountBasedOnFormula && deduction.formula) {
        amount = this.evaluateFormulaInternal(deduction.formula, { basePay, paymentDays, totalDays, grossPay });
      } else {
        amount = deduction.amount;
      }

      const { data: component } = await supabase
        .from('salary_components')
        .select('component_name')
        .eq('id', deduction.salaryComponentId)
        .single();

      deductions.push({
        componentId: deduction.salaryComponentId,
        componentName: component?.component_name || '',
        amount: Math.round(amount * 100) / 100,
      });
    }

    // Add additional deductions
    for (const addDeduction of input.additionalDeductions) {
      const { data: component } = await supabase
        .from('salary_components')
        .select('component_name')
        .eq('id', addDeduction.componentId)
        .single();

      deductions.push({
        componentId: addDeduction.componentId,
        componentName: component?.component_name || '',
        amount: addDeduction.amount,
      });
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netPay = grossPay - totalDeductions;

    return {
      employeeId: input.employeeId,
      earnings,
      deductions,
      grossPay: Math.round(grossPay * 100) / 100,
      sssEmployee: statutory.sss.employeeContribution + statutory.sss.employeeWisp,
      sssEmployer: statutory.sss.employerContribution + statutory.sss.employerEc + statutory.sss.employerWisp,
      philhealthEmployee: statutory.philhealth.employeeShare,
      philhealthEmployer: statutory.philhealth.employerShare,
      pagibigEmployee: statutory.pagibig.employeeContribution,
      pagibigEmployer: statutory.pagibig.employerContribution,
      taxableIncome: Math.round(taxableIncome * 100) / 100,
      withholdingTax,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netPay: Math.round(netPay * 100) / 100,
    };
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

    return this.mapDbToPayrollEntry(data);
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
      ...this.mapDbToSalarySlip(slip),
      earnings: (earnings || []).map(e => ({
        ...this.mapDbToSalarySlipEarning(e),
        salaryComponentName: e.salary_components?.component_name,
      })),
      deductions: (deductions || []).map(d => ({
        ...this.mapDbToSalarySlipDeduction(d),
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

  // Helper methods
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

    return {
      id: structure.id,
      orgId: structure.org_id,
      structureName: structure.structure_name,
      description: structure.description,
      isActive: structure.is_active,
      isDefault: structure.is_default,
      payrollFrequency: structure.payroll_frequency,
      paymentDaysPerMonth: structure.payment_days_per_month || 22,
      hourRateFormula: structure.hour_rate_formula,
      companyId: structure.company_id,
      currency: structure.currency,
      createdAt: new Date(structure.created_at),
      updatedAt: new Date(structure.updated_at),
      createdBy: structure.created_by,
      earnings: (earnings || []).map(e => ({
        id: e.id,
        salaryStructureId: e.salary_structure_id,
        salaryComponentId: e.salary_component_id,
        amount: parseFloat(e.amount) || 0,
        amountBasedOnFormula: e.amount_based_on_formula,
        formula: e.formula,
        condition: e.condition,
        abbr: e.abbr,
        sequence: e.sequence,
        createdAt: new Date(e.created_at),
      })),
      deductions: (deductions || []).map(d => ({
        id: d.id,
        salaryStructureId: d.salary_structure_id,
        salaryComponentId: d.salary_component_id,
        amount: parseFloat(d.amount) || 0,
        amountBasedOnFormula: d.amount_based_on_formula,
        formula: d.formula,
        condition: d.condition,
        abbr: d.abbr,
        sequence: d.sequence,
        createdAt: new Date(d.created_at),
      })),
    };
  }

  private static async getAttendanceSummary(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    leaveWithoutPay: number;
    overtimeHours: number;
    nightDiffHours: number;
    holidayHours: number;
  }> {
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
    const lwpDays = (attendance || []).filter(a => a.status === 'On Leave').length; // Simplified

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
      holidayHours: 0, // Would need holiday integration
    };
  }

  private static async updatePayrollEntryTotals(payrollEntryId: string): Promise<void> {
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
   * Evaluate formula using safe parser (no eval)
   */
  private static evaluateFormulaInternal(
    formula: string,
    variables: Record<string, number>
  ): number {
    return evaluateFormula(formula, variables);
  }

  private static numberToWords(num: number): string {
    // Simplified - would need proper implementation
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    });
    return `${formatter.format(num)} only`;
  }

  /**
   * Get Year-to-Date earnings for an employee
   * Uses the database function get_ytd_earnings for efficient calculation
   */
  static async getYTDEarnings(
    employeeId: string,
    year: number,
    asOfDate?: Date
  ): Promise<{
    ytdGrossPay: number;
    ytdTaxableIncome: number;
    ytdTaxWithheld: number;
    ytdSss: number;
    ytdPhilhealth: number;
    ytdPagibig: number;
  }> {
    const supabase = await createClient();
    const effectiveDate = asOfDate || new Date();

    // Try to use the database function first
    const { data, error } = await supabase.rpc('get_ytd_earnings', {
      p_employee_id: employeeId,
      p_year: year,
      p_as_of_date: effectiveDate.toISOString().split('T')[0],
    });

    if (!error && data && data.length > 0) {
      const result = data[0];
      return {
        ytdGrossPay: parseFloat(result.ytd_gross_pay) || 0,
        ytdTaxableIncome: parseFloat(result.ytd_taxable_income) || 0,
        ytdTaxWithheld: parseFloat(result.ytd_tax_withheld) || 0,
        ytdSss: parseFloat(result.ytd_sss) || 0,
        ytdPhilhealth: parseFloat(result.ytd_philhealth) || 0,
        ytdPagibig: parseFloat(result.ytd_pagibig) || 0,
      };
    }

    // Fallback: Manual calculation from salary slips
    const startOfYear = new Date(year, 0, 1);
    const { data: slips, error: slipsError } = await supabase
      .from('salary_slips')
      .select('gross_pay, withholding_tax, sss_employee, philhealth_employee, pagibig_employee')
      .eq('employee_id', employeeId)
      .eq('docstatus', 1)
      .gte('posting_date', startOfYear.toISOString())
      .lte('posting_date', effectiveDate.toISOString());

    if (slipsError || !slips) {
      return {
        ytdGrossPay: 0,
        ytdTaxableIncome: 0,
        ytdTaxWithheld: 0,
        ytdSss: 0,
        ytdPhilhealth: 0,
        ytdPagibig: 0,
      };
    }

    const totals = slips.reduce(
      (acc, slip) => ({
        ytdGrossPay: acc.ytdGrossPay + (parseFloat(slip.gross_pay) || 0),
        ytdTaxWithheld: acc.ytdTaxWithheld + (parseFloat(slip.withholding_tax) || 0),
        ytdSss: acc.ytdSss + (parseFloat(slip.sss_employee) || 0),
        ytdPhilhealth: acc.ytdPhilhealth + (parseFloat(slip.philhealth_employee) || 0),
        ytdPagibig: acc.ytdPagibig + (parseFloat(slip.pagibig_employee) || 0),
      }),
      { ytdGrossPay: 0, ytdTaxWithheld: 0, ytdSss: 0, ytdPhilhealth: 0, ytdPagibig: 0 }
    );

    // Calculate taxable income (gross - SSS - PhilHealth - Pag-IBIG)
    const ytdTaxableIncome = totals.ytdGrossPay - totals.ytdSss - totals.ytdPhilhealth - totals.ytdPagibig;

    return {
      ...totals,
      ytdTaxableIncome: Math.round(ytdTaxableIncome * 100) / 100,
    };
  }

  /**
   * Get working days for a period, excluding holidays and weekends
   */
  static async getWorkingDays(
    orgId: string,
    fromDate: Date,
    toDate: Date,
    holidayListId?: string
  ): Promise<number> {
    const supabase = await createClient();

    // Try to use the database function
    const { data, error } = await supabase.rpc('get_working_days', {
      p_org_id: orgId,
      p_from_date: fromDate.toISOString().split('T')[0],
      p_to_date: toDate.toISOString().split('T')[0],
      p_holiday_list_id: holidayListId || null,
    });

    if (!error && data !== null) {
      return data;
    }

    // Fallback: Manual calculation
    let workingDays = 0;
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      const dayOfWeek = currentDate.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Get holiday pay computation for an attendance date
   * Uses the database function compute_holiday_pay
   */
  static async computeHolidayPay(
    orgId: string,
    employeeId: string,
    attendanceDate: Date,
    dailyRate: number,
    hoursWorked?: number
  ): Promise<{
    holidayType: string | null;
    basePay: number;
    holidayPremium: number;
    totalPay: number;
  }> {
    const supabase = await createClient();

    // Try to use the database function
    const { data, error } = await supabase.rpc('compute_holiday_pay', {
      p_org_id: orgId,
      p_employee_id: employeeId,
      p_attendance_date: attendanceDate.toISOString().split('T')[0],
      p_daily_rate: dailyRate,
      p_hours_worked: hoursWorked || 8,
    });

    if (!error && data && data.length > 0) {
      const result = data[0];
      return {
        holidayType: result.holiday_type,
        basePay: parseFloat(result.base_pay) || dailyRate,
        holidayPremium: parseFloat(result.holiday_premium) || 0,
        totalPay: parseFloat(result.total_pay) || dailyRate,
      };
    }

    // Fallback: Check for holiday manually
    const { data: holiday } = await supabase
      .from('holidays')
      .select(`
        holiday_type,
        holiday_pay_rate,
        holiday_lists!inner (
          org_id,
          is_default
        )
      `)
      .eq('holiday_date', attendanceDate.toISOString().split('T')[0])
      .eq('holiday_lists.org_id', orgId)
      .eq('holiday_lists.is_default', true)
      .maybeSingle();

    if (!holiday) {
      // Not a holiday
      return {
        holidayType: null,
        basePay: dailyRate,
        holidayPremium: 0,
        totalPay: dailyRate,
      };
    }

    // Calculate based on PH Labor Code
    const holidayRates: Record<string, number> = {
      'Regular': 2.0,           // 200% for regular holidays
      'Special Non-Working': 1.30,  // 130% for special non-working
      'Special Working': 1.30,
    };

    const rate = holiday.holiday_pay_rate || holidayRates[holiday.holiday_type] || 1.0;
    const holidayPremium = Math.round(dailyRate * (rate - 1) * 100) / 100;
    const totalPay = Math.round(dailyRate * rate * 100) / 100;

    return {
      holidayType: holiday.holiday_type,
      basePay: dailyRate,
      holidayPremium,
      totalPay,
    };
  }

  /**
   * Get all holidays in a date range
   */
  static async getHolidaysInRange(
    orgId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Array<{
    date: Date;
    name: string;
    holidayType: string;
    payRate: number;
  }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holidays')
      .select(`
        holiday_date,
        holiday_name,
        holiday_type,
        holiday_pay_rate,
        holiday_lists!inner (
          org_id,
          is_default
        )
      `)
      .gte('holiday_date', fromDate.toISOString().split('T')[0])
      .lte('holiday_date', toDate.toISOString().split('T')[0])
      .eq('holiday_lists.org_id', orgId)
      .eq('holiday_lists.is_default', true)
      .order('holiday_date', { ascending: true });

    if (error || !data) {
      return [];
    }

    const holidayRates: Record<string, number> = {
      'Regular': 2.0,
      'Special Non-Working': 1.30,
      'Special Working': 1.30,
    };

    return data.map((h) => ({
      date: new Date(h.holiday_date),
      name: h.holiday_name,
      holidayType: h.holiday_type,
      payRate: h.holiday_pay_rate || holidayRates[h.holiday_type] || 1.0,
    }));
  }

  /**
   * Calculate holiday pay for an entire payroll period
   */
  static async calculatePeriodHolidayPay(
    orgId: string,
    employeeId: string,
    fromDate: Date,
    toDate: Date,
    dailyRate: number
  ): Promise<{
    holidayDays: number;
    regularHolidayPay: number;
    specialHolidayPay: number;
    totalHolidayPay: number;
    holidays: Array<{
      date: Date;
      name: string;
      type: string;
      amount: number;
    }>;
  }> {
    const holidays = await this.getHolidaysInRange(orgId, fromDate, toDate);

    let regularHolidayPay = 0;
    let specialHolidayPay = 0;
    const holidayDetails: Array<{
      date: Date;
      name: string;
      type: string;
      amount: number;
    }> = [];

    for (const holiday of holidays) {
      const dayOfWeek = holiday.date.getDay();
      // Skip weekends for holiday pay (unless worked - handled separately)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      const premium = Math.round(dailyRate * (holiday.payRate - 1) * 100) / 100;

      if (holiday.holidayType === 'Regular') {
        regularHolidayPay += premium;
      } else {
        specialHolidayPay += premium;
      }

      holidayDetails.push({
        date: holiday.date,
        name: holiday.name,
        type: holiday.holidayType,
        amount: premium,
      });
    }

    return {
      holidayDays: holidayDetails.length,
      regularHolidayPay: Math.round(regularHolidayPay * 100) / 100,
      specialHolidayPay: Math.round(specialHolidayPay * 100) / 100,
      totalHolidayPay: Math.round((regularHolidayPay + specialHolidayPay) * 100) / 100,
      holidays: holidayDetails,
    };
  }

  // Mapping functions
  private static mapDbToPayrollEntry(row: any): PayrollEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      payrollEntryNo: row.payroll_entry_no,
      payrollPeriodId: row.payroll_period_id,
      postingDate: new Date(row.posting_date),
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      payrollFrequency: row.payroll_frequency,
      departmentId: row.department_id,
      branchId: row.branch_id,
      designationId: row.designation_id,
      companyId: row.company_id,
      currency: row.currency || 'PHP',
      exchangeRate: parseFloat(row.exchange_rate) || 1,
      paymentAccountId: row.payment_account_id,
      costCenterId: row.cost_center_id,
      projectId: row.project_id,
      totalEmployees: row.total_employees || 0,
      totalGrossPay: parseFloat(row.total_gross_pay) || 0,
      totalDeductions: parseFloat(row.total_deductions) || 0,
      totalNetPay: parseFloat(row.total_net_pay) || 0,
      status: row.status,
      docstatus: row.docstatus || 0,
      journalEntryId: row.journal_entry_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      submittedBy: row.submitted_by,
    };
  }

  private static mapDbToSalarySlip(row: any): SalarySlip {
    return {
      id: row.id,
      orgId: row.org_id,
      salarySlipNo: row.salary_slip_no,
      employeeId: row.employee_id,
      payrollEntryId: row.payroll_entry_id,
      postingDate: new Date(row.posting_date),
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      employeeName: row.employee_name,
      department: row.department,
      designation: row.designation,
      branch: row.branch,
      salaryStructureId: row.salary_structure_id,
      totalWorkingDays: parseFloat(row.total_working_days) || 0,
      paymentDays: parseFloat(row.payment_days) || 0,
      leaveWithoutPay: parseFloat(row.leave_without_pay) || 0,
      absentDays: parseFloat(row.absent_days) || 0,
      totalWorkingHours: parseFloat(row.total_working_hours) || 0,
      hourRate: parseFloat(row.hour_rate) || 0,
      overtimeHours: parseFloat(row.overtime_hours) || 0,
      overtimeAmount: parseFloat(row.overtime_amount) || 0,
      nightDiffHours: parseFloat(row.night_diff_hours) || 0,
      nightDiffAmount: parseFloat(row.night_diff_amount) || 0,
      holidayHours: parseFloat(row.holiday_hours) || 0,
      holidayPayAmount: parseFloat(row.holiday_pay_amount) || 0,
      grossPay: parseFloat(row.gross_pay) || 0,
      totalDeduction: parseFloat(row.total_deduction) || 0,
      netPay: parseFloat(row.net_pay) || 0,
      roundedTotal: parseFloat(row.rounded_total) || 0,
      sssEmployee: parseFloat(row.sss_employee) || 0,
      sssEmployer: parseFloat(row.sss_employer) || 0,
      philhealthEmployee: parseFloat(row.philhealth_employee) || 0,
      philhealthEmployer: parseFloat(row.philhealth_employer) || 0,
      pagibigEmployee: parseFloat(row.pagibig_employee) || 0,
      pagibigEmployer: parseFloat(row.pagibig_employer) || 0,
      withholdingTax: parseFloat(row.withholding_tax) || 0,
      ytdGrossPay: parseFloat(row.ytd_gross_pay) || 0,
      ytdTaxableIncome: parseFloat(row.ytd_taxable_income) || 0,
      ytdTaxWithheld: parseFloat(row.ytd_tax_withheld) || 0,
      bankName: row.bank_name,
      bankAccountNo: row.bank_account_no,
      status: row.status,
      docstatus: row.docstatus || 0,
      journalEntryId: row.journal_entry_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  }

  private static mapDbToSalarySlipEarning(row: any): SalarySlipEarning {
    return {
      id: row.id,
      salarySlipId: row.salary_slip_id,
      salaryComponentId: row.salary_component_id,
      amount: parseFloat(row.amount) || 0,
      yearToDate: parseFloat(row.year_to_date) || 0,
      isTaxApplicable: row.is_tax_applicable ?? true,
      isSssApplicable: row.is_sss_applicable ?? true,
      isPhilhealthApplicable: row.is_philhealth_applicable ?? true,
      isPagibigApplicable: row.is_pagibig_applicable ?? true,
      abbr: row.abbr,
      sequence: row.sequence || 0,
      createdAt: new Date(row.created_at),
    };
  }

  private static mapDbToSalarySlipDeduction(row: any): SalarySlipDeduction {
    return {
      id: row.id,
      salarySlipId: row.salary_slip_id,
      salaryComponentId: row.salary_component_id,
      amount: parseFloat(row.amount) || 0,
      yearToDate: parseFloat(row.year_to_date) || 0,
      abbr: row.abbr,
      sequence: row.sequence || 0,
      createdAt: new Date(row.created_at),
    };
  }
}
