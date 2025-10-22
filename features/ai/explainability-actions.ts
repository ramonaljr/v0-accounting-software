/**
 * AI Explainability Actions
 *
 * Server actions for fetching AI explanations and agent run data
 */

"use server";

import { createClient } from "@/lib/supabase/server";

export interface ExplanationData {
  title: string;
  insightType: string;
  severity: "info" | "warning" | "critical";
  confidence: number;
  description: string;
  reasoning: Array<{
    step: number;
    title: string;
    description: string;
    details: string[];
  }>;
  affectedTransactions?: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
  }>;
  recommendation?: {
    action: string;
    priority: string;
    estimatedImpact: string;
  };
}

/**
 * Get AI explanation by insight ID or agent run ID
 */
export async function getAIExplanation(
  id: string
): Promise<{ success: boolean; data?: ExplanationData; error?: string }> {
  try {
    const supabase = await createClient();

    // Try to fetch as AI insight first
    const { data: insight, error: insightError } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("id", id)
      .single();

    if (insight && !insightError) {
      // Found as insight - return formatted explanation
      return {
        success: true,
        data: {
          title: insight.title,
          insightType: formatAgentType(insight.agent_type),
          severity: insight.severity,
          confidence: insight.confidence,
          description: insight.description,
          reasoning: parseReasoning(insight.reasoning),
          recommendation: {
            action: insight.action_url || "View details",
            priority: insight.severity === "critical" ? "High" : insight.severity === "warning" ? "Medium" : "Low",
            estimatedImpact: insight.severity === "critical" ? "Significant" : insight.severity === "warning" ? "Moderate" : "Minor",
          },
        },
      };
    }

    // Try to parse ID as {type}-{entity_id} format
    const [type, entityId] = id.split("-");

    if (!type || !entityId) {
      return {
        success: false,
        error: "Invalid explanation ID format",
      };
    }

    // Fetch insights related to this entity
    const { data: relatedInsights, error: relatedError } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (relatedInsights && relatedInsights.length > 0 && !relatedError) {
      const latestInsight = relatedInsights[0];

      return {
        success: true,
        data: {
          title: latestInsight.title,
          insightType: formatAgentType(latestInsight.agent_type),
          severity: latestInsight.severity,
          confidence: latestInsight.confidence,
          description: latestInsight.description,
          reasoning: parseReasoning(latestInsight.reasoning),
          recommendation: {
            action: latestInsight.action_url || "View details",
            priority: latestInsight.severity === "critical" ? "High" : latestInsight.severity === "warning" ? "Medium" : "Low",
            estimatedImpact: latestInsight.severity === "critical" ? "Significant" : latestInsight.severity === "warning" ? "Moderate" : "Minor",
          },
        },
      };
    }

    // Fall back to mock data for demo purposes
    return {
      success: true,
      data: getMockExplanation(type),
    };
  } catch (error) {
    console.error("[Get AI Explanation] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format agent type for display
 */
function formatAgentType(agentType: string): string {
  const typeMap: Record<string, string> = {
    anomaly: "Anomaly Detection",
    variance: "Variance Analysis",
    forecast: "Forecasting",
    suggestion: "Smart Suggestion",
    categorization: "Transaction Categorization",
    reconciliation: "Reconciliation Match",
  };

  return typeMap[agentType] || agentType;
}

/**
 * Parse reasoning string into structured steps
 */
function parseReasoning(reasoning: string): Array<{
  step: number;
  title: string;
  description: string;
  details: string[];
}> {
  // If reasoning is JSON, parse it
  try {
    const parsed = JSON.parse(reasoning);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    // Not JSON, treat as plain text
  }

  // Convert plain text to structured format
  // Split by sentences or newlines
  const lines = reasoning.split(/\n|\./).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [
      {
        step: 1,
        title: "AI Analysis",
        description: reasoning || "Analysis performed by AI agent",
        details: [],
      },
    ];
  }

  // Group lines into steps (every 3-4 lines = 1 step)
  const steps: Array<{
    step: number;
    title: string;
    description: string;
    details: string[];
  }> = [];

  for (let i = 0; i < lines.length; i += 3) {
    const title = lines[i] || "Analysis Step";
    const description = lines[i + 1] || "";
    const details = lines.slice(i + 2, i + 3).map((d) => d.trim());

    steps.push({
      step: steps.length + 1,
      title,
      description,
      details,
    });
  }

  return steps.length > 0 ? steps : [
    {
      step: 1,
      title: "AI Analysis",
      description: reasoning,
      details: [],
    },
  ];
}

/**
 * Get mock explanation for demo purposes
 */
function getMockExplanation(type: string): ExplanationData {
  const mockExplanations: Record<string, ExplanationData> = {
    anomaly: {
      title: "Unusual Transaction Amount Detected",
      insightType: "Anomaly Detection",
      severity: "warning",
      confidence: 0.89,
      description: "Transaction amount significantly exceeds historical average",
      reasoning: [
        {
          step: 1,
          title: "Historical Analysis",
          description: "Analyzed transaction patterns for the past 90 days",
          details: [
            "Average transaction amount: $1,250",
            "Standard deviation: $450",
            "Current transaction: $4,500",
            "Deviation: 3.6σ (statistically significant)",
          ],
        },
        {
          step: 2,
          title: "Pattern Recognition",
          description: "Compared against similar transactions",
          details: [
            "Similar merchant: 12 previous transactions",
            "Average amount: $1,100",
            "This transaction: 309% above average",
            "No seasonal pattern detected",
          ],
        },
        {
          step: 3,
          title: "Risk Assessment",
          description: "Evaluated business impact",
          details: [
            "Category: Operating Expenses",
            "Budget impact: 3.2% of monthly budget",
            "Recommendation: Verify with vendor",
          ],
        },
      ],
      recommendation: {
        action: "Verify transaction with vendor and obtain supporting documentation",
        priority: "Medium",
        estimatedImpact: "Moderate",
      },
    },
    duplicate: {
      title: "Potential Duplicate Transaction",
      insightType: "Anomaly Detection",
      severity: "warning",
      confidence: 0.85,
      description: "Two similar transactions found within 3 days",
      reasoning: [
        {
          step: 1,
          title: "Similarity Analysis",
          description: "Compared transaction attributes",
          details: [
            "Exact amount match: $299.99",
            "Merchant match: 95% similar",
            "Date proximity: 3 days apart",
            "Description similarity: 87%",
          ],
        },
        {
          step: 2,
          title: "Duplicate Detection",
          description: "Applied duplicate detection algorithm",
          details: [
            "Fuzzy matching score: 0.92",
            "Same payment method",
            "Same GL account suggested",
            "High probability of duplication",
          ],
        },
      ],
      recommendation: {
        action: "Review transactions and void duplicate if confirmed",
        priority: "Medium",
        estimatedImpact: "Moderate - $299.99 at risk",
      },
    },
    variance: {
      title: "Budget Variance Detected",
      insightType: "Variance Analysis",
      severity: "info",
      confidence: 0.92,
      description: "Actual spending differs from budget forecast",
      reasoning: [
        {
          step: 1,
          title: "Budget Comparison",
          description: "Compared actual vs budgeted amounts",
          details: [
            "Budgeted amount: $5,000",
            "Actual amount: $6,250",
            "Variance: +$1,250 (25%)",
            "Variance type: Unfavorable",
          ],
        },
        {
          step: 2,
          title: "Trend Analysis",
          description: "Analyzed spending trend over time",
          details: [
            "Q1: 5% over budget",
            "Q2: 12% over budget",
            "Q3: 25% over budget (current)",
            "Trend: Increasing overspend",
          ],
        },
      ],
      recommendation: {
        action: "Review budget allocation and adjust forecasts",
        priority: "Low",
        estimatedImpact: "Minor - informational",
      },
    },
    suggestion: {
      title: "Automation Opportunity Identified",
      insightType: "Smart Suggestion",
      severity: "info",
      confidence: 0.88,
      description: "Recurring pattern suitable for automation rule",
      reasoning: [
        {
          step: 1,
          title: "Pattern Detection",
          description: "Identified recurring transaction pattern",
          details: [
            "Frequency: Monthly",
            "Consistency: 12 consecutive months",
            "Amount variance: < 2%",
            "Same merchant and category",
          ],
        },
        {
          step: 2,
          title: "Automation Potential",
          description: "Calculated automation benefits",
          details: [
            "Manual effort saved: 12 transactions/year",
            "Time savings: ~30 minutes/year",
            "Error reduction: Eliminates manual categorization errors",
            "Confidence: High (88%)",
          ],
        },
      ],
      recommendation: {
        action: "Create automation rule for this transaction pattern",
        priority: "Low",
        estimatedImpact: "Minor - efficiency gain",
      },
    },
  };

  return mockExplanations[type] || mockExplanations.anomaly;
}
