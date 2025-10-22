/**
 * Nightly Anomaly Detection Edge Function
 * Runs every night at 2 AM to detect anomalies in transactions
 *
 * Triggered by: Supabase cron (pg_cron)
 * Schedule: 0 2 * * * (2 AM daily)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface Organization {
  id: string;
  name: string;
  settings: {
    anomaly_detection_enabled?: boolean;
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Nightly Anomaly Detection] Starting job...");

    // Get all active organizations with anomaly detection enabled
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, name, settings")
      .eq("is_active", true);

    if (orgsError) {
      console.error("[Nightly Anomaly Detection] Orgs fetch error:", orgsError);
      throw orgsError;
    }

    const results: Array<{
      orgId: string;
      orgName: string;
      anomaliesDetected: number;
      critical: number;
      warnings: number;
      info: number;
      error?: string;
    }> = [];

    // Process each organization
    for (const org of (orgs as Organization[]) || []) {
      // Check if anomaly detection is enabled for this org
      const isEnabled = org.settings?.anomaly_detection_enabled !== false; // Default to true

      if (!isEnabled) {
        console.log(
          `[Nightly Anomaly Detection] Skipping org ${org.name} (disabled)`
        );
        continue;
      }

      console.log(`[Nightly Anomaly Detection] Processing org: ${org.name}`);

      try {
        // Date range: last 30 days
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Fetch transactions in date range
        const { data: transactions, error: txError } = await supabase
          .from("bank_transactions")
          .select("*, account:accounts(*)")
          .eq("org_id", org.id)
          .gte("transaction_date", startDate.toISOString())
          .lte("transaction_date", endDate.toISOString())
          .order("transaction_date", { ascending: false })
          .limit(500);

        if (txError) {
          console.error(
            `[Nightly Anomaly Detection] ${org.name} transactions fetch error:`,
            txError
          );
          results.push({
            orgId: org.id,
            orgName: org.name,
            anomaliesDetected: 0,
            critical: 0,
            warnings: 0,
            info: 0,
            error: txError.message,
          });
          continue;
        }

        if (!transactions || transactions.length === 0) {
          console.log(
            `[Nightly Anomaly Detection] ${org.name}: No transactions to analyze`
          );
          results.push({
            orgId: org.id,
            orgName: org.name,
            anomaliesDetected: 0,
            critical: 0,
            warnings: 0,
            info: 0,
          });
          continue;
        }

        console.log(
          `[Nightly Anomaly Detection] ${org.name}: Analyzing ${transactions.length} transactions`
        );

        const anomalies: Array<{
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
        }> = [];

        // 1. Detect unusual amounts
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
            anomalies.push({
              type: "unusual_amount",
              severity: amount > threshold * 2 ? "critical" : "warning",
              confidence: Math.min(0.95, (amount / threshold - 1) * 0.5 + 0.7),
              entityType: "transaction",
              entityId: tx.id,
              title: "Unusual Transaction Amount",
              description: `Transaction of $${amount.toLocaleString()} is ${((amount / mean - 1) * 100).toFixed(0)}% above average`,
              reasoning: `Amount exceeds ${((amount / threshold - 1) * 100).toFixed(0)}% of expected threshold`,
              actionUrl: `/transactions/${tx.id}`,
              whyUrl: `/ai/explain/anomaly-${tx.id}`,
            });
          }
        });

        // 2. Detect potential duplicates
        for (let i = 0; i < Math.min(transactions.length, 100); i++) {
          for (let j = i + 1; j < Math.min(transactions.length, 100); j++) {
            const tx1 = transactions[i];
            const tx2 = transactions[j];

            const amountMatch =
              Math.abs((tx1.amount || 0) - (tx2.amount || 0)) < 0.01;
            const date1 = new Date(tx1.transaction_date);
            const date2 = new Date(tx2.transaction_date);
            const daysDiff =
              Math.abs(date1.getTime() - date2.getTime()) /
              (1000 * 60 * 60 * 24);
            const withinWeek = daysDiff <= 7;

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
                reasoning: `Same amount, similar description, within ${Math.round(daysDiff)} days`,
                actionUrl: `/transactions?compare=${tx1.id},${tx2.id}`,
                whyUrl: `/ai/explain/duplicate-${tx1.id}-${tx2.id}`,
              });
              break;
            }
          }
        }

        // Store anomalies as AI insights
        if (anomalies.length > 0) {
          const insights = anomalies.map((anomaly) => ({
            org_id: org.id,
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
            expires_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            created_at: new Date().toISOString(),
          }));

          const { error: insertError } = await supabase
            .from("ai_insights")
            .insert(insights);

          if (insertError) {
            console.error(
              `[Nightly Anomaly Detection] ${org.name} insert error:`,
              insertError
            );
          }
        }

        const critical = anomalies.filter((a) => a.severity === "critical")
          .length;
        const warnings = anomalies.filter((a) => a.severity === "warning")
          .length;
        const info = anomalies.filter((a) => a.severity === "info").length;

        results.push({
          orgId: org.id,
          orgName: org.name,
          anomaliesDetected: anomalies.length,
          critical,
          warnings,
          info,
        });

        console.log(
          `[Nightly Anomaly Detection] ${org.name}: Detected ${anomalies.length} anomalies (${critical} critical, ${warnings} warnings, ${info} info)`
        );
      } catch (orgError) {
        console.error(
          `[Nightly Anomaly Detection] ${org.name} error:`,
          orgError
        );
        results.push({
          orgId: org.id,
          orgName: org.name,
          anomaliesDetected: 0,
          critical: 0,
          warnings: 0,
          info: 0,
          error:
            orgError instanceof Error ? orgError.message : "Unknown error",
        });
      }
    }

    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        anomaliesDetected: acc.anomaliesDetected + r.anomaliesDetected,
        critical: acc.critical + r.critical,
        warnings: acc.warnings + r.warnings,
        info: acc.info + r.info,
      }),
      { anomaliesDetected: 0, critical: 0, warnings: 0, info: 0 }
    );

    console.log(
      `[Nightly Anomaly Detection] Job complete - Total: ${totals.anomaliesDetected} anomalies (${totals.critical} critical, ${totals.warnings} warnings, ${totals.info} info)`
    );

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        orgsProcessed: results.length,
        totals,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[Nightly Anomaly Detection] Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
