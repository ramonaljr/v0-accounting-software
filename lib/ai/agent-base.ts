/**
 * Agent Base Class
 *
 * Provides common functionality for all AI agents
 */

import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentState,
  CONFIDENCE_THRESHOLDS,
} from "./agent-types";
import { chatCompletion } from "./openai-client";
import OpenAI from "openai";

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Execute the agent with the given input and context
   */
  abstract execute(input: any, context: AgentContext): Promise<AgentResult>;

  /**
   * Get the system prompt for this agent
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  /**
   * Make a chat completion request
   */
  protected async complete(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    context: AgentContext,
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: OpenAI.Chat.ChatCompletionCreateParams["response_format"];
    }
  ): Promise<{
    completion: OpenAI.Chat.ChatCompletion;
    tokensUsed: number;
    cost: number;
  }> {
    const { completion, usage } = await chatCompletion({
      model: this.config.model,
      messages: [
        { role: "system", content: this.getSystemPrompt() },
        ...messages,
      ],
      orgId: context.orgId,
      tier: context.tier,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      responseFormat: options?.responseFormat,
    });

    return {
      completion,
      tokensUsed: usage.totalTokens,
      cost: usage.cost,
    };
  }

  /**
   * Parse JSON response from completion
   */
  protected parseJsonResponse<T>(completion: OpenAI.Chat.ChatCompletion): T {
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in completion");
    }

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${content}`);
    }
  }

  /**
   * Determine if action should be auto-approved based on confidence
   */
  protected shouldAutoApprove(confidence: number): boolean {
    return confidence >= CONFIDENCE_THRESHOLDS.AUTO_APPROVE;
  }

  /**
   * Determine if action should go to review queue
   */
  protected shouldReview(confidence: number): boolean {
    return (
      confidence >= CONFIDENCE_THRESHOLDS.REVIEW_QUEUE &&
      confidence < CONFIDENCE_THRESHOLDS.AUTO_APPROVE
    );
  }

  /**
   * Format error for user display
   */
  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return "An unknown error occurred";
  }

  /**
   * Create a success result
   */
  protected createSuccessResult<T>(
    data: T,
    confidence?: number,
    reasoning?: string
  ): AgentResult<T> {
    const requiresApproval = confidence
      ? !this.shouldAutoApprove(confidence)
      : false;

    return {
      success: true,
      data,
      confidence,
      reasoning,
      requiresApproval,
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(error: unknown): AgentResult {
    return {
      success: false,
      error: this.formatError(error),
    };
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get agent description
   */
  getDescription(): string {
    return this.config.description;
  }
}
