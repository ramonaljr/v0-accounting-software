/**
 * AI Agent Server Actions
 *
 * Server-side actions for invoking AI agents
 */

"use server";

import { revalidatePath } from "next/cache";
import { ledgerBot, explainBot, reconAI } from "@/lib/ai";
import { approveAgentAction, getPendingActions } from "@/lib/ai/agent-db";
import { createClient } from "@/lib/supabase/server";

/**
 * Categorize a single transaction
 */
export async function categorizeTransaction(transactionId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Get transaction
    const { data: transaction, error: txnError } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("org_id", membership.org_id)
      .single();

    if (txnError || !transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Run LedgerBot
    const result = await ledgerBot.execute(
      {
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        merchantName: transaction.merchant_name,
        category: transaction.category,
      },
      {
        orgId: membership.org_id,
        userId: user.id,
        tier: "pro", // TODO: Get from org settings
      }
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Update transaction with suggested categorization
    const { error: updateError } = await supabase
      .from("bank_transactions")
      .update({
        suggested_account_id: result.data?.accountId,
        categorization_confidence: result.confidence,
        suggested_by: "ai",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      return { success: false, error: "Failed to update transaction" };
    }

    revalidatePath("/transactions");

    return {
      success: true,
      data: result.data,
      confidence: result.confidence,
      requiresApproval: result.requiresApproval,
    };
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch categorize transactions
 */
export async function batchCategorizeTransactions(transactionIds: string[]) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Get transactions
    const { data: transactions, error: txnError } = await supabase
      .from("bank_transactions")
      .select("*")
      .in("id", transactionIds)
      .eq("org_id", membership.org_id);

    if (txnError || !transactions) {
      return { success: false, error: "Transactions not found" };
    }

    // Run batch categorization
    const result = await ledgerBot.categorizeBatch(
      {
        transactions: transactions.map((txn: any) => ({
          id: txn.id,
          date: txn.date,
          description: txn.description,
          amount: txn.amount,
          merchantName: txn.merchant_name,
          category: txn.category,
        })),
      },
      {
        orgId: membership.org_id,
        userId: user.id,
        tier: "pro",
      }
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Update transactions
    for (const categorization of result.data!.categorizations) {
      await supabase
        .from("bank_transactions")
        .update({
          suggested_account_id: categorization.result.accountId,
          categorization_confidence: categorization.result.confidence,
          suggested_by: "ai",
          updated_at: new Date().toISOString(),
        })
        .eq("id", categorization.transactionId);
    }

    revalidatePath("/transactions");

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error batch categorizing transactions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Explain a categorization
 */
export async function explainCategorization(transactionId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Run ExplainBot
    const result = await explainBot.explainCategorization(transactionId, {
      orgId: membership.org_id,
      userId: user.id,
      tier: "pro",
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error explaining categorization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run reconciliation
 */
export async function runReconciliation(params: {
  accountId: string;
  startDate: string;
  endDate: string;
  statementBalance: number;
}) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Run ReconAI
    const result = await reconAI.execute(params, {
      orgId: membership.org_id,
      userId: user.id,
      tier: "pro",
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/reconciliation");

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error running reconciliation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Approve an agent action
 */
export async function approveAction(params: {
  actionId: string;
  approved: boolean;
  notes?: string;
}) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Approve action
    await approveAgentAction(
      params.actionId,
      user.id,
      params.approved,
      params.approved ? "approve" : "reject",
      params.notes
    );

    revalidatePath("/review-queue");

    return { success: true };
  } catch (error) {
    console.error("Error approving action:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get pending actions for review
 */
export async function getPendingActionsForReview(agentName?: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Get pending actions
    const actions = await getPendingActions(membership.org_id, agentName);

    return {
      success: true,
      data: actions,
    };
  } catch (error) {
    console.error("Error getting pending actions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
