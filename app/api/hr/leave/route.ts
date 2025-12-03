/**
 * HR Leave API
 * REST endpoints for leave management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { LeaveService } from '@/lib/services/hr/leave.service';

const CreateLeaveApplicationSchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  fromDate: z.string(),
  toDate: z.string(),
  halfDay: z.boolean().optional(),
  halfDayDate: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * GET /api/hr/leave
 * List leave applications
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
    const options = {
      employeeId: searchParams.get('employeeId') || undefined,
      leaveTypeId: searchParams.get('leaveTypeId') || undefined,
      status: searchParams.get('status') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const leaveService = new LeaveService();
    const result = await leaveService.listLeaveApplications(membership.org_id, options);

    return NextResponse.json({
      success: true,
      data: result.applications,
      total: result.total,
    });
  } catch (error) {
    console.error('[GET /api/hr/leave] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list leave applications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/leave
 * Create a leave application
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
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = CreateLeaveApplicationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const leaveService = new LeaveService();
    const application = await leaveService.createLeaveApplication({
      orgId: membership.org_id,
      ...validated.data,
      fromDate: new Date(validated.data.fromDate),
      toDate: new Date(validated.data.toDate),
      halfDayDate: validated.data.halfDayDate ? new Date(validated.data.halfDayDate) : undefined,
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/leave] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create leave application' },
      { status: 500 }
    );
  }
}
