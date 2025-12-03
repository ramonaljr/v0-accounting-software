/**
 * Philippines Statutory Models
 * SSS, PhilHealth, Pag-IBIG, and BIR tax tables
 */

import { z } from 'zod';

// SSS Contribution Table Entry
export interface SssContributionEntry {
  id: string;
  orgId: string;
  effectiveDate: Date;
  endDate?: Date;
  // Compensation range
  compensationRangeFrom: number;
  compensationRangeTo: number;
  monthlySalaryCredit: number;
  // Contributions
  employerContributionSs: number;
  employerContributionEc: number;
  employeeContribution: number;
  // WISP (for salary credit > 20k)
  employerContributionWisp: number;
  employeeContributionWisp: number;
  totalContribution: number;
  createdAt: Date;
}

// PhilHealth Contribution Table Entry
export interface PhilhealthContributionEntry {
  id: string;
  orgId: string;
  effectiveDate: Date;
  endDate?: Date;
  // Rate-based
  premiumRate: number; // e.g., 0.05 for 5%
  incomeFloor: number;
  incomeCeiling: number;
  // Limits
  minContribution?: number;
  maxContribution?: number;
  // Split
  employeeShareRate: number;
  employerShareRate: number;
  createdAt: Date;
}

// Pag-IBIG Contribution Table Entry
export interface PagibigContributionEntry {
  id: string;
  orgId: string;
  effectiveDate: Date;
  endDate?: Date;
  // Compensation range
  compensationRangeFrom: number;
  compensationRangeTo?: number;
  // Rates
  employeeRate: number;
  employerRate: number;
  // Cap
  maxCompensationForComputation: number;
  allowAdditionalContribution: boolean;
  createdAt: Date;
}

// BIR Withholding Tax Table Entry
export interface BirWithholdingTaxEntry {
  id: string;
  orgId: string;
  effectiveDate: Date;
  endDate?: Date;
  payrollFrequency: 'Annual' | 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Daily';
  // Tax bracket
  compensationRangeFrom: number;
  compensationRangeTo?: number;
  // Tax computation
  fixedTax: number;
  taxRate: number;
  excessOver: number;
  createdAt: Date;
}

// 13th Month Settings
export interface ThirteenthMonthSettings {
  id: string;
  orgId: string;
  fiscalYearId?: string;
  // Computation
  computationMethod: 'Basic Salary' | 'Gross Pay';
  includeAllowances: boolean;
  prorateForResigned: boolean;
  // Payment schedule
  firstHalfPercentage: number;
  firstHalfDate?: Date;
  secondHalfDate?: Date;
  // Tax exempt threshold
  taxExemptThreshold: number;
  createdAt: Date;
}

// Computed contribution results
export interface SssContributionResult {
  employeeContribution: number;
  employerContribution: number;
  employerEc: number;
  employeeWisp: number;
  employerWisp: number;
  totalContribution: number;
  monthlySalaryCredit: number;
}

export interface PhilhealthContributionResult {
  employeeShare: number;
  employerShare: number;
  totalContribution: number;
}

export interface PagibigContributionResult {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
}

// Zod Schemas
export const createSssContributionSchema = z.object({
  orgId: z.string().uuid(),
  effectiveDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  compensationRangeFrom: z.number().nonnegative(),
  compensationRangeTo: z.number().nonnegative(),
  monthlySalaryCredit: z.number().nonnegative(),
  employerContributionSs: z.number().nonnegative(),
  employerContributionEc: z.number().nonnegative(),
  employeeContribution: z.number().nonnegative(),
  employerContributionWisp: z.number().nonnegative().default(0),
  employeeContributionWisp: z.number().nonnegative().default(0),
  totalContribution: z.number().nonnegative(),
});

export const createPhilhealthContributionSchema = z.object({
  orgId: z.string().uuid(),
  effectiveDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  premiumRate: z.number().positive().max(1),
  incomeFloor: z.number().nonnegative(),
  incomeCeiling: z.number().nonnegative(),
  minContribution: z.number().nonnegative().optional(),
  maxContribution: z.number().nonnegative().optional(),
  employeeShareRate: z.number().positive().max(1).default(0.5),
  employerShareRate: z.number().positive().max(1).default(0.5),
});

export const createPagibigContributionSchema = z.object({
  orgId: z.string().uuid(),
  effectiveDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  compensationRangeFrom: z.number().nonnegative(),
  compensationRangeTo: z.number().nonnegative().optional(),
  employeeRate: z.number().positive().max(1),
  employerRate: z.number().positive().max(1),
  maxCompensationForComputation: z.number().nonnegative().default(5000),
  allowAdditionalContribution: z.boolean().default(true),
});

export const createBirWithholdingTaxSchema = z.object({
  orgId: z.string().uuid(),
  effectiveDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  payrollFrequency: z.enum(['Annual', 'Monthly', 'Semi-Monthly', 'Weekly', 'Daily']),
  compensationRangeFrom: z.number().nonnegative(),
  compensationRangeTo: z.number().nonnegative().optional(),
  fixedTax: z.number().nonnegative(),
  taxRate: z.number().nonnegative().max(1),
  excessOver: z.number().nonnegative(),
});

export type CreateSssContribution = z.infer<typeof createSssContributionSchema>;
export type CreatePhilhealthContribution = z.infer<typeof createPhilhealthContributionSchema>;
export type CreatePagibigContribution = z.infer<typeof createPagibigContributionSchema>;
export type CreateBirWithholdingTax = z.infer<typeof createBirWithholdingTaxSchema>;

// 2024 Philippines Statutory Rates (for reference)
export const PH_STATUTORY_RATES_2024 = {
  // PhilHealth 2024: 5% premium rate, split 50-50
  philhealth: {
    premiumRate: 0.05,
    incomeFloor: 10000,
    incomeCeiling: 100000,
    employeeShareRate: 0.5,
    employerShareRate: 0.5,
  },
  // Pag-IBIG: 1% for ≤1500, 2% for >1500, max base 5000
  pagibig: {
    lowIncomeRate: 0.01,
    highIncomeRate: 0.02,
    threshold: 1500,
    maxBase: 5000,
    employerRate: 0.02,
  },
  // BIR TRAIN Law brackets (Monthly)
  birMonthly: [
    { from: 0, to: 20833, fixed: 0, rate: 0, excess: 0 },
    { from: 20833, to: 33332, fixed: 0, rate: 0.15, excess: 20833 },
    { from: 33333, to: 66666, fixed: 1875, rate: 0.20, excess: 33333 },
    { from: 66667, to: 166666, fixed: 8541.80, rate: 0.25, excess: 66667 },
    { from: 166667, to: 666666, fixed: 33541.80, rate: 0.30, excess: 166667 },
    { from: 666667, to: null, fixed: 183541.80, rate: 0.35, excess: 666667 },
  ],
  // 13th Month tax exempt threshold
  thirteenthMonthExempt: 90000,
  // De minimis benefits limit
  deMinimisBenefitsLimit: 90000,
  // Minimum wage NCR (for reference)
  minimumWageNCR: 610, // Daily
};
