'use server';

/**
 * Payroll Server Actions
 * Server-side actions for payroll processing
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PayrollService } from '@/lib/services/hr/payroll.service';
import { createClient } from '@/lib/supabase/server';

// =============================================
// SCHEMAS
// =============================================

const CreatePayrollEntrySchema = z.object({
  orgId: z.string().uuid(),
  employeeId: z.string().uuid(),
  postingDate: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  payrollFrequency: z.enum(['Monthly', 'Semi-Monthly', 'Weekly', 'Bi-Weekly']).optional(),
  salaryStructureId: z.string().uuid().optional(),
});

const ProcessPayrollSchema = z.object({
  orgId: z.string().uuid(),
  payrollEntryId: z.string().uuid(),
  employeeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  postingDate: z.string(),
});

const CreatePayrollPeriodSchema = z.object({
  orgId: z.string().uuid(),
  periodName: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  payrollFrequency: z.enum(['Monthly', 'Semi-Monthly', 'Weekly', 'Bi-Weekly']),
});

// =============================================
// HELPER: Get current org
// =============================================

async function getCurrentOrg(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return membership?.org_id ?? null;
}

// =============================================
// ACTION RESULT TYPE
// =============================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// PAYROLL ENTRY ACTIONS
// =============================================

/**
 * Create a payroll entry for an employee
 */
export async function createPayrollEntry(
  data: z.infer<typeof CreatePayrollEntrySchema>
): Promise<ActionResult> {
  try {
    const validated = CreatePayrollEntrySchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const entry = await PayrollService.createPayrollEntry({
      orgId: validated.data.orgId,
      employeeId: validated.data.employeeId,
      postingDate: new Date(validated.data.postingDate),
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      payrollFrequency: validated.data.payrollFrequency || 'Monthly',
      salaryStructureId: validated.data.salaryStructureId,
    });

    revalidatePath('/payroll/salary-slips');

    return { success: true, data: entry };
  } catch (error) {
    console.error('[createPayrollEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payroll entry',
    };
  }
}

/**
 * Process payroll for an employee (calculate earnings, deductions, taxes)
 */
export async function processPayroll(
  data: z.infer<typeof ProcessPayrollSchema>
): Promise<ActionResult> {
  try {
    const validated = ProcessPayrollSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const result = await PayrollService.processPayroll({
      orgId: validated.data.orgId,
      payrollEntryId: validated.data.payrollEntryId,
      employeeId: validated.data.employeeId,
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      postingDate: new Date(validated.data.postingDate),
    });

    revalidatePath('/payroll/salary-slips');
    revalidatePath(`/payroll/salary-slips/${validated.data.payrollEntryId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('[processPayroll] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payroll',
    };
  }
}

/**
 * Submit payroll entry for approval
 */
export async function submitPayrollEntry(
  salarySlipId: string
): Promise<ActionResult> {
  try {
    await PayrollService.submitSalarySlip(salarySlipId);

    revalidatePath('/payroll/salary-slips');
    revalidatePath(`/payroll/salary-slips/${salarySlipId}`);

    return { success: true };
  } catch (error) {
    console.error('[submitPayrollEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit payroll entry',
    };
  }
}

/**
 * Cancel a payroll entry
 */
export async function cancelPayrollEntry(
  salarySlipId: string
): Promise<ActionResult> {
  try {
    await PayrollService.cancelSalarySlip(salarySlipId);

    revalidatePath('/payroll/salary-slips');
    revalidatePath(`/payroll/salary-slips/${salarySlipId}`);

    return { success: true };
  } catch (error) {
    console.error('[cancelPayrollEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel payroll entry',
    };
  }
}

/**
 * Get salary slip by ID
 */
export async function getSalarySlip(id: string): Promise<ActionResult> {
  try {
    const salarySlip = await PayrollService.getSalarySlipById(id);

    if (!salarySlip) {
      return { success: false, error: 'Salary slip not found' };
    }

    return { success: true, data: salarySlip };
  } catch (error) {
    console.error('[getSalarySlip] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get salary slip',
    };
  }
}

/**
 * List salary slips with filters
 */
export async function listSalarySlips(options?: {
  orgId?: string;
  employeeId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult> {
  try {
    const orgId = options?.orgId || await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const result = await PayrollService.listSalarySlips(orgId, {
      employeeId: options?.employeeId,
      status: options?.status,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
      limit: options?.limit,
      offset: options?.offset,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[listSalarySlips] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list salary slips',
    };
  }
}

// =============================================
// PAYROLL PERIOD ACTIONS
// =============================================

/**
 * Create a payroll period
 */
export async function createPayrollPeriod(
  data: z.infer<typeof CreatePayrollPeriodSchema>
): Promise<ActionResult> {
  try {
    const validated = CreatePayrollPeriodSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const period = await PayrollService.createPayrollPeriod({
      orgId: validated.data.orgId,
      periodName: validated.data.periodName,
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      payrollFrequency: validated.data.payrollFrequency,
    });

    revalidatePath('/payroll/periods');

    return { success: true, data: period };
  } catch (error) {
    console.error('[createPayrollPeriod] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payroll period',
    };
  }
}

/**
 * List payroll periods
 */
export async function listPayrollPeriods(options?: {
  orgId?: string;
  year?: number;
}): Promise<ActionResult> {
  try {
    const orgId = options?.orgId || await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const periods = await PayrollService.listPayrollPeriods(orgId, options?.year);

    return { success: true, data: periods };
  } catch (error) {
    console.error('[listPayrollPeriods] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list payroll periods',
    };
  }
}

// =============================================
// BULK PAYROLL ACTIONS
// =============================================

/**
 * Create payroll entries for multiple employees
 */
export async function createBulkPayrollEntries(
  orgId: string,
  employeeIds: string[],
  startDate: string,
  endDate: string,
  postingDate: string
): Promise<ActionResult> {
  try {
    const results: { success: string[]; failed: { id: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    for (const employeeId of employeeIds) {
      try {
        await PayrollService.createPayrollEntry({
          orgId,
          employeeId,
          postingDate: new Date(postingDate),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          payrollFrequency: 'Monthly',
        });
        results.success.push(employeeId);
      } catch (error) {
        results.failed.push({
          id: employeeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/payroll/salary-slips');

    return {
      success: results.failed.length === 0,
      data: results,
      error: results.failed.length > 0
        ? `${results.failed.length} entries failed`
        : undefined,
    };
  } catch (error) {
    console.error('[createBulkPayrollEntries] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bulk payroll entries',
    };
  }
}

/**
 * Process payroll for multiple employees
 */
export async function processBulkPayroll(
  orgId: string,
  entries: Array<{
    payrollEntryId: string;
    employeeId: string;
  }>,
  startDate: string,
  endDate: string,
  postingDate: string
): Promise<ActionResult> {
  try {
    const results: { success: string[]; failed: { id: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    for (const entry of entries) {
      try {
        await PayrollService.processPayroll({
          orgId,
          payrollEntryId: entry.payrollEntryId,
          employeeId: entry.employeeId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          postingDate: new Date(postingDate),
        });
        results.success.push(entry.payrollEntryId);
      } catch (error) {
        results.failed.push({
          id: entry.payrollEntryId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/payroll/salary-slips');

    return {
      success: results.failed.length === 0,
      data: results,
      error: results.failed.length > 0
        ? `${results.failed.length} entries failed to process`
        : undefined,
    };
  } catch (error) {
    console.error('[processBulkPayroll] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process bulk payroll',
    };
  }
}

// =============================================
// SALARY COMPONENT ACTIONS
// =============================================

/**
 * List salary components
 */
export async function listSalaryComponents(options?: {
  orgId?: string;
  componentType?: 'Earning' | 'Deduction';
}): Promise<ActionResult> {
  try {
    const orgId = options?.orgId || await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const components = await PayrollService.listSalaryComponents(
      orgId,
      options?.componentType
    );

    return { success: true, data: components };
  } catch (error) {
    console.error('[listSalaryComponents] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list salary components',
    };
  }
}

// =============================================
// ATTENDANCE ACTIONS
// =============================================

/**
 * Mark attendance for an employee
 */
export async function markAttendance(
  employeeId: string,
  attendanceDate: string,
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday' | 'Work From Home',
  options?: {
    orgId?: string;
    inTime?: string;
    outTime?: string;
    workingHours?: number;
    leaveApplicationId?: string;
    leaveTypeId?: string;
  }
): Promise<ActionResult> {
  try {
    const orgId = options?.orgId || await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const attendance = await PayrollService.markAttendance({
      orgId,
      employeeId,
      attendanceDate: new Date(attendanceDate),
      status,
      inTime: options?.inTime,
      outTime: options?.outTime,
      workingHours: options?.workingHours,
      leaveApplicationId: options?.leaveApplicationId,
      leaveTypeId: options?.leaveTypeId,
    });

    revalidatePath('/payroll/attendance');

    return { success: true, data: attendance };
  } catch (error) {
    console.error('[markAttendance] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark attendance',
    };
  }
}

/**
 * Get attendance for a date range
 */
export async function getAttendance(
  employeeId: string,
  fromDate: string,
  toDate: string
): Promise<ActionResult> {
  try {
    const attendance = await PayrollService.getAttendance(
      employeeId,
      new Date(fromDate),
      new Date(toDate)
    );

    return { success: true, data: attendance };
  } catch (error) {
    console.error('[getAttendance] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get attendance',
    };
  }
}

/**
 * Bulk mark attendance
 */
export async function bulkMarkAttendance(
  entries: Array<{
    employeeId: string;
    attendanceDate: string;
    status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday' | 'Work From Home';
  }>,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const results: { success: number; failed: { index: number; error: string }[] } = {
      success: 0,
      failed: [],
    };

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        await PayrollService.markAttendance({
          orgId: resolvedOrgId,
          employeeId: entry.employeeId,
          attendanceDate: new Date(entry.attendanceDate),
          status: entry.status,
        });
        results.success++;
      } catch (error) {
        results.failed.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/payroll/attendance');

    return {
      success: results.failed.length === 0,
      data: results,
      error: results.failed.length > 0
        ? `${results.failed.length} attendance records failed`
        : undefined,
    };
  } catch (error) {
    console.error('[bulkMarkAttendance] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk mark attendance',
    };
  }
}
