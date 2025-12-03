/**
 * Chart of Accounts Setup Service
 *
 * Handles COA template seeding and organization setup
 */

import { createClient } from '@/lib/supabase/server';
import { philippinesChartOfAccounts, flattenCOATemplate } from '@/lib/db/seed/coa-philippines';
import type { Account, RootType } from '@/lib/models/accounting/account';
import { getReportTypeFromRootType } from '@/lib/models/accounting/account';
import { AccountingError } from './ledger.service';

interface COATemplateInfo {
  name: string;
  region: string;
  industry: string;
  description: string;
}

export class COASetupService {
  /**
   * Get available COA templates
   */
  static getAvailableTemplates(): COATemplateInfo[] {
    return [
      {
        name: philippinesChartOfAccounts.name,
        region: philippinesChartOfAccounts.region,
        industry: philippinesChartOfAccounts.industry,
        description: philippinesChartOfAccounts.description,
      },
      // Add more templates here as needed
    ];
  }

  /**
   * Seed Chart of Accounts for an organization using a template
   */
  static async seedCOA(
    orgId: string,
    templateRegion: string = 'PH',
    templateIndustry: string = 'general'
  ): Promise<{ accountsCreated: number }> {
    const supabase = await createClient();

    // Check if organization already has accounts
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .eq('org_id', orgId)
      .limit(1);

    if (checkError) {
      throw new AccountingError(`Failed to check existing accounts: ${checkError.message}`);
    }

    if (existingAccounts && existingAccounts.length > 0) {
      throw new AccountingError('Organization already has accounts. Cannot seed COA.');
    }

    // Get the template (for now, only Philippines is available)
    const template = philippinesChartOfAccounts;
    if (templateRegion !== 'PH') {
      throw new AccountingError(`Template not available for region: ${templateRegion}`);
    }

    // Flatten the template
    const flatAccounts = flattenCOATemplate(template);

    // Create a map to track account IDs by code
    const accountIdByCode = new Map<string, string>();

    // Insert accounts in order (parents first)
    let accountsCreated = 0;

    for (const account of flatAccounts) {
      const parentId = account.parentCode
        ? accountIdByCode.get(account.parentCode)
        : null;

      const reportType = getReportTypeFromRootType(account.rootType);

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          org_id: orgId,
          code: account.code,
          name: account.name,
          account_type: account.accountType?.toLowerCase().replace(/ /g, '_') || account.rootType.toLowerCase(),
          root_type: account.rootType,
          report_type: reportType,
          parent_id: parentId,
          is_group: account.isGroup,
          currency: account.currency || 'PHP',
          is_system: true,  // Mark as system accounts
          is_active: true,
          is_frozen: false,
          tax_rate: account.taxRate || null,
          description: account.description || null,
          balance: 0,
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Failed to create account ${account.code}: ${error.message}`);
        throw new AccountingError(`Failed to create account ${account.code}: ${error.message}`);
      }

      accountIdByCode.set(account.code, data.id);
      accountsCreated++;
    }

    // Update nested set values
    await this.updateNestedSetValues(orgId);

    return { accountsCreated };
  }

  /**
   * Create default fiscal year for organization
   */
  static async createDefaultFiscalYear(
    orgId: string,
    startMonth: number = 1  // January
  ): Promise<string> {
    const supabase = await createClient();

    const currentYear = new Date().getFullYear();
    let startDate: Date;
    let endDate: Date;

    if (startMonth === 1) {
      // Calendar year (Jan - Dec)
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    } else {
      // Fiscal year spanning two calendar years
      const today = new Date();
      const currentMonth = today.getMonth() + 1;

      if (currentMonth >= startMonth) {
        startDate = new Date(currentYear, startMonth - 1, 1);
        endDate = new Date(currentYear + 1, startMonth - 2, 0);
      } else {
        startDate = new Date(currentYear - 1, startMonth - 1, 1);
        endDate = new Date(currentYear, startMonth - 2, 0);
      }
    }

    const yearName = startMonth === 1
      ? currentYear.toString()
      : `${startDate.getFullYear()}-${(endDate.getFullYear() % 100).toString().padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('fiscal_years')
      .insert({
        org_id: orgId,
        year_name: yearName,
        year_start_date: startDate.toISOString().split('T')[0],
        year_end_date: endDate.toISOString().split('T')[0],
        is_closed: false,
        auto_created: true,
      })
      .select('id')
      .single();

    if (error) {
      throw new AccountingError(`Failed to create fiscal year: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Create default cost center for organization
   */
  static async createDefaultCostCenter(
    orgId: string,
    companyName: string
  ): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cost_centers')
      .insert({
        org_id: orgId,
        cost_center_code: 'MAIN',
        cost_center_name: `${companyName} - Main`,
        parent_id: null,
        is_group: false,
        is_disabled: false,
      })
      .select('id')
      .single();

    if (error) {
      throw new AccountingError(`Failed to create cost center: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Full organization accounting setup
   */
  static async setupOrganizationAccounting(
    orgId: string,
    options: {
      companyName: string;
      templateRegion?: string;
      templateIndustry?: string;
      fiscalYearStartMonth?: number;
    }
  ): Promise<{
    accountsCreated: number;
    fiscalYearId: string;
    costCenterId: string;
  }> {
    // 1. Seed Chart of Accounts
    const { accountsCreated } = await this.seedCOA(
      orgId,
      options.templateRegion || 'PH',
      options.templateIndustry || 'general'
    );

    // 2. Create default fiscal year
    const fiscalYearId = await this.createDefaultFiscalYear(
      orgId,
      options.fiscalYearStartMonth || 1
    );

    // 3. Create default cost center
    const costCenterId = await this.createDefaultCostCenter(
      orgId,
      options.companyName
    );

    return {
      accountsCreated,
      fiscalYearId,
      costCenterId,
    };
  }

  /**
   * Update nested set values (lft/rgt) for accounts
   */
  private static async updateNestedSetValues(orgId: string): Promise<void> {
    const supabase = await createClient();

    // Get all accounts ordered by code
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, parent_id, code')
      .eq('org_id', orgId)
      .order('code');

    if (error || !accounts) {
      console.error('Failed to fetch accounts for nested set update:', error);
      return;
    }

    // Build tree and assign lft/rgt using DFS
    let counter = 1;

    const assignValues = async (
      parentId: string | null,
      nodes: typeof accounts
    ): Promise<void> => {
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
   * Get account by code for an organization
   */
  static async getAccountByCode(
    orgId: string,
    code: string
  ): Promise<Account | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new AccountingError(`Failed to fetch account: ${error.message}`);
    }

    return data as Account;
  }

  /**
   * Get commonly used accounts for quick access
   */
  static async getCommonAccounts(orgId: string): Promise<{
    cashOnHand?: Account;
    cashInBank?: Account;
    accountsReceivable?: Account;
    accountsPayable?: Account;
    salesRevenue?: Account;
    costOfGoodsSold?: Account;
    retainedEarnings?: Account;
    inputVAT?: Account;
    outputVAT?: Account;
  }> {
    const commonCodes = [
      '1101', // Cash on Hand
      '1103', // Cash in Bank - Checking (PHP)
      '1111', // Accounts Receivable - Trade
      '2101', // Accounts Payable - Trade
      '4101', // Sales Revenue
      '5101', // Cost of Goods Sold
      '3005', // Retained Earnings
      '1135', // Input VAT
      '2121', // Output VAT
    ];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('org_id', orgId)
      .in('code', commonCodes);

    if (error) {
      throw new AccountingError(`Failed to fetch common accounts: ${error.message}`);
    }

    const accountsByCode = new Map<string, Account>();
    for (const account of data || []) {
      accountsByCode.set(account.code, account as Account);
    }

    return {
      cashOnHand: accountsByCode.get('1101'),
      cashInBank: accountsByCode.get('1103'),
      accountsReceivable: accountsByCode.get('1111'),
      accountsPayable: accountsByCode.get('2101'),
      salesRevenue: accountsByCode.get('4101'),
      costOfGoodsSold: accountsByCode.get('5101'),
      retainedEarnings: accountsByCode.get('3005'),
      inputVAT: accountsByCode.get('1135'),
      outputVAT: accountsByCode.get('2121'),
    };
  }
}
