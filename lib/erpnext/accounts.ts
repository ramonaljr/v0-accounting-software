/**
 * ERPNext Chart of Accounts Integration
 * Sync accounts bidirectionally with ERPNext
 */

import { erpnextFetch } from './client'
import { pushToERPNext, pullFromERPNext, getERPMapping } from './sync'
import { createClient } from '@/lib/supabase/server'

export interface ERPNextAccount {
  name?: string // ERPNext doc name (auto-generated)
  account_name: string
  account_number?: string
  account_type: string
  parent_account?: string
  company: string
  is_group: 0 | 1
  root_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'
  account_currency?: string
  disabled?: 0 | 1
  report_type?: 'Balance Sheet' | 'Profit and Loss'
}

/**
 * Map our account type to ERPNext root type
 */
function mapAccountTypeToRootType(accountType: string): ERPNextAccount['root_type'] {
  const mapping: Record<string, ERPNextAccount['root_type']> = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    revenue: 'Income',
    expense: 'Expense',
  }
  return mapping[accountType] || 'Asset'
}

/**
 * Map ERPNext root type to our account type
 */
function mapRootTypeToAccountType(rootType: string): string {
  const mapping: Record<string, string> = {
    Asset: 'asset',
    Liability: 'liability',
    Equity: 'equity',
    Income: 'revenue',
    Expense: 'expense',
  }
  return mapping[rootType] || 'asset'
}

/**
 * Push account to ERPNext
 */
export async function pushAccountToERPNext(params: {
  orgId: string
  accountId: string
  companyName: string
}): Promise<{ success: boolean; erpName?: string; error?: string }> {
  const supabase = await createClient()

  // Get account data
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', params.accountId)
    .eq('org_id', params.orgId)
    .single()

  if (error || !account) {
    return {
      success: false,
      error: 'Account not found',
    }
  }

  // Check if parent account has ERP mapping
  let parentAccountName: string | undefined

  if (account.parent_id) {
    const parentMapping = await getERPMapping({
      orgId: params.orgId,
      entityType: 'account',
      entityId: account.parent_id,
    })

    if (parentMapping) {
      parentAccountName = parentMapping.erpName
    }
  }

  // Build ERPNext account payload
  const erpAccount: ERPNextAccount = {
    account_name: account.name,
    account_number: account.code,
    account_type: account.account_type,
    company: params.companyName,
    is_group: 0, // Leaf account by default
    root_type: mapAccountTypeToRootType(account.account_type),
    account_currency: account.currency || 'USD',
    disabled: account.is_active ? 0 : 1,
    parent_account: parentAccountName,
  }

  // Push to ERPNext
  const result = await pushToERPNext(
    {
      orgId: params.orgId,
      entityType: 'account',
      entityId: params.accountId,
      erpDoctype: 'Account',
      direction: 'push',
    },
    erpAccount
  )

  return result
}

/**
 * Pull account from ERPNext
 */
export async function pullAccountFromERPNext(params: {
  orgId: string
  accountId: string
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const result = await pullFromERPNext({
    orgId: params.orgId,
    entityType: 'account',
    entityId: params.accountId,
    erpDoctype: 'Account',
    direction: 'pull',
  })

  return result
}

/**
 * Import COA from ERPNext for a company
 */
export async function importCOAFromERPNext(params: {
  orgId: string
  companyName: string
}): Promise<{ success: boolean; imported: number; error?: string }> {
  try {
    const supabase = await createClient()

    // Fetch all accounts for the company from ERPNext
    const response = await erpnextFetch(
      `/api/resource/Account?fields=["name","account_name","account_number","account_type","parent_account","company","is_group","root_type","account_currency","disabled"]&filters=[["company","=","${params.companyName}"]]&limit_page_length=999`
    )

    const accounts = response.data || []

    let imported = 0

    // Import accounts in order (parents first)
    // Sort by is_group descending so group accounts are created first
    const sortedAccounts = accounts.sort((a: { is_group?: number }, b: { is_group?: number }) => {
      return (b.is_group || 0) - (a.is_group || 0)
    })

    for (const erpAccount of sortedAccounts) {
      // Check if account already exists by code
      const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('org_id', params.orgId)
        .eq('code', erpAccount.account_number || erpAccount.name)
        .single()

      if (existing) {
        // Already exists, create mapping only
        const { error: mapError } = await supabase
          .from('erp_map')
          .upsert({
            org_id: params.orgId,
            entity_type: 'account',
            entity_id: existing.id,
            erp_doctype: 'Account',
            erp_name: erpAccount.name,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          }, {
            onConflict: 'org_id,entity_type,entity_id'
          })

        if (!mapError) {
          imported++
        }
        continue
      }

      // Resolve parent_id if parent_account is set
      let parentId: string | null = null

      if (erpAccount.parent_account) {
        // Find parent by ERP mapping
        const { data: parentMapping } = await supabase
          .from('erp_map')
          .select('entity_id')
          .eq('org_id', params.orgId)
          .eq('entity_type', 'account')
          .eq('erp_name', erpAccount.parent_account)
          .single()

        if (parentMapping) {
          parentId = parentMapping.entity_id
        }
      }

      // Insert account
      const { data: newAccount, error: insertError } = await supabase
        .from('accounts')
        .insert({
          org_id: params.orgId,
          code: erpAccount.account_number || erpAccount.name,
          name: erpAccount.account_name,
          account_type: mapRootTypeToAccountType(erpAccount.root_type),
          parent_id: parentId,
          currency: erpAccount.account_currency || 'USD',
          is_active: erpAccount.disabled === 0,
          is_system: false,
        })
        .select()
        .single()

      if (insertError || !newAccount) {
        console.error('Failed to import account:', erpAccount.name, insertError)
        continue
      }

      // Create ERP mapping
      await supabase
        .from('erp_map')
        .insert({
          org_id: params.orgId,
          entity_type: 'account',
          entity_id: newAccount.id,
          erp_doctype: 'Account',
          erp_name: erpAccount.name,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })

      imported++
    }

    return {
      success: true,
      imported,
    }
  } catch (error) {
    return {
      success: false,
      imported: 0,
      error: error instanceof Error ? error.message : 'Import failed',
    }
  }
}

/**
 * Get company list from ERPNext
 */
export async function getERPNextCompanies(): Promise<{ name: string; company_name: string }[]> {
  try {
    const response = await erpnextFetch(
      '/api/resource/Company?fields=["name","company_name"]&limit_page_length=999'
    )

    return response.data || []
  } catch (error) {
    console.error('Failed to fetch companies:', error)
    return []
  }
}
