/**
 * Payroll Calculation Service
 * Handles salary calculations, statutory deductions, and earnings
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PayrollCalculationInput,
  PayrollCalculationResult,
} from '@/lib/models/hr/payroll';
import { PhStatutoryService, HrError } from '../statutory-ph.service';
import { evaluateFormula } from '@/lib/utils/formula-parser';
import { mapDbToSalaryStructure } from './mappers';
import type { SalaryStructureWithDetails } from './types';

export class PayrollCalculationService {
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
      salaryStructure.payrollFrequency as 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Daily',
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
   * Get Year-to-Date earnings for an employee
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
   * Get working days for a period
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
   * Evaluate formula using safe parser (no eval)
   */
  private static evaluateFormulaInternal(
    formula: string,
    variables: Record<string, number>
  ): number {
    return evaluateFormula(formula, variables);
  }
}
