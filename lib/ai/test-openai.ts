/**
 * OpenAI Integration Test
 *
 * Run this to verify OpenAI API key and client initialization
 * Usage: node --loader ts-node/esm lib/ai/test-openai.ts
 */

import { chatCompletion } from "./openai-client";

async function testOpenAIIntegration() {
  console.log("🧪 Testing OpenAI Integration...\n");

  try {
    // Test with a simple transaction categorization prompt
    const testTransaction = {
      description: "STARBUCKS COFFEE #12345",
      amount: -4.75,
      date: "2025-01-22",
    };

    console.log("📝 Test Transaction:");
    console.log(`   Description: ${testTransaction.description}`);
    console.log(`   Amount: $${Math.abs(testTransaction.amount).toFixed(2)}`);
    console.log(`   Date: ${testTransaction.date}\n`);

    console.log("🤖 Sending request to OpenAI...");

    const { completion, usage } = await chatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert accountant. Categorize transactions into GL accounts. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Categorize this transaction:
Description: ${testTransaction.description}
Amount: $${Math.abs(testTransaction.amount).toFixed(2)}
Date: ${testTransaction.date}

Respond with JSON in this format:
{
  "accountCode": "6100",
  "accountName": "Meals & Entertainment",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`,
        },
      ],
      orgId: "test-org-id",
      tier: "pro",
      temperature: 0.2,
      responseFormat: { type: "json_object" },
    });

    console.log("\n✅ OpenAI API Response Received!\n");

    const result = completion.choices[0]?.message?.content;
    if (result) {
      const parsed = JSON.parse(result);
      console.log("📊 Categorization Result:");
      console.log(`   Account: ${parsed.accountCode} - ${parsed.accountName}`);
      console.log(`   Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
      console.log(`   Reasoning: ${parsed.reasoning}\n`);
    }

    console.log("💰 Token Usage:");
    console.log(`   Prompt Tokens: ${usage.promptTokens}`);
    console.log(`   Completion Tokens: ${usage.completionTokens}`);
    console.log(`   Total Tokens: ${usage.totalTokens}`);
    console.log(`   Cost: $${usage.cost.toFixed(6)}\n`);

    console.log("✅ OpenAI integration test PASSED!\n");
  } catch (error) {
    console.error("\n❌ OpenAI integration test FAILED!");
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    throw error;
  }
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOpenAIIntegration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testOpenAIIntegration };
