/**
 * AI Infrastructure - Public API
 *
 * Central export point for all AI-related functionality
 */

// OpenAI Client
export {
  createOpenAIClient,
  getOpenAIClient,
  chatCompletion,
  generateEmbedding,
  streamChatCompletion,
  type Model,
} from "./openai-client";

// Agent Types
export {
  type AgentState,
  type AgentRunStatusType,
  type AgentActionTypeEnum,
  type AgentName,
  type AgentConfig,
  type AgentTool,
  type AgentResult,
  type AgentAction,
  type AgentContext,
  type AgentMetrics,
  AGENT_NAMES,
  CONFIDENCE_THRESHOLDS,
  AgentRunStatus,
  AgentActionType,
  AgentStateSchema,
} from "./agent-types";

// Agent Base Class
export { BaseAgent } from "./agent-base";

// Agent Orchestration
export { AgentOrchestrator, getOrchestrator } from "./agent-orchestrator";

// Database Helpers
export {
  createAgentRun,
  updateAgentRun,
  createAgentAction,
  approveAgentAction,
  getPendingActions,
  getAgentRun,
  getAgentRuns,
  getAgentMetrics,
  submitAgentFeedback,
  type AgentRunRecord,
  type AgentActionRecord,
  type AgentFeedbackRecord,
} from "./agent-db";

// Agents
export { LedgerBotAgent, ledgerBot } from "./agents/ledger-bot";
export { ExplainBotAgent, explainBot } from "./agents/explain-bot";
export { ReconAIAgent, reconAI } from "./agents/recon-ai";
export { CoPilotAgent, coPilotAgent } from "./agents/copilot-agent";

// Import for re-export
import { ledgerBot } from "./agents/ledger-bot";
import { explainBot } from "./agents/explain-bot";
import { reconAI } from "./agents/recon-ai";
import { coPilotAgent } from "./agents/copilot-agent";
import { getOrchestrator } from "./agent-orchestrator";
import { CONFIDENCE_THRESHOLDS, AGENT_NAMES } from "./agent-types";

// Re-export common patterns
export const AI = {
  // Agents
  LedgerBot: ledgerBot,
  ExplainBot: explainBot,
  ReconAI: reconAI,
  CoPilot: coPilotAgent,

  // Orchestrator
  getOrchestrator,

  // Constants
  CONFIDENCE_THRESHOLDS,
  AGENT_NAMES,
} as const;
