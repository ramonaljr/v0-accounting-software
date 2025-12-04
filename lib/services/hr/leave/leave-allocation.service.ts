/**
 * Leave Allocation Service
 * Manages leave allocations and balances
 */

import { createClient } from '@/lib/supabase/server';
import type { LeaveAllocation, CreateLeaveAllocation } from '@/lib/models/hr';
import { mapDbToLeaveAllocation } from './mappers';
import { LeaveTypeService } from './leave-type.service';
import type { LeaveBalance, LeaveBalanceWithType } from './types';

export class LeaveAllocationService {
  /**
   * Create leave allocation for an employee
   */
  static async createLeaveAllocation(data: CreateLeaveAllocation): Promise<LeaveAllocation> {
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
        docstatus: 1,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create leave allocation: ${error.message}`);
    }

    return mapDbToLeaveAllocation(allocation);
  }

  /**
   * Get employee leave allocations
   */
  static async getEmployeeLeaveAllocations(
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
      ...mapDbToLeaveAllocation(a),
      leaveTypeName: a.leave_type?.leave_type_name,
    }));
  }

  /**
   * Get leave balance for employee
   */
  static async getLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    orgId: string,
    asOfDate?: Date
  ): Promise<LeaveBalance> {
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
   * List leave allocations for an employee
   */
  static async listLeaveAllocations(
    employeeId: string,
    options?: {
      leaveTypeId?: string;
      year?: number;
    }
  ): Promise<LeaveAllocation[]> {
    const supabase = await createClient();

    let query = supabase
      .from('leave_allocations')
      .select(`
        *,
        leave_type:leave_types(leave_type_name)
      `)
      .eq('employee_id', employeeId)
      .eq('docstatus', 1);

    if (options?.leaveTypeId) {
      query = query.eq('leave_type_id', options.leaveTypeId);
    }

    if (options?.year) {
      const startOfYear = new Date(options.year, 0, 1);
      const endOfYear = new Date(options.year, 11, 31);
      query = query
        .gte('from_date', startOfYear.toISOString())
        .lte('to_date', endOfYear.toISOString());
    }

    const { data, error } = await query.order('from_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to list leave allocations: ${error.message}`);
    }

    return (data || []).map((a) => ({
      ...mapDbToLeaveAllocation(a),
      leaveTypeName: a.leave_type?.leave_type_name,
    }));
  }

  /**
   * Get all leave balances for an employee
   */
  static async getAllLeaveBalances(
    employeeId: string,
    orgId: string
  ): Promise<LeaveBalanceWithType[]> {
    const leaveTypes = await LeaveTypeService.listLeaveTypes(orgId);
    const balances: LeaveBalanceWithType[] = [];

    for (const leaveType of leaveTypes) {
      const balance = await this.getLeaveBalance(
        employeeId,
        leaveType.id,
        orgId
      );
      balances.push({
        leaveTypeId: leaveType.id,
        leaveTypeName: leaveType.leaveTypeName,
        ...balance,
      });
    }

    return balances;
  }

  /**
   * Allocate leaves based on policy for all employees
   */
  static async allocateLeavesFromPolicy(
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

    // Get employees
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
            carryForwardLeaves: 0,
          });
          allocatedCount++;
        } catch (error) {
          console.error(`Failed to allocate leave for employee ${employee.id}: ${error}`);
        }
      }
    }

    return allocatedCount;
  }
}
