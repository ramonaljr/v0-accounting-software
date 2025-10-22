/**
 * Transaction Categorization Workflow
 * Integrates LedgerBot AI agent into transaction import/review workflow
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ledgerBot } from "@/lib/ai/agents/ledger-bot";
import type { AgentContext } from "@/lib/ai/agent-types";

export interface TransactionCategorizationInput {
  transactionId: string;
  orgId: string;
  userId: string;
}

export interface TransactionCategorizationResult {
  success: boolean;
  transactionId?: string;
  accountId?: string;
  accountName?: string;
  confidence?: number;
  autoApproved?: boolean;
  reasoning?: string;
  error?: string;
}

/**
 * Categorize a single transaction using LedgerBot
 */
export async function categorizeTransaction(
  input: TransactionCategorizationInput
): Promise<TransactionCategorizationResult> {
  try {
    const supabase = await createClient();

    // Fetch transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("id", input.transactionId)
      .eq("org_id", input.orgId)
      .single();

    if (fetchError || !transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Build agent context
    const context: AgentContext = {
      orgId: input.orgId,
      userId: input.userId,
      tier: "starter", // TODO: Get from org settings
    };

    // Build transaction input for LedgerBot
    const ledgerBotInput = {
      id: transaction.id,
      date: transaction.transaction_date,
      description: transaction.description || "",
      amount: transaction.amount,
      merchantName: transaction.merchant_name || undefined,
      category: transaction.bank_category || undefined,
    };

    // Execute LedgerBot categorization
    const result = await ledgerBot.execute(ledgerBotInput, context);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Categorization failed",
      };
    }

    const { accountId, accountName, confidence, reasoning } = result.data;

    // Determine if auto-approve based on confidence threshold
    const autoApproved = confidence >= 0.9; // 90% confidence threshold

    // Update transaction with suggested account
    const { error: updateError } = await supabase
      .from("bank_transactions")
      .update({
        suggested_account_id: accountId,
        ai_confidence: confidence,
        ai_reasoning: reasoning,
        is_categorized: autoApproved,
        categorized_at: autoApproved ? new Date().toISOString() : null,
        categorized_by: autoApproved ? "ai" : null,
        needs_review: !autoApproved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.transactionId)
      .eq("org_id", input.orgId);

    if (updateError) {
      console.error("[Categorization] Update error:", updateError);
      return {
        success: false,
        error: "Failed to update transaction",
      };
    }

    return {
      success: true,
      transactionId: input.transactionId,
      accountId,
      accountName,
      confidence,
      autoApproved,
      reasoning,
    };
  } catch (error) {
    console.error("[Categorization] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Categorize multiple transactions in batch
 */
export async function categorizeBatchTransactions(
  transactionIds: string[],
  orgId: string,
  userId: string
): Promise<{
  success: boolean;
  results?: TransactionCategorizationResult[];
  stats?: {
    total: number;
    categorized: number;
    autoApproved: number;
    needsReview: number;
    failed: number;
  };
  error?: string;
}> {
  try {
    const results: TransactionCategorizationResult[] = [];
    const stats = {
      total: transactionIds.length,
      categorized: 0,
      autoApproved: 0,
      needsReview: 0,
      failed: 0,
    };

    // Process transactions sequentially to avoid rate limits
    for (const transactionId of transactionIds) {
      const result = await categorizeTransaction({
        transactionId,
        orgId,
        userId,
      });

      results.push(result);

      if (result.success) {
        stats.categorized++;
        if (result.autoApproved) {
          stats.autoApproved++;
        } else {
          stats.needsReview++;
        }
      } else {
        stats.failed++;
      }

      // Small delay to avoid rate limits (100ms between requests)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: true,
      results,
      stats,
    };
  } catch (error) {
    console.error("[Batch Categorization] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Auto-categorize all uncategorized transactions for an org
 */
export async function autoCategorizeUncategorized(
  orgId: string,
  userId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  categorized?: number;
  autoApproved?: number;
  needsReview?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get uncategorized transactions
    const { data: transactions, error: fetchError } = await supabase
      .from("bank_transactions")
      .select("id")
      .eq("org_id", orgId)
      .eq("is_categorized", false)
      .is("suggested_account_id", null)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (fetchError) {
      return {
        success: false,
        error: "Failed to fetch transactions",
      };
    }

    if (!transactions || transactions.length === 0) {
      return {
        success: true,
        categorized: 0,
        autoApproved: 0,
        needsReview: 0,
      };
    }

    const transactionIds = transactions.map((t) => t.id);

    const batchResult = await categorizeBatchTransactions(
      transactionIds,
      orgId,
      userId
    );

    if (!batchResult.success || !batchResult.stats) {
      return {
        success: false,
        error: batchResult.error || "Batch categorization failed",
      };
    }

    return {
      success: true,
      categorized: batchResult.stats.categorized,
      autoApproved: batchResult.stats.autoApproved,
      needsReview: batchResult.stats.needsReview,
    };
  } catch (error) {
    console.error("[Auto Categorize] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Approve AI categorization suggestion
 */
export async function approveCategorization(
  transactionId: string,
  orgId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("bank_transactions")
      .update({
        is_categorized: true,
        categorized_at: new Date().toISOString(),
        categorized_by: userId,
        needs_review: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .eq("org_id", orgId);

    if (error) {
      console.error("[Approve Categorization] Error:", error);
      return {
        success: false,
        error: "Failed to approve categorization",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Approve Categorization] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Reject AI categorization and provide correct account
 */
export async function rejectCategorization(
  transactionId: string,
  correctAccountId: string,
  orgId: string,
  userId: string,
  feedback?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Update transaction with correct account
    const { error: updateError } = await supabase
      .from("bank_transactions")
      .update({
        suggested_account_id: correctAccountId,
        is_categorized: true,
        categorized_at: new Date().toISOString(),
        categorized_by: userId,
        needs_review: false,
        ai_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .eq("org_id", orgId);

    if (updateError) {
      console.error("[Reject Categorization] Update error:", updateError);
      return {
        success: false,
        error: "Failed to update transaction",
      };
    }

    // Record correction feedback for AI learning
    try {
      // Fetch the original AI suggestion
      const { data: transaction } = await supabase
        .from("bank_transactions")
        .select("suggested_account_id, ai_confidence, ai_reasoning")
        .eq("id", transactionId)
        .single();

      if (transaction && transaction.suggested_account_id) {
        // Fetch original suggested account details
        const { data: suggestedAccount } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", transaction.suggested_account_id)
          .single();

        // Fetch correct account details
        const { data: correctAccount } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", correctAccountId)
          .single();

        // Store correction feedback
        await supabase.from("agent_feedback").insert({
          org_id: orgId,
          user_id: userId,
          agent_type: "categorization",
          feedback_type: "correction",
          original_suggestion: {
            accountId: transaction.suggested_account_id,
            accountCode: suggestedAccount?.code,
            accountName: suggestedAccount?.name,
            confidence: transaction.ai_confidence,
            reasoning: transaction.ai_reasoning,
          },
          user_correction: {
            accountId: correctAccountId,
            accountCode: correctAccount?.code,
            accountName: correctAccount?.name,
          },
          correction_reason: feedback || "User provided correct categorization",
          entity_type: "transaction",
          entity_id: transactionId,
          was_helpful: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (feedbackError) {
      console.error("[Reject Categorization] Feedback storage error:", feedbackError);
      // Don't fail the whole operation if feedback storage fails
    }

    return { success: true };
  } catch (error) {
    console.error("[Reject Categorization] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
