/**
 * Leave Services Index
 * Re-exports all leave-related services and provides a facade
 */

// Export individual services
export { LeaveTypeService } from './leave-type.service';
export { LeaveAllocationService } from './leave-allocation.service';
export { LeaveApplicationService } from './leave-application.service';
export { AttendanceService } from './attendance.service';
export { HolidayService } from './holiday.service';
export { ShiftService } from './shift.service';

// Export types
export type {
  LeaveBalance,
  LeaveBalanceWithType,
  LeaveSummary,
  AttendanceSummary,
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
} from './types';

// Export mappers
export {
  mapDbToLeaveType,
  mapDbToLeaveAllocation,
  mapDbToLeaveApplication,
  mapDbToAttendance,
  mapDbToShiftType,
} from './mappers';

// Import services for facade
import { LeaveTypeService } from './leave-type.service';
import { LeaveAllocationService } from './leave-allocation.service';
import { LeaveApplicationService } from './leave-application.service';
import { AttendanceService } from './attendance.service';
import { HolidayService } from './holiday.service';
import { ShiftService } from './shift.service';

// Import types for method signatures
import type {
  LeaveType,
  LeavePolicy,
  LeaveAllocation,
  LeaveApplication,
  ShiftType,
  Attendance,
  HolidayList,
  Holiday,
  HolidayType,
  AttendanceStatus,
} from './types';
import type { CreateLeaveType, CreateLeaveAllocation, CreateLeaveApplication } from '@/lib/models/hr';
import type { LeaveBalance, LeaveBalanceWithType, LeaveSummary, AttendanceSummary } from './types';

/**
 * LeaveService facade - maintains backwards compatibility
 * Supports both static and instance method calls
 * Delegates to specialized sub-services
 */
export class LeaveService {
  // ==================== STATIC METHODS ====================

  // Leave Type methods (static)
  static createLeaveType = LeaveTypeService.createLeaveType;
  static getLeaveTypeById = LeaveTypeService.getLeaveTypeById;
  static listLeaveTypes = LeaveTypeService.listLeaveTypes;
  static seedPhLeaveTypes = LeaveTypeService.seedPhLeaveTypes;
  static createLeavePolicy = LeaveTypeService.createLeavePolicy;
  static listLeavePolicies = LeaveTypeService.listLeavePolicies;

  // Leave Allocation methods (static)
  static createLeaveAllocation = LeaveAllocationService.createLeaveAllocation;
  static getEmployeeLeaveAllocations = LeaveAllocationService.getEmployeeLeaveAllocations;
  static getLeaveBalance = LeaveAllocationService.getLeaveBalance;
  static listLeaveAllocations = LeaveAllocationService.listLeaveAllocations;
  static getAllLeaveBalances = LeaveAllocationService.getAllLeaveBalances;
  static allocateLeavesFromPolicy = LeaveAllocationService.allocateLeavesFromPolicy;

  // Leave Application methods (static)
  static createLeaveApplication = LeaveApplicationService.createLeaveApplication;
  static approveLeaveApplication = LeaveApplicationService.approveLeaveApplication;
  static rejectLeaveApplication = LeaveApplicationService.rejectLeaveApplication;
  static cancelLeaveApplication = LeaveApplicationService.cancelLeaveApplication;
  static listLeaveApplications = LeaveApplicationService.listLeaveApplications;
  static getLeaveApplicationById = LeaveApplicationService.getLeaveApplicationById;
  static getLeaveSummary = LeaveApplicationService.getLeaveSummary;

  // Attendance methods (static)
  static markAttendance = AttendanceService.markAttendance;
  static getEmployeeAttendance = AttendanceService.getEmployeeAttendance;
  static getAttendanceSummary = AttendanceService.getAttendanceSummary;
  static bulkMarkAttendance = AttendanceService.bulkMarkAttendance;
  static getOrgAttendanceByDate = AttendanceService.getOrgAttendanceByDate;

  // Holiday methods (static)
  static createHolidayList = HolidayService.createHolidayList;
  static getDefaultHolidayList = HolidayService.getDefaultHolidayList;
  static listHolidayLists = HolidayService.listHolidayLists;
  static addHoliday = HolidayService.addHoliday;
  static seedPhHolidays = HolidayService.seedPhHolidays;
  static getHolidays = HolidayService.getHolidays;
  static isHoliday = HolidayService.isHoliday;
  static deleteHoliday = HolidayService.deleteHoliday;
  static updateHoliday = HolidayService.updateHoliday;

  // Shift methods (static)
  static createShiftType = ShiftService.createShiftType;
  static getShiftTypeById = ShiftService.getShiftTypeById;
  static listShiftTypes = ShiftService.listShiftTypes;
  static updateShiftType = ShiftService.updateShiftType;
  static deleteShiftType = ShiftService.deleteShiftType;
  static assignShiftToEmployee = ShiftService.assignShiftToEmployee;
  static getEmployeeShift = ShiftService.getEmployeeShift;
  static calculateExpectedHours = ShiftService.calculateExpectedHours;
  static isNightDiffTime = ShiftService.isNightDiffTime;

  // ==================== INSTANCE METHODS ====================
  // For backwards compatibility with `new LeaveService().method()` calls

  // Leave Type instance methods
  createLeaveType(data: CreateLeaveType): Promise<LeaveType> {
    return LeaveTypeService.createLeaveType(data);
  }

  getLeaveTypeById(id: string, orgId: string): Promise<LeaveType | null> {
    return LeaveTypeService.getLeaveTypeById(id, orgId);
  }

  listLeaveTypes(orgId: string): Promise<LeaveType[]> {
    return LeaveTypeService.listLeaveTypes(orgId);
  }

  seedPhLeaveTypes(orgId: string): Promise<void> {
    return LeaveTypeService.seedPhLeaveTypes(orgId);
  }

  createLeavePolicy(
    orgId: string,
    policyName: string,
    leaveAllocations: Array<{ leaveTypeId: string; annualAllocation: number }>
  ): Promise<LeavePolicy> {
    return LeaveTypeService.createLeavePolicy(orgId, policyName, leaveAllocations);
  }

  listLeavePolicies(orgId: string): Promise<LeavePolicy[]> {
    return LeaveTypeService.listLeavePolicies(orgId);
  }

  // Leave Allocation instance methods
  createLeaveAllocation(data: CreateLeaveAllocation): Promise<LeaveAllocation> {
    return LeaveAllocationService.createLeaveAllocation(data);
  }

  getEmployeeLeaveAllocations(
    employeeId: string,
    orgId: string,
    asOfDate?: Date
  ): Promise<LeaveAllocation[]> {
    return LeaveAllocationService.getEmployeeLeaveAllocations(employeeId, orgId, asOfDate);
  }

  getLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    orgId: string,
    asOfDate?: Date
  ): Promise<LeaveBalance> {
    return LeaveAllocationService.getLeaveBalance(employeeId, leaveTypeId, orgId, asOfDate);
  }

  listLeaveAllocations(
    employeeId: string,
    options?: { leaveTypeId?: string; year?: number }
  ): Promise<LeaveAllocation[]> {
    return LeaveAllocationService.listLeaveAllocations(employeeId, options);
  }

  getAllLeaveBalances(employeeId: string, orgId: string): Promise<LeaveBalanceWithType[]> {
    return LeaveAllocationService.getAllLeaveBalances(employeeId, orgId);
  }

  allocateLeavesFromPolicy(
    orgId: string,
    leavePolicyId: string,
    fromDate: Date,
    toDate: Date,
    employeeIds?: string[]
  ): Promise<number> {
    return LeaveAllocationService.allocateLeavesFromPolicy(orgId, leavePolicyId, fromDate, toDate, employeeIds);
  }

  // Leave Application instance methods
  createLeaveApplication(data: CreateLeaveApplication): Promise<LeaveApplication> {
    return LeaveApplicationService.createLeaveApplication(data);
  }

  approveLeaveApplication(
    applicationId: string,
    orgId: string,
    approverId: string
  ): Promise<LeaveApplication> {
    return LeaveApplicationService.approveLeaveApplication(applicationId, orgId, approverId);
  }

  rejectLeaveApplication(
    applicationId: string,
    orgId: string,
    approverId: string,
    reason?: string
  ): Promise<LeaveApplication> {
    return LeaveApplicationService.rejectLeaveApplication(applicationId, orgId, approverId, reason);
  }

  cancelLeaveApplication(applicationId: string, orgId: string): Promise<LeaveApplication> {
    return LeaveApplicationService.cancelLeaveApplication(applicationId, orgId);
  }

  listLeaveApplications(
    orgId: string,
    options?: {
      employeeId?: string;
      status?: string;
      leaveTypeId?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ applications: LeaveApplication[]; total: number }> {
    return LeaveApplicationService.listLeaveApplications(orgId, options);
  }

  getLeaveApplicationById(id: string): Promise<LeaveApplication | null> {
    return LeaveApplicationService.getLeaveApplicationById(id);
  }

  getLeaveSummary(
    orgId: string,
    options?: { departmentId?: string; fromDate?: Date; toDate?: Date }
  ): Promise<LeaveSummary> {
    return LeaveApplicationService.getLeaveSummary(orgId, options);
  }

  // Attendance instance methods
  markAttendance(
    employeeId: string,
    orgId: string,
    attendanceDate: Date,
    status: AttendanceStatus,
    options?: {
      shiftId?: string;
      inTime?: Date;
      outTime?: Date;
      workingHours?: number;
      lateEntry?: boolean;
      earlyExit?: boolean;
      overtimeHours?: number;
      nightDiffHours?: number;
      leaveTypeId?: string;
      leaveApplicationId?: string;
    }
  ): Promise<Attendance> {
    return AttendanceService.markAttendance(employeeId, orgId, attendanceDate, status, options);
  }

  getEmployeeAttendance(
    employeeId: string,
    orgId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Attendance[]> {
    return AttendanceService.getEmployeeAttendance(employeeId, orgId, fromDate, toDate);
  }

  getAttendanceSummary(
    employeeId: string,
    orgId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<AttendanceSummary> {
    return AttendanceService.getAttendanceSummary(employeeId, orgId, fromDate, toDate);
  }

  // Holiday instance methods
  createHolidayList(
    orgId: string,
    listName: string,
    fromDate: Date,
    toDate: Date,
    isDefault?: boolean
  ): Promise<HolidayList> {
    return HolidayService.createHolidayList(orgId, listName, fromDate, toDate, isDefault);
  }

  addHoliday(
    holidayListId: string,
    holidayDate: Date,
    description: string,
    holidayType?: HolidayType,
    regularPayRate?: number,
    holidayPayRate?: number
  ): Promise<Holiday> {
    return HolidayService.addHoliday(holidayListId, holidayDate, description, holidayType, regularPayRate, holidayPayRate);
  }

  seedPhHolidays(orgId: string, year: number): Promise<HolidayList> {
    return HolidayService.seedPhHolidays(orgId, year);
  }

  getHolidays(holidayListId: string, fromDate: Date, toDate: Date): Promise<Holiday[]> {
    return HolidayService.getHolidays(holidayListId, fromDate, toDate);
  }

  // Shift instance methods
  createShiftType(
    orgId: string,
    shiftName: string,
    startTime: string,
    endTime: string,
    options?: {
      workingHours?: number;
      lateEntryGrace?: number;
      earlyExitGrace?: number;
      enableAutoAttendance?: boolean;
    }
  ): Promise<ShiftType> {
    return ShiftService.createShiftType(orgId, shiftName, startTime, endTime, options);
  }

  listShiftTypes(orgId: string): Promise<ShiftType[]> {
    return ShiftService.listShiftTypes(orgId);
  }
}

/**
 * Default instance for backwards compatibility with non-static usage
 */
export const leaveService = new LeaveService();
