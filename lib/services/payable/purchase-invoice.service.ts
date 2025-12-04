/**
 * Purchase Invoice Service
 * Manages purchase invoice lifecycle and GL posting
 * Based on ERPNext's Purchase Invoice controller
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PurchaseInvoice,
  PurchaseInvoiceItem,
  CreatePurchaseInvoice,
  UpdatePurchaseInvoice,
  PurchaseInvoiceListFilters,
} from '@/lib/models/payable/purchase-invoice';
import {
  calculateItemAmounts,
  calculateInvoiceTotals,
} from '@/lib/models/payable/purchase-invoice';
import { LedgerService, AccountingError } from '../accounting/ledger.service';
import type { GLEntryInput } from '@/lib/models/accounting/gl-entry';
import { SupplierService } from './supplier.service';
import { calculateDueDate } from '@/lib/models/payable/supplier';

export class PurchaseInvoiceService {
  /**
   * Create a new purchase invoice (draft)
   */
  static async create(input: CreatePurchaseInvoice): Promise<PurchaseInvoice> {
    const supabase = await createClient();

    // Get supplier details
    const supplier = await SupplierService.getById(input.supplierId);

    // Calculate due date if not provided
    const dueDate = input.dueDate || calculateDueDate(
      input.postingDate,
      supplier.paymentTerms || 'Due on Receipt'
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

    // Calculate invoice totals including withholding tax
    const totals = calculateInvoiceTotals(calculatedItems, {
      invoiceDiscountAmount: input.discountAmount,
      exchangeRate: input.exchangeRate,
      applyWithholdingTax: input.applyWithholdingTax,
      withholdingTaxRate: input.withholdingTaxRate,
    });

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .insert({
        org_id: input.orgId,
        invoice_type: input.invoiceType || 'Invoice',
        supplier_invoice_no: input.supplierInvoiceNo,
        supplier_id: input.supplierId,
        supplier_name: supplier.supplierName,
        supplier_address: supplier.billingAddress
          ? `${supplier.billingAddress.addressLine1}, ${supplier.billingAddress.city}`
          : null,
        posting_date: input.postingDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        supplier_invoice_date: input.supplierInvoiceDate?.toISOString().split('T')[0],
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
        outstanding_amount: totals.netTotal,
        paid_amount: 0,
        apply_withholding_tax: input.applyWithholdingTax || false,
        withholding_tax_type: input.withholdingTaxType,
        withholding_tax_rate: input.withholdingTaxRate || 0,
        withholding_tax_amount: totals.withholdingTaxAmount,
        net_total: totals.netTotal,
        status: 'Draft',
        credit_to_account_id: input.creditToAccountId || supplier.defaultPayableAccount,
        expense_account_id: input.expenseAccountId || supplier.defaultExpenseAccount,
        cost_center_id: input.costCenterId || supplier.defaultCostCenter,
        project_id: input.projectId,
        purchase_order_id: input.purchaseOrderId,
        purchase_receipt_id: input.purchaseReceiptId,
        remarks: input.remarks,
        terms_and_conditions: input.termsAndConditions,
      })
      .select()
      .single();

    if (invoiceError) {
      throw new AccountingError(`Failed to create purchase invoice: ${invoiceError.message}`);
    }

    // Insert items
    const itemsToInsert = calculatedItems.map((item) => ({
      purchase_invoice_id: invoice.id,
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
      expense_account_id: item.expenseAccountId || input.expenseAccountId,
      is_fixed_asset: item.isFixedAsset || false,
      cost_center_id: item.costCenterId || input.costCenterId,
      warehouse_id: item.warehouseId,
    }));

    const { error: itemsError } = await supabase
      .from('purchase_invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback invoice
      await supabase.from('purchase_invoices').delete().eq('id', invoice.id);
      throw new AccountingError(`Failed to create invoice items: ${itemsError.message}`);
    }

    // Insert taxes if provided
    if (input.taxes && input.taxes.length > 0) {
      const taxesToInsert = input.taxes.map((tax, idx) => ({
        purchase_invoice_id: invoice.id,
        idx,
        account_id: tax.accountId,
        description: tax.description,
        rate: tax.rate,
        tax_amount: totals.baseTotal * (tax.rate / 100),
        base_tax_amount: totals.baseTotal * (tax.rate / 100) * (input.exchangeRate || 1),
      }));

      await supabase.from('purchase_invoice_taxes').insert(taxesToInsert);
    }

    return this.getById(invoice.id);
  }

  /**
   * Get purchase invoice by ID
   */
  static async getById(id: string): Promise<PurchaseInvoice> {
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      throw new AccountingError(`Purchase invoice not found: ${id}`);
    }

    // Get items
    const { data: items } = await supabase
      .from('purchase_invoice_items')
      .select('*')
      .eq('purchase_invoice_id', id)
      .order('idx');

    // Get taxes
    const { data: taxes } = await supabase
      .from('purchase_invoice_taxes')
      .select('*')
      .eq('purchase_invoice_id', id)
      .order('idx');

    return this.mapDbToPurchaseInvoice(invoice, items || [], taxes || []);
  }

  /**
   * List purchase invoices
   */
  static async list(filters: PurchaseInvoiceListFilters): Promise<PurchaseInvoice[]> {
    const supabase = await createClient();

    let query = supabase
      .from('purchase_invoices')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('posting_date', { ascending: false });

    if (filters.supplierId) {
      query = query.eq('supplier_id', filters.supplierId);
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

    if (filters.onHold) {
      query = query.eq('status', 'On Hold');
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new AccountingError(`Failed to list purchase invoices: ${error.message}`);
    }

    return (data || []).map(inv => this.mapDbToPurchaseInvoice(inv, [], []));
  }

  /**
   * Update purchase invoice (drafts only)
   */
  static async update(input: UpdatePurchaseInvoice): Promise<PurchaseInvoice> {
    const supabase = await createClient();

    const existing = await this.getById(input.id);

    if (existing.status !== 'Draft') {
      throw new AccountingError('Can only update draft invoices');
    }

    const updateData: any = {};

    if (input.postingDate) updateData.posting_date = input.postingDate.toISOString().split('T')[0];
    if (input.dueDate) updateData.due_date = input.dueDate.toISOString().split('T')[0];
    if (input.supplierInvoiceNo !== undefined) updateData.supplier_invoice_no = input.supplierInvoiceNo;
    if (input.supplierInvoiceDate) {
      updateData.supplier_invoice_date = input.supplierInvoiceDate.toISOString().split('T')[0];
    }
    if (input.remarks !== undefined) updateData.remarks = input.remarks;
    if (input.termsAndConditions !== undefined) updateData.terms_and_conditions = input.termsAndConditions;

    // If items are updated, recalculate totals
    if (input.items) {
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

      const totals = calculateInvoiceTotals(calculatedItems, {
        invoiceDiscountAmount: input.discountAmount ?? existing.discountAmount,
        exchangeRate: input.exchangeRate || existing.exchangeRate,
        applyWithholdingTax: input.applyWithholdingTax ?? existing.applyWithholdingTax,
        withholdingTaxRate: input.withholdingTaxRate ?? existing.withholdingTaxRate,
      });

      updateData.total_qty = totals.totalQty;
      updateData.base_total = totals.baseTotal;
      updateData.total_taxes = totals.totalTaxes;
      updateData.grand_total = totals.grandTotal;
      updateData.base_grand_total = totals.baseGrandTotal;
      updateData.withholding_tax_amount = totals.withholdingTaxAmount;
      updateData.net_total = totals.netTotal;
      updateData.outstanding_amount = totals.netTotal;

      // Delete and recreate items
      await supabase.from('purchase_invoice_items').delete().eq('purchase_invoice_id', input.id);

      const itemsToInsert = calculatedItems.map((item) => ({
        purchase_invoice_id: input.id,
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
        expense_account_id: item.expenseAccountId,
        is_fixed_asset: item.isFixedAsset || false,
        cost_center_id: item.costCenterId,
        warehouse_id: item.warehouseId,
      }));

      await supabase.from('purchase_invoice_items').insert(itemsToInsert);
    }

    const { error } = await supabase
      .from('purchase_invoices')
      .update(updateData)
      .eq('id', input.id);

    if (error) {
      throw new AccountingError(`Failed to update purchase invoice: ${error.message}`);
    }

    return this.getById(input.id);
  }

  /**
   * Submit purchase invoice - creates GL entries and updates status
   */
  static async submit(id: string, userId: string): Promise<PurchaseInvoice> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    if (invoice.status !== 'Draft') {
      throw new AccountingError('Can only submit draft invoices');
    }

    // Get accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code, name, account_type')
      .eq('org_id', invoice.orgId)
      .in('code', ['2101', '5101', '1135', '2141']);  // AP, COGS/Expense, Input VAT, WHT Payable

    const accountMap = new Map(accounts?.map(a => [a.code, a]) || []);

    const payableAccount = invoice.creditToAccountId || accountMap.get('2101')?.id;
    const expenseAccount = invoice.expenseAccountId || accountMap.get('5101')?.id;
    const inputVatAccount = accountMap.get('1135')?.id;
    const whtPayableAccount = accountMap.get('2141')?.id;

    if (!payableAccount || !expenseAccount) {
      throw new AccountingError('Required accounts not found. Please set up Chart of Accounts.');
    }

    // Build GL entries
    const glEntries: GLEntryInput[] = [];

    // Credit: Accounts Payable (net of withholding)
    const creditAmount = invoice.applyWithholdingTax ? invoice.netTotal : invoice.grandTotal;
    glEntries.push({
      orgId: invoice.orgId,
      accountId: payableAccount,
      accountCurrency: invoice.currency,
      postingDate: invoice.postingDate,
      voucherType: 'Purchase Invoice',
      voucherId: invoice.id,
      voucherNo: invoice.invoiceNumber,
      partyType: 'Supplier',
      partyId: invoice.supplierId,
      debit: 0,
      debitInAccountCurrency: 0,
      credit: creditAmount * invoice.exchangeRate,
      creditInAccountCurrency: creditAmount,
      exchangeRate: invoice.exchangeRate,
      remarks: `Purchase from ${invoice.supplierName}`,
      costCenterId: invoice.costCenterId,
      projectId: invoice.projectId,
      isOpening: false,
      isAdvance: false,
    });

    // Debit: Expense accounts (per item or summary)
    // Group by expense account
    const expenseByAccount = new Map<string, number>();
    for (const item of invoice.items || []) {
      const accId = item.expenseAccountId || expenseAccount;
      expenseByAccount.set(accId, (expenseByAccount.get(accId) || 0) + item.netAmount);
    }

    for (const [accId, amount] of expenseByAccount) {
      glEntries.push({
        orgId: invoice.orgId,
        accountId: accId,
        accountCurrency: invoice.currency,
        postingDate: invoice.postingDate,
        voucherType: 'Purchase Invoice',
        voucherId: invoice.id,
        voucherNo: invoice.invoiceNumber,
        debit: amount * invoice.exchangeRate,
        debitInAccountCurrency: amount,
        credit: 0,
        creditInAccountCurrency: 0,
        exchangeRate: invoice.exchangeRate,
        remarks: `Purchase from ${invoice.supplierName}`,
        costCenterId: invoice.costCenterId,
        projectId: invoice.projectId,
        isOpening: false,
        isAdvance: false,
      });
    }

    // Debit: Input VAT
    if (invoice.totalTaxes > 0 && inputVatAccount) {
      glEntries.push({
        orgId: invoice.orgId,
        accountId: inputVatAccount,
        accountCurrency: invoice.currency,
        postingDate: invoice.postingDate,
        voucherType: 'Purchase Invoice',
        voucherId: invoice.id,
        voucherNo: invoice.invoiceNumber,
        debit: invoice.totalTaxes * invoice.exchangeRate,
        debitInAccountCurrency: invoice.totalTaxes,
        credit: 0,
        creditInAccountCurrency: 0,
        exchangeRate: invoice.exchangeRate,
        remarks: `Input VAT - ${invoice.invoiceNumber}`,
        costCenterId: invoice.costCenterId,
        isOpening: false,
        isAdvance: false,
      });
    }

    // Credit: Withholding Tax Payable (liability to remit to BIR)
    if (invoice.withholdingTaxAmount > 0 && whtPayableAccount) {
      glEntries.push({
        orgId: invoice.orgId,
        accountId: whtPayableAccount,
        accountCurrency: invoice.currency,
        postingDate: invoice.postingDate,
        voucherType: 'Purchase Invoice',
        voucherId: invoice.id,
        voucherNo: invoice.invoiceNumber,
        partyType: 'Supplier',
        partyId: invoice.supplierId,
        debit: 0,
        debitInAccountCurrency: 0,
        credit: invoice.withholdingTaxAmount * invoice.exchangeRate,
        creditInAccountCurrency: invoice.withholdingTaxAmount,
        exchangeRate: invoice.exchangeRate,
        remarks: `WHT to remit - ${invoice.withholdingTaxType || 'EWT'}`,
        costCenterId: invoice.costCenterId,
        isOpening: false,
        isAdvance: false,
      });
    }

    // Post GL entries
    await LedgerService.makeGLEntries(glEntries);

    // Create payment ledger entry (outstanding)
    await supabase.from('payment_ledger_entries').insert({
      org_id: invoice.orgId,
      posting_date: invoice.postingDate.toISOString().split('T')[0],
      account_id: payableAccount,
      party_type: 'Supplier',
      party_id: invoice.supplierId,
      voucher_type: 'Purchase Invoice',
      voucher_id: invoice.id,
      voucher_no: invoice.invoiceNumber,
      against_voucher_type: 'Purchase Invoice',
      against_voucher_id: invoice.id,
      amount: invoice.applyWithholdingTax ? invoice.netTotal : invoice.grandTotal,
      currency: invoice.currency,
      exchange_rate: invoice.exchangeRate,
      due_date: invoice.dueDate.toISOString().split('T')[0],
    });

    // Update invoice status
    const { error: updateError } = await supabase
      .from('purchase_invoices')
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
   * Cancel purchase invoice - reverses GL entries
   */
  static async cancel(id: string, userId: string): Promise<PurchaseInvoice> {
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
    await LedgerService.makeReverseGLEntries('Purchase Invoice', id);

    // Delete payment ledger entries
    await supabase
      .from('payment_ledger_entries')
      .delete()
      .eq('voucher_type', 'Purchase Invoice')
      .eq('voucher_id', id);

    // Update status
    const { error } = await supabase
      .from('purchase_invoices')
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
   * Put invoice on hold
   */
  static async putOnHold(id: string, reason: string): Promise<PurchaseInvoice> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    if (invoice.status !== 'Submitted' && invoice.status !== 'Partly Paid') {
      throw new AccountingError('Can only put submitted or partly paid invoices on hold');
    }

    const { error } = await supabase
      .from('purchase_invoices')
      .update({
        status: 'On Hold',
        on_hold_reason: reason,
      })
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to put invoice on hold: ${error.message}`);
    }

    return this.getById(id);
  }

  /**
   * Release invoice from hold
   */
  static async releaseFromHold(id: string): Promise<PurchaseInvoice> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    if (invoice.status !== 'On Hold') {
      throw new AccountingError('Invoice is not on hold');
    }

    // Determine new status based on payments
    let newStatus = 'Submitted';
    if (invoice.paidAmount > 0 && invoice.paidAmount < invoice.grandTotal) {
      newStatus = 'Partly Paid';
    }

    const { error } = await supabase
      .from('purchase_invoices')
      .update({
        status: newStatus,
        on_hold_reason: null,
      })
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to release invoice from hold: ${error.message}`);
    }

    return this.getById(id);
  }

  /**
   * Delete purchase invoice (drafts only)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    if (invoice.status !== 'Draft') {
      throw new AccountingError('Can only delete draft invoices. Cancel submitted invoices.');
    }

    // Delete items and taxes first
    await supabase.from('purchase_invoice_taxes').delete().eq('purchase_invoice_id', id);
    await supabase.from('purchase_invoice_items').delete().eq('purchase_invoice_id', id);

    const { error } = await supabase.from('purchase_invoices').delete().eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to delete invoice: ${error.message}`);
    }
  }

  /**
   * Get overdue invoices
   */
  static async getOverdueInvoices(orgId: string): Promise<PurchaseInvoice[]> {
    return this.list({
      orgId,
      isOverdue: true,
    });
  }

  /**
   * Get invoices for a supplier
   */
  static async getBySupplier(
    orgId: string,
    supplierId: string,
    includeFullyPaid: boolean = false
  ): Promise<PurchaseInvoice[]> {
    const filters: PurchaseInvoiceListFilters = {
      orgId,
      supplierId,
    };

    if (!includeFullyPaid) {
      filters.hasOutstanding = true;
    }

    return this.list(filters);
  }

  /**
   * Update payment status based on payments made
   */
  static async updatePaymentStatus(id: string): Promise<void> {
    const supabase = await createClient();

    const invoice = await this.getById(id);

    // Get total allocated from payment ledger
    const { data: allocations } = await supabase
      .from('payment_ledger_entries')
      .select('amount')
      .eq('against_voucher_type', 'Purchase Invoice')
      .eq('against_voucher_id', id)
      .neq('voucher_type', 'Purchase Invoice');

    const totalAllocated = (allocations || []).reduce(
      (sum, a) => sum + Math.abs(parseFloat(a.amount)),
      0
    );

    const expectedAmount = invoice.applyWithholdingTax ? invoice.netTotal : invoice.grandTotal;
    const outstanding = expectedAmount - totalAllocated;

    let newStatus = invoice.status;

    // Don't change if on hold
    if (invoice.status === 'On Hold') {
      // Just update amounts
      await supabase
        .from('purchase_invoices')
        .update({
          paid_amount: totalAllocated,
          outstanding_amount: Math.max(0, outstanding),
        })
        .eq('id', id);
      return;
    }

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
      .from('purchase_invoices')
      .update({
        paid_amount: totalAllocated,
        outstanding_amount: Math.max(0, outstanding),
        status: newStatus,
      })
      .eq('id', id);
  }

  /**
   * Map database row to PurchaseInvoice type
   */
  private static mapDbToPurchaseInvoice(
    row: any,
    items: any[],
    taxes: any[]
  ): PurchaseInvoice {
    return {
      id: row.id,
      orgId: row.org_id,
      invoiceNumber: row.invoice_number,
      namingSeries: row.naming_series || 'PINV',
      supplierInvoiceNo: row.supplier_invoice_no,
      invoiceType: row.invoice_type,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      supplierAddress: row.supplier_address,
      postingDate: new Date(row.posting_date),
      dueDate: new Date(row.due_date),
      supplierInvoiceDate: row.supplier_invoice_date ? new Date(row.supplier_invoice_date) : undefined,
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
      withholdingTaxType: row.withholding_tax_type,
      withholdingTaxRate: parseFloat(row.withholding_tax_rate) || 0,
      withholdingTaxAmount: parseFloat(row.withholding_tax_amount) || 0,
      netTotal: parseFloat(row.net_total) || 0,
      status: row.status,
      isReturn: row.is_return || false,
      returnAgainst: row.return_against,
      onHoldReason: row.on_hold_reason,
      creditToAccountId: row.credit_to_account_id,
      expenseAccountId: row.expense_account_id,
      costCenterId: row.cost_center_id,
      projectId: row.project_id,
      paymentTermsTemplate: row.payment_terms_template,
      purchaseOrderId: row.purchase_order_id,
      purchaseReceiptId: row.purchase_receipt_id,
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

  private static mapDbToItem(row: any): PurchaseInvoiceItem {
    return {
      id: row.id,
      purchaseInvoiceId: row.purchase_invoice_id,
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
      expenseAccountId: row.expense_account_id,
      isFixedAsset: row.is_fixed_asset || false,
      assetId: row.asset_id,
      costCenterId: row.cost_center_id,
      projectId: row.project_id,
      warehouseId: row.warehouse_id,
      createdAt: new Date(row.created_at),
    };
  }

  private static mapDbToTax(row: any): any {
    return {
      id: row.id,
      purchaseInvoiceId: row.purchase_invoice_id,
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
