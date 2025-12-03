/**
 * Account Service
 * Manages Chart of Accounts operations
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Account,
  CreateAccount,
  UpdateAccount,
  AccountWithChildren,
  RootType,
  ReportType,
} from '@/lib/models/accounting/account';
import {
  getRootTypeFromAccountType,
  getReportTypeFromRootType,
} from '@/lib/models/accounting/account';
import { AccountingError } from './ledger.service';

export class AccountService {
  /**
   * Create a new account
   */
  static async create(input: CreateAccount): Promise<Account> {
    const supabase = await createClient();

    // Validate parent account if provided
    if (input.parentId) {
      const { data: parent, error: parentError } = await supabase
        .from('accounts')
        .select('id, org_id, is_group, root_type')
        .eq('id', input.parentId)
        .single();

      if (parentError || !parent) {
        throw new AccountingError('Parent account not found');
      }

      if (parent.org_id !== input.orgId) {
        throw new AccountingError('Parent account must belong to the same organization');
      }

      if (!parent.is_group) {
        throw new AccountingError('Parent account must be a group account');
      }

      // Inherit root_type from parent if not explicitly set
      if (!input.rootType && parent.root_type) {
        input.rootType = parent.root_type as RootType;
      }
    }

    // Determine report_type from root_type
    const reportType = getReportTypeFromRootType(input.rootType);

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        org_id: input.orgId,
        code: input.code,
        name: input.name,
        account_type: input.accountType,
        root_type: input.rootType,
        report_type: reportType,
        parent_id: input.parentId || null,
        is_group: input.isGroup || false,
        currency: input.currency || 'PHP',
        is_system: input.isSystem || false,
        is_active: input.isActive ?? true,
        is_frozen: input.isFrozen || false,
        balance_must_be: input.balanceMustBe || null,
        tax_rate: input.taxRate || null,
        description: input.description || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AccountingError('Account code or name already exists');
      }
      throw new AccountingError(`Failed to create account: ${error.message}`);
    }

    // Update nested set (lft/rgt) - simplified approach
    await this.updateNestedSet(input.orgId);

    return this.mapDbToAccount(data);
  }

  /**
   * Get an account by ID
   */
  static async getById(id: string): Promise<Account> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AccountingError(`Account not found: ${id}`);
    }

    return this.mapDbToAccount(data);
  }

  /**
   * Get an account by code
   */
  static async getByCode(orgId: string, code: string): Promise<Account | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new AccountingError(`Failed to fetch account: ${error.message}`);
    }

    return this.mapDbToAccount(data);
  }

  /**
   * List all accounts for an organization (flat list)
   */
  static async list(options: {
    orgId: string;
    isActive?: boolean;
    rootType?: RootType;
    accountType?: string;
    isGroup?: boolean;
    parentId?: string;
  }): Promise<Account[]> {
    const supabase = await createClient();

    let query = supabase
      .from('accounts')
      .select('*')
      .eq('org_id', options.orgId)
      .order('code');

    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    if (options.rootType) {
      query = query.eq('root_type', options.rootType);
    }

    if (options.accountType) {
      query = query.eq('account_type', options.accountType);
    }

    if (options.isGroup !== undefined) {
      query = query.eq('is_group', options.isGroup);
    }

    if (options.parentId !== undefined) {
      if (options.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', options.parentId);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new AccountingError(`Failed to list accounts: ${error.message}`);
    }

    return (data || []).map(this.mapDbToAccount);
  }

  /**
   * Get accounts as a hierarchical tree
   */
  static async getTree(orgId: string, isActiveOnly: boolean = true): Promise<AccountWithChildren[]> {
    const accounts = await this.list({
      orgId,
      isActive: isActiveOnly ? true : undefined,
    });

    return this.buildTree(accounts);
  }

  /**
   * Build hierarchical tree from flat list
   */
  private static buildTree(accounts: Account[]): AccountWithChildren[] {
    const accountMap = new Map<string, AccountWithChildren>();
    const roots: AccountWithChildren[] = [];

    // First pass: create all nodes
    for (const account of accounts) {
      accountMap.set(account.id, { ...account, children: [], level: 0 });
    }

    // Second pass: build hierarchy
    for (const account of accounts) {
      const node = accountMap.get(account.id)!;

      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
          node.level = (parent.level || 0) + 1;
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    // Sort children by code
    const sortChildren = (nodes: AccountWithChildren[]) => {
      nodes.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          sortChildren(node.children);
        }
      }
    };

    sortChildren(roots);
    return roots;
  }

  /**
   * Update an account
   */
  static async update(input: UpdateAccount): Promise<Account> {
    const supabase = await createClient();

    const existing = await this.getById(input.id);

    // Don't allow changing root_type or account_type if there are GL entries
    if (
      (input.rootType && input.rootType !== existing.rootType) ||
      (input.accountType && input.accountType !== existing.accountType)
    ) {
      const { data: glEntries } = await supabase
        .from('gl_entries')
        .select('id')
        .eq('account_id', input.id)
        .limit(1);

      if (glEntries && glEntries.length > 0) {
        throw new AccountingError(
          'Cannot change account type after transactions have been posted'
        );
      }
    }

    // Don't allow changing system accounts
    if (existing.isSystem && (input.isActive === false || input.code !== existing.code)) {
      throw new AccountingError('Cannot modify system account');
    }

    const updateData: any = {};
    if (input.code !== undefined) updateData.code = input.code;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.accountType !== undefined) updateData.account_type = input.accountType;
    if (input.rootType !== undefined) {
      updateData.root_type = input.rootType;
      updateData.report_type = getReportTypeFromRootType(input.rootType);
    }
    if (input.parentId !== undefined) updateData.parent_id = input.parentId;
    if (input.isGroup !== undefined) updateData.is_group = input.isGroup;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.isFrozen !== undefined) updateData.is_frozen = input.isFrozen;
    if (input.balanceMustBe !== undefined) updateData.balance_must_be = input.balanceMustBe;
    if (input.taxRate !== undefined) updateData.tax_rate = input.taxRate;
    if (input.description !== undefined) updateData.description = input.description;

    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw new AccountingError(`Failed to update account: ${error.message}`);
    }

    // Update nested set if parent changed
    if (input.parentId !== undefined && input.parentId !== existing.parentId) {
      await this.updateNestedSet(existing.orgId);
    }

    return this.mapDbToAccount(data);
  }

  /**
   * Delete an account (soft delete by deactivating)
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const existing = await this.getById(id);

    if (existing.isSystem) {
      throw new AccountingError('Cannot delete system account');
    }

    // Check for GL entries
    const { data: glEntries } = await supabase
      .from('gl_entries')
      .select('id')
      .eq('account_id', id)
      .limit(1);

    if (glEntries && glEntries.length > 0) {
      throw new AccountingError(
        'Cannot delete account with existing transactions. Deactivate it instead.'
      );
    }

    // Check for child accounts
    const { data: children } = await supabase
      .from('accounts')
      .select('id')
      .eq('parent_id', id)
      .limit(1);

    if (children && children.length > 0) {
      throw new AccountingError('Cannot delete account with child accounts');
    }

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AccountingError(`Failed to delete account: ${error.message}`);
    }
  }

  /**
   * Get accounts by type (for dropdowns)
   */
  static async getByType(
    orgId: string,
    accountType: string
  ): Promise<Account[]> {
    return this.list({
      orgId,
      accountType,
      isActive: true,
      isGroup: false,
    });
  }

  /**
   * Get receivable accounts
   */
  static async getReceivableAccounts(orgId: string): Promise<Account[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('account_type', 'Receivable')
      .eq('is_active', true)
      .eq('is_group', false)
      .order('code');

    if (error) {
      throw new AccountingError(`Failed to fetch receivable accounts: ${error.message}`);
    }

    return (data || []).map(this.mapDbToAccount);
  }

  /**
   * Get payable accounts
   */
  static async getPayableAccounts(orgId: string): Promise<Account[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('account_type', 'Payable')
      .eq('is_active', true)
      .eq('is_group', false)
      .order('code');

    if (error) {
      throw new AccountingError(`Failed to fetch payable accounts: ${error.message}`);
    }

    return (data || []).map(this.mapDbToAccount);
  }

  /**
   * Get bank and cash accounts
   */
  static async getBankCashAccounts(orgId: string): Promise<Account[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('org_id', orgId)
      .in('account_type', ['Bank', 'Cash'])
      .eq('is_active', true)
      .eq('is_group', false)
      .order('code');

    if (error) {
      throw new AccountingError(`Failed to fetch bank/cash accounts: ${error.message}`);
    }

    return (data || []).map(this.mapDbToAccount);
  }

  /**
   * Update nested set values (lft/rgt) for the account tree
   * This is a simplified implementation - for production,
   * consider using a more efficient algorithm
   */
  private static async updateNestedSet(orgId: string): Promise<void> {
    const supabase = await createClient();

    // Get all accounts ordered by parent and code
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, parent_id, code')
      .eq('org_id', orgId)
      .order('code');

    if (error || !accounts) {
      return;
    }

    // Build tree and assign lft/rgt
    let counter = 1;

    const assignValues = async (
      parentId: string | null,
      nodes: typeof accounts
    ) => {
      const children = nodes.filter(n => n.parent_id === parentId);
      children.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

      for (const child of children) {
        const lft = counter++;
        await assignValues(child.id, nodes);
        const rgt = counter++;

        await supabase
          .from('accounts')
          .update({ lft, rgt })
          .eq('id', child.id);
      }
    };

    await assignValues(null, accounts);
  }

  /**
   * Map database row to Account type
   */
  private static mapDbToAccount(row: any): Account {
    return {
      id: row.id,
      orgId: row.org_id,
      code: row.code,
      name: row.name,
      accountType: row.account_type,
      rootType: row.root_type,
      reportType: row.report_type,
      specificAccountType: row.specific_account_type,
      parentId: row.parent_id,
      lft: row.lft || 0,
      rgt: row.rgt || 0,
      isGroup: row.is_group || false,
      currency: row.currency || 'PHP',
      isSystem: row.is_system || false,
      isActive: row.is_active ?? true,
      isFrozen: row.is_frozen || false,
      balanceMustBe: row.balance_must_be,
      taxRate: row.tax_rate,
      balance: parseFloat(row.balance) || 0,
      balanceDate: row.balance_date ? new Date(row.balance_date) : undefined,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  }
}
