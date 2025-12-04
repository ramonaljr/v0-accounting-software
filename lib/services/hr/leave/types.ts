/**
 * Leave Service Types
 * Shared types used across leave sub-services
 */

import type {
  LeaveType,
  LeavePolicy,
  LeaveAllocation,
  LeaveApplication,
  ShiftType,
  Attendance,
  HolidayList,
  Holiday,
  LeaveStatus,
  AttendanceStatus,
  HolidayType,
} from '@/lib/models/hr';

/**
 * Leave balance summary
 */
export interface LeaveBalance {
  allocated: number;
  used: number;
  pending: number;
  balance: number;
}

/**
 * Leave balance with type info
 */
export interface LeaveBalanceWithType extends LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
}

/**
 * Leave summary for organization
 */
export interface LeaveSummary {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  byLeaveType: Array<{
    leaveTypeId: string;
    leaveTypeName: string;
    count: number;
  }>;
}

/**
 * Attendance summary for payroll
 */
export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  wfhDays: number;
  lateEntries: number;
  earlyExits: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  totalNightDiffHours: number;
  leaveWithoutPay: number;
}

/**
 * Re-export model types for convenience
 */
export type {
  LeaveType,
  LeavePolicy,
  LeaveAllocation,
  LeaveApplication,
  ShiftType,
  Attendance,
  HolidayList,
  Holiday,
  LeaveStatus,
  AttendanceStatus,
  HolidayType,
};
