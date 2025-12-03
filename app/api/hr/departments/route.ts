/**
 * Departments API
 * REST endpoints for department management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { EmployeeService } from '@/lib/services/hr/employee.service';

const CreateDepartmentSchema = z.object({
  departmentName: z.string().min(1),
  parentDepartmentId: z.string().uuid().optional(),
  isGroup: z.boolean().optional(),
});

/**
 * GET /api/hr/departments
 * List departments
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

    const { data: departments, error } = await supabase
      .from('departments')
      .select('*')
      .eq('org_id', membership.org_id)
      .eq('is_active', true)
      .order('department_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: departments || [],
    });
  } catch (error) {
    console.error('[GET /api/hr/departments] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list departments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/departments
 * Create a new department
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

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreateDepartmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        org_id: membership.org_id,
        department_name: validated.data.departmentName,
        parent_department_id: validated.data.parentDepartmentId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data: department }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/departments] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create department' },
      { status: 500 }
    );
  }
}
