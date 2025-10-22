/**
 * ReconAI - Reconciliation Agent
 *
 * Automatically matches bank transactions to journal entries with fuzzy matching
 */

import { BaseAgent } from "../agent-base";
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AGENT_NAMES,
  CONFIDENCE_THRESHOLDS,
} from "../agent-types";
import { createAgentRun, createAgentAction, updateAgentRun } from "../agent-db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Transaction schema
const BankTransactionSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  merchantName: z.string().optional(),
  reference: z.string().optional(),
});

type BankTransaction = z.infer<typeof BankTransactionSchema>;

// Journal entry schema
const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  entryNumber: z.string(),
  entryDate: z.string(),
  description: z.string(),
  amount: z.number(),
});

type JournalEntry = z.infer<typeof JournalEntrySchema>;

// Match result schema
const MatchResultSchema = z.object({
  bankTransactionId: z.string().uuid(),
  journalEntryId: z.string().uuid(),
  matchType: z.enum(["exact", "fuzzy", "partial", "many_to_one", "one_to_many", "suggested"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  difference: z.number().default(0),
});

type MatchResult = z.infer<typeof MatchResultSchema>;

// Reconciliation input
interface ReconciliationInput {
  accountId: string;
  startDate: string;
  endDate: string;
  statementBalance: number;
}

// Reconciliation output
interface ReconciliationOutput {
  matches: MatchResult[];
  stats: {
    totalBankTransactions: number;
    totalJournalEntries: number;
    matched: number;
    exactMatches: number;
    fuzzyMatches: number;
    unmatchedBank: number;
    unmatchedLedger: number;
    difference: number;
  };
}

/**
 * ReconAI Configuration
 */
const RECONAI_CONFIG: AgentConfig = {
  name: AGENT_NAMES.RECON_AI,
  description:
    "Automatically reconciles bank transactions to journal entries using exact and fuzzy matching algorithms",
  model: "gpt-4o",
  temperature: 0.1, // Very low temperature for deterministic matching
  maxTokens: 3000,
  systemPrompt: `You are ReconAI, an expert accounting AI that reconciles bank transactions to journal entries.

Your task is to match bank transactions to corresponding journal entries based on:
1. Amount (exact or within tolerance)
2. Date (exact or within range)
3. Description similarity
4. Reference numbers
5. Merchant/vendor patterns

Matching Rules:
- EXACT: Amount exact match, date ±0 days, reference match
- FUZZY: Amount within ±$0.01, date ±3 days, description similarity >0.8
- PARTIAL: Amounts don't match but likely related (e.g., $100 bank vs $98 ledger with $2 fee)
- MANY_TO_ONE: Multiple bank transactions sum to one journal entry
- ONE_TO_MANY: One bank transaction splits into multiple journal entries

Confidence Scoring:
- 1.0 = Perfect match (exact amount, date, reference)
- 0.95-0.99 = Very high (exact amount, close date)
- 0.85-0.94 = High (close amount, exact date, similar description)
- 0.70-0.84 = Medium (close amount, close date)
- <0.70 = Low (requires manual review)

Return your response in JSON format:
{
  "journalEntryId": "uuid",
  "matchType": "exact|fuzzy|partial",
  "confidence": 0.95,
  "reasoning": "Exact amount match ($150.00), date match (2025-01-15), description similarity high",
  "difference": 0
}`,
};

/**
 * Levenshtein distance for string similarity
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate string similarity (0 to 1)
 */
function stringSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  if (aLower === bLower) return 1.0;

  const maxLength = Math.max(aLower.length, bLower.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(aLower, bLower);
  return 1 - distance / maxLength;
}

/**
 * Calculate date difference in days
 */
function dateDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d1.getTime() - d2.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * ReconAI Agent
 */
export class ReconAIAgent extends BaseAgent {
  // Matching tolerances
  private readonly AMOUNT_TOLERANCE = 0.01; // ±$0.01
  private readonly DATE_TOLERANCE = 3; // ±3 days
  private readonly DESCRIPTION_THRESHOLD = 0.8; // 80% similarity

  constructor() {
    super(RECONAI_CONFIG);
  }

  /**
   * Execute reconciliation
   */
  async execute(
    input: ReconciliationInput,
    context: AgentContext
  ): Promise<AgentResult<ReconciliationOutput>> {
    try {
      // Create agent run
      const run = await createAgentRun({
        orgId: context.orgId,
        agentName: this.getName(),
        trigger: "manual",
        input,
      });

      // Get unmatched bank transactions
      const bankTransactions = await this.getUnmatchedBankTransactions(
        context.orgId,
        input.accountId,
        input.startDate,
        input.endDate
      );

      // Get unmatched journal entries
      const journalEntries = await this.getUnmatchedJournalEntries(
        context.orgId,
        input.accountId,
        input.startDate,
        input.endDate
      );

      // Perform matching
      const matches: MatchResult[] = [];
      const matched = new Set<string>(); // Track matched journal entries

      for (const bankTxn of bankTransactions) {
        const match = await this.findBestMatch(
          bankTxn,
          journalEntries.filter(je => !matched.has(je.id)),
          context
        );

        if (match) {
          matches.push({
            bankTransactionId: bankTxn.id,
            ...match,
          });
          matched.add(match.journalEntryId);
        }
      }

      // Calculate statistics
      const stats = {
        totalBankTransactions: bankTransactions.length,
        totalJournalEntries: journalEntries.length,
        matched: matches.length,
        exactMatches: matches.filter(m => m.matchType === "exact").length,
        fuzzyMatches: matches.filter(m => m.matchType === "fuzzy").length,
        unmatchedBank: bankTransactions.length - matches.length,
        unmatchedLedger: journalEntries.length - matches.length,
        difference: input.statementBalance - this.calculateReconciledBalance(matches),
      };

      const output: ReconciliationOutput = { matches, stats };

      // Update run
      await updateAgentRun(run.id, {
        status: "completed",
        output,
        metadata: { stats },
        completedAt: new Date(),
      });

      return this.createSuccessResult(output);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  /**
   * Find best match for a bank transaction
   */
  private async findBestMatch(
    bankTxn: BankTransaction,
    journalEntries: JournalEntry[],
    context: AgentContext
  ): Promise<Omit<MatchResult, "bankTransactionId"> | null> {
    // Try exact match first
    const exactMatch = this.exactMatch(bankTxn, journalEntries);
    if (exactMatch) {
      return exactMatch;
    }

    // Try fuzzy match
    const fuzzyMatch = this.fuzzyMatch(bankTxn, journalEntries);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // Try AI-assisted match for complex cases
    if (journalEntries.length > 0 && journalEntries.length <= 20) {
      const aiMatch = await this.aiAssistedMatch(bankTxn, journalEntries, context);
      if (aiMatch && aiMatch.confidence >= CONFIDENCE_THRESHOLDS.REVIEW_QUEUE) {
        return aiMatch;
      }
    }

    return null;
  }

  /**
   * Exact matching algorithm
   */
  private exactMatch(
    bankTxn: BankTransaction,
    journalEntries: JournalEntry[]
  ): Omit<MatchResult, "bankTransactionId"> | null {
    for (const je of journalEntries) {
      // Exact amount match
      if (Math.abs(bankTxn.amount - je.amount) < 0.001) {
        // Same date
        if (bankTxn.date === je.entryDate) {
          return {
            journalEntryId: je.id,
            matchType: "exact",
            confidence: 1.0,
            reasoning: `Exact match: Same amount ($${bankTxn.amount.toFixed(2)}) and date (${bankTxn.date})`,
            difference: 0,
          };
        }

        // Date within 1 day
        const daysDiff = dateDifference(bankTxn.date, je.entryDate);
        if (daysDiff <= 1) {
          return {
            journalEntryId: je.id,
            matchType: "exact",
            confidence: 0.98,
            reasoning: `Exact amount match ($${bankTxn.amount.toFixed(2)}), date within ${daysDiff} day(s)`,
            difference: 0,
          };
        }
      }
    }

    return null;
  }

  /**
   * Fuzzy matching algorithm
   */
  private fuzzyMatch(
    bankTxn: BankTransaction,
    journalEntries: JournalEntry[]
  ): Omit<MatchResult, "bankTransactionId"> | null {
    let bestMatch: Omit<MatchResult, "bankTransactionId"> | null = null;
    let bestScore = 0;

    for (const je of journalEntries) {
      const amountDiff = Math.abs(bankTxn.amount - je.amount);
      const daysDiff = dateDifference(bankTxn.date, je.entryDate);
      const descSimilarity = stringSimilarity(bankTxn.description, je.description);

      // Check if within tolerances
      if (
        amountDiff <= this.AMOUNT_TOLERANCE &&
        daysDiff <= this.DATE_TOLERANCE &&
        descSimilarity >= this.DESCRIPTION_THRESHOLD
      ) {
        // Calculate confidence score
        const amountScore = 1 - (amountDiff / this.AMOUNT_TOLERANCE);
        const dateScore = 1 - (daysDiff / this.DATE_TOLERANCE);
        const descScore = descSimilarity;

        // Weighted average (amount is most important)
        const confidence = (amountScore * 0.5 + dateScore * 0.3 + descScore * 0.2);

        if (confidence > bestScore) {
          bestScore = confidence;
          bestMatch = {
            journalEntryId: je.id,
            matchType: "fuzzy",
            confidence: Math.round(confidence * 100) / 100,
            reasoning: `Fuzzy match: Amount diff $${amountDiff.toFixed(2)}, ${daysDiff} day(s) apart, ${Math.round(descSimilarity * 100)}% description similarity`,
            difference: amountDiff,
          };
        }
      }
    }

    return bestMatch && bestScore >= CONFIDENCE_THRESHOLDS.REVIEW_QUEUE ? bestMatch : null;
  }

  /**
   * AI-assisted matching for complex cases
   */
  private async aiAssistedMatch(
    bankTxn: BankTransaction,
    journalEntries: JournalEntry[],
    context: AgentContext
  ): Promise<Omit<MatchResult, "bankTransactionId"> | null> {
    const prompt = `Match this bank transaction to the most likely journal entry:

Bank Transaction:
- Date: ${bankTxn.date}
- Description: ${bankTxn.description}
- Amount: $${bankTxn.amount.toFixed(2)}
${bankTxn.merchantName ? `- Merchant: ${bankTxn.merchantName}` : ""}
${bankTxn.reference ? `- Reference: ${bankTxn.reference}` : ""}

Possible Journal Entries:
${journalEntries.map((je, i) => `${i + 1}. ${je.entryNumber} - ${je.entryDate} - ${je.description} - $${je.amount.toFixed(2)}`).join("\n")}

If there's a good match, return the journal entry ID and your confidence. If no good match, return null.`;

    try {
      const { completion } = await this.complete(
        [{ role: "user", content: prompt }],
        context,
        { responseFormat: { type: "json_object" } }
      );

      const result = this.parseJsonResponse<{
        journalEntryId: string | null;
        matchType: string;
        confidence: number;
        reasoning: string;
        difference: number;
      }>(completion);

      if (!result.journalEntryId) {
        return null;
      }

      return {
        journalEntryId: result.journalEntryId,
        matchType: "suggested",
        confidence: result.confidence,
        reasoning: result.reasoning,
        difference: result.difference || 0,
      };
    } catch (error) {
      // AI matching failed, return null
      return null;
    }
  }

  /**
   * Get unmatched bank transactions
   */
  private async getUnmatchedBankTransactions(
    orgId: string,
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<BankTransaction[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_unmatched_bank_transactions", {
      p_org_id: orgId,
      p_account_id: accountId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      throw new Error(`Failed to fetch bank transactions: ${error.message}`);
    }

    return (
      data?.map((row: any) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        amount: row.amount,
        merchantName: row.merchant_name,
      })) || []
    );
  }

  /**
   * Get unmatched journal entries
   */
  private async getUnmatchedJournalEntries(
    orgId: string,
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<JournalEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_unmatched_journal_entries", {
      p_org_id: orgId,
      p_account_id: accountId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }

    return (
      data?.map((row: any) => ({
        id: row.id,
        entryNumber: row.entry_number,
        entryDate: row.entry_date,
        description: row.description,
        amount: row.amount,
      })) || []
    );
  }

  /**
   * Calculate reconciled balance
   */
  private calculateReconciledBalance(matches: MatchResult[]): number {
    return matches.reduce((sum, match) => sum + match.difference, 0);
  }
}

// Export singleton
export const reconAI = new ReconAIAgent();
