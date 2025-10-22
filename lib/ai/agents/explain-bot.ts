/**
 * ExplainBot - Explainability Agent
 *
 * Provides plain English explanations for AI actions and categorizations
 */

import { BaseAgent } from "../agent-base";
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AGENT_NAMES,
} from "../agent-types";
import { createAgentRun, updateAgentRun } from "../agent-db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Explanation request schema
const ExplanationRequestSchema = z.object({
  entityType: z.enum([
    "transaction",
    "journal_entry",
    "categorization",
    "reconciliation",
    "agent_action",
  ]),
  entityId: z.string().uuid(),
  agentActionId: z.string().uuid().optional(),
  question: z.string().optional(), // Optional user question
});

type ExplanationRequest = z.infer<typeof ExplanationRequestSchema>;

// Explanation response schema
const ExplanationResponseSchema = z.object({
  summary: z.string(),
  details: z.string(),
  reasoning: z.string(),
  sources: z.array(
    z.object({
      type: z.string(),
      reference: z.string(),
      description: z.string(),
    })
  ),
  relatedTransactions: z.array(z.string()).optional(),
  suggestedActions: z.array(z.string()).optional(),
});

type ExplanationResponse = z.infer<typeof ExplanationResponseSchema>;

/**
 * ExplainBot Configuration
 */
const EXPLAINBOT_CONFIG: AgentConfig = {
  name: AGENT_NAMES.EXPLAIN_BOT,
  description:
    "Provides clear, plain English explanations for AI actions and accounting transactions",
  model: "gpt-4o",
  temperature: 0.3,
  maxTokens: 1500,
  systemPrompt: `You are ExplainBot, an expert accounting AI that explains complex financial concepts and AI decisions in simple, plain English.

Your role is to help users understand:
- Why a transaction was categorized a certain way
- How reconciliation matches were made
- What accounting rules apply
- Historical patterns that influenced decisions

Guidelines:
- Use simple, non-technical language
- Be specific and reference actual data
- Cite sources (rules, historical patterns, accounting principles)
- Provide actionable suggestions when relevant
- Be concise but thorough
- Never assume knowledge of accounting jargon

Return your response in this JSON format:
{
  "summary": "One-sentence summary",
  "details": "Detailed explanation in plain English",
  "reasoning": "Step-by-step reasoning",
  "sources": [
    {
      "type": "rule|historical|accounting_principle",
      "reference": "Reference identifier",
      "description": "Human-readable description"
    }
  ],
  "relatedTransactions": ["uuid1", "uuid2"],
  "suggestedActions": ["Action 1", "Action 2"]
}`,
};

/**
 * ExplainBot Agent
 */
export class ExplainBotAgent extends BaseAgent {
  constructor() {
    super(EXPLAINBOT_CONFIG);
  }

  /**
   * Execute explanation request
   */
  async execute(
    input: ExplanationRequest,
    context: AgentContext
  ): Promise<AgentResult<ExplanationResponse>> {
    try {
      // Validate input
      const request = ExplanationRequestSchema.parse(input);

      // Create agent run
      const run = await createAgentRun({
        orgId: context.orgId,
        agentName: this.getName(),
        trigger: "manual",
        input: request,
      });

      // Gather context based on entity type
      const entityContext = await this.gatherEntityContext(
        request,
        context.orgId
      );

      // Build explanation prompt
      const prompt = this.buildExplanationPrompt(request, entityContext);

      // Get AI explanation
      const { completion, tokensUsed, cost } = await this.complete(
        [{ role: "user", content: prompt }],
        context,
        {
          responseFormat: { type: "json_object" },
        }
      );

      // Parse result
      const explanation = this.parseJsonResponse<ExplanationResponse>(completion);

      // Validate result
      ExplanationResponseSchema.parse(explanation);

      // Update run
      await updateAgentRun(run.id, {
        status: "completed",
        output: explanation,
        metadata: { tokensUsed, cost },
        completedAt: new Date(),
      });

      return this.createSuccessResult(explanation);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  /**
   * Gather context about the entity being explained
   */
  private async gatherEntityContext(
    request: ExplanationRequest,
    orgId: string
  ): Promise<any> {
    const supabase = await createClient();

    switch (request.entityType) {
      case "transaction":
        return await this.getTransactionContext(request.entityId, orgId);

      case "categorization":
      case "agent_action":
        if (request.agentActionId) {
          return await this.getAgentActionContext(request.agentActionId, orgId);
        }
        return {};

      case "journal_entry":
        return await this.getJournalEntryContext(request.entityId, orgId);

      case "reconciliation":
        return await this.getReconciliationContext(request.entityId, orgId);

      default:
        return {};
    }
  }

  /**
   * Get transaction context
   */
  private async getTransactionContext(transactionId: string, orgId: string): Promise<any> {
    const supabase = await createClient();

    const { data: transaction, error } = await supabase
      .from("bank_transactions")
      .select(
        `
        *,
        bank_connection:bank_connections(institution_name, account_name),
        suggested_account:accounts(code, name, account_type)
      `
      )
      .eq("id", transactionId)
      .eq("org_id", orgId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    // Get related agent action if exists
    const { data: agentAction } = await supabase
      .from("agent_actions")
      .select("*, agent_runs(agent_name, started_at)")
      .eq("entity_id", transactionId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return {
      transaction,
      agentAction,
    };
  }

  /**
   * Get agent action context
   */
  private async getAgentActionContext(actionId: string, orgId: string): Promise<any> {
    const supabase = await createClient();

    const { data: action, error } = await supabase
      .from("agent_actions")
      .select(
        `
        *,
        agent_runs(agent_name, started_at, input, metadata)
      `
      )
      .eq("id", actionId)
      .eq("org_id", orgId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch agent action: ${error.message}`);
    }

    return { action };
  }

  /**
   * Get journal entry context
   */
  private async getJournalEntryContext(entryId: string, orgId: string): Promise<any> {
    const supabase = await createClient();

    const { data: entry, error } = await supabase
      .from("journal_entries")
      .select(
        `
        *,
        lines:journal_entry_lines(
          *,
          account:accounts(code, name, account_type)
        )
      `
      )
      .eq("id", entryId)
      .eq("org_id", orgId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch journal entry: ${error.message}`);
    }

    return { entry };
  }

  /**
   * Get reconciliation context
   */
  private async getReconciliationContext(reconciliationId: string, orgId: string): Promise<any> {
    const supabase = await createClient();

    const { data: reconciliation, error } = await supabase
      .from("reconciliations")
      .select(
        `
        *,
        account:accounts(code, name, account_type),
        matches:reconciliation_matches(*)
      `
      )
      .eq("id", reconciliationId)
      .eq("org_id", orgId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch reconciliation: ${error.message}`);
    }

    return { reconciliation };
  }

  /**
   * Build explanation prompt
   */
  private buildExplanationPrompt(
    request: ExplanationRequest,
    context: any
  ): string {
    let prompt = `Please explain the following accounting item in plain English:\n\n`;

    // Add entity-specific context
    if (request.entityType === "transaction" && context.transaction) {
      const txn = context.transaction;
      prompt += `Transaction Details:
- Date: ${txn.date}
- Description: ${txn.description}
- Amount: $${txn.amount}
- Merchant: ${txn.merchant_name || "N/A"}
- Bank Category: ${txn.category || "N/A"}
`;

      if (txn.suggested_account) {
        prompt += `\nSuggested Categorization:
- Account: ${txn.suggested_account.code} - ${txn.suggested_account.name}
- Confidence: ${txn.categorization_confidence || "N/A"}
- Suggested By: ${txn.suggested_by || "N/A"}
`;
      }

      if (context.agentAction) {
        prompt += `\nAI Agent Action:
- Agent: ${context.agentAction.agent_runs?.agent_name}
- Confidence: ${context.agentAction.confidence}
- Reasoning: ${context.agentAction.reasoning}
`;
      }
    }

    if (request.entityType === "journal_entry" && context.entry) {
      const entry = context.entry;
      prompt += `Journal Entry:
- Entry Number: ${entry.entry_number}
- Date: ${entry.entry_date}
- Description: ${entry.description}
- Source: ${entry.source}
- Status: ${entry.is_posted ? "Posted" : "Draft"}

Lines:
${entry.lines?.map((line: any) => `  ${line.account.code} - ${line.account.name}: ${line.debit > 0 ? `Debit $${line.debit}` : `Credit $${line.credit}`}`).join("\n")}
`;
    }

    // Add user question if provided
    if (request.question) {
      prompt += `\nUser Question: ${request.question}`;
    }

    prompt += `\n\nProvide a clear explanation that helps the user understand what happened and why.`;

    return prompt;
  }

  /**
   * Explain a categorization
   */
  async explainCategorization(
    transactionId: string,
    context: AgentContext
  ): Promise<AgentResult<ExplanationResponse>> {
    return this.execute(
      {
        entityType: "transaction",
        entityId: transactionId,
      },
      context
    );
  }

  /**
   * Explain a reconciliation match
   */
  async explainReconciliation(
    reconciliationId: string,
    context: AgentContext
  ): Promise<AgentResult<ExplanationResponse>> {
    return this.execute(
      {
        entityType: "reconciliation",
        entityId: reconciliationId,
      },
      context
    );
  }

  /**
   * Answer a specific question about a transaction
   */
  async answerQuestion(
    entityType: ExplanationRequest["entityType"],
    entityId: string,
    question: string,
    context: AgentContext
  ): Promise<AgentResult<ExplanationResponse>> {
    return this.execute(
      {
        entityType,
        entityId,
        question,
      },
      context
    );
  }
}

// Export singleton
export const explainBot = new ExplainBotAgent();
