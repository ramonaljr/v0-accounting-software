/**
 * AI Transaction Categorization API
 *
 * POST /api/ai/categorize
 * Accepts transaction data and returns AI-powered categorization
 */

import { NextRequest, NextResponse } from "next/server";
import { ledgerBot } from "@/lib/ai/agents/ledger-bot";
import { z } from "zod";

// Request schema
const CategorizationRequestSchema = z.object({
  transaction: z.object({
    id: z.string().uuid(),
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    merchantName: z.string().optional(),
    category: z.string().optional(),
  }),
  orgId: z.string().uuid(),
});

type CategorizationRequest = z.infer<typeof CategorizationRequestSchema>;

/**
 * POST /api/ai/categorize
 * Categorize a single transaction using LedgerBot
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = CategorizationRequestSchema.safeParse(body);
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

    const { transaction, orgId } = validated.data;

    // Execute LedgerBot
    const result = await ledgerBot.execute(transaction, {
      orgId,
      userId: "system", // System-initiated categorization
      tier: "pro", // Default tier for scheduled jobs
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Categorization failed",
        },
        { status: 500 }
      );
    }

    // Return categorization result
    return NextResponse.json({
      success: true,
      data: {
        accountId: result.data?.accountId,
        accountCode: result.data?.accountCode,
        accountName: result.data?.accountName,
        confidence: result.confidence,
        reasoning: result.reasoning,
        suggestedTaxCode: result.data?.suggestedTaxCode,
        tags: result.data?.tags,
      },
    });
  } catch (error) {
    console.error("[AI Categorize API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
