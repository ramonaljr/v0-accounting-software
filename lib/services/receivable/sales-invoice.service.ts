/**
 * Sales Invoice Service
 * Manages sales invoice lifecycle and GL posting
 * Based on ERPNext's Sales Invoice controller
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SalesInvoice,
  SalesInvoiceItem,
  CreateSalesInvoice,
  UpdateSalesInvoice,
  SalesInvoiceListFilters,
} from '@/lib/models/receivable/sales-invoice';
import {
  calculateItemAmounts,
  calculateInvoiceTotals,
} from '@/lib/models/receivable/sales-invoice';
import { LedgerService, AccountingError } from '../accounting/ledger.service';
import type { GLEntryInput } from '@/lib/models/accounting/gl-entry';
import { CustomerService } from './customer.service';
import { calculateDueDate } from '@/lib/models/receivable/customer';

export class SalesInvoiceService {
  /**
   * Create a new sales invoice (draft)
   */
  static async create(input: CreateSalesInvoice): Promise<SalesInvoice> {
    const supabase = await createClient();

    // Get customer details
    const customer = await CustomerService.getById(input.customerId);

    // Calculate due date if not provided
    const dueDate = input.dueDate || calculateDueDate(
      input.postingDate,
      customer.paymentTerms || 'Due on Receipt'
    );

    // Calculate item amounts
    const calculatedItems = input.items.map((item, idx) => {
      const amounts = calculateItemAmounts({
        qty: item.qty,
        rate: item.rate,
        discountPercentage: item.discountPercentage,
        taxRate: item.taxRate,
        exchangeRate: input.exchangeRate,
      });

      return {
        ...item,
        idx,
        ...amounts,
      };
    });

    // Calculate invoice totals
    const totals = calculateInvoiceTotals(calculatedItems, input.discountAmount, input.exchangeRate);

    // Calculate withholding if applicable
    let withholdingTaxAmount = 0;
    let netTotal = totals.grandTotal;

    if (input.applyWithholdingTax && customer.isSubjectToWht) {
      // Default withholding rate for services in PH is 2%
      const whtRate = 2;
      withholdingTaxAmount = totals.baseTotal * (whtRate / 100);
      netTotal = totals.grandTotal - withholdingTaxAmount;
    }

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('sales_invoices')
      .insert({
        org_id: input.orgId,
        invoice_type: input.invoiceType || 'Invoice',
        customer_id: input.customerId,
        customer_name: customer.customerName,
        customer_address: customer.billingAddress
          ? `${customer.billingAddress.addressLine1}, ${customer.billingAddress.city}`
          : null,
        posting_date: input.postingDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        currency: input.currency || 'PHP',
        exchange_rate: input.exchangeRate || 1,
        total_qty: totals.totalQty,
        base_total: totals.baseTotal,
        total_taxes: totals.totalTaxes,
        discount_amount: input.discountAmount || 0,
        grand_total: totals.grandTotal,
        rounded_total: Math.round(totals.grandTotal),
        rounding_adjustment: Math.round(totals.grandTotal) - totals.grandTotal,
        base_grand_total: totals.baseGrandTotal,
        outstanding_amount: netTotal,
        paid_amount: 0,
        apply_withholding_tax: input.applyWithholdingTax || false,
        withholding_tax_amount: withholdingTaxAmount,
        net_total: netTotal,
        status: 'Draft',
        debit_to_account_id: input.debitToAccountId || customer.defaultReceivableAccount,
        income_account_id: input.incomeAccountId || customer.defaultIncomeAccount,
        cost_center_id: input.costCenterId || customer.defaultCostCenter,
        project_id: input.projectId,
        sales_order_id: input.salesOrderId,
        delivery_note_id: input.deliveryNoteId,
        po_number: input.poNumber,
        po_date: input.poDate?.toISOString().split('T')[0],
        remarks: input.remarks,
        terms_and_conditions: input.termsAndConditions,
      })
      .select()
      .single();

    if (invoiceError) {
      throw new AccountingError(`Failed to create sales invoice: ${invoiceError.message}`);
    }

    // Insert items
    const itemsToInsert = calculatedItems.map((item) => ({
      sales_invoice_id: invoice.id,
      idx: item.idx,
      item_id: item.itemId,
      item_code: item.itemCode,
      item_name: item.itemName,
      description: item.description,
      qty: item.qty,
      uom: item.uom || 'Unit',
      rate: item.rate,
      amount: item.amount,
      discount_percentage: item.discountPercentage || 0,
      discount_amount: item.discountAmount,
      net_amount: item.netAmount,
      tax_rate: item.taxRate || 12,
      tax_amount: item.taxAmount,
      total_amount: item.totalAmount,
      base_rate: item.baseRate,
      base_amount: item.baseAmount,
      base_net_amount: item.baseNetAmount,
      income_account_id: item.incomeAccountId || input.incomeAccountId,
      cost_center_id: item.costCenterId || input.costCenterId,
      warehouse_id: item.warehouseId,
    }));

    const { error: itemsError } = await supabase
      .from('sales_invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback invoice
      await supabase.from('sales_invoices').delete().eq('id', invoice.id);
      throw new AccountingError(`Failed to create invoice items: ${itemsError.message}`);
    }

    // Insert taxes if provided
    if (input.taxes && input.taxes.length > 0) {
      const taxesToInsert = input.taxes.map((tax, idx) => ({
        sales_invoice_id: invoice.id,
        idx,
        account_id: tax.accountId,
        description: tax.description,
        rate: tax.rate,
        tax_amount: totals.baseTotal * (tax.rate / 100),
        base_tax_amount: totals.baseTotal * (tax.rate / 100) * (input.exchangeRate || 1),
      }));

      await supabase.from('sales_invoice_taxes').insert(taxesToInsert);
    }

    return this.getById(invoice.id);
  }

  /**
   * Get sales invoice by ID
   */
  static async getById(id: string): Promise<SalesInvoice> {
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('sales_invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      throw new AccountingError(`Sales invoice not found: ${id}`);
    }

    // Get items
    const { data: items } = await supabase
      .from('sales_invoice_items')
      .select('*')
      .eq('sales_invoice_id', id)
      .order('idx');

    // Get taxes
    const { data: taxes } = await supabase
      .from('sales_invoice_taxes')
      .select('*')
      .eq('sales_invoice_id', id)
      .order('idx');

    return this.mapDbToSalesInvoice(invoice, items || [], taxes || []);
  }

  /**
   * List sales invoices
   */
  static async list(filters: SalesInvoiceListFilters): Promise<SalesInvoice[]> {
    const supabase = await createClient();

    let query = supabase
      .from('sales_invoices')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('posting_date', { ascending: false });

    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.fromDate) {
      query = query.gte('posting_date', filters.fromDate.toISOString().split('T')[0]);
    }

    if (filters.toDate) {
      query = query.lte('posting_date', filters.toDate.toISOString().split('T')[0]);
    }

    if (filters.isOverdue) {
      const today = new Date().toISOString().split('T')[0];
      query = query
        .lt('due_date', today)
        .gt('outstanding_amount', 0)
        .neq('status', 'Cancelled');
    }

    if (filters.hasOutstanding) {
      query = query.gt('outstanding_amount', 0);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new AccountingError(`Failed to list sales invoices: ${error.message}`);
    }

    return (data || []).map(inv => this.mapDbToSalesInvoice(inv, [], []));
  }

  /**
   * Update sales invoice (drafts only)
   */
  static async update(input: UpdateSalesInvoice): Promise<SalesInvoice> {
    const supabase = await createClient();

    const existing = await this.getById(input.id);

    if (existing.status !== 'Draft') {
      throw new AccountingError('Can only update draft invoices');
    }

    // Similar to create, but update existing
    // For brevity, handle basic field updates
    const updateData: any = {};

    if (input.postingDate) updateData.posting_date = input.postingDate.toISOString().split('T')[0];
    if (input.dueDate) updateData.due_date = input.dueDate.toISOString().split('T')[0];
    if (input.remarks !== undefined) updateData.remarks = input.remarks;
    if (input.termsAndConditions !== undefined) updateData.terms_and_conditions = input.termsAndConditions;

    // If items are updated, recalculate totals
    if (input.items) {
      const customer = await CustomerService.getById(existing.customerId);

      const calculatedItems = input.items.map((item, idx) => {
        const amounts = calculateItemAmounts({
          qty: item.qty,
          rate: item.rate,
          discountPercentage: item.discountPercentage,
          taxRate: item.taxRate,
          exchangeRate: input.exchangeRate || existing.exchangeRate,
        });
        return { ...item, idx, ...amounts };
      });

      const totals = calculateInvoiceTotals(
        calculatedItems,
        input.discountAmount ?? existing.discountAmount,
        input.exchangeRate || existing.exchangeRate
      );

      updateData.total_qty = totals.totalQty;
      updateData.base_total = totals.baseTotal;
      updateData.total_taxes = totals.totalTaxes;
      updateData.grand_total = totals.grandTotal;
      updateData.base_grand_total = totals.baseGrandTotal;
      updateData.outstanding_amount = totals.grandTotal;

      // Delete and recreate items
      await supabase.from('sales_invoice_items').delete().eq('sales_invoice_id', input.id);

      const itemsToInsert = calculatedItems.map((item) => ({
        sales_invoice_id: input.id,
        idx: item.idx,
        item_id: item.itemId,
        item_code: item.itemCode,
        item_name: item.itemName,
        description: item.description,
        qty: item.qty,
        uom: item.uom || 'Unit',
        rate: item.rate,
        amount: item.amount,
        discount_percentage: item.discountPercentage || 0,
        discount_amount: item.discountAmount,
        net_amount: item.netAmount,
        tax_rate: item.taxRate || 12,
        tax_amount: item.taxAmount,
        total_amount: item.totalAmount,
        base_rate: item.baseRate,
        base_amount: item.baseAmount,
        base_net_amount: item.baseNetAmount,
        income_account_id: item.incomeAccountId,
        cost_center_id: item.costCenterId,
        warehouse_id: item.warehouseId,
      }));

      await supabase.from('sales_invoice_items').insert(itemsToInsert);
    }

    const { error } = await supabase
      .from('sales_invoices')
      .update(updateData)
      .eq('id', input.id);

    if (error) {
      throw new AccountingError(`Failed to update sales invoice: ${error.message}`);
    }

    return this.getById(input.id);
  }

  /**
   * Submit sales invoice - creates GL entries and updates status
   */
  static async submit(id: string, userId: string): Promise<SalesInvoice> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    if (invoice.status !== 'Draft') {
      throw new AccountingError('Can only submit draft invoices');
    }

    // Check credit limit
    const customer = await CustomerService.getById(invoice.customerId);
    if (customer.creditLimit > 0) {
      const creditCheck = await CustomerService.checkCreditLimit(
        invoice.customerId,
        invoice.grandTotal
      );
      if (!creditCheck.allowed) {
        throw new AccountingError(
          `Credit limit exceeded. Limit: ${customer.creditLimit}, Outstanding: ${creditCheck.outstanding}, Available: ${creditCheck.available}`
        );
      }
    }

    // Get accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code, name, account_type')
      .eq('org_id', invoice.orgId)
      .in('code', ['1111', '4101', '2121', '2131']);  // AR, Sales, Output VAT, WHT

    const accountMap = new Map(accounts?.map(a => [a.code, a]) || []);

    const receivableAccount = invoice.debitToAccountId || accountMap.get('1111')?.id;
    const incomeAccount = invoice.incomeAccountId || accountMap.get('4101')?.id;
    const outputVatAccount = accountMap.get('2121')?.id;
    const whtAccount = accountMap.get('2131')?.id;

    if (!receivableAccount || !incomeAccount) {
      throw new AccountingError('Required accounts not found. Please set up Chart of Accounts.');
    }

    // Build GL entries
    const glEntries: GLEntryInput[] = [];

    // Debit: Accounts Receivable
    glEntries.push({
      orgId: invoice.orgId,
      accountId: receivableAccount,
      postingDate: invoice.postingDate,
      voucherType: 'Sales Invoice',
      voucherId: invoice.id,
      voucherNo: invoice.invoiceNumber,
      partyType: 'Customer',
      partyId: invoice.customerId,
      debit: invoice.grandTotal,
      credit: 0,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate,
      remarks: `Sales to ${invoice.customerName}`,
      costCenterId: invoice.costCenterId,
      projectId: invoice.projectId,
    });

    // Credit: Income accounts (per item or summary)
    // Group by income account
    const incomeByAccount = new Map<string, number>();
    for (const item of invoice.items || []) {
      const accId = item.incomeAccountId || incomeAccount;
      incomeByAccount.set(accId, (incomeByAccount.get(accId) || 0) + item.netAmount);
    }

    for (const [accId, amount] of incomeByAccount) {
      glEntries.push({
        orgId: invoice.orgId,
        accountId: accId,
        postingDate: invoice.postingDate,
        voucherType: 'Sales Invoice',
        voucherId: invoice.id,
        voucherNo: invoice.invoiceNumber,
        debit: 0,
        credit: amount,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        remarks: `Sales to ${invoice.customerName}`,
        costCenterId: invoice.costCenterId,
        projectId: invoice.projectId,
      });
    }

    // Credit: Output VAT
    if (invoice.totalTaxes > 0 && outputVatAccount) {
      glEntries.push({
        orgId: invoice.orgId,
        accountId: outputVatAccount,
        postingDate: invoice.postingDate,
        voucherType: 'Sales Invoice',
        voucherId: invoice.id,
        voucherNo: invoice.invoiceNumber,
        debit: 0,
        credit: invoice.totalTaxes,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        remarks: `Output VAT - ${invoice.invoiceNumber}`,
        costCenterId: invoice.costCenterId,
      });
    }

    // Debit: Withholding Tax (reduces receivable)
    if (invoice.withholdingTaxAmount > 0 && whtAccount) {
      // Reduce AR by withholding amount
      glEntries[0].debit = invoice.netTotal;  // Adjust AR to net

      // Debit WHT asset
      glEntries.push({
        orgId: invoice.orgId,
        accountId: whtAccount,
        postingDate: invoice.postingDate,
        voucherType: 'Sales Invoice',
        voucherId: invoice.id,
        voucherNo: invoice.invoiceNumber,
        partyType: 'Customer',
        partyId: invoice.customerId,
        debit: invoice.withholdingTaxAmount,
        credit: 0,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        remarks: `WHT deducted by ${invoice.customerName}`,
        costCenterId: invoice.costCenterId,
      });
    }

    // Post GL entries
    await LedgerService.makeGLEntries(glEntries, {
      validateBalance: true,
      postingDate: invoice.postingDate,
    });

    // Create payment ledger entry (outstanding)
    await supabase.from('payment_ledger_entries').insert({
      org_id: invoice.orgId,
      posting_date: invoice.postingDate.toISOString().split('T')[0],
      account_id: receivableAccount,
      party_type: 'Customer',
      party_id: invoice.customerId,
      voucher_type: 'Sales Invoice',
      voucher_id: invoice.id,
      voucher_no: invoice.invoiceNumber,
      against_voucher_type: 'Sales Invoice',
      against_voucher_id: invoice.id,
      amount: invoice.applyWithholdingTax ? invoice.netTotal : invoice.grandTotal,
      currency: invoice.currency,
      exchange_rate: invoice.exchangeRate,
      due_date: invoice.dueDate.toISOString().split('T')[0],
    });

    // Update invoice status
    const { error: updateError } = await supabase
      .from('sales_invoices')
      .update({
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: userId,
      })
      .eq('id', id);

    if (updateError) {
      throw new AccountingError(`Failed to update invoice status: ${updateError.message}`);
    }

    return this.getById(id);
  }

  /**
   * Cancel sales invoice - reverses GL entries
   */
  static async cancel(id: string, userId: string): Promise<SalesInvoice> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    if (invoice.status === 'Draft') {
      throw new AccountingError('Cannot cancel draft invoice. Delete it instead.');
    }

    if (invoice.status === 'Cancelled') {
      throw new AccountingError('Invoice is already cancelled');
    }

    if (invoice.paidAmount > 0) {
      throw new AccountingError(
        'Cannot cancel invoice with payments. Cancel payments first.'
      );
    }

    // Reverse GL entries
    await LedgerService.makeReverseGLEntries('Sales Invoice', id);

    // Delete payment ledger entries
    await supabase
      .from('payment_ledger_entries')
      .delete()
      .eq('voucher_type', 'Sales Invoice')
      .eq('voucher_id', id);

    // Update status
    const { error } = await supabase
      .from('sales_invoices')
      .update({
        status: 'Cancelled',
        cancelled_at: new Date().toISOString(),
        outstanding_amount: 0,
      })
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to cancel invoice: ${error.message}`);
    }

    return this.getById(id);
  }

  /**
   * Delete sales invoice (drafts only)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    if (invoice.status !== 'Draft') {
      throw new AccountingError('Can only delete draft invoices. Cancel submitted invoices.');
    }

    // Delete items and taxes first
    await supabase.from('sales_invoice_taxes').delete().eq('sales_invoice_id', id);
    await supabase.from('sales_invoice_items').delete().eq('sales_invoice_id', id);

    const { error } = await supabase.from('sales_invoices').delete().eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to delete invoice: ${error.message}`);
    }
  }

  /**
   * Get overdue invoices
   */
  static async getOverdueInvoices(orgId: string): Promise<SalesInvoice[]> {
    return this.list({
      orgId,
      isOverdue: true,
    });
  }

  /**
   * Get invoices for a customer
   */
  static async getByCustomer(
    orgId: string,
    customerId: string,
    includeFullyPaid: boolean = false
  ): Promise<SalesInvoice[]> {
    const filters: SalesInvoiceListFilters = {
      orgId,
      customerId,
    };

    if (!includeFullyPaid) {
      filters.hasOutstanding = true;
    }

    return this.list(filters);
  }

  /**
   * Update payment status based on payments received
   */
  static async updatePaymentStatus(id: string): Promise<void> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    // Get total allocated from payment ledger
    const { data: allocations } = await supabase
      .from('payment_ledger_entries')
      .select('amount')
      .eq('against_voucher_type', 'Sales Invoice')
      .eq('against_voucher_id', id)
      .neq('voucher_type', 'Sales Invoice');  // Exclude the original entry

    const totalAllocated = (allocations || []).reduce(
      (sum, a) => sum + Math.abs(parseFloat(a.amount)),
      0
    );

    const expectedAmount = invoice.applyWithholdingTax ? invoice.netTotal : invoice.grandTotal;
    const outstanding = expectedAmount - totalAllocated;

    let newStatus = invoice.status;
    if (outstanding <= 0) {
      newStatus = 'Paid';
    } else if (totalAllocated > 0) {
      newStatus = 'Partly Paid';
    } else {
      // Check if overdue
      const today = new Date();
      if (invoice.dueDate < today && outstanding > 0) {
        newStatus = 'Overdue';
      } else {
        newStatus = 'Submitted';
      }
    }

    await supabase
      .from('sales_invoices')
      .update({
        paid_amount: totalAllocated,
        outstanding_amount: Math.max(0, outstanding),
        status: newStatus,
      })
      .eq('id', id);
  }

  /**
   * Map database row to SalesInvoice type
   */
  private static mapDbToSalesInvoice(
    row: any,
    items: any[],
    taxes: any[]
  ): SalesInvoice {
    return {
      id: row.id,
      orgId: row.org_id,
      invoiceNumber: row.invoice_number,
      namingSeries: row.naming_series || 'SINV',
      invoiceType: row.invoice_type,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerAddress: row.customer_address,
      postingDate: new Date(row.posting_date),
      dueDate: new Date(row.due_date),
      currency: row.currency || 'PHP',
      exchangeRate: parseFloat(row.exchange_rate) || 1,
      totalQty: parseFloat(row.total_qty) || 0,
      baseTotal: parseFloat(row.base_total) || 0,
      totalTaxes: parseFloat(row.total_taxes) || 0,
      discountAmount: parseFloat(row.discount_amount) || 0,
      grandTotal: parseFloat(row.grand_total) || 0,
      roundingAdjustment: parseFloat(row.rounding_adjustment) || 0,
      roundedTotal: parseFloat(row.rounded_total) || 0,
      baseGrandTotal: parseFloat(row.base_grand_total) || 0,
      outstandingAmount: parseFloat(row.outstanding_amount) || 0,
      paidAmount: parseFloat(row.paid_amount) || 0,
      applyWithholdingTax: row.apply_withholding_tax || false,
      withholdingTaxAmount: parseFloat(row.withholding_tax_amount) || 0,
      netTotal: parseFloat(row.net_total) || 0,
      status: row.status,
      isReturn: row.is_return || false,
      returnAgainst: row.return_against,
      debitToAccountId: row.debit_to_account_id,
      incomeAccountId: row.income_account_id,
      costCenterId: row.cost_center_id,
      projectId: row.project_id,
      paymentTermsTemplate: row.payment_terms_template,
      salesOrderId: row.sales_order_id,
      deliveryNoteId: row.delivery_note_id,
      poNumber: row.po_number,
      poDate: row.po_date ? new Date(row.po_date) : undefined,
      remarks: row.remarks,
      termsAndConditions: row.terms_and_conditions,
      items: items.map(this.mapDbToItem),
      taxes: taxes.map(this.mapDbToTax),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
      createdBy: row.created_by,
      submittedBy: row.submitted_by,
      amendedFrom: row.amended_from,
    };
  }

  private static mapDbToItem(row: any): SalesInvoiceItem {
    return {
      id: row.id,
      salesInvoiceId: row.sales_invoice_id,
      idx: row.idx,
      itemId: row.item_id,
      itemCode: row.item_code,
      itemName: row.item_name,
      description: row.description,
      qty: parseFloat(row.qty) || 0,
      uom: row.uom || 'Unit',
      conversionFactor: parseFloat(row.conversion_factor) || 1,
      stockQty: row.stock_qty ? parseFloat(row.stock_qty) : undefined,
      rate: parseFloat(row.rate) || 0,
      amount: parseFloat(row.amount) || 0,
      discountPercentage: parseFloat(row.discount_percentage) || 0,
      discountAmount: parseFloat(row.discount_amount) || 0,
      netAmount: parseFloat(row.net_amount) || 0,
      taxTemplateId: row.tax_template_id,
      taxRate: parseFloat(row.tax_rate) || 12,
      taxAmount: parseFloat(row.tax_amount) || 0,
      totalAmount: parseFloat(row.total_amount) || 0,
      baseRate: parseFloat(row.base_rate) || 0,
      baseAmount: parseFloat(row.base_amount) || 0,
      baseNetAmount: parseFloat(row.base_net_amount) || 0,
      incomeAccountId: row.income_account_id,
      expenseAccountId: row.expense_account_id,
      costCenterId: row.cost_center_id,
      projectId: row.project_id,
      warehouseId: row.warehouse_id,
      createdAt: new Date(row.created_at),
    };
  }

  private static mapDbToTax(row: any): any {
    return {
      id: row.id,
      salesInvoiceId: row.sales_invoice_id,
      idx: row.idx,
      chargeType: row.charge_type,
      accountId: row.account_id,
      description: row.description,
      rate: parseFloat(row.rate) || 0,
      taxAmount: parseFloat(row.tax_amount) || 0,
      baseTaxAmount: parseFloat(row.base_tax_amount) || 0,
      total: parseFloat(row.total) || 0,
      baseTotal: parseFloat(row.base_total) || 0,
      createdAt: new Date(row.created_at),
    };
  }
}
