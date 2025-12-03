/**
 * Employee Model
 * Employee master data and related entities
 * Based on ERPNext's Employee DocType
 */

import { z } from 'zod';

export type EmployeeStatus = 'Active' | 'Left' | 'Suspended';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Separated';

// Department
export interface Department {
  id: string;
  orgId: string;
  departmentCode?: string;
  departmentName: string;
  parentId?: string;
  companyId?: string;
  isGroup: boolean;
  lft: number;
  rgt: number;
  costCenterId?: string;
  payrollCostCenterId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Designation/Job Title
export interface Designation {
  id: string;
  orgId: string;
  designationCode?: string;
  designationName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Employment Type
export interface EmploymentType {
  id: string;
  orgId: string;
  typeName: string;
  description?: string;
  defaultLeavePolicyId?: string;
  isRegular: boolean; // Regular vs Contractual
  isSubjectToStatutory: boolean; // SSS, PhilHealth, Pag-IBIG
  createdAt: Date;
}

// Branch/Work Location
export interface Branch {
  id: string;
  orgId: string;
  branchCode?: string;
  branchName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Employee Grade/Level
export interface EmployeeGrade {
  id: string;
  orgId: string;
  gradeName: string;
  description?: string;
  defaultBasePay: number;
  minBasePay?: number;
  maxBasePay?: number;
  createdAt: Date;
}

// Employee Master
export interface Employee {
  id: string;
  orgId: string;
  employeeNo: string;
  // Personal
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  fullName?: string; // Computed
  gender?: Gender;
  dateOfBirth?: Date;
  maritalStatus?: MaritalStatus;
  bloodGroup?: string;
  // Contact
  personalEmail?: string;
  companyEmail?: string;
  mobilePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  // Address
  currentAddress?: string;
  permanentAddress?: string;
  // Employment
  status: EmployeeStatus;
  employmentTypeId?: string;
  employmentTypeName?: string;
  departmentId?: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  branchId?: string;
  branchName?: string;
  gradeId?: string;
  gradeName?: string;
  reportsTo?: string;
  reportsToName?: string;
  dateOfJoining?: Date;
  dateOfConfirmation?: Date;
  contractEndDate?: Date;
  relievingDate?: Date;
  reasonForLeaving?: string;
  // User link
  userId?: string;
  // PH Government IDs
  tinNo?: string;
  sssNo?: string;
  philhealthNo?: string;
  pagibigNo?: string;
  // Bank
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  // Payroll
  salaryMode: 'Bank' | 'Cash' | 'Cheque';
  paymentDaysBasis: 'Calendar Days' | 'Working Days';
  // Photo
  imageUrl?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Employee Education
export interface EmployeeEducation {
  id: string;
  employeeId: string;
  schoolUniversity?: string;
  qualification?: string;
  level?: string;
  fieldOfStudy?: string;
  yearOfGraduation?: number;
  classGrade?: string;
  createdAt: Date;
}

// Employee Work Experience
export interface EmployeeWorkExperience {
  id: string;
  employeeId: string;
  companyName?: string;
  designation?: string;
  fromDate?: Date;
  toDate?: Date;
  address?: string;
  salary?: number;
  reasonForLeaving?: string;
  createdAt: Date;
}

// Employee Dependent (for tax computation)
export interface EmployeeDependent {
  id: string;
  employeeId: string;
  dependentName: string;
  relationship?: string;
  dateOfBirth?: Date;
  gender?: string;
  isQualifiedDependent: boolean; // For BIR additional exemption
  createdAt: Date;
}

// Employee with all related data
export interface EmployeeWithDetails extends Employee {
  education: EmployeeEducation[];
  workExperience: EmployeeWorkExperience[];
  dependents: EmployeeDependent[];
}

// Zod Schemas
export const createDepartmentSchema = z.object({
  orgId: z.string().uuid(),
  departmentCode: z.string().max(20).optional(),
  departmentName: z.string().min(1).max(200),
  parentId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  isGroup: z.boolean().default(false),
  costCenterId: z.string().uuid().optional(),
  payrollCostCenterId: z.string().uuid().optional(),
});

export const createDesignationSchema = z.object({
  orgId: z.string().uuid(),
  designationCode: z.string().max(20).optional(),
  designationName: z.string().min(1).max(200),
  description: z.string().optional(),
});

export const createEmploymentTypeSchema = z.object({
  orgId: z.string().uuid(),
  typeName: z.string().min(1).max(100),
  description: z.string().optional(),
  defaultLeavePolicyId: z.string().uuid().optional(),
  isRegular: z.boolean().default(true),
  isSubjectToStatutory: z.boolean().default(true),
});

export const createBranchSchema = z.object({
  orgId: z.string().uuid(),
  branchCode: z.string().max(20).optional(),
  branchName: z.string().min(1).max(200),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default('Philippines'),
});

export const createEmployeeSchema = z.object({
  orgId: z.string().uuid(),
  employeeNo: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  suffix: z.string().max(20).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed', 'Separated']).optional(),
  bloodGroup: z.string().max(10).optional(),
  personalEmail: z.string().email().optional(),
  companyEmail: z.string().email().optional(),
  mobilePhone: z.string().max(50).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(50).optional(),
  emergencyContactRelation: z.string().max(100).optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  employmentTypeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  reportsTo: z.string().uuid().optional(),
  dateOfJoining: z.coerce.date().optional(),
  dateOfConfirmation: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),
  tinNo: z.string().max(50).optional(),
  sssNo: z.string().max(50).optional(),
  philhealthNo: z.string().max(50).optional(),
  pagibigNo: z.string().max(50).optional(),
  bankName: z.string().max(200).optional(),
  bankAccountNo: z.string().max(100).optional(),
  bankAccountName: z.string().max(200).optional(),
  salaryMode: z.enum(['Bank', 'Cash', 'Cheque']).default('Bank'),
  paymentDaysBasis: z.enum(['Calendar Days', 'Working Days']).default('Calendar Days'),
});

export const createDependentSchema = z.object({
  employeeId: z.string().uuid(),
  dependentName: z.string().min(1).max(200),
  relationship: z.string().max(100).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().max(20).optional(),
  isQualifiedDependent: z.boolean().default(false),
});

export type CreateDepartment = z.infer<typeof createDepartmentSchema>;
export type CreateDesignation = z.infer<typeof createDesignationSchema>;
export type CreateEmploymentType = z.infer<typeof createEmploymentTypeSchema>;
export type CreateBranch = z.infer<typeof createBranchSchema>;
export type CreateEmployee = z.infer<typeof createEmployeeSchema>;
export type CreateDependent = z.infer<typeof createDependentSchema>;

export interface UpdateEmployee extends Partial<CreateEmployee> {
  id: string;
  status?: EmployeeStatus;
  relievingDate?: Date;
  reasonForLeaving?: string;
}

// Employee list filters
export interface EmployeeListFilters {
  orgId: string;
  status?: EmployeeStatus;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  employmentTypeId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Employee summary for list views
export interface EmployeeSummary {
  id: string;
  employeeNo: string;
  fullName: string;
  departmentName?: string;
  designationName?: string;
  branchName?: string;
  status: EmployeeStatus;
  dateOfJoining?: Date;
  imageUrl?: string;
}
