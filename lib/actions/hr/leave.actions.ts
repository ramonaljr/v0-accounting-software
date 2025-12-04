'use server';

/**
 * Leave Management Server Actions
 * Server-side actions for leave types, allocations, and applications
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { LeaveService } from '@/lib/services/hr/leave.service';
import { createClient } from '@/lib/supabase/server';

// =============================================
// SCHEMAS
// =============================================

// Use schemas from models for type safety
import {
  createLeaveTypeSchema,
  createLeaveApplicationSchema,
  createLeaveAllocationSchema
} from '@/lib/models/hr/attendance';

const CreateLeaveTypeSchema = createLeaveTypeSchema;
const CreateLeaveApplicationSchema = createLeaveApplicationSchema;

const ApproveLeaveSchema = z.object({
  leaveApplicationId: z.string().uuid(),
  approvedById: z.string().uuid(),
});

const RejectLeaveSchema = z.object({
  leaveApplicationId: z.string().uuid(),
  rejectedById: z.string().uuid(),
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
});

const CreateLeaveAllocationSchema = createLeaveAllocationSchema;

// =============================================
// HELPER: Get current org and user
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

async function getCurrentUser(): Promise<{ id: string; employeeId?: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Try to get employee ID if user is linked to an employee
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return {
    id: user.id,
    employeeId: employee?.id,
  };
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
// LEAVE TYPE ACTIONS
// =============================================

/**
 * Create a leave type
 */
export async function createLeaveType(
  data: z.infer<typeof CreateLeaveTypeSchema>
): Promise<ActionResult> {
  try {
    const validated = CreateLeaveTypeSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const leaveService = new LeaveService();
    const leaveType = await leaveService.createLeaveType(validated.data);

    revalidatePath('/payroll/leave-types');
    revalidatePath('/hr/leave-types');

    return { success: true, data: leaveType };
  } catch (error) {
    console.error('[createLeaveType] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create leave type',
    };
  }
}

/**
 * List leave types
 */
export async function listLeaveTypes(orgId?: string): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const leaveService = new LeaveService();
    const leaveTypes = await leaveService.listLeaveTypes(resolvedOrgId);

    return { success: true, data: leaveTypes };
  } catch (error) {
    console.error('[listLeaveTypes] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list leave types',
    };
  }
}

/**
 * Get leave type by ID
 */
export async function getLeaveType(
  id: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const leaveService = new LeaveService();
    const leaveType = await leaveService.getLeaveTypeById(id, resolvedOrgId);

    if (!leaveType) {
      return { success: false, error: 'Leave type not found' };
    }

    return { success: true, data: leaveType };
  } catch (error) {
    console.error('[getLeaveType] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leave type',
    };
  }
}

// =============================================
// LEAVE APPLICATION ACTIONS
// =============================================

/**
 * Create a leave application
 */
export async function createLeaveApplication(
  data: z.infer<typeof CreateLeaveApplicationSchema>
): Promise<ActionResult> {
  try {
    const validated = CreateLeaveApplicationSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const leaveService = new LeaveService();
    const application = await leaveService.createLeaveApplication({
      ...validated.data,
      fromDate: new Date(validated.data.fromDate),
      toDate: new Date(validated.data.toDate),
      halfDayDate: validated.data.halfDayDate
        ? new Date(validated.data.halfDayDate)
        : undefined,
    });

    revalidatePath('/payroll/leave-applications');
    revalidatePath('/hr/leave-applications');

    return { success: true, data: application };
  } catch (error) {
    console.error('[createLeaveApplication] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create leave application',
    };
  }
}

/**
 * Approve a leave application
 */
export async function approveLeaveApplication(
  leaveApplicationId: string,
  approvedById?: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const currentUser = await getCurrentUser();
    const approverId = approvedById || currentUser?.employeeId;

    if (!approverId) {
      return { success: false, error: 'Approver ID not found' };
    }

    const leaveService = new LeaveService();
    const application = await leaveService.approveLeaveApplication(
      leaveApplicationId,
      resolvedOrgId,
      approverId
    );

    revalidatePath('/payroll/leave-applications');
    revalidatePath('/hr/leave-applications');

    return { success: true, data: application };
  } catch (error) {
    console.error('[approveLeaveApplication] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve leave application',
    };
  }
}

/**
 * Reject a leave application
 */
export async function rejectLeaveApplication(
  leaveApplicationId: string,
  rejectionReason: string,
  rejectedById?: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const currentUser = await getCurrentUser();
    const rejecterId = rejectedById || currentUser?.employeeId;

    if (!rejecterId) {
      return { success: false, error: 'Rejecter ID not found' };
    }

    if (!rejectionReason?.trim()) {
      return { success: false, error: 'Rejection reason is required' };
    }

    const leaveService = new LeaveService();
    const application = await leaveService.rejectLeaveApplication(
      leaveApplicationId,
      resolvedOrgId,
      rejecterId,
      rejectionReason
    );

    revalidatePath('/payroll/leave-applications');
    revalidatePath('/hr/leave-applications');

    return { success: true, data: application };
  } catch (error) {
    console.error('[rejectLeaveApplication] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject leave application',
    };
  }
}

/**
 * Cancel a leave application
 */
export async function cancelLeaveApplication(
  leaveApplicationId: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const leaveService = new LeaveService();
    const application = await leaveService.cancelLeaveApplication(
      leaveApplicationId,
      resolvedOrgId
    );

    revalidatePath('/payroll/leave-applications');
    revalidatePath('/hr/leave-applications');

    return { success: true, data: application };
  } catch (error) {
    console.error('[cancelLeaveApplication] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel leave application',
    };
  }
}

/**
 * List leave applications
 */
export async function listLeaveApplications(options?: {
  orgId?: string;
  employeeId?: string;
  leaveTypeId?: string;
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

    const leaveService = new LeaveService();
    const applications = await leaveService.listLeaveApplications(orgId, {
      employeeId: options?.employeeId,
      leaveTypeId: options?.leaveTypeId,
      status: options?.status,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
      limit: options?.limit,
      offset: options?.offset,
    });

    return { success: true, data: applications };
  } catch (error) {
    console.error('[listLeaveApplications] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list leave applications',
    };
  }
}

/**
 * Get leave application by ID
 */
export async function getLeaveApplication(id: string): Promise<ActionResult> {
  try {
    const leaveService = new LeaveService();
    const application = await leaveService.getLeaveApplicationById(id);

    if (!application) {
      return { success: false, error: 'Leave application not found' };
    }

    return { success: true, data: application };
  } catch (error) {
    console.error('[getLeaveApplication] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leave application',
    };
  }
}

// =============================================
// LEAVE ALLOCATION ACTIONS
// =============================================

/**
 * Create a leave allocation
 */
export async function createLeaveAllocation(
  data: z.infer<typeof CreateLeaveAllocationSchema>
): Promise<ActionResult> {
  try {
    const validated = CreateLeaveAllocationSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
      };
    }

    const leaveService = new LeaveService();
    const allocation = await leaveService.createLeaveAllocation({
      ...validated.data,
      fromDate: new Date(validated.data.fromDate),
      toDate: new Date(validated.data.toDate),
    });

    revalidatePath('/payroll/leave-allocations');
    revalidatePath('/hr/leave-allocations');

    return { success: true, data: allocation };
  } catch (error) {
    console.error('[createLeaveAllocation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create leave allocation',
    };
  }
}

/**
 * List leave allocations for an employee
 */
export async function listLeaveAllocations(
  employeeId: string,
  options?: {
    leaveTypeId?: string;
    year?: number;
  }
): Promise<ActionResult> {
  try {
    const leaveService = new LeaveService();
    const allocations = await leaveService.listLeaveAllocations(employeeId, {
      leaveTypeId: options?.leaveTypeId,
      year: options?.year,
    });

    return { success: true, data: allocations };
  } catch (error) {
    console.error('[listLeaveAllocations] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list leave allocations',
    };
  }
}

/**
 * Get leave balance for an employee
 */
export async function getLeaveBalance(
  employeeId: string,
  leaveTypeId: string,
  asOfDate?: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const leaveService = new LeaveService();
    const balance = await leaveService.getLeaveBalance(
      employeeId,
      leaveTypeId,
      resolvedOrgId,
      asOfDate ? new Date(asOfDate) : undefined
    );

    return { success: true, data: balance };
  } catch (error) {
    console.error('[getLeaveBalance] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leave balance',
    };
  }
}

/**
 * Get all leave balances for an employee
 */
export async function getAllLeaveBalances(
  employeeId: string,
  orgId?: string
): Promise<ActionResult> {
  try {
    const resolvedOrgId = orgId || await getCurrentOrg();
    if (!resolvedOrgId) {
      return { success: false, error: 'Organization not found' };
    }

    const leaveService = new LeaveService();
    const balances = await leaveService.getAllLeaveBalances(employeeId, resolvedOrgId);

    return { success: true, data: balances };
  } catch (error) {
    console.error('[getAllLeaveBalances] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leave balances',
    };
  }
}

// =============================================
// BULK LEAVE ALLOCATION ACTIONS
// =============================================

/**
 * Bulk allocate leaves to multiple employees
 */
export async function bulkAllocateLeaves(
  orgId: string,
  employeeIds: string[],
  leaveTypeId: string,
  newLeavesAllocated: number,
  fromDate: string,
  toDate: string,
  carryForwardedLeaves?: number
): Promise<ActionResult> {
  try {
    const results: { success: string[]; failed: { id: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    const leaveService = new LeaveService();

    for (const employeeId of employeeIds) {
      try {
        await leaveService.createLeaveAllocation({
          orgId,
          employeeId,
          leaveTypeId,
          newLeavesAllocated,
          fromDate: new Date(fromDate),
          toDate: new Date(toDate),
          carryForwardLeaves: carryForwardedLeaves || 0,
        });
        results.success.push(employeeId);
      } catch (error) {
        results.failed.push({
          id: employeeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/payroll/leave-allocations');
    revalidatePath('/hr/leave-allocations');

    return {
      success: results.failed.length === 0,
      data: results,
      error: results.failed.length > 0
        ? `${results.failed.length} allocations failed`
        : undefined,
    };
  } catch (error) {
    console.error('[bulkAllocateLeaves] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk allocate leaves',
    };
  }
}

// =============================================
// LEAVE REPORTS
// =============================================

/**
 * Get leave summary for an organization
 */
export async function getLeaveSummary(
  options?: {
    orgId?: string;
    departmentId?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<ActionResult> {
  try {
    const orgId = options?.orgId || await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const leaveService = new LeaveService();
    const summary = await leaveService.getLeaveSummary(orgId, {
      departmentId: options?.departmentId,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error('[getLeaveSummary] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leave summary',
    };
  }
}
