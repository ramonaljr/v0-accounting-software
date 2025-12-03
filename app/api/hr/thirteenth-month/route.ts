/**
 * 13th Month Pay API
 * REST endpoints for 13th month pay computation (Philippine compliance)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ThirteenthMonthService } from '@/lib/services/hr/thirteenth-month.service';

const ComputeSchema = z.object({
  year: z.number().min(2020).max(2100),
  asOfDate: z.string().optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
  departmentId: z.string().uuid().optional(),
  includeProrated: z.boolean().optional(),
});

/**
 * GET /api/hr/thirteenth-month
 * List 13th month batches
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
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    // List batches for organization
    const { data: batches, error } = await supabase
      .from('thirteenth_month_batches')
      .select('*')
      .eq('org_id', membership.org_id)
      .order('year', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: batches || [],
    });
  } catch (error) {
    console.error('[GET /api/hr/thirteenth-month] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list 13th month batches' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/thirteenth-month
 * Compute 13th month pay
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
    const validated = ComputeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const result = await ThirteenthMonthService.computeForOrganization({
      orgId: membership.org_id,
      year: validated.data.year,
      asOfDate: validated.data.asOfDate ? new Date(validated.data.asOfDate) : undefined,
      employeeIds: validated.data.employeeIds,
      departmentId: validated.data.departmentId,
      includeProrated: validated.data.includeProrated,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/thirteenth-month] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to compute 13th month pay' },
      { status: 500 }
    );
  }
}
