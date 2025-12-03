/**
 * HR Loans API
 * REST endpoints for loan management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { LoanService } from '@/lib/services/hr/loan.service';

const CreateLoanSchema = z.object({
  employeeId: z.string().uuid(),
  loanType: z.enum(['SSS Loan', 'Pag-IBIG Loan', 'Company Loan', 'Cash Advance', 'Other']),
  description: z.string().optional(),
  loanAmount: z.number().positive(),
  interestRate: z.number().min(0).optional(),
  repaymentStartDate: z.string(),
  repaymentPeriodMonths: z.number().positive(),
  applicationDate: z.string().optional(),
});

/**
 * GET /api/hr/loans
 * List loans
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
      status: searchParams.get('status') as 'Draft' | 'Approved' | 'Disbursed' | 'Repaying' | 'Closed' | 'Cancelled' | undefined,
      loanType: searchParams.get('loanType') as 'SSS Loan' | 'Pag-IBIG Loan' | 'Company Loan' | 'Cash Advance' | 'Other' | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await LoanService.listOrganizationLoans(membership.org_id, options);

    return NextResponse.json({
      success: true,
      data: result.loans,
      total: result.total,
    });
  } catch (error) {
    console.error('[GET /api/hr/loans] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list loans' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/loans
 * Create a new loan
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
    const validated = CreateLoanSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const loan = await LoanService.createLoan({
      orgId: membership.org_id,
      ...validated.data,
      repaymentStartDate: new Date(validated.data.repaymentStartDate),
      applicationDate: validated.data.applicationDate ? new Date(validated.data.applicationDate) : undefined,
    });

    return NextResponse.json({ success: true, data: loan }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/hr/loans] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create loan' },
      { status: 500 }
    );
  }
}
