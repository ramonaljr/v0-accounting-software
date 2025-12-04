/**
 * Attendance Service
 * Manages employee attendance tracking and summaries
 */

import { createClient } from '@/lib/supabase/server';
import type { Attendance, AttendanceStatus } from '@/lib/models/hr';
import { mapDbToAttendance } from './mappers';
import type { AttendanceSummary } from './types';

export class AttendanceService {
  /**
   * Mark attendance
   */
  static async markAttendance(
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
    const supabase = await createClient();

    const { data: attendance, error } = await supabase
      .from('attendance')
      .upsert(
        {
          org_id: orgId,
          employee_id: employeeId,
          attendance_date: attendanceDate.toISOString().split('T')[0],
          status: status,
          shift_id: options?.shiftId,
          in_time: options?.inTime?.toISOString(),
          out_time: options?.outTime?.toISOString(),
          working_hours: options?.workingHours || 0,
          late_entry: options?.lateEntry || false,
          early_exit: options?.earlyExit || false,
          overtime_hours: options?.overtimeHours || 0,
          night_diff_hours: options?.nightDiffHours || 0,
          leave_type_id: options?.leaveTypeId,
          leave_application_id: options?.leaveApplicationId,
          docstatus: 1,
        },
        { onConflict: 'employee_id,attendance_date' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark attendance: ${error.message}`);
    }

    return mapDbToAttendance(attendance);
  }

  /**
   * Get attendance for employee in date range
   */
  static async getEmployeeAttendance(
    employeeId: string,
    orgId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Attendance[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('org_id', orgId)
      .gte('attendance_date', fromDate.toISOString().split('T')[0])
      .lte('attendance_date', toDate.toISOString().split('T')[0])
      .order('attendance_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get attendance: ${error.message}`);
    }

    return (data || []).map(mapDbToAttendance);
  }

  /**
   * Get attendance summary for payroll
   */
  static async getAttendanceSummary(
    employeeId: string,
    orgId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<AttendanceSummary> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        status,
        working_hours,
        overtime_hours,
        night_diff_hours,
        late_entry,
        early_exit,
        leave_type:leave_types(is_lwp)
      `)
      .eq('employee_id', employeeId)
      .eq('org_id', orgId)
      .gte('attendance_date', fromDate.toISOString().split('T')[0])
      .lte('attendance_date', toDate.toISOString().split('T')[0]);

    if (error) {
      throw new Error(`Failed to get attendance summary: ${error.message}`);
    }

    const records = data || [];

    // Calculate total calendar days
    const totalDays = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let halfDays = 0;
    let wfhDays = 0;
    let lateEntries = 0;
    let earlyExits = 0;
    let totalWorkingHours = 0;
    let totalOvertimeHours = 0;
    let totalNightDiffHours = 0;
    let leaveWithoutPay = 0;

    for (const record of records) {
      switch (record.status) {
        case 'Present':
          presentDays++;
          break;
        case 'Absent':
          absentDays++;
          break;
        case 'On Leave':
          leaveDays++;
          // Handle both single object and array from Supabase join
          const leaveTypeData = Array.isArray(record.leave_type)
            ? record.leave_type[0]
            : record.leave_type;
          if (leaveTypeData?.is_lwp) {
            leaveWithoutPay++;
          }
          break;
        case 'Half Day':
          halfDays++;
          presentDays += 0.5;
          break;
        case 'Work From Home':
          wfhDays++;
          presentDays++;
          break;
      }

      if (record.late_entry) lateEntries++;
      if (record.early_exit) earlyExits++;

      totalWorkingHours += record.working_hours || 0;
      totalOvertimeHours += record.overtime_hours || 0;
      totalNightDiffHours += record.night_diff_hours || 0;
    }

    return {
      totalDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      wfhDays,
      lateEntries,
      earlyExits,
      totalWorkingHours,
      totalOvertimeHours,
      totalNightDiffHours,
      leaveWithoutPay,
    };
  }

  /**
   * Bulk mark attendance for multiple employees
   */
  static async bulkMarkAttendance(
    orgId: string,
    attendanceDate: Date,
    records: Array<{
      employeeId: string;
      status: AttendanceStatus;
      shiftId?: string;
      inTime?: Date;
      outTime?: Date;
      workingHours?: number;
    }>
  ): Promise<number> {
    const supabase = await createClient();
    let markedCount = 0;

    for (const record of records) {
      try {
        await supabase.from('attendance').upsert(
          {
            org_id: orgId,
            employee_id: record.employeeId,
            attendance_date: attendanceDate.toISOString().split('T')[0],
            status: record.status,
            shift_id: record.shiftId,
            in_time: record.inTime?.toISOString(),
            out_time: record.outTime?.toISOString(),
            working_hours: record.workingHours || 0,
            docstatus: 1,
          },
          { onConflict: 'employee_id,attendance_date' }
        );
        markedCount++;
      } catch (error) {
        console.error(`Failed to mark attendance for employee ${record.employeeId}: ${error}`);
      }
    }

    return markedCount;
  }

  /**
   * Get attendance for a specific date across organization
   */
  static async getOrgAttendanceByDate(
    orgId: string,
    attendanceDate: Date,
    options?: {
      departmentId?: string;
      branchId?: string;
    }
  ): Promise<Attendance[]> {
    const supabase = await createClient();

    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(first_name, last_name, department_id, branch_id)
      `)
      .eq('org_id', orgId)
      .eq('attendance_date', attendanceDate.toISOString().split('T')[0]);

    const { data, error } = await query.order('employee_id');

    if (error) {
      throw new Error(`Failed to get organization attendance: ${error.message}`);
    }

    // Filter by department/branch if specified
    let filteredData = data || [];
    if (options?.departmentId) {
      filteredData = filteredData.filter(
        (r) => (r as { employee?: { department_id?: string } }).employee?.department_id === options.departmentId
      );
    }
    if (options?.branchId) {
      filteredData = filteredData.filter(
        (r) => (r as { employee?: { branch_id?: string } }).employee?.branch_id === options.branchId
      );
    }

    return filteredData.map(mapDbToAttendance);
  }
}
