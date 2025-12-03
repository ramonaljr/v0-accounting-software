/**
 * Attendance API
 * REST endpoints for employee attendance management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { PayrollService } from '@/lib/services/hr/payroll.service';

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

    const attendance = await PayrollService.getAttendance(
      employeeId,
      new Date(fromDate),
      new Date(toDate)
    );

    return NextResponse.json({
      success: true,
      data: attendance,
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
          await PayrollService.markAttendance({
            orgId: membership.org_id,
            employeeId: entry.employeeId,
            attendanceDate: new Date(entry.attendanceDate),
            status: entry.status,
          });
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

    const attendance = await PayrollService.markAttendance({
      orgId: membership.org_id,
      employeeId: validated.data.employeeId,
      attendanceDate: new Date(validated.data.attendanceDate),
      status: validated.data.status,
      inTime: validated.data.inTime,
      outTime: validated.data.outTime,
      workingHours: validated.data.workingHours,
      leaveApplicationId: validated.data.leaveApplicationId,
      leaveTypeId: validated.data.leaveTypeId,
    });

    return NextResponse.json({ success: true, data: attendance }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/attendance] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
