/**
 * Agent Feedback Actions
 *
 * Server actions for collecting and managing user feedback on AI agent actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Input schemas
const ThumbsFeedbackSchema = z.object({
  agentRunId: z.string().uuid().optional(),
  agentActionId: z.string().uuid().optional(),
  agentType: z.string(),
  feedbackType: z.enum(["thumbs_up", "thumbs_down"]),
  wasHelpful: z.boolean(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  orgId: z.string().uuid(),
});

const CorrectionFeedbackSchema = z.object({
  agentRunId: z.string().uuid().optional(),
  agentActionId: z.string().uuid().optional(),
  agentType: z.string(),
  originalSuggestion: z.record(z.string(), z.any()),
  userCorrection: z.record(z.string(), z.any()),
  correctionReason: z.string().optional(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  orgId: z.string().uuid(),
});

const CommentFeedbackSchema = z.object({
  agentRunId: z.string().uuid().optional(),
  agentActionId: z.string().uuid().optional(),
  agentType: z.string(),
  comment: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  orgId: z.string().uuid(),
});

export type ThumbsFeedback = z.infer<typeof ThumbsFeedbackSchema>;
export type CorrectionFeedback = z.infer<typeof CorrectionFeedbackSchema>;
export type CommentFeedback = z.infer<typeof CommentFeedbackSchema>;

/**
 * Submit thumbs up/down feedback
 */
export async function submitThumbsFeedback(
  input: ThumbsFeedback
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = ThumbsFeedbackSchema.parse(input);
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase.from("agent_feedback").insert({
      org_id: validated.orgId,
      user_id: user.id,
      agent_run_id: validated.agentRunId,
      agent_action_id: validated.agentActionId,
      agent_type: validated.agentType,
      feedback_type: validated.feedbackType,
      was_helpful: validated.wasHelpful,
      entity_type: validated.entityType,
      entity_id: validated.entityId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Submit Thumbs Feedback] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Submit Thumbs Feedback] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Submit correction feedback (when user corrects AI suggestion)
 */
export async function submitCorrectionFeedback(
  input: CorrectionFeedback
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = CorrectionFeedbackSchema.parse(input);
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase.from("agent_feedback").insert({
      org_id: validated.orgId,
      user_id: user.id,
      agent_run_id: validated.agentRunId,
      agent_action_id: validated.agentActionId,
      agent_type: validated.agentType,
      feedback_type: "correction",
      original_suggestion: validated.originalSuggestion,
      user_correction: validated.userCorrection,
      correction_reason: validated.correctionReason,
      entity_type: validated.entityType,
      entity_id: validated.entityId,
      was_helpful: false, // Correction implies AI was not helpful
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Submit Correction Feedback] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Submit Correction Feedback] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Submit comment feedback
 */
export async function submitCommentFeedback(
  input: CommentFeedback
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = CommentFeedbackSchema.parse(input);
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase.from("agent_feedback").insert({
      org_id: validated.orgId,
      user_id: user.id,
      agent_run_id: validated.agentRunId,
      agent_action_id: validated.agentActionId,
      agent_type: validated.agentType,
      feedback_type: "comment",
      comment: validated.comment,
      rating: validated.rating,
      entity_type: validated.entityType,
      entity_id: validated.entityId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Submit Comment Feedback] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Submit Comment Feedback] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get feedback analytics for an organization
 */
export async function getFeedbackAnalytics(
  orgId: string,
  agentType?: string
): Promise<{
  success: boolean;
  data?: {
    total: number;
    thumbsUp: number;
    thumbsDown: number;
    corrections: number;
    comments: number;
    avgRating?: number;
    helpfulPercentage?: number;
    byAgentType: Record<
      string,
      {
        total: number;
        helpful: number;
        notHelpful: number;
        corrections: number;
      }
    >;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("agent_feedback")
      .select("*")
      .eq("org_id", orgId);

    if (agentType) {
      query = query.eq("agent_type", agentType);
    }

    const { data: feedback, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    if (!feedback || feedback.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          thumbsUp: 0,
          thumbsDown: 0,
          corrections: 0,
          comments: 0,
          byAgentType: {},
        },
      };
    }

    const total = feedback.length;
    const thumbsUp = feedback.filter(
      (f) => f.feedback_type === "thumbs_up"
    ).length;
    const thumbsDown = feedback.filter(
      (f) => f.feedback_type === "thumbs_down"
    ).length;
    const corrections = feedback.filter(
      (f) => f.feedback_type === "correction"
    ).length;
    const comments = feedback.filter(
      (f) => f.feedback_type === "comment"
    ).length;

    const ratingsWithValue = feedback.filter((f) => f.rating !== null);
    const avgRating =
      ratingsWithValue.length > 0
        ? ratingsWithValue.reduce((sum, f) => sum + (f.rating || 0), 0) /
          ratingsWithValue.length
        : undefined;

    const helpfulFeedback = feedback.filter((f) => f.was_helpful !== null);
    const helpfulPercentage =
      helpfulFeedback.length > 0
        ? (helpfulFeedback.filter((f) => f.was_helpful === true).length /
            helpfulFeedback.length) *
          100
        : undefined;

    // Group by agent type
    const byAgentType: Record<
      string,
      {
        total: number;
        helpful: number;
        notHelpful: number;
        corrections: number;
      }
    > = {};

    feedback.forEach((f) => {
      if (!byAgentType[f.agent_type]) {
        byAgentType[f.agent_type] = {
          total: 0,
          helpful: 0,
          notHelpful: 0,
          corrections: 0,
        };
      }

      byAgentType[f.agent_type].total++;

      if (f.was_helpful === true) {
        byAgentType[f.agent_type].helpful++;
      } else if (f.was_helpful === false) {
        byAgentType[f.agent_type].notHelpful++;
      }

      if (f.feedback_type === "correction") {
        byAgentType[f.agent_type].corrections++;
      }
    });

    return {
      success: true,
      data: {
        total,
        thumbsUp,
        thumbsDown,
        corrections,
        comments,
        avgRating,
        helpfulPercentage,
        byAgentType,
      },
    };
  } catch (error) {
    console.error("[Get Feedback Analytics] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get feedback for a specific agent run
 */
export async function getAgentRunFeedback(agentRunId: string): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    feedbackType: string;
    wasHelpful?: boolean;
    rating?: number;
    comment?: string;
    originalSuggestion?: Record<string, any>;
    userCorrection?: Record<string, any>;
    correctionReason?: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: feedback, error } = await supabase
      .from("agent_feedback")
      .select("*")
      .eq("agent_run_id", agentRunId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const formattedFeedback = (feedback || []).map((f) => ({
      id: f.id,
      feedbackType: f.feedback_type,
      wasHelpful: f.was_helpful,
      rating: f.rating,
      comment: f.comment,
      originalSuggestion: f.original_suggestion,
      userCorrection: f.user_correction,
      correctionReason: f.correction_reason,
      createdAt: f.created_at,
    }));

    return {
      success: true,
      data: formattedFeedback,
    };
  } catch (error) {
    console.error("[Get Agent Run Feedback] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
