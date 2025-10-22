/**
 * AI Insights Actions
 * Server actions for fetching and managing AI-generated insights
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/org";
import type { AIInsight } from "./types";

export interface AIInsightsFilters {
  severity?: "info" | "warning" | "critical";
  agentType?: "anomaly" | "variance" | "forecast" | "suggestion";
  dismissed?: boolean;
  limit?: number;
}

export interface AIInsightsResult {
  success: boolean;
  data?: AIInsight[];
  error?: string;
}

/**
 * Get AI insights for the dashboard
 */
export async function getAIInsights(
  filters: AIInsightsFilters = {}
): Promise<AIInsightsResult> {
  try {
    // Get current organization context (supports BYPASS_AUTH for development)
    const orgContext = await getCurrentOrg();

    if (!orgContext) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const orgId = orgContext.orgId;

    // Use admin client in development to bypass RLS issues
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = process.env.BYPASS_AUTH === 'true'
      ? createAdminClient()
      : await createClient();

    // Build query
    let query = supabase
      .from("ai_insights")
      .select("*")
      .eq("org_id", orgId)
      .eq("dismissed", filters.dismissed ?? false)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }

    if (filters.agentType) {
      query = query.eq("agent_type", filters.agentType);
    }

    // Apply limit
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[AI Insights] Fetch error:", error);

      // Gracefully handle missing table (migrations not applied yet)
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        console.warn("[AI Insights] Table does not exist yet. Please apply migrations.");
        return {
          success: true,
          data: [], // Return empty array instead of error
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    // Transform database records to AIInsight type
    const insights: AIInsight[] =
      data?.map((row: any) => ({
        id: row.id,
        agentType: row.agent_type,
        severity: row.severity,
        title: row.title,
        description: row.description,
        confidence: parseFloat(row.confidence),
        actionUrl: row.action_url,
        whyLink: row.why_link,
        createdAt: row.created_at,
      })) || [];

    return {
      success: true,
      data: insights,
    };
  } catch (error) {
    console.error("[AI Insights] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Dismiss an AI insight
 */
export async function dismissInsight(
  insightId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current organization context (supports BYPASS_AUTH for development)
    const orgContext = await getCurrentOrg();

    if (!orgContext) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Use admin client in development to bypass RLS issues
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = process.env.BYPASS_AUTH === 'true'
      ? createAdminClient()
      : await createClient();

    const { error } = await supabase
      .from("ai_insights")
      .update({
        dismissed: true,
        dismissed_at: new Date().toISOString(),
        dismissed_by: orgContext.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", insightId);

    if (error) {
      console.error("[AI Insights] Dismiss error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[AI Insights] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Mark insight as viewed
 */
export async function markInsightViewed(
  insightId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use admin client in development to bypass RLS issues
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = process.env.BYPASS_AUTH === 'true'
      ? createAdminClient()
      : await createClient();

    const { error } = await supabase
      .from("ai_insights")
      .update({
        viewed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", insightId);

    if (error) {
      console.error("[AI Insights] Mark viewed error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[AI Insights] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Generate AI insights (manual trigger)
 * This would be called on-demand or via a scheduled job
 */
export async function generateInsights(): Promise<{
  success: boolean;
  generated?: number;
  error?: string;
}> {
  try {
    // Get current organization context (supports BYPASS_AUTH for development)
    const orgContext = await getCurrentOrg();

    if (!orgContext) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const orgId = orgContext.orgId;

    // Use admin client in development to bypass RLS issues
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = process.env.BYPASS_AUTH === 'true'
      ? createAdminClient()
      : await createClient();

    // TODO: In Phase 12, integrate with actual AI agents
    // For now, generate sample insights for demonstration

    const sampleInsights = [
      {
        org_id: orgId,
        agent_type: "anomaly",
        severity: "warning",
        title: "Unusual expense pattern detected",
        description: "Software expenses up 45% vs last month. Review subscriptions.",
        confidence: 0.89,
        action_url: "/expenses?category=software",
        why_link: `/ai/explain/anomaly-${Date.now()}`,
        data: {
          category: "Software",
          currentAmount: 4350,
          previousAmount: 3000,
          variance: 45,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      },
      {
        org_id: orgId,
        agent_type: "variance",
        severity: "info",
        title: "Revenue ahead of forecast",
        description: "12% above projected revenue for this period. Great progress!",
        confidence: 0.95,
        action_url: "/reports/profit-loss",
        why_link: `/ai/explain/variance-${Date.now()}`,
        data: {
          forecast: 50000,
          actual: 56000,
          variance: 12,
        },
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      },
      {
        org_id: orgId,
        agent_type: "suggestion",
        severity: "info",
        title: "Collections opportunity",
        description: "3 invoices may be eligible for early payment discount",
        confidence: 0.82,
        action_url: "/collections",
        why_link: `/ai/explain/suggestion-${Date.now()}`,
        data: {
          invoiceCount: 3,
          totalAmount: 8500,
          potentialSavings: 255,
        },
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      },
    ];

    const { error, data } = await supabase
      .from("ai_insights")
      .insert(sampleInsights)
      .select();

    if (error) {
      console.error("[AI Insights] Generation error:", error);

      // Gracefully handle missing table (migrations not applied yet)
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        return {
          success: false,
          error: "Database migrations not applied yet. Please run migrations first.",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      generated: data?.length || 0,
    };
  } catch (error) {
    console.error("[AI Insights] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
