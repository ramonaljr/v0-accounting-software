/**
 * Anomaly Detection Workflow
 *
 * Integrates InsightAI agent for anomaly detection:
 * - Detect unusual amounts, duplicates, vendor changes, category drift
 * - Surface alerts with severity levels
 * - Notify-only (no autonomous actions)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Input schemas
const AnomalyDetectionInputSchema = z.object({
  orgId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  limit: z.number().optional().default(100),
});

export type AnomalyDetectionInput = z.infer<
  typeof AnomalyDetectionInputSchema
>;

// Result types
export interface AnomalyResult {
  success: boolean;
  data?: {
    anomalies: Array<{
      type: "unusual_amount" | "duplicate" | "vendor_change" | "category_drift";
      severity: "info" | "warning" | "critical";
      confidence: number;
      entityType: string;
      entityId: string;
      title: string;
      description: string;
      reasoning: string;
      actionUrl?: string;
      whyUrl?: string;
    }>;
    total: number;
    critical: number;
    warnings: number;
    info: number;
  };
  error?: string;
}

/**
 * Detect anomalies in transactions
 */
export async function detectAnomalies(
  input: AnomalyDetectionInput
): Promise<AnomalyResult> {
  try {
    const validated = AnomalyDetectionInputSchema.parse(input);
    const supabase = await createClient();

    // Fetch transactions in date range
    const { data: transactions, error: txError } = await supabase
      .from("bank_transactions")
      .select("*, account:accounts(*)")
      .eq("org_id", validated.orgId)
      .gte("transaction_date", validated.startDate)
      .lte("transaction_date", validated.endDate)
      .order("transaction_date", { ascending: false })
      .limit(validated.limit);

    if (txError || !transactions) {
      return {
        success: false,
        error: "Failed to fetch transactions",
      };
    }

    const anomalies: Array<{
      type: "unusual_amount" | "duplicate" | "vendor_change" | "category_drift";
      severity: "info" | "warning" | "critical";
      confidence: number;
      entityType: string;
      entityId: string;
      title: string;
      description: string;
      reasoning: string;
      actionUrl?: string;
      whyUrl?: string;
    }> = [];

    // 1. Detect unusual amounts (amounts > 3 standard deviations from mean)
    const amounts = transactions.map((tx: any) => Math.abs(tx.amount || 0));
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) /
      amounts.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 3 * stdDev;

    transactions.forEach((tx: any) => {
      const amount = Math.abs(tx.amount || 0);
      if (amount > threshold && amount > 1000) {
        // Only flag significant amounts
        anomalies.push({
          type: "unusual_amount",
          severity: amount > threshold * 2 ? "critical" : "warning",
          confidence: Math.min(0.95, (amount / threshold - 1) * 0.5 + 0.7),
          entityType: "transaction",
          entityId: tx.id,
          title: "Unusual Transaction Amount",
          description: `Transaction of $${amount.toLocaleString()} is ${((amount / mean - 1) * 100).toFixed(0)}% above average ($${mean.toLocaleString()})`,
          reasoning: `Amount exceeds ${((amount / threshold - 1) * 100).toFixed(0)}% of expected threshold ($${threshold.toLocaleString()})`,
          actionUrl: `/transactions/${tx.id}`,
          whyUrl: `/ai/explain/anomaly-${tx.id}`,
        });
      }
    });

    // 2. Detect potential duplicates (same amount, similar description, within 7 days)
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const tx1 = transactions[i];
        const tx2 = transactions[j];

        const amountMatch = Math.abs((tx1.amount || 0) - (tx2.amount || 0)) < 0.01;
        const date1 = new Date(tx1.transaction_date);
        const date2 = new Date(tx2.transaction_date);
        const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
        const withinWeek = daysDiff <= 7;

        // Simple description similarity (could be improved with Levenshtein distance)
        const desc1 = (tx1.description || "").toLowerCase();
        const desc2 = (tx2.description || "").toLowerCase();
        const descSimilar =
          desc1.includes(desc2.substring(0, 10)) ||
          desc2.includes(desc1.substring(0, 10));

        if (amountMatch && withinWeek && descSimilar) {
          anomalies.push({
            type: "duplicate",
            severity: "warning",
            confidence: 0.85,
            entityType: "transaction",
            entityId: tx1.id,
            title: "Potential Duplicate Transaction",
            description: `Two transactions of $${Math.abs(tx1.amount || 0).toLocaleString()} found ${Math.round(daysDiff)} days apart`,
            reasoning: `Same amount, similar description ("${desc1.substring(0, 30)}..." vs "${desc2.substring(0, 30)}..."), within ${Math.round(daysDiff)} days`,
            actionUrl: `/transactions?compare=${tx1.id},${tx2.id}`,
            whyUrl: `/ai/explain/duplicate-${tx1.id}-${tx2.id}`,
          });
          break; // Only flag once per transaction
        }
      }
    }

    // 3. Detect vendor changes (merchant name changes for same transaction pattern)
    const merchantGroups = new Map<string, any[]>();
    transactions.forEach((tx: any) => {
      const key = `${Math.abs(tx.amount || 0)}-${tx.account?.code || ""}`;
      if (!merchantGroups.has(key)) {
        merchantGroups.set(key, []);
      }
      merchantGroups.get(key)!.push(tx);
    });

    merchantGroups.forEach((group) => {
      if (group.length >= 2) {
        const merchants = new Set(
          group.map((tx: any) => tx.merchant_name).filter(Boolean)
        );
        if (merchants.size >= 2) {
          const firstTx = group[0];
          anomalies.push({
            type: "vendor_change",
            severity: "info",
            confidence: 0.75,
            entityType: "transaction",
            entityId: firstTx.id,
            title: "Vendor Name Variation Detected",
            description: `Same transaction pattern with ${merchants.size} different vendor names`,
            reasoning: `Amount: $${Math.abs(firstTx.amount || 0).toLocaleString()}, Vendors: ${Array.from(merchants).join(", ")}`,
            actionUrl: `/transactions?filter=amount:${Math.abs(firstTx.amount || 0)}`,
            whyUrl: `/ai/explain/vendor-change-${firstTx.id}`,
          });
        }
      }
    });

    // 4. Detect category drift (transactions similar to previously categorized but different category)
    // This is a simplified version - in production, use historical patterns
    const categorizedTxs = transactions.filter((tx: any) => tx.is_categorized);
    const uncategorizedTxs = transactions.filter((tx: any) => !tx.is_categorized);

    uncategorizedTxs.forEach((tx: any) => {
      const similarCategorized = categorizedTxs.find(
        (catTx: any) =>
          catTx.merchant_name === tx.merchant_name &&
          Math.abs((catTx.amount || 0) - (tx.amount || 0)) < Math.abs(tx.amount || 0) * 0.1
      );

      if (similarCategorized && similarCategorized.suggested_account_id) {
        anomalies.push({
          type: "category_drift",
          severity: "info",
          confidence: 0.8,
          entityType: "transaction",
          entityId: tx.id,
          title: "Uncategorized Transaction with Similar Pattern",
          description: `Similar to previously categorized transaction (${similarCategorized.merchant_name})`,
          reasoning: `Merchant match, amount within 10% variance`,
          actionUrl: `/transactions/${tx.id}/categorize`,
          whyUrl: `/ai/explain/category-drift-${tx.id}`,
        });
      }
    });

    // Count by severity
    const critical = anomalies.filter((a) => a.severity === "critical").length;
    const warnings = anomalies.filter((a) => a.severity === "warning").length;
    const info = anomalies.filter((a) => a.severity === "info").length;

    return {
      success: true,
      data: {
        anomalies,
        total: anomalies.length,
        critical,
        warnings,
        info,
      },
    };
  } catch (error) {
    console.error("[Anomaly Detection] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Store detected anomalies as AI insights
 */
export async function storeAnomalies(
  orgId: string,
  anomalies: Array<{
    type: string;
    severity: string;
    confidence: number;
    entityType: string;
    entityId: string;
    title: string;
    description: string;
    reasoning: string;
    actionUrl?: string;
    whyUrl?: string;
  }>
): Promise<{ success: boolean; stored: number; error?: string }> {
  try {
    const supabase = await createClient();

    // Map anomalies to AI insights
    const insights = anomalies.map((anomaly) => ({
      org_id: orgId,
      agent_type: "anomaly",
      severity: anomaly.severity,
      confidence: anomaly.confidence,
      title: anomaly.title,
      description: anomaly.description,
      reasoning: anomaly.reasoning,
      entity_type: anomaly.entityType,
      entity_id: anomaly.entityId,
      action_url: anomaly.actionUrl,
      why_url: anomaly.whyUrl,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      created_at: new Date().toISOString(),
    }));

    const { error, data } = await supabase
      .from("ai_insights")
      .insert(insights)
      .select();

    if (error) {
      return {
        success: false,
        stored: 0,
        error: error.message,
      };
    }

    return {
      success: true,
      stored: data?.length || 0,
    };
  } catch (error) {
    console.error("[Store Anomalies] Error:", error);
    return {
      success: false,
      stored: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
