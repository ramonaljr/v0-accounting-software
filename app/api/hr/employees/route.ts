/**
 * HR Employees API
 * REST endpoints for employee management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { employeeService } from '@/lib/services/hr/employee.service';

// Request schemas - matching lib/models/hr/employee.ts createEmployeeSchema
const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  suffix: z.string().max(20).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed', 'Separated']).optional(),
  dateOfJoining: z.coerce.date().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  employmentTypeId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  reportsTo: z.string().uuid().optional(),
  personalEmail: z.string().email().optional(),
  companyEmail: z.string().email().optional(),
  mobilePhone: z.string().max(50).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(50).optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  tinNo: z.string().max(50).optional(),
  sssNo: z.string().max(50).optional(),
  philhealthNo: z.string().max(50).optional(),
  pagibigNo: z.string().max(50).optional(),
  bankName: z.string().max(200).optional(),
  bankAccountNo: z.string().max(100).optional(),
  bankAccountName: z.string().max(200).optional(),
  salaryMode: z.enum(['Bank', 'Cash', 'Cheque']).default('Bank'),
  paymentDaysBasis: z.enum(['Calendar Days', 'Working Days']).default('Calendar Days'),
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
