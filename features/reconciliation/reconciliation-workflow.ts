/**
 * Reconciliation Workflow
 *
 * Integrates ReconAI agent into bank reconciliation workflows:
 * - Automated matching: bank ↔ ledger ↔ payments
 * - One-click approve for high-confidence matches
 * - Handle partial matches and difference posting
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { reconAI } from "@/lib/ai/agents/recon-ai";
import { z } from "zod";

// Input schemas
const ReconciliationInputSchema = z.object({
  bankTransactionId: z.string().uuid(),
  accountId: z.string().uuid(),
  statementDate: z.string(),
  orgId: z.string().uuid(),
});

const BatchReconciliationInputSchema = z.object({
  accountId: z.string().uuid(),
  statementDate: z.string(),
  orgId: z.string().uuid(),
  limit: z.number().optional().default(50),
});

export type ReconciliationInput = z.infer<typeof ReconciliationInputSchema>;
export type BatchReconciliationInput = z.infer<
  typeof BatchReconciliationInputSchema
>;

// Result types
export interface ReconciliationResult {
  success: boolean;
  data?: {
    matchId: string;
    matchType: "exact" | "partial" | "suggested";
    confidence: number;
    ledgerEntries: Array<{
      id: string;
      accountCode: string;
      accountName: string;
      amount: number;
      date: string;
    }>;
    difference?: number;
    reasoning: string;
    requiresApproval: boolean;
  };
  error?: string;
}

export interface BatchReconciliationResult {
  success: boolean;
  data?: {
    matched: number;
    autoApproved: number;
    needsReview: number;
    unmatched: number;
    matches: ReconciliationResult[];
  };
  error?: string;
}

/**
 * Reconcile a single bank transaction
 */
export async function reconcileTransaction(
  input: ReconciliationInput
): Promise<ReconciliationResult> {
  try {
    const validated = ReconciliationInputSchema.parse(input);
    const supabase = await createClient();

    // Fetch bank transaction
    const { data: bankTx, error: txError } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("id", validated.bankTransactionId)
      .eq("org_id", validated.orgId)
      .single();

    if (txError || !bankTx) {
      return {
        success: false,
        error: "Bank transaction not found",
      };
    }

    // Fetch potential matching ledger entries (unreconciled only)
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from("journal_entries")
      .select("*, account:accounts(*)")
      .eq("org_id", validated.orgId)
      .eq("is_reconciled", false)
      .gte("entry_date", new Date(validated.statementDate).toISOString())
      .lte(
        "entry_date",
        new Date(
          new Date(validated.statementDate).getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      ) // +/- 7 days
      .order("entry_date", { ascending: false })
      .limit(20);

    if (ledgerError) {
      return {
        success: false,
        error: "Failed to fetch ledger entries",
      };
    }

    // Call ReconAI agent to find matches
    // ReconAI expects accountId, startDate, endDate, statementBalance
    const reconInput = {
      accountId: validated.accountId,
      startDate: validated.statementDate,
      endDate: validated.statementDate,
      statementBalance: bankTx.amount || 0,
    };

    const result = await reconAI.execute(reconInput, {
      orgId: validated.orgId,
      userId: "system",
      tier: "pro",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Reconciliation failed",
      };
    }

    const confidence = result.confidence || 0;
    const requiresApproval = confidence < 0.95; // 95% threshold for auto-approve

    // Get first match from ReconAI results (simplified for single transaction)
    const firstMatch = result.data.matches && result.data.matches.length > 0
      ? result.data.matches[0]
      : null;

    // Create reconciliation match record
    const matchData = {
      org_id: validated.orgId,
      bank_transaction_id: bankTx.id,
      account_id: validated.accountId,
      match_type: firstMatch?.matchType || "suggested",
      confidence: firstMatch?.confidence || confidence,
      matched_entries: firstMatch ? [firstMatch.journalEntryId] : [],
      difference: firstMatch?.difference || 0,
      ai_reasoning: firstMatch?.reasoning || result.reasoning || "",
      status: requiresApproval ? "pending_review" : "auto_approved",
      matched_by: requiresApproval ? null : "ai",
      matched_at: requiresApproval ? null : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data: match, error: matchError } = await supabase
      .from("reconciliation_matches")
      .insert(matchData)
      .select()
      .single();

    if (matchError) {
      return {
        success: false,
        error: "Failed to create reconciliation match",
      };
    }

    // If auto-approved, mark bank transaction and ledger entries as reconciled
    if (!requiresApproval) {
      await supabase
        .from("bank_transactions")
        .update({
          is_reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: "ai",
        })
        .eq("id", bankTx.id);

      if (firstMatch) {
        await supabase
          .from("journal_entries")
          .update({
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
          })
          .eq("id", firstMatch.journalEntryId);
      }
    }

    // Map ReconAI match types to our result types
    const matchTypeMap: Record<string, "exact" | "partial" | "suggested"> = {
      exact: "exact",
      fuzzy: "suggested",
      partial: "partial",
      many_to_one: "partial",
      one_to_many: "partial",
      suggested: "suggested",
    };

    return {
      success: true,
      data: {
        matchId: match.id,
        matchType: firstMatch?.matchType
          ? matchTypeMap[firstMatch.matchType] || "suggested"
          : "suggested",
        confidence: firstMatch?.confidence || confidence,
        ledgerEntries: firstMatch
          ? [
              {
                id: firstMatch.journalEntryId,
                accountCode: "",
                accountName: "",
                amount: bankTx.amount || 0,
                date: bankTx.transaction_date,
              },
            ]
          : [],
        difference: firstMatch?.difference || 0,
        reasoning: firstMatch?.reasoning || result.reasoning || "",
        requiresApproval,
      },
    };
  } catch (error) {
    console.error("[Reconciliation Workflow] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch reconcile all unreconciled transactions for an account
 */
export async function batchReconcileAccount(
  input: BatchReconciliationInput
): Promise<BatchReconciliationResult> {
  try {
    const validated = BatchReconciliationInputSchema.parse(input);
    const supabase = await createClient();

    // Fetch unreconciled bank transactions
    const { data: unreconciledTxs, error: txError } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("org_id", validated.orgId)
      .eq("account_id", validated.accountId)
      .eq("is_reconciled", false)
      .lte("transaction_date", validated.statementDate)
      .order("transaction_date", { ascending: false })
      .limit(validated.limit);

    if (txError || !unreconciledTxs) {
      return {
        success: false,
        error: "Failed to fetch unreconciled transactions",
      };
    }

    let matched = 0;
    let autoApproved = 0;
    let needsReview = 0;
    let unmatched = 0;
    const matches: ReconciliationResult[] = [];

    // Process each transaction with 200ms delay to avoid rate limits
    for (const tx of unreconciledTxs) {
      try {
        const result = await reconcileTransaction({
          bankTransactionId: tx.id,
          accountId: validated.accountId,
          statementDate: validated.statementDate,
          orgId: validated.orgId,
        });

        if (result.success && result.data) {
          matched++;
          matches.push(result);

          if (result.data.requiresApproval) {
            needsReview++;
          } else {
            autoApproved++;
          }
        } else {
          unmatched++;
        }

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(
          `[Batch Reconciliation] Transaction ${tx.id} error:`,
          error
        );
        unmatched++;
      }
    }

    return {
      success: true,
      data: {
        matched,
        autoApproved,
        needsReview,
        unmatched,
        matches,
      },
    };
  } catch (error) {
    console.error("[Batch Reconciliation] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Approve a reconciliation match
 */
export async function approveReconciliation(
  matchId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Fetch match
    const { data: match, error: matchError } = await supabase
      .from("reconciliation_matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return { success: false, error: "Match not found" };
    }

    // Update match status
    await supabase
      .from("reconciliation_matches")
      .update({
        status: "approved",
        matched_by: userId,
        matched_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    // Mark bank transaction as reconciled
    await supabase
      .from("bank_transactions")
      .update({
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
        reconciled_by: userId,
      })
      .eq("id", match.bank_transaction_id);

    // Mark ledger entries as reconciled
    if (match.matched_entries && match.matched_entries.length > 0) {
      const entryIds = match.matched_entries.map((e: any) => e.id);
      await supabase
        .from("journal_entries")
        .update({
          is_reconciled: true,
          reconciled_at: new Date().toISOString(),
        })
        .in("id", entryIds);
    }

    return { success: true };
  } catch (error) {
    console.error("[Approve Reconciliation] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reject a reconciliation match
 */
export async function rejectReconciliation(
  matchId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Update match status
    await supabase
      .from("reconciliation_matches")
      .update({
        status: "rejected",
        rejection_reason: reason,
        rejected_by: userId,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    return { success: true };
  } catch (error) {
    console.error("[Reject Reconciliation] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
