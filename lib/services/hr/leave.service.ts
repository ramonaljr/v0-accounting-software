/**
 * Leave and Attendance Service
 * Handles leave management, attendance tracking, and holiday lists
 * Based on ERPNext's HR module with PH compliance
 */

import { createClient } from '@/lib/supabase/server';
import {
  LeaveType,
  LeavePolicy,
  LeaveAllocation,
  LeaveApplication,
  ShiftType,
  Attendance,
  HolidayList,
  Holiday,
  CreateLeaveType,
  CreateLeaveAllocation,
  CreateLeaveApplication,
  PH_MANDATORY_LEAVE_TYPES,
} from '@/lib/models/hr';

export class LeaveService {
  // ==================== LEAVE TYPES ====================

  /**
   * Create a leave type
   */
  async createLeaveType(data: CreateLeaveType): Promise<LeaveType> {
    const supabase = await createClient();

    const { data: leaveType, error } = await supabase
      .from('leave_types')
      .insert({
        org_id: data.orgId,
        leave_type_name: data.leaveTypeName,
        max_leaves_allowed: data.maxLeavesAllowed,
        applicable_after: data.applicableAfter || 0,
        max_continuous_days: data.maxContinuousDays,
        is_carry_forward: data.isCarryForward || false,
        max_carry_forward_days: data.maxCarryForwardDays,
        is_lwp: data.isLwp || false,
        is_optional: data.isOptional || false,
        allow_negative: data.allowNegative || false,
        include_holidays: data.includeHolidays || false,
        is_compensatory: data.isCompensatory || false,
        is_sick_leave: data.isSickLeave || false,
        is_earned_leave: data.isEarnedLeave || false,
        earning_component: data.earningComponent,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create leave type: ${error.message}`);
    }

    return this.mapLeaveType(leaveType);
  }

  /**
   * List leave types for organization
   */
  async listLeaveTypes(orgId: string): Promise<LeaveType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('leave_type_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list leave types: ${error.message}`);
    }

    return (data || []).map(this.mapLeaveType);
  }

  /**
   * Seed PH mandatory leave types
   */
  async seedPhLeaveTypes(orgId: string): Promise<void> {
    const supabase = await createClient();

    for (const leaveType of PH_MANDATORY_LEAVE_TYPES) {
      const { error } = await supabase
        .from('leave_types')
        .upsert(
          {
            org_id: orgId,
            leave_type_name: leaveType.name,
            max_leaves_allowed: leaveType.days,
            is_lwp: false,
            is_active: true,
          },
          { onConflict: 'org_id,leave_type_name' }
        );

      if (error) {
        console.error(`Failed to seed leave type ${leaveType.name}: ${error.message}`);
      }
    }
  }

  // ==================== LEAVE POLICIES ====================

  /**
   * Create a leave policy
   */
  async createLeavePolicy(
    orgId: string,
    policyName: string,
    leaveAllocations: Array<{ leaveTypeId: string; annualAllocation: number }>
  ): Promise<LeavePolicy> {
    const supabase = await createClient();

    // Create policy
    const { data: policy, error: policyError } = await supabase
      .from('leave_policies')
      .insert({
        org_id: orgId,
        policy_name: policyName,
      })
      .select()
      .single();

    if (policyError) {
      throw new Error(`Failed to create leave policy: ${policyError.message}`);
    }

    // Create policy details
    for (const allocation of leaveAllocations) {
      await supabase.from('leave_policy_details').insert({
        leave_policy_id: policy.id,
        leave_type_id: allocation.leaveTypeId,
        annual_allocation: allocation.annualAllocation,
      });
    }

    return {
      id: policy.id,
      orgId: policy.org_id,
      policyName: policy.policy_name,
      isActive: policy.is_active,
      createdAt: new Date(policy.created_at),
    };
  }

  /**
   * List leave policies
   */
  async listLeavePolicies(orgId: string): Promise<LeavePolicy[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('leave_policies')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('policy_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list leave policies: ${error.message}`);
    }

    return (data || []).map((p) => ({
      id: p.id,
      orgId: p.org_id,
      policyName: p.policy_name,
      isActive: p.is_active,
      createdAt: new Date(p.created_at),
    }));
  }

  // ==================== LEAVE ALLOCATIONS ====================

  /**
   * Create leave allocation for an employee
   */
  async createLeaveAllocation(data: CreateLeaveAllocation): Promise<LeaveAllocation> {
    const supabase = await createClient();

    const { data: allocation, error } = await supabase
      .from('leave_allocations')
      .insert({
        org_id: data.orgId,
        employee_id: data.employeeId,
        leave_type_id: data.leaveTypeId,
        from_date: data.fromDate,
        to_date: data.toDate,
        new_leaves_allocated: data.newLeavesAllocated,
        carry_forward_leaves: data.carryForwardLeaves || 0,
        total_leaves_allocated: data.newLeavesAllocated + (data.carryForwardLeaves || 0),
        leave_policy_id: data.leavePolicyId,
        docstatus: 1,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create leave allocation: ${error.message}`);
    }

    return this.mapLeaveAllocation(allocation);
  }

  /**
   * Get employee leave allocations
   */
  async getEmployeeLeaveAllocations(
    employeeId: string,
    orgId: string,
    asOfDate?: Date
  ): Promise<LeaveAllocation[]> {
    const supabase = await createClient();
    const date = asOfDate || new Date();

    const { data, error } = await supabase
      .from('leave_allocations')
      .select(`
        *,
        leave_type:leave_types(leave_type_name)
      `)
      .eq('employee_id', employeeId)
      .eq('org_id', orgId)
      .eq('docstatus', 1)
      .lte('from_date', date.toISOString())
      .gte('to_date', date.toISOString());

    if (error) {
      throw new Error(`Failed to get leave allocations: ${error.message}`);
    }

    return (data || []).map((a) => ({
      ...this.mapLeaveAllocation(a),
      leaveTypeName: a.leave_type?.leave_type_name,
    }));
  }

  /**
   * Get leave balance for employee
   */
  async getLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    orgId: string,
    asOfDate?: Date
  ): Promise<{
    allocated: number;
    used: number;
    pending: number;
    balance: number;
  }> {
    const supabase = await createClient();
    const date = asOfDate || new Date();

    // Get allocation
    const { data: allocation } = await supabase
      .from('leave_allocations')
      .select('total_leaves_allocated, leaves_taken')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('org_id', orgId)
      .eq('docstatus', 1)
      .lte('from_date', date.toISOString())
      .gte('to_date', date.toISOString())
      .single();

    const allocated = allocation?.total_leaves_allocated || 0;
    const used = allocation?.leaves_taken || 0;

    // Get pending leave applications
    const { count: pendingCount } = await supabase
      .from('leave_applications')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('org_id', orgId)
      .eq('status', 'Pending')
      .lte('from_date', date.toISOString())
      .gte('to_date', date.toISOString());

    const pending = pendingCount || 0;

    return {
      allocated,
      used,
      pending,
      balance: allocated - used - pending,
    };
  }

  /**
   * Allocate leaves based on policy for all employees
   */
  async allocateLeavesFromPolicy(
    orgId: string,
    leavePolicyId: string,
    fromDate: Date,
    toDate: Date,
    employeeIds?: string[]
  ): Promise<number> {
    const supabase = await createClient();

    // Get policy details
    const { data: policyDetails, error: policyError } = await supabase
      .from('leave_policy_details')
      .select('*')
      .eq('leave_policy_id', leavePolicyId);

    if (policyError || !policyDetails) {
      throw new Error('Failed to get leave policy details');
    }

    // Get employees (either specific or all active)
    let employeeQuery = supabase
      .from('employees')
      .select('id')
      .eq('org_id', orgId)
      .eq('status', 'Active');

    if (employeeIds && employeeIds.length > 0) {
      employeeQuery = employeeQuery.in('id', employeeIds);
    }

    const { data: employees, error: empError } = await employeeQuery;

    if (empError || !employees) {
      throw new Error('Failed to get employees');
    }

    let allocatedCount = 0;

    // Create allocations for each employee and leave type
    for (const employee of employees) {
      for (const detail of policyDetails) {
        try {
          await this.createLeaveAllocation({
            orgId,
            employeeId: employee.id,
            leaveTypeId: detail.leave_type_id,
            fromDate,
            toDate,
            newLeavesAllocated: detail.annual_allocation,
            leavePolicyId,
          });
          allocatedCount++;
        } catch (error) {
          console.error(`Failed to allocate leave for employee ${employee.id}: ${error}`);
        }
      }
    }

    return allocatedCount;
  }

  // ==================== LEAVE APPLICATIONS ====================

  /**
   * Create leave application
   */
  async createLeaveApplication(data: CreateLeaveApplication): Promise<LeaveApplication> {
    const supabase = await createClient();

    // Calculate total leave days
    const totalDays = this.calculateLeaveDays(data.fromDate, data.toDate, data.halfDay);

    // Check balance
    const balance = await this.getLeaveBalance(
      data.employeeId,
      data.leaveTypeId,
      data.orgId
    );

    // Get leave type to check if negative allowed
    const { data: leaveType } = await supabase
      .from('leave_types')
      .select('allow_negative, is_lwp')
      .eq('id', data.leaveTypeId)
      .single();

    if (!leaveType?.is_lwp && !leaveType?.allow_negative && balance.balance < totalDays) {
      throw new Error(
        `Insufficient leave balance. Available: ${balance.balance}, Requested: ${totalDays}`
      );
    }

    const { data: application, error } = await supabase
      .from('leave_applications')
      .insert({
        org_id: data.orgId,
        employee_id: data.employeeId,
        leave_type_id: data.leaveTypeId,
        from_date: data.fromDate,
        to_date: data.toDate,
        half_day: data.halfDay || false,
        half_day_date: data.halfDayDate,
        total_leave_days: totalDays,
        reason: data.reason,
        leave_approver_id: data.leaveApproverId,
        status: 'Pending',
        docstatus: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create leave application: ${error.message}`);
    }

    return this.mapLeaveApplication(application);
  }

  /**
   * Approve leave application
   */
  async approveLeaveApplication(
    applicationId: string,
    orgId: string,
    approverId: string
  ): Promise<LeaveApplication> {
    const supabase = await createClient();

    // Get application
    const { data: application, error: getError } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('org_id', orgId)
      .single();

    if (getError || !application) {
      throw new Error('Leave application not found');
    }

    if (application.status !== 'Pending') {
      throw new Error('Only pending applications can be approved');
    }

    // Update application status
    const { data: updated, error: updateError } = await supabase
      .from('leave_applications')
      .update({
        status: 'Approved',
        docstatus: 1,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to approve leave application: ${updateError.message}`);
    }

    // Update leave allocation - deduct leaves
    await supabase.rpc('increment_leaves_taken', {
      p_employee_id: application.employee_id,
      p_leave_type_id: application.leave_type_id,
      p_days: application.total_leave_days,
    });

    // Create attendance records for leave days
    await this.createLeaveAttendanceRecords(
      application.employee_id,
      application.org_id,
      new Date(application.from_date),
      new Date(application.to_date),
      application.leave_type_id,
      application.half_day,
      application.half_day_date ? new Date(application.half_day_date) : undefined
    );

    return this.mapLeaveApplication(updated);
  }

  /**
   * Reject leave application
   */
  async rejectLeaveApplication(
    applicationId: string,
    orgId: string,
    approverId: string,
    reason?: string
  ): Promise<LeaveApplication> {
    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from('leave_applications')
      .update({
        status: 'Rejected',
        docstatus: 1,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('org_id', orgId)
      .eq('status', 'Pending')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reject leave application: ${error.message}`);
    }

    return this.mapLeaveApplication(updated);
  }

  /**
   * Cancel leave application
   */
  async cancelLeaveApplication(
    applicationId: string,
    orgId: string
  ): Promise<LeaveApplication> {
    const supabase = await createClient();

    // Get application
    const { data: application, error: getError } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('org_id', orgId)
      .single();

    if (getError || !application) {
      throw new Error('Leave application not found');
    }

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from('leave_applications')
      .update({
        status: 'Cancelled',
        docstatus: 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to cancel leave application: ${updateError.message}`);
    }

    // If was approved, restore leave balance
    if (application.status === 'Approved') {
      await supabase.rpc('increment_leaves_taken', {
        p_employee_id: application.employee_id,
        p_leave_type_id: application.leave_type_id,
        p_days: -application.total_leave_days,
      });

      // Remove attendance records
      await supabase
        .from('attendance')
        .delete()
        .eq('employee_id', application.employee_id)
        .eq('leave_application_id', applicationId);
    }

    return this.mapLeaveApplication(updated);
  }

  /**
   * List leave applications
   */
  async listLeaveApplications(
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
    const supabase = await createClient();

    let query = supabase
      .from('leave_applications')
      .select(`
        *,
        employee:employees(first_name, last_name),
        leave_type:leave_types(leave_type_name)
      `, { count: 'exact' })
      .eq('org_id', orgId);

    if (options?.employeeId) {
      query = query.eq('employee_id', options.employeeId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.leaveTypeId) {
      query = query.eq('leave_type_id', options.leaveTypeId);
    }
    if (options?.fromDate) {
      query = query.gte('from_date', options.fromDate.toISOString());
    }
    if (options?.toDate) {
      query = query.lte('to_date', options.toDate.toISOString());
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list leave applications: ${error.message}`);
    }

    const applications = (data || []).map((app) => ({
      ...this.mapLeaveApplication(app),
      employeeName: app.employee
        ? `${app.employee.first_name} ${app.employee.last_name}`
        : undefined,
      leaveTypeName: app.leave_type?.leave_type_name,
    }));

    return { applications, total: count || 0 };
  }

  // ==================== ATTENDANCE ====================

  /**
   * Mark attendance
   */
  async markAttendance(
    employeeId: string,
    orgId: string,
    attendanceDate: Date,
    status: 'Present' | 'Absent' | 'On Leave' | 'Half Day' | 'Work From Home',
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

    return this.mapAttendance(attendance);
  }

  /**
   * Get attendance for employee in date range
   */
  async getEmployeeAttendance(
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

    return (data || []).map(this.mapAttendance);
  }

  /**
   * Get attendance summary for payroll
   */
  async getAttendanceSummary(
    employeeId: string,
    orgId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
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
  }> {
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
          if (record.leave_type?.is_lwp) {
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

  // ==================== SHIFTS ====================

  /**
   * Create shift type
   */
  async createShiftType(
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
    const supabase = await createClient();

    const { data: shift, error } = await supabase
      .from('shift_types')
      .insert({
        org_id: orgId,
        shift_name: shiftName,
        start_time: startTime,
        end_time: endTime,
        working_hours: options?.workingHours || 8,
        late_entry_grace_period: options?.lateEntryGrace || 0,
        early_exit_grace_period: options?.earlyExitGrace || 0,
        enable_auto_attendance: options?.enableAutoAttendance || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shift type: ${error.message}`);
    }

    return this.mapShiftType(shift);
  }

  /**
   * List shift types
   */
  async listShiftTypes(orgId: string): Promise<ShiftType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('shift_types')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('shift_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list shift types: ${error.message}`);
    }

    return (data || []).map(this.mapShiftType);
  }

  // ==================== HOLIDAYS ====================

  /**
   * Create holiday list
   */
  async createHolidayList(
    orgId: string,
    holidayListName: string,
    fromDate: Date,
    toDate: Date,
    weeklyOff?: string
  ): Promise<HolidayList> {
    const supabase = await createClient();

    const { data: list, error } = await supabase
      .from('holiday_lists')
      .insert({
        org_id: orgId,
        holiday_list_name: holidayListName,
        from_date: fromDate,
        to_date: toDate,
        weekly_off: weeklyOff || 'Sunday',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create holiday list: ${error.message}`);
    }

    return {
      id: list.id,
      orgId: list.org_id,
      holidayListName: list.holiday_list_name,
      fromDate: new Date(list.from_date),
      toDate: new Date(list.to_date),
      weeklyOff: list.weekly_off,
      isActive: list.is_active,
      createdAt: new Date(list.created_at),
    };
  }

  /**
   * Add holiday to list
   */
  async addHoliday(
    holidayListId: string,
    holidayDate: Date,
    description: string,
    isOptional: boolean = false
  ): Promise<Holiday> {
    const supabase = await createClient();

    const { data: holiday, error } = await supabase
      .from('holidays')
      .insert({
        holiday_list_id: holidayListId,
        holiday_date: holidayDate,
        description: description,
        is_optional: isOptional,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add holiday: ${error.message}`);
    }

    return {
      id: holiday.id,
      holidayListId: holiday.holiday_list_id,
      holidayDate: new Date(holiday.holiday_date),
      description: holiday.description,
      isOptional: holiday.is_optional,
      createdAt: new Date(holiday.created_at),
    };
  }

  /**
   * Seed PH regular holidays for a year
   */
  async seedPhHolidays(orgId: string, year: number): Promise<HolidayList> {
    // Create holiday list for the year
    const holidayList = await this.createHolidayList(
      orgId,
      `PH Holidays ${year}`,
      new Date(year, 0, 1),
      new Date(year, 11, 31),
      'Sunday'
    );

    // PH Regular Holidays
    const phHolidays = [
      { date: new Date(year, 0, 1), name: "New Year's Day" },
      { date: new Date(year, 3, 9), name: 'Araw ng Kagitingan (Day of Valor)' },
      { date: new Date(year, 4, 1), name: 'Labor Day' },
      { date: new Date(year, 5, 12), name: 'Independence Day' },
      { date: new Date(year, 7, 21), name: "Ninoy Aquino Day" },
      { date: new Date(year, 7, 26), name: 'National Heroes Day' },
      { date: new Date(year, 10, 30), name: 'Bonifacio Day' },
      { date: new Date(year, 11, 25), name: 'Christmas Day' },
      { date: new Date(year, 11, 30), name: 'Rizal Day' },
    ];

    // Special Non-Working Holidays
    const specialHolidays = [
      { date: new Date(year, 1, 25), name: 'EDSA People Power Revolution Anniversary' },
      { date: new Date(year, 7, 21), name: "Ninoy Aquino Day" },
      { date: new Date(year, 10, 1), name: "All Saints' Day" },
      { date: new Date(year, 10, 2), name: "All Souls' Day" },
      { date: new Date(year, 11, 8), name: 'Feast of the Immaculate Conception' },
      { date: new Date(year, 11, 24), name: 'Christmas Eve' },
      { date: new Date(year, 11, 31), name: "New Year's Eve" },
    ];

    // Add regular holidays
    for (const holiday of phHolidays) {
      await this.addHoliday(holidayList.id, holiday.date, holiday.name, false);
    }

    // Add special holidays
    for (const holiday of specialHolidays) {
      await this.addHoliday(holidayList.id, holiday.date, `${holiday.name} (Special)`, true);
    }

    return holidayList;
  }

  /**
   * Get holidays for date range
   */
  async getHolidays(
    holidayListId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Holiday[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('holiday_list_id', holidayListId)
      .gte('holiday_date', fromDate.toISOString().split('T')[0])
      .lte('holiday_date', toDate.toISOString().split('T')[0])
      .order('holiday_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get holidays: ${error.message}`);
    }

    return (data || []).map((h) => ({
      id: h.id,
      holidayListId: h.holiday_list_id,
      holidayDate: new Date(h.holiday_date),
      description: h.description,
      isOptional: h.is_optional,
      createdAt: new Date(h.created_at),
    }));
  }

  // ==================== HELPER METHODS ====================

  /**
   * Calculate leave days between dates
   */
  private calculateLeaveDays(fromDate: Date, toDate: Date, halfDay: boolean = false): number {
    const days = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    return halfDay ? days - 0.5 : days;
  }

  /**
   * Create attendance records for approved leave
   */
  private async createLeaveAttendanceRecords(
    employeeId: string,
    orgId: string,
    fromDate: Date,
    toDate: Date,
    leaveTypeId: string,
    halfDay: boolean,
    halfDayDate?: Date
  ): Promise<void> {
    const supabase = await createClient();
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      const isHalfDayDate =
        halfDay && halfDayDate &&
        currentDate.toDateString() === halfDayDate.toDateString();

      await supabase.from('attendance').upsert(
        {
          org_id: orgId,
          employee_id: employeeId,
          attendance_date: currentDate.toISOString().split('T')[0],
          status: isHalfDayDate ? 'Half Day' : 'On Leave',
          leave_type_id: leaveTypeId,
          docstatus: 1,
        },
        { onConflict: 'employee_id,attendance_date' }
      );

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private mapLeaveType(data: Record<string, unknown>): LeaveType {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      leaveTypeName: data.leave_type_name as string,
      maxLeavesAllowed: data.max_leaves_allowed as number,
      applicableAfter: data.applicable_after as number,
      maxContinuousDays: data.max_continuous_days as number | undefined,
      isCarryForward: data.is_carry_forward as boolean,
      maxCarryForwardDays: data.max_carry_forward_days as number | undefined,
      isLwp: data.is_lwp as boolean,
      isOptional: data.is_optional as boolean,
      allowNegative: data.allow_negative as boolean,
      includeHolidays: data.include_holidays as boolean,
      isCompensatory: data.is_compensatory as boolean,
      isSickLeave: data.is_sick_leave as boolean,
      isEarnedLeave: data.is_earned_leave as boolean,
      earningComponent: data.earning_component as string | undefined,
      isActive: data.is_active as boolean,
      createdAt: new Date(data.created_at as string),
    };
  }

  private mapLeaveAllocation(data: Record<string, unknown>): LeaveAllocation {
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
      leavesTaken: data.leaves_taken as number,
      leavePolicyId: data.leave_policy_id as string | undefined,
      docstatus: data.docstatus as number,
      createdAt: new Date(data.created_at as string),
    };
  }

  private mapLeaveApplication(data: Record<string, unknown>): LeaveApplication {
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
      status: data.status as 'Pending' | 'Approved' | 'Rejected' | 'Cancelled',
      docstatus: data.docstatus as number,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapAttendance(data: Record<string, unknown>): Attendance {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      employeeId: data.employee_id as string,
      attendanceDate: new Date(data.attendance_date as string),
      status: data.status as 'Present' | 'Absent' | 'On Leave' | 'Half Day' | 'Work From Home',
      shiftId: data.shift_id as string | undefined,
      inTime: data.in_time ? new Date(data.in_time as string) : undefined,
      outTime: data.out_time ? new Date(data.out_time as string) : undefined,
      workingHours: data.working_hours as number,
      lateEntry: data.late_entry as boolean,
      earlyExit: data.early_exit as boolean,
      overtimeHours: data.overtime_hours as number,
      nightDiffHours: data.night_diff_hours as number,
      leaveTypeId: data.leave_type_id as string | undefined,
      leaveApplicationId: data.leave_application_id as string | undefined,
      docstatus: data.docstatus as number,
      createdAt: new Date(data.created_at as string),
    };
  }

  private mapShiftType(data: Record<string, unknown>): ShiftType {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      shiftName: data.shift_name as string,
      startTime: data.start_time as string,
      endTime: data.end_time as string,
      workingHours: data.working_hours as number,
      lateEntryGracePeriod: data.late_entry_grace_period as number,
      earlyExitGracePeriod: data.early_exit_grace_period as number,
      enableAutoAttendance: data.enable_auto_attendance as boolean,
      isActive: data.is_active as boolean,
      createdAt: new Date(data.created_at as string),
    };
  }
}

export const leaveService = new LeaveService();
