'use server';

/**
 * Banking Server Actions
 * Server-side actions for bank accounts and transactions
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { BankTransactionService, BankAccountService } from '@/lib/services/banking';

// =============================================
// HELPER: Get current org and user
// =============================================

async function getCurrentOrg(): Promise<{ orgId: string | null; userId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { orgId: null, userId: null };

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return {
    orgId: membership?.org_id ?? null,
    userId: user.id,
  };
}

// =============================================
// ACTION RESULT TYPE
// =============================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// BANK ACCOUNT ACTIONS
// =============================================

/**
 * List bank accounts
 */
export async function listBankAccounts(options?: {
  isActive?: boolean;
  accountType?: string;
}): Promise<ActionResult> {
  try {
    const { orgId } = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const accounts = await BankAccountService.list({
      orgId,
      isActive: options?.isActive,
      accountType: options?.accountType,
    });

    return { success: true, data: accounts };
  } catch (error) {
    console.error('[listBankAccounts] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list bank accounts',
    };
  }
}

/**
 * Get bank account by ID
 */
export async function getBankAccount(id: string): Promise<ActionResult> {
  try {
    const account = await BankAccountService.getById(id);
    return { success: true, data: account };
  } catch (error) {
    console.error('[getBankAccount] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bank account',
    };
  }
}

/**
 * Create bank account
 */
export async function createBankAccount(data: {
  accountName: string;
  accountNumber?: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'line_of_credit';
  bankName?: string;
  currency?: string;
  glAccountId?: string;
  currentBalance?: number;
}): Promise<ActionResult> {
  try {
    const { orgId } = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const account = await BankAccountService.create({
      orgId,
      ...data,
    });

    revalidatePath('/accounting/bank-transactions');
    revalidatePath('/bank-feeds');

    return { success: true, data: account };
  } catch (error) {
    console.error('[createBankAccount] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bank account',
    };
  }
}

// =============================================
// BANK TRANSACTION ACTIONS
// =============================================

/**
 * List bank transactions
 */
export async function listBankTransactions(options?: {
  bankAccountId?: string;
  status?: string;
  isReconciled?: boolean;
  transactionType?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult> {
  try {
    const { orgId } = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const transactions = await BankTransactionService.list({
      orgId,
      ...options,
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('[listBankTransactions] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list bank transactions',
    };
  }
}

/**
 * Get bank transaction by ID
 */
export async function getBankTransaction(id: string): Promise<ActionResult> {
  try {
    const transaction = await BankTransactionService.getById(id);
    return { success: true, data: transaction };
  } catch (error) {
    console.error('[getBankTransaction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bank transaction',
    };
  }
}

/**
 * Create bank transaction
 */
export async function createBankTransaction(data: {
  bankAccountId: string;
  transactionDate: string;
  postingDate?: string;
  description: string;
  merchantName?: string;
  amount: number;
  currency?: string;
  transactionType: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer';
  notes?: string;
}): Promise<ActionResult> {
  try {
    const { orgId } = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const transaction = await BankTransactionService.create({
      orgId,
      ...data,
    });

    revalidatePath('/accounting/bank-transactions');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('[createBankTransaction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bank transaction',
    };
  }
}

/**
 * Categorize bank transaction
 */
export async function categorizeBankTransaction(
  id: string,
  accountId: string
): Promise<ActionResult> {
  try {
    const transaction = await BankTransactionService.categorize(id, accountId);

    revalidatePath('/accounting/bank-transactions');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('[categorizeBankTransaction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to categorize transaction',
    };
  }
}

/**
 * Reconcile bank transaction
 */
export async function reconcileBankTransaction(
  id: string,
  journalEntryId?: string
): Promise<ActionResult> {
  try {
    const { userId } = await getCurrentOrg();
    if (!userId) {
      return { success: false, error: 'User not found' };
    }

    const transaction = await BankTransactionService.reconcile(id, userId, journalEntryId);

    revalidatePath('/accounting/bank-transactions');
    revalidatePath('/accounting/reconcile');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('[reconcileBankTransaction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reconcile transaction',
    };
  }
}

/**
 * Ignore bank transaction
 */
export async function ignoreBankTransaction(id: string): Promise<ActionResult> {
  try {
    const transaction = await BankTransactionService.ignore(id);

    revalidatePath('/accounting/bank-transactions');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('[ignoreBankTransaction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ignore transaction',
    };
  }
}

/**
 * Get transaction statistics
 */
export async function getBankTransactionStats(bankAccountId?: string): Promise<ActionResult> {
  try {
    const { orgId } = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const stats = await BankTransactionService.getStats(orgId, bankAccountId);

    return { success: true, data: stats };
  } catch (error) {
    console.error('[getBankTransactionStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction stats',
    };
  }
}
