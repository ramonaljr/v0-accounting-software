/**
 * Salary Structure Models
 * Salary components, structures, and assignments
 * Based on ERPNext's Salary Component/Structure DocTypes
 */

import { z } from 'zod';

export type ComponentType = 'Earning' | 'Deduction';
export type PayrollFrequency = 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Daily';

// Salary Component (Earnings & Deductions)
export interface SalaryComponent {
  id: string;
  orgId: string;
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  description?: string;
  // Calculation
  type: 'Amount' | 'Percentage';
  amount: number;
  formula?: string;
  amountBasedOnFormula: boolean;
  formulaDescription?: string;
  // Accounting
  accountId?: string;
  accountName?: string;
  // Tax settings
  isTaxApplicable: boolean;
  isFlexibleBenefit: boolean;
  // PH Statutory
  isSssApplicable: boolean;
  isPhilhealthApplicable: boolean;
  isPagibigApplicable: boolean;
  // Payslip
  doNotIncludeInTotal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Salary Structure
export interface SalaryStructure {
  id: string;
  orgId: string;
  structureName: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  // Payroll settings
  payrollFrequency: PayrollFrequency;
  paymentDaysPerMonth: number;
  // Time settings
  hourRateFormula?: string;
  // Company
  companyId?: string;
  currency: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Salary Structure Earning
export interface SalaryStructureEarning {
  id: string;
  salaryStructureId: string;
  salaryComponentId: string;
  salaryComponentName?: string;
  // Amount/Formula
  amount: number;
  amountBasedOnFormula: boolean;
  formula?: string;
  // Conditions
  condition?: string;
  // Display
  abbr?: string;
  sequence: number;
  createdAt: Date;
}

// Salary Structure Deduction
export interface SalaryStructureDeduction {
  id: string;
  salaryStructureId: string;
  salaryComponentId: string;
  salaryComponentName?: string;
  // Amount/Formula
  amount: number;
  amountBasedOnFormula: boolean;
  formula?: string;
  // Conditions
  condition?: string;
  // Display
  abbr?: string;
  sequence: number;
  createdAt: Date;
}

// Salary Structure with details
export interface SalaryStructureWithDetails extends SalaryStructure {
  earnings: SalaryStructureEarning[];
  deductions: SalaryStructureDeduction[];
}

// Salary Structure Assignment
export interface SalaryStructureAssignment {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName?: string;
  salaryStructureId: string;
  salaryStructureName?: string;
  fromDate: Date;
  toDate?: Date;
  // Base pay
  basePay: number;
  // Variable
  variable: number;
  // Tax settings
  incomeTaxSlabId?: string;
  // Status
  isActive: boolean;
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Zod Schemas
export const createSalaryComponentSchema = z.object({
  orgId: z.string().uuid(),
  componentCode: z.string().min(1).max(50),
  componentName: z.string().min(1).max(200),
  componentType: z.enum(['Earning', 'Deduction']),
  description: z.string().optional(),
  type: z.enum(['Amount', 'Percentage']).default('Amount'),
  amount: z.number().nonnegative().default(0),
  formula: z.string().optional(),
  amountBasedOnFormula: z.boolean().default(false),
  formulaDescription: z.string().optional(),
  accountId: z.string().uuid().optional(),
  isTaxApplicable: z.boolean().default(true),
  isFlexibleBenefit: z.boolean().default(false),
  isSssApplicable: z.boolean().default(true),
  isPhilhealthApplicable: z.boolean().default(true),
  isPagibigApplicable: z.boolean().default(true),
  doNotIncludeInTotal: z.boolean().default(false),
});

export const createSalaryStructureEarningSchema = z.object({
  salaryComponentId: z.string().uuid(),
  amount: z.number().nonnegative().default(0),
  amountBasedOnFormula: z.boolean().default(false),
  formula: z.string().optional(),
  condition: z.string().optional(),
  abbr: z.string().max(50).optional(),
  sequence: z.number().int().nonnegative().default(0),
});

export const createSalaryStructureDeductionSchema = z.object({
  salaryComponentId: z.string().uuid(),
  amount: z.number().nonnegative().default(0),
  amountBasedOnFormula: z.boolean().default(false),
  formula: z.string().optional(),
  condition: z.string().optional(),
  abbr: z.string().max(50).optional(),
  sequence: z.number().int().nonnegative().default(0),
});

export const createSalaryStructureSchema = z.object({
  orgId: z.string().uuid(),
  structureName: z.string().min(1).max(200),
  description: z.string().optional(),
  payrollFrequency: z.enum(['Monthly', 'Semi-Monthly', 'Weekly', 'Daily']).default('Monthly'),
  paymentDaysPerMonth: z.number().int().positive().default(22),
  hourRateFormula: z.string().optional(),
  companyId: z.string().uuid().optional(),
  currency: z.string().length(3).default('PHP'),
  earnings: z.array(createSalaryStructureEarningSchema).min(1),
  deductions: z.array(createSalaryStructureDeductionSchema).optional().default([]),
});

export const createSalaryStructureAssignmentSchema = z.object({
  orgId: z.string().uuid(),
  employeeId: z.string().uuid(),
  salaryStructureId: z.string().uuid(),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date().optional(),
  basePay: z.number().positive(),
  variable: z.number().nonnegative().default(0),
  incomeTaxSlabId: z.string().uuid().optional(),
});

export type CreateSalaryComponent = z.infer<typeof createSalaryComponentSchema>;
export type CreateSalaryStructure = z.infer<typeof createSalaryStructureSchema>;
export type CreateSalaryStructureAssignment = z.infer<typeof createSalaryStructureAssignmentSchema>;

export interface UpdateSalaryComponent extends Partial<CreateSalaryComponent> {
  id: string;
  isActive?: boolean;
}

export interface UpdateSalaryStructure extends Partial<Omit<CreateSalaryStructure, 'orgId'>> {
  id: string;
  isActive?: boolean;
}
