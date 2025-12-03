/**
 * Journal Entry Service
 * Based on ERPNext's Journal Entry controller
 *
 * Handles the complete lifecycle of journal entries:
 * - Creation and validation
 * - Submission (posting to GL)
 * - Cancellation (reverse GL entries)
 * - Amendment
 */

import { createClient } from '@/lib/supabase/server';
import type {
  JournalEntry,
  JournalEntryAccount,
  CreateJournalEntry,
  UpdateJournalEntry,
} from '@/lib/models/accounting/journal-entry';
import { calculateJournalEntryTotals, generateAgainstAccounts } from '@/lib/models/accounting/journal-entry';
import type { GLEntryInput } from '@/lib/models/accounting/gl-entry';
import { LedgerService, AccountingError } from './ledger.service';

export class JournalEntryService {
  /**
   * Create a new journal entry (draft)
   */
  static async create(input: CreateJournalEntry): Promise<JournalEntry> {
    const supabase = await createClient();

    // Validate the entry is balanced
    const totals = calculateJournalEntryTotals(
      input.accounts.map(a => ({
        debit: a.debit,
        credit: a.credit,
        baseDebit: a.debit * (a.exchangeRate || 1),
        baseCredit: a.credit * (a.exchangeRate || 1),
      }))
    );

    if (!totals.isBalanced) {
      throw new AccountingError(
        `Journal entry is not balanced. Difference: ${totals.difference.toFixed(4)}`
      );
    }

    // Get account names for against_account field
    const accountIds = input.accounts.map(a => a.accountId);
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name')
      .in('id', accountIds);

    const accountNames: Record<string, string> = {};
    for (const account of accounts || []) {
      accountNames[account.id] = account.name;
    }

    const againstAccounts = generateAgainstAccounts(input.accounts, accountNames);

    // Create the journal entry header
    const { data: journalEntry, error: headerError } = await supabase
      .from('journal_entries')
      .insert({
        org_id: input.orgId,
        entry_date: input.entryDate.toISOString().split('T')[0],
        voucher_type: input.voucherType || 'Journal Entry',
        description: input.description,
        reference: input.reference || null,
        source: input.source || 'manual',
        source_id: input.sourceId || null,
        is_multi_currency: input.isMultiCurrency || false,
        total_debit: totals.totalDebit,
        total_credit: totals.totalCredit,
        status: 'Draft',
        is_posted: false,
        is_locked: false,
      })
      .select()
      .single();

    if (headerError) {
      throw new AccountingError(`Failed to create journal entry: ${headerError.message}`);
    }

    // Create the journal entry lines
    const lines = input.accounts.map((account, idx) => ({
      journal_entry_id: journalEntry.id,
      org_id: input.orgId,
      idx,
      account_id: account.accountId,
      party_type: account.partyType || null,
      party_id: account.partyId || null,
      debit: account.debit,
      credit: account.credit,
      base_debit: account.debit * (account.exchangeRate || 1),
      base_credit: account.credit * (account.exchangeRate || 1),
      fx_rate: account.exchangeRate || 1,
      currency: account.currency || 'PHP',
      cost_center_id: account.costCenterId || null,
      project_id: account.projectId || null,
      against_account: againstAccounts[account.accountId] || null,
      description: account.description || null,
    }));

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(lines);

    if (linesError) {
      // Rollback the header
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
      throw new AccountingError(`Failed to create journal entry lines: ${linesError.message}`);
    }

    return this.getById(journalEntry.id);
  }

  /**
   * Get a journal entry by ID with its lines
   */
  static async getById(id: string): Promise<JournalEntry> {
    const supabase = await createClient();

    const { data: journalEntry, error: headerError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (headerError || !journalEntry) {
      throw new AccountingError(`Journal entry not found: ${id}`);
    }

    const { data: lines, error: linesError } = await supabase
      .from('journal_entry_lines')
      .select('*')
      .eq('journal_entry_id', id)
      .order('idx');

    if (linesError) {
      throw new AccountingError(`Failed to fetch journal entry lines: ${linesError.message}`);
    }

    return this.mapDbToJournalEntry(journalEntry, lines || []);
  }

  /**
   * List journal entries with filters
   */
  static async list(options: {
    orgId: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: JournalEntry[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('org_id', options.orgId)
      .order('entry_date', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.fromDate) {
      query = query.gte('entry_date', options.fromDate.toISOString().split('T')[0]);
    }

    if (options.toDate) {
      query = query.lte('entry_date', options.toDate.toISOString().split('T')[0]);
    }

    if (options.source) {
      query = query.eq('source', options.source);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new AccountingError(`Failed to list journal entries: ${error.message}`);
    }

    // Fetch lines for all entries
    const entryIds = (data || []).map(e => e.id);
    const { data: allLines } = await supabase
      .from('journal_entry_lines')
      .select('*')
      .in('journal_entry_id', entryIds)
      .order('idx');

    const linesByEntry = new Map<string, any[]>();
    for (const line of allLines || []) {
      const existing = linesByEntry.get(line.journal_entry_id) || [];
      existing.push(line);
      linesByEntry.set(line.journal_entry_id, existing);
    }

    const entries = (data || []).map(entry =>
      this.mapDbToJournalEntry(entry, linesByEntry.get(entry.id) || [])
    );

    return { entries, total: count || 0 };
  }

  /**
   * Update a draft journal entry
   */
  static async update(input: UpdateJournalEntry): Promise<JournalEntry> {
    const supabase = await createClient();

    // Check if entry exists and is not posted
    const existing = await this.getById(input.id);
    if (existing.status !== 'Draft') {
      throw new AccountingError('Cannot update a posted or cancelled journal entry');
    }

    // If accounts are being updated, validate balance
    if (input.accounts) {
      const totals = calculateJournalEntryTotals(
        input.accounts.map(a => ({
          debit: a.debit,
          credit: a.credit,
          baseDebit: a.debit * (a.exchangeRate || 1),
          baseCredit: a.credit * (a.exchangeRate || 1),
        }))
      );

      if (!totals.isBalanced) {
        throw new AccountingError(
          `Journal entry is not balanced. Difference: ${totals.difference.toFixed(4)}`
        );
      }

      // Delete existing lines
      await supabase
        .from('journal_entry_lines')
        .delete()
        .eq('journal_entry_id', input.id);

      // Get account names for against_account field
      const accountIds = input.accounts.map(a => a.accountId);
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name')
        .in('id', accountIds);

      const accountNames: Record<string, string> = {};
      for (const account of accounts || []) {
        accountNames[account.id] = account.name;
      }

      const againstAccounts = generateAgainstAccounts(input.accounts, accountNames);

      // Insert new lines
      const lines = input.accounts.map((account, idx) => ({
        journal_entry_id: input.id,
        org_id: existing.orgId,
        idx,
        account_id: account.accountId,
        party_type: account.partyType || null,
        party_id: account.partyId || null,
        debit: account.debit,
        credit: account.credit,
        base_debit: account.debit * (account.exchangeRate || 1),
        base_credit: account.credit * (account.exchangeRate || 1),
        fx_rate: account.exchangeRate || 1,
        currency: account.currency || 'PHP',
        cost_center_id: account.costCenterId || null,
        project_id: account.projectId || null,
        against_account: againstAccounts[account.accountId] || null,
        description: account.description || null,
      }));

      await supabase.from('journal_entry_lines').insert(lines);

      // Update header totals
      await supabase
        .from('journal_entries')
        .update({
          total_debit: totals.totalDebit,
          total_credit: totals.totalCredit,
        })
        .eq('id', input.id);
    }

    // Update other header fields
    const updateData: any = {};
    if (input.entryDate) updateData.entry_date = input.entryDate.toISOString().split('T')[0];
    if (input.voucherType) updateData.voucher_type = input.voucherType;
    if (input.description) updateData.description = input.description;
    if (input.reference !== undefined) updateData.reference = input.reference;
    if (input.isMultiCurrency !== undefined) updateData.is_multi_currency = input.isMultiCurrency;

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', input.id);
    }

    return this.getById(input.id);
  }

  /**
   * Submit (post) a journal entry
   * Creates GL entries and marks the journal entry as posted
   */
  static async submit(id: string, userId: string): Promise<JournalEntry> {
    const supabase = await createClient();

    // Get the journal entry
    const journalEntry = await this.getById(id);

    if (journalEntry.status !== 'Draft') {
      throw new AccountingError('Only draft journal entries can be submitted');
    }

    // Validate totals are balanced
    const totals = calculateJournalEntryTotals(
      journalEntry.accounts?.map(a => ({
        debit: a.debit,
        credit: a.credit,
        baseDebit: a.baseDebit,
        baseCredit: a.baseCredit,
      })) || []
    );

    if (!totals.isBalanced) {
      throw new AccountingError(
        `Journal entry is not balanced. Difference: ${totals.difference.toFixed(4)}`
      );
    }

    // Create GL entries
    const glEntries: GLEntryInput[] = (journalEntry.accounts || []).map(account => ({
      orgId: journalEntry.orgId,
      postingDate: journalEntry.entryDate,
      accountId: account.accountId,
      accountCurrency: account.currency,
      partyType: account.partyType,
      partyId: account.partyId,
      debitInAccountCurrency: account.debit,
      creditInAccountCurrency: account.credit,
      debit: account.baseDebit,
      credit: account.baseCredit,
      exchangeRate: account.exchangeRate,
      voucherType: 'Journal Entry',
      voucherId: journalEntry.id,
      voucherNo: journalEntry.entryNumber,
      voucherDetailId: account.id,
      costCenterId: account.costCenterId,
      projectId: account.projectId,
      isOpening: journalEntry.voucherType === 'Opening Entry',
      remarks: account.description || journalEntry.description,
    }));

    await LedgerService.makeGLEntries(glEntries);

    // Update journal entry status
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({
        status: 'Submitted',
        is_posted: true,
        posting_date: new Date().toISOString().split('T')[0],
        posted_at: new Date().toISOString(),
        posted_by: userId,
      })
      .eq('id', id);

    if (updateError) {
      throw new AccountingError(`Failed to update journal entry status: ${updateError.message}`);
    }

    return this.getById(id);
  }

  /**
   * Cancel a journal entry
   * Creates reverse GL entries and marks the journal entry as cancelled
   */
  static async cancel(id: string, userId: string): Promise<JournalEntry> {
    const supabase = await createClient();

    // Get the journal entry
    const journalEntry = await this.getById(id);

    if (journalEntry.status !== 'Submitted') {
      throw new AccountingError('Only submitted journal entries can be cancelled');
    }

    if (journalEntry.isLocked) {
      throw new AccountingError('Cannot cancel a locked journal entry');
    }

    // Create reverse GL entries
    await LedgerService.makeReverseGLEntries('Journal Entry', id);

    // Update journal entry status
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({
        status: 'Cancelled',
        is_posted: false,
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
      })
      .eq('id', id);

    if (updateError) {
      throw new AccountingError(`Failed to cancel journal entry: ${updateError.message}`);
    }

    return this.getById(id);
  }

  /**
   * Delete a draft journal entry
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    // Check if entry exists and is a draft
    const existing = await this.getById(id);
    if (existing.status !== 'Draft') {
      throw new AccountingError('Only draft journal entries can be deleted');
    }

    // Delete lines first (cascade should handle this, but being explicit)
    await supabase
      .from('journal_entry_lines')
      .delete()
      .eq('journal_entry_id', id);

    // Delete the header
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to delete journal entry: ${error.message}`);
    }
  }

  /**
   * Map database row to JournalEntry type
   */
  private static mapDbToJournalEntry(header: any, lines: any[]): JournalEntry {
    return {
      id: header.id,
      orgId: header.org_id,
      entryNumber: header.entry_number,
      namingSeries: header.naming_series || 'JE',
      entryDate: new Date(header.entry_date),
      postingDate: header.posting_date ? new Date(header.posting_date) : undefined,
      voucherType: header.voucher_type || 'Journal Entry',
      description: header.description,
      totalDebit: parseFloat(header.total_debit) || 0,
      totalCredit: parseFloat(header.total_credit) || 0,
      isMultiCurrency: header.is_multi_currency || false,
      status: header.status || 'Draft',
      isPosted: header.is_posted || false,
      isLocked: header.is_locked || false,
      source: header.source || 'manual',
      sourceId: header.source_id,
      reference: header.reference,
      writeOffAccountId: header.write_off_account_id,
      writeOffAmount: header.write_off_amount,
      fiscalYearId: header.fiscal_year_id,
      amendedFrom: header.amended_from,
      accounts: lines.map(line => ({
        id: line.id,
        journalEntryId: line.journal_entry_id,
        orgId: line.org_id,
        idx: line.idx || 0,
        accountId: line.account_id,
        partyType: line.party_type,
        partyId: line.party_id,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
        baseDebit: parseFloat(line.base_debit) || 0,
        baseCredit: parseFloat(line.base_credit) || 0,
        exchangeRate: parseFloat(line.fx_rate) || 1,
        currency: line.currency || 'PHP',
        fxRate: parseFloat(line.fx_rate) || 1,
        costCenterId: line.cost_center_id,
        projectId: line.project_id,
        dimension1: line.dimension_1,
        dimension2: line.dimension_2,
        againstAccount: line.against_account,
        referenceType: line.reference_type,
        referenceId: line.reference_id,
        description: line.description,
        createdAt: new Date(line.created_at),
      })),
      createdAt: new Date(header.created_at),
      updatedAt: new Date(header.updated_at),
      postedAt: header.posted_at ? new Date(header.posted_at) : undefined,
      cancelledAt: header.cancelled_at ? new Date(header.cancelled_at) : undefined,
      createdBy: header.created_by,
      postedBy: header.posted_by,
      cancelledBy: header.cancelled_by,
    };
  }
}
