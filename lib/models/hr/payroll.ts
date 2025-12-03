/**
 * Payroll Models
 * Payroll processing, salary slips, and related entities
 * Based on ERPNext's Payroll module
 */

import { z } from 'zod';

export type PayrollStatus = 'Draft' | 'Submitted' | 'Cancelled';
export type SalarySlipStatus = 'Draft' | 'Submitted' | 'Paid' | 'Cancelled';

// Payroll Period
export interface PayrollPeriod {
  id: string;
  orgId: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  payrollFrequency: string;
  isClosed: boolean;
  createdAt: Date;
}

// Payroll Entry (batch processing)
export interface PayrollEntry {
  id: string;
  orgId: string;
  payrollEntryNo: string;
  // Period
  payrollPeriodId?: string;
  postingDate: Date;
  startDate: Date;
  endDate: Date;
  payrollFrequency: string;
  // Filters
  departmentId?: string;
  departmentName?: string;
  branchId?: string;
  branchName?: string;
  designationId?: string;
  // Company
  companyId?: string;
  currency: string;
  exchangeRate: number;
  // Bank
  paymentAccountId?: string;
  // Cost center
  costCenterId?: string;
  projectId?: string;
  // Totals
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  // Status
  status: PayrollStatus;
  docstatus: number;
  // GL Entry
  journalEntryId?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  submittedAt?: Date;
  submittedBy?: string;
}

// Salary Slip
export interface SalarySlip {
  id: string;
  orgId: string;
  salarySlipNo: string;
  employeeId: string;
  // Period
  payrollEntryId?: string;
  postingDate: Date;
  startDate: Date;
  endDate: Date;
  // Employee details (snapshot)
  employeeName: string;
  department?: string;
  designation?: string;
  branch?: string;
  // Salary structure
  salaryStructureId?: string;
  // Working days
  totalWorkingDays: number;
  paymentDays: number;
  leaveWithoutPay: number;
  absentDays: number;
  // Hours
  totalWorkingHours: number;
  hourRate: number;
  // Overtime
  overtimeHours: number;
  overtimeAmount: number;
  // Night differential
  nightDiffHours: number;
  nightDiffAmount: number;
  // Holiday pay
  holidayHours: number;
  holidayPayAmount: number;
  // Totals
  grossPay: number;
  totalDeduction: number;
  netPay: number;
  roundedTotal: number;
  // PH Statutory
  sssEmployee: number;
  sssEmployer: number;
  philhealthEmployee: number;
  philhealthEmployer: number;
  pagibigEmployee: number;
  pagibigEmployer: number;
  withholdingTax: number;
  // YTD
  ytdGrossPay: number;
  ytdTaxableIncome: number;
  ytdTaxWithheld: number;
  // Bank
  bankName?: string;
  bankAccountNo?: string;
  // Status
  status: SalarySlipStatus;
  docstatus: number;
  journalEntryId?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Salary Slip Earning
export interface SalarySlipEarning {
  id: string;
  salarySlipId: string;
  salaryComponentId: string;
  salaryComponentName?: string;
  // Amount
  amount: number;
  // YTD
  yearToDate: number;
  // Flags
  isTaxApplicable: boolean;
  isSssApplicable: boolean;
  isPhilhealthApplicable: boolean;
  isPagibigApplicable: boolean;
  // Display
  abbr?: string;
  sequence: number;
  createdAt: Date;
}

// Salary Slip Deduction
export interface SalarySlipDeduction {
  id: string;
  salarySlipId: string;
  salaryComponentId: string;
  salaryComponentName?: string;
  // Amount
  amount: number;
  // YTD
  yearToDate: number;
  // Display
  abbr?: string;
  sequence: number;
  createdAt: Date;
}

// Salary Slip with details
export interface SalarySlipWithDetails extends SalarySlip {
  earnings: SalarySlipEarning[];
  deductions: SalarySlipDeduction[];
}

// Additional Salary (one-time)
export interface AdditionalSalary {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName?: string;
  salaryComponentId: string;
  salaryComponentName?: string;
  // Amount
  amount: number;
  isRecurring: boolean;
  // Period
  fromDate?: Date;
  toDate?: Date;
  payrollDate?: Date;
  // Type
  type: 'Earning' | 'Deduction';
  // Reason
  reason?: string;
  // Link
  salarySlipId?: string;
  // Status
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payroll Entry with salary slips
export interface PayrollEntryWithDetails extends PayrollEntry {
  salarySlips: SalarySlip[];
}

// Zod Schemas
export const createPayrollPeriodSchema = z.object({
  orgId: z.string().uuid(),
  periodName: z.string().min(1).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  payrollFrequency: z.string().default('Monthly'),
});

export const createPayrollEntrySchema = z.object({
  orgId: z.string().uuid(),
  payrollPeriodId: z.string().uuid().optional(),
  postingDate: z.coerce.date(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  payrollFrequency: z.string().default('Monthly'),
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  currency: z.string().length(3).default('PHP'),
  exchangeRate: z.number().positive().default(1),
  paymentAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export const createAdditionalSalarySchema = z.object({
  orgId: z.string().uuid(),
  employeeId: z.string().uuid(),
  salaryComponentId: z.string().uuid(),
  amount: z.number(),
  isRecurring: z.boolean().default(false),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  payrollDate: z.coerce.date().optional(),
  type: z.enum(['Earning', 'Deduction']),
  reason: z.string().optional(),
});

export type CreatePayrollPeriod = z.infer<typeof createPayrollPeriodSchema>;
export type CreatePayrollEntry = z.infer<typeof createPayrollEntrySchema>;
export type CreateAdditionalSalary = z.infer<typeof createAdditionalSalarySchema>;

// Payroll calculation inputs
export interface PayrollCalculationInput {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  salaryStructureAssignmentId: string;
  // Attendance summary
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveWithoutPay: number;
  // Hours
  overtimeHours: number;
  nightDiffHours: number;
  holidayHours: number;
  // Additional earnings/deductions
  additionalEarnings: Array<{
    componentId: string;
    amount: number;
  }>;
  additionalDeductions: Array<{
    componentId: string;
    amount: number;
  }>;
}

// Payroll calculation result
export interface PayrollCalculationResult {
  employeeId: string;
  earnings: Array<{
    componentId: string;
    componentName: string;
    amount: number;
    isTaxable: boolean;
  }>;
  deductions: Array<{
    componentId: string;
    componentName: string;
    amount: number;
  }>;
  grossPay: number;
  // Statutory
  sssEmployee: number;
  sssEmployer: number;
  philhealthEmployee: number;
  philhealthEmployer: number;
  pagibigEmployee: number;
  pagibigEmployer: number;
  // Tax
  taxableIncome: number;
  withholdingTax: number;
  // Net
  totalDeductions: number;
  netPay: number;
}

// Payslip view model
export interface PayslipViewModel {
  // Header
  companyName: string;
  companyAddress: string;
  payPeriod: string;
  payDate: Date;
  // Employee
  employeeNo: string;
  employeeName: string;
  department: string;
  designation: string;
  tinNo?: string;
  sssNo?: string;
  philhealthNo?: string;
  pagibigNo?: string;
  // Days
  totalDays: number;
  daysWorked: number;
  absentDays: number;
  // Earnings
  earnings: Array<{
    description: string;
    amount: number;
  }>;
  totalEarnings: number;
  // Deductions
  deductions: Array<{
    description: string;
    amount: number;
  }>;
  totalDeductions: number;
  // Net
  netPay: number;
  netPayInWords: string;
  // YTD
  ytdGross: number;
  ytdTax: number;
  // Bank
  bankName?: string;
  bankAccountNo?: string;
}
