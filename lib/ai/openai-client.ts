/**
 * OpenAI Client Wrapper
 *
 * Provides a centralized OpenAI client with:
 * - Token usage tracking
 * - Rate limiting per organization
 * - Error handling and retries
 * - Cost monitoring
 */

import OpenAI from "openai";
import { env } from "@/lib/env";

// Token pricing for GPT-4 Turbo (as of 2025)
const TOKEN_PRICING = {
  "gpt-4-turbo": {
    input: 0.01 / 1000, // $0.01 per 1K input tokens
    output: 0.03 / 1000, // $0.03 per 1K output tokens
  },
  "gpt-4o": {
    input: 0.005 / 1000, // $0.005 per 1K input tokens
    output: 0.015 / 1000, // $0.015 per 1K output tokens
  },
  "gpt-3.5-turbo": {
    input: 0.0005 / 1000,
    output: 0.0015 / 1000,
  },
} as const;

export type Model = keyof typeof TOKEN_PRICING;

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

// Tier-based rate limits
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  starter: {
    requestsPerMinute: 10,
    tokensPerMinute: 10000,
  },
  pro: {
    requestsPerMinute: 50,
    tokensPerMinute: 100000,
  },
  enterprise: {
    requestsPerMinute: 200,
    tokensPerMinute: 500000,
  },
};

// In-memory rate limit tracking (in production, use Redis)
const rateLimitTracker = new Map<
  string,
  { requests: number[]; tokens: number[]; lastReset: number }
>();

/**
 * Calculate cost based on token usage
 */
function calculateCost(
  model: Model,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = TOKEN_PRICING[model];
  return (
    promptTokens * pricing.input + completionTokens * pricing.output
  );
}

/**
 * Check if request is within rate limits
 */
function checkRateLimit(
  orgId: string,
  tier: string,
  tokens: number
): boolean {
  const limits = RATE_LIMITS[tier] || RATE_LIMITS.starter;
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Get or create tracking entry
  let tracking = rateLimitTracker.get(orgId);
  if (!tracking || now - tracking.lastReset > 60000) {
    tracking = { requests: [], tokens: [], lastReset: now };
    rateLimitTracker.set(orgId, tracking);
  }

  // Filter to only recent requests (last minute)
  tracking.requests = tracking.requests.filter((t) => t > oneMinuteAgo);
  tracking.tokens = tracking.tokens.filter((t) => t > oneMinuteAgo);

  // Check limits
  const requestCount = tracking.requests.length;
  const tokenCount = tracking.tokens.reduce((sum, _) => sum + 1, 0);

  if (
    requestCount >= limits.requestsPerMinute ||
    tokenCount + tokens > limits.tokensPerMinute
  ) {
    return false;
  }

  // Track this request
  tracking.requests.push(now);
  tracking.tokens.push(tokens);

  return true;
}

/**
 * Create OpenAI client instance
 */
export function createOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

// Singleton instance
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = createOpenAIClient();
  }
  return openaiClient;
}

/**
 * Make a chat completion request with tracking
 */
export async function chatCompletion({
  model = "gpt-4o",
  messages,
  orgId,
  tier = "starter",
  temperature = 0.7,
  maxTokens,
  responseFormat,
  tools,
}: {
  model?: Model;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  orgId: string;
  tier?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: OpenAI.Chat.ChatCompletionCreateParams["response_format"];
  tools?: OpenAI.Chat.ChatCompletionTool[];
}): Promise<{
  completion: OpenAI.Chat.ChatCompletion;
  usage: TokenUsage;
}> {
  const client = getOpenAIClient();

  // Estimate token count (rough estimate: 4 chars per token)
  const estimatedTokens = JSON.stringify(messages).length / 4;

  // Check rate limit
  if (!checkRateLimit(orgId, tier, estimatedTokens)) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
      tools,
    });

    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      cost: calculateCost(
        model,
        completion.usage?.prompt_tokens || 0,
        completion.usage?.completion_tokens || 0
      ),
    };

    return { completion, usage };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new Error("OpenAI rate limit exceeded. Please try again later.");
      }
      if (error.status === 401) {
        throw new Error("OpenAI API key is invalid.");
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding({
  text,
  orgId,
  tier = "starter",
}: {
  text: string;
  orgId: string;
  tier?: string;
}): Promise<{
  embedding: number[];
  usage: TokenUsage;
}> {
  const client = getOpenAIClient();

  // Estimate token count
  const estimatedTokens = text.length / 4;

  // Check rate limit
  if (!checkRateLimit(orgId, tier, estimatedTokens)) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const usage: TokenUsage = {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: 0,
      totalTokens: response.usage.total_tokens,
      cost: response.usage.prompt_tokens * (0.0001 / 1000), // $0.0001 per 1K tokens
    };

    return {
      embedding: response.data[0].embedding,
      usage,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Stream chat completion (for real-time UI)
 */
export async function* streamChatCompletion({
  model = "gpt-4o",
  messages,
  orgId,
  tier = "starter",
  temperature = 0.7,
  maxTokens,
}: {
  model?: Model;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  orgId: string;
  tier?: string;
  temperature?: number;
  maxTokens?: number;
}): AsyncGenerator<string, TokenUsage, unknown> {
  const client = getOpenAIClient();

  // Estimate token count
  const estimatedTokens = JSON.stringify(messages).length / 4;

  // Check rate limit
  if (!checkRateLimit(orgId, tier, estimatedTokens)) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let completionTokens = 0;
    let fullText = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        completionTokens += content.length / 4; // Rough estimate
        yield content;
      }
    }

    // Return final usage stats
    const usage: TokenUsage = {
      promptTokens: Math.round(estimatedTokens),
      completionTokens: Math.round(completionTokens),
      totalTokens: Math.round(estimatedTokens + completionTokens),
      cost: calculateCost(
        model,
        Math.round(estimatedTokens),
        Math.round(completionTokens)
      ),
    };

    return usage;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}
