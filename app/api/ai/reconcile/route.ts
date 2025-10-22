/**
 * AI Reconciliation API
 *
 * POST /api/ai/reconcile
 * Accepts bank transaction and returns AI-powered reconciliation matches
 */

import { NextRequest, NextResponse } from "next/server";
import { reconAI } from "@/lib/ai/agents/recon-ai";
import { z } from "zod";

// Request schema
const ReconciliationRequestSchema = z.object({
  bankTransaction: z.object({
    id: z.string().uuid(),
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    merchantName: z.string().optional(),
  }),
  ledgerEntries: z.array(
    z.object({
      id: z.string().uuid(),
      date: z.string(),
      description: z.string(),
      amount: z.number(),
      accountCode: z.string(),
      accountName: z.string(),
    })
  ),
  accountId: z.string().uuid(),
  orgId: z.string().uuid(),
});

type ReconciliationRequest = z.infer<typeof ReconciliationRequestSchema>;

/**
 * POST /api/ai/reconcile
 * Find matching ledger entries for a bank transaction using ReconAI
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = ReconciliationRequestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validated.error.issues,
        },
        { status: 400 }
      );
    }

    const { bankTransaction, ledgerEntries, accountId, orgId } =
      validated.data;

    // Execute ReconAI with full reconciliation parameters
    // Note: For single transaction matching, we use a simplified approach
    // The full ReconAI agent expects accountId, startDate, endDate, statementBalance
    const result = await reconAI.execute(
      {
        accountId,
        startDate: bankTransaction.date,
        endDate: bankTransaction.date,
        statementBalance: bankTransaction.amount,
      },
      {
        orgId,
        userId: "system", // System-initiated reconciliation
        tier: "pro", // Default tier for scheduled jobs
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Reconciliation failed",
        },
        { status: 500 }
      );
    }

    // Return reconciliation result
    // ReconAI returns matches and stats, not a single match
    return NextResponse.json({
      success: true,
      data: {
        matches: result.data?.matches || [],
        stats: result.data?.stats || {
          totalBankTransactions: 0,
          totalJournalEntries: 0,
          matched: 0,
          exactMatches: 0,
          fuzzyMatches: 0,
          unmatchedBank: 0,
          unmatchedLedger: 0,
          difference: 0,
        },
        confidence: result.confidence,
        reasoning: result.reasoning,
      },
    });
  } catch (error) {
    console.error("[AI Reconcile API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
