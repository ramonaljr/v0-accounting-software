/**
 * Dashboard Server Actions
 * Enhanced metrics fetching with filter support
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentOrganization } from "@/lib/auth/server";
import type { DashboardFilters, DashboardMetrics } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Type alias for Supabase client
type TypedSupabaseClient = SupabaseClient<Database>;

// Database row types for query results
interface ARAgingRow {
  total_outstanding?: string | number | null;
  current?: string | number | null;
  days_1_30?: string | number | null;
  days_31_60?: string | number | null;
  days_61_90?: string | number | null;
  days_90_plus?: string | number | null;
}

interface InvoiceRow {
  status: string | null;
  total: string | number | null;
  amount_due: string | number | null;
}

// =====================================================
// GET DASHBOARD METRICS WITH FILTERS
// =====================================================

export async function getDashboardMetrics(
  filters?: Partial<DashboardFilters>
): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    // Verify authentication using auth helper
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization using auth helper
    const organization = await getCurrentOrganization();
    if (!organization) {
      return { success: false, error: "No organization found" };
    }

    const supabase = await createClient();
    const orgId = organization.id;

    // Apply default filters
    const today = new Date();
    const startDate = filters?.startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const endDate = filters?.endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
    const basis = filters?.basis || 'accrual';
    const currency = filters?.currency || 'USD';

    // Fetch all metrics in parallel
    const [
      revenueData,
      expensesData,
      arData,
      apData,
      invoicesData,
      billsData,
      bankAccountsData,
      taxesData,
      balanceSheetData,
    ] = await Promise.all([
      fetchRevenueMetrics(supabase, orgId, startDate, endDate, basis),
      fetchExpenseMetrics(supabase, orgId, startDate, endDate, basis),
      fetchARMetrics(supabase, orgId),
      fetchAPMetrics(supabase, orgId),
      fetchInvoiceMetrics(supabase, orgId),
      fetchBillMetrics(supabase, orgId),
      fetchBankAccountMetrics(supabase, orgId),
      fetchTaxMetrics(supabase, orgId),
      fetchBalanceSheetMetrics(supabase, orgId, endDate),
    ]);

    // Calculate net income
    const netIncome = {
      mtd: revenueData.mtd - expensesData.mtd,
      ytd: revenueData.ytd - expensesData.ytd,
      margin: revenueData.mtd > 0 ? ((revenueData.mtd - expensesData.mtd) / revenueData.mtd) * 100 : 0,
      priorPeriodMtd: (revenueData.priorPeriodMtd || 0) - (expensesData.priorPeriodMtd || 0),
    };

    // Calculate cash flow
    const cashFlow = {
      moneyIn: revenueData.mtd,
      moneyOut: expensesData.mtd,
      netCashFlow: netIncome.mtd,
      operatingCashFlow: netIncome.mtd, // TODO: Adjust for non-cash items
      endingCash: bankAccountsData.reduce((sum, acc) => sum + acc.balance, 0),
    };

    // Calculate KPIs
    const kpis = {
      grossMarginPercent: revenueData.mtd > 0 ? ((revenueData.mtd - (expensesData.mtd * 0.4)) / revenueData.mtd) * 100 : 0,
      netMarginPercent: netIncome.margin,
      currentRatio: balanceSheetData ? balanceSheetData.workingCapital / Math.max(balanceSheetData.liabilities * 0.5, 1) : 0,
      quickRatio: 0, // TODO: Calculate
      debtToEquity: balanceSheetData && balanceSheetData.equity > 0 ? balanceSheetData.liabilities / balanceSheetData.equity : 0,
      dso: arData.dso,
      dpo: apData.dpo,
      roa: 0, // TODO: Calculate
      roe: 0, // TODO: Calculate
    };

    // Calculate reconciliation progress
    const reconciliation = {
      percentReconciled: 85, // TODO: Calculate from actual data
      totalAccounts: bankAccountsData.length,
      reconciledAccounts: bankAccountsData.filter(acc => acc.varianceToBank === 0).length,
      unreconciledCount: bankAccountsData.filter(acc => (acc.forReviewCount || 0) > 0).length,
      exceptions: bankAccountsData.reduce((sum, acc) => sum + (acc.forReviewCount || 0), 0),
      lastReconcileDate: new Date().toISOString().split('T')[0],
    };

    const metrics: DashboardMetrics = {
      revenue: revenueData,
      expenses: expensesData,
      netIncome,
      ar: arData,
      ap: apData,
      invoices: invoicesData,
      bills: billsData,
      bankAccounts: bankAccountsData,
      taxes: taxesData,
      cashFlow,
      balanceSheet: balanceSheetData,
      kpis,
      reconciliation,
    };

    return { success: true, data: metrics };
  } catch (error) {
    console.error("[Dashboard] Metrics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// HELPER FUNCTIONS FOR FETCHING SPECIFIC METRICS
// =====================================================

async function fetchRevenueMetrics(
  supabase: TypedSupabaseClient,
  orgId: string,
  startDate: string,
  endDate: string,
  basis: string
) {
  // TODO: Query from journal_entries or use existing generateProfitLossReport
  const trend = generateTrendData(6);

  return {
    mtd: 12500,
    ytd: 150000,
    trend,
    priorPeriodMtd: 10200,
    growth: 22.5,
  };
}

async function fetchExpenseMetrics(
  supabase: TypedSupabaseClient,
  orgId: string,
  startDate: string,
  endDate: string,
  basis: string
) {
  // TODO: Query from journal_entries grouped by account category
  const trend = generateTrendData(6, 8000, 18000);

  return {
    mtd: 8300,
    ytd: 95000,
    trend,
    byCategory: [
      { category: 'Office Supplies', categoryId: '1', amount: 1250, percentage: 15 },
      { category: 'Software & Tools', categoryId: '2', amount: 3500, percentage: 42 },
      { category: 'Marketing', categoryId: '3', amount: 2000, percentage: 24 },
      { category: 'Travel', categoryId: '4', amount: 800, percentage: 10 },
      { category: 'Other', categoryId: '5', amount: 750, percentage: 9 },
    ],
    priorPeriodMtd: 7800,
  };
}

async function fetchARMetrics(supabase: TypedSupabaseClient, orgId: string) {
  // Query ar_aging view
  const { data, error } = await supabase
    .from("ar_aging")
    .select("*")
    .eq("org_id", orgId);

  if (error || !data) {
    return {
      total: 0,
      overdue: 0,
      aging: { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0 },
      customersCount: 0,
    };
  }

  const rows = data as ARAgingRow[];
  const total = rows.reduce((sum, row) => sum + parseFloat(String(row.total_outstanding || 0)), 0);
  const aging = {
    current: rows.reduce((sum, row) => sum + parseFloat(String(row.current || 0)), 0),
    days_1_30: rows.reduce((sum, row) => sum + parseFloat(String(row.days_1_30 || 0)), 0),
    days_31_60: rows.reduce((sum, row) => sum + parseFloat(String(row.days_31_60 || 0)), 0),
    days_61_90: rows.reduce((sum, row) => sum + parseFloat(String(row.days_61_90 || 0)), 0),
    days_90_plus: rows.reduce((sum, row) => sum + parseFloat(String(row.days_90_plus || 0)), 0),
  };
  const overdue = aging.days_1_30 + aging.days_31_60 + aging.days_61_90 + aging.days_90_plus;

  // Calculate DSO (Days Sales Outstanding)
  const dso = total > 0 ? Math.round((total / (12500 / 30))) : 0; // TODO: Use actual revenue/day

  return {
    total,
    overdue,
    aging,
    customersCount: data.length,
    dso,
  };
}

async function fetchAPMetrics(supabase: TypedSupabaseClient, orgId: string) {
  // TODO: Create ap_aging view similar to ar_aging
  return {
    total: 8500,
    overdue: 2500,
    aging: {
      current: 6000,
      days_1_30: 1200,
      days_31_60: 800,
      days_61_90: 300,
      days_90_plus: 200,
    },
    vendorsCount: 8,
    dpo: 28,
  };
}

async function fetchInvoiceMetrics(supabase: TypedSupabaseClient, orgId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("status, total, amount_due")
    .eq("org_id", orgId);

  if (error || !data) {
    return {
      draft: 0,
      sent: 0,
      overdue: 0,
      paid: 0,
      totalDraft: 0,
      totalSent: 0,
      totalOverdue: 0,
    };
  }

  const invoices = data as InvoiceRow[];
  const draft = invoices.filter((inv) => inv.status === "draft");
  const sent = invoices.filter((inv) => inv.status === "sent");
  const overdueInv = invoices.filter((inv) => inv.status === "overdue");
  const paid = invoices.filter((inv) => inv.status === "paid");

  return {
    draft: draft.length,
    sent: sent.length,
    overdue: overdueInv.length,
    paid: paid.length,
    totalDraft: draft.reduce((sum, inv) => sum + parseFloat(String(inv.total || 0)), 0),
    totalSent: sent.reduce((sum, inv) => sum + parseFloat(String(inv.amount_due || 0)), 0),
    totalOverdue: overdueInv.reduce((sum, inv) => sum + parseFloat(String(inv.amount_due || 0)), 0),
  };
}

async function fetchBillMetrics(supabase: TypedSupabaseClient, orgId: string) {
  // TODO: Query bills table when available
  return {
    open: 5,
    overdue: 2,
    paid30Days: 15000,
    total: 8500,
    nextDueDate: '2025-01-15',
    nextDueAmount: 1500,
  };
}

async function fetchBankAccountMetrics(supabase: TypedSupabaseClient, orgId: string) {
  // TODO: Query bank_accounts table when available
  return [
    {
      id: '1',
      name: 'Business Checking',
      balance: 45230.50,
      currency: 'USD',
      lastSync: '2 mins ago',
      status: 'connected' as const,
      forReviewCount: 5,
      varianceToBank: 0,
    },
    {
      id: '2',
      name: 'Business Savings',
      balance: 125000.00,
      currency: 'USD',
      lastSync: '2 mins ago',
      status: 'connected' as const,
      forReviewCount: 0,
      varianceToBank: 0,
    },
    {
      id: '3',
      name: 'Credit Card',
      balance: -3250.00,
      currency: 'USD',
      lastSync: '1 hour ago',
      status: 'error' as const,
      forReviewCount: 12,
      varianceToBank: 125.50,
    },
  ];
}

async function fetchTaxMetrics(supabase: TypedSupabaseClient, orgId: string) {
  // TODO: Query tax liabilities and jurisdictions
  return {
    salesTax: {
      collected: 2340,
      due: 1850,
      nextFilingDate: '2025-01-31',
      jurisdiction: 'California',
    },
    payrollTax: {
      due: 3200,
      nextFilingDate: '2025-01-15',
    },
    incomeTax: {
      estimated: 12000,
      paid: 8000,
      nextQuarterDate: '2025-04-15',
    },
  };
}

async function fetchBalanceSheetMetrics(supabase: TypedSupabaseClient, orgId: string, asOfDate: string) {
  // TODO: Use generate_balance_sheet function
  return {
    assets: 250000,
    liabilities: 50000,
    equity: 200000,
    workingCapital: 75000,
    asOfDate,
  };
}

// =====================================================
// MOCK DATA GENERATOR
// =====================================================

function getMockDashboardMetrics(filters?: Partial<DashboardFilters>): DashboardMetrics {
  return {
    statusBars: {
      purchaseOrders: 8,
      overdue: 3,
      openBills: 12,
      paidLast30Days: 24,
    },
    revenue: {
      mtd: 12500,
      ytd: 150000,
      trend: generateTrendData(6, 18000, 28000),
      priorPeriodMtd: 10200,
      growth: 22.5,
    },
    expenses: {
      mtd: 8300,
      ytd: 95000,
      trend: generateTrendData(6, 8000, 18000),
      byCategory: [
        { category: 'Office Supplies', categoryId: '1', amount: 1250, percentage: 15 },
        { category: 'Software & Tools', categoryId: '2', amount: 3500, percentage: 42 },
        { category: 'Marketing', categoryId: '3', amount: 2000, percentage: 24 },
        { category: 'Travel', categoryId: '4', amount: 800, percentage: 10 },
        { category: 'Other', categoryId: '5', amount: 750, percentage: 9 },
      ],
      priorPeriodMtd: 7800,
    },
    netIncome: {
      mtd: 4200,
      ytd: 55000,
      margin: 33.6,
      priorPeriodMtd: 2400,
    },
    ar: {
      total: 15000,
      overdue: 3500,
      aging: {
        current: 11500,
        days_1_30: 1500,
        days_31_60: 1000,
        days_61_90: 500,
        days_90_plus: 500,
      },
      customersCount: 12,
      dso: 32,
    },
    ap: {
      total: 8500,
      overdue: 2500,
      aging: {
        current: 6000,
        days_1_30: 1200,
        days_31_60: 800,
        days_61_90: 300,
        days_90_plus: 200,
      },
      vendorsCount: 8,
      dpo: 28,
    },
    invoices: {
      draft: 2,
      sent: 8,
      overdue: 3,
      paid: 15,
      totalDraft: 3200,
      totalSent: 15000,
      totalOverdue: 3500,
    },
    bills: {
      open: 5,
      overdue: 2,
      paid30Days: 15000,
      total: 8500,
      nextDueDate: '2025-01-15',
      nextDueAmount: 1500,
    },
    bankAccounts: [
      {
        id: '1',
        name: 'Business Checking',
        balance: 45230.50,
        currency: 'USD',
        lastSync: '2 mins ago',
        status: 'connected',
        forReviewCount: 5,
        varianceToBank: 0,
      },
      {
        id: '2',
        name: 'Business Savings',
        balance: 125000.00,
        currency: 'USD',
        lastSync: '2 mins ago',
        status: 'connected',
        forReviewCount: 0,
        varianceToBank: 0,
      },
      {
        id: '3',
        name: 'Credit Card',
        balance: -3250.00,
        currency: 'USD',
        lastSync: '1 hour ago',
        status: 'error',
        forReviewCount: 12,
        varianceToBank: 125.50,
      },
    ],
    taxes: {
      salesTax: {
        collected: 2340,
        due: 1850,
        nextFilingDate: '2025-01-31',
        jurisdiction: 'California',
      },
      payrollTax: {
        due: 3200,
        nextFilingDate: '2025-01-15',
      },
      incomeTax: {
        estimated: 12000,
        paid: 8000,
        nextQuarterDate: '2025-04-15',
      },
    },
    cashFlow: {
      moneyIn: 12500,
      moneyOut: 8300,
      netCashFlow: 4200,
      operatingCashFlow: 5200,
      investingCashFlow: -2000,
      financingCashFlow: 1000,
      endingCash: 170230.50,
    },
    balanceSheet: {
      assets: 250000,
      liabilities: 50000,
      equity: 200000,
      workingCapital: 75000,
      asOfDate: new Date().toISOString().split('T')[0],
    },
    kpis: {
      grossMarginPercent: 65.0,
      netMarginPercent: 33.6,
      currentRatio: 3.5,
      quickRatio: 2.8,
      debtToEquity: 0.25,
      dso: 32,
      dpo: 28,
      roa: 22.0,
      roe: 27.5,
    },
    reconciliation: {
      percentReconciled: 85,
      totalAccounts: 3,
      reconciledAccounts: 2,
      unreconciledCount: 1,
      exceptions: 17,
      lastReconcileDate: new Date().toISOString().split('T')[0],
    },
    toDeposit: {
      totalAmount: 4250,
      itemCount: 8,
      oldestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      byPaymentMethod: [
        { method: 'Check', amount: 2100, count: 3 },
        { method: 'Cash', amount: 1500, count: 4 },
        { method: 'Credit Card', amount: 650, count: 1 },
      ],
    },
    unbilled: {
      totalAmount: 8750,
      timeAmount: 6200,
      timeHours: 62,
      expenseAmount: 2550,
      expenseCount: 12,
      byClient: [
        { clientName: 'Acme Corp', amount: 3200 },
        { clientName: 'TechStart Inc', amount: 2800 },
        { clientName: 'GlobalBiz LLC', amount: 2750 },
      ],
    },
    estimates: {
      totalValue: 45000,
      count: 12,
      acceptedCount: 3,
      acceptedValue: 18500,
      conversionRate: 42,
      expiringCount: 2,
      byStatus: [
        { status: 'Sent', count: 7, value: 25000 },
        { status: 'Viewed', count: 3, value: 15000 },
        { status: 'Expired', count: 2, value: 5000 },
      ],
    },
  };
}

function generateTrendData(months: number, min: number = 18000, max: number = 28000) {
  const today = new Date();
  const trend = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
    const amount = Math.floor(Math.random() * (max - min) + min);
    trend.push({ period: monthName, amount });
  }

  return trend;
}
