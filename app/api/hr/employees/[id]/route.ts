/**
 * HR Employee Detail API
 * REST endpoints for individual employee operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { employeeService } from '@/lib/services/hr/employee.service';

const UpdateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  dateOfJoining: z.coerce.date().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  employmentTypeId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  personalEmail: z.string().email().optional(),
  companyEmail: z.string().email().optional(),
  mobilePhone: z.string().optional(),
  tinNo: z.string().optional(),
  sssNo: z.string().optional(),
  philhealthNo: z.string().optional(),
  pagibigNo: z.string().optional(),
  salaryMode: z.enum(['Bank', 'Cash', 'Cheque']).optional(),
  paymentDaysBasis: z.enum(['Calendar Days', 'Working Days']).optional(),
});

/**
 * GET /api/hr/employees/[id]
 * Get employee by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const employee = await employeeService.getEmployeeById(id, membership.org_id);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('[GET /api/hr/employees/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get employee' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/hr/employees/[id]
 * Update employee
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validated = UpdateEmployeeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const employee = await employeeService.updateEmployee(id, membership.org_id, validated.data);

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('[PATCH /api/hr/employees/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update employee' },
      { status: 500 }
    );
  }
}
