/**
 * Leave Application Service
 * Manages leave applications and approval workflow
 */

import { createClient } from '@/lib/supabase/server';
import type { LeaveApplication, CreateLeaveApplication } from '@/lib/models/hr';
import { mapDbToLeaveApplication } from './mappers';
import { LeaveAllocationService } from './leave-allocation.service';
import type { LeaveSummary } from './types';

export class LeaveApplicationService {
  /**
   * Calculate leave days between dates
   */
  private static calculateLeaveDays(fromDate: Date, toDate: Date, halfDay: boolean = false): number {
    const days = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    return halfDay ? days - 0.5 : days;
  }

  /**
   * Create attendance records for approved leave
   */
  private static async createLeaveAttendanceRecords(
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

  /**
   * Create leave application
   */
  static async createLeaveApplication(data: CreateLeaveApplication): Promise<LeaveApplication> {
    const supabase = await createClient();

    // Calculate total leave days
    const totalDays = this.calculateLeaveDays(data.fromDate, data.toDate, data.halfDay);

    // Check balance
    const balance = await LeaveAllocationService.getLeaveBalance(
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

    return mapDbToLeaveApplication(application);
  }

  /**
   * Approve leave application
   */
  static async approveLeaveApplication(
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

    return mapDbToLeaveApplication(updated);
  }

  /**
   * Reject leave application
   */
  static async rejectLeaveApplication(
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

    return mapDbToLeaveApplication(updated);
  }

  /**
   * Cancel leave application
   */
  static async cancelLeaveApplication(
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

    return mapDbToLeaveApplication(updated);
  }

  /**
   * List leave applications
   */
  static async listLeaveApplications(
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

    interface LeaveAppRow {
      employee?: { first_name: string; last_name: string };
      leave_type?: { leave_type_name: string };
    }

    const applications = (data || []).map((app) => ({
      ...mapDbToLeaveApplication(app),
      employeeName: (app as LeaveAppRow).employee
        ? `${(app as LeaveAppRow).employee!.first_name} ${(app as LeaveAppRow).employee!.last_name}`
        : undefined,
      leaveTypeName: (app as LeaveAppRow).leave_type?.leave_type_name,
    }));

    return { applications, total: count || 0 };
  }

  /**
   * Get leave application by ID
   */
  static async getLeaveApplicationById(id: string): Promise<LeaveApplication | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        employee:employees(first_name, last_name),
        leave_type:leave_types(leave_type_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get leave application: ${error.message}`);
    }

    interface LeaveAppRow {
      employee?: { first_name: string; last_name: string };
      leave_type?: { leave_type_name: string };
    }

    return {
      ...mapDbToLeaveApplication(data),
      employeeName: (data as LeaveAppRow).employee
        ? `${(data as LeaveAppRow).employee!.first_name} ${(data as LeaveAppRow).employee!.last_name}`
        : undefined,
      leaveTypeName: (data as LeaveAppRow).leave_type?.leave_type_name,
    };
  }

  /**
   * Get leave summary for an organization
   */
  static async getLeaveSummary(
    orgId: string,
    options?: {
      departmentId?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<LeaveSummary> {
    const supabase = await createClient();
    const fromDate = options?.fromDate || new Date(new Date().getFullYear(), 0, 1);
    const toDate = options?.toDate || new Date();

    // Get application counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('leave_applications')
      .select('status')
      .eq('org_id', orgId)
      .gte('from_date', fromDate.toISOString())
      .lte('to_date', toDate.toISOString());

    if (statusError) {
      throw new Error(`Failed to get leave summary: ${statusError.message}`);
    }

    const applications = statusCounts || [];
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => a.status === 'Pending').length;
    const approvedApplications = applications.filter(a => a.status === 'Approved').length;
    const rejectedApplications = applications.filter(a => a.status === 'Rejected').length;

    // Get counts by leave type
    const { data: leaveTypeCounts, error: typeError } = await supabase
      .from('leave_applications')
      .select(`
        leave_type_id,
        leave_type:leave_types(leave_type_name)
      `)
      .eq('org_id', orgId)
      .gte('from_date', fromDate.toISOString())
      .lte('to_date', toDate.toISOString());

    if (typeError) {
      throw new Error(`Failed to get leave type counts: ${typeError.message}`);
    }

    // Aggregate by leave type
    const typeMap = new Map<string, { leaveTypeId: string; leaveTypeName: string; count: number }>();
    for (const app of leaveTypeCounts || []) {
      const existing = typeMap.get(app.leave_type_id);
      if (existing) {
        existing.count++;
      } else {
        typeMap.set(app.leave_type_id, {
          leaveTypeId: app.leave_type_id,
          leaveTypeName: (app.leave_type as { leave_type_name?: string })?.leave_type_name || 'Unknown',
          count: 1,
        });
      }
    }

    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      byLeaveType: Array.from(typeMap.values()),
    };
  }
}
