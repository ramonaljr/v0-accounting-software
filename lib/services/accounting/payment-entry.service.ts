/**
 * Payment Entry Service
 * Manages payments and invoice allocations
 * Based on ERPNext's Payment Entry controller
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PaymentEntry,
  PaymentEntryReference,
  CreatePaymentEntry,
  UpdatePaymentEntry,
  PaymentEntryListFilters,
} from '@/lib/models/accounting/payment-entry';
import { LedgerService, AccountingError } from './ledger.service';
import type { GLEntryInput } from '@/lib/models/accounting/gl-entry';
import { SalesInvoiceService } from '../receivable/sales-invoice.service';
import { PurchaseInvoiceService } from '../payable/purchase-invoice.service';

export class PaymentEntryService {
  /**
   * Create a new payment entry (draft)
   */
  static async create(input: CreatePaymentEntry): Promise<PaymentEntry> {
    const supabase = await createClient();

    // Validate references if provided
    let totalAllocated = 0;
    if (input.references && input.references.length > 0) {
      for (const ref of input.references) {
        totalAllocated += ref.allocatedAmount;
      }
    }

    // Calculate unallocated amount
    const unallocatedAmount = input.paidAmount - totalAllocated;

    if (unallocatedAmount < 0) {
      throw new AccountingError('Allocated amount exceeds paid amount');
    }

    // Get party name
    let partyName = '';
    if (input.partyType === 'Customer') {
      const { data: customer } = await supabase
        .from('customers')
        .select('customer_name')
        .eq('id', input.partyId)
        .single();
      partyName = customer?.customer_name || '';
    } else if (input.partyType === 'Supplier') {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('supplier_name')
        .eq('id', input.partyId)
        .single();
      partyName = supplier?.supplier_name || '';
    }

    // Insert payment entry
    const { data: payment, error: paymentError } = await supabase
      .from('payment_entries')
      .insert({
        org_id: input.orgId,
        payment_type: input.paymentType,
        posting_date: input.postingDate.toISOString().split('T')[0],
        mode_of_payment: input.modeOfPayment,
        party_type: input.partyType,
        party_id: input.partyId,
        party_name: partyName,
        paid_from_account_id: input.paidFromAccountId,
        paid_to_account_id: input.paidToAccountId,
        paid_amount: input.paidAmount,
        received_amount: input.receivedAmount || input.paidAmount,
        currency: input.currency || 'PHP',
        exchange_rate: input.exchangeRate || 1,
        target_exchange_rate: input.targetExchangeRate || 1,
        total_allocated_amount: totalAllocated,
        unallocated_amount: unallocatedAmount,
        difference_amount: input.differenceAmount || 0,
        status: 'Draft',
        reference_no: input.referenceNo,
        reference_date: input.referenceDate?.toISOString().split('T')[0],
        cost_center_id: input.costCenterId,
        remarks: input.remarks,
      })
      .select()
      .single();

    if (paymentError) {
      throw new AccountingError(`Failed to create payment entry: ${paymentError.message}`);
    }

    // Insert references if provided
    if (input.references && input.references.length > 0) {
      const refsToInsert = input.references.map((ref, idx) => ({
        payment_entry_id: payment.id,
        idx,
        reference_doctype: ref.referenceDoctype,
        reference_id: ref.referenceId,
        due_date: ref.dueDate?.toISOString().split('T')[0],
        total_amount: ref.totalAmount,
        outstanding_amount: ref.outstandingAmount,
        allocated_amount: ref.allocatedAmount,
        exchange_rate: ref.exchangeRate || 1,
      }));

      const { error: refError } = await supabase
        .from('payment_entry_references')
        .insert(refsToInsert);

      if (refError) {
        // Rollback payment
        await supabase.from('payment_entries').delete().eq('id', payment.id);
        throw new AccountingError(`Failed to create payment references: ${refError.message}`);
      }
    }

    return this.getById(payment.id);
  }

  /**
   * Get payment entry by ID
   */
  static async getById(id: string): Promise<PaymentEntry> {
    const supabase = await createClient();

    const { data: payment, error } = await supabase
      .from('payment_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payment) {
      throw new AccountingError(`Payment entry not found: ${id}`);
    }

    // Get references
    const { data: references } = await supabase
      .from('payment_entry_references')
      .select('*')
      .eq('payment_entry_id', id)
      .order('idx');

    return this.mapDbToPaymentEntry(payment, references || []);
  }

  /**
   * List payment entries
   */
  static async list(filters: PaymentEntryListFilters): Promise<PaymentEntry[]> {
    const supabase = await createClient();

    let query = supabase
      .from('payment_entries')
      .select('*')
      .eq('org_id', filters.orgId)
      .order('posting_date', { ascending: false });

    if (filters.paymentType) {
      query = query.eq('payment_type', filters.paymentType);
    }

    if (filters.partyType) {
      query = query.eq('party_type', filters.partyType);
    }

    if (filters.partyId) {
      query = query.eq('party_id', filters.partyId);
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

    if (filters.modeOfPayment) {
      query = query.eq('mode_of_payment', filters.modeOfPayment);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new AccountingError(`Failed to list payment entries: ${error.message}`);
    }

    return (data || []).map(pe => this.mapDbToPaymentEntry(pe, []));
  }

  /**
   * Update payment entry (drafts only)
   */
  static async update(input: UpdatePaymentEntry): Promise<PaymentEntry> {
    const supabase = await createClient();

    const existing = await this.getById(input.id);

    if (existing.status !== 'Draft') {
      throw new AccountingError('Can only update draft payment entries');
    }

    const updateData: any = {};

    if (input.postingDate) updateData.posting_date = input.postingDate.toISOString().split('T')[0];
    if (input.modeOfPayment !== undefined) updateData.mode_of_payment = input.modeOfPayment;
    if (input.paidAmount !== undefined) updateData.paid_amount = input.paidAmount;
    if (input.referenceNo !== undefined) updateData.reference_no = input.referenceNo;
    if (input.referenceDate) updateData.reference_date = input.referenceDate.toISOString().split('T')[0];
    if (input.remarks !== undefined) updateData.remarks = input.remarks;

    // Handle reference updates
    if (input.references) {
      let totalAllocated = 0;
      for (const ref of input.references) {
        totalAllocated += ref.allocatedAmount;
      }

      const paidAmount = input.paidAmount ?? existing.paidAmount;
      const unallocatedAmount = paidAmount - totalAllocated;

      if (unallocatedAmount < 0) {
        throw new AccountingError('Allocated amount exceeds paid amount');
      }

      updateData.total_allocated_amount = totalAllocated;
      updateData.unallocated_amount = unallocatedAmount;

      // Delete and recreate references
      await supabase.from('payment_entry_references').delete().eq('payment_entry_id', input.id);

      const refsToInsert = input.references.map((ref, idx) => ({
        payment_entry_id: input.id,
        idx,
        reference_doctype: ref.referenceDoctype,
        reference_id: ref.referenceId,
        due_date: ref.dueDate?.toISOString().split('T')[0],
        total_amount: ref.totalAmount,
        outstanding_amount: ref.outstandingAmount,
        allocated_amount: ref.allocatedAmount,
        exchange_rate: ref.exchangeRate || 1,
      }));

      await supabase.from('payment_entry_references').insert(refsToInsert);
    }

    const { error } = await supabase
      .from('payment_entries')
      .update(updateData)
      .eq('id', input.id);

    if (error) {
      throw new AccountingError(`Failed to update payment entry: ${error.message}`);
    }

    return this.getById(input.id);
  }

  /**
   * Submit payment entry - creates GL entries and updates invoices
   */
  static async submit(id: string, userId: string): Promise<PaymentEntry> {
    const supabase = await createClient();

    const payment = await this.getById(id);

    if (payment.status !== 'Draft') {
      throw new AccountingError('Can only submit draft payment entries');
    }

    // Build GL entries based on payment type
    const glEntries: GLEntryInput[] = [];

    if (payment.paymentType === 'Receive') {
      // Customer Payment: Debit Bank/Cash, Credit Receivable

      // Debit: Bank/Cash Account
      glEntries.push({
        orgId: payment.orgId,
        accountId: payment.paidToAccountId,
        postingDate: payment.postingDate,
        voucherType: 'Payment Entry',
        voucherId: payment.id,
        voucherNo: payment.paymentNumber,
        debit: payment.receivedAmount,
        credit: 0,
        currency: payment.currency,
        exchangeRate: payment.exchangeRate,
        remarks: `Payment received from ${payment.partyName}`,
        costCenterId: payment.costCenterId,
      });

      // Credit: Receivable Account
      glEntries.push({
        orgId: payment.orgId,
        accountId: payment.paidFromAccountId,
        postingDate: payment.postingDate,
        voucherType: 'Payment Entry',
        voucherId: payment.id,
        voucherNo: payment.paymentNumber,
        partyType: payment.partyType,
        partyId: payment.partyId,
        debit: 0,
        credit: payment.paidAmount,
        currency: payment.currency,
        exchangeRate: payment.exchangeRate,
        remarks: `Payment received from ${payment.partyName}`,
        costCenterId: payment.costCenterId,
      });

    } else if (payment.paymentType === 'Pay') {
      // Supplier Payment: Debit Payable, Credit Bank/Cash

      // Debit: Payable Account
      glEntries.push({
        orgId: payment.orgId,
        accountId: payment.paidFromAccountId,
        postingDate: payment.postingDate,
        voucherType: 'Payment Entry',
        voucherId: payment.id,
        voucherNo: payment.paymentNumber,
        partyType: payment.partyType,
        partyId: payment.partyId,
        debit: payment.paidAmount,
        credit: 0,
        currency: payment.currency,
        exchangeRate: payment.exchangeRate,
        remarks: `Payment made to ${payment.partyName}`,
        costCenterId: payment.costCenterId,
      });

      // Credit: Bank/Cash Account
      glEntries.push({
        orgId: payment.orgId,
        accountId: payment.paidToAccountId,
        postingDate: payment.postingDate,
        voucherType: 'Payment Entry',
        voucherId: payment.id,
        voucherNo: payment.paymentNumber,
        debit: 0,
        credit: payment.receivedAmount,
        currency: payment.currency,
        exchangeRate: payment.exchangeRate,
        remarks: `Payment made to ${payment.partyName}`,
        costCenterId: payment.costCenterId,
      });

    } else if (payment.paymentType === 'Internal Transfer') {
      // Internal Transfer: Debit To Account, Credit From Account

      glEntries.push({
        orgId: payment.orgId,
        accountId: payment.paidToAccountId,
        postingDate: payment.postingDate,
        voucherType: 'Payment Entry',
        voucherId: payment.id,
        voucherNo: payment.paymentNumber,
        debit: payment.receivedAmount,
        credit: 0,
        currency: payment.currency,
        exchangeRate: payment.targetExchangeRate,
        remarks: 'Internal fund transfer',
        costCenterId: payment.costCenterId,
      });

      glEntries.push({
        orgId: payment.orgId,
        accountId: payment.paidFromAccountId,
        postingDate: payment.postingDate,
        voucherType: 'Payment Entry',
        voucherId: payment.id,
        voucherNo: payment.paymentNumber,
        debit: 0,
        credit: payment.paidAmount,
        currency: payment.currency,
        exchangeRate: payment.exchangeRate,
        remarks: 'Internal fund transfer',
        costCenterId: payment.costCenterId,
      });
    }

    // Handle exchange rate difference
    if (payment.differenceAmount !== 0) {
      // Get exchange gain/loss account
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('org_id', payment.orgId)
        .eq('code', payment.differenceAmount > 0 ? '4501' : '6201')  // Exchange gain or loss
        .single();

      if (accounts) {
        glEntries.push({
          orgId: payment.orgId,
          accountId: accounts.id,
          postingDate: payment.postingDate,
          voucherType: 'Payment Entry',
          voucherId: payment.id,
          voucherNo: payment.paymentNumber,
          debit: payment.differenceAmount < 0 ? Math.abs(payment.differenceAmount) : 0,
          credit: payment.differenceAmount > 0 ? payment.differenceAmount : 0,
          currency: payment.currency,
          exchangeRate: payment.exchangeRate,
          remarks: 'Exchange gain/loss',
          costCenterId: payment.costCenterId,
        });
      }
    }

    // Post GL entries
    await LedgerService.makeGLEntries(glEntries, {
      validateBalance: true,
      postingDate: payment.postingDate,
    });

    // Create payment ledger entries for allocations
    if (payment.references && payment.references.length > 0) {
      for (const ref of payment.references) {
        // Create allocation entry (negative to offset outstanding)
        await supabase.from('payment_ledger_entries').insert({
          org_id: payment.orgId,
          posting_date: payment.postingDate.toISOString().split('T')[0],
          account_id: payment.paymentType === 'Receive'
            ? payment.paidFromAccountId
            : payment.paidFromAccountId,
          party_type: payment.partyType,
          party_id: payment.partyId,
          voucher_type: 'Payment Entry',
          voucher_id: payment.id,
          voucher_no: payment.paymentNumber,
          against_voucher_type: ref.referenceDoctype,
          against_voucher_id: ref.referenceId,
          amount: -ref.allocatedAmount,  // Negative to reduce outstanding
          currency: payment.currency,
          exchange_rate: ref.exchangeRate,
        });

        // Update invoice payment status
        if (ref.referenceDoctype === 'Sales Invoice') {
          await SalesInvoiceService.updatePaymentStatus(ref.referenceId);
        } else if (ref.referenceDoctype === 'Purchase Invoice') {
          await PurchaseInvoiceService.updatePaymentStatus(ref.referenceId);
        }
      }
    }

    // Handle unallocated amount (advance payment)
    if (payment.unallocatedAmount > 0) {
      await supabase.from('payment_ledger_entries').insert({
        org_id: payment.orgId,
        posting_date: payment.postingDate.toISOString().split('T')[0],
        account_id: payment.paymentType === 'Receive'
          ? payment.paidFromAccountId
          : payment.paidFromAccountId,
        party_type: payment.partyType,
        party_id: payment.partyId,
        voucher_type: 'Payment Entry',
        voucher_id: payment.id,
        voucher_no: payment.paymentNumber,
        against_voucher_type: 'Payment Entry',
        against_voucher_id: payment.id,
        amount: -payment.unallocatedAmount,  // Negative = advance/credit
        currency: payment.currency,
        exchange_rate: payment.exchangeRate,
      });
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payment_entries')
      .update({
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: userId,
      })
      .eq('id', id);

    if (updateError) {
      throw new AccountingError(`Failed to update payment status: ${updateError.message}`);
    }

    return this.getById(id);
  }

  /**
   * Cancel payment entry - reverses GL entries and allocations
   */
  static async cancel(id: string, userId: string): Promise<PaymentEntry> {
    const supabase = await createClient();

    const payment = await this.getById(id);

    if (payment.status === 'Draft') {
      throw new AccountingError('Cannot cancel draft payment. Delete it instead.');
    }

    if (payment.status === 'Cancelled') {
      throw new AccountingError('Payment is already cancelled');
    }

    // Reverse GL entries
    await LedgerService.makeReverseGLEntries('Payment Entry', id);

    // Delete payment ledger entries
    await supabase
      .from('payment_ledger_entries')
      .delete()
      .eq('voucher_type', 'Payment Entry')
      .eq('voucher_id', id);

    // Update invoice payment statuses
    if (payment.references) {
      for (const ref of payment.references) {
        if (ref.referenceDoctype === 'Sales Invoice') {
          await SalesInvoiceService.updatePaymentStatus(ref.referenceId);
        } else if (ref.referenceDoctype === 'Purchase Invoice') {
          await PurchaseInvoiceService.updatePaymentStatus(ref.referenceId);
        }
      }
    }

    // Update payment status
    const { error } = await supabase
      .from('payment_entries')
      .update({
        status: 'Cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to cancel payment: ${error.message}`);
    }

    return this.getById(id);
  }

  /**
   * Delete payment entry (drafts only)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const payment = await this.getById(id);

    if (payment.status !== 'Draft') {
      throw new AccountingError('Can only delete draft payments. Cancel submitted payments.');
    }

    // Delete references first
    await supabase.from('payment_entry_references').delete().eq('payment_entry_id', id);

    const { error } = await supabase.from('payment_entries').delete().eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to delete payment: ${error.message}`);
    }
  }

  /**
   * Get outstanding invoices for a party (for payment allocation)
   */
  static async getOutstandingInvoices(
    orgId: string,
    partyType: 'Customer' | 'Supplier',
    partyId: string
  ): Promise<Array<{
    doctype: string;
    id: string;
    invoiceNumber: string;
    postingDate: Date;
    dueDate: Date;
    totalAmount: number;
    outstandingAmount: number;
  }>> {
    const supabase = await createClient();

    if (partyType === 'Customer') {
      const { data } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, posting_date, due_date, grand_total, outstanding_amount')
        .eq('org_id', orgId)
        .eq('customer_id', partyId)
        .gt('outstanding_amount', 0)
        .in('status', ['Submitted', 'Partly Paid', 'Overdue'])
        .order('due_date');

      return (data || []).map(inv => ({
        doctype: 'Sales Invoice',
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        postingDate: new Date(inv.posting_date),
        dueDate: new Date(inv.due_date),
        totalAmount: parseFloat(inv.grand_total),
        outstandingAmount: parseFloat(inv.outstanding_amount),
      }));
    } else {
      const { data } = await supabase
        .from('purchase_invoices')
        .select('id, invoice_number, posting_date, due_date, grand_total, outstanding_amount')
        .eq('org_id', orgId)
        .eq('supplier_id', partyId)
        .gt('outstanding_amount', 0)
        .in('status', ['Submitted', 'Partly Paid', 'Overdue'])
        .order('due_date');

      return (data || []).map(inv => ({
        doctype: 'Purchase Invoice',
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        postingDate: new Date(inv.posting_date),
        dueDate: new Date(inv.due_date),
        totalAmount: parseFloat(inv.grand_total),
        outstandingAmount: parseFloat(inv.outstanding_amount),
      }));
    }
  }

  /**
   * Get unallocated payments for a party (advances)
   */
  static async getUnallocatedPayments(
    orgId: string,
    partyType: 'Customer' | 'Supplier',
    partyId: string
  ): Promise<Array<{
    id: string;
    paymentNumber: string;
    postingDate: Date;
    unallocatedAmount: number;
  }>> {
    const supabase = await createClient();

    const paymentType = partyType === 'Customer' ? 'Receive' : 'Pay';

    const { data } = await supabase
      .from('payment_entries')
      .select('id, payment_number, posting_date, unallocated_amount')
      .eq('org_id', orgId)
      .eq('party_type', partyType)
      .eq('party_id', partyId)
      .eq('payment_type', paymentType)
      .gt('unallocated_amount', 0)
      .eq('status', 'Submitted')
      .order('posting_date');

    return (data || []).map(pe => ({
      id: pe.id,
      paymentNumber: pe.payment_number,
      postingDate: new Date(pe.posting_date),
      unallocatedAmount: parseFloat(pe.unallocated_amount),
    }));
  }

  /**
   * Reconcile unallocated payment to invoices
   */
  static async reconcilePayment(
    paymentId: string,
    allocations: Array<{
      referenceDoctype: string;
      referenceId: string;
      allocatedAmount: number;
    }>,
    userId: string
  ): Promise<PaymentEntry> {
    const supabase = await createClient();

    const payment = await this.getById(paymentId);

    if (payment.status !== 'Submitted') {
      throw new AccountingError('Can only reconcile submitted payments');
    }

    // Calculate total to allocate
    const totalToAllocate = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

    if (totalToAllocate > payment.unallocatedAmount) {
      throw new AccountingError(
        `Cannot allocate more than unallocated amount (${payment.unallocatedAmount})`
      );
    }

    // Create payment ledger entries for new allocations
    for (const alloc of allocations) {
      // Get invoice details for due date
      let dueDate: Date | undefined;
      if (alloc.referenceDoctype === 'Sales Invoice') {
        const invoice = await SalesInvoiceService.getById(alloc.referenceId);
        dueDate = invoice.dueDate;
      } else if (alloc.referenceDoctype === 'Purchase Invoice') {
        const invoice = await PurchaseInvoiceService.getById(alloc.referenceId);
        dueDate = invoice.dueDate;
      }

      // Insert payment reference
      await supabase.from('payment_entry_references').insert({
        payment_entry_id: paymentId,
        idx: (payment.references?.length || 0) + 1,
        reference_doctype: alloc.referenceDoctype,
        reference_id: alloc.referenceId,
        allocated_amount: alloc.allocatedAmount,
        due_date: dueDate?.toISOString().split('T')[0],
        exchange_rate: payment.exchangeRate,
      });

      // Create allocation entry in payment ledger
      await supabase.from('payment_ledger_entries').insert({
        org_id: payment.orgId,
        posting_date: payment.postingDate.toISOString().split('T')[0],
        account_id: payment.paidFromAccountId,
        party_type: payment.partyType,
        party_id: payment.partyId,
        voucher_type: 'Payment Entry',
        voucher_id: payment.id,
        voucher_no: payment.paymentNumber,
        against_voucher_type: alloc.referenceDoctype,
        against_voucher_id: alloc.referenceId,
        amount: -alloc.allocatedAmount,
        currency: payment.currency,
        exchange_rate: payment.exchangeRate,
      });

      // Update invoice payment status
      if (alloc.referenceDoctype === 'Sales Invoice') {
        await SalesInvoiceService.updatePaymentStatus(alloc.referenceId);
      } else if (alloc.referenceDoctype === 'Purchase Invoice') {
        await PurchaseInvoiceService.updatePaymentStatus(alloc.referenceId);
      }
    }

    // Remove old advance entry and create new one with reduced amount
    await supabase
      .from('payment_ledger_entries')
      .delete()
      .eq('voucher_type', 'Payment Entry')
      .eq('voucher_id', paymentId)
      .eq('against_voucher_type', 'Payment Entry')
      .eq('against_voucher_id', paymentId);

    const newUnallocated = payment.unallocatedAmount - totalToAllocate;

    if (newUnallocated > 0) {
      await supabase.from('payment_ledger_entries').insert({
        org_id: payment.orgId,
        posting_date: payment.postingDate.toISOString().split('T')[0],
        account_id: payment.paidFromAccountId,
        party_type: payment.partyType,
        party_id: payment.partyId,
        voucher_type: 'Payment Entry',
        voucher_id: payment.id,
        voucher_no: payment.paymentNumber,
        against_voucher_type: 'Payment Entry',
        against_voucher_id: payment.id,
        amount: -newUnallocated,
        currency: payment.currency,
        exchange_rate: payment.exchangeRate,
      });
    }

    // Update payment totals
    await supabase
      .from('payment_entries')
      .update({
        total_allocated_amount: payment.totalAllocatedAmount + totalToAllocate,
        unallocated_amount: newUnallocated,
      })
      .eq('id', paymentId);

    return this.getById(paymentId);
  }

  /**
   * Map database row to PaymentEntry type
   */
  private static mapDbToPaymentEntry(row: any, references: any[]): PaymentEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      paymentNumber: row.payment_number,
      namingSeries: row.naming_series || 'PAY',
      paymentType: row.payment_type,
      postingDate: new Date(row.posting_date),
      modeOfPayment: row.mode_of_payment,
      partyType: row.party_type,
      partyId: row.party_id,
      partyName: row.party_name,
      paidFromAccountId: row.paid_from_account_id,
      paidToAccountId: row.paid_to_account_id,
      paidAmount: parseFloat(row.paid_amount) || 0,
      receivedAmount: parseFloat(row.received_amount) || 0,
      currency: row.currency || 'PHP',
      exchangeRate: parseFloat(row.exchange_rate) || 1,
      targetExchangeRate: parseFloat(row.target_exchange_rate) || 1,
      totalAllocatedAmount: parseFloat(row.total_allocated_amount) || 0,
      unallocatedAmount: parseFloat(row.unallocated_amount) || 0,
      differenceAmount: parseFloat(row.difference_amount) || 0,
      status: row.status,
      referenceNo: row.reference_no,
      referenceDate: row.reference_date ? new Date(row.reference_date) : undefined,
      costCenterId: row.cost_center_id,
      remarks: row.remarks,
      references: references.map(this.mapDbToReference),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
      createdBy: row.created_by,
      submittedBy: row.submitted_by,
    };
  }

  private static mapDbToReference(row: any): PaymentEntryReference {
    return {
      id: row.id,
      paymentEntryId: row.payment_entry_id,
      idx: row.idx,
      referenceDoctype: row.reference_doctype,
      referenceId: row.reference_id,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      totalAmount: parseFloat(row.total_amount) || 0,
      outstandingAmount: parseFloat(row.outstanding_amount) || 0,
      allocatedAmount: parseFloat(row.allocated_amount) || 0,
      exchangeRate: parseFloat(row.exchange_rate) || 1,
      createdAt: new Date(row.created_at),
    };
  }
}
