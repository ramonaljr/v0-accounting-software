/**
 * Agent Orchestrator
 *
 * Manages agent execution, state transitions, and human-in-the-loop workflows
 */

import { BaseAgent } from "./agent-base";
import {
  AgentContext,
  AgentResult,
  AgentState,
  AgentRunStatusType,
} from "./agent-types";

interface AgentRun {
  id: string;
  agentName: string;
  status: AgentRunStatusType;
  state: AgentState;
  result?: AgentResult;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Agent Orchestrator
 * Coordinates multi-agent workflows with state management
 */
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private runs: Map<string, AgentRun> = new Map();

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getName(), agent);
  }

  /**
   * Execute an agent
   */
  async executeAgent(
    agentName: string,
    input: any,
    context: AgentContext
  ): Promise<AgentRun> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // Create run
    const runId = this.generateRunId();
    const run: AgentRun = {
      id: runId,
      agentName,
      status: "running",
      state: {
        messages: [],
        currentAgent: agentName,
        requiresHumanApproval: false,
      },
      startedAt: new Date(),
    };

    this.runs.set(runId, run);

    try {
      // Execute agent
      const result = await agent.execute(input, {
        ...context,
        runId,
      });

      // Update run
      run.result = result;
      run.status = result.success ? "completed" : "failed";
      run.completedAt = new Date();

      // Check if requires approval
      if (result.requiresApproval) {
        run.status = "awaiting_approval";
        run.state.requiresHumanApproval = true;
      }

      return run;
    } catch (error) {
      // Handle error
      run.status = "failed";
      run.error = error instanceof Error ? error.message : "Unknown error";
      run.completedAt = new Date();

      throw error;
    }
  }

  /**
   * Get a run by ID
   */
  getRun(runId: string): AgentRun | undefined {
    return this.runs.get(runId);
  }

  /**
   * Approve an agent action
   */
  async approveAction(
    runId: string,
    userId: string,
    approved: boolean,
    feedback?: string
  ): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    if (run.status !== "awaiting_approval") {
      throw new Error(`Run is not awaiting approval: ${runId}`);
    }

    if (approved) {
      run.status = "completed";
      run.state.humanFeedback = feedback;
    } else {
      run.status = "cancelled";
      run.state.humanFeedback = feedback || "Action rejected by user";
    }

    run.completedAt = new Date();
  }

  /**
   * Execute a multi-agent workflow
   */
  async executeWorkflow(
    workflow: Array<{
      agentName: string;
      input: (previousResult?: any) => any;
    }>,
    context: AgentContext
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    let previousResult: any = undefined;

    for (const step of workflow) {
      const input = step.input(previousResult);
      const run = await this.executeAgent(step.agentName, input, context);

      if (!run.result) {
        throw new Error(`Agent ${step.agentName} did not return a result`);
      }

      results.push(run.result);

      // If this step requires approval, stop the workflow
      if (run.status === "awaiting_approval") {
        break;
      }

      // If this step failed, stop the workflow
      if (!run.result.success) {
        break;
      }

      previousResult = run.result.data;
    }

    return results;
  }

  /**
   * Get all runs for an organization
   */
  getOrgRuns(orgId: string): AgentRun[] {
    // In production, this would query the database
    // For now, filter in-memory runs
    return Array.from(this.runs.values());
  }

  /**
   * Clear completed runs (cleanup)
   */
  clearCompletedRuns(olderThan: Date): void {
    for (const [runId, run] of this.runs.entries()) {
      if (
        run.status === "completed" &&
        run.completedAt &&
        run.completedAt < olderThan
      ) {
        this.runs.delete(runId);
      }
    }
  }

  /**
   * Generate a unique run ID
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
let orchestrator: AgentOrchestrator | null = null;

/**
 * Get or create the agent orchestrator
 */
export function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
  }
  return orchestrator;
}
