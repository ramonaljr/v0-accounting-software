/**
 * HR Employees API
 * REST endpoints for employee management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { employeeService } from '@/lib/services/hr/employee.service';

// Request schemas
const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  dateOfJoining: z.string(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  employmentTypeId: z.string().uuid().optional(),
  employeeGradeId: z.string().uuid().optional(),
  personalEmail: z.string().email().optional(),
  companyEmail: z.string().email().optional(),
  mobileNo: z.string().optional(),
  tinNo: z.string().optional(),
  sssNo: z.string().optional(),
  philhealthNo: z.string().optional(),
  pagibigNo: z.string().optional(),
  taxStatus: z.string().optional(),
  qualifiedDependents: z.number().min(0).max(4).optional(),
});

/**
 * GET /api/hr/employees
 * List employees with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
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
      status: searchParams.get('status') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      designationId: searchParams.get('designationId') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await employeeService.listEmployees(membership.org_id, options);

    return NextResponse.json({
      success: true,
      data: result.employees,
      total: result.total,
    });
  } catch (error) {
    console.error('[GET /api/hr/employees] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list employees' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/employees
 * Create a new employee
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions
    if (!['owner', 'admin', 'accountant'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreateEmployeeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const employee = await employeeService.createEmployee({
      orgId: membership.org_id,
      ...validated.data,
    });

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/employees] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create employee' },
      { status: 500 }
    );
  }
}
