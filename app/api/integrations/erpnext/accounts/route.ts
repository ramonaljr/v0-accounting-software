/**
 * ERPNext Accounts API
 * Manage Chart of Accounts sync with ERPNext
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  pushAccountToERPNext,
  importCOAFromERPNext,
  getERPNextCompanies,
} from '@/lib/erpnext/accounts'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const pushAccountSchema = z.object({
  orgId: z.string().uuid(),
  accountId: z.string().uuid(),
  companyName: z.string(),
})

const importCOASchema = z.object({
  orgId: z.string().uuid(),
  companyName: z.string(),
})

/**
 * POST /api/integrations/erpnext/accounts
 * Push account to ERPNext or import COA
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const action = body.action

    if (action === 'push') {
      const validated = pushAccountSchema.parse(body)

      // Verify user has admin access
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', validated.orgId)
        .eq('user_id', user.id)
        .single()

      if (!membership || !['owner', 'admin', 'accountant'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient permissions' },
          { status: 403 }
        )
      }

      const result = await pushAccountToERPNext(validated)

      return NextResponse.json(result)
    }

    if (action === 'import') {
      const validated = importCOASchema.parse(body)

      // Verify user has admin access
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', validated.orgId)
        .eq('user_id', user.id)
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient permissions' },
          { status: 403 }
        )
      }

      const result = await importCOAFromERPNext(validated)

      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Accounts API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/integrations/erpnext/accounts/companies
 * Get list of companies from ERPNext
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const companies = await getERPNextCompanies()

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Get companies error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get companies' },
      { status: 500 }
    )
  }
}
