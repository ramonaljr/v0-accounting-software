/**
 * Leave Type Service
 * Manages leave types and policies
 */

import { createClient } from '@/lib/supabase/server';
import type {
  LeaveType,
  LeavePolicy,
  CreateLeaveType,
} from '@/lib/models/hr';
import { PH_MANDATORY_LEAVE_TYPES } from '@/lib/models/hr';
import { mapDbToLeaveType } from './mappers';

export class LeaveTypeService {
  /**
   * Create a leave type
   */
  static async createLeaveType(data: CreateLeaveType): Promise<LeaveType> {
    const supabase = await createClient();

    const { data: leaveType, error } = await supabase
      .from('leave_types')
      .insert({
        org_id: data.orgId,
        leave_type_name: data.leaveTypeName,
        max_leaves_allowed: data.maxLeavesAllowed,
        max_continuous_days: data.maxContinuousDaysAllowed,
        is_carry_forward: data.isCarryForward,
        max_carry_forward_days: data.maxCarryForwardDays,
        carry_forward_expiry_days: data.carryForwardExpiryDays,
        is_lwp: data.isLwp,
        is_paid_leave: data.isPaidLeave,
        include_holiday_within_leave_as_leave: data.includeHolidayWithinLeaveAsLeave,
        is_compensatory: data.isCompensatory,
        allow_encashment: data.allowEncashment,
        encashment_threshold_days: data.encashmentThresholdDays,
        earning_component_id: data.earningComponentId,
        applicable_after_days: data.applicableAfterDays,
        is_service_incentive_leave: data.isServiceIncentiveLeave,
        is_maternity_leave: data.isMaternityLeave,
        is_paternity_leave: data.isPaternityLeave,
        is_solo_parent_leave: data.isSoloParentLeave,
        is_vawc_leave: data.isVawcLeave,
        is_magna_carta_leave: data.isMagnaCartaLeave,
        requires_attachment: data.requiresAttachment,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create leave type: ${error.message}`);
    }

    return mapDbToLeaveType(leaveType);
  }

  /**
   * Get a leave type by ID
   */
  static async getLeaveTypeById(id: string, orgId: string): Promise<LeaveType | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get leave type: ${error.message}`);
    }

    return mapDbToLeaveType(data);
  }

  /**
   * List leave types for organization
   */
  static async listLeaveTypes(orgId: string): Promise<LeaveType[]> {
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

    return (data || []).map(mapDbToLeaveType);
  }

  /**
   * Seed PH mandatory leave types
   */
  static async seedPhLeaveTypes(orgId: string): Promise<void> {
    const supabase = await createClient();

    for (const leaveType of PH_MANDATORY_LEAVE_TYPES) {
      const { error } = await supabase
        .from('leave_types')
        .upsert(
          {
            org_id: orgId,
            leave_type_name: leaveType.leaveTypeName,
            max_leaves_allowed: leaveType.maxLeavesAllowed,
            is_lwp: false,
            is_paid_leave: leaveType.isPaidLeave,
            is_service_incentive_leave: leaveType.isServiceIncentiveLeave || false,
            is_maternity_leave: leaveType.isMaternityLeave || false,
            is_paternity_leave: leaveType.isPaternityLeave || false,
            is_solo_parent_leave: leaveType.isSoloParentLeave || false,
            is_vawc_leave: leaveType.isVawcLeave || false,
            is_magna_carta_leave: leaveType.isMagnaCartaLeave || false,
            requires_attachment: leaveType.requiresAttachment || false,
            applicable_after_days: leaveType.applicableAfterDays || 0,
            is_active: true,
          },
          { onConflict: 'org_id,leave_type_name' }
        );

      if (error) {
        console.error(`Failed to seed leave type ${leaveType.leaveTypeName}: ${error.message}`);
      }
    }
  }

  /**
   * Create a leave policy
   */
  static async createLeavePolicy(
    orgId: string,
    policyName: string,
    leaveAllocations: Array<{ leaveTypeId: string; annualAllocation: number }>
  ): Promise<LeavePolicy> {
    const supabase = await createClient();

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
  static async listLeavePolicies(orgId: string): Promise<LeavePolicy[]> {
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
}
