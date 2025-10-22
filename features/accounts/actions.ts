'use server'

/**
 * Server actions for Chart of Accounts management
 */

import { createClient } from '@/lib/supabase/server'
import { requireOrg, requireRole } from '@/lib/auth/org'
import { Database, AccountType } from '@/lib/supabase/database.types'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit/logger'

type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

export interface CreateAccountInput {
  code: string
  name: string
  account_type: AccountType
  parent_id?: string | null
  currency?: string
  description?: string | null
}

export interface UpdateAccountInput {
  code?: string
  name?: string
  account_type?: AccountType
  parent_id?: string | null
  description?: string | null
  is_active?: boolean
}

export interface AccountWithPath extends Account {
  path?: string
  parent?: Account | null
}

/**
 * Get all accounts for current organization
 */
export async function getAccounts(): Promise<Account[]> {
  const context = await requireOrg()

  // DEVELOPMENT MODE: Return mock data if bypass is enabled
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    return [
      {
        id: '1',
        org_id: context.orgId,
        code: '1000',
        name: 'Cash',
        account_type: 'asset' as AccountType,
        parent_id: null,
        currency: 'USD',
        balance: 50000,
        is_active: true,
        is_system: true,
        description: 'Cash and cash equivalents',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        org_id: context.orgId,
        code: '1200',
        name: 'Accounts Receivable',
        account_type: 'asset' as AccountType,
        parent_id: null,
        currency: 'USD',
        balance: 25000,
        is_active: true,
        is_system: true,
        description: 'Money owed by customers',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        org_id: context.orgId,
        code: '4000',
        name: 'Sales Revenue',
        account_type: 'revenue' as AccountType,
        parent_id: null,
        currency: 'USD',
        balance: 150000,
        is_active: true,
        is_system: true,
        description: 'Revenue from sales',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        org_id: context.orgId,
        code: '5000',
        name: 'Cost of Goods Sold',
        account_type: 'expense' as AccountType,
        parent_id: null,
        currency: 'USD',
        balance: 60000,
        is_active: true,
        is_system: true,
        description: 'Direct costs of goods sold',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '5',
        org_id: context.orgId,
        code: '6000',
        name: 'Operating Expenses',
        account_type: 'expense' as AccountType,
        parent_id: null,
        currency: 'USD',
        balance: 35000,
        is_active: true,
        is_system: true,
        description: 'General operating expenses',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as Account[]
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('org_id', context.orgId)
    .order('code')

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`)
  }

  return data || []
}

/**
 * Get accounts filtered by type
 */
export async function getAccountsByType(
  accountType: AccountType
): Promise<Account[]> {
  const context = await requireOrg()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('org_id', context.orgId)
    .eq('account_type', accountType)
    .eq('is_active', true)
    .order('code')

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`)
  }

  return data || []
}

/**
 * Get single account by ID
 */
export async function getAccount(id: string): Promise<AccountWithPath | null> {
  const context = await requireOrg()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('org_id', context.orgId)
    .single()

  if (error) {
    return null
  }

  // Get account path
  const { data: pathData } = await supabase.rpc('get_account_path', {
    account_id: id,
  })

  return {
    ...data,
    path: pathData || undefined,
  }
}

/**
 * Create new account
 */
export async function createAccount(
  input: CreateAccountInput
): Promise<{ success: boolean; data?: Account; error?: string }> {
  try {
    const context = await requireRole('staff')
    const supabase = await createClient()

    // Validate unique code
    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('org_id', context.orgId)
      .eq('code', input.code)
      .single()

    if (existing) {
      return {
        success: false,
        error: `Account code ${input.code} already exists`,
      }
    }

    // Create account
    const accountData: AccountInsert = {
      org_id: context.orgId,
      code: input.code,
      name: input.name,
      account_type: input.account_type,
      parent_id: input.parent_id || null,
      currency: input.currency || 'USD',
      description: input.description || null,
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert(accountData)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Log audit
    await logAudit({
      action: 'account.created',
      entity_type: 'account',
      entity_id: data.id,
      changes: { created: accountData },
    })

    revalidatePath('/accounts')
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update existing account
 */
export async function updateAccount(
  id: string,
  input: UpdateAccountInput
): Promise<{ success: boolean; data?: Account; error?: string }> {
  try {
    const context = await requireRole('accountant')
    const supabase = await createClient()

    // Get current account
    const { data: current } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('org_id', context.orgId)
      .single()

    if (!current) {
      return { success: false, error: 'Account not found' }
    }

    // Prevent type change for system accounts
    if (current.is_system && input.account_type) {
      return {
        success: false,
        error: 'Cannot change type of system account',
      }
    }

    // Validate unique code if changing
    if (input.code && input.code !== current.code) {
      const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('org_id', context.orgId)
        .eq('code', input.code)
        .neq('id', id)
        .single()

      if (existing) {
        return {
          success: false,
          error: `Account code ${input.code} already exists`,
        }
      }
    }

    // Update account
    const { data, error } = await supabase
      .from('accounts')
      .update(input as AccountUpdate)
      .eq('id', id)
      .eq('org_id', context.orgId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Log audit
    await logAudit({
      action: 'account.updated',
      entity_type: 'account',
      entity_id: id,
      changes: { before: current, after: data },
    })

    revalidatePath('/accounts')
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deactivate account (soft delete)
 */
export async function deactivateAccount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireRole('admin')
    const supabase = await createClient()

    // Check if system account
    const { data: account } = await supabase
      .from('accounts')
      .select('is_system, code, name')
      .eq('id', id)
      .eq('org_id', context.orgId)
      .single()

    if (!account) {
      return { success: false, error: 'Account not found' }
    }

    if (account.is_system) {
      return { success: false, error: 'Cannot delete system account' }
    }

    // Deactivate
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('org_id', context.orgId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Log audit
    await logAudit({
      action: 'account.deactivated',
      entity_type: 'account',
      entity_id: id,
      changes: { account: { code: account.code, name: account.name } },
    })

    revalidatePath('/accounts')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Reactivate account
 */
export async function reactivateAccount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireRole('admin')
    const supabase = await createClient()

    const { error } = await supabase
      .from('accounts')
      .update({ is_active: true })
      .eq('id', id)
      .eq('org_id', context.orgId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Log audit
    await logAudit({
      action: 'account.reactivated',
      entity_type: 'account',
      entity_id: id,
    })

    revalidatePath('/accounts')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get COA templates
 */
export async function getCOATemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coa_templates')
    .select('*')
    .eq('is_active', true)
    .order('region, industry')

  if (error) {
    throw new Error(`Failed to fetch COA templates: ${error.message}`)
  }

  return data || []
}

/**
 * Initialize COA from template
 */
export async function initializeFromTemplate(
  templateId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const context = await requireRole('admin')
    const supabase = await createClient()

    // Check if org already has accounts
    const { count } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', context.orgId)

    if (count && count > 0) {
      return {
        success: false,
        error: 'Organization already has accounts. Cannot reinitialize.',
      }
    }

    // Get template
    const { data: template } = await supabase
      .from('coa_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    // Parse template data
    const templateData = template.template_data as {
      accounts: Array<{
        code: string
        name: string
        type: AccountType
        parent: string | null
      }>
    }

    // Create accounts
    const accountsToCreate: AccountInsert[] = templateData.accounts.map(
      (acc) => ({
        org_id: context.orgId,
        code: acc.code,
        name: acc.name,
        account_type: acc.type,
        parent_id: null, // Will be set in second pass
        currency: 'USD',
        is_system: true, // Template accounts are system accounts
      })
    )

    const { data: created, error: createError } = await supabase
      .from('accounts')
      .insert(accountsToCreate)
      .select()

    if (createError) {
      return { success: false, error: createError.message }
    }

    // Log audit
    await logAudit({
      action: 'coa.initialized',
      entity_type: 'coa_template',
      entity_id: templateId,
      changes: { template: template.name, count: created.length },
    })

    revalidatePath('/accounts')
    return { success: true, count: created.length }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
