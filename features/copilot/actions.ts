/**
 * AI Co-Pilot Server Actions
 * Natural language interface for accounting operations
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { coPilotAgent } from "@/lib/ai/agents/copilot-agent";
import { nightlyAutoCategorization } from "@/lib/workflows";
import {
  generateProfitLossReport,
  generateBalanceSheetReport,
  generateTrialBalanceReport,
  generateARAgingReport,
  getDashboardMetrics,
} from "@/features/reports/actions";
import { reconAI } from "@/lib/ai";
import { z } from "zod";

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const CoPilotQuerySchema = z.object({
  query: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).optional(),
});

// =====================================================
// PROCESS CO-PILOT QUERY
// =====================================================

export async function processCoPilotQuery(input: z.infer<typeof CoPilotQuerySchema>) {
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
    const validation = CoPilotQuerySchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // Execute Co-Pilot agent
    const result = await coPilotAgent.execute(
      {
        query: data.query,
        history: data.history,
      },
      {
        orgId: membership.org_id,
        userId: user.id,
        tier: "starter" as const,
      }
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to process query",
      };
    }

    // If action is requested, execute it
    if (result.data.action) {
      const actionResult = await executeCoPilotAction(
        result.data.action.type,
        result.data.action.parameters,
        membership.org_id,
        user.id
      );

      return {
        success: true,
        message: result.data.message,
        action: result.data.action,
        actionResult,
        requiresConfirmation: result.data.requiresConfirmation,
      };
    }

    return {
      success: true,
      message: result.data.message,
    };
  } catch (error) {
    console.error("[CoPilot] Query error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// EXECUTE CO-PILOT ACTION
// =====================================================

async function executeCoPilotAction(
  actionType: string,
  parameters: Record<string, any>,
  orgId: string,
  userId: string
) {
  try {
    switch (actionType) {
      case "generate_report": {
        const { reportType, startDate, endDate, asOfDate } = parameters;

        switch (reportType) {
          case "pl":
            return await generateProfitLossReport({ startDate, endDate });
          case "bs":
            return await generateBalanceSheetReport({ asOfDate });
          case "trial_balance":
            return await generateTrialBalanceReport({ asOfDate });
          case "ar_aging":
            return await generateARAgingReport();
          default:
            return { success: false, error: "Unknown report type" };
        }
      }

      case "reconcile_account": {
        const { accountId, startDate, endDate } = parameters;

        const result = await reconAI.execute(
          {
            accountId,
            startDate,
            endDate,
            statementBalance: 0, // TODO: Get from bank API
          },
          {
            orgId,
            userId,
            tier: "starter" as const,
          }
        );

        return result;
      }

      case "categorize_transactions": {
        const limit = parameters.limit || 100;

        const result = await nightlyAutoCategorization(orgId, userId);

        return {
          success: result.success,
          data: {
            categorized: result.categorized,
            autoPosted: result.autoPosted,
            needsReview: result.needsReview,
          },
          errors: result.errors,
        };
      }

      case "get_metrics": {
        return await getDashboardMetrics();
      }

      default:
        return {
          success: false,
          error: `Unknown action type: ${actionType}`,
        };
    }
  } catch (error) {
    console.error(`[CoPilot] Action execution error (${actionType}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GET CONVERSATION HISTORY
// =====================================================

export async function getCoPilotHistory(limit: number = 20) {
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

    // TODO: Implement conversation history storage
    // For now, return empty history

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("[CoPilot] History error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
