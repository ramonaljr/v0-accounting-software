/**
 * Shift Service
 * Manages shift types and assignments
 */

import { createClient } from '@/lib/supabase/server';
import type { ShiftType } from '@/lib/models/hr';
import { mapDbToShiftType } from './mappers';

export class ShiftService {
  /**
   * Create shift type
   */
  static async createShiftType(
    orgId: string,
    shiftName: string,
    startTime: string,
    endTime: string,
    options?: {
      workingHours?: number;
      lateEntryGrace?: number;
      earlyExitGrace?: number;
      enableAutoAttendance?: boolean;
      breakDurationMinutes?: number;
      nightDiffStartTime?: string;
      nightDiffEndTime?: string;
      nightDiffRate?: number;
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
        break_duration_minutes: options?.breakDurationMinutes || 60,
        night_diff_start_time: options?.nightDiffStartTime || '22:00',
        night_diff_end_time: options?.nightDiffEndTime || '06:00',
        night_diff_rate: options?.nightDiffRate || 0.10,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shift type: ${error.message}`);
    }

    return mapDbToShiftType(shift);
  }

  /**
   * Get shift type by ID
   */
  static async getShiftTypeById(id: string): Promise<ShiftType | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('shift_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get shift type: ${error.message}`);
    }

    return mapDbToShiftType(data);
  }

  /**
   * List shift types
   */
  static async listShiftTypes(orgId: string): Promise<ShiftType[]> {
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

    return (data || []).map(mapDbToShiftType);
  }

  /**
   * Update shift type
   */
  static async updateShiftType(
    id: string,
    updates: {
      shiftName?: string;
      startTime?: string;
      endTime?: string;
      workingHours?: number;
      lateEntryGrace?: number;
      earlyExitGrace?: number;
      enableAutoAttendance?: boolean;
      breakDurationMinutes?: number;
      nightDiffStartTime?: string;
      nightDiffEndTime?: string;
      nightDiffRate?: number;
      isActive?: boolean;
    }
  ): Promise<ShiftType> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('shift_types')
      .update({
        shift_name: updates.shiftName,
        start_time: updates.startTime,
        end_time: updates.endTime,
        working_hours: updates.workingHours,
        late_entry_grace_period: updates.lateEntryGrace,
        early_exit_grace_period: updates.earlyExitGrace,
        enable_auto_attendance: updates.enableAutoAttendance,
        break_duration_minutes: updates.breakDurationMinutes,
        night_diff_start_time: updates.nightDiffStartTime,
        night_diff_end_time: updates.nightDiffEndTime,
        night_diff_rate: updates.nightDiffRate,
        is_active: updates.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update shift type: ${error.message}`);
    }

    return mapDbToShiftType(data);
  }

  /**
   * Delete shift type (soft delete by setting is_active to false)
   */
  static async deleteShiftType(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('shift_types')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete shift type: ${error.message}`);
    }
  }

  /**
   * Assign shift to employee
   */
  static async assignShiftToEmployee(
    employeeId: string,
    shiftTypeId: string,
    fromDate: Date,
    toDate?: Date
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('employee_shift_assignments')
      .upsert(
        {
          employee_id: employeeId,
          shift_type_id: shiftTypeId,
          from_date: fromDate.toISOString().split('T')[0],
          to_date: toDate?.toISOString().split('T')[0],
          is_active: true,
        },
        { onConflict: 'employee_id,from_date' }
      );

    if (error) {
      throw new Error(`Failed to assign shift to employee: ${error.message}`);
    }
  }

  /**
   * Get employee's current shift
   */
  static async getEmployeeShift(
    employeeId: string,
    asOfDate?: Date
  ): Promise<ShiftType | null> {
    const supabase = await createClient();
    const date = asOfDate || new Date();

    const { data, error } = await supabase
      .from('employee_shift_assignments')
      .select(`
        *,
        shift_type:shift_types(*)
      `)
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .lte('from_date', date.toISOString().split('T')[0])
      .or(`to_date.is.null,to_date.gte.${date.toISOString().split('T')[0]}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get employee shift: ${error.message}`);
    }

    if (!data?.shift_type) {
      return null;
    }

    return mapDbToShiftType(data.shift_type as Record<string, unknown>);
  }

  /**
   * Calculate expected working hours for a shift
   */
  static calculateExpectedHours(shift: ShiftType): number {
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);

    let hours = endHour - startHour;
    let minutes = endMin - startMin;

    if (hours < 0) {
      hours += 24; // Overnight shift
    }

    const totalMinutes = hours * 60 + minutes - shift.breakDurationMinutes;
    return totalMinutes / 60;
  }

  /**
   * Check if a time falls within night differential hours
   */
  static isNightDiffTime(shift: ShiftType, time: Date): boolean {
    const timeStr = time.toTimeString().slice(0, 5);
    const nightStart = shift.nightDiffStartTime;
    const nightEnd = shift.nightDiffEndTime;

    // Handle overnight night diff (e.g., 22:00 to 06:00)
    if (nightStart > nightEnd) {
      return timeStr >= nightStart || timeStr < nightEnd;
    }

    return timeStr >= nightStart && timeStr < nightEnd;
  }
}
