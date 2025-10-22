/**
 * Reports Server Actions
 * Generate financial reports (P&L, Balance Sheet, Cash Flow, etc.)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const ReportPeriodSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const BalanceSheetSchema = z.object({
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// =====================================================
// GENERATE PROFIT & LOSS REPORT
// =====================================================

export async function generateProfitLossReport(input: z.infer<typeof ReportPeriodSchema>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Validate input
    const validation = ReportPeriodSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const { startDate, endDate } = validation.data;

    // Call stored procedure
    const { data, error } = await supabase.rpc("generate_profit_loss", {
      p_org_id: membership.org_id,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error("[Report] P&L generation error:", error);
      return { success: false, error: "Failed to generate Profit & Loss report" };
    }

    // Group by account type
    const revenue = data?.filter((row: any) => ["revenue", "other_income"].includes(row.account_type)) || [];
    const expenses = data?.filter((row: any) => ["expense", "cost_of_goods_sold", "other_expense"].includes(row.account_type)) || [];

    const totalRevenue = revenue.reduce((sum: number, row: any) => sum + parseFloat(row.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, row: any) => sum + parseFloat(row.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      success: true,
      data: {
        period: { startDate, endDate },
        revenue,
        expenses,
        totals: {
          totalRevenue,
          totalExpenses,
          netIncome,
        },
      },
    };
  } catch (error) {
    console.error("[Report] P&L unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GENERATE BALANCE SHEET REPORT
// =====================================================

export async function generateBalanceSheetReport(input: z.infer<typeof BalanceSheetSchema>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Validate input
    const validation = BalanceSheetSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const { asOfDate } = validation.data;

    // Call stored procedure
    const { data, error } = await supabase.rpc("generate_balance_sheet", {
      p_org_id: membership.org_id,
      p_as_of_date: asOfDate,
    });

    if (error) {
      console.error("[Report] Balance Sheet generation error:", error);
      return { success: false, error: "Failed to generate Balance Sheet report" };
    }

    // Group by account type
    const assets = data?.filter((row: any) => row.account_type === "asset") || [];
    const liabilities = data?.filter((row: any) => row.account_type === "liability") || [];
    const equity = data?.filter((row: any) => row.account_type === "equity") || [];

    const totalAssets = assets.reduce((sum: number, row: any) => sum + parseFloat(row.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum: number, row: any) => sum + parseFloat(row.balance || 0), 0);
    const totalEquity = equity.reduce((sum: number, row: any) => sum + parseFloat(row.balance || 0), 0);

    return {
      success: true,
      data: {
        asOfDate,
        assets,
        liabilities,
        equity,
        totals: {
          totalAssets,
          totalLiabilities,
          totalEquity,
        },
        balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      },
    };
  } catch (error) {
    console.error("[Report] Balance Sheet unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GENERATE TRIAL BALANCE REPORT
// =====================================================

export async function generateTrialBalanceReport(input: z.infer<typeof BalanceSheetSchema>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Validate input
    const validation = BalanceSheetSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const { asOfDate } = validation.data;

    // Query trial balance view
    const { data, error } = await supabase
      .from("trial_balance")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("account_code");

    if (error) {
      console.error("[Report] Trial Balance query error:", error);
      return { success: false, error: "Failed to generate Trial Balance report" };
    }

    const totalDebits = data?.reduce((sum, row) => sum + parseFloat(row.total_debits || 0), 0) || 0;
    const totalCredits = data?.reduce((sum, row) => sum + parseFloat(row.total_credits || 0), 0) || 0;

    return {
      success: true,
      data: {
        asOfDate,
        accounts: data,
        totals: {
          totalDebits,
          totalCredits,
          balanced: Math.abs(totalDebits - totalCredits) < 0.01,
        },
      },
    };
  } catch (error) {
    console.error("[Report] Trial Balance unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GENERATE AR AGING REPORT
// =====================================================

export async function generateARAgingReport() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Query AR aging view
    const { data, error } = await supabase
      .from("ar_aging")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("total_outstanding", { ascending: false });

    if (error) {
      console.error("[Report] AR Aging query error:", error);
      return { success: false, error: "Failed to generate AR Aging report" };
    }

    const totals = {
      totalOutstanding: data?.reduce((sum, row) => sum + parseFloat(row.total_outstanding || 0), 0) || 0,
      current: data?.reduce((sum, row) => sum + parseFloat(row.current || 0), 0) || 0,
      days_1_30: data?.reduce((sum, row) => sum + parseFloat(row.days_1_30 || 0), 0) || 0,
      days_31_60: data?.reduce((sum, row) => sum + parseFloat(row.days_31_60 || 0), 0) || 0,
      days_61_90: data?.reduce((sum, row) => sum + parseFloat(row.days_61_90 || 0), 0) || 0,
      days_90_plus: data?.reduce((sum, row) => sum + parseFloat(row.days_90_plus || 0), 0) || 0,
    };

    return {
      success: true,
      data: {
        customers: data,
        totals,
      },
    };
  } catch (error) {
    console.error("[Report] AR Aging unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GET DASHBOARD METRICS
// =====================================================

export async function getDashboardMetrics() {
  try {
    // TEMPORARY: Always return mock data until auth is properly configured
    const bypassAuth = true; // Hardcoded for now
    if (bypassAuth) {
      return {
        success: true,
        data: {
          revenue: { mtd: 12500, ytd: 150000, trend: [
            { month: 'Jul', amount: 18000 },
            { month: 'Aug', amount: 22000 },
            { month: 'Sep', amount: 25000 },
            { month: 'Oct', amount: 28000 },
            { month: 'Nov', amount: 24000 },
            { month: 'Dec', amount: 12500 },
          ]},
          expenses: { mtd: 8300, ytd: 95000, trend: [
            { month: 'Jul', amount: 12000 },
            { month: 'Aug', amount: 14000 },
            { month: 'Sep', amount: 16000 },
            { month: 'Oct', amount: 18000 },
            { month: 'Nov', amount: 15000 },
            { month: 'Dec', amount: 8300 },
          ]},
          netIncome: { mtd: 4200, ytd: 55000 },
          ar: { total: 15000, overdue: 3500 },
          invoices: { draft: 2, sent: 8, overdue: 3 },
        },
      };
    }

    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    const orgId = membership.org_id;

    // Get current month dates
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

    // Get key metrics in parallel
    const [plResult, arAgingResult, invoicesResult] = await Promise.all([
      generateProfitLossReport({ startDate: startOfMonth, endDate: endOfMonth }),
      generateARAgingReport(),
      supabase
        .from("invoices")
        .select("status, total, amount_due")
        .eq("org_id", orgId),
    ]);

    const revenue = plResult.success ? plResult.data?.totals.totalRevenue : 0;
    const expenses = plResult.success ? plResult.data?.totals.totalExpenses : 0;
    const netIncome = revenue - expenses;

    const arTotal = arAgingResult.success ? arAgingResult.data?.totals.totalOutstanding : 0;
    const arOverdue = arAgingResult.success
      ? (arAgingResult.data?.totals.days_1_30 || 0) +
        (arAgingResult.data?.totals.days_31_60 || 0) +
        (arAgingResult.data?.totals.days_61_90 || 0) +
        (arAgingResult.data?.totals.days_90_plus || 0)
      : 0;

    const invoices = invoicesResult.data || [];
    const draftInvoices = invoices.filter((inv) => inv.status === "draft").length;
    const overdueInvoices = invoices.filter((inv) => inv.status === "overdue").length;

    return {
      success: true,
      data: {
        revenue,
        expenses,
        netIncome,
        arTotal,
        arOverdue,
        draftInvoices,
        overdueInvoices,
        period: { startDate: startOfMonth, endDate: endOfMonth },
      },
    };
  } catch (error) {
    console.error("[Dashboard] Metrics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
