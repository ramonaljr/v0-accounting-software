/**
 * Bank Transaction Service
 * Manages bank transactions, categorization, and reconciliation
 */

import { createClient } from '@/lib/supabase/server';

export interface BankTransaction {
  id: string;
  orgId: string;
  bankAccountId: string;
  bankAccountName?: string;
  transactionDate: string;
  postingDate?: string;
  description: string;
  merchantName?: string;
  category?: string;
  amount: number;
  currency: string;
  transactionType: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer';
  suggestedAccountId?: string;
  suggestedAccountName?: string;
  suggestedConfidence?: number;
  assignedAccountId?: string;
  assignedAccountName?: string;
  isReconciled: boolean;
  reconciledAt?: string;
  status: 'pending' | 'categorized' | 'reconciled' | 'ignored';
  isDuplicate: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  orgId: string;
  accountName: string;
  accountNumber?: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'line_of_credit';
  bankName?: string;
  currency: string;
  isActive: boolean;
  currentBalance: number;
  availableBalance?: number;
  balanceDate?: string;
  lastSyncAt?: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  glAccountId?: string;
  glAccountName?: string;
}

export class BankTransactionService {
  /**
   * List bank transactions with filters
   */
  static async list(filters: {
    orgId: string;
    bankAccountId?: string;
    status?: string;
    isReconciled?: boolean;
    transactionType?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<BankTransaction[]> {
    const supabase = await createClient();

    let query = supabase
      .from('bank_transactions')
      .select(`
        *,
        bank_accounts (account_name),
        suggested_account:accounts!bank_transactions_suggested_account_id_fkey (account_name),
        assigned_account:accounts!bank_transactions_assigned_account_id_fkey (account_name)
      `)
      .eq('org_id', filters.orgId)
      .order('transaction_date', { ascending: false });

    if (filters.bankAccountId) {
      query = query.eq('bank_account_id', filters.bankAccountId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.isReconciled !== undefined) {
      query = query.eq('is_reconciled', filters.isReconciled);
    }

    if (filters.transactionType) {
      query = query.eq('transaction_type', filters.transactionType);
    }

    if (filters.fromDate) {
      query = query.gte('transaction_date', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('transaction_date', filters.toDate);
    }

    if (filters.search) {
      query = query.or(
        `description.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%`
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list bank transactions: ${error.message}`);
    }

    return (data || []).map(this.mapDbToTransaction);
  }

  /**
   * Get transaction by ID
   */
  static async getById(id: string): Promise<BankTransaction> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bank_transactions')
      .select(`
        *,
        bank_accounts (account_name),
        suggested_account:accounts!bank_transactions_suggested_account_id_fkey (account_name),
        assigned_account:accounts!bank_transactions_assigned_account_id_fkey (account_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error(`Bank transaction not found: ${id}`);
    }

    return this.mapDbToTransaction(data);
  }

  /**
   * Create a bank transaction
   */
  static async create(input: {
    orgId: string;
    bankAccountId: string;
    transactionDate: string;
    postingDate?: string;
    description: string;
    merchantName?: string;
    amount: number;
    currency?: string;
    transactionType: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer';
    notes?: string;
  }): Promise<BankTransaction> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        org_id: input.orgId,
        bank_account_id: input.bankAccountId,
        transaction_date: input.transactionDate,
        posting_date: input.postingDate,
        description: input.description,
        merchant_name: input.merchantName,
        amount: input.amount,
        currency: input.currency || 'PHP',
        transaction_type: input.transactionType,
        status: 'pending',
        is_reconciled: false,
        is_duplicate: false,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bank transaction: ${error.message}`);
    }

    return this.mapDbToTransaction(data);
  }

  /**
   * Categorize a transaction
   */
  static async categorize(
    id: string,
    accountId: string
  ): Promise<BankTransaction> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bank_transactions')
      .update({
        assigned_account_id: accountId,
        status: 'categorized',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to categorize transaction: ${error.message}`);
    }

    return this.mapDbToTransaction(data);
  }

  /**
   * Reconcile a transaction
   */
  static async reconcile(
    id: string,
    userId: string,
    journalEntryId?: string
  ): Promise<BankTransaction> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bank_transactions')
      .update({
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
        reconciled_by: userId,
        journal_entry_id: journalEntryId,
        status: 'reconciled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reconcile transaction: ${error.message}`);
    }

    return this.mapDbToTransaction(data);
  }

  /**
   * Ignore a transaction
   */
  static async ignore(id: string): Promise<BankTransaction> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bank_transactions')
      .update({
        status: 'ignored',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to ignore transaction: ${error.message}`);
    }

    return this.mapDbToTransaction(data);
  }

  /**
   * Get transaction statistics
   */
  static async getStats(orgId: string, bankAccountId?: string): Promise<{
    total: number;
    uncategorized: number;
    categorized: number;
    reconciled: number;
    totalCredits: number;
    totalDebits: number;
  }> {
    const supabase = await createClient();

    let query = supabase
      .from('bank_transactions')
      .select('status, transaction_type, amount')
      .eq('org_id', orgId);

    if (bankAccountId) {
      query = query.eq('bank_account_id', bankAccountId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get transaction stats: ${error.message}`);
    }

    const transactions = data || [];

    return {
      total: transactions.length,
      uncategorized: transactions.filter(t => t.status === 'pending').length,
      categorized: transactions.filter(t => t.status === 'categorized').length,
      reconciled: transactions.filter(t => t.status === 'reconciled').length,
      totalCredits: transactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0),
      totalDebits: transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0),
    };
  }

  private static mapDbToTransaction(row: any): BankTransaction {
    return {
      id: row.id,
      orgId: row.org_id,
      bankAccountId: row.bank_account_id,
      bankAccountName: row.bank_accounts?.account_name,
      transactionDate: row.transaction_date,
      postingDate: row.posting_date,
      description: row.description,
      merchantName: row.merchant_name,
      category: row.category,
      amount: parseFloat(row.amount) || 0,
      currency: row.currency || 'PHP',
      transactionType: row.transaction_type,
      suggestedAccountId: row.suggested_account_id,
      suggestedAccountName: row.suggested_account?.account_name,
      suggestedConfidence: row.suggested_confidence ? parseFloat(row.suggested_confidence) : undefined,
      assignedAccountId: row.assigned_account_id,
      assignedAccountName: row.assigned_account?.account_name,
      isReconciled: row.is_reconciled ?? false,
      reconciledAt: row.reconciled_at,
      status: row.status || 'pending',
      isDuplicate: row.is_duplicate ?? false,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export class BankAccountService {
  /**
   * List bank accounts
   */
  static async list(filters: {
    orgId: string;
    isActive?: boolean;
    accountType?: string;
  }): Promise<BankAccount[]> {
    const supabase = await createClient();

    let query = supabase
      .from('bank_accounts')
      .select(`
        *,
        accounts (account_name)
      `)
      .eq('org_id', filters.orgId)
      .order('account_name');

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.accountType) {
      query = query.eq('account_type', filters.accountType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list bank accounts: ${error.message}`);
    }

    return (data || []).map(this.mapDbToAccount);
  }

  /**
   * Get bank account by ID
   */
  static async getById(id: string): Promise<BankAccount> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bank_accounts')
      .select(`
        *,
        accounts (account_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error(`Bank account not found: ${id}`);
    }

    return this.mapDbToAccount(data);
  }

  /**
   * Create a bank account
   */
  static async create(input: {
    orgId: string;
    accountName: string;
    accountNumber?: string;
    accountType: 'checking' | 'savings' | 'credit_card' | 'line_of_credit';
    bankName?: string;
    currency?: string;
    glAccountId?: string;
    currentBalance?: number;
  }): Promise<BankAccount> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        org_id: input.orgId,
        account_name: input.accountName,
        account_number: input.accountNumber,
        account_type: input.accountType,
        bank_name: input.bankName,
        currency: input.currency || 'PHP',
        gl_account_id: input.glAccountId,
        current_balance: input.currentBalance || 0,
        is_active: true,
        integration_type: 'manual',
        sync_status: 'idle',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bank account: ${error.message}`);
    }

    return this.mapDbToAccount(data);
  }

  /**
   * Update bank balance
   */
  static async updateBalance(
    id: string,
    balance: number,
    availableBalance?: number
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('bank_accounts')
      .update({
        current_balance: balance,
        available_balance: availableBalance,
        balance_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update bank balance: ${error.message}`);
    }
  }

  private static mapDbToAccount(row: any): BankAccount {
    return {
      id: row.id,
      orgId: row.org_id,
      accountName: row.account_name,
      accountNumber: row.account_number,
      accountType: row.account_type,
      bankName: row.bank_name,
      currency: row.currency || 'PHP',
      isActive: row.is_active ?? true,
      currentBalance: parseFloat(row.current_balance) || 0,
      availableBalance: row.available_balance ? parseFloat(row.available_balance) : undefined,
      balanceDate: row.balance_date,
      lastSyncAt: row.last_sync_at,
      syncStatus: row.sync_status || 'idle',
      glAccountId: row.gl_account_id,
      glAccountName: row.accounts?.account_name,
    };
  }
}
