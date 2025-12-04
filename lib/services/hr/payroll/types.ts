/**
 * Payroll Service Types
 * Shared types used across payroll sub-services
 */

import type {
  PayrollEntry,
  PayrollStatus,
  SalarySlip,
  SalarySlipStatus,
  SalarySlipEarning,
  SalarySlipDeduction,
} from '@/lib/models/hr/payroll';
import type { SalaryStructureWithDetails } from '@/lib/models/hr/salary';

/**
 * Attendance summary for payroll calculation
 */
export interface AttendanceSummary {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveWithoutPay: number;
  overtimeHours: number;
  nightDiffHours: number;
  holidayHours: number;
}

/**
 * Employee data for payroll
 */
export interface PayrollEmployee {
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  departmentName?: string;
  designationName?: string;
  salaryStructureAssignmentId: string;
  basePay: number;
}

/**
 * Holiday pay calculation result
 */
export interface HolidayPayResult {
  holidayType: string | null;
  basePay: number;
  holidayPremium: number;
  totalPay: number;
}

/**
 * Holiday data
 */
export interface HolidayData {
  date: Date;
  name: string;
  holidayType: string;
  payRate: number;
}

/**
 * Period holiday pay calculation result
 */
export interface PeriodHolidayPayResult {
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
}

/**
 * YTD earnings result
 */
export interface YtdEarningsResult {
  ytdGrossPay: number;
  ytdTaxableIncome: number;
  ytdTaxWithheld: number;
  ytdSss: number;
  ytdPhilhealth: number;
  ytdPagibig: number;
}

/**
 * Database row type for payroll entry
 */
export interface PayrollEntryRow {
  id: string;
  org_id: string;
  payroll_entry_no: string;
  payroll_period_id?: string;
  posting_date: string;
  start_date: string;
  end_date: string;
  payroll_frequency: string;
  department_id?: string;
  branch_id?: string;
  designation_id?: string;
  company_id?: string;
  currency: string;
  exchange_rate: string | number;
  payment_account_id?: string;
  cost_center_id?: string;
  project_id?: string;
  total_employees: number;
  total_gross_pay: string | number;
  total_deductions: string | number;
  total_net_pay: string | number;
  status: PayrollStatus;
  docstatus: number;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  submitted_at?: string;
  submitted_by?: string;
  departments?: { department_name: string };
  branches?: { branch_name: string };
}

/**
 * Database row type for salary slip
 */
export interface SalarySlipRow {
  id: string;
  org_id: string;
  salary_slip_no: string;
  employee_id: string;
  payroll_entry_id?: string;
  posting_date: string;
  start_date: string;
  end_date: string;
  employee_name: string;
  department?: string;
  designation?: string;
  branch?: string;
  salary_structure_id?: string;
  total_working_days: string | number;
  payment_days: string | number;
  leave_without_pay: string | number;
  absent_days: string | number;
  total_working_hours: string | number;
  hour_rate: string | number;
  overtime_hours: string | number;
  overtime_amount: string | number;
  night_diff_hours: string | number;
  night_diff_amount: string | number;
  holiday_hours: string | number;
  holiday_pay_amount: string | number;
  gross_pay: string | number;
  total_deduction: string | number;
  net_pay: string | number;
  rounded_total: string | number;
  sss_employee: string | number;
  sss_employer: string | number;
  philhealth_employee: string | number;
  philhealth_employer: string | number;
  pagibig_employee: string | number;
  pagibig_employer: string | number;
  withholding_tax: string | number;
  ytd_gross_pay: string | number;
  ytd_taxable_income: string | number;
  ytd_tax_withheld: string | number;
  bank_name?: string;
  bank_account_no?: string;
  status: SalarySlipStatus;
  docstatus: number;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Re-export model types for convenience
 */
export type {
  PayrollEntry,
  SalarySlip,
  SalarySlipEarning,
  SalarySlipDeduction,
  SalaryStructureWithDetails,
};
