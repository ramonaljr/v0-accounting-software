/**
 * Attendance and Leave Models
 * Shift management, attendance tracking, and leave management
 * Based on ERPNext's HR module
 */

import { z } from 'zod';

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Work From Home';
export type LeaveStatus = 'Open' | 'Approved' | 'Rejected' | 'Cancelled';
export type HolidayType = 'Regular' | 'Special Non-Working' | 'Special Working';

// Shift Type
export interface ShiftType {
  id: string;
  orgId: string;
  shiftName: string;
  startTime: string; // HH:MM format
  endTime: string;
  // Break
  breakDurationMinutes: number;
  // Working hours
  workingHoursThreshold: number;
  // Grace periods
  lateEntryGracePeriod: number;
  earlyExitGracePeriod: number;
  // Overtime
  enableAutoOt: boolean;
  otStartAfterMinutes: number;
  // Night differential (PH: 10pm-6am)
  nightDiffStartTime: string;
  nightDiffEndTime: string;
  nightDiffRate: number;
  isActive: boolean;
  createdAt: Date;
}

// Employee Shift Assignment
export interface EmployeeShiftAssignment {
  id: string;
  employeeId: string;
  shiftTypeId: string;
  shiftName?: string;
  fromDate: Date;
  toDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

// Holiday List
export interface HolidayList {
  id: string;
  orgId: string;
  listName: string;
  fromDate: Date;
  toDate: Date;
  isDefault: boolean;
  createdAt: Date;
}

// Holiday
export interface Holiday {
  id: string;
  holidayListId: string;
  holidayDate: Date;
  description?: string;
  holidayType: HolidayType;
  regularPayRate: number;
  holidayPayRate?: number;
  createdAt: Date;
}

// Attendance
export interface Attendance {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName?: string;
  attendanceDate: Date;
  shiftTypeId?: string;
  shiftName?: string;
  // Status
  status: AttendanceStatus;
  // Time
  checkIn?: Date;
  checkOut?: Date;
  // Computed hours
  workingHours: number;
  lateHours: number;
  earlyExitHours: number;
  overtimeHours: number;
  nightDiffHours: number;
  // Leave link
  leaveApplicationId?: string;
  // Remarks
  remarks?: string;
  // Status
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
}

// Leave Type
export interface LeaveType {
  id: string;
  orgId: string;
  leaveTypeName: string;
  // Allocation
  maxLeavesAllowed?: number;
  maxContinuousDaysAllowed?: number;
  isCarryForward: boolean;
  maxCarryForwardDays: number;
  carryForwardExpiryDays?: number;
  // Settings
  isLwp: boolean; // Leave Without Pay
  isPaidLeave: boolean;
  includeHolidayWithinLeaveAsLeave: boolean;
  isCompensatory: boolean;
  // Encashment
  allowEncashment: boolean;
  encashmentThresholdDays?: number;
  earningComponentId?: string;
  // Applicability
  applicableAfterDays: number;
  // PH Specific
  isServiceIncentiveLeave: boolean;
  isMaternityLeave: boolean;
  isPaternityLeave: boolean;
  isSoloParentLeave: boolean;
  isVawcLeave: boolean;
  isMagnaCartaLeave: boolean;
  // Document
  requiresAttachment: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Leave Policy
export interface LeavePolicy {
  id: string;
  orgId: string;
  policyName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

// Leave Policy Detail
export interface LeavePolicyDetail {
  id: string;
  leavePolicyId: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  annualAllocation: number;
  createdAt: Date;
}

// Leave Allocation
export interface LeaveAllocation {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  // Period
  fromDate: Date;
  toDate: Date;
  // Leaves
  newLeavesAllocated: number;
  carryForwardLeaves: number;
  totalLeavesAllocated: number;
  leavesTaken: number;
  leavesEncashed: number;
  balanceLeaves: number;
  // Status
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
}

// Leave Application
export interface LeaveApplication {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  // Dates
  fromDate: Date;
  toDate: Date;
  halfDay: boolean;
  halfDayDate?: Date;
  // Total
  totalLeaveDays: number;
  // Reason
  reason?: string;
  // Approval
  status: LeaveStatus;
  leaveApproverId?: string;
  leaveApproverName?: string;
  postingDate?: Date;
  // Link
  leaveAllocationId?: string;
  // Attachment
  attachmentUrl?: string;
  // Status
  docstatus: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Leave Balance Summary
export interface LeaveBalanceSummary {
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  totalAllocated: number;
  taken: number;
  pending: number;
  balance: number;
}

// Zod Schemas
export const createShiftTypeSchema = z.object({
  orgId: z.string().uuid(),
  shiftName: z.string().min(1).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakDurationMinutes: z.number().int().nonnegative().default(60),
  workingHoursThreshold: z.number().nonnegative().default(4),
  lateEntryGracePeriod: z.number().int().nonnegative().default(0),
  earlyExitGracePeriod: z.number().int().nonnegative().default(0),
  enableAutoOt: z.boolean().default(false),
  otStartAfterMinutes: z.number().int().nonnegative().default(0),
  nightDiffStartTime: z.string().regex(/^\d{2}:\d{2}$/).default('22:00'),
  nightDiffEndTime: z.string().regex(/^\d{2}:\d{2}$/).default('06:00'),
  nightDiffRate: z.number().nonnegative().default(0.10),
});

export const createHolidayListSchema = z.object({
  orgId: z.string().uuid(),
  listName: z.string().min(1).max(200),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  isDefault: z.boolean().default(false),
});

export const createHolidaySchema = z.object({
  holidayListId: z.string().uuid(),
  holidayDate: z.coerce.date(),
  description: z.string().max(300).optional(),
  holidayType: z.enum(['Regular', 'Special Non-Working', 'Special Working']).default('Regular'),
  regularPayRate: z.number().nonnegative().default(1.0),
  holidayPayRate: z.number().nonnegative().optional(),
});

export const createAttendanceSchema = z.object({
  orgId: z.string().uuid(),
  employeeId: z.string().uuid(),
  attendanceDate: z.coerce.date(),
  shiftTypeId: z.string().uuid().optional(),
  status: z.enum(['Present', 'Absent', 'Half Day', 'On Leave', 'Work From Home']),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export const createLeaveTypeSchema = z.object({
  orgId: z.string().uuid(),
  leaveTypeName: z.string().min(1).max(200),
  maxLeavesAllowed: z.number().int().nonnegative().optional(),
  maxContinuousDaysAllowed: z.number().int().nonnegative().optional(),
  isCarryForward: z.boolean().default(false),
  maxCarryForwardDays: z.number().int().nonnegative().default(0),
  carryForwardExpiryDays: z.number().int().nonnegative().optional(),
  isLwp: z.boolean().default(false),
  isPaidLeave: z.boolean().default(true),
  includeHolidayWithinLeaveAsLeave: z.boolean().default(true),
  isCompensatory: z.boolean().default(false),
  allowEncashment: z.boolean().default(false),
  encashmentThresholdDays: z.number().int().nonnegative().optional(),
  earningComponentId: z.string().uuid().optional(),
  applicableAfterDays: z.number().int().nonnegative().default(0),
  isServiceIncentiveLeave: z.boolean().default(false),
  isMaternityLeave: z.boolean().default(false),
  isPaternityLeave: z.boolean().default(false),
  isSoloParentLeave: z.boolean().default(false),
  isVawcLeave: z.boolean().default(false),
  isMagnaCartaLeave: z.boolean().default(false),
  requiresAttachment: z.boolean().default(false),
});

export const createLeaveApplicationSchema = z.object({
  orgId: z.string().uuid(),
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  halfDay: z.boolean().default(false),
  halfDayDate: z.coerce.date().optional(),
  reason: z.string().optional(),
  leaveApproverId: z.string().uuid().optional(),
  attachmentUrl: z.string().url().optional(),
});

export const createLeaveAllocationSchema = z.object({
  orgId: z.string().uuid(),
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  newLeavesAllocated: z.number().nonnegative(),
  carryForwardLeaves: z.number().nonnegative().default(0),
});

export type CreateShiftType = z.infer<typeof createShiftTypeSchema>;
export type CreateHolidayList = z.infer<typeof createHolidayListSchema>;
export type CreateHoliday = z.infer<typeof createHolidaySchema>;
export type CreateAttendance = z.infer<typeof createAttendanceSchema>;
export type CreateLeaveType = z.infer<typeof createLeaveTypeSchema>;
export type CreateLeaveApplication = z.infer<typeof createLeaveApplicationSchema>;
export type CreateLeaveAllocation = z.infer<typeof createLeaveAllocationSchema>;

// PH Mandatory Leave Types
export const PH_MANDATORY_LEAVE_TYPES = [
  {
    leaveTypeName: 'Service Incentive Leave',
    maxLeavesAllowed: 5,
    isPaidLeave: true,
    isServiceIncentiveLeave: true,
    applicableAfterDays: 365, // After 1 year
  },
  {
    leaveTypeName: 'Maternity Leave',
    maxLeavesAllowed: 105, // 105 days for normal, 120 for solo parent
    isPaidLeave: true,
    isMaternityLeave: true,
    requiresAttachment: true,
  },
  {
    leaveTypeName: 'Paternity Leave',
    maxLeavesAllowed: 7,
    isPaidLeave: true,
    isPaternityLeave: true,
    requiresAttachment: true,
  },
  {
    leaveTypeName: 'Solo Parent Leave',
    maxLeavesAllowed: 7,
    isPaidLeave: true,
    isSoloParentLeave: true,
    requiresAttachment: true,
  },
  {
    leaveTypeName: 'VAWC Leave',
    maxLeavesAllowed: 10,
    isPaidLeave: true,
    isVawcLeave: true,
    requiresAttachment: true,
  },
  {
    leaveTypeName: 'Magna Carta Leave',
    maxLeavesAllowed: 2, // 2 months (60 days)
    isPaidLeave: true,
    isMagnaCartaLeave: true,
    requiresAttachment: true,
  },
];
