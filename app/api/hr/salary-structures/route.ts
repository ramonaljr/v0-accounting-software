/**
 * Salary Structures API
 * REST endpoints for salary components and structures management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SalaryStructureService } from '@/lib/services/hr/salary-structure.service';

const CreateComponentSchema = z.object({
  componentName: z.string().min(1),
  componentType: z.enum(['Earning', 'Deduction']),
  abbreviation: z.string().optional(),
  description: z.string().optional(),
  isTaxable: z.boolean().optional(),
  isPayable: z.boolean().optional(),
  dependsOnPaymentDays: z.boolean().optional(),
  isStatutory: z.boolean().optional(),
  statisticalComponent: z.boolean().optional(),
  formula: z.string().optional(),
  amountBasedOnFormula: z.boolean().optional(),
  formulaAmount: z.number().optional(),
});

const CreateStructureSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
  salarySlipBasedOnTimesheet: z.boolean().optional(),
  payrollFrequency: z.enum(['Monthly', 'Semi-Monthly', 'Weekly', 'Bi-Weekly']).optional(),
  earnings: z.array(z.object({
    salaryComponentId: z.string().uuid(),
    amount: z.number().optional(),
    formulaVariables: z.record(z.any()).optional(),
  })).optional(),
  deductions: z.array(z.object({
    salaryComponentId: z.string().uuid(),
    amount: z.number().optional(),
    formulaVariables: z.record(z.any()).optional(),
  })).optional(),
});

/**
 * GET /api/hr/salary-structures
 * List salary components and structures
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
    const type = searchParams.get('type'); // 'components' or 'structures'
    const componentType = searchParams.get('componentType') as 'Earning' | 'Deduction' | null;

    if (type === 'components') {
      const components = await SalaryStructureService.listSalaryComponents(
        membership.org_id,
        componentType || undefined
      );
      return NextResponse.json({ success: true, data: components });
    }

    // Default: list structures
    const structures = await SalaryStructureService.listSalaryStructures(membership.org_id);
    return NextResponse.json({ success: true, data: structures });
  } catch (error) {
    console.error('[GET /api/hr/salary-structures] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list salary structures' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/salary-structures
 * Create a salary component or structure
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
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (type === 'component') {
      const validated = CreateComponentSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: validated.error.issues },
          { status: 400 }
        );
      }

      const component = await SalaryStructureService.createSalaryComponent({
        orgId: membership.org_id,
        ...validated.data,
      });
      return NextResponse.json({ success: true, data: component }, { status: 201 });
    }

    // Default: create structure
    const validated = CreateStructureSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const structure = await SalaryStructureService.createSalaryStructure({
      orgId: membership.org_id,
      ...validated.data,
    });
    return NextResponse.json({ success: true, data: structure }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/salary-structures] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create salary structure' },
      { status: 500 }
    );
  }
}
