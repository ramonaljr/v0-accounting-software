/**
 * Leave Service (Backwards Compatibility)
 * @deprecated Import from '@/lib/services/hr/leave' instead
 *
 * This file re-exports from the refactored leave service structure.
 * The service has been split into smaller, focused services:
 * - LeaveTypeService: Leave type and policy management
 * - LeaveAllocationService: Leave allocation and balance management
 * - LeaveApplicationService: Leave application workflow
 * - AttendanceService: Attendance tracking
 * - HolidayService: Holiday list management
 * - ShiftService: Shift type management
 */

export {
  // Main facade
  LeaveService,
  leaveService,

  // Individual services
  LeaveTypeService,
  LeaveAllocationService,
  LeaveApplicationService,
  AttendanceService,
  HolidayService,
  ShiftService,

  // Types
  type LeaveBalance,
  type LeaveBalanceWithType,
  type LeaveSummary,
  type AttendanceSummary,
  type LeaveType,
  type LeavePolicy,
  type LeaveAllocation,
  type LeaveApplication,
  type ShiftType,
  type Attendance,
  type HolidayList,
  type Holiday,
  type LeaveStatus,
  type AttendanceStatus,
  type HolidayType,

  // Mappers
  mapDbToLeaveType,
  mapDbToLeaveAllocation,
  mapDbToLeaveApplication,
  mapDbToAttendance,
  mapDbToShiftType,
} from './leave';
