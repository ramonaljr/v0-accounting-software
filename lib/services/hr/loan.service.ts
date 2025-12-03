/**
 * Loan Service
 * Manages employee loans and salary deductions
 * Supports SSS Loan, Pag-IBIG Loan, Company Loans, Cash Advances
 */

import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================

export type LoanType = 'SSS Loan' | 'Pag-IBIG Loan' | 'Company Loan' | 'Cash Advance' | 'Other';
export type LoanStatus = 'Draft' | 'Approved' | 'Disbursed' | 'Repaying' | 'Closed' | 'Cancelled';

export interface EmployeeLoan {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName?: string;
  employeeNo?: string;
  // Loan details
  loanType: LoanType;
  loanNo: string;
  description?: string;
  // Amounts
  loanAmount: number;
  interestRate: number;
  totalInterest: number;
  totalRepaymentAmount: number;
  // Repayment schedule
  repaymentStartDate: Date;
  repaymentPeriodMonths: number;
  monthlyDeduction: number;
  // Status tracking
  totalAmountPaid: number;
  balance: number;
  status: LoanStatus;
  // Dates
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  closedDate?: Date;
  // Metadata
  approvedBy?: string;
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  employeeId: string;
  // Payment details
  repaymentDate: Date;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  balanceAfter: number;
  // Reference
  salarySlipId?: string;
  payrollPeriod?: string;
  // Status
  status: 'Pending' | 'Paid' | 'Cancelled';
  // Metadata
  createdAt: Date;
}

export interface CreateLoan {
  orgId: string;
  employeeId: string;
  loanType: LoanType;
  description?: string;
  loanAmount: number;
  interestRate?: number;
  repaymentStartDate: Date;
  repaymentPeriodMonths: number;
  applicationDate?: Date;
}

export interface LoanDeductionSchedule {
  loanId: string;
  loanNo: string;
  loanType: LoanType;
  monthlyDeduction: number;
  balanceRemaining: number;
  nextDeductionDate: Date;
}

// =============================================
// SERVICE CLASS
// =============================================

export class LoanService {
  /**
   * Create a new loan
   */
  static async createLoan(data: CreateLoan): Promise<EmployeeLoan> {
    const supabase = await createClient();

    // Generate loan number
    const loanNo = await this.generateLoanNo(data.orgId, data.loanType);

    // Calculate interest and total repayment
    const interestRate = data.interestRate || 0;
    const totalInterest = (data.loanAmount * interestRate * data.repaymentPeriodMonths) / 1200;
    const totalRepaymentAmount = data.loanAmount + totalInterest;
    const monthlyDeduction = Math.round((totalRepaymentAmount / data.repaymentPeriodMonths) * 100) / 100;

    const { data: loan, error } = await supabase
      .from('employee_loans')
      .insert({
        org_id: data.orgId,
        employee_id: data.employeeId,
        loan_type: data.loanType,
        loan_no: loanNo,
        description: data.description,
        loan_amount: data.loanAmount,
        interest_rate: interestRate,
        total_interest: Math.round(totalInterest * 100) / 100,
        total_repayment_amount: Math.round(totalRepaymentAmount * 100) / 100,
        repayment_start_date: data.repaymentStartDate,
        repayment_period_months: data.repaymentPeriodMonths,
        monthly_deduction: monthlyDeduction,
        total_amount_paid: 0,
        balance: Math.round(totalRepaymentAmount * 100) / 100,
        status: 'Draft',
        application_date: data.applicationDate || new Date(),
        docstatus: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create loan: ${error.message}`);
    }

    return this.mapLoan(loan);
  }

  /**
   * Approve a loan
   */
  static async approveLoan(loanId: string, approvedBy: string): Promise<EmployeeLoan> {
    const supabase = await createClient();

    const { data: loan, error } = await supabase
      .from('employee_loans')
      .update({
        status: 'Approved',
        approval_date: new Date().toISOString(),
        approved_by: approvedBy,
        docstatus: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId)
      .eq('status', 'Draft')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve loan: ${error.message}`);
    }

    return this.mapLoan(loan);
  }

  /**
   * Mark loan as disbursed (money given to employee)
   */
  static async disburseLoan(loanId: string, disbursementDate?: Date): Promise<EmployeeLoan> {
    const supabase = await createClient();

    const { data: loan, error } = await supabase
      .from('employee_loans')
      .update({
        status: 'Disbursed',
        disbursement_date: (disbursementDate || new Date()).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId)
      .eq('status', 'Approved')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to disburse loan: ${error.message}`);
    }

    return this.mapLoan(loan);
  }

  /**
   * Start repayment (after first deduction)
   */
  static async startRepayment(loanId: string): Promise<EmployeeLoan> {
    const supabase = await createClient();

    const { data: loan, error } = await supabase
      .from('employee_loans')
      .update({
        status: 'Repaying',
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId)
      .eq('status', 'Disbursed')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start repayment: ${error.message}`);
    }

    return this.mapLoan(loan);
  }

  /**
   * Record a loan repayment
   */
  static async recordRepayment(
    loanId: string,
    repaymentDate: Date,
    amount: number,
    salarySlipId?: string,
    payrollPeriod?: string
  ): Promise<LoanRepayment> {
    const supabase = await createClient();

    // Get loan details
    const { data: loan, error: loanError } = await supabase
      .from('employee_loans')
      .select('*')
      .eq('id', loanId)
      .single();

    if (loanError || !loan) {
      throw new Error('Loan not found');
    }

    // Calculate principal and interest portions
    const totalRepayment = loan.total_repayment_amount;
    const principalRatio = loan.loan_amount / totalRepayment;
    const principalAmount = Math.round(amount * principalRatio * 100) / 100;
    const interestAmount = Math.round((amount - principalAmount) * 100) / 100;

    // Calculate new balance
    const newBalance = Math.max(0, Math.round((loan.balance - amount) * 100) / 100);
    const newTotalPaid = Math.round((loan.total_amount_paid + amount) * 100) / 100;

    // Determine new loan status
    let newStatus = loan.status;
    if (newBalance <= 0) {
      newStatus = 'Closed';
    } else if (loan.status === 'Disbursed') {
      newStatus = 'Repaying';
    }

    // Create repayment record
    const { data: repayment, error: repaymentError } = await supabase
      .from('loan_repayments')
      .insert({
        loan_id: loanId,
        employee_id: loan.employee_id,
        repayment_date: repaymentDate,
        amount,
        principal_amount: principalAmount,
        interest_amount: interestAmount,
        balance_after: newBalance,
        salary_slip_id: salarySlipId,
        payroll_period: payrollPeriod,
        status: 'Paid',
      })
      .select()
      .single();

    if (repaymentError) {
      throw new Error(`Failed to record repayment: ${repaymentError.message}`);
    }

    // Update loan balance
    const { error: updateError } = await supabase
      .from('employee_loans')
      .update({
        total_amount_paid: newTotalPaid,
        balance: newBalance,
        status: newStatus,
        closed_date: newStatus === 'Closed' ? repaymentDate.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId);

    if (updateError) {
      throw new Error(`Failed to update loan balance: ${updateError.message}`);
    }

    return {
      id: repayment.id,
      loanId: repayment.loan_id,
      employeeId: repayment.employee_id,
      repaymentDate: new Date(repayment.repayment_date),
      amount: repayment.amount,
      principalAmount: repayment.principal_amount,
      interestAmount: repayment.interest_amount,
      balanceAfter: repayment.balance_after,
      salarySlipId: repayment.salary_slip_id,
      payrollPeriod: repayment.payroll_period,
      status: repayment.status,
      createdAt: new Date(repayment.created_at),
    };
  }

  /**
   * Get loan by ID
   */
  static async getLoanById(id: string): Promise<EmployeeLoan | null> {
    const supabase = await createClient();

    const { data: loan, error } = await supabase
      .from('employee_loans')
      .select(`
        *,
        employee:employees (
          id,
          employee_no,
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !loan) {
      return null;
    }

    return {
      ...this.mapLoan(loan),
      employeeName: loan.employee
        ? `${loan.employee.first_name} ${loan.employee.last_name}`
        : undefined,
      employeeNo: loan.employee?.employee_no,
    };
  }

  /**
   * List loans for an employee
   */
  static async listEmployeeLoans(
    employeeId: string,
    options?: {
      status?: LoanStatus;
      loanType?: LoanType;
      includeClosedLoans?: boolean;
    }
  ): Promise<EmployeeLoan[]> {
    const supabase = await createClient();

    let query = supabase
      .from('employee_loans')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    } else if (!options?.includeClosedLoans) {
      query = query.not('status', 'in', '("Closed","Cancelled")');
    }

    if (options?.loanType) {
      query = query.eq('loan_type', options.loanType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list loans: ${error.message}`);
    }

    return (data || []).map(this.mapLoan);
  }

  /**
   * List all loans for an organization
   */
  static async listOrganizationLoans(
    orgId: string,
    options?: {
      status?: LoanStatus;
      loanType?: LoanType;
      employeeId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ loans: EmployeeLoan[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('employee_loans')
      .select(`
        *,
        employee:employees (
          id,
          employee_no,
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.loanType) {
      query = query.eq('loan_type', options.loanType);
    }

    if (options?.employeeId) {
      query = query.eq('employee_id', options.employeeId);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list loans: ${error.message}`);
    }

    const loans = (data || []).map((loan) => ({
      ...this.mapLoan(loan),
      employeeName: loan.employee
        ? `${loan.employee.first_name} ${loan.employee.last_name}`
        : undefined,
      employeeNo: loan.employee?.employee_no,
    }));

    return { loans, total: count || 0 };
  }

  /**
   * Get active loan deductions for an employee (for payroll processing)
   */
  static async getActiveDeductions(
    employeeId: string,
    payrollDate?: Date
  ): Promise<LoanDeductionSchedule[]> {
    const supabase = await createClient();
    const effectiveDate = payrollDate || new Date();

    const { data, error } = await supabase
      .from('employee_loans')
      .select('*')
      .eq('employee_id', employeeId)
      .in('status', ['Disbursed', 'Repaying'])
      .gt('balance', 0)
      .lte('repayment_start_date', effectiveDate.toISOString());

    if (error) {
      throw new Error(`Failed to get active deductions: ${error.message}`);
    }

    return (data || []).map((loan) => ({
      loanId: loan.id,
      loanNo: loan.loan_no,
      loanType: loan.loan_type,
      monthlyDeduction: Math.min(loan.monthly_deduction, loan.balance), // Don't deduct more than balance
      balanceRemaining: loan.balance,
      nextDeductionDate: new Date(loan.repayment_start_date),
    }));
  }

  /**
   * Get loan repayment history
   */
  static async getRepaymentHistory(loanId: string): Promise<LoanRepayment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('loan_repayments')
      .select('*')
      .eq('loan_id', loanId)
      .order('repayment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to get repayment history: ${error.message}`);
    }

    return (data || []).map((r) => ({
      id: r.id,
      loanId: r.loan_id,
      employeeId: r.employee_id,
      repaymentDate: new Date(r.repayment_date),
      amount: r.amount,
      principalAmount: r.principal_amount,
      interestAmount: r.interest_amount,
      balanceAfter: r.balance_after,
      salarySlipId: r.salary_slip_id,
      payrollPeriod: r.payroll_period,
      status: r.status,
      createdAt: new Date(r.created_at),
    }));
  }

  /**
   * Cancel a loan
   */
  static async cancelLoan(loanId: string, reason?: string): Promise<EmployeeLoan> {
    const supabase = await createClient();

    const { data: loan, error } = await supabase
      .from('employee_loans')
      .update({
        status: 'Cancelled',
        docstatus: 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId)
      .in('status', ['Draft', 'Approved'])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel loan: ${error.message}`);
    }

    return this.mapLoan(loan);
  }

  /**
   * Get loan summary for an organization
   */
  static async getLoanSummary(orgId: string): Promise<{
    totalActiveLoans: number;
    totalDisbursedAmount: number;
    totalOutstandingBalance: number;
    totalRepaid: number;
    byLoanType: Record<LoanType, {
      count: number;
      totalAmount: number;
      totalBalance: number;
    }>;
  }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_loans')
      .select('loan_type, loan_amount, balance, total_amount_paid, status')
      .eq('org_id', orgId)
      .not('status', 'in', '("Cancelled")');

    if (error) {
      throw new Error(`Failed to get loan summary: ${error.message}`);
    }

    const summary = {
      totalActiveLoans: 0,
      totalDisbursedAmount: 0,
      totalOutstandingBalance: 0,
      totalRepaid: 0,
      byLoanType: {} as Record<LoanType, { count: number; totalAmount: number; totalBalance: number }>,
    };

    for (const loan of data || []) {
      const loanType = loan.loan_type as LoanType;

      if (!summary.byLoanType[loanType]) {
        summary.byLoanType[loanType] = { count: 0, totalAmount: 0, totalBalance: 0 };
      }

      summary.byLoanType[loanType].count++;
      summary.byLoanType[loanType].totalAmount += loan.loan_amount;
      summary.byLoanType[loanType].totalBalance += loan.balance;

      if (['Disbursed', 'Repaying'].includes(loan.status)) {
        summary.totalActiveLoans++;
      }

      summary.totalDisbursedAmount += loan.loan_amount;
      summary.totalOutstandingBalance += loan.balance;
      summary.totalRepaid += loan.total_amount_paid;
    }

    return {
      ...summary,
      totalDisbursedAmount: Math.round(summary.totalDisbursedAmount * 100) / 100,
      totalOutstandingBalance: Math.round(summary.totalOutstandingBalance * 100) / 100,
      totalRepaid: Math.round(summary.totalRepaid * 100) / 100,
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generate loan number
   */
  private static async generateLoanNo(orgId: string, loanType: LoanType): Promise<string> {
    const supabase = await createClient();
    const prefix = this.getLoanPrefix(loanType);

    const { count } = await supabase
      .from('employee_loans')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('loan_type', loanType);

    const nextNo = (count || 0) + 1;
    return `${prefix}-${String(nextNo).padStart(5, '0')}`;
  }

  /**
   * Get loan number prefix based on type
   */
  private static getLoanPrefix(loanType: LoanType): string {
    const prefixes: Record<LoanType, string> = {
      'SSS Loan': 'SSS',
      'Pag-IBIG Loan': 'HDMF',
      'Company Loan': 'CL',
      'Cash Advance': 'CA',
      'Other': 'OTH',
    };
    return prefixes[loanType] || 'LN';
  }

  /**
   * Map database record to EmployeeLoan interface
   */
  private static mapLoan(data: Record<string, unknown>): EmployeeLoan {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      employeeId: data.employee_id as string,
      loanType: data.loan_type as LoanType,
      loanNo: data.loan_no as string,
      description: data.description as string | undefined,
      loanAmount: data.loan_amount as number,
      interestRate: data.interest_rate as number,
      totalInterest: data.total_interest as number,
      totalRepaymentAmount: data.total_repayment_amount as number,
      repaymentStartDate: new Date(data.repayment_start_date as string),
      repaymentPeriodMonths: data.repayment_period_months as number,
      monthlyDeduction: data.monthly_deduction as number,
      totalAmountPaid: data.total_amount_paid as number,
      balance: data.balance as number,
      status: data.status as LoanStatus,
      applicationDate: new Date(data.application_date as string),
      approvalDate: data.approval_date ? new Date(data.approval_date as string) : undefined,
      disbursementDate: data.disbursement_date ? new Date(data.disbursement_date as string) : undefined,
      closedDate: data.closed_date ? new Date(data.closed_date as string) : undefined,
      approvedBy: data.approved_by as string | undefined,
      docstatus: data.docstatus as number,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}
