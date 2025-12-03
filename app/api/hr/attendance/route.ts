/**
 * Attendance API
 * REST endpoints for employee attendance management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const MarkAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  attendanceDate: z.string(),
  status: z.enum(['Present', 'Absent', 'Half Day', 'On Leave', 'Holiday', 'Work From Home']),
  inTime: z.string().optional(),
  outTime: z.string().optional(),
  workingHours: z.number().optional(),
  leaveApplicationId: z.string().uuid().optional(),
  leaveTypeId: z.string().uuid().optional(),
});

const BulkAttendanceSchema = z.object({
  entries: z.array(z.object({
    employeeId: z.string().uuid(),
    attendanceDate: z.string(),
    status: z.enum(['Present', 'Absent', 'Half Day', 'On Leave', 'Holiday', 'Work From Home']),
  })),
});

/**
 * GET /api/hr/attendance
 * Get attendance records
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!employeeId || !fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'employeeId, fromDate, and toDate are required' },
        { status: 400 }
      );
    }

    // Query attendance directly from supabase
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('attendance_date', fromDate)
      .lte('attendance_date', toDate)
      .order('attendance_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: attendance || [],
    });
  } catch (error) {
    console.error('[GET /api/hr/attendance] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get attendance' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/attendance
 * Mark attendance
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const bulk = searchParams.get('bulk') === 'true';

    if (bulk) {
      const validated = BulkAttendanceSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: validated.error.issues },
          { status: 400 }
        );
      }

      const results: { success: number; failed: { index: number; error: string }[] } = {
        success: 0,
        failed: [],
      };

      for (let i = 0; i < validated.data.entries.length; i++) {
        const entry = validated.data.entries[i];
        try {
          const { error } = await supabase
            .from('attendance')
            .upsert({
              org_id: membership.org_id,
              employee_id: entry.employeeId,
              attendance_date: entry.attendanceDate,
              status: entry.status,
            }, { onConflict: 'employee_id,attendance_date' });
          if (error) throw error;
          results.success++;
        } catch (error) {
          results.failed.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: results.failed.length === 0,
        data: results,
      });
    }

    // Single attendance
    const validated = MarkAttendanceSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { data: attendance, error } = await supabase
      .from('attendance')
      .upsert({
        org_id: membership.org_id,
        employee_id: validated.data.employeeId,
        attendance_date: validated.data.attendanceDate,
        status: validated.data.status,
        in_time: validated.data.inTime,
        out_time: validated.data.outTime,
        working_hours: validated.data.workingHours,
        leave_application_id: validated.data.leaveApplicationId,
        leave_type_id: validated.data.leaveTypeId,
      }, { onConflict: 'employee_id,attendance_date' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data: attendance }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/attendance] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
