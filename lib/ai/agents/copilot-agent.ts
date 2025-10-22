/**
 * AI Co-Pilot Agent
 * Natural language interface for accounting queries and actions
 */

import { BaseAgent } from "../agent-base";
import type {
  AgentConfig,
  AgentContext,
  AgentResult,
} from "../agent-types";
import { getOpenAIClient } from "../openai-client";

const COPILOT_SYSTEM_PROMPT = `You are OpportunityOS Co-Pilot, an AI assistant for accounting and bookkeeping tasks.

You help users with:
- Financial queries (show P&L, what were my expenses last month, etc.)
- Account reconciliation (reconcile October bank account)
- Transaction categorization (categorize uncategorized transactions)
- Report generation (generate Q3 financial statements)
- Finding anomalies (flag unusual spending)
- Explaining accounting concepts and transactions

You have access to the following actions:
- generate_report: Generate financial reports (P&L, Balance Sheet, Cash Flow)
- reconcile_account: Run reconciliation for a bank account
- categorize_transactions: Auto-categorize uncategorized transactions
- get_metrics: Get dashboard metrics and KPIs
- explain_transaction: Explain why a transaction was categorized a certain way
- search_transactions: Find transactions by criteria

Response Format:
- For queries, provide clear answers with numbers and context
- For actions, describe what you'll do and ask for confirmation if needed
- Always explain accounting terms in plain English
- Cite sources when referencing specific transactions or reports

Example:
User: "Show me my revenue for Q3"
Assistant: I'll generate a Profit & Loss report for Q3 (Jul 1 - Sep 30, 2025). [Execute generate_report action]

Based on the report:
- Total Revenue: $125,450.00
- Top revenue source: Service fees ($89,200)
- Growth vs Q2: +12.5%

Would you like me to break this down by customer or product category?`;

export interface CoPilotQuery {
  query: string;
  history?: Array<{ role: string; content: string }>;
}

export interface CoPilotAction {
  type: "generate_report" | "reconcile_account" | "categorize_transactions" | "get_metrics" | "explain_transaction" | "search_transactions";
  parameters: Record<string, any>;
}

export interface CoPilotResponse {
  message: string;
  action?: CoPilotAction;
  requiresConfirmation?: boolean;
  data?: Record<string, any>;
}

export class CoPilotAgent extends BaseAgent {
  constructor() {
    super({
      name: "ExplainBot", // Use existing agent name for compatibility
      description: "Natural language interface for accounting queries and actions",
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: COPILOT_SYSTEM_PROMPT,
    });
  }

  async execute(
    input: CoPilotQuery,
    context: AgentContext
  ): Promise<AgentResult<CoPilotResponse>> {
    try {
      const openai = getOpenAIClient();

      // Build messages
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: this.config.systemPrompt },
      ];

      // Add conversation history if provided
      if (input.history && input.history.length > 0) {
        input.history.forEach((msg) => {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content });
          }
        });
      }

      // Add current query
      messages.push({ role: "user", content: input.query });

      // Call OpenAI with function calling
      const response = await openai.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_report",
              description: "Generate a financial report (P&L, Balance Sheet, Cash Flow)",
              parameters: {
                type: "object",
                properties: {
                  reportType: {
                    type: "string",
                    enum: ["pl", "bs", "cf", "trial_balance", "ar_aging"],
                    description: "Type of report to generate",
                  },
                  startDate: {
                    type: "string",
                    description: "Start date (YYYY-MM-DD) for period reports",
                  },
                  endDate: {
                    type: "string",
                    description: "End date (YYYY-MM-DD) for period reports",
                  },
                  asOfDate: {
                    type: "string",
                    description: "As of date (YYYY-MM-DD) for point-in-time reports",
                  },
                },
                required: ["reportType"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "reconcile_account",
              description: "Run reconciliation for a bank account",
              parameters: {
                type: "object",
                properties: {
                  accountId: {
                    type: "string",
                    description: "Bank account ID to reconcile",
                  },
                  startDate: {
                    type: "string",
                    description: "Start date (YYYY-MM-DD)",
                  },
                  endDate: {
                    type: "string",
                    description: "End date (YYYY-MM-DD)",
                  },
                },
                required: ["accountId", "startDate", "endDate"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "categorize_transactions",
              description: "Auto-categorize uncategorized transactions",
              parameters: {
                type: "object",
                properties: {
                  limit: {
                    type: "number",
                    description: "Maximum number of transactions to categorize (default: 100)",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "get_metrics",
              description: "Get dashboard metrics and KPIs",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
        ],
      });

      const choice = response.choices[0];
      const message = choice?.message;

      // Check if assistant wants to call a function
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if (toolCall.type === "function") {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          return {
            success: true,
            data: {
              message: message.content || `I'll ${functionName.replace(/_/g, " ")} for you.`,
              action: {
                type: functionName as CoPilotAction["type"],
                parameters: functionArgs,
              },
              requiresConfirmation: ["reconcile_account", "categorize_transactions"].includes(functionName),
            },
            confidence: 0.95,
            reasoning: `Identified action: ${functionName}`,
          };
        }
      }

      // Regular text response
      return {
        success: true,
        data: {
          message: message?.content || "I'm not sure how to help with that. Could you rephrase?",
        },
        confidence: 0.85,
        reasoning: "Generated text response",
      };
    } catch (error) {
      console.error("[CoPilot] Execution error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

// Singleton instance
export const coPilotAgent = new CoPilotAgent();
