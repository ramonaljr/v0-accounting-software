/**
 * ERPNext Accounts Receivable Integration
 * Sync customers, items, sales invoices, and payments
 */

import { erpnextFetch } from './client'
import { pushToERPNext, getERPMapping } from './sync'
import { createClient } from '@/lib/supabase/server'

export interface ERPNextCustomer {
  name?: string
  customer_name: string
  customer_type?: 'Company' | 'Individual'
  customer_group?: string
  territory?: string
  tax_id?: string
  email_id?: string
  mobile_no?: string
  website?: string
  payment_terms?: string
  credit_limit?: number
  disabled?: 0 | 1
}

export interface ERPNextItem {
  name?: string
  item_code: string
  item_name: string
  item_group: string
  description?: string
  is_stock_item: 0 | 1
  is_sales_item: 0 | 1
  is_purchase_item: 0 | 1
  standard_rate?: number
  income_account?: string
  expense_account?: string
  disabled?: 0 | 1
}

export interface ERPNextSalesInvoice {
  name?: string
  customer: string
  company: string
  posting_date: string
  due_date: string
  currency?: string
  items: Array<{
    item_code: string
    qty: number
    rate: number
    amount: number
    income_account?: string
  }>
  taxes?: Array<{
    charge_type: string
    account_head: string
    rate?: number
    tax_amount: number
  }>
  total: number
  grand_total: number
  outstanding_amount?: number
  status?: 'Draft' | 'Submitted' | 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled'
}

/**
 * Push customer to ERPNext
 */
export async function pushCustomerToERPNext(params: {
  orgId: string
  customerId: string
}): Promise<{ success: boolean; erpName?: string; error?: string }> {
  const supabase = await createClient()

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.customerId)
    .eq('org_id', params.orgId)
    .single()

  if (error || !customer) {
    return { success: false, error: 'Customer not found' }
  }

  const erpCustomer: ERPNextCustomer = {
    customer_name: customer.customer_name,
    customer_type: customer.customer_type === 'company' ? 'Company' : 'Individual',
    tax_id: customer.tax_id,
    email_id: customer.email,
    mobile_no: customer.phone,
    website: customer.website,
    credit_limit: customer.credit_limit,
    disabled: customer.is_active ? 0 : 1,
  }

  return pushToERPNext(
    {
      orgId: params.orgId,
      entityType: 'customer',
      entityId: params.customerId,
      erpDoctype: 'Customer',
      direction: 'push',
    },
    erpCustomer as unknown as Record<string, unknown>
  )
}

/**
 * Push sales invoice to ERPNext
 */
export async function pushSalesInvoiceToERPNext(params: {
  orgId: string
  invoiceId: string
  companyName: string
}): Promise<{ success: boolean; erpName?: string; error?: string }> {
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('sales_invoices')
    .select('*, sales_invoice_lines(*), customers(*)')
    .eq('id', params.invoiceId)
    .eq('org_id', params.orgId)
    .single()

  if (error || !invoice) {
    return { success: false, error: 'Invoice not found' }
  }

  // Get customer mapping
  const customerMapping = await getERPMapping({
    orgId: params.orgId,
    entityType: 'customer',
    entityId: invoice.customer_id,
  })

  if (!customerMapping) {
    return { success: false, error: 'Customer not synced to ERPNext' }
  }

  // Build line items
  const items = await Promise.all(
    (invoice.sales_invoice_lines || []).map(async (line: { item_id?: string; income_account_id?: string; quantity: number; unit_price: number; total_amount: number }) => {
      let itemCode = 'Miscellaneous'

      if (line.item_id) {
        const itemMapping = await getERPMapping({
          orgId: params.orgId,
          entityType: 'item',
          entityId: line.item_id,
        })
        if (itemMapping) {
          itemCode = itemMapping.erpName
        }
      }

      let incomeAccount: string | undefined

      if (line.income_account_id) {
        const accountMapping = await getERPMapping({
          orgId: params.orgId,
          entityType: 'account',
          entityId: line.income_account_id,
        })
        if (accountMapping) {
          incomeAccount = accountMapping.erpName
        }
      }

      return {
        item_code: itemCode,
        qty: Number(line.quantity),
        rate: Number(line.unit_price),
        amount: Number(line.total_amount),
        income_account: incomeAccount,
      }
    })
  )

  const erpInvoice: ERPNextSalesInvoice = {
    customer: customerMapping.erpName,
    company: params.companyName,
    posting_date: invoice.invoice_date,
    due_date: invoice.due_date,
    currency: invoice.currency,
    items,
    total: Number(invoice.subtotal),
    grand_total: Number(invoice.total_amount),
    outstanding_amount: Number(invoice.outstanding_amount),
  }

  return pushToERPNext(
    {
      orgId: params.orgId,
      entityType: 'sales_invoice',
      entityId: params.invoiceId,
      erpDoctype: 'Sales Invoice',
      direction: 'push',
    },
    erpInvoice as unknown as Record<string, unknown>
  )
}
