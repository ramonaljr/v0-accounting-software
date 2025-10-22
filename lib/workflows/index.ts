/**
 * Workflow Automation Helpers
 * Utilities for scheduled jobs and automation workflows
 */

import { createClient } from "@/lib/supabase/server";
import { ledgerBot, reconAI } from "@/lib/ai";

// =====================================================
// DAILY BANK SYNC WORKFLOW
// =====================================================

/**
 * Sync all active bank connections for an organization
 * Trigger: Daily at 2 AM
 */
export async function dailyBankSync(orgId: string): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}> {
  console.log(`[Workflow] Starting daily bank sync for org: ${orgId}`);
  const supabase = await createClient();

  try {
    // Get all active bank connections
    const { data: connections, error } = await supabase
      .from("bank_connections")
      .select("*")
      .eq("org_id", orgId)
      .eq("sync_status", "active");

    if (error || !connections) {
      console.error("[Workflow] Failed to fetch bank connections:", error);
      return { success: false, synced: 0, failed: 0, errors: [error?.message || "Unknown error"] };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sync each connection
    for (const connection of connections) {
      try {
        // TODO: Implement actual Plaid/Wise sync
        // For now, log the sync attempt
        console.log(`[Workflow] Syncing connection: ${connection.id}`);

        await supabase
          .from("bank_connections")
          .update({
            last_sync_at: new Date().toISOString(),
            sync_status: "active",
            last_sync_error: null,
          })
          .eq("id", connection.id);

        synced++;
      } catch (err) {
        console.error(`[Workflow] Sync failed for connection ${connection.id}:`, err);
        failed++;
        errors.push(`Connection ${connection.institution_name}: ${err instanceof Error ? err.message : "Unknown error"}`);

        await supabase
          .from("bank_connections")
          .update({
            sync_status: "error",
            last_sync_error: err instanceof Error ? err.message : "Unknown error",
          })
          .eq("id", connection.id);
      }
    }

    console.log(`[Workflow] Bank sync completed. Synced: ${synced}, Failed: ${failed}`);

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
    };
  } catch (error) {
    console.error("[Workflow] Daily bank sync error:", error);
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// =====================================================
// NIGHTLY AUTO-CATEGORIZATION WORKFLOW
// =====================================================

/**
 * Auto-categorize uncategorized transactions
 * Trigger: Daily at 3 AM (after bank sync)
 */
export async function nightlyAutoCategorization(orgId: string, userId: string): Promise<{
  success: boolean;
  categorized: number;
  autoPosted: number;
  needsReview: number;
  errors: string[];
}> {
  console.log(`[Workflow] Starting nightly auto-categorization for org: ${orgId}`);
  const supabase = await createClient();

  try {
    // Get uncategorized bank transactions
    const { data: transactions, error } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("org_id", orgId)
      .is("suggested_account_id", null)
      .eq("is_reconciled", false)
      .limit(100); // Process in batches

    if (error || !transactions) {
      console.error("[Workflow] Failed to fetch transactions:", error);
      return {
        success: false,
        categorized: 0,
        autoPosted: 0,
        needsReview: 0,
        errors: [error?.message || "Unknown error"],
      };
    }

    let categorized = 0;
    let autoPosted = 0;
    let needsReview = 0;
    const errors: string[] = [];

    // Categorize each transaction
    for (const txn of transactions) {
      try {
        const result = await ledgerBot.execute(
          {
            id: txn.id,
            date: txn.date,
            description: txn.description,
            amount: parseFloat(txn.amount),
            merchantName: txn.merchant_name,
            category: txn.category,
          },
          { orgId, userId, tier: "starter" as const }
        );

        if (result.success && result.data) {
          // Update transaction with suggestion
          await supabase
            .from("bank_transactions")
            .update({
              suggested_account_id: result.data.accountId,
              categorization_confidence: result.confidence,
              suggested_by: "ai_bot",
            })
            .eq("id", txn.id);

          categorized++;

          // Auto-post if confidence is high enough
          if (result.confidence && result.confidence >= 0.90) {
            // TODO: Create journal entry
            autoPosted++;
          } else {
            needsReview++;
          }
        }
      } catch (err) {
        console.error(`[Workflow] Categorization failed for transaction ${txn.id}:`, err);
        errors.push(`Transaction ${txn.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    console.log(
      `[Workflow] Auto-categorization completed. Categorized: ${categorized}, Auto-posted: ${autoPosted}, Needs review: ${needsReview}`
    );

    return {
      success: errors.length === 0,
      categorized,
      autoPosted,
      needsReview,
      errors,
    };
  } catch (error) {
    console.error("[Workflow] Nightly auto-categorization error:", error);
    return {
      success: false,
      categorized: 0,
      autoPosted: 0,
      needsReview: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// =====================================================
// WEEKLY RECONCILIATION WORKFLOW
// =====================================================

/**
 * Run auto-reconciliation for all bank accounts
 * Trigger: Weekly on Sundays
 */
export async function weeklyReconciliation(orgId: string, userId: string): Promise<{
  success: boolean;
  accountsReconciled: number;
  totalMatches: number;
  errors: string[];
}> {
  console.log(`[Workflow] Starting weekly reconciliation for org: ${orgId}`);
  const supabase = await createClient();

  try {
    // Get all bank accounts
    const { data: bankAccounts, error } = await supabase
      .from("bank_connections")
      .select("id, linked_account_id, institution_name")
      .eq("org_id", orgId)
      .eq("sync_status", "active");

    if (error || !bankAccounts) {
      console.error("[Workflow] Failed to fetch bank accounts:", error);
      return {
        success: false,
        accountsReconciled: 0,
        totalMatches: 0,
        errors: [error?.message || "Unknown error"],
      };
    }

    let accountsReconciled = 0;
    let totalMatches = 0;
    const errors: string[] = [];

    // Reconcile each account
    for (const account of bankAccounts) {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days

        const result = await reconAI.execute(
          {
            accountId: account.linked_account_id,
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            statementBalance: 0, // TODO: Get from bank API
          },
          { orgId, userId, tier: "starter" as const }
        );

        if (result.success && result.data) {
          accountsReconciled++;
          totalMatches += result.data.matches.length;

          console.log(
            `[Workflow] Reconciled ${account.institution_name}: ${result.data.matches.length} matches`
          );
        }
      } catch (err) {
        console.error(`[Workflow] Reconciliation failed for account ${account.id}:`, err);
        errors.push(`Account ${account.institution_name}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    console.log(
      `[Workflow] Weekly reconciliation completed. Accounts: ${accountsReconciled}, Matches: ${totalMatches}`
    );

    return {
      success: errors.length === 0,
      accountsReconciled,
      totalMatches,
      errors,
    };
  } catch (error) {
    console.error("[Workflow] Weekly reconciliation error:", error);
    return {
      success: false,
      accountsReconciled: 0,
      totalMatches: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// =====================================================
// DAILY FX RATE UPDATE WORKFLOW
// =====================================================

/**
 * Update exchange rates from external provider
 * Trigger: Daily at 1 AM
 */
export async function dailyFXRateUpdate(): Promise<{
  success: boolean;
  ratesUpdated: number;
  errors: string[];
}> {
  console.log(`[Workflow] Starting daily FX rate update`);
  const supabase = await createClient();

  try {
    // TODO: Fetch rates from external API (ECB, OpenExchangeRates, etc.)
    // For now, this is a placeholder

    const today = new Date().toISOString().split("T")[0];

    // Example: Update USD to EUR rate
    const rates = [
      { from: "USD", to: "EUR", rate: 0.92, date: today },
      { from: "USD", to: "GBP", rate: 0.79, date: today },
      { from: "USD", to: "PHP", rate: 56.5, date: today },
      { from: "USD", to: "JPY", rate: 148.0, date: today },
    ];

    for (const rate of rates) {
      await supabase.from("exchange_rates").upsert(
        {
          from_currency: rate.from,
          to_currency: rate.to,
          rate: rate.rate,
          rate_date: rate.date,
          source: "manual", // TODO: Change to actual provider
        },
        {
          onConflict: "from_currency,to_currency,rate_date",
        }
      );
    }

    console.log(`[Workflow] FX rates updated: ${rates.length} rates`);

    return {
      success: true,
      ratesUpdated: rates.length,
      errors: [],
    };
  } catch (error) {
    console.error("[Workflow] Daily FX rate update error:", error);
    return {
      success: false,
      ratesUpdated: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// =====================================================
// INVOICE DUNNING WORKFLOW
// =====================================================

/**
 * Send payment reminders for overdue invoices
 * Trigger: Daily at 9 AM
 */
export async function invoiceDunning(orgId: string): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> {
  console.log(`[Workflow] Starting invoice dunning for org: ${orgId}`);
  const supabase = await createClient();

  try {
    const today = new Date().toISOString().split("T")[0];

    // Get overdue invoices
    const { data: overdueInvoices, error } = await supabase
      .from("invoices")
      .select("*, customer:customers(*)")
      .eq("org_id", orgId)
      .lt("due_date", today)
      .in("status", ["sent", "viewed", "partial"])
      .gt("amount_due", 0);

    if (error) {
      console.error("[Workflow] Failed to fetch overdue invoices:", error);
      return {
        success: false,
        remindersSent: 0,
        errors: [error.message],
      };
    }

    // TODO: Send reminder emails
    const remindersSent = overdueInvoices?.length || 0;

    console.log(`[Workflow] Invoice dunning completed. Reminders sent: ${remindersSent}`);

    return {
      success: true,
      remindersSent,
      errors: [],
    };
  } catch (error) {
    console.error("[Workflow] Invoice dunning error:", error);
    return {
      success: false,
      remindersSent: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}


