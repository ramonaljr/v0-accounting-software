/**
 * Payroll Component Types
 */

export interface SalarySlip {
  id: string;
  employee_id: string;
  employee_no?: string;
  employee_name?: string;
  start_date: string;
  end_date: string;
  posting_date: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Cancelled';
  created_at: string;
}

export interface PayrollPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  payroll_frequency: string;
  status: string;
}

export type PayrollFrequency = 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Bi-Weekly';
