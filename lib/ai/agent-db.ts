/**
 * Agent Database Helpers
 *
 * Database operations for agent runs, actions, and feedback
 */

import { createClient } from "@/lib/supabase/server";
import { AgentActionTypeEnum, AgentRunStatusType } from "./agent-types";

export interface AgentRunRecord {
  id: string;
  org_id: string;
  agent_name: string;
  trigger: string;
  started_at: string;
  completed_at?: string;
  status: AgentRunStatusType;
  input?: any;
  output?: any;
  error?: string;
  metadata?: any;
}

export interface AgentActionRecord {
  id: string;
  agent_run_id: string;
  org_id: string;
  action_type: AgentActionTypeEnum;
  entity_type: string;
  entity_id?: string;
  confidence: number;
  reasoning?: string;
  data?: any;
  approved?: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface AgentFeedbackRecord {
  id: string;
  agent_run_id: string;
  org_id: string;
  user_id: string;
  action_id?: string;
  feedback_type: "approve" | "reject" | "correct";
  correction_data?: any;
  notes?: string;
}

/**
 * Create a new agent run
 */
export async function createAgentRun(data: {
  orgId: string;
  agentName: string;
  trigger: string;
  input?: any;
  metadata?: any;
}): Promise<AgentRunRecord> {
  const supabase = await createClient();

  const { data: run, error } = await supabase
    .from("agent_runs")
    .insert({
      org_id: data.orgId,
      agent_name: data.agentName,
      trigger: data.trigger,
      input: data.input,
      metadata: data.metadata,
      status: "running",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create agent run: ${error.message}`);
  }

  return run;
}

/**
 * Update an agent run
 */
export async function updateAgentRun(
  runId: string,
  updates: {
    status?: AgentRunStatusType;
    output?: any;
    error?: string;
    metadata?: any;
    completedAt?: Date;
  }
): Promise<void> {
  const supabase = await createClient();

  const updateData: any = {
    ...(updates.status && { status: updates.status }),
    ...(updates.output && { output: updates.output }),
    ...(updates.error && { error: updates.error }),
    ...(updates.metadata && { metadata: updates.metadata }),
    ...(updates.completedAt && { completed_at: updates.completedAt.toISOString() }),
  };

  const { error } = await supabase
    .from("agent_runs")
    .update(updateData)
    .eq("id", runId);

  if (error) {
    throw new Error(`Failed to update agent run: ${error.message}`);
  }
}

/**
 * Create an agent action
 */
export async function createAgentAction(data: {
  runId: string;
  orgId: string;
  actionType: AgentActionTypeEnum;
  entityType: string;
  entityId?: string;
  confidence: number;
  reasoning?: string;
  data?: any;
}): Promise<AgentActionRecord> {
  const supabase = await createClient();

  const { data: action, error } = await supabase
    .from("agent_actions")
    .insert({
      agent_run_id: data.runId,
      org_id: data.orgId,
      action_type: data.actionType,
      entity_type: data.entityType,
      entity_id: data.entityId,
      confidence: data.confidence,
      reasoning: data.reasoning,
      data: data.data,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create agent action: ${error.message}`);
  }

  return action;
}

/**
 * Approve or reject an agent action
 */
export async function approveAgentAction(
  actionId: string,
  userId: string,
  approved: boolean,
  feedbackType: "approve" | "reject" | "correct" = "approve",
  notes?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("approve_agent_action", {
    p_action_id: actionId,
    p_user_id: userId,
    p_approved: approved,
    p_feedback_type: feedbackType,
    p_notes: notes,
  });

  if (error) {
    throw new Error(`Failed to approve agent action: ${error.message}`);
  }
}

/**
 * Get pending actions for review
 */
export async function getPendingActions(
  orgId: string,
  agentName?: string
): Promise<AgentActionRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from("agent_actions")
    .select(
      `
      *,
      agent_runs!inner(agent_name, started_at)
    `
    )
    .eq("org_id", orgId)
    .is("approved", null)
    .order("created_at", { ascending: false });

  if (agentName) {
    query = query.eq("agent_runs.agent_name", agentName);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get pending actions: ${error.message}`);
  }

  return data || [];
}

/**
 * Get agent run by ID
 */
export async function getAgentRun(runId: string): Promise<AgentRunRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw new Error(`Failed to get agent run: ${error.message}`);
  }

  return data;
}

/**
 * Get agent runs for an organization
 */
export async function getAgentRuns(
  orgId: string,
  options?: {
    agentName?: string;
    status?: AgentRunStatusType;
    limit?: number;
    offset?: number;
  }
): Promise<{ runs: AgentRunRecord[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("agent_runs")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("started_at", { ascending: false });

  if (options?.agentName) {
    query = query.eq("agent_name", options.agentName);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 50) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get agent runs: ${error.message}`);
  }

  return {
    runs: data || [],
    total: count || 0,
  };
}

/**
 * Get agent metrics
 */
export async function getAgentMetrics(
  orgId: string,
  agentName?: string,
  days: number = 30
): Promise<{
  agentName: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgConfidence: number;
  approvalRate: number;
  autoPostRate: number;
  tokensUsed: number;
  costIncurred: number;
}[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_agent_metrics", {
    p_org_id: orgId,
    p_agent_name: agentName,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to get agent metrics: ${error.message}`);
  }

  return data || [];
}

/**
 * Submit agent feedback
 */
export async function submitAgentFeedback(data: {
  runId: string;
  orgId: string;
  userId: string;
  actionId?: string;
  feedbackType: "approve" | "reject" | "correct";
  correctionData?: any;
  notes?: string;
}): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("agent_feedback").insert({
    agent_run_id: data.runId,
    org_id: data.orgId,
    user_id: data.userId,
    action_id: data.actionId,
    feedback_type: data.feedbackType,
    correction_data: data.correctionData,
    notes: data.notes,
  });

  if (error) {
    throw new Error(`Failed to submit agent feedback: ${error.message}`);
  }
}
