/**
 * HR Payroll API
 * REST endpoints for payroll processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { PayrollService } from '@/lib/services/hr/payroll.service';

const CreatePayrollEntrySchema = z.object({
  employeeId: z.string().uuid(),
  postingDate: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  payrollFrequency: z.enum(['Monthly', 'Semi-Monthly', 'Weekly', 'Bi-Weekly']).optional(),
  salaryStructureId: z.string().uuid().optional(),
});

const ProcessPayrollSchema = z.object({
  payrollEntryId: z.string().uuid(),
  employeeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  postingDate: z.string(),
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
    const options = {
      employeeId: searchParams.get('employeeId') || undefined,
      status: searchParams.get('status') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await PayrollService.listSalarySlips(membership.org_id, options);

    return NextResponse.json({
      success: true,
      data: result.salarySlips,
      total: result.total,
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
      employeeId: validated.data.employeeId,
      postingDate: new Date(validated.data.postingDate),
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      payrollFrequency: validated.data.payrollFrequency || 'Monthly',
      salaryStructureId: validated.data.salaryStructureId,
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
 * Process payroll (calculate earnings, deductions, taxes)
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
    const validated = ProcessPayrollSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const result = await PayrollService.processPayroll({
      orgId: membership.org_id,
      payrollEntryId: validated.data.payrollEntryId,
      employeeId: validated.data.employeeId,
      startDate: new Date(validated.data.startDate),
      endDate: new Date(validated.data.endDate),
      postingDate: new Date(validated.data.postingDate),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[PUT /api/hr/payroll] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process payroll' },
      { status: 500 }
    );
  }
}
