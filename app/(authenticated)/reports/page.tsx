"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Star,
  MoreVertical,
  FileText,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  name: string;
  hasIcon?: boolean;
  isFavorite?: boolean;
}

interface ReportCategory {
  name: string;
  reports: Report[];
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Favorites",
    "Business overview",
    "Who owes you",
    "Sales and customers",
    "What you owe",
    "Expenses and vendors",
    "Employees",
    "For my accountant",
    "Payroll"
  ]);
  const [expandedKPIs, setExpandedKPIs] = useState<string[]>(["Finance"]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleKPI = (kpiName: string) => {
    setExpandedKPIs(prev =>
      prev.includes(kpiName)
        ? prev.filter(k => k !== kpiName)
        : [...prev, kpiName]
    );
  };

  const tabs = [
    { id: "standard", label: "Standard reports" },
    { id: "custom", label: "Custom reports" },
    { id: "management", label: "Management reports" },
    { id: "kpis", label: "KPIs", badge: true },
    { id: "spreadsheet", label: "Spreadsheet sync" },
    { id: "performance", label: "Performance center" }
  ];

  const standardReports: ReportCategory[] = [
    {
      name: "Favorites",
      reports: [
        { name: "Accounts receivable aging summary", hasIcon: true, isFavorite: true },
        { name: "Balance Sheet", hasIcon: true, isFavorite: true },
        { name: "Profit and Loss", hasIcon: true, isFavorite: true }
      ]
    },
    {
      name: "Custom report builder",
      reports: [
        { name: "Check out a new way to build and view reports in OpportunityOS. Customize these popular reports or start from scratch with Create new report" },
        { name: "Bill Approval Status", isFavorite: false },
        { name: "Product/Item Profitability by Customer", isFavorite: false },
        { name: "Invoice Approval Status", isFavorite: false }
      ]
    },
    {
      name: "Business overview",
      reports: [
        { name: "Audit Log" },
        { name: "Balance Sheet", hasIcon: true, isFavorite: true },
        { name: "Balance Sheet Comparison", hasIcon: true, isFavorite: false },
        { name: "Balance Sheet Detail", hasIcon: true, isFavorite: false },
        { name: "Balance Sheet Summary", hasIcon: true, isFavorite: false },
        { name: "Statement of Cash Flows", hasIcon: true, isFavorite: false },
        { name: "Business Snapshot", isFavorite: false },
        { name: "Custom Summary Report", isFavorite: false },
        { name: "Profit and Loss", hasIcon: true, isFavorite: true },
        { name: "Profit and Loss by Customer", hasIcon: true, isFavorite: false },
        { name: "Profit and Loss by Month", hasIcon: true, isFavorite: false },
        { name: "Profit and Loss by Tag Group", isFavorite: false },
        { name: "Profit and Loss Comparison", hasIcon: true, isFavorite: false },
        { name: "Profit and Loss Detail", hasIcon: true, isFavorite: false },
        { name: "Profit and Loss as % of total income", hasIcon: true, isFavorite: false },
        { name: "Profit and Loss year-to-date comparison", hasIcon: true, isFavorite: false },
        { name: "Quarterly Profit and Loss Summary", hasIcon: true, isFavorite: false }
      ]
    },
    {
      name: "Who owes you",
      reports: [
        { name: "Accounts receivable aging summary", hasIcon: true, isFavorite: true },
        { name: "Accounts receivable aging detail", hasIcon: true, isFavorite: false },
        { name: "Collections Report", hasIcon: true, isFavorite: false },
        { name: "Customer Balance Summary", hasIcon: true, isFavorite: false },
        { name: "Customer Balance Detail", hasIcon: true, isFavorite: false },
        { name: "Invoice List", hasIcon: true, isFavorite: false },
        { name: "Invoices and Received Payments", isFavorite: false },
        { name: "Open Invoices", hasIcon: true, isFavorite: false },
        { name: "Statement List", isFavorite: false },
        { name: "Terms List", hasIcon: true, isFavorite: false },
        { name: "Unbilled charges", hasIcon: true, isFavorite: false },
        { name: "Unbilled time", hasIcon: true, isFavorite: false }
      ]
    },
    {
      name: "Sales and customers",
      reports: [
        { name: "Sales by Customer Type Detail", hasIcon: true, isFavorite: false },
        { name: "Estimates & Progress Invoicing Summary by Customer", hasIcon: true, isFavorite: false },
        { name: "Customer Contact List", hasIcon: true, isFavorite: false },
        { name: "Income by Customer Summary", hasIcon: true, isFavorite: false },
        { name: "Customer Phone List", isFavorite: false },
        { name: "Sales by Customer Summary", hasIcon: true, isFavorite: false },
        { name: "Sales by Customer Detail", hasIcon: true, isFavorite: false },
        { name: "Deposit Detail", hasIcon: true, isFavorite: false },
        { name: "Estimates by Customer", hasIcon: true, isFavorite: false },
        { name: "Inventory Valuation Detail", hasIcon: true, isFavorite: false },
        { name: "Inventory Valuation Summary", hasIcon: true, isFavorite: false },
        { name: "Product/Service List", hasIcon: true, isFavorite: false },
        { name: "Sales by Product/Service Summary", isFavorite: false },
        { name: "Sales by Product/Service Detail", hasIcon: true, isFavorite: false },
        { name: "Payment Method List", hasIcon: true, isFavorite: false },
        { name: "Physical Inventory Worksheet", hasIcon: true, isFavorite: false },
        { name: "Time Activities by Customer Detail", hasIcon: true, isFavorite: false },
        { name: "Transaction List by Customer", hasIcon: true, isFavorite: false },
        { name: "Transaction List by Tag Group", isFavorite: false }
      ]
    },
    {
      name: "What you owe",
      reports: [
        { name: "Accounts payable aging summary", isFavorite: false },
        { name: "Accounts payable aging detail", hasIcon: true, isFavorite: false },
        { name: "Bills and Applied Payments", isFavorite: false },
        { name: "Bill Payment List", hasIcon: true, isFavorite: false },
        { name: "1099 Contractor Balance Detail", hasIcon: true, isFavorite: false },
        { name: "1099 Contractor Balance Summary", hasIcon: true, isFavorite: false },
        { name: "Unpaid Bills", hasIcon: true, isFavorite: false },
        { name: "Vendor Balance Summary", hasIcon: true, isFavorite: false },
        { name: "Vendor Balance Detail", hasIcon: true, isFavorite: false }
      ]
    },
    {
      name: "Expenses and vendors",
      reports: [
        { name: "Check Detail", hasIcon: true, isFavorite: false },
        { name: "1099 Transaction Detail Report", isFavorite: false },
        { name: "Open Purchase Order List", isFavorite: false },
        { name: "Transaction List by Vendor", hasIcon: true, isFavorite: false },
        { name: "Vendor Contact List", hasIcon: true, isFavorite: false },
        { name: "Expenses by Vendor Summary", isFavorite: false },
        { name: "Vendor Phone List", isFavorite: false }
      ]
    },
    {
      name: "Employees",
      reports: [
        { name: "Employee Contact List", isFavorite: false },
        { name: "Recent/Edited Time Activities", hasIcon: true, isFavorite: false },
        { name: "Time Activities by Employee Detail", hasIcon: true, isFavorite: false }
      ]
    },
    {
      name: "For my accountant",
      reports: [
        { name: "Account List", hasIcon: true, isFavorite: false },
        { name: "Balance Sheet", hasIcon: true, isFavorite: true },
        { name: "Balance Sheet Comparison", hasIcon: true, isFavorite: false },
        { name: "Balance Sheet Detail", isFavorite: false },
        { name: "Balance Sheet Summary", isFavorite: false },
        { name: "Statement of Cash Flows", hasIcon: true, isFavorite: false },
        { name: "Invalid Journal Transactions", isFavorite: false },
        { name: "General Ledger", isFavorite: false },
        { name: "General Ledger List", isFavorite: false },
        { name: "Journal", hasIcon: true, isFavorite: false },
        { name: "Adjusting Journal Entries", isFavorite: false },
        { name: "Recurring Template List", isFavorite: false },
        { name: "Profit and Loss", hasIcon: true, isFavorite: true },
        { name: "Profit and Loss by Tag Group", isFavorite: false },
        { name: "Profit and Loss Comparison", hasIcon: true, isFavorite: false },
        { name: "Recent Transactions", hasIcon: true, isFavorite: false },
        { name: "Reconciliation Reports", isFavorite: false },
        { name: "Trial Balance", isFavorite: false },
        { name: "Adjusted Trial Balance", hasIcon: true, isFavorite: false },
        { name: "Transaction Detail by Account", hasIcon: true, isFavorite: false },
        { name: "Transaction List by Date", hasIcon: true, isFavorite: false },
        { name: "Transaction List with Splits", hasIcon: true, isFavorite: false }
      ]
    },
    {
      name: "Payroll",
      reports: [
        { name: "Paycheck History", isFavorite: false },
        { name: "Contractor Payments", isFavorite: false },
        { name: "Payroll Deductions/Contributions", isFavorite: false },
        { name: "Payroll Summary by Employee", isFavorite: false },
        { name: "Employee Directory", isFavorite: false },
        { name: "Employee Details", isFavorite: false },
        { name: "Multiple Worksites", isFavorite: false },
        { name: "Payroll Details", isFavorite: false },
        { name: "Payroll Item List", isFavorite: false },
        { name: "Payroll Summary", isFavorite: false },
        { name: "Vacation and Sick Leave", isFavorite: false },
        { name: "Retirement Plans", isFavorite: false },
        { name: "State Mandated Retirement Plans", isFavorite: false },
        { name: "Payroll Tax Liability", isFavorite: false },
        { name: "Payroll Tax Payments", isFavorite: false },
        { name: "Total Payroll Cost", isFavorite: false },
        { name: "Total Pay", isFavorite: false },
        { name: "Payroll Tax and Wage Summary", isFavorite: false },
        { name: "Workers' Compensation", isFavorite: false },
        { name: "Download Payroll Reports", isFavorite: false },
        { name: "Recent/Edited Time Activities", hasIcon: true, isFavorite: false },
        { name: "Time Activities by Employee Detail", hasIcon: true, isFavorite: false }
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "custom":
        return renderCustomReports();
      case "management":
        return renderManagementReports();
      case "kpis":
        return renderKPIs();
      case "spreadsheet":
        return renderSpreadsheetSync();
      case "performance":
        return renderPerformanceCenter();
      default:
        return renderStandardReports();
    }
  };

  const renderCustomReports = () => (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Report name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created by</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date range</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm text-gray-600">
                    Reports that you customize and then save will be listed here. Click &apos;Save Customizations&apos; at the top of the report.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                    <button className="hover:text-gray-700">First</button>
                    <button className="hover:text-gray-700">Previous</button>
                    <span>0 - 0</span>
                    <button className="hover:text-gray-700">Next</button>
                    <button className="hover:text-gray-700">Last</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderManagementReports = () => (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created by</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last modified</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Report period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Company Overview", label: "OPPORTUNITYOS REPORT" },
                { name: "Sales Performance", label: "OPPORTUNITYOS REPORT" },
                { name: "Expenses Performance", label: "OPPORTUNITYOS REPORT" }
              ].map((report, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{report.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-[#D4AF37] text-[#0D0D0D] rounded">
                        {report.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">OpportunityOS</td>
                  <td className="px-4 py-4 text-sm text-gray-700"></td>
                  <td className="px-4 py-4">
                    <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                      <option>This year</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <a href="#" className="text-sm text-[#D4AF37] hover:underline">Preview</a>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderKPIs = () => (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* KPI Scorecard Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">KPI Scorecard</h2>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-[#D4AF37] hover:underline">Learn more</a>
              <a href="#" className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Feedback
              </a>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Period</label>
              <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                <option>Last month</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Compare with</label>
              <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                <option>Previous period</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Category</label>
              <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
                <option>All</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input type="text" placeholder="Search" className="max-w-xs" />
            </div>
          </div>

          <p className="text-xs text-gray-500">Updated 2 minutes ago</p>
        </div>

        {/* KPI Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">KPI</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  <div>Last month</div>
                  <div className="font-normal text-gray-500">Sep 2025</div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  <div>Previous period</div>
                  <div className="font-normal text-gray-500">Aug 2025</div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Variance</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Variance %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Finance Category */}
              <tr className="bg-gray-50 border-b border-gray-200">
                <td colSpan={6} className="px-4 py-3">
                  <button
                    onClick={() => toggleKPI("Finance")}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-900"
                  >
                    {expandedKPIs.includes("Finance") ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Finance
                  </button>
                </td>
              </tr>
              {expandedKPIs.includes("Finance") && (
                <>
                  {/* Growth Subcategory */}
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <td colSpan={6} className="px-8 py-2">
                      <button
                        className="flex items-center gap-2 text-sm font-medium text-gray-900"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Growth
                      </button>
                    </td>
                  </tr>
                  {[
                    { name: "Revenue", lastMonth: "$0", prevPeriod: "$0", variance: "$0", variancePct: "N/A" },
                    { name: "Cost of Goods Sold", lastMonth: "$0", prevPeriod: "$0", variance: "$0", variancePct: "N/A" },
                    { name: "Total Expenses", lastMonth: "$0", prevPeriod: "$0", variance: "$0", variancePct: "N/A" }
                  ].map((kpi, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-12 py-3 text-sm text-gray-700">{kpi.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.lastMonth}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.prevPeriod}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.variance}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.variancePct}</td>
                      <td className="px-4 py-3 text-right">
                        <a href="#" className="text-sm text-blue-600 hover:underline">View</a>
                      </td>
                    </tr>
                  ))}

                  {/* Profitability Subcategory */}
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <td colSpan={6} className="px-8 py-2">
                      <button className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <ChevronDown className="h-4 w-4" />
                        Profitability
                      </button>
                    </td>
                  </tr>
                  {[
                    { name: "Gross Profit", lastMonth: "$0", prevPeriod: "$0", variance: "$0", variancePct: "N/A" },
                    { name: "Gross Profit Margin", lastMonth: "N/A", prevPeriod: "N/A", variance: "N/A", variancePct: "N/A" },
                    { name: "Net Profit", lastMonth: "$0", prevPeriod: "$0", variance: "$0", variancePct: "N/A" },
                    { name: "Net Profit Margin", lastMonth: "N/A", prevPeriod: "N/A", variance: "N/A", variancePct: "N/A" },
                    { name: "Operating Expenses", lastMonth: "$0", prevPeriod: "$0", variance: "$0", variancePct: "N/A" },
                    { name: "Net Operating Income", lastMonth: "$0", prevPeriod: "$0", variance: "$0", variancePct: "N/A" },
                    { name: "Operating Margin", lastMonth: "N/A", prevPeriod: "N/A", variance: "N/A", variancePct: "N/A" }
                  ].map((kpi, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-12 py-3 text-sm text-gray-700">{kpi.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.lastMonth}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.prevPeriod}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.variance}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{kpi.variancePct}</td>
                      <td className="px-4 py-3 text-right">
                        <a href="#" className="text-sm text-blue-600 hover:underline">View</a>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>1 - 10 of 10 items</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-gray-900">Page</button>
              <input type="number" defaultValue="1" className="w-12 px-2 py-1 border border-gray-300 rounded text-center" readOnly />
              <span>of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpreadsheetSync = () => (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="max-w-4xl bg-gray-50 rounded-lg p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Get deeper insights with<br />Spreadsheet Sync
              </h2>
              <p className="text-gray-700 mb-6">
                Securely send data back and forth between OpportunityOS and your
                spreadsheet for up-to-date data and custom insights.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create reports the way you want</h3>
                    <p className="text-sm text-gray-600">
                      Use spreadsheets to create custom charts and graphs using data from OpportunityOS.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></span>
                  <div>
                    <h3 className="font-semibold text-gray-900">A 2-way sync</h3>
                    <p className="text-sm text-gray-600">
                      Add and edit data in bulk in a spreadsheet, and sync it with OpportunityOS.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-2"></span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Run multi-company reports in spreadsheets</h3>
                    <p className="text-sm text-gray-600">
                      Group companies and run consolidated reports in spreadsheets.
                    </p>
                  </div>
                </li>
              </ul>
              <div className="flex gap-3 mt-8">
                <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10">
                  Run report in Excel
                </Button>
                <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10">
                  Run report in Google Sheets
                </Button>
              </div>
              <a href="#" className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:underline mt-4">
                Video tutorials
              </a>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-64 bg-white rounded-lg shadow-xl border border-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceCenter = () => (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Performance center</h2>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-sm">Create custom charts</Button>
              <Button variant="outline" className="text-sm flex items-center gap-2">
                Quick add charts
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0D0D0D] text-sm">
                + Add new chart
              </Button>
            </div>
          </div>

          {/* Info Bar */}
          <div className="flex items-center justify-between p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37]">ⓘ</span>
                <span><strong>Industry:</strong> not set</span>
              </div>
              <span>|</span>
              <span><strong>Revenue:</strong> Less than $500K</span>
              <span>|</span>
              <span><strong>Location:</strong> 49670</span>
              <span>|</span>
              <span><strong>Accounting method:</strong> Accrual basis</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">11 of 25 charts created</span>
              <Button variant="ghost" size="sm">Export</Button>
              <Button variant="ghost" size="sm">Settings</Button>
              <a href="#" className="text-blue-600 hover:underline">Give feedback</a>
            </div>
          </div>

          <div className="mb-4">
            <button className="text-sm text-blue-600 hover:underline">Customize Layout</button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* AR Aging Chart */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase">Accounts receivable by aging</h3>
                <p className="text-xs text-gray-500">As of today</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40 rounded-full border-8 border-gray-200"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total A/R amount</div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]"></span>
                  <span className="text-gray-700">$0.00 Current</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]/70"></span>
                  <span className="text-gray-700">$0.00 1-7 days</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]/50"></span>
                  <span className="text-gray-700">$0.00 8-15 days</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]/30"></span>
                  <span className="text-gray-700">$0.00 &gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* AP Aging Chart */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase">Accounts payable by aging</h3>
                <p className="text-xs text-gray-500">As of today</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40 rounded-full border-8 border-gray-200"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total A/P amount</div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]"></span>
                  <span className="text-gray-700">$0.00 Current</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]/70"></span>
                  <span className="text-gray-700">$0.00 1-7 days</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]/50"></span>
                  <span className="text-gray-700">$0.00 8-15 days</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]/30"></span>
                  <span className="text-gray-700">$0.00 &gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses by Time */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase">Expenses by time</h3>
              </div>
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option>This year to date</option>
              </select>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
              {/* Empty bar chart representation */}
              <div className="flex-1 h-full bg-gray-100 rounded-t"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total expenses</div>
            </div>
          </div>

          {/* Revenue by Time */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase">Revenue by time</h3>
              </div>
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option>This year to date</option>
              </select>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
              {/* Empty bar chart representation */}
              <div className="flex-1 h-full bg-gray-100 rounded-t"></div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-500">Total revenue</div>
            </div>
          </div>

          {/* Continue with more chart placeholders... */}
          {[1, 2, 3, 4].map((_, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">Chart {idx + 5}</h3>
                </div>
                <select className="text-xs border border-gray-300 rounded px-2 py-1">
                  <option>This year to date</option>
                </select>
              </div>
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                <span className="text-gray-400 text-sm">Chart placeholder</span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">$0.00</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStandardReports = () => (
    <>
      {/* AI Summary Banner */}
      <div className="mx-6 mt-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            I generated a financial summary for September to give you key insights into your finances.{" "}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Review Summary
            </a>
          </p>
        </div>
      </div>

      {/* Reports Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {standardReports.map((category) => (
          <div key={category.name} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
            >
              {expandedCategories.includes(category.name) ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
              <span className="font-semibold text-gray-900">{category.name}</span>
            </button>

            {/* Category Reports */}
            {expandedCategories.includes(category.name) && (
              <div className="border-t border-gray-200">
                {category.name === "Custom report builder" ? (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      {category.reports[0].name}{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Create new report
                      </a>
                    </p>
                    {category.reports.slice(1).map((report, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4"
                      >
                        <span className="text-sm text-gray-700">{report.name}</span>
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Star className="h-5 w-5 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {category.reports.map((report, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors",
                          idx % 2 === 0 ? "" : ""
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {report.hasIcon && (
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="text-sm text-gray-700">{report.name}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Star
                              className={cn(
                                "h-5 w-5",
                                report.isFavorite ? "text-green-600 fill-green-600" : "text-gray-400"
                              )}
                            />
                          </button>
                          {report.hasIcon !== undefined && (
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreVertical className="h-5 w-5 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative py-4 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.badge && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-pink-500" />
                )}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Actions - Only show for Standard and Custom tabs */}
      {(activeTab === "standard" || activeTab === "custom") && (
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Type report name here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0D0D0D]">
                Create new report
              </Button>
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Render Tab Content */}
      {renderContent()}
    </div>
  );
}
