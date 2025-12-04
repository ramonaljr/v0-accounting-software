'use server';

/**
 * Employee Server Actions
 * Server-side actions for employee CRUD operations
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { employeeService } from '@/lib/services/hr/employee.service';
import { createClient } from '@/lib/supabase/server';

// =============================================
// SCHEMAS
// =============================================

const CreateEmployeeSchema = z.object({
  orgId: z.string().uuid(),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed', 'Separated']).optional(),
  dateOfJoining: z.coerce.date().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  employmentTypeId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  reportsTo: z.string().uuid().optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  companyEmail: z.string().email().optional().or(z.literal('')),
  mobilePhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankAccountName: z.string().optional(),
  tinNo: z.string().optional(),
  sssNo: z.string().optional(),
  philhealthNo: z.string().optional(),
  pagibigNo: z.string().optional(),
  salaryMode: z.enum(['Bank', 'Cash', 'Cheque']).default('Bank'),
  paymentDaysBasis: z.enum(['Calendar Days', 'Working Days']).default('Calendar Days'),
});

const UpdateEmployeeSchema = CreateEmployeeSchema.partial().extend({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
});

const CreateDepartmentSchema = z.object({
  orgId: z.string().uuid(),
  departmentCode: z.string().optional(),
  departmentName: z.string().min(1, 'Department name is required'),
  parentId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  isGroup: z.boolean().default(false),
  costCenterId: z.string().uuid().optional(),
  payrollCostCenterId: z.string().uuid().optional(),
});

const CreateDesignationSchema = z.object({
  orgId: z.string().uuid(),
  designationName: z.string().min(1, 'Designation name is required'),
  description: z.string().optional(),
});

// =============================================
// HELPER: Get current org
// =============================================

async function getCurrentOrg(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's primary organization
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return membership?.org_id ?? null;
}

// =============================================
// EMPLOYEE ACTIONS
// =============================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new employee
 */
export async function createEmployee(
  formData: FormData | Record<string, unknown>
): Promise<ActionResult> {
  try {
    // Parse form data
    const rawData = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    const validated = CreateEmployeeSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const employee = await employeeService.createEmployee(validated.data);

    revalidatePath('/payroll/employees');
    revalidatePath('/hr/employees');

    return {
      success: true,
      data: employee,
    };
  } catch (error) {
    console.error('[createEmployee] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create employee',
    };
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(
  formData: FormData | Record<string, unknown>
): Promise<ActionResult> {
  try {
    const rawData = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    const data = {
      ...rawData,
      qualifiedDependents: rawData.qualifiedDependents
        ? Number(rawData.qualifiedDependents)
        : undefined,
    };

    const validated = UpdateEmployeeSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const { id, orgId, ...updateData } = validated.data;
    const employee = await employeeService.updateEmployee(id, orgId, updateData);

    revalidatePath('/payroll/employees');
    revalidatePath('/hr/employees');
    revalidatePath(`/payroll/employees/${id}`);

    return {
      success: true,
      data: employee,
    };
  } catch (error) {
    console.error('[updateEmployee] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee',
    };
  }
}

/**
 * Get employee by ID
 */
export async function getEmployee(
  id: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const employee = await employeeService.getEmployeeById(id, resolvedOrgId);

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    return { success: true, data: employee };
  } catch (error) {
    console.error('[getEmployee] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get employee',
    };
  }
}

/**
 * List employees with optional filters
 */
export async function listEmployees(options?: {
  orgId?: string;
  status?: string;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  employmentTypeId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult> {
  try {
    const orgId = options?.orgId || await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const result = await employeeService.listEmployees(orgId, {
      status: options?.status,
      departmentId: options?.departmentId,
      designationId: options?.designationId,
      branchId: options?.branchId,
      employmentTypeId: options?.employmentTypeId,
      search: options?.search,
      limit: options?.limit,
      offset: options?.offset,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[listEmployees] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list employees',
    };
  }
}

/**
 * Update employee status (Active, Left, Suspended)
 */
export async function updateEmployeeStatus(
  id: string,
  status: string,
  relievingDate?: string,
  reasonForLeaving?: string
): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const employee = await employeeService.updateEmployeeStatus(
      id,
      orgId,
      status,
      relievingDate ? new Date(relievingDate) : undefined,
      reasonForLeaving
    );

    revalidatePath('/payroll/employees');
    revalidatePath('/hr/employees');

    return { success: true, data: employee };
  } catch (error) {
    console.error('[updateEmployeeStatus] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee status',
    };
  }
}

// =============================================
// DEPARTMENT ACTIONS
// =============================================

/**
 * Create a new department
 */
export async function createDepartment(
  formData: FormData | Record<string, unknown>
): Promise<ActionResult> {
  try {
    const data = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    const validated = CreateDepartmentSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const department = await employeeService.createDepartment(validated.data);

    revalidatePath('/payroll/departments');
    revalidatePath('/hr/departments');

    return { success: true, data: department };
  } catch (error) {
    console.error('[createDepartment] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create department',
    };
  }
}

/**
 * List departments
 */
export async function listDepartments(orgId?: string): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const departments = await employeeService.listDepartments(resolvedOrgId);
    return { success: true, data: departments };
  } catch (error) {
    console.error('[listDepartments] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list departments',
    };
  }
}

// =============================================
// DESIGNATION ACTIONS
// =============================================

/**
 * Create a new designation
 */
export async function createDesignation(
  formData: FormData | Record<string, unknown>
): Promise<ActionResult> {
  try {
    const data = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    const validated = CreateDesignationSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const designation = await employeeService.createDesignation(validated.data);

    revalidatePath('/payroll/designations');
    revalidatePath('/hr/designations');

    return { success: true, data: designation };
  } catch (error) {
    console.error('[createDesignation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create designation',
    };
  }
}

/**
 * List designations
 */
export async function listDesignations(orgId?: string): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const designations = await employeeService.listDesignations(resolvedOrgId);
    return { success: true, data: designations };
  } catch (error) {
    console.error('[listDesignations] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list designations',
    };
  }
}

// =============================================
// BRANCH ACTIONS
// =============================================

/**
 * Create a new branch
 */
export async function createBranch(
  orgId: string,
  branchName: string,
  address?: string
): Promise<ActionResult> {
  try {
    const branch = await employeeService.createBranch({
      orgId,
      branchName,
      addressLine1: address,
    });

    revalidatePath('/payroll/branches');
    revalidatePath('/hr/branches');

    return { success: true, data: branch };
  } catch (error) {
    console.error('[createBranch] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create branch',
    };
  }
}

/**
 * List branches
 */
export async function listBranches(orgId?: string): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const branches = await employeeService.listBranches(resolvedOrgId);
    return { success: true, data: branches };
  } catch (error) {
    console.error('[listBranches] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list branches',
    };
  }
}

// =============================================
// EMPLOYEE GRADE ACTIONS
// =============================================

/**
 * Create an employee grade
 */
export async function createEmployeeGrade(
  orgId: string,
  gradeName: string,
  defaultBasePay?: number,
  description?: string
): Promise<ActionResult> {
  try {
    const grade = await employeeService.createEmployeeGrade(
      orgId,
      gradeName,
      description,
      defaultBasePay
    );

    revalidatePath('/payroll/grades');
    revalidatePath('/hr/grades');

    return { success: true, data: grade };
  } catch (error) {
    console.error('[createEmployeeGrade] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create employee grade',
    };
  }
}

/**
 * List employee grades
 */
export async function listEmployeeGrades(orgId?: string): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const grades = await employeeService.listEmployeeGrades(resolvedOrgId);
    return { success: true, data: grades };
  } catch (error) {
    console.error('[listEmployeeGrades] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list employee grades',
    };
  }
}

// =============================================
// EMPLOYMENT TYPE ACTIONS
// =============================================

/**
 * Create an employment type
 */
export async function createEmploymentType(
  orgId: string,
  typeName: string
): Promise<ActionResult> {
  try {
    const type = await employeeService.createEmploymentType(orgId, typeName);

    revalidatePath('/payroll/employment-types');
    revalidatePath('/hr/employment-types');

    return { success: true, data: type };
  } catch (error) {
    console.error('[createEmploymentType] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create employment type',
    };
  }
}

/**
 * List employment types
 */
export async function listEmploymentTypes(orgId?: string): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const types = await employeeService.listEmploymentTypes(resolvedOrgId);
    return { success: true, data: types };
  } catch (error) {
    console.error('[listEmploymentTypes] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list employment types',
    };
  }
}

// =============================================
// EDUCATION, EXPERIENCE, DEPENDENTS ACTIONS
// =============================================

/**
 * Add employee education
 */
export async function addEmployeeEducation(
  employeeId: string,
  education: {
    school: string;
    qualification: string;
    level?: string;
    yearOfPassing?: number;
    classOrPercentage?: string;
    majorSubject?: string;
  }
): Promise<ActionResult> {
  try {
    const result = await employeeService.addEmployeeEducation(employeeId, education);

    revalidatePath(`/payroll/employees/${employeeId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('[addEmployeeEducation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add education',
    };
  }
}

/**
 * Add employee work experience
 */
export async function addEmployeeWorkExperience(
  employeeId: string,
  experience: {
    companyName: string;
    designation?: string;
    fromDate: Date;
    toDate?: Date;
    address?: string;
    salary?: number;
    reasonForLeaving?: string;
  }
): Promise<ActionResult> {
  try {
    const result = await employeeService.addEmployeeWorkExperience(employeeId, experience);

    revalidatePath(`/payroll/employees/${employeeId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('[addEmployeeWorkExperience] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add work experience',
    };
  }
}

/**
 * Add employee dependent
 */
export async function addEmployeeDependent(
  employeeId: string,
  dependent: {
    dependentName: string;
    relationship?: string;
    dateOfBirth?: Date;
    gender?: string;
    isQualifiedDependent: boolean;
  }
): Promise<ActionResult> {
  try {
    const result = await employeeService.addEmployeeDependent(employeeId, dependent);

    revalidatePath(`/payroll/employees/${employeeId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('[addEmployeeDependent] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add dependent',
    };
  }
}
