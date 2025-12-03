/**
 * Loan Models
 * Employee loans and advances
 * Based on ERPNext's Loan module
 */

import { z } from 'zod';

export type LoanStatus = 'Draft' | 'Sanctioned' | 'Disbursed' | 'Partially Paid' | 'Repaid' | 'Closed';
export type RepaymentMethod = 'Equal Monthly Installments' | 'Reducing Balance';

// Loan Type
export interface LoanType {
  id: string;
  orgId: string;
  loanTypeName: string;
  description?: string;
  // Limits
  maximumLoanAmount?: number;
  rateOfInterest: number;
  // Repayment
  repaymentMethod: RepaymentMethod;
  // Deduction component
  salaryComponentId?: string;
  salaryComponentName?: string;
  // Accounts
  disbursementAccountId?: string;
  paymentAccountId?: string;
  // Flags
  isTermLoan: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Loan
export interface Loan {
  id: string;
  orgId: string;
  loanNo: string;
  employeeId: string;
  employeeName?: string;
  loanTypeId: string;
  loanTypeName?: string;
  // Loan details
  loanAmount: number;
  rateOfInterest: number;
  // Disbursement
  disbursementDate?: Date;
  disbursedAmount: number;
  // Repayment
  repaymentStartDate?: Date;
  repaymentPeriods: number;
  monthlyRepaymentAmount: number;
  // Status
  totalAmountPaid: number;
  totalInterestPayable: number;
  outstandingAmount?: number; // Computed
  status: LoanStatus;
  docstatus: number;
  // Journal entries
  disbursementJournalEntryId?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Loan Repayment Schedule
export interface LoanRepaymentSchedule {
  id: string;
  loanId: string;
  // Schedule
  paymentDate: Date;
  paymentNo: number;
  // Amounts
  principalAmount: number;
  interestAmount: number;
  totalPayment: number;
  balanceLoanAmount: number;
  // Status
  isPaid: boolean;
  paidDate?: Date;
  salarySlipId?: string;
  createdAt: Date;
}

// Loan with schedule
export interface LoanWithSchedule extends Loan {
  schedule: LoanRepaymentSchedule[];
}

// Zod Schemas
export const createLoanTypeSchema = z.object({
  orgId: z.string().uuid(),
  loanTypeName: z.string().min(1).max(200),
  description: z.string().optional(),
  maximumLoanAmount: z.number().positive().optional(),
  rateOfInterest: z.number().nonnegative().default(0),
  repaymentMethod: z.enum(['Equal Monthly Installments', 'Reducing Balance']).default('Equal Monthly Installments'),
  salaryComponentId: z.string().uuid().optional(),
  disbursementAccountId: z.string().uuid().optional(),
  paymentAccountId: z.string().uuid().optional(),
  isTermLoan: z.boolean().default(true),
});

export const createLoanSchema = z.object({
  orgId: z.string().uuid(),
  employeeId: z.string().uuid(),
  loanTypeId: z.string().uuid(),
  loanAmount: z.number().positive(),
  rateOfInterest: z.number().nonnegative().optional(),
  disbursementDate: z.coerce.date().optional(),
  repaymentStartDate: z.coerce.date().optional(),
  repaymentPeriods: z.number().int().positive(),
});

export type CreateLoanType = z.infer<typeof createLoanTypeSchema>;
export type CreateLoan = z.infer<typeof createLoanSchema>;

// Loan calculation helpers
export function calculateEmi(
  principal: number,
  annualRate: number,
  periods: number
): number {
  if (annualRate === 0) {
    return principal / periods;
  }

  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) /
    (Math.pow(1 + monthlyRate, periods) - 1);

  return Math.round(emi * 100) / 100;
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  periods: number,
  startDate: Date
): Array<{
  paymentNo: number;
  paymentDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalPayment: number;
  balanceLoanAmount: number;
}> {
  const schedule: Array<{
    paymentNo: number;
    paymentDate: Date;
    principalAmount: number;
    interestAmount: number;
    totalPayment: number;
    balanceLoanAmount: number;
  }> = [];

  const emi = calculateEmi(principal, annualRate, periods);
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;

  for (let i = 1; i <= periods; i++) {
    const interestAmount = monthlyRate > 0 ? balance * monthlyRate : 0;
    const principalAmount = emi - interestAmount;
    balance -= principalAmount;

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i - 1);

    schedule.push({
      paymentNo: i,
      paymentDate,
      principalAmount: Math.round(principalAmount * 100) / 100,
      interestAmount: Math.round(interestAmount * 100) / 100,
      totalPayment: Math.round(emi * 100) / 100,
      balanceLoanAmount: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return schedule;
}
