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
// SCHEMAS - Import from models for type safety
// =============================================

import { createPayrollEntrySchema, createPayrollPeriodSchema } from '@/lib/models/hr/payroll';

const CreatePayrollEntrySchema = createPayrollEntrySchema;
const CreatePayrollPeriodSchema = createPayrollPeriodSchema;

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
 * Create a payroll entry (batch processing container)
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
      postingDate: new Date(validated.data.postingDate),
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      payrollFrequency: validated.data.payrollFrequency,
      currency: validated.data.currency,
      exchangeRate: validated.data.exchangeRate,
      payrollPeriodId: validated.data.payrollPeriodId,
      departmentId: validated.data.departmentId,
      branchId: validated.data.branchId,
      designationId: validated.data.designationId,
      companyId: validated.data.companyId,
      paymentAccountId: validated.data.paymentAccountId,
      costCenterId: validated.data.costCenterId,
      projectId: validated.data.projectId,
    });

    revalidatePath('/payroll/entries');
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
 * Get payroll entry by ID with salary slips
 */
export async function getPayrollEntry(id: string): Promise<ActionResult> {
  try {
    const entry = await PayrollService.getPayrollEntryById(id);

    return { success: true, data: entry };
  } catch (error) {
    console.error('[getPayrollEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payroll entry',
    };
  }
}

/**
 * Create salary slips for a payroll entry
 */
export async function createSalarySlips(payrollEntryId: string): Promise<ActionResult> {
  try {
    const slips = await PayrollService.createSalarySlips(payrollEntryId);

    revalidatePath('/payroll/salary-slips');
    revalidatePath(`/payroll/entries/${payrollEntryId}`);

    return { success: true, data: slips };
  } catch (error) {
    console.error('[createSalarySlips] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create salary slips',
    };
  }
}

/**
 * Submit payroll entry for approval
 */
export async function submitPayrollEntry(
  payrollEntryId: string
): Promise<ActionResult> {
  try {
    const entry = await PayrollService.submitPayrollEntry(payrollEntryId);

    revalidatePath('/payroll/entries');
    revalidatePath('/payroll/salary-slips');
    revalidatePath(`/payroll/entries/${payrollEntryId}`);

    return { success: true, data: entry };
  } catch (error) {
    console.error('[submitPayrollEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit payroll entry',
    };
  }
}

/**
 * Get salary slip by ID
 */
export async function getSalarySlip(id: string): Promise<ActionResult> {
  try {
    const salarySlip = await PayrollService.getSalarySlipById(id);

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
 * Generate payslip view model for printing/display
 */
export async function generatePayslip(salarySlipId: string): Promise<ActionResult> {
  try {
    const payslip = await PayrollService.generatePayslip(salarySlipId);

    return { success: true, data: payslip };
  } catch (error) {
    console.error('[generatePayslip] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate payslip',
    };
  }
}

/**
 * List salary slips with filters (direct DB query)
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

    const supabase = await createClient();

    let query = supabase
      .from('salary_slips')
      .select('*')
      .eq('org_id', orgId)
      .order('posting_date', { ascending: false });

    if (options?.employeeId) {
      query = query.eq('employee_id', options.employeeId);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.fromDate) {
      query = query.gte('posting_date', options.fromDate);
    }

    if (options?.toDate) {
      query = query.lte('posting_date', options.toDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[listSalarySlips] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list salary slips',
    };
  }
}

/**
 * List payroll entries with filters (direct DB query)
 */
export async function listPayrollEntries(options?: {
  orgId?: string;
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

    const supabase = await createClient();

    let query = supabase
      .from('payroll_entries')
      .select('*')
      .eq('org_id', orgId)
      .order('posting_date', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.fromDate) {
      query = query.gte('start_date', options.fromDate);
    }

    if (options?.toDate) {
      query = query.lte('end_date', options.toDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[listPayrollEntries] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list payroll entries',
    };
  }
}

// =============================================
// PAYROLL PERIOD ACTIONS
// =============================================

/**
 * Create a payroll period (direct DB insert)
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

    const supabase = await createClient();

    const { data: period, error } = await supabase
      .from('payroll_periods')
      .insert({
        org_id: validated.data.orgId,
        period_name: validated.data.periodName,
        start_date: new Date(validated.data.startDate).toISOString(),
        end_date: new Date(validated.data.endDate).toISOString(),
        payroll_frequency: validated.data.payrollFrequency,
        is_closed: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

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
 * List payroll periods (direct DB query)
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

    const supabase = await createClient();

    let query = supabase
      .from('payroll_periods')
      .select('*')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false });

    if (options?.year) {
      const yearStart = new Date(options.year, 0, 1).toISOString();
      const yearEnd = new Date(options.year, 11, 31).toISOString();
      query = query.gte('start_date', yearStart).lte('end_date', yearEnd);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[listPayrollPeriods] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list payroll periods',
    };
  }
}

// =============================================
// SALARY COMPONENT ACTIONS
// =============================================

/**
 * List salary components (direct DB query)
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

    const supabase = await createClient();

    let query = supabase
      .from('salary_components')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('sequence');

    if (options?.componentType) {
      query = query.eq('type', options.componentType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[listSalaryComponents] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list salary components',
    };
  }
}

// =============================================
// EMPLOYEES FOR PAYROLL
// =============================================

/**
 * Get employees eligible for payroll
 */
export async function getEmployeesForPayroll(
  startDate: string,
  endDate: string,
  options?: {
    orgId?: string;
    departmentId?: string;
    branchId?: string;
    designationId?: string;
  }
): Promise<ActionResult> {
  try {
    const orgId = options?.orgId || await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const employees = await PayrollService.getEmployeesForPayroll(
      orgId,
      new Date(startDate),
      new Date(endDate),
      {
        departmentId: options?.departmentId,
        branchId: options?.branchId,
        designationId: options?.designationId,
      }
    );

    return { success: true, data: employees };
  } catch (error) {
    console.error('[getEmployeesForPayroll] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get employees for payroll',
    };
  }
}

// =============================================
// YTD AND WORKING DAYS
// =============================================

/**
 * Get Year-to-Date earnings for an employee
 */
export async function getYTDEarnings(
  employeeId: string,
  year: number,
  asOfDate?: string
): Promise<ActionResult> {
  try {
    const ytd = await PayrollService.getYTDEarnings(
      employeeId,
      year,
      asOfDate ? new Date(asOfDate) : undefined
    );

    return { success: true, data: ytd };
  } catch (error) {
    console.error('[getYTDEarnings] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get YTD earnings',
    };
  }
}

/**
 * Get working days for a period
 */
export async function getWorkingDays(
  fromDate: string,
  toDate: string,
  orgId?: string,
  holidayListId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const workingDays = await PayrollService.getWorkingDays(
      resolvedOrgId,
      new Date(fromDate),
      new Date(toDate),
      holidayListId
    );

    return { success: true, data: workingDays };
  } catch (error) {
    console.error('[getWorkingDays] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get working days',
    };
  }
}

// =============================================
// HOLIDAY PAY
// =============================================

/**
 * Calculate holiday pay for a period
 */
export async function calculatePeriodHolidayPay(
  employeeId: string,
  fromDate: string,
  toDate: string,
  dailyRate: number,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const holidayPay = await PayrollService.calculatePeriodHolidayPay(
      resolvedOrgId,
      employeeId,
      new Date(fromDate),
      new Date(toDate),
      dailyRate
    );

    return { success: true, data: holidayPay };
  } catch (error) {
    console.error('[calculatePeriodHolidayPay] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate holiday pay',
    };
  }
}

/**
 * Get holidays in a date range
 */
export async function getHolidaysInRange(
  fromDate: string,
  toDate: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const holidays = await PayrollService.getHolidaysInRange(
      resolvedOrgId,
      new Date(fromDate),
      new Date(toDate)
    );

    return { success: true, data: holidays };
  } catch (error) {
    console.error('[getHolidaysInRange] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get holidays',
    };
  }
}

// =============================================
// BULK PAYROLL ACTIONS
// =============================================

/**
 * Create bulk payroll entries for multiple employees
 */
export async function createBulkPayrollEntries(
  orgId: string,
  employeeIds: string[],
  startDate: string,
  endDate: string,
  postingDate: string
): Promise<ActionResult<{ success: string[]; failed: Array<{ employeeId: string; error: string }> }>> {
  try {
    const successIds: string[] = [];
    const failed: Array<{ employeeId: string; error: string }> = [];

    for (const employeeId of employeeIds) {
      try {
        const entry = await PayrollService.createPayrollEntry({
          orgId,
          postingDate: new Date(postingDate),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          payrollFrequency: 'Monthly',
          currency: 'PHP',
          exchangeRate: 1,
        });

        // Create salary slip for this employee
        await PayrollService.createSalarySlips(entry.id);
        successIds.push(entry.id);
      } catch (error) {
        failed.push({
          employeeId,
          error: error instanceof Error ? error.message : 'Failed to create entry',
        });
      }
    }

    revalidatePath('/payroll/entries');
    revalidatePath('/payroll/salary-slips');

    return {
      success: true,
      data: { success: successIds, failed },
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
 * Process bulk payroll (submit multiple entries)
 */
export async function processBulkPayroll(
  payrollEntryIds: string[]
): Promise<ActionResult<{ success: string[]; failed: Array<{ entryId: string; error: string }> }>> {
  try {
    const successIds: string[] = [];
    const failed: Array<{ entryId: string; error: string }> = [];

    for (const entryId of payrollEntryIds) {
      try {
        await PayrollService.submitPayrollEntry(entryId);
        successIds.push(entryId);
      } catch (error) {
        failed.push({
          entryId,
          error: error instanceof Error ? error.message : 'Failed to process entry',
        });
      }
    }

    revalidatePath('/payroll/entries');
    revalidatePath('/payroll/salary-slips');

    return {
      success: true,
      data: { success: successIds, failed },
    };
  } catch (error) {
    console.error('[processBulkPayroll] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process bulk payroll',
    };
  }
}

/**
 * Cancel a payroll entry
 */
export async function cancelPayrollEntry(
  payrollEntryId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Update the payroll entry status to cancelled
    const { error } = await supabase
      .from('payroll_entries')
      .update({ status: 'Cancelled' })
      .eq('id', payrollEntryId);

    if (error) {
      throw new Error(error.message);
    }

    // Also cancel associated salary slips
    await supabase
      .from('salary_slips')
      .update({ status: 'Cancelled' })
      .eq('payroll_entry_id', payrollEntryId);

    revalidatePath('/payroll/entries');
    revalidatePath('/payroll/salary-slips');
    revalidatePath(`/payroll/entries/${payrollEntryId}`);

    return { success: true };
  } catch (error) {
    console.error('[cancelPayrollEntry] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel payroll entry',
    };
  }
}
