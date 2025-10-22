/**
 * Agent Types and Interfaces
 *
 * Defines the core types for the agent orchestration system
 */

import { z } from "zod";

// Agent state schema
export const AgentStateSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "function"]),
      content: z.string(),
      name: z.string().optional(),
      functionCall: z
        .object({
          name: z.string(),
          arguments: z.string(),
        })
        .optional(),
    })
  ),
  context: z.record(z.string(), z.any()).optional(),
  currentAgent: z.string().optional(),
  nextAgent: z.string().optional(),
  requiresHumanApproval: z.boolean().default(false),
  humanFeedback: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional(),
  actions: z.array(z.any()).optional(),
  errors: z.array(z.string()).optional(),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// Agent run status
export const AgentRunStatus = z.enum([
  "running",
  "completed",
  "failed",
  "cancelled",
  "awaiting_approval",
]);

export type AgentRunStatusType = z.infer<typeof AgentRunStatus>;

// Agent action type
export const AgentActionType = z.enum([
  "categorize",
  "reconcile",
  "post_entry",
  "match_transaction",
  "suggest_rule",
  "explain",
  "detect_anomaly",
  "generate_report",
]);

export type AgentActionTypeEnum = z.infer<typeof AgentActionType>;

// Confidence level thresholds
export const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 0.9, // ≥ 0.90 - auto-post
  REVIEW_QUEUE: 0.7, // 0.70-0.89 - review queue
  MANUAL_REVIEW: 0.0, // < 0.70 - manual review
} as const;

// Agent names
export const AGENT_NAMES = {
  LEDGER_BOT: "LedgerBot",
  RECON_AI: "ReconAI",
  EXPLAIN_BOT: "ExplainBot",
  INSIGHT_AI: "InsightAI",
  REPORT_GEN: "ReportGen",
  TAX_AI: "TaxAI",
} as const;

export type AgentName = (typeof AGENT_NAMES)[keyof typeof AGENT_NAMES];

// Agent configuration
export interface AgentConfig {
  name: AgentName;
  description: string;
  model: "gpt-4o" | "gpt-4-turbo" | "gpt-3.5-turbo";
  temperature: number;
  maxTokens?: number;
  systemPrompt: string;
  tools?: AgentTool[];
}

// Agent tool definition
export interface AgentTool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: any, context: any) => Promise<any>;
}

// Agent result
export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  reasoning?: string;
  requiresApproval?: boolean;
  suggestedActions?: AgentAction[];
}

// Agent action
export interface AgentAction {
  type: AgentActionTypeEnum;
  entityType: string;
  entityId?: string;
  data: Record<string, any>;
  confidence: number;
  reasoning: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

// Agent execution context
export interface AgentContext {
  orgId: string;
  userId?: string;
  tier: "starter" | "pro" | "enterprise";
  runId?: string;
  metadata?: Record<string, any>;
}

// Agent metrics
export interface AgentMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageConfidence: number;
  approvalRate: number;
  autoPostRate: number;
  tokensUsed: number;
  costIncurred: number;
}
