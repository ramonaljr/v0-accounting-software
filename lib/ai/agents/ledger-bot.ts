/**
 * LedgerBot - Transaction Categorization Agent
 *
 * Automatically categorizes bank transactions with high confidence scoring
 */

import { BaseAgent } from "../agent-base";
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AGENT_NAMES,
  CONFIDENCE_THRESHOLDS,
} from "../agent-types";
import { createAgentRun, createAgentAction, updateAgentRun } from "../agent-db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Transaction input schema
const TransactionInputSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  merchantName: z.string().optional(),
  category: z.string().optional(), // Bank-provided category
});

type TransactionInput = z.infer<typeof TransactionInputSchema>;

// Categorization result schema
const CategorizationResultSchema = z.object({
  accountId: z.string().uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  suggestedTaxCode: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type CategorizationResult = z.infer<typeof CategorizationResultSchema>;

// Batch input
interface BatchCategorizationInput {
  transactions: TransactionInput[];
}

// Batch output
interface BatchCategorizationOutput {
  categorizations: Array<{
    transactionId: string;
    result: CategorizationResult;
    autoApproved: boolean;
  }>;
  stats: {
    total: number;
    autoApproved: number;
    needsReview: number;
    lowConfidence: number;
  };
}

/**
 * LedgerBot Configuration
 */
const LEDGERBOT_CONFIG: AgentConfig = {
  name: AGENT_NAMES.LEDGER_BOT,
  description:
    "Automatically categorizes bank transactions based on merchant, description, and historical patterns",
  model: "gpt-4o",
  temperature: 0.2, // Low temperature for consistent categorization
  maxTokens: 2000,
  systemPrompt: `You are LedgerBot, an expert accounting AI that categorizes financial transactions.

Your task is to analyze transaction data and suggest the most appropriate GL account for categorization.

You have access to:
1. Chart of accounts for the organization
2. Historical categorization patterns
3. Categorization rules set by the user
4. Industry best practices

Guidelines:
- Always provide a confidence score (0.0 to 1.0)
- Use historical patterns when available
- Consider merchant name, description, and amount
- Explain your reasoning clearly
- When uncertain, use lower confidence scores
- For recurring transactions, maintain consistency

Return your response in this JSON format:
{
  "accountId": "uuid",
  "accountCode": "1000",
  "accountName": "Cash",
  "confidence": 0.95,
  "reasoning": "Clear explanation",
  "suggestedTaxCode": "TAX1",
  "tags": ["tag1", "tag2"]
}`,
};

/**
 * LedgerBot Agent
 */
export class LedgerBotAgent extends BaseAgent {
  constructor() {
    super(LEDGERBOT_CONFIG);
  }

  /**
   * Execute categorization for a single transaction
   */
  async execute(
    input: TransactionInput,
    context: AgentContext
  ): Promise<AgentResult<CategorizationResult>> {
    try {
      // Validate input
      const transaction = TransactionInputSchema.parse(input);

      // Create agent run
      const run = await createAgentRun({
        orgId: context.orgId,
        agentName: this.getName(),
        trigger: "manual",
        input: transaction,
      });

      // Get chart of accounts
      const accounts = await this.getChartOfAccounts(context.orgId);

      // Check for existing rule match
      const ruleMatch = await this.checkRules(transaction, context.orgId);
      if (ruleMatch) {
        // Rule match - high confidence
        const result = {
          ...ruleMatch,
          confidence: 0.95,
          reasoning: `Matched categorization rule: ${ruleMatch.reasoning}`,
        };

        await this.recordAction(run.id, context.orgId, transaction.id, result);
        await updateAgentRun(run.id, {
          status: "completed",
          output: result,
          completedAt: new Date(),
        });

        return this.createSuccessResult(result, result.confidence, result.reasoning);
      }

      // Check historical patterns
      const historicalMatch = await this.checkHistoricalPatterns(
        transaction,
        context.orgId
      );

      // Build prompt
      const prompt = this.buildCategorizationPrompt(
        transaction,
        accounts,
        historicalMatch
      );

      // Get AI suggestion
      const { completion, tokensUsed, cost } = await this.complete(
        [{ role: "user", content: prompt }],
        context,
        {
          responseFormat: { type: "json_object" },
        }
      );

      // Parse result
      const result = this.parseJsonResponse<CategorizationResult>(completion);

      // Validate result
      CategorizationResultSchema.parse(result);

      // Record action
      await this.recordAction(run.id, context.orgId, transaction.id, result);

      // Update run
      await updateAgentRun(run.id, {
        status: "completed",
        output: result,
        metadata: { tokensUsed, cost, confidence: result.confidence },
        completedAt: new Date(),
      });

      return this.createSuccessResult(result, result.confidence, result.reasoning);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  /**
   * Categorize multiple transactions in batch
   */
  async categorizeBatch(
    input: BatchCategorizationInput,
    context: AgentContext
  ): Promise<AgentResult<BatchCategorizationOutput>> {
    const categorizations: BatchCategorizationOutput["categorizations"] = [];
    const stats = {
      total: input.transactions.length,
      autoApproved: 0,
      needsReview: 0,
      lowConfidence: 0,
    };

    for (const transaction of input.transactions) {
      const result = await this.execute(transaction, context);

      if (result.success && result.data) {
        const autoApproved = this.shouldAutoApprove(result.confidence || 0);

        categorizations.push({
          transactionId: transaction.id,
          result: result.data,
          autoApproved,
        });

        if (autoApproved) {
          stats.autoApproved++;
        } else if (this.shouldReview(result.confidence || 0)) {
          stats.needsReview++;
        } else {
          stats.lowConfidence++;
        }
      }
    }

    return this.createSuccessResult({
      categorizations,
      stats,
    });
  }

  /**
   * Get chart of accounts for the organization
   */
  private async getChartOfAccounts(orgId: string): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      accountType: string;
    }>
  > {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("accounts")
      .select("id, code, name, account_type")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("code");

    if (error) {
      throw new Error(`Failed to fetch chart of accounts: ${error.message}`);
    }

    return (
      data?.map((acc: any) => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        accountType: acc.account_type,
      })) || []
    );
  }

  /**
   * Check for categorization rule match
   */
  private async checkRules(
    transaction: TransactionInput,
    orgId: string
  ): Promise<CategorizationResult | null> {
    const supabase = await createClient();

    // Get active rules
    const { data: rules, error } = await supabase
      .from("categorization_rules")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("priority");

    if (error || !rules || rules.length === 0) {
      return null;
    }

    // Check each rule
    for (const rule of rules) {
      let matches = true;

      // Check merchant pattern
      if (rule.rule_type === "merchant" && transaction.merchantName) {
        const pattern = new RegExp(rule.pattern, "i");
        matches = pattern.test(transaction.merchantName);
      }

      // Check description pattern
      if (rule.rule_type === "description") {
        const pattern = new RegExp(rule.pattern, "i");
        matches = pattern.test(transaction.description);
      }

      // Check amount range
      if (rule.rule_type === "amount_range" && rule.pattern) {
        const [min, max] = rule.pattern.split("-").map(Number);
        matches = transaction.amount >= min && transaction.amount <= max;
      }

      if (matches) {
        // Get account details
        const { data: account } = await supabase
          .from("accounts")
          .select("id, code, name")
          .eq("id", rule.account_id)
          .single();

        if (account) {
          return {
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            confidence: 0.95,
            reasoning: `Matched rule: ${rule.pattern}`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Check historical categorization patterns
   */
  private async checkHistoricalPatterns(
    transaction: TransactionInput,
    orgId: string
  ): Promise<{
    accountId: string;
    accountCode: string;
    accountName: string;
    frequency: number;
  } | null> {
    const supabase = await createClient();

    // Find similar transactions with categorizations
    const { data, error } = await supabase
      .from("bank_transactions")
      .select(
        `
        suggested_account_id,
        accounts!inner(id, code, name)
      `
      )
      .eq("org_id", orgId)
      .eq("is_reconciled", true)
      .or(
        `merchant_name.ilike.%${transaction.merchantName}%,description.ilike.%${transaction.description.substring(0, 20)}%`
      )
      .limit(10);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Count most frequent account
    const accountCounts = new Map<string, number>();
    for (const row of data as any[]) {
      const count = accountCounts.get(row.suggested_account_id) || 0;
      accountCounts.set(row.suggested_account_id, count + 1);
    }

    // Find most common
    let mostCommon: string | null = null;
    let maxCount = 0;
    for (const [accountId, count] of accountCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = accountId;
      }
    }

    if (mostCommon && maxCount >= 2) {
      const account = (data as any[]).find((d: any) => d.suggested_account_id === mostCommon);
      if (account && account.accounts) {
        return {
          accountId: account.accounts.id,
          accountCode: account.accounts.code,
          accountName: account.accounts.name,
          frequency: maxCount,
        };
      }
    }

    return null;
  }

  /**
   * Build categorization prompt
   */
  private buildCategorizationPrompt(
    transaction: TransactionInput,
    accounts: Array<{ id: string; code: string; name: string; accountType: string }>,
    historicalMatch: {
      accountId: string;
      accountCode: string;
      accountName: string;
      frequency: number;
    } | null
  ): string {
    let prompt = `Categorize this financial transaction:

Transaction Details:
- Date: ${transaction.date}
- Description: ${transaction.description}
- Amount: $${transaction.amount.toFixed(2)}
${transaction.merchantName ? `- Merchant: ${transaction.merchantName}` : ""}
${transaction.category ? `- Bank Category: ${transaction.category}` : ""}

Available GL Accounts:
${accounts.map((acc) => `- ${acc.code}: ${acc.name} (${acc.accountType})`).join("\n")}
`;

    if (historicalMatch) {
      prompt += `
Historical Pattern:
Previously, similar transactions were categorized to:
- ${historicalMatch.accountCode}: ${historicalMatch.accountName}
- Frequency: ${historicalMatch.frequency} times
`;
    }

    prompt += `
Please categorize this transaction and provide your confidence level (0.0 to 1.0).`;

    return prompt;
  }

  /**
   * Record agent action
   */
  private async recordAction(
    runId: string,
    orgId: string,
    transactionId: string,
    result: CategorizationResult
  ): Promise<void> {
    await createAgentAction({
      runId,
      orgId,
      actionType: "categorize",
      entityType: "transaction",
      entityId: transactionId,
      confidence: result.confidence,
      reasoning: result.reasoning,
      data: {
        accountId: result.accountId,
        accountCode: result.accountCode,
        accountName: result.accountName,
        suggestedTaxCode: result.suggestedTaxCode,
        tags: result.tags,
      },
    });
  }
}

// Export singleton
export const ledgerBot = new LedgerBotAgent();
