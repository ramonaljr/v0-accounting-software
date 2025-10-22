'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/server'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

interface CreateOrganizationParams {
  name: string
  slug: string
  fiscalYearStartMonth?: number
  accountingBasis?: 'accrual' | 'cash'
}

export async function createOrganization(params: CreateOrganizationParams) {
  try {
    // Ensure user is authenticated
    const user = await requireAuth()

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(params.slug)) {
      return {
        error: 'Slug must contain only lowercase letters, numbers, and hyphens',
      }
    }

    const supabase = await createClient()

    // Check if slug is already taken
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (existingOrg) {
      return { error: 'Organization slug is already taken' }
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: params.name,
        slug: params.slug,
        owner_id: user.id,
        fiscal_year_start_month: params.fiscalYearStartMonth || 1,
        accounting_basis: params.accountingBasis || 'accrual',
        subscription_tier: 'starter',
        subscription_status: 'trial',
      })
      .select()
      .single()

    if (orgError) {
      return { error: orgError.message }
    }

    // Add user as owner in org_members
    const { error: memberError } = await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner',
      invited_by: user.id,
    })

    if (memberError) {
      // Rollback: delete the organization
      await supabase.from('organizations').delete().eq('id', org.id)
      return { error: memberError.message }
    }

    // Log audit event
    await logAuditEvent({
      orgId: org.id,
      userId: user.id,
      action: 'organization.create',
      entityType: 'organization',
      entityId: org.id,
      metadata: {
        orgName: org.name,
        orgSlug: org.slug,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return { data: org }
  } catch (err) {
    console.error('Error creating organization:', err)
    return { error: 'An unexpected error occurred' }
  }
}
