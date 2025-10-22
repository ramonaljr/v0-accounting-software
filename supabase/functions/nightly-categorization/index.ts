/**
 * Nightly AI Categorization Edge Function
 * Runs every night at 3 AM to auto-categorize uncategorized transactions
 *
 * Triggered by: Supabase cron (pg_cron)
 * Schedule: 0 3 * * * (3 AM daily)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface Organization {
  id: string;
  name: string;
  settings: {
    ai_categorization_enabled?: boolean;
    categorization_confidence_threshold?: number;
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

    console.log("[Nightly Categorization] Starting job...");

    // Get all active organizations with AI categorization enabled
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, name, settings")
      .eq("is_active", true);

    if (orgsError) {
      console.error("[Nightly Categorization] Orgs fetch error:", orgsError);
      throw orgsError;
    }

    const results: Array<{
      orgId: string;
      orgName: string;
      categorized: number;
      autoApproved: number;
      needsReview: number;
      error?: string;
    }> = [];

    // Process each organization
    for (const org of (orgs as Organization[]) || []) {
      // Check if AI categorization is enabled for this org
      const isEnabled = org.settings?.ai_categorization_enabled !== false; // Default to true

      if (!isEnabled) {
        console.log(`[Nightly Categorization] Skipping org ${org.name} (disabled)`);
        continue;
      }

      console.log(`[Nightly Categorization] Processing org: ${org.name}`);

      try {
        // Get uncategorized transactions (limit to 100 per night per org)
        const { data: transactions, error: txError } = await supabase
          .from("bank_transactions")
          .select("id, description, amount, merchant_name, transaction_date, bank_category")
          .eq("org_id", org.id)
          .eq("is_categorized", false)
          .is("suggested_account_id", null)
          .order("transaction_date", { ascending: false })
          .limit(100);

        if (txError) {
          console.error(`[Nightly Categorization] ${org.name} transactions fetch error:`, txError);
          results.push({
            orgId: org.id,
            orgName: org.name,
            categorized: 0,
            autoApproved: 0,
            needsReview: 0,
            error: txError.message,
          });
          continue;
        }

        if (!transactions || transactions.length === 0) {
          console.log(`[Nightly Categorization] ${org.name}: No uncategorized transactions`);
          results.push({
            orgId: org.id,
            orgName: org.name,
            categorized: 0,
            autoApproved: 0,
            needsReview: 0,
          });
          continue;
        }

        console.log(`[Nightly Categorization] ${org.name}: Processing ${transactions.length} transactions`);

        let categorized = 0;
        let autoApproved = 0;
        let needsReview = 0;

        // Call categorization workflow for each transaction
        const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";

        for (const tx of transactions) {
          try {
            // Call LedgerBot API for real AI categorization
            const categorizationResponse = await fetch(`${appUrl}/api/ai/categorize`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                transaction: {
                  id: tx.id,
                  date: tx.transaction_date,
                  description: tx.description || "",
                  amount: tx.amount || 0,
                  merchantName: tx.merchant_name,
                  category: tx.bank_category,
                },
                orgId: org.id,
              }),
            });

            if (!categorizationResponse.ok) {
              console.error(`[Nightly Categorization] API error for transaction ${tx.id}:`, await categorizationResponse.text());
              continue;
            }

            const categorizationResult = await categorizationResponse.json();

            if (!categorizationResult.success || !categorizationResult.data) {
              console.error(`[Nightly Categorization] Categorization failed for transaction ${tx.id}`);
              continue;
            }

            const { accountId, confidence, reasoning } = categorizationResult.data;
            const threshold = org.settings?.categorization_confidence_threshold || 0.9;
            const shouldAutoApprove = confidence >= threshold;

            // Update transaction with AI categorization
            const { error: updateError } = await supabase
              .from("bank_transactions")
              .update({
                suggested_account_id: accountId,
                ai_confidence: confidence,
                ai_reasoning: reasoning,
                is_categorized: shouldAutoApprove,
                categorized_at: shouldAutoApprove ? new Date().toISOString() : null,
                categorized_by: shouldAutoApprove ? "ai" : null,
                needs_review: !shouldAutoApprove,
                updated_at: new Date().toISOString(),
              })
              .eq("id", tx.id);

            if (!updateError) {
              categorized++;
              if (shouldAutoApprove) {
                autoApproved++;
              } else {
                needsReview++;
              }
            }

            // Small delay to avoid overwhelming the API
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (txError) {
            console.error(`[Nightly Categorization] Transaction ${tx.id} error:`, txError);
          }
        }

        results.push({
          orgId: org.id,
          orgName: org.name,
          categorized,
          autoApproved,
          needsReview,
        });

        console.log(`[Nightly Categorization] ${org.name}: Completed - ${categorized} categorized, ${autoApproved} auto-approved, ${needsReview} need review`);
      } catch (orgError) {
        console.error(`[Nightly Categorization] ${org.name} error:`, orgError);
        results.push({
          orgId: org.id,
          orgName: org.name,
          categorized: 0,
          autoApproved: 0,
          needsReview: 0,
          error: orgError instanceof Error ? orgError.message : "Unknown error",
        });
      }
    }

    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        categorized: acc.categorized + r.categorized,
        autoApproved: acc.autoApproved + r.autoApproved,
        needsReview: acc.needsReview + r.needsReview,
      }),
      { categorized: 0, autoApproved: 0, needsReview: 0 }
    );

    console.log(`[Nightly Categorization] Job complete - Total: ${totals.categorized} categorized, ${totals.autoApproved} auto-approved, ${totals.needsReview} need review`);

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
    console.error("[Nightly Categorization] Fatal error:", error);
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
