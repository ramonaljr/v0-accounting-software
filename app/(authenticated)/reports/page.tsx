'use client'

import { useState } from 'react'
import {
  ReportTabs,
  ReportsSearch,
  StandardReports,
  CustomReportsTable,
  ManagementReportsTable,
  KPIScorecard,
  SpreadsheetSyncSection,
  PerformanceChartGrid,
} from '@/components/reports'
import type { ReportCategory, ReportTab } from '@/components/reports'

const TABS: ReportTab[] = [
  { id: 'standard', label: 'Standard reports' },
  { id: 'custom', label: 'Custom reports' },
  { id: 'management', label: 'Management reports' },
  { id: 'kpis', label: 'KPIs', badge: true },
  { id: 'spreadsheet', label: 'Spreadsheet sync' },
  { id: 'performance', label: 'Performance center' },
]

const STANDARD_REPORTS: ReportCategory[] = [
  {
    name: 'Favorites',
    reports: [
      { name: 'Accounts receivable aging summary', hasIcon: true, isFavorite: true },
      { name: 'Balance Sheet', hasIcon: true, isFavorite: true },
      { name: 'Profit and Loss', hasIcon: true, isFavorite: true },
    ],
  },
  {
    name: 'Custom report builder',
    reports: [
      {
        name: 'Check out a new way to build and view reports in Accunza. Customize these popular reports or start from scratch with Create new report',
      },
      { name: 'Bill Approval Status', isFavorite: false },
      { name: 'Product/Item Profitability by Customer', isFavorite: false },
      { name: 'Invoice Approval Status', isFavorite: false },
    ],
  },
  {
    name: 'Business overview',
    reports: [
      { name: 'Audit Log' },
      { name: 'Balance Sheet', hasIcon: true, isFavorite: true },
      { name: 'Balance Sheet Comparison', hasIcon: true, isFavorite: false },
      { name: 'Balance Sheet Detail', hasIcon: true, isFavorite: false },
      { name: 'Balance Sheet Summary', hasIcon: true, isFavorite: false },
      { name: 'Statement of Cash Flows', hasIcon: true, isFavorite: false },
      { name: 'Business Snapshot', isFavorite: false },
      { name: 'Custom Summary Report', isFavorite: false },
      { name: 'Profit and Loss', hasIcon: true, isFavorite: true },
      { name: 'Profit and Loss by Customer', hasIcon: true, isFavorite: false },
      { name: 'Profit and Loss by Month', hasIcon: true, isFavorite: false },
      { name: 'Profit and Loss by Tag Group', isFavorite: false },
      { name: 'Profit and Loss Comparison', hasIcon: true, isFavorite: false },
      { name: 'Profit and Loss Detail', hasIcon: true, isFavorite: false },
      { name: 'Profit and Loss as % of total income', hasIcon: true, isFavorite: false },
      { name: 'Profit and Loss year-to-date comparison', hasIcon: true, isFavorite: false },
      { name: 'Quarterly Profit and Loss Summary', hasIcon: true, isFavorite: false },
    ],
  },
  {
    name: 'Who owes you',
    reports: [
      { name: 'Accounts receivable aging summary', hasIcon: true, isFavorite: true },
      { name: 'Accounts receivable aging detail', hasIcon: true, isFavorite: false },
      { name: 'Collections Report', hasIcon: true, isFavorite: false },
      { name: 'Customer Balance Summary', hasIcon: true, isFavorite: false },
      { name: 'Customer Balance Detail', hasIcon: true, isFavorite: false },
      { name: 'Invoice List', hasIcon: true, isFavorite: false },
      { name: 'Invoices and Received Payments', isFavorite: false },
      { name: 'Open Invoices', hasIcon: true, isFavorite: false },
      { name: 'Statement List', isFavorite: false },
      { name: 'Terms List', hasIcon: true, isFavorite: false },
      { name: 'Unbilled charges', hasIcon: true, isFavorite: false },
      { name: 'Unbilled time', hasIcon: true, isFavorite: false },
    ],
  },
  {
    name: 'Sales and customers',
    reports: [
      { name: 'Sales by Customer Type Detail', hasIcon: true, isFavorite: false },
      { name: 'Estimates & Progress Invoicing Summary by Customer', hasIcon: true, isFavorite: false },
      { name: 'Customer Contact List', hasIcon: true, isFavorite: false },
      { name: 'Income by Customer Summary', hasIcon: true, isFavorite: false },
      { name: 'Customer Phone List', isFavorite: false },
      { name: 'Sales by Customer Summary', hasIcon: true, isFavorite: false },
      { name: 'Sales by Customer Detail', hasIcon: true, isFavorite: false },
      { name: 'Deposit Detail', hasIcon: true, isFavorite: false },
      { name: 'Estimates by Customer', hasIcon: true, isFavorite: false },
      { name: 'Inventory Valuation Detail', hasIcon: true, isFavorite: false },
      { name: 'Inventory Valuation Summary', hasIcon: true, isFavorite: false },
      { name: 'Product/Service List', hasIcon: true, isFavorite: false },
      { name: 'Sales by Product/Service Summary', isFavorite: false },
      { name: 'Sales by Product/Service Detail', hasIcon: true, isFavorite: false },
      { name: 'Payment Method List', hasIcon: true, isFavorite: false },
      { name: 'Physical Inventory Worksheet', hasIcon: true, isFavorite: false },
      { name: 'Time Activities by Customer Detail', hasIcon: true, isFavorite: false },
      { name: 'Transaction List by Customer', hasIcon: true, isFavorite: false },
      { name: 'Transaction List by Tag Group', isFavorite: false },
    ],
  },
  {
    name: 'What you owe',
    reports: [
      { name: 'Accounts payable aging summary', isFavorite: false },
      { name: 'Accounts payable aging detail', hasIcon: true, isFavorite: false },
      { name: 'Bills and Applied Payments', isFavorite: false },
      { name: 'Bill Payment List', hasIcon: true, isFavorite: false },
      { name: '1099 Contractor Balance Detail', hasIcon: true, isFavorite: false },
      { name: '1099 Contractor Balance Summary', hasIcon: true, isFavorite: false },
      { name: 'Unpaid Bills', hasIcon: true, isFavorite: false },
      { name: 'Vendor Balance Summary', hasIcon: true, isFavorite: false },
      { name: 'Vendor Balance Detail', hasIcon: true, isFavorite: false },
    ],
  },
  {
    name: 'Expenses and vendors',
    reports: [
      { name: 'Check Detail', hasIcon: true, isFavorite: false },
      { name: '1099 Transaction Detail Report', isFavorite: false },
      { name: 'Open Purchase Order List', isFavorite: false },
      { name: 'Transaction List by Vendor', hasIcon: true, isFavorite: false },
      { name: 'Vendor Contact List', hasIcon: true, isFavorite: false },
      { name: 'Expenses by Vendor Summary', isFavorite: false },
      { name: 'Vendor Phone List', isFavorite: false },
    ],
  },
  {
    name: 'Employees',
    reports: [
      { name: 'Employee Contact List', isFavorite: false },
      { name: 'Recent/Edited Time Activities', hasIcon: true, isFavorite: false },
      { name: 'Time Activities by Employee Detail', hasIcon: true, isFavorite: false },
    ],
  },
  {
    name: 'For my accountant',
    reports: [
      { name: 'Account List', hasIcon: true, isFavorite: false },
      { name: 'Balance Sheet', hasIcon: true, isFavorite: true },
      { name: 'Balance Sheet Comparison', hasIcon: true, isFavorite: false },
      { name: 'Balance Sheet Detail', isFavorite: false },
      { name: 'Balance Sheet Summary', isFavorite: false },
      { name: 'Statement of Cash Flows', hasIcon: true, isFavorite: false },
      { name: 'Invalid Journal Transactions', isFavorite: false },
      { name: 'General Ledger', isFavorite: false },
      { name: 'General Ledger List', isFavorite: false },
      { name: 'Journal', hasIcon: true, isFavorite: false },
      { name: 'Adjusting Journal Entries', isFavorite: false },
      { name: 'Recurring Template List', isFavorite: false },
      { name: 'Profit and Loss', hasIcon: true, isFavorite: true },
      { name: 'Profit and Loss by Tag Group', isFavorite: false },
      { name: 'Profit and Loss Comparison', hasIcon: true, isFavorite: false },
      { name: 'Recent Transactions', hasIcon: true, isFavorite: false },
      { name: 'Reconciliation Reports', isFavorite: false },
      { name: 'Trial Balance', isFavorite: false },
      { name: 'Adjusted Trial Balance', hasIcon: true, isFavorite: false },
      { name: 'Transaction Detail by Account', hasIcon: true, isFavorite: false },
      { name: 'Transaction List by Date', hasIcon: true, isFavorite: false },
      { name: 'Transaction List with Splits', hasIcon: true, isFavorite: false },
    ],
  },
  {
    name: 'Payroll',
    reports: [
      { name: 'Paycheck History', isFavorite: false },
      { name: 'Contractor Payments', isFavorite: false },
      { name: 'Payroll Deductions/Contributions', isFavorite: false },
      { name: 'Payroll Summary by Employee', isFavorite: false },
      { name: 'Employee Directory', isFavorite: false },
      { name: 'Employee Details', isFavorite: false },
      { name: 'Multiple Worksites', isFavorite: false },
      { name: 'Payroll Details', isFavorite: false },
      { name: 'Payroll Item List', isFavorite: false },
      { name: 'Payroll Summary', isFavorite: false },
      { name: 'Vacation and Sick Leave', isFavorite: false },
      { name: 'Retirement Plans', isFavorite: false },
      { name: 'State Mandated Retirement Plans', isFavorite: false },
      { name: 'Payroll Tax Liability', isFavorite: false },
      { name: 'Payroll Tax Payments', isFavorite: false },
      { name: 'Total Payroll Cost', isFavorite: false },
      { name: 'Total Pay', isFavorite: false },
      { name: 'Payroll Tax and Wage Summary', isFavorite: false },
      { name: "Workers' Compensation", isFavorite: false },
      { name: 'Download Payroll Reports', isFavorite: false },
      { name: 'Recent/Edited Time Activities', hasIcon: true, isFavorite: false },
      { name: 'Time Activities by Employee Detail', hasIcon: true, isFavorite: false },
    ],
  },
]

const DEFAULT_EXPANDED_CATEGORIES = [
  'Favorites',
  'Business overview',
  'Who owes you',
  'Sales and customers',
  'What you owe',
  'Expenses and vendors',
  'Employees',
  'For my accountant',
  'Payroll',
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('standard')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(DEFAULT_EXPANDED_CATEGORIES)
  const [expandedKPIs, setExpandedKPIs] = useState<string[]>(['Finance'])

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName]
    )
  }

  const toggleKPI = (kpiName: string) => {
    setExpandedKPIs(prev =>
      prev.includes(kpiName) ? prev.filter(k => k !== kpiName) : [...prev, kpiName]
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'custom':
        return <CustomReportsTable />
      case 'management':
        return <ManagementReportsTable />
      case 'kpis':
        return <KPIScorecard expandedKPIs={expandedKPIs} onToggleKPI={toggleKPI} />
      case 'spreadsheet':
        return <SpreadsheetSyncSection />
      case 'performance':
        return <PerformanceChartGrid />
      default:
        return (
          <StandardReports
            categories={STANDARD_REPORTS}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
          />
        )
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      </div>

      {/* Tabs */}
      <ReportTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search and Actions - Only show for Standard and Custom tabs */}
      {(activeTab === 'standard' || activeTab === 'custom') && (
        <ReportsSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      )}

      {/* Render Tab Content */}
      {renderContent()}
    </div>
  )
}
