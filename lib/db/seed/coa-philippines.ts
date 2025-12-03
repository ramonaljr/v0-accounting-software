/**
 * Philippines Chart of Accounts Template
 *
 * Based on Philippine Financial Reporting Standards (PFRS)
 * and common practices for SMEs in the Philippines.
 *
 * Account Structure:
 * - 1xxx: Assets
 * - 2xxx: Liabilities
 * - 3xxx: Equity
 * - 4xxx: Income/Revenue
 * - 5xxx: Expenses
 */

import type { RootType, AccountType } from '@/lib/models/accounting/account';

interface COATemplateAccount {
  code: string;
  name: string;
  rootType: RootType;
  accountType?: string;  // Specific account type for behavior
  isGroup: boolean;
  taxRate?: number;
  currency?: string;
  description?: string;
  children?: COATemplateAccount[];
}

export const philippinesChartOfAccounts: {
  name: string;
  region: string;
  industry: string;
  description: string;
  accounts: COATemplateAccount[];
} = {
  name: 'Philippines - Standard Chart of Accounts',
  region: 'PH',
  industry: 'general',
  description: 'Standard Chart of Accounts for Philippine businesses following PFRS/PFRS for SMEs',
  accounts: [
    // ==========================================
    // ASSETS (1xxx)
    // ==========================================
    {
      code: '1',
      name: 'Assets',
      rootType: 'Asset',
      isGroup: true,
      children: [
        // Current Assets (11xx)
        {
          code: '11',
          name: 'Current Assets',
          rootType: 'Asset',
          isGroup: true,
          children: [
            // Cash and Cash Equivalents (1100)
            {
              code: '1100',
              name: 'Cash and Cash Equivalents',
              rootType: 'Asset',
              isGroup: true,
              children: [
                { code: '1101', name: 'Cash on Hand', rootType: 'Asset', accountType: 'Cash', isGroup: false },
                { code: '1102', name: 'Petty Cash Fund', rootType: 'Asset', accountType: 'Cash', isGroup: false },
                { code: '1103', name: 'Cash in Bank - Checking (PHP)', rootType: 'Asset', accountType: 'Bank', isGroup: false },
                { code: '1104', name: 'Cash in Bank - Savings (PHP)', rootType: 'Asset', accountType: 'Bank', isGroup: false },
                { code: '1105', name: 'Cash in Bank - USD', rootType: 'Asset', accountType: 'Bank', isGroup: false, currency: 'USD' },
                { code: '1106', name: 'Cash in Bank - Payroll', rootType: 'Asset', accountType: 'Bank', isGroup: false },
                { code: '1107', name: 'Cash Equivalents', rootType: 'Asset', accountType: 'Cash', isGroup: false },
              ],
            },
            // Trade and Other Receivables (1110)
            {
              code: '1110',
              name: 'Trade and Other Receivables',
              rootType: 'Asset',
              isGroup: true,
              children: [
                { code: '1111', name: 'Accounts Receivable - Trade', rootType: 'Asset', accountType: 'Receivable', isGroup: false },
                { code: '1112', name: 'Allowance for Doubtful Accounts', rootType: 'Asset', accountType: 'Receivable', isGroup: false, description: 'Contra account' },
                { code: '1113', name: 'Notes Receivable', rootType: 'Asset', accountType: 'Receivable', isGroup: false },
                { code: '1114', name: 'Advances to Employees', rootType: 'Asset', accountType: 'Receivable', isGroup: false },
                { code: '1115', name: 'Advances to Suppliers', rootType: 'Asset', accountType: 'Receivable', isGroup: false },
                { code: '1116', name: 'Advances to Officers', rootType: 'Asset', accountType: 'Receivable', isGroup: false },
                { code: '1117', name: 'Receivable from Related Parties', rootType: 'Asset', accountType: 'Receivable', isGroup: false },
                { code: '1118', name: 'Other Receivables', rootType: 'Asset', accountType: 'Receivable', isGroup: false },
              ],
            },
            // Inventories (1120)
            {
              code: '1120',
              name: 'Inventories',
              rootType: 'Asset',
              isGroup: true,
              children: [
                { code: '1121', name: 'Raw Materials Inventory', rootType: 'Asset', accountType: 'Stock', isGroup: false },
                { code: '1122', name: 'Work in Process Inventory', rootType: 'Asset', accountType: 'Stock', isGroup: false },
                { code: '1123', name: 'Finished Goods Inventory', rootType: 'Asset', accountType: 'Stock', isGroup: false },
                { code: '1124', name: 'Merchandise Inventory', rootType: 'Asset', accountType: 'Stock', isGroup: false },
                { code: '1125', name: 'Supplies Inventory', rootType: 'Asset', isGroup: false },
                { code: '1126', name: 'Goods in Transit', rootType: 'Asset', accountType: 'Stock', isGroup: false },
                { code: '1127', name: 'Inventory Valuation Adjustment', rootType: 'Asset', accountType: 'Stock Adjustment', isGroup: false },
              ],
            },
            // Prepaid Expenses and Other Current Assets (1130)
            {
              code: '1130',
              name: 'Prepaid Expenses and Other Current Assets',
              rootType: 'Asset',
              isGroup: true,
              children: [
                { code: '1131', name: 'Prepaid Rent', rootType: 'Asset', isGroup: false },
                { code: '1132', name: 'Prepaid Insurance', rootType: 'Asset', isGroup: false },
                { code: '1133', name: 'Prepaid Advertising', rootType: 'Asset', isGroup: false },
                { code: '1134', name: 'Prepaid Taxes', rootType: 'Asset', isGroup: false },
                { code: '1135', name: 'Input VAT', rootType: 'Asset', accountType: 'Tax', isGroup: false },
                { code: '1136', name: 'Creditable Withholding Tax', rootType: 'Asset', accountType: 'Tax', isGroup: false },
                { code: '1137', name: 'Creditable Income Tax', rootType: 'Asset', accountType: 'Tax', isGroup: false },
                { code: '1138', name: 'Deferred Input VAT', rootType: 'Asset', accountType: 'Tax', isGroup: false },
                { code: '1139', name: 'Other Prepaid Expenses', rootType: 'Asset', isGroup: false },
              ],
            },
          ],
        },
        // Non-Current Assets (12xx)
        {
          code: '12',
          name: 'Non-Current Assets',
          rootType: 'Asset',
          isGroup: true,
          children: [
            // Property, Plant and Equipment (1200)
            {
              code: '1200',
              name: 'Property, Plant and Equipment',
              rootType: 'Asset',
              isGroup: true,
              children: [
                { code: '1201', name: 'Land', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1202', name: 'Buildings', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1203', name: 'Accumulated Depreciation - Buildings', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1204', name: 'Building Improvements', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1205', name: 'Accumulated Depreciation - Building Improvements', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1206', name: 'Leasehold Improvements', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1207', name: 'Accumulated Depreciation - Leasehold Improvements', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1208', name: 'Machinery and Equipment', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1209', name: 'Accumulated Depreciation - Machinery and Equipment', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1210', name: 'Furniture and Fixtures', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1211', name: 'Accumulated Depreciation - Furniture and Fixtures', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1212', name: 'Office Equipment', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1213', name: 'Accumulated Depreciation - Office Equipment', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1214', name: 'Computer Equipment', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1215', name: 'Accumulated Depreciation - Computer Equipment', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1216', name: 'Transportation Equipment', rootType: 'Asset', accountType: 'Fixed Asset', isGroup: false },
                { code: '1217', name: 'Accumulated Depreciation - Transportation Equipment', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1218', name: 'Construction in Progress', rootType: 'Asset', accountType: 'Capital Work in Progress', isGroup: false },
              ],
            },
            // Intangible Assets (1250)
            {
              code: '1250',
              name: 'Intangible Assets',
              rootType: 'Asset',
              isGroup: true,
              children: [
                { code: '1251', name: 'Software and Licenses', rootType: 'Asset', isGroup: false },
                { code: '1252', name: 'Accumulated Amortization - Software', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1253', name: 'Patents and Trademarks', rootType: 'Asset', isGroup: false },
                { code: '1254', name: 'Accumulated Amortization - Patents', rootType: 'Asset', accountType: 'Accumulated Depreciation', isGroup: false },
                { code: '1255', name: 'Goodwill', rootType: 'Asset', isGroup: false },
                { code: '1256', name: 'Franchise', rootType: 'Asset', isGroup: false },
              ],
            },
            // Other Non-Current Assets (1270)
            {
              code: '1270',
              name: 'Other Non-Current Assets',
              rootType: 'Asset',
              isGroup: true,
              children: [
                { code: '1271', name: 'Security Deposits', rootType: 'Asset', isGroup: false },
                { code: '1272', name: 'Long-term Investments', rootType: 'Asset', isGroup: false },
                { code: '1273', name: 'Deferred Tax Assets', rootType: 'Asset', isGroup: false },
                { code: '1274', name: 'Other Non-Current Assets', rootType: 'Asset', isGroup: false },
              ],
            },
          ],
        },
      ],
    },

    // ==========================================
    // LIABILITIES (2xxx)
    // ==========================================
    {
      code: '2',
      name: 'Liabilities',
      rootType: 'Liability',
      isGroup: true,
      children: [
        // Current Liabilities (21xx)
        {
          code: '21',
          name: 'Current Liabilities',
          rootType: 'Liability',
          isGroup: true,
          children: [
            // Trade and Other Payables (2100)
            {
              code: '2100',
              name: 'Trade and Other Payables',
              rootType: 'Liability',
              isGroup: true,
              children: [
                { code: '2101', name: 'Accounts Payable - Trade', rootType: 'Liability', accountType: 'Payable', isGroup: false },
                { code: '2102', name: 'Notes Payable - Current', rootType: 'Liability', accountType: 'Payable', isGroup: false },
                { code: '2103', name: 'Accrued Expenses', rootType: 'Liability', isGroup: false },
                { code: '2104', name: 'Accrued Salaries and Wages', rootType: 'Liability', isGroup: false },
                { code: '2105', name: 'Accrued Interest', rootType: 'Liability', isGroup: false },
                { code: '2106', name: 'Accrued Utilities', rootType: 'Liability', isGroup: false },
                { code: '2107', name: 'Advances from Customers', rootType: 'Liability', isGroup: false },
                { code: '2108', name: 'Deferred Revenue', rootType: 'Liability', isGroup: false },
                { code: '2109', name: 'Payable to Related Parties', rootType: 'Liability', accountType: 'Payable', isGroup: false },
                { code: '2110', name: 'Other Payables', rootType: 'Liability', accountType: 'Payable', isGroup: false },
              ],
            },
            // Tax Liabilities (2120)
            {
              code: '2120',
              name: 'Tax Liabilities',
              rootType: 'Liability',
              isGroup: true,
              children: [
                { code: '2121', name: 'Output VAT', rootType: 'Liability', accountType: 'Tax', isGroup: false, taxRate: 12 },
                { code: '2122', name: 'Withholding Tax Payable - Expanded', rootType: 'Liability', accountType: 'Tax', isGroup: false },
                { code: '2123', name: 'Withholding Tax Payable - Compensation', rootType: 'Liability', accountType: 'Tax', isGroup: false },
                { code: '2124', name: 'Withholding Tax Payable - Final', rootType: 'Liability', accountType: 'Tax', isGroup: false },
                { code: '2125', name: 'Income Tax Payable', rootType: 'Liability', accountType: 'Tax', isGroup: false },
                { code: '2126', name: 'Percentage Tax Payable', rootType: 'Liability', accountType: 'Tax', isGroup: false },
                { code: '2127', name: 'Documentary Stamp Tax Payable', rootType: 'Liability', accountType: 'Tax', isGroup: false },
                { code: '2128', name: 'Local Business Tax Payable', rootType: 'Liability', accountType: 'Tax', isGroup: false },
                { code: '2129', name: 'Other Tax Liabilities', rootType: 'Liability', accountType: 'Tax', isGroup: false },
              ],
            },
            // Employee Benefits Payable (2140)
            {
              code: '2140',
              name: 'Employee Benefits Payable',
              rootType: 'Liability',
              isGroup: true,
              children: [
                { code: '2141', name: 'SSS Contributions Payable', rootType: 'Liability', isGroup: false },
                { code: '2142', name: 'PhilHealth Contributions Payable', rootType: 'Liability', isGroup: false },
                { code: '2143', name: 'Pag-IBIG Contributions Payable', rootType: 'Liability', isGroup: false },
                { code: '2144', name: 'SSS Loan Payable', rootType: 'Liability', isGroup: false },
                { code: '2145', name: 'Pag-IBIG Loan Payable', rootType: 'Liability', isGroup: false },
                { code: '2146', name: 'Salaries Payable', rootType: 'Liability', isGroup: false },
                { code: '2147', name: '13th Month Pay Payable', rootType: 'Liability', isGroup: false },
                { code: '2148', name: 'Leave Benefits Payable', rootType: 'Liability', isGroup: false },
                { code: '2149', name: 'Other Employee Benefits Payable', rootType: 'Liability', isGroup: false },
              ],
            },
            // Short-term Borrowings (2160)
            {
              code: '2160',
              name: 'Short-term Borrowings',
              rootType: 'Liability',
              isGroup: true,
              children: [
                { code: '2161', name: 'Bank Loans - Current Portion', rootType: 'Liability', isGroup: false },
                { code: '2162', name: 'Line of Credit', rootType: 'Liability', isGroup: false },
                { code: '2163', name: 'Due to Stockholders - Current', rootType: 'Liability', isGroup: false },
              ],
            },
          ],
        },
        // Non-Current Liabilities (22xx)
        {
          code: '22',
          name: 'Non-Current Liabilities',
          rootType: 'Liability',
          isGroup: true,
          children: [
            { code: '2201', name: 'Bank Loans - Long-term', rootType: 'Liability', isGroup: false },
            { code: '2202', name: 'Notes Payable - Long-term', rootType: 'Liability', isGroup: false },
            { code: '2203', name: 'Due to Stockholders - Long-term', rootType: 'Liability', isGroup: false },
            { code: '2204', name: 'Lease Liabilities', rootType: 'Liability', isGroup: false },
            { code: '2205', name: 'Deferred Tax Liabilities', rootType: 'Liability', isGroup: false },
            { code: '2206', name: 'Retirement Benefit Obligation', rootType: 'Liability', isGroup: false },
            { code: '2207', name: 'Other Non-Current Liabilities', rootType: 'Liability', isGroup: false },
          ],
        },
      ],
    },

    // ==========================================
    // EQUITY (3xxx)
    // ==========================================
    {
      code: '3',
      name: 'Equity',
      rootType: 'Equity',
      isGroup: true,
      children: [
        { code: '3001', name: 'Share Capital - Common', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3002', name: 'Share Capital - Preferred', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3003', name: 'Additional Paid-in Capital', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3004', name: 'Treasury Shares', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3005', name: 'Retained Earnings', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3006', name: 'Retained Earnings - Appropriated', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3007', name: 'Other Comprehensive Income', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3008', name: 'Revaluation Surplus', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        // For sole proprietorships
        { code: '3010', name: 'Owner\'s Capital', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        { code: '3011', name: 'Owner\'s Drawings', rootType: 'Equity', accountType: 'Equity', isGroup: false },
        // Opening balance equity
        { code: '3099', name: 'Opening Balance Equity', rootType: 'Equity', accountType: 'Equity', isGroup: false, description: 'Used for migration/opening entries' },
      ],
    },

    // ==========================================
    // INCOME/REVENUE (4xxx)
    // ==========================================
    {
      code: '4',
      name: 'Income',
      rootType: 'Income',
      isGroup: true,
      children: [
        // Operating Revenue (41xx)
        {
          code: '41',
          name: 'Operating Revenue',
          rootType: 'Income',
          isGroup: true,
          children: [
            { code: '4101', name: 'Sales Revenue', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4102', name: 'Service Revenue', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4103', name: 'Sales Returns and Allowances', rootType: 'Income', accountType: 'Income Account', isGroup: false, description: 'Contra revenue' },
            { code: '4104', name: 'Sales Discounts', rootType: 'Income', accountType: 'Income Account', isGroup: false, description: 'Contra revenue' },
            { code: '4105', name: 'Shipping and Delivery Income', rootType: 'Income', accountType: 'Income Account', isGroup: false },
          ],
        },
        // Other Income (42xx)
        {
          code: '42',
          name: 'Other Income',
          rootType: 'Income',
          isGroup: true,
          children: [
            { code: '4201', name: 'Interest Income', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4202', name: 'Rental Income', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4203', name: 'Dividend Income', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4204', name: 'Foreign Exchange Gain', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4205', name: 'Gain on Sale of Assets', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4206', name: 'Gain on Sale of Investments', rootType: 'Income', accountType: 'Income Account', isGroup: false },
            { code: '4207', name: 'Miscellaneous Income', rootType: 'Income', accountType: 'Income Account', isGroup: false },
          ],
        },
      ],
    },

    // ==========================================
    // EXPENSES (5xxx)
    // ==========================================
    {
      code: '5',
      name: 'Expenses',
      rootType: 'Expense',
      isGroup: true,
      children: [
        // Cost of Sales (51xx)
        {
          code: '51',
          name: 'Cost of Sales',
          rootType: 'Expense',
          isGroup: true,
          children: [
            { code: '5101', name: 'Cost of Goods Sold', rootType: 'Expense', accountType: 'Cost of Goods Sold', isGroup: false },
            { code: '5102', name: 'Cost of Services', rootType: 'Expense', accountType: 'Cost of Goods Sold', isGroup: false },
            { code: '5103', name: 'Direct Materials', rootType: 'Expense', isGroup: false },
            { code: '5104', name: 'Direct Labor', rootType: 'Expense', isGroup: false },
            { code: '5105', name: 'Manufacturing Overhead', rootType: 'Expense', isGroup: false },
            { code: '5106', name: 'Purchase Returns and Allowances', rootType: 'Expense', isGroup: false, description: 'Contra expense' },
            { code: '5107', name: 'Purchase Discounts', rootType: 'Expense', isGroup: false, description: 'Contra expense' },
            { code: '5108', name: 'Freight-In', rootType: 'Expense', isGroup: false },
            { code: '5109', name: 'Inventory Adjustments', rootType: 'Expense', accountType: 'Stock Adjustment', isGroup: false },
          ],
        },
        // Operating Expenses (52xx)
        {
          code: '52',
          name: 'Operating Expenses',
          rootType: 'Expense',
          isGroup: true,
          children: [
            // Selling Expenses (5210)
            {
              code: '5210',
              name: 'Selling Expenses',
              rootType: 'Expense',
              isGroup: true,
              children: [
                { code: '5211', name: 'Advertising and Promotions', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5212', name: 'Sales Commission', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5213', name: 'Delivery and Freight-Out', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5214', name: 'Marketing Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5215', name: 'Trade Show and Events', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5216', name: 'Sales Supplies', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
              ],
            },
            // General and Administrative Expenses (5230)
            {
              code: '5230',
              name: 'General and Administrative Expenses',
              rootType: 'Expense',
              isGroup: true,
              children: [
                { code: '5231', name: 'Salaries and Wages', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5232', name: 'Employee Benefits', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5233', name: 'SSS Contribution - Employer', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5234', name: 'PhilHealth Contribution - Employer', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5235', name: 'Pag-IBIG Contribution - Employer', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5236', name: '13th Month Pay Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5237', name: 'Retirement Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5238', name: 'Rent Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5239', name: 'Utilities Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5240', name: 'Telephone and Internet', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5241', name: 'Office Supplies Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5242', name: 'Depreciation Expense', rootType: 'Expense', accountType: 'Depreciation', isGroup: false },
                { code: '5243', name: 'Amortization Expense', rootType: 'Expense', accountType: 'Depreciation', isGroup: false },
                { code: '5244', name: 'Insurance Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5245', name: 'Professional Fees', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5246', name: 'Legal Fees', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5247', name: 'Accounting and Audit Fees', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5248', name: 'Repairs and Maintenance', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5249', name: 'Taxes and Licenses', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5250', name: 'Bank Charges', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5251', name: 'Travel and Transportation', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5252', name: 'Representation and Entertainment', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5253', name: 'Training and Development', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5254', name: 'Subscriptions and Dues', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5255', name: 'Security Services', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5256', name: 'Janitorial Services', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5257', name: 'Bad Debts Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
                { code: '5258', name: 'Miscellaneous Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
              ],
            },
          ],
        },
        // Other Expenses (53xx)
        {
          code: '53',
          name: 'Other Expenses',
          rootType: 'Expense',
          isGroup: true,
          children: [
            { code: '5301', name: 'Interest Expense', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
            { code: '5302', name: 'Foreign Exchange Loss', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
            { code: '5303', name: 'Loss on Sale of Assets', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
            { code: '5304', name: 'Loss on Sale of Investments', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
            { code: '5305', name: 'Penalties and Surcharges', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
            { code: '5306', name: 'Donations and Contributions', rootType: 'Expense', accountType: 'Expense Account', isGroup: false },
            { code: '5307', name: 'Income Tax Expense', rootType: 'Expense', accountType: 'Tax', isGroup: false },
          ],
        },
        // Round Off Account
        { code: '5999', name: 'Rounding Adjustment', rootType: 'Expense', accountType: 'Round Off', isGroup: false },
      ],
    },
  ],
};

/**
 * Flatten the hierarchical COA template into a flat list with parent references
 */
export function flattenCOATemplate(
  template: typeof philippinesChartOfAccounts
): Array<{
  code: string;
  name: string;
  rootType: RootType;
  accountType?: string;
  isGroup: boolean;
  parentCode?: string;
  taxRate?: number;
  currency?: string;
  description?: string;
}> {
  const result: Array<{
    code: string;
    name: string;
    rootType: RootType;
    accountType?: string;
    isGroup: boolean;
    parentCode?: string;
    taxRate?: number;
    currency?: string;
    description?: string;
  }> = [];

  function processAccount(
    account: COATemplateAccount,
    parentCode?: string
  ) {
    result.push({
      code: account.code,
      name: account.name,
      rootType: account.rootType,
      accountType: account.accountType,
      isGroup: account.isGroup,
      parentCode,
      taxRate: account.taxRate,
      currency: account.currency,
      description: account.description,
    });

    if (account.children) {
      for (const child of account.children) {
        processAccount(child, account.code);
      }
    }
  }

  for (const account of template.accounts) {
    processAccount(account);
  }

  return result;
}

export default philippinesChartOfAccounts;
