# AI Infrastructure

This directory contains the core AI agent framework for OpportunityOS, including autonomous agents for categorization, reconciliation, and explainability.

## Overview

The AI infrastructure is built on:
- **OpenAI GPT-4o** for reasoning and decision-making
- **LangGraph** for multi-agent orchestration
- **PostgreSQL** for agent execution tracking
- **Confidence-based approval** workflows (≥0.90 = auto-approve, 0.70-0.89 = review, <0.70 = manual)

## Architecture

```
lib/ai/
├── openai-client.ts          # OpenAI SDK wrapper with rate limiting
├── agent-types.ts             # Type definitions and schemas
├── agent-base.ts              # Base agent class
├── agent-orchestrator.ts      # Multi-agent workflow orchestration
├── agent-db.ts                # Database helpers for agent tracking
└── agents/
    ├── ledger-bot.ts          # Transaction categorization agent
    ├── explain-bot.ts         # Explainability agent
    ├── recon-ai.ts            # Reconciliation agent (TODO)
    ├── insight-ai.ts          # Anomaly detection agent (TODO)
    ├── report-gen.ts          # Report generation agent (TODO)
    └── tax-ai.ts              # Tax calculation agent (TODO)
```

## Core Agents

### LedgerBot (Categorization Agent)

**Purpose:** Automatically categorize bank transactions to the correct GL account

**Features:**
- Rule-based matching (highest priority)
- Historical pattern learning
- AI-powered categorization fallback
- Confidence scoring (0.0 to 1.0)
- Auto-approve threshold: ≥0.90

**Usage:**
```typescript
import { ledgerBot } from "@/lib/ai";

const result = await ledgerBot.execute(
  {
    id: "txn-uuid",
    date: "2025-10-21",
    description: "AWS Invoice",
    amount: 150.00,
    merchantName: "Amazon Web Services",
  },
  {
    orgId: "org-uuid",
    tier: "pro",
  }
);

if (result.success && result.data) {
  console.log("Account:", result.data.accountName);
  console.log("Confidence:", result.data.confidence);
  console.log("Reasoning:", result.data.reasoning);
}
```

**Batch Processing:**
```typescript
const batchResult = await ledgerBot.categorizeBatch(
  {
    transactions: [txn1, txn2, txn3],
  },
  context
);

console.log("Auto-approved:", batchResult.data.stats.autoApproved);
console.log("Needs review:", batchResult.data.stats.needsReview);
```

### ExplainBot (Explainability Agent)

**Purpose:** Provide plain English explanations for AI actions and accounting transactions

**Features:**
- Transaction categorization explanations
- Reconciliation match explanations
- Journal entry breakdowns
- Source citations (rules, historical patterns, accounting principles)
- Related transaction suggestions

**Usage:**
```typescript
import { explainBot } from "@/lib/ai";

const explanation = await explainBot.explainCategorization(
  "transaction-uuid",
  context
);

if (explanation.success && explanation.data) {
  console.log("Summary:", explanation.data.summary);
  console.log("Details:", explanation.data.details);
  console.log("Sources:", explanation.data.sources);
}
```

**Answer Specific Questions:**
```typescript
const answer = await explainBot.answerQuestion(
  "transaction",
  "txn-uuid",
  "Why was this categorized as Software expense?",
  context
);
```

## Agent Orchestration

The `AgentOrchestrator` manages multi-agent workflows with state persistence and human-in-the-loop approval:

```typescript
import { getOrchestrator } from "@/lib/ai";

const orchestrator = getOrchestrator();

// Register agents
orchestrator.registerAgent(ledgerBot);
orchestrator.registerAgent(explainBot);

// Execute single agent
const run = await orchestrator.executeAgent(
  "LedgerBot",
  transactionInput,
  context
);

// Execute multi-agent workflow
const results = await orchestrator.executeWorkflow(
  [
    {
      agentName: "LedgerBot",
      input: () => ({ transaction }),
    },
    {
      agentName: "ExplainBot",
      input: (prev) => ({ entityId: prev.transactionId }),
    },
  ],
  context
);
```

## Database Schema

### agent_runs
Tracks agent execution:
- `id` - Run UUID
- `org_id` - Organization
- `agent_name` - Which agent ran
- `trigger` - manual | scheduled | event
- `status` - running | completed | failed | awaiting_approval
- `input` / `output` - JSONB data
- `metadata` - Tokens, cost, confidence

### agent_actions
Tracks individual agent actions:
- `id` - Action UUID
- `agent_run_id` - Parent run
- `action_type` - categorize | reconcile | post_entry | etc.
- `entity_type` / `entity_id` - What was affected
- `confidence` - 0.0 to 1.0
- `reasoning` - AI explanation
- `approved` - NULL (pending) | true | false

### agent_feedback
Tracks user feedback for learning:
- `id` - Feedback UUID
- `agent_run_id` - Parent run
- `action_id` - Optional specific action
- `feedback_type` - approve | reject | correct
- `correction_data` - If correcting, what should it have been?

## Rate Limiting

Per-organization rate limits based on subscription tier:

| Tier       | Requests/min | Tokens/min |
|------------|--------------|------------|
| Starter    | 10           | 10,000     |
| Pro        | 50           | 100,000    |
| Enterprise | 200          | 500,000    |

Limits are enforced in `openai-client.ts` with in-memory tracking (production should use Redis).

## Token Usage & Cost Tracking

All agent runs track:
- `promptTokens` - Input tokens
- `completionTokens` - Output tokens
- `totalTokens` - Sum
- `cost` - USD cost based on model pricing

Query metrics:
```typescript
import { getAgentMetrics } from "@/lib/ai";

const metrics = await getAgentMetrics("org-uuid", "LedgerBot", 30);

console.log("Total runs:", metrics[0].totalRuns);
console.log("Approval rate:", metrics[0].approvalRate);
console.log("Cost (30 days):", metrics[0].costIncurred);
```

## Confidence Thresholds

```typescript
import { CONFIDENCE_THRESHOLDS } from "@/lib/ai";

// Auto-approve if confidence ≥ 0.90
if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_APPROVE) {
  await autoPost();
}

// Review queue if 0.70 - 0.89
else if (confidence >= CONFIDENCE_THRESHOLDS.REVIEW_QUEUE) {
  await addToReviewQueue();
}

// Manual review if < 0.70
else {
  await requireManualReview();
}
```

## Categorization Rules

Rules are checked before AI inference (fast path). Priority: lower = higher.

**Seed default rules for a new org:**
```sql
SELECT seed_default_categorization_rules('org-uuid');
```

**Create custom rule:**
```sql
INSERT INTO categorization_rules (org_id, rule_type, pattern, account_id, priority)
VALUES ('org-uuid', 'merchant', 'Stripe', 'account-uuid', 10);
```

Rule types:
- `merchant` - Match merchant name (regex)
- `description` - Match transaction description (regex)
- `amount_range` - Match amount range (e.g., "100-500")

## Human-in-the-Loop

Actions requiring approval are marked `approved = NULL`:

```typescript
import { getPendingActions, approveAgentAction } from "@/lib/ai";

// Get pending actions
const pending = await getPendingActions("org-uuid", "LedgerBot");

// Approve action
await approveAgentAction(
  pending[0].id,
  "user-uuid",
  true, // approved
  "approve",
  "Looks good!"
);
```

## Error Handling

All agents return `AgentResult<T>`:

```typescript
const result = await agent.execute(input, context);

if (result.success) {
  // Handle success
  console.log("Data:", result.data);
  console.log("Confidence:", result.confidence);
} else {
  // Handle error
  console.error("Error:", result.error);
}
```

## Security

- All API keys stored in environment variables
- Row-level security on all agent tables
- Agent actions require org membership
- Approvals require admin/accountant role
- Service role key for system-level inserts only

## Performance

- In-memory rate limit tracking (use Redis in production)
- Database indexes on `org_id`, `status`, `agent_name`, `entity_type`
- Batch processing for high-volume categorization
- Lazy loading of historical patterns

## Testing

```typescript
// Mock OpenAI client in tests
vi.mock("@/lib/ai/openai-client", () => ({
  chatCompletion: vi.fn().mockResolvedValue({
    completion: mockCompletion,
    usage: { totalTokens: 100, cost: 0.001 },
  }),
}));
```

## Future Enhancements

Phase 3 deliverables in progress:
- [ ] ReconAI (reconciliation agent) - Phase 3.4
- [ ] InsightAI (anomaly detection) - Phase 3.x
- [ ] ReportGen (report generation) - Phase 3.x
- [ ] TaxAI (tax calculation) - Phase 3.x
- [ ] Vector database for similarity search (optional)
- [ ] Redis-based rate limiting
- [ ] Agent performance dashboards
- [ ] A/B testing framework
- [ ] Model fine-tuning pipeline

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Phase 3 Tasks](../../../docs/tasks.md#phase-3-ai-agents-foundation)
- [AI Agents Documentation](../../../docs/ai/intelligence/agents.md)
