/**
 * Ledger Service
 * Core GL posting engine based on ERPNext's general_ledger.py
 *
 * This service handles:
 * - GL entry creation and validation
 * - Double-entry validation
 * - Account balance calculations
 * - Trial balance generation
 * - Reversing entries for cancellation
 */

import { createClient } from '@/lib/supabase/server';
import type {
  GLEntry,
  GLEntryInput,
  GLEntryFilters,
  AccountBalance,
  TrialBalanceEntry,
} from '@/lib/models/accounting/gl-entry';
import {
  toggleDebitCreditIfNegative,
  mergeSimilarGLEntries,
  validateDoubleEntry,
  createReversedGLEntry,
} from '@/lib/models/accounting/gl-entry';

// Error classes
export class AccountingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountingError';
  }
}

export class UnbalancedEntryError extends AccountingError {
  constructor(difference: number) {
    super(`Debit and Credit not equal. Difference: ${difference.toFixed(4)}`);
    this.name = 'UnbalancedEntryError';
  }
}

export class ClosedPeriodError extends AccountingError {
  constructor(date: Date) {
    super(`Cannot post to closed accounting period for date: ${date.toISOString().split('T')[0]}`);
    this.name = 'ClosedPeriodError';
  }
}

export class FrozenAccountError extends AccountingError {
  constructor(accountNames: string[]) {
    super(`Cannot post to frozen accounts: ${accountNames.join(', ')}`);
    this.name = 'FrozenAccountError';
  }
}

// Options for GL entry posting
interface MakeGLEntriesOptions {
  allowNegativeStock?: boolean;
  viaLandedCostVoucher?: boolean;
  cancelExisting?: boolean;
  skipPeriodValidation?: boolean;
}

export class LedgerService {
  /**
   * Main GL posting function - equivalent to ERPNext's make_gl_entries()
   *
   * This is the core function that creates GL entries from any source document
   * (Journal Entry, Sales Invoice, Purchase Invoice, Payment Entry, etc.)
   */
  static async makeGLEntries(
    entries: GLEntryInput[],
    options: MakeGLEntriesOptions = {}
  ): Promise<GLEntry[]> {
    if (entries.length === 0) {
      return [];
    }

    const supabase = await createClient();
    const orgId = entries[0].orgId;

    // 1. Validate accounting period is not closed
    if (!options.skipPeriodValidation) {
      await this.validateAccountingPeriod(orgId, entries[0].postingDate);
    }

    // 2. Process GL map (toggle negatives, merge duplicates)
    const processedEntries = this.processGLMap(entries);

    // 3. Validate double-entry (debits = credits)
    const validation = validateDoubleEntry(processedEntries);
    if (!validation.valid) {
      throw new UnbalancedEntryError(validation.difference);
    }

    // 4. Validate accounts are not frozen
    await this.validateDisabledAccounts(processedEntries);

    // 5. Get fiscal year for the posting date
    const fiscalYearId = await this.getFiscalYearId(orgId, entries[0].postingDate);

    // 6. Save GL entries
    const savedEntries = await this.saveEntries(processedEntries, fiscalYearId);

    return savedEntries;
  }

  /**
   * Process GL entry map - merge duplicates, handle negatives
   * Based on ERPNext's process_gl_map()
   */
  private static processGLMap(entries: GLEntryInput[]): GLEntryInput[] {
    // Toggle negative values (convert negative debit to credit and vice versa)
    const toggled = entries.map(toggleDebitCreditIfNegative);

    // Merge duplicate entries (same account, party, cost center)
    const merged = mergeSimilarGLEntries(toggled);

    return merged;
  }

  /**
   * Validate that posting date is within open accounting period
   * Based on ERPNext's validate_accounting_period()
   */
  private static async validateAccountingPeriod(
    orgId: string,
    postingDate: Date
  ): Promise<void> {
    const supabase = await createClient();
    const dateStr = postingDate.toISOString().split('T')[0];

    // Check if there's a closed period for this date
    const { data: period, error } = await supabase
      .from('accounting_periods')
      .select('status, period_name')
      .eq('org_id', orgId)
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .single();

    // If no period found, assume open (period management may not be set up)
    if (error && error.code === 'PGRST116') {
      return;
    }

    if (error) {
      console.error('Error checking accounting period:', error);
      return; // Don't block on error, let the transaction proceed
    }

    if (period && period.status !== 'open') {
      throw new ClosedPeriodError(postingDate);
    }
  }

  /**
   * Validate that none of the accounts are disabled/frozen
   * Based on ERPNext's validate_disabled_accounts()
   */
  private static async validateDisabledAccounts(entries: GLEntryInput[]): Promise<void> {
    const supabase = await createClient();
    const accountIds = [...new Set(entries.map(e => e.accountId))];

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, name, is_frozen, is_active')
      .in('id', accountIds);

    if (error) {
      console.error('Error checking accounts:', error);
      return;
    }

    const frozenAccounts = accounts?.filter(a => a.is_frozen) || [];
    if (frozenAccounts.length > 0) {
      throw new FrozenAccountError(frozenAccounts.map(a => a.name));
    }

    const inactiveAccounts = accounts?.filter(a => !a.is_active) || [];
    if (inactiveAccounts.length > 0) {
      throw new AccountingError(
        `Cannot post to inactive accounts: ${inactiveAccounts.map(a => a.name).join(', ')}`
      );
    }
  }

  /**
   * Get fiscal year ID for a given date
   */
  private static async getFiscalYearId(
    orgId: string,
    date: Date
  ): Promise<string | undefined> {
    const supabase = await createClient();
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('fiscal_years')
      .select('id')
      .eq('org_id', orgId)
      .lte('year_start_date', dateStr)
      .gte('year_end_date', dateStr)
      .single();

    if (error) {
      console.warn('No fiscal year found for date:', dateStr);
      return undefined;
    }

    return data?.id;
  }

  /**
   * Save GL entries to database
   * Based on ERPNext's save_entries()
   */
  private static async saveEntries(
    entries: GLEntryInput[],
    fiscalYearId?: string
  ): Promise<GLEntry[]> {
    const supabase = await createClient();

    const glEntries = entries.map(entry => ({
      org_id: entry.orgId,
      posting_date: entry.postingDate.toISOString().split('T')[0],
      posting_datetime: new Date().toISOString(),
      fiscal_year_id: fiscalYearId || entry.fiscalYearId,
      account_id: entry.accountId,
      account_currency: entry.accountCurrency,
      party_type: entry.partyType || null,
      party_id: entry.partyId || null,
      debit_in_account_currency: entry.debitInAccountCurrency,
      credit_in_account_currency: entry.creditInAccountCurrency,
      debit: entry.debit,
      credit: entry.credit,
      exchange_rate: entry.exchangeRate,
      voucher_type: entry.voucherType,
      voucher_id: entry.voucherId,
      voucher_no: entry.voucherNo,
      voucher_detail_id: entry.voucherDetailId || null,
      against_voucher_type: entry.againstVoucherType || null,
      against_voucher_id: entry.againstVoucherId || null,
      cost_center_id: entry.costCenterId || null,
      project_id: entry.projectId || null,
      is_opening: entry.isOpening || false,
      is_advance: entry.isAdvance || false,
      is_cancelled: false,
      remarks: entry.remarks || null,
    }));

    const { data, error } = await supabase
      .from('gl_entries')
      .insert(glEntries)
      .select();

    if (error) {
      throw new AccountingError(`Failed to save GL entries: ${error.message}`);
    }

    return (data || []).map(this.mapDbToGLEntry);
  }

  /**
   * Get account balance at a specific date
   * Based on ERPNext's get_balance_on()
   */
  static async getBalanceOn(
    accountId: string,
    date: Date,
    options: {
      partyType?: string;
      partyId?: string;
      costCenterId?: string;
      inAccountCurrency?: boolean;
    } = {}
  ): Promise<number> {
    const supabase = await createClient();
    const dateStr = date.toISOString().split('T')[0];

    let query = supabase
      .from('gl_entries')
      .select('debit, credit, debit_in_account_currency, credit_in_account_currency')
      .eq('account_id', accountId)
      .eq('is_cancelled', false)
      .lte('posting_date', dateStr);

    if (options.partyType && options.partyId) {
      query = query.eq('party_type', options.partyType).eq('party_id', options.partyId);
    }

    if (options.costCenterId) {
      query = query.eq('cost_center_id', options.costCenterId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AccountingError(`Failed to get balance: ${error.message}`);
    }

    if (options.inAccountCurrency) {
      return (data || []).reduce(
        (balance, entry) =>
          balance + entry.debit_in_account_currency - entry.credit_in_account_currency,
        0
      );
    }

    return (data || []).reduce(
      (balance, entry) => balance + entry.debit - entry.credit,
      0
    );
  }

  /**
   * Get account balances for multiple accounts
   */
  static async getAccountBalances(
    filters: GLEntryFilters
  ): Promise<AccountBalance[]> {
    const supabase = await createClient();

    let query = supabase
      .from('gl_entries')
      .select(`
        account_id,
        debit,
        credit,
        accounts!inner(code, name)
      `)
      .eq('org_id', filters.orgId)
      .eq('is_cancelled', filters.isCancelled ?? false);

    if (filters.accountIds && filters.accountIds.length > 0) {
      query = query.in('account_id', filters.accountIds);
    }

    if (filters.fromDate) {
      query = query.gte('posting_date', filters.fromDate.toISOString().split('T')[0]);
    }

    if (filters.toDate) {
      query = query.lte('posting_date', filters.toDate.toISOString().split('T')[0]);
    }

    if (filters.costCenterId) {
      query = query.eq('cost_center_id', filters.costCenterId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AccountingError(`Failed to get account balances: ${error.message}`);
    }

    // Group by account and sum
    const balanceMap = new Map<string, AccountBalance>();

    for (const entry of data || []) {
      const accountId = entry.account_id;
      const existing = balanceMap.get(accountId);

      if (existing) {
        existing.debitTotal += entry.debit;
        existing.creditTotal += entry.credit;
        existing.balance = existing.debitTotal - existing.creditTotal;
      } else {
        balanceMap.set(accountId, {
          accountId,
          accountCode: (entry as any).accounts?.code,
          accountName: (entry as any).accounts?.name,
          debitTotal: entry.debit,
          creditTotal: entry.credit,
          balance: entry.debit - entry.credit,
        });
      }
    }

    return Array.from(balanceMap.values());
  }

  /**
   * Generate trial balance report
   * Based on ERPNext's get_trial_balance()
   */
  static async getTrialBalance(
    orgId: string,
    asOfDate: Date = new Date()
  ): Promise<TrialBalanceEntry[]> {
    const supabase = await createClient();
    const dateStr = asOfDate.toISOString().split('T')[0];

    // Use the database function if available, otherwise calculate manually
    const { data, error } = await supabase.rpc('get_trial_balance', {
      p_org_id: orgId,
      p_as_of_date: dateStr,
    });

    if (error) {
      // Fallback to manual calculation
      return this.calculateTrialBalance(orgId, asOfDate);
    }

    return (data || []).map((row: any) => ({
      accountId: row.account_id,
      accountCode: row.account_code,
      accountName: row.account_name,
      accountType: row.account_type,
      rootType: row.root_type || row.account_type,
      parentId: row.parent_id,
      isGroup: row.is_group || false,
      debitTotal: parseFloat(row.total_debits) || 0,
      creditTotal: parseFloat(row.total_credits) || 0,
      balance: parseFloat(row.balance) || 0,
    }));
  }

  /**
   * Manual trial balance calculation (fallback)
   */
  private static async calculateTrialBalance(
    orgId: string,
    asOfDate: Date
  ): Promise<TrialBalanceEntry[]> {
    const supabase = await createClient();
    const dateStr = asOfDate.toISOString().split('T')[0];

    // Get all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, code, name, account_type, root_type, parent_id, is_group')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('code');

    if (accountsError) {
      throw new AccountingError(`Failed to get accounts: ${accountsError.message}`);
    }

    // Get GL entry totals
    const { data: glTotals, error: glError } = await supabase
      .from('gl_entries')
      .select('account_id, debit, credit')
      .eq('org_id', orgId)
      .eq('is_cancelled', false)
      .lte('posting_date', dateStr);

    if (glError) {
      throw new AccountingError(`Failed to get GL entries: ${glError.message}`);
    }

    // Sum by account
    const totalsMap = new Map<string, { debit: number; credit: number }>();
    for (const entry of glTotals || []) {
      const existing = totalsMap.get(entry.account_id) || { debit: 0, credit: 0 };
      existing.debit += entry.debit;
      existing.credit += entry.credit;
      totalsMap.set(entry.account_id, existing);
    }

    // Build trial balance entries
    return (accounts || []).map(account => {
      const totals = totalsMap.get(account.id) || { debit: 0, credit: 0 };
      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.account_type,
        rootType: account.root_type || account.account_type,
        parentId: account.parent_id,
        isGroup: account.is_group || false,
        debitTotal: totals.debit,
        creditTotal: totals.credit,
        balance: totals.debit - totals.credit,
      };
    });
  }

  /**
   * Create reverse GL entries for cancellation
   * Based on ERPNext's make_reverse_gl_entries()
   */
  static async makeReverseGLEntries(
    voucherType: string,
    voucherId: string
  ): Promise<void> {
    const supabase = await createClient();

    // Fetch original entries
    const { data: originalEntries, error } = await supabase
      .from('gl_entries')
      .select('*')
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId)
      .eq('is_cancelled', false);

    if (error) {
      throw new AccountingError(`Failed to fetch GL entries: ${error.message}`);
    }

    if (!originalEntries || originalEntries.length === 0) {
      return;
    }

    // Create reversed entries (swap debit/credit)
    const reversedEntries = originalEntries.map(entry => ({
      ...entry,
      id: undefined, // Generate new ID
      debit: entry.credit,
      credit: entry.debit,
      debit_in_account_currency: entry.credit_in_account_currency,
      credit_in_account_currency: entry.debit_in_account_currency,
      posting_datetime: new Date().toISOString(),
      remarks: `Reversal of ${entry.voucher_no}`,
    }));

    // Mark original entries as cancelled
    const { error: cancelError } = await supabase
      .from('gl_entries')
      .update({ is_cancelled: true })
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId);

    if (cancelError) {
      throw new AccountingError(`Failed to cancel GL entries: ${cancelError.message}`);
    }

    // Insert reversed entries
    const { error: insertError } = await supabase
      .from('gl_entries')
      .insert(reversedEntries);

    if (insertError) {
      throw new AccountingError(`Failed to insert reversed entries: ${insertError.message}`);
    }
  }

  /**
   * Get GL entries for a voucher
   */
  static async getGLEntriesForVoucher(
    voucherType: string,
    voucherId: string
  ): Promise<GLEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('gl_entries')
      .select('*')
      .eq('voucher_type', voucherType)
      .eq('voucher_id', voucherId)
      .eq('is_cancelled', false)
      .order('created_at');

    if (error) {
      throw new AccountingError(`Failed to fetch GL entries: ${error.message}`);
    }

    return (data || []).map(this.mapDbToGLEntry);
  }

  /**
   * Map database row to GLEntry type
   */
  private static mapDbToGLEntry(row: any): GLEntry {
    return {
      id: row.id,
      orgId: row.org_id,
      postingDate: new Date(row.posting_date),
      postingDatetime: new Date(row.posting_datetime),
      fiscalYearId: row.fiscal_year_id,
      accountId: row.account_id,
      accountCurrency: row.account_currency,
      partyType: row.party_type,
      partyId: row.party_id,
      debitInAccountCurrency: parseFloat(row.debit_in_account_currency) || 0,
      creditInAccountCurrency: parseFloat(row.credit_in_account_currency) || 0,
      debit: parseFloat(row.debit) || 0,
      credit: parseFloat(row.credit) || 0,
      exchangeRate: parseFloat(row.exchange_rate) || 1,
      voucherType: row.voucher_type,
      voucherId: row.voucher_id,
      voucherNo: row.voucher_no,
      voucherDetailId: row.voucher_detail_id,
      againstVoucherType: row.against_voucher_type,
      againstVoucherId: row.against_voucher_id,
      costCenterId: row.cost_center_id,
      projectId: row.project_id,
      isOpening: row.is_opening,
      isAdvance: row.is_advance,
      isCancelled: row.is_cancelled,
      remarks: row.remarks,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
    };
  }
}
