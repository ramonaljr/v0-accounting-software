/**
 * Payroll Entity Mappers
 * Functions for mapping database rows to domain models
 */

import type {
  PayrollEntry,
  SalarySlip,
  SalarySlipEarning,
  SalarySlipDeduction,
} from '@/lib/models/hr/payroll';
import type { SalaryStructureWithDetails, PayrollFrequency } from '@/lib/models/hr/salary';
import type { PayrollEntryRow, SalarySlipRow } from './types';

/**
 * Map database row to PayrollEntry domain model
 */
export function mapDbToPayrollEntry(row: PayrollEntryRow): PayrollEntry {
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
    exchangeRate: parseFloat(String(row.exchange_rate)) || 1,
    paymentAccountId: row.payment_account_id,
    costCenterId: row.cost_center_id,
    projectId: row.project_id,
    totalEmployees: row.total_employees || 0,
    totalGrossPay: parseFloat(String(row.total_gross_pay)) || 0,
    totalDeductions: parseFloat(String(row.total_deductions)) || 0,
    totalNetPay: parseFloat(String(row.total_net_pay)) || 0,
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

/**
 * Map database row to SalarySlip domain model
 */
export function mapDbToSalarySlip(row: SalarySlipRow): SalarySlip {
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
    totalWorkingDays: parseFloat(String(row.total_working_days)) || 0,
    paymentDays: parseFloat(String(row.payment_days)) || 0,
    leaveWithoutPay: parseFloat(String(row.leave_without_pay)) || 0,
    absentDays: parseFloat(String(row.absent_days)) || 0,
    totalWorkingHours: parseFloat(String(row.total_working_hours)) || 0,
    hourRate: parseFloat(String(row.hour_rate)) || 0,
    overtimeHours: parseFloat(String(row.overtime_hours)) || 0,
    overtimeAmount: parseFloat(String(row.overtime_amount)) || 0,
    nightDiffHours: parseFloat(String(row.night_diff_hours)) || 0,
    nightDiffAmount: parseFloat(String(row.night_diff_amount)) || 0,
    holidayHours: parseFloat(String(row.holiday_hours)) || 0,
    holidayPayAmount: parseFloat(String(row.holiday_pay_amount)) || 0,
    grossPay: parseFloat(String(row.gross_pay)) || 0,
    totalDeduction: parseFloat(String(row.total_deduction)) || 0,
    netPay: parseFloat(String(row.net_pay)) || 0,
    roundedTotal: parseFloat(String(row.rounded_total)) || 0,
    sssEmployee: parseFloat(String(row.sss_employee)) || 0,
    sssEmployer: parseFloat(String(row.sss_employer)) || 0,
    philhealthEmployee: parseFloat(String(row.philhealth_employee)) || 0,
    philhealthEmployer: parseFloat(String(row.philhealth_employer)) || 0,
    pagibigEmployee: parseFloat(String(row.pagibig_employee)) || 0,
    pagibigEmployer: parseFloat(String(row.pagibig_employer)) || 0,
    withholdingTax: parseFloat(String(row.withholding_tax)) || 0,
    ytdGrossPay: parseFloat(String(row.ytd_gross_pay)) || 0,
    ytdTaxableIncome: parseFloat(String(row.ytd_taxable_income)) || 0,
    ytdTaxWithheld: parseFloat(String(row.ytd_tax_withheld)) || 0,
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

/**
 * Map database row to SalarySlipEarning domain model
 */
export function mapDbToSalarySlipEarning(row: Record<string, unknown>): SalarySlipEarning {
  return {
    id: row.id as string,
    salarySlipId: row.salary_slip_id as string,
    salaryComponentId: row.salary_component_id as string,
    amount: parseFloat(String(row.amount)) || 0,
    yearToDate: parseFloat(String(row.year_to_date)) || 0,
    isTaxApplicable: (row.is_tax_applicable as boolean) ?? true,
    isSssApplicable: (row.is_sss_applicable as boolean) ?? true,
    isPhilhealthApplicable: (row.is_philhealth_applicable as boolean) ?? true,
    isPagibigApplicable: (row.is_pagibig_applicable as boolean) ?? true,
    abbr: row.abbr as string,
    sequence: (row.sequence as number) || 0,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Map database row to SalarySlipDeduction domain model
 */
export function mapDbToSalarySlipDeduction(row: Record<string, unknown>): SalarySlipDeduction {
  return {
    id: row.id as string,
    salarySlipId: row.salary_slip_id as string,
    salaryComponentId: row.salary_component_id as string,
    amount: parseFloat(String(row.amount)) || 0,
    yearToDate: parseFloat(String(row.year_to_date)) || 0,
    abbr: row.abbr as string,
    sequence: (row.sequence as number) || 0,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Map database rows to SalaryStructureWithDetails domain model
 */
export function mapDbToSalaryStructure(
  structure: Record<string, unknown>,
  earnings: Array<Record<string, unknown>>,
  deductions: Array<Record<string, unknown>>
): SalaryStructureWithDetails {
  return {
    id: structure.id as string,
    orgId: structure.org_id as string,
    structureName: structure.structure_name as string,
    description: structure.description as string,
    isActive: structure.is_active as boolean,
    isDefault: structure.is_default as boolean,
    payrollFrequency: structure.payroll_frequency as PayrollFrequency,
    paymentDaysPerMonth: (structure.payment_days_per_month as number) || 22,
    hourRateFormula: structure.hour_rate_formula as string,
    companyId: structure.company_id as string,
    currency: structure.currency as string,
    createdAt: new Date(structure.created_at as string),
    updatedAt: new Date(structure.updated_at as string),
    createdBy: structure.created_by as string,
    earnings: (earnings || []).map(e => ({
      id: e.id as string,
      salaryStructureId: e.salary_structure_id as string,
      salaryComponentId: e.salary_component_id as string,
      amount: parseFloat(String(e.amount)) || 0,
      amountBasedOnFormula: e.amount_based_on_formula as boolean,
      formula: e.formula as string,
      condition: e.condition as string,
      abbr: e.abbr as string,
      sequence: e.sequence as number,
      createdAt: new Date(e.created_at as string),
    })),
    deductions: (deductions || []).map(d => ({
      id: d.id as string,
      salaryStructureId: d.salary_structure_id as string,
      salaryComponentId: d.salary_component_id as string,
      amount: parseFloat(String(d.amount)) || 0,
      amountBasedOnFormula: d.amount_based_on_formula as boolean,
      formula: d.formula as string,
      condition: d.condition as string,
      abbr: d.abbr as string,
      sequence: d.sequence as number,
      createdAt: new Date(d.created_at as string),
    })),
  };
}
