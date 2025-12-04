/**
 * Leave Entity Mappers
 * Functions for mapping database rows to domain models
 */

import type {
  LeaveType,
  LeaveAllocation,
  LeaveApplication,
  Attendance,
  ShiftType,
  LeaveStatus,
  AttendanceStatus,
} from '@/lib/models/hr';

/**
 * Map database row to LeaveType domain model
 */
export function mapDbToLeaveType(data: Record<string, unknown>): LeaveType {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    leaveTypeName: data.leave_type_name as string,
    maxLeavesAllowed: data.max_leaves_allowed as number | undefined,
    maxContinuousDaysAllowed: data.max_continuous_days as number | undefined,
    isCarryForward: data.is_carry_forward as boolean,
    maxCarryForwardDays: data.max_carry_forward_days as number,
    carryForwardExpiryDays: data.carry_forward_expiry_days as number | undefined,
    isLwp: data.is_lwp as boolean,
    isPaidLeave: data.is_paid_leave as boolean,
    includeHolidayWithinLeaveAsLeave: data.include_holiday_within_leave_as_leave as boolean,
    isCompensatory: data.is_compensatory as boolean,
    allowEncashment: data.allow_encashment as boolean,
    encashmentThresholdDays: data.encashment_threshold_days as number | undefined,
    earningComponentId: data.earning_component_id as string | undefined,
    applicableAfterDays: data.applicable_after_days as number,
    isServiceIncentiveLeave: data.is_service_incentive_leave as boolean,
    isMaternityLeave: data.is_maternity_leave as boolean,
    isPaternityLeave: data.is_paternity_leave as boolean,
    isSoloParentLeave: data.is_solo_parent_leave as boolean,
    isVawcLeave: data.is_vawc_leave as boolean,
    isMagnaCartaLeave: data.is_magna_carta_leave as boolean,
    requiresAttachment: data.requires_attachment as boolean,
    isActive: data.is_active as boolean,
    createdAt: new Date(data.created_at as string),
  };
}

/**
 * Map database row to LeaveAllocation domain model
 */
export function mapDbToLeaveAllocation(data: Record<string, unknown>): LeaveAllocation {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    employeeId: data.employee_id as string,
    leaveTypeId: data.leave_type_id as string,
    fromDate: new Date(data.from_date as string),
    toDate: new Date(data.to_date as string),
    newLeavesAllocated: data.new_leaves_allocated as number,
    carryForwardLeaves: data.carry_forward_leaves as number,
    totalLeavesAllocated: data.total_leaves_allocated as number,
    leavesTaken: (data.leaves_taken as number) || 0,
    leavesEncashed: (data.leaves_encashed as number) || 0,
    balanceLeaves: (data.balance_leaves as number) || 0,
    docstatus: data.docstatus as number,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * Map database row to LeaveApplication domain model
 */
export function mapDbToLeaveApplication(data: Record<string, unknown>): LeaveApplication {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    employeeId: data.employee_id as string,
    leaveTypeId: data.leave_type_id as string,
    fromDate: new Date(data.from_date as string),
    toDate: new Date(data.to_date as string),
    halfDay: data.half_day as boolean,
    halfDayDate: data.half_day_date ? new Date(data.half_day_date as string) : undefined,
    totalLeaveDays: data.total_leave_days as number,
    reason: data.reason as string | undefined,
    leaveApproverId: data.leave_approver_id as string | undefined,
    status: data.status as LeaveStatus,
    docstatus: data.docstatus as number,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * Map database row to Attendance domain model
 */
export function mapDbToAttendance(data: Record<string, unknown>): Attendance {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    employeeId: data.employee_id as string,
    attendanceDate: new Date(data.attendance_date as string),
    status: data.status as AttendanceStatus,
    shiftTypeId: data.shift_id as string | undefined,
    checkIn: data.in_time ? new Date(data.in_time as string) : undefined,
    checkOut: data.out_time ? new Date(data.out_time as string) : undefined,
    workingHours: (data.working_hours as number) || 0,
    lateHours: (data.late_hours as number) || 0,
    earlyExitHours: (data.early_exit_hours as number) || 0,
    overtimeHours: (data.overtime_hours as number) || 0,
    nightDiffHours: (data.night_diff_hours as number) || 0,
    leaveApplicationId: data.leave_application_id as string | undefined,
    remarks: data.remarks as string | undefined,
    docstatus: data.docstatus as number,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * Map database row to ShiftType domain model
 */
export function mapDbToShiftType(data: Record<string, unknown>): ShiftType {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    shiftName: data.shift_name as string,
    startTime: data.start_time as string,
    endTime: data.end_time as string,
    breakDurationMinutes: (data.break_duration_minutes as number) || 60,
    workingHoursThreshold: (data.working_hours_threshold as number) || 4,
    lateEntryGracePeriod: (data.late_entry_grace_period as number) || 0,
    earlyExitGracePeriod: (data.early_exit_grace_period as number) || 0,
    enableAutoOt: (data.enable_auto_ot as boolean) || false,
    otStartAfterMinutes: (data.ot_start_after_minutes as number) || 0,
    nightDiffStartTime: (data.night_diff_start_time as string) || '22:00',
    nightDiffEndTime: (data.night_diff_end_time as string) || '06:00',
    nightDiffRate: (data.night_diff_rate as number) || 0.10,
    isActive: data.is_active as boolean,
    createdAt: new Date(data.created_at as string),
  };
}
