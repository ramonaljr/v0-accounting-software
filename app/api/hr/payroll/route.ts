/**
 * HR Payroll API
 * REST endpoints for payroll processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { PayrollService } from '@/lib/services/hr/payroll.service';

const CreatePayrollEntrySchema = z.object({
  postingDate: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  payrollFrequency: z.enum(['Monthly', 'Semi-Monthly', 'Weekly', 'Bi-Weekly']).optional(),
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

/**
 * GET /api/hr/payroll
 * List salary slips
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
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Query salary slips directly from supabase
    let query = supabase
      .from('salary_slips')
      .select('*', { count: 'exact' })
      .eq('org_id', membership.org_id);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (fromDate) {
      query = query.gte('start_date', fromDate);
    }
    if (toDate) {
      query = query.lte('end_date', toDate);
    }

    query = query.range(offset, offset + limit - 1).order('posting_date', { ascending: false });

    const { data: salarySlips, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: salarySlips || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('[GET /api/hr/payroll] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list salary slips' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/payroll
 * Create a payroll entry
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

    if (!['owner', 'admin', 'accountant'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreatePayrollEntrySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const entry = await PayrollService.createPayrollEntry({
      orgId: membership.org_id,
      postingDate: new Date(validated.data.postingDate),
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      payrollFrequency: validated.data.payrollFrequency || 'Monthly',
      departmentId: validated.data.departmentId,
      branchId: validated.data.branchId,
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/payroll] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create payroll entry' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/hr/payroll
 * Submit a payroll entry
 */
export async function PUT(request: NextRequest) {
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

    if (!['owner', 'admin', 'accountant'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { payrollEntryId } = body;

    if (!payrollEntryId) {
      return NextResponse.json(
        { success: false, error: 'payrollEntryId is required' },
        { status: 400 }
      );
    }

    const result = await PayrollService.submitPayrollEntry(payrollEntryId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[PUT /api/hr/payroll] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to submit payroll entry' },
      { status: 500 }
    );
  }
}
