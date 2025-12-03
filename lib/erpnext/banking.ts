/**
 * ERPNext Banking Integration
 * Sync bank accounts, transactions, and payment entries
 */

import { erpnextFetch } from './client'
import { pushToERPNext, getERPMapping } from './sync'
import { createClient } from '@/lib/supabase/server'

export interface ERPNextBankAccount {
  name?: string
  account_name: string
  bank: string
  account: string // GL Account link
  account_type?: string
  company: string
  is_company_account: 1 | 0
  is_default: 0 | 1
  disabled?: 0 | 1
}

export interface ERPNextBankTransaction {
  name?: string
  date: string
  description: string
  bank_account: string
  deposit: number
  withdrawal: number
  currency?: string
  reference_number?: string
  transaction_id?: string
  unallocated_amount?: number
  status?: 'Unreconciled' | 'Reconciled' | 'Pending'
}

export interface ERPNextPaymentEntry {
  name?: string
  payment_type: 'Receive' | 'Pay' | 'Internal Transfer'
  posting_date: string
  company: string
  mode_of_payment?: string
  party_type?: 'Customer' | 'Supplier' | 'Employee'
  party?: string
  party_name?: string
  paid_from: string // GL Account
  paid_to: string // GL Account
  paid_from_account_currency?: string
  paid_to_account_currency?: string
  paid_amount: number
  received_amount: number
  reference_no?: string
  reference_date?: string
  remarks?: string
  references?: Array<{
    reference_doctype: string
    reference_name: string
    total_amount: number
    outstanding_amount: number
    allocated_amount: number
  }>
}

/**
 * Push bank account to ERPNext
 */
export async function pushBankAccountToERPNext(params: {
  orgId: string
  bankAccountId: string
  companyName: string
}): Promise<{ success: boolean; erpName?: string; error?: string }> {
  const supabase = await createClient()

  // Get bank account data
  const { data: bankAccount, error } = await supabase
    .from('bank_accounts')
    .select('*, accounts(*)')
    .eq('id', params.bankAccountId)
    .eq('org_id', params.orgId)
    .single()

  if (error || !bankAccount) {
    return { success: false, error: 'Bank account not found' }
  }

  // Get GL account mapping
  let glAccountName: string | undefined

  if (bankAccount.gl_account_id) {
    const glMapping = await getERPMapping({
      orgId: params.orgId,
      entityType: 'account',
      entityId: bankAccount.gl_account_id,
    })

    if (glMapping) {
      glAccountName = glMapping.erpName
    }
  }

  if (!glAccountName) {
    return { success: false, error: 'GL account not mapped to ERPNext' }
  }

  // Build ERPNext bank account payload
  const erpBankAccount: ERPNextBankAccount = {
    account_name: bankAccount.account_name,
    bank: bankAccount.bank_name || 'Default Bank',
    account: glAccountName,
    company: params.companyName,
    is_company_account: 1,
    is_default: 0,
    disabled: bankAccount.is_active ? 0 : 1,
  }

  // Push to ERPNext
  const result = await pushToERPNext(
    {
      orgId: params.orgId,
      entityType: 'bank_account',
      entityId: params.bankAccountId,
      erpDoctype: 'Bank Account',
      direction: 'push',
    },
    erpBankAccount
  )

  return result
}

/**
 * Push bank transaction to ERPNext
 */
export async function pushBankTransactionToERPNext(params: {
  orgId: string
  bankTransactionId: string
}): Promise<{ success: boolean; erpName?: string; error?: string }> {
  const supabase = await createClient()

  // Get bank transaction data
  const { data: transaction, error } = await supabase
    .from('bank_transactions')
    .select('*, bank_accounts(*)')
    .eq('id', params.bankTransactionId)
    .eq('org_id', params.orgId)
    .single()

  if (error || !transaction) {
    return { success: false, error: 'Bank transaction not found' }
  }

  // Get bank account mapping
  const bankAccountMapping = await getERPMapping({
    orgId: params.orgId,
    entityType: 'bank_account',
    entityId: transaction.bank_account_id,
  })

  if (!bankAccountMapping) {
    return { success: false, error: 'Bank account not mapped to ERPNext' }
  }

  // Build ERPNext bank transaction payload
  const erpTransaction: ERPNextBankTransaction = {
    date: transaction.transaction_date,
    description: transaction.description,
    bank_account: bankAccountMapping.erpName,
    deposit: transaction.transaction_type === 'credit' ? Math.abs(transaction.amount) : 0,
    withdrawal: transaction.transaction_type === 'debit' ? Math.abs(transaction.amount) : 0,
    currency: transaction.currency,
    transaction_id: transaction.integration_transaction_id || undefined,
    reference_number: transaction.notes || undefined,
    status: transaction.is_reconciled ? 'Reconciled' : 'Unreconciled',
  }

  // Push to ERPNext
  const result = await pushToERPNext(
    {
      orgId: params.orgId,
      entityType: 'bank_transaction',
      entityId: params.bankTransactionId,
      erpDoctype: 'Bank Transaction',
      direction: 'push',
    },
    erpTransaction
  )

  return result
}

/**
 * Create Payment Entry in ERPNext for reconciliation
 */
export async function createPaymentEntry(params: {
  orgId: string
  paymentType: 'Receive' | 'Pay' | 'Internal Transfer'
  postingDate: string
  companyName: string
  paidFrom: string // GL Account name in ERPNext
  paidTo: string // GL Account name in ERPNext
  amount: number
  currency?: string
  partyType?: 'Customer' | 'Supplier'
  party?: string // Customer/Supplier name in ERPNext
  referenceNo?: string
  remarks?: string
  references?: Array<{
    doctype: string
    name: string
    totalAmount: number
    outstandingAmount: number
    allocatedAmount: number
  }>
}): Promise<{ success: boolean; erpName?: string; error?: string }> {
  try {
    // Build Payment Entry payload
    const paymentEntry: ERPNextPaymentEntry = {
      payment_type: params.paymentType,
      posting_date: params.postingDate,
      company: params.companyName,
      paid_from: params.paidFrom,
      paid_to: params.paidTo,
      paid_from_account_currency: params.currency || 'USD',
      paid_to_account_currency: params.currency || 'USD',
      paid_amount: params.amount,
      received_amount: params.amount,
      party_type: params.partyType,
      party: params.party,
      reference_no: params.referenceNo,
      remarks: params.remarks,
      references: params.references?.map(ref => ({
        reference_doctype: ref.doctype,
        reference_name: ref.name,
        total_amount: ref.totalAmount,
        outstanding_amount: ref.outstandingAmount,
        allocated_amount: ref.allocatedAmount,
      })),
    }

    const response = await erpnextFetch('/api/resource/Payment Entry', {
      method: 'POST',
      body: JSON.stringify(paymentEntry),
    })

    const erpName = response.data?.name || response.name

    return {
      success: true,
      erpName,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment entry',
    }
  }
}

/**
 * Get bank accounts from ERPNext for a company
 */
export async function getERPNextBankAccounts(companyName: string): Promise<ERPNextBankAccount[]> {
  try {
    const response = await erpnextFetch(
      `/api/resource/Bank Account?fields=["name","account_name","bank","account","company","is_company_account","is_default"]&filters=[["company","=","${companyName}"]]&limit_page_length=999`
    )

    return response.data || []
  } catch (error) {
    console.error('Failed to fetch bank accounts:', error)
    return []
  }
}

/**
 * Import bank accounts from ERPNext
 */
export async function importBankAccountsFromERPNext(params: {
  orgId: string
  companyName: string
}): Promise<{ success: boolean; imported: number; error?: string }> {
  try {
    const supabase = await createClient()
    const erpBankAccounts = await getERPNextBankAccounts(params.companyName)

    let imported = 0

    for (const erpAccount of erpBankAccounts) {
      // Check if account already exists
      const { data: existing } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('org_id', params.orgId)
        .eq('account_name', erpAccount.account_name)
        .single()

      if (existing) {
        // Create mapping only
        await supabase
          .from('erp_map')
          .upsert({
            org_id: params.orgId,
            entity_type: 'bank_account',
            entity_id: existing.id,
            erp_doctype: 'Bank Account',
            erp_name: erpAccount.name!,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          }, {
            onConflict: 'org_id,entity_type,entity_id'
          })

        imported++
        continue
      }

      // Find GL account by ERP mapping
      let glAccountId: string | null = null

      const { data: glMapping } = await supabase
        .from('erp_map')
        .select('entity_id')
        .eq('org_id', params.orgId)
        .eq('entity_type', 'account')
        .eq('erp_name', erpAccount.account)
        .single()

      if (glMapping) {
        glAccountId = glMapping.entity_id
      }

      // Insert bank account
      const { data: newAccount, error: insertError } = await supabase
        .from('bank_accounts')
        .insert({
          org_id: params.orgId,
          account_name: erpAccount.account_name,
          bank_name: erpAccount.bank,
          gl_account_id: glAccountId,
          is_active: erpAccount.disabled === 0,
          integration_type: 'manual',
        })
        .select()
        .single()

      if (insertError || !newAccount) {
        console.error('Failed to import bank account:', erpAccount.name, insertError)
        continue
      }

      // Create ERP mapping
      await supabase
        .from('erp_map')
        .insert({
          org_id: params.orgId,
          entity_type: 'bank_account',
          entity_id: newAccount.id,
          erp_doctype: 'Bank Account',
          erp_name: erpAccount.name!,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })

      imported++
    }

    return { success: true, imported }
  } catch (error) {
    return {
      success: false,
      imported: 0,
      error: error instanceof Error ? error.message : 'Import failed',
    }
  }
}
